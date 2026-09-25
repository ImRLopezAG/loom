import "@orpc/experimental-effect/extensions/effect";
import { AsyncLocalStorage } from "node:async_hooks";
import { channel } from "node:diagnostics_channel";
import type { ErrorMap } from "@orpc/server";
import { defineMeta, os, ORPCError, ValidationError } from "@orpc/server";
import { reconcileORPCError } from "@orpc/contract";
import type { WithEffectContext } from "@orpc/experimental-effect";
import { Cause, Context, Effect } from "effect";
import type { SchemaDefinition } from "../../schema/define-schema";
import type { InvocationContext } from "../auth/context";
import type { Invocation } from "../effect/runtime";
import { Diagnostics } from "../effect/runtime";
import { publishRuntimeMetric } from "../observability";
import { serializeRpcValue, rpcValue } from "./serialization";
import * as v from "valibot";
import type { Id } from "../../schema/fields";
import { IdempotencyError } from "../idempotency";
import { TransactionConflictError } from "../transactions";
import { RpcReplayVersionError } from "./replay";
import { createProjectServices, Storage } from "../effect/services";
import { invocationStorage } from "../storage/invocation";
import type { AnyRelations } from "drizzle-orm";

export type ClientMode = "finite" | "live" | "mutation";
export const [clientMode, getClientMode] = defineMeta("loom.clientMode", (incoming: ClientMode) => incoming);

export interface ProcedureContext extends InvocationContext, WithEffectContext<Invocation> {
  /** Untrusted client intent; never authentication or authorization evidence. */
  readonly operation?: "query" | "infinite" | "streamed" | "live" | "mutation" | "call";
  readonly idempotencyKey?: string;
  readonly expiresAt?: number;
}

const failures = channel("loom.procedure.failure");
const observation = new AsyncLocalStorage<boolean>();

async function publicError(cause: unknown, errorMap: ErrorMap) {
  if (cause instanceof RpcReplayVersionError)
    return new ORPCError("RPC_VERSION_MISMATCH", { message: "RPC replay protocol mismatch" });
  if (cause instanceof IdempotencyError) return new ORPCError(cause.code, { message: cause.code });
  if (cause instanceof TransactionConflictError) return new ORPCError("CONFLICT", { message: "Transaction conflict" });
  if (cause instanceof ORPCError) {
    if (cause.cause instanceof ValidationError && cause.code === "BAD_REQUEST")
      return new ORPCError("BAD_REQUEST", { message: "Invalid input" });
    const declared = await reconcileORPCError(errorMap, cause);
    if (declared.defined) return declared;
  }
  return new ORPCError("INTERNAL_SERVER_ERROR", { message: "Internal server error" });
}

export const rpcErrorBoundary = os.$context<ProcedureContext>().middleware(({ next, procedure, context }) => {
  const report = !observation.getStore();
  return observation.run(true, async () => {
    const started = performance.now();
    let status: "success" | "error" = "success";
    try {
      const result = await next();
      serializeRpcValue(v.parse(rpcValue, result.output));
      return result;
    } catch (cause) {
      status = "error";
      const error = await publicError(cause, procedure["~orpc"].errorMap);
      if (report) failures.publish({ requestId: context.requestId, code: error.code });
      throw error;
    } finally {
      if (report)
        publishRuntimeMetric({
          type: "rpc.procedure",
          mode: getClientMode(procedure) ?? "mutation",
          status,
          durationMs: performance.now() - started,
        });
    }
  });
});

/** Generated bindings configure this native builder once per project. Database
 * capabilities are supplied separately by transaction middleware. */
export function createProjectProcedures<
  Schema extends SchemaDefinition & {
    readonly validators: object;
    readonly id: (table: never) => v.GenericSchema<string, Id<string>>;
  },
>(schema: Schema) {
  const bindings: ProjectBindings<Schema> = Object.freeze({
    tables: schema.tables,
    validators: Object.freeze({ tables: schema.validators, id: schema.id }),
  });
  const { Tables, Validators } = createProjectServices<Schema, AnyRelations>();
  const procedure = os
    .$context<ProcedureContext>()
    .errors({
      RPC_VERSION_MISMATCH: {},
      INVALID_IDEMPOTENCY_KEY: {},
      IDEMPOTENCY_CONFLICT: {},
      IDEMPOTENCY_EXPIRED: {},
      CONFLICT: {},
      UNAUTHORIZED: {},
      FORBIDDEN: {},
      STORAGE_UNAVAILABLE: {},
    })
    .meta(clientMode("mutation"))
    .use(rpcErrorBoundary)
    .use(({ next, context }) =>
      next({
        context: {
          ...bindings,
          storage: invocationStorage(),
          "effect/wrap": redactDefects,
          "effect/context": context["effect/context"].pipe(
            Context.add(Tables, schema.tables),
            Context.add(Validators, schema.validators),
            Context.add(Diagnostics, publishRuntimeMetric),
            Context.add(Storage, invocationStorage()),
          ),
        },
      }),
    );
  return Object.freeze({ procedure, ...bindings });
}

interface ProjectBindings<
  Schema extends SchemaDefinition & {
    readonly validators: object;
    readonly id: (table: never) => v.GenericSchema<string, Id<string>>;
  },
> {
  readonly tables: Schema["tables"];
  readonly validators: { readonly tables: Schema["validators"]; readonly id: Schema["id"] };
}

function redactDefects<A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> {
  return Effect.catchCause(effect, (cause) =>
    Cause.hasDies(cause) ? Effect.die(new Error("Procedure defect")) : Effect.failCause(cause),
  );
}
