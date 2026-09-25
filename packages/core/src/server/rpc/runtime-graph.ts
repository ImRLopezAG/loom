import { Procedure } from "@orpc/server";
import type { AnyProcedure, Middleware, Router } from "@orpc/server";
import { Context } from "effect";
import * as v from "valibot";
import type { AnyRelations } from "drizzle-orm";
import { Invocation } from "../effect/runtime";
import type { createEffectRuntime } from "../effect/runtime";
import { bindRpcDatabaseProcedure, getDatabasePolicy, resolveDatabasePolicy } from "./database";
import type { RpcDatabaseOptions } from "./database";
import { getClientMode, rpcErrorBoundary } from "./procedure";
import type { ProcedureContext } from "./procedure";
import { rpcValue } from "./serialization";
import type { RpcValue } from "./serialization";
import { createLiveProcedure } from "./live";
import type { createRevisionCoordinator } from "../realtime/coordinator";
import type { RpcAuthorization } from "../auth/rpc-definition";
import { rpcJobCall } from "../jobs/rpc-contracts";
import { withInvocationStorage } from "../storage/invocation";
import type { createStorageIntents } from "../storage/intents";

export interface RuntimeProcedureEntry {
  readonly path: readonly string[];
  readonly visibility: "public" | "internal";
  readonly procedure: AnyProcedure;
}
interface ProcedureTree {
  [key: string]: ProcedureTree | AnyProcedure;
}

/** Bind each authored leaf exactly once. Public transports and durable workers
 * receive views of the same compiled graph; internal routes never enter the public view. */
export function bindRuntimeGraph<Relations extends AnyRelations>(options: {
  readonly entries: readonly RuntimeProcedureEntry[];
  readonly database: RpcDatabaseOptions<Relations>;
  readonly effects: ReturnType<typeof createEffectRuntime<never, never>>;
  readonly coordinator: ReturnType<typeof createRevisionCoordinator>;
  readonly activate: (signal: AbortSignal) => Promise<void>;
  readonly authorize: (context: RpcAuthorization) => Promise<void>;
  readonly storage?: ReturnType<typeof createStorageIntents> | undefined;
  readonly application?: { readonly run: <Result>(work: () => Result) => Result } | undefined;
}) {
  const run = options.application?.run ?? (<Result>(work: () => Result): Result => work());
  function createTree(): ProcedureTree {
    const node: ProcedureTree = {};
    Object.setPrototypeOf(node, null);
    return node;
  }
  const publicRouter = createTree();
  const finiteRouter = createTree();
  const internal = [];
  const paths = new Set<string>();
  function insert(tree: ProcedureTree, path: readonly string[], procedure: AnyProcedure) {
    let node = tree;
    for (const segment of path.slice(0, -1)) {
      const child = node[segment];
      if (child instanceof Procedure) throw new Error("Procedure path collides with a router");
      node = child ?? (node[segment] = createTree());
    }
    const last = path.at(-1);
    if (!last || node[last]) throw new Error("Duplicate procedure path");
    node[last] = procedure;
  }
  for (const entry of options.entries) {
    const path = v.parse(rpcJobCall.entries.path, entry.path);
    const key = JSON.stringify([entry.visibility, path]);
    if (paths.has(key)) throw new Error("Duplicate procedure path");
    paths.add(key);
    const policy = getDatabasePolicy(entry.procedure);
    const bound = policy ? bindRpcDatabaseProcedure(entry.procedure, options.database) : entry.procedure;
    const definition = bound["~orpc"];
    const own: Middleware<ProcedureContext, object, RpcValue, RpcValue, Record<never, never>> = (
      { context, signal, next },
      input,
    ) =>
      run(() =>
        options.effects.promise(
          context,
          async (invocation) => {
            await options.activate(invocation.signal);
            if (!policy)
              await options.authorize({ ...context, signal: invocation.signal, path, input: v.parse(rpcValue, input) });
            return withInvocationStorage(
              invocation,
              options.storage,
              resolveDatabasePolicy(policy, context),
              async () =>
                next({
                  context: {
                    signal: invocation.signal,
                    "effect/context": Context.add(context["effect/context"], Invocation, {
                      ...context,
                      signal: invocation.signal,
                    }),
                  },
                }),
            );
          },
          signal ? AbortSignal.any([signal, context.signal]) : context.signal,
        ),
      );
    // Validation still precedes acquisition. Database binding already moves all
    // input stages ahead of its transaction, and finite output stages stay inside it.
    const inputCount = definition.inputSchemas
      ? Array.isArray(definition.inputSchemas)
        ? definition.inputSchemas.length
        : 1
      : 0;
    const owned = new Procedure({
      ...definition,
      orderedMiddlewares: [
        { middleware: rpcErrorBoundary, inputSchemasLengthAtUse: inputCount, outputSchemasLengthAtUse: 0 },
        { middleware: own, inputSchemasLengthAtUse: inputCount, outputSchemasLengthAtUse: 0 },
        ...definition.orderedMiddlewares.map((middleware) => ({ ...middleware, inputSchemasLengthAtUse: inputCount })),
      ],
    });
    if (entry.visibility === "internal") internal.push({ path, procedure: owned });
    else {
      insert(finiteRouter, path, owned);
      insert(
        publicRouter,
        path,
        getClientMode(owned) === "live" ? createLiveProcedure(owned, options.coordinator) : owned,
      );
    }
  }
  const router: Router<ProcedureContext> = publicRouter;
  const snapshots: Router<ProcedureContext> = finiteRouter;
  return Object.freeze({ router, snapshots, internal: Object.freeze(internal) });
}
