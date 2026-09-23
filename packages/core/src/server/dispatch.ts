import type { AnyRelations } from "drizzle-orm";
import { channel } from "node:diagnostics_channel";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FunctionKind } from "../client/reference";
import type { JsonValue } from "../schema/fields";
import type { DatabaseConnection } from "./database/connection";
import type { RuntimeFunction } from "./functions/definition";
import { isRegisteredFunction } from "./functions/definition";
import { evaluateDatabaseQuery, executeDatabaseFunction, FunctionValidationError } from "./functions/execution";
import type { RevisionReader, TableRevisions } from "./realtime/revisions";
import { IdempotencyError, prepareMutationReplay, validateIdempotencyOptions } from "./idempotency";
import type { IdempotencyOptions } from "./idempotency";
import { captureJobInvocation } from "./auth/context";
import type { InvocationIdentity, JobInvocation } from "./auth/context";

import type { SchedulerBackend } from "./jobs/scheduler";

export interface FunctionCall {
  readonly name: string;
  readonly kind: FunctionKind;
  readonly version: string;
  readonly args: JsonValue;
  readonly idempotencyKey?: string;
}
export interface FunctionAuthorization {
  readonly name: string;
  readonly kind: FunctionKind;
  readonly requestId: string;
  readonly identity: InvocationIdentity | null;
  readonly job?: JobInvocation | undefined;
  readonly db?: NodePgDatabase;
}
export type { RuntimeFunction } from "./functions/definition";
export interface DispatcherOptions<Relations extends AnyRelations> {
  readonly connection: DatabaseConnection<Relations>;
  readonly version: string;
  readonly functions: Readonly<Record<string, RuntimeFunction>>;
  readonly authorize: (context: FunctionAuthorization) => Promise<void>;
  readonly idempotency?: IdempotencyOptions;
  readonly scheduler?: SchedulerBackend;
  /** Generation-specific tracked application and authorization tables. Omit to disable subscriptions. */
  readonly revisions?: RevisionReader;
}
const messages = {
  NOT_FOUND: "Function not found",
  VERSION_MISMATCH: "Function version does not match this deployment",
  INVALID_ARGUMENTS: "Invalid function arguments",
  FORBIDDEN: "Function access denied",
  CANCELLED: "Function call cancelled",
  INTERNAL: "Function execution failed",
  INVALID_IDEMPOTENCY_KEY: "Mutation requires a valid idempotency key",
  IDEMPOTENCY_CONFLICT: "Idempotency key was already used with different arguments",
  IDEMPOTENCY_EXPIRED: "Mutation replay window has expired",
} as const;
export type DispatchResponse =
  | { readonly ok: true; readonly requestId: string; readonly value: JsonValue }
  | {
      readonly ok: false;
      readonly requestId: string;
      readonly error: { readonly code: keyof typeof messages; readonly message: string };
    };
export class FunctionAccessDenied extends Error {
  constructor() {
    super(messages.FORBIDDEN);
  }
}
export type EvaluationResponse =
  | Extract<DispatchResponse, { readonly ok: false }>
  | { readonly ok: true; readonly requestId: string; readonly value: JsonValue; readonly revisions: TableRevisions };
const failures = channel("loom.function.failure");

