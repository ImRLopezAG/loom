import { AsyncLocalStorage } from "node:async_hooks";
import { defineMeta, os, Procedure } from "@orpc/server";
import type { AnySchema, ErrorMap, Middleware } from "@orpc/server";
import type { AnyRelations } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import { Context } from "effect";
import type { DatabaseConnection } from "../database/connection";
import { captureInvocationGuard } from "../database/connection";
import { assertDatabaseRelations } from "../database/context";
import { bindDatabaseIdentity } from "../auth/context";
import { runFunctionTransaction } from "../transactions";
import type { IdempotencyOptions } from "../idempotency";
import { validateIdempotencyOptions } from "../idempotency";
import { getClientMode, rpcErrorBoundary } from "./procedure";
import type { ProcedureContext } from "./procedure";
import { rpcValue, serializeRpcValue } from "./serialization";
import type { RpcValue } from "./serialization";
import { prepareRpcReplay } from "./replay";
import type { SchemaDefinition } from "../../schema/define-schema";
import { isNativeRelations, validateSchemaRelations } from "../database/relations";
import { createProjectServices } from "../effect/services";

export type DatabasePolicy = "read" | "write";
const [databasePolicy, getDatabasePolicy] = defineMeta("loom.databasePolicy", (incoming: DatabasePolicy) => incoming);
export { getDatabasePolicy };
interface ActiveDatabase {
  readonly db: NodePgDatabase;
  readonly policy: DatabasePolicy;
  readonly invocation: symbol;
  readonly requestId: string;
  readonly connection: object;
  readonly identity: ProcedureContext["identity"];
  readonly assertCurrent: () => void;
  active: boolean;
  failure?: Error;
}
const currentDatabase = new AsyncLocalStorage<ActiveDatabase>();

/** A reusable native middleware capability. Runtime binding owns its transaction. */
export function createDatabaseMiddleware<
  Relations extends AnyRelations,
  Schema extends SchemaDefinition & { readonly validators: object },
>(relations: Relations, policy: DatabasePolicy, schema: Schema) {
  if (!isNativeRelations(relations)) throw new Error("Expected native Drizzle relations");
  validateSchemaRelations(schema, relations);
  const { Database, Tables, Validators } = createProjectServices<Schema, Relations>();
  return os
    .$context<ProcedureContext>()
    .meta(databasePolicy(policy))
    .middleware(({ next, context }) => {
      const current = currentDatabase.getStore();
      if (!current?.active) throw new Error("Database procedure has no active invocation");
      current.assertCurrent();
      if (current.policy === "read" && policy === "write")
        throw new Error("Read-only invocation cannot acquire write authority");
      assertDatabaseRelations(current.db, relations);
      // SAFETY: the guarded transaction verifies the exact project relations above.
      const db = current.db as NodePgDatabase<Relations>;
      return next({
        context: {
          db,
          "effect/context": context["effect/context"].pipe(
            Context.add(Database, db),
            Context.add(Tables, schema.tables),
            Context.add(Validators, schema.validators),
          ),
        },
      });
    });
}

export interface RpcDatabaseOptions<Relations extends AnyRelations> {
  readonly connection: DatabaseConnection<Relations>;
  readonly replay: IdempotencyOptions;
  readonly authorize: (
    context: ProcedureContext & {
      readonly db: NodePgDatabase<Relations>;
      readonly path: readonly string[];
      readonly input: RpcValue;
    },
  ) => Promise<void>;
}

/** Bind a native procedure without changing its input/output types. All input
 * schemas run once before acquisition; original output stages remain inside the
 * transaction. Middleware receives fully validated input in the bound graph. */
export function bindRpcDatabaseProcedure<
  Initial extends ProcedureContext,
  Injected extends object,
  Input extends AnySchema,
  Output extends AnySchema,
  Errors extends ErrorMap,
  Relations extends AnyRelations,
