import type { AnyRelations } from "drizzle-orm";
import { channel } from "node:diagnostics_channel";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { FunctionKind } from "../client/reference";
import type { JsonValue } from "../schema/fields";
import type { DatabaseConnection } from "./database/connection";
import type { ActionContext, ExecutableFunction, FunctionContext } from "./functions/definition";
import { isRegisteredFunction } from "./functions/definition";
import { executeDatabaseFunction, FunctionValidationError } from "./functions/execution";

export interface FunctionCall {
  readonly name: string;
  readonly kind: FunctionKind;
  readonly version: string;
  readonly args: JsonValue;
}
/** Supplied by the trusted transport after verification, never taken from function arguments. */
export interface InvocationIdentity {
  readonly issuer: string;
  readonly subject: string;
  readonly tenantId?: string;
}
export interface FunctionAuthorization {
  readonly name: string;
  readonly kind: FunctionKind;
  readonly requestId: string;
  readonly identity: InvocationIdentity | null;
  readonly db?: NodePgDatabase;
}
export type RuntimeFunction =
  | ExecutableFunction<"query" | "mutation", FunctionContext>
  | ExecutableFunction<"action", ActionContext>;
export interface DispatcherOptions<Relations extends AnyRelations> {
  readonly connection: DatabaseConnection<Relations>;
  readonly version: string;
  readonly functions: Readonly<Record<string, RuntimeFunction>>;
  readonly authorize: (context: FunctionAuthorization) => Promise<void>;
}
const messages = {
  NOT_FOUND: "Function not found",
  VERSION_MISMATCH: "Function version does not match this deployment",
  INVALID_ARGUMENTS: "Invalid function arguments",
  FORBIDDEN: "Function access denied",
  CANCELLED: "Function call cancelled",
  INTERNAL: "Function execution failed",
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
  async function dispatch(
    input: FunctionCall,
    verifiedIdentity: InvocationIdentity | null,
    internal: boolean,
    signal: AbortSignal = new AbortController().signal,
  ): Promise<DispatchResponse> {
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
      const definition = functions.get(call.name);
      if (!definition || definition.kind !== call.kind || (!internal && definition.visibility !== "public"))
        return failure("NOT_FOUND");
      functionName = call.name;
      if (call.version !== version) return failure("VERSION_MISMATCH");
      const authorization = { name: call.name, kind: call.kind, requestId, identity };
      let value: JsonValue;
      if (definition.kind === "action") {
        const invoke = await definition.prepare(call.args);
        await authorize(authorization);
        signal.throwIfAborted();
        value = await invoke(Object.freeze({ requestId, signal }));
      } else {
        value = await executeDatabaseFunction(connection, definition, call.args, {
          signal,
          authorize: (context) => authorize({ ...authorization, db: context.db }),
        });
      }
      return { ok: true, requestId, value };
    } catch (cause) {
      if (cause instanceof FunctionAccessDenied) return failure("FORBIDDEN");
      if (cause instanceof FunctionValidationError && cause.phase === "arguments") return failure("INVALID_ARGUMENTS");
      if (signal.aborted) return failure("CANCELLED");
      return failure("INTERNAL");
    }
  }
  return Object.freeze({
    public: (call: FunctionCall, identity: InvocationIdentity | null, signal?: AbortSignal) =>
      dispatch(call, identity, false, signal),
    internal: (call: FunctionCall, identity: InvocationIdentity | null, signal?: AbortSignal) =>
      dispatch(call, identity, true, signal),
  });
}