export function createDispatcher<Relations extends AnyRelations>(options: DispatcherOptions<Relations>) {
  if (!/^[a-f0-9]{64}$/.test(options.version)) throw new Error("Invalid function registry version");
  const functions = new Map(Object.entries(options.functions));
  for (const [name, definition] of functions) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9_/-]*:[a-zA-Z][a-zA-Z0-9_]*$/.test(name) || !isRegisteredFunction(definition))
      throw new Error("Invalid function registry entry");
  }
  const version = options.version;
  const authorize = options.authorize;
  const connection = options.connection;
  const revisions = options.revisions;
  const scheduler = options.scheduler;
  const idempotency = options.idempotency ? Object.freeze({ ...options.idempotency }) : undefined;
  if (idempotency) validateIdempotencyOptions(idempotency);
  if (!idempotency && [...functions.values()].some((definition) => definition.kind === "mutation"))
    throw new Error("Mutation dispatch requires idempotency configuration");
  async function dispatch(
    input: FunctionCall,
    verifiedIdentity: InvocationIdentity | null,
    mode: "public" | "internal" | "subscription",
    signal: AbortSignal = new AbortController().signal,
    jobInvocation?: JobInvocation,
  ): Promise<DispatchResponse | EvaluationResponse> {
    const requestId = crypto.randomUUID();
    let functionName: string | undefined;
    function failure(code: keyof typeof messages): DispatchResponse {
      failures.publish({ requestId, functionName, version, code });
      return { ok: false, requestId, error: { code, message: messages[code] } };
    }
    try {
      signal.throwIfAborted();
      const call = structuredClone(input);
      const identity = verifiedIdentity ? Object.freeze(structuredClone(verifiedIdentity)) : null;
      const job = captureJobInvocation(jobInvocation);
      const definition = functions.get(call.name);
      if (!definition || definition.kind !== call.kind || (mode !== "internal" && definition.visibility !== "public"))
        return failure("NOT_FOUND");
      if (mode === "subscription" && (definition.kind !== "query" || !revisions)) return failure("NOT_FOUND");
      functionName = call.name;
      if (call.version !== version) return failure("VERSION_MISMATCH");
      const authorization = { name: call.name, kind: call.kind, requestId, identity, job };
      if (mode === "subscription" && definition.kind === "query" && revisions) {
        const snapshot = await evaluateDatabaseQuery(connection, definition, call.args, revisions, {
          signal,
          identity,
          requestId,
          authorize: (context) => authorize({ ...authorization, db: context.db }),
        });
        return { ok: true, requestId, ...snapshot };
      }
      let value: JsonValue;
      if (definition.kind === "action") {
        const invoke = await definition.prepare(call.args);
        await authorize(authorization);
        signal.throwIfAborted();
        value = await invoke(Object.freeze({ identity, requestId, signal, job }));
      } else {
        const replay =
          definition.kind === "mutation" && idempotency
            ? prepareMutationReplay(
                idempotency,
                [identity ? [identity.issuer, identity.subject, identity.tenantId ?? null] : null, call.name, version],
                call.idempotencyKey,
                call.args,
              )
            : undefined;
        value = await executeDatabaseFunction(connection, definition, call.args, {
          signal,
          identity,
          requestId,
          replay,
          job,
          scheduler,
          authorize: (context) => authorize({ ...authorization, db: context.db }),
        });
      }
      return { ok: true, requestId, value };
    } catch (cause) {
      if (cause instanceof FunctionAccessDenied) return failure("FORBIDDEN");
      if (cause instanceof IdempotencyError) return failure(cause.code);
      if (cause instanceof FunctionValidationError && cause.phase === "arguments") return failure("INVALID_ARGUMENTS");
      if (signal.aborted) return failure("CANCELLED");
      return failure("INTERNAL");
    }
  }
  return Object.freeze({
    public: (
      call: FunctionCall,
      identity: InvocationIdentity | null,
      signal?: AbortSignal,
    ): Promise<DispatchResponse> => dispatch(call, identity, "public", signal),
    internal: (
      call: FunctionCall,
      identity: InvocationIdentity | null,
      signal?: AbortSignal,
      job?: JobInvocation,
    ): Promise<DispatchResponse> => dispatch(call, identity, "internal", signal, job),
    async evaluate(
      call: FunctionCall,
      identity: InvocationIdentity | null,
      signal?: AbortSignal,
    ): Promise<EvaluationResponse> {
      const response = await dispatch(call, identity, "subscription", signal);
      if (!response.ok || "revisions" in response) return response;
      throw new Error("Query evaluation did not capture revisions");
    },
  });
}