>(
  procedure: Procedure<Initial, Injected, Input, Output, Errors>,
  options: RpcDatabaseOptions<Relations>,
): Procedure<Initial, Injected, Input, Output, Errors> {
  const policy = getDatabasePolicy(procedure);
  if (!policy) throw new Error("Database policy required");
  if (getClientMode(procedure) === "live" && policy !== "read")
    throw new Error("Live procedures require database-read authority");
  validateIdempotencyOptions(options.replay);
  const definition = procedure["~orpc"];
  if (definition.disableInputValidation || definition.disableOutputValidation)
    throw new Error("Database procedures require runtime validation");
  const errorIndex = definition.orderedMiddlewares.findIndex((entry) => entry.middleware === rpcErrorBoundary);
  const first = definition.orderedMiddlewares[errorIndex];
  if (!first) throw new Error("Expected a project-bound procedure");

  const boundary: Middleware<ProcedureContext, object, RpcValue, RpcValue, Record<never, never>> = async (
    { context, path, next, signal: callerSignal },
    input,
  ) => {
    const args = v.parse(rpcValue, input);
    const signal = callerSignal ? AbortSignal.any([context.signal, callerSignal]) : context.signal;
    signal.throwIfAborted();
    const parent = currentDatabase.getStore();
    const run = async () => {
      const result = await next({ context: { signal } });
      const value = v.parse(rpcValue, result.output);
      serializeRpcValue(value);
      return value;
    };
    if (parent) {
      if (
        !parent.active ||
        parent.requestId !== context.requestId ||
        parent.identity !== context.identity ||
        parent.connection !== options.connection
      )
        throw new Error("Database belongs to a different invocation");
      parent.assertCurrent();
      if (parent.policy === "read" && policy === "write")
        throw new Error("Read-only invocation cannot acquire write authority");
      try {
        // SAFETY: the same connection owns the parent and relations are checked by the capability middleware.
        await options.authorize({ ...context, signal, db: parent.db as NodePgDatabase<Relations>, path, input: args });
        return { output: await run(), context: {} };
      } catch (cause) {
        parent.failure = cause instanceof Error ? cause : new Error("Nested database procedure failed");
        throw cause;
      }
    }
    const invocation = Symbol("rpcInvocation");
    const replay =
      policy === "write"
        ? prepareRpcReplay(
            options.replay,
            [
              context.identity
                ? [context.identity.issuer, context.identity.subject, context.identity.tenantId ?? null]
                : null,
              path,
            ],
            context.idempotencyKey,
            args,
          )
        : undefined;
    const output = await runFunctionTransaction(
      options.connection,
      policy === "read" ? "query" : "mutation",
      async (db) => {
        await bindDatabaseIdentity(db, context.identity);
        const assertDatabaseCurrent = captureInvocationGuard();
        const active: ActiveDatabase = {
          db,
          policy,
          invocation,
          connection: options.connection,
          identity: context.identity,
          requestId: context.requestId,
          assertCurrent: () => {
            const scope = currentDatabase.getStore();
            if (!scope?.active || scope.invocation !== invocation) throw new Error("RPC invocation is inactive");
            assertDatabaseCurrent();
          },
          active: true,
        };
        return currentDatabase.run(active, async () => {
          try {
            // Reauthorization is inside each attempt and runs even when a receipt exists.
            await options.authorize({ ...context, signal, db, path, input: args });
            const result = replay ? await replay(db, run) : await run();
            if (active.failure) throw active.failure;
            return result;
          } finally {
            active.active = false;
          }
        });
      },
      { signal },
    );
    return { output, context: {} };
  };
  const inputCount = definition.inputSchemas
    ? Array.isArray(definition.inputSchemas)
      ? definition.inputSchemas.length
      : 1
    : 0;
  const middlewares = definition.orderedMiddlewares
    .filter((_entry, index) => index !== errorIndex)
    .map((entry) => ({ ...entry, inputSchemasLengthAtUse: inputCount }));
  const errorBoundary: typeof boundary = (opts, input, done) => {
    // Nested database failures must reach the single outer retry owner before
    // public error redaction. The outermost boundary still redacts all defects.
    return currentDatabase.getStore()?.active ? opts.next() : rpcErrorBoundary(opts, input, done);
  };
  middlewares.unshift(
    { ...first, middleware: errorBoundary, inputSchemasLengthAtUse: inputCount, outputSchemasLengthAtUse: 0 },
    { middleware: boundary, inputSchemasLengthAtUse: inputCount, outputSchemasLengthAtUse: 0 },
  );
  return new Procedure({ ...definition, orderedMiddlewares: middlewares });
}
