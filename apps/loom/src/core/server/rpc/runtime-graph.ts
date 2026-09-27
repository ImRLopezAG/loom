import { createComponentCallRegistry } from "../components/callers";
import { call, Procedure } from "@orpc/server";
import { isAsyncIteratorObject } from "@orpc/shared";
import type { AnyProcedure, Middleware, Router } from "@orpc/server";
import { Context } from "effect";
import * as v from "valibot";
import type { AnyRelations } from "drizzle-orm";
import { Invocation } from "../effect/runtime";
import type { createEffectRuntime } from "../effect/runtime";
import { bindRpcDatabaseProcedure, getDatabasePolicy, outsideRpcDatabase, resolveDatabasePolicy } from "./database";
import type { RpcDatabaseOptions } from "./database";
import { rpcErrorBoundary } from "./procedure";
import type { ProcedureContext } from "./procedure";
import { deserializeRpcValue, rpcValue, serializeRpcValue } from "./serialization";
import type { RpcValue } from "./serialization";
import type { createRevisionCoordinator } from "../realtime/coordinator";
import type { RpcAuthorization } from "../auth/rpc-definition";
import { rpcJobCall } from "../jobs/rpc-contracts";
import { withInvocationStorage } from "../storage/invocation";
import { isStreamingProcedure, rpcOutput } from "./stream";
import type { RpcOutput } from "./stream";
import { createStreamLifetime } from "./stream-lifetime";
import { evaluateLiveSnapshot, withLiveInvocation } from "./live-context";
import { createSnapshotStream } from "./snapshot-stream";
import { evaluateSnapshot } from "./snapshot";
import type { createStorageIntents } from "../storage/intents";

export interface RuntimeProcedureEntry {
  readonly path: readonly string[];
  readonly visibility: "public" | "internal" | "exported";
  readonly scope?: string;
  readonly procedure: AnyProcedure;
}
interface ProcedureTree {
  [key: string]: ProcedureTree | AnyProcedure;
}

/** Bind each authored leaf exactly once. Public transports and durable workers
 * receive views of the same compiled graph; internal routes never enter the public view. */
export function bindRuntimeGraph<Relations extends AnyRelations>(options: {
  readonly entries: readonly RuntimeProcedureEntry[];
  readonly exposures?: readonly { readonly scope: string; readonly prefix: string }[] | undefined;
  readonly scopes?:
    | readonly { readonly name: string; readonly dependencies: Readonly<Record<string, string>> }[]
    | undefined;
  readonly database: RpcDatabaseOptions<Relations>;
  readonly effects: ReturnType<typeof createEffectRuntime<never, never>>;
  readonly coordinator: ReturnType<typeof createRevisionCoordinator>;
  readonly activate: (signal: AbortSignal) => Promise<void>;
  readonly authorize: (context: RpcAuthorization) => Promise<void>;
  readonly storage?: ReturnType<typeof createStorageIntents> | undefined;
  readonly application?:
    | {
        readonly run: <Result>(work: () => Result) => Result;
        readonly runComponent: <Result>(path: string, work: () => Result) => Result;
      }
    | undefined;
}) {
  const runApplication = options.application?.run ?? (<Result>(work: () => Result): Result => work());
  const streams = createStreamLifetime();
  function createTree(): ProcedureTree {
    const node: ProcedureTree = {};
    Object.setPrototypeOf(node, null);
    return node;
  }
  const publicRouter = createTree();
  const finiteRouter = createTree();
  const internal = [];
  const scopeRouters = new Map(
    (options.scopes ?? [{ name: "", dependencies: {} }]).map((scope) => [
      scope.name,
      { ...scope, internal: createTree(), exported: createTree() },
    ]),
  );
  if (scopeRouters.size !== (options.scopes?.length ?? 1)) throw new Error("Duplicate component caller scope");
  if (!scopeRouters.has("")) throw new Error("Application caller scope is missing");
  const exposedPrefixes = new Set<string>();
  for (const exposure of options.exposures ?? []) {
    v.parse(rpcJobCall.entries.path, [exposure.prefix]);
    if (!exposure.scope || !scopeRouters.has(exposure.scope)) throw new Error("Unknown public component scope");
    if (
      exposedPrefixes.has(exposure.prefix) ||
      options.entries.some(
        (entry) => !entry.scope && entry.visibility === "public" && entry.path[0] === exposure.prefix,
      )
    )
      throw new Error("Conflicting public component prefix");
    if (!options.entries.some((entry) => entry.scope === exposure.scope && entry.visibility === "exported"))
      throw new Error("Component has no exported RPCs");
    exposedPrefixes.add(exposure.prefix);
  }
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
    const scopeName = entry.scope ?? "";
    const scope = scopeRouters.get(scopeName);
    if (!scope) throw new Error("Unknown procedure scope");
    const run = scopeName
      ? <Result>(work: () => Result): Result => {
          if (!options.application) throw new Error("Component application scope is missing");
          return options.application.runComponent(scopeName, work);
        }
      : runApplication;
    const path = v.parse(rpcJobCall.entries.path, entry.path);
    const key = JSON.stringify([scopeName, entry.visibility, path]);
    if (paths.has(key)) throw new Error("Duplicate procedure path");
    paths.add(key);
    const policy = getDatabasePolicy(entry.procedure);
    const streaming = isStreamingProcedure(entry.procedure);
    const liveTarget = Symbol("live invocation");
    const bound = policy ? bindRpcDatabaseProcedure(entry.procedure, options.database) : entry.procedure;
    const definition = bound["~orpc"];
    const own: Middleware<ProcedureContext, object, RpcValue, RpcOutput, Record<never, never>> = (
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
            const storagePolicy =
              policy === "automatic" && resolveDatabasePolicy(policy, context, streaming) === "write"
                ? "single-attempt-write"
                : resolveDatabasePolicy(policy, context, streaming);
            const execute = () =>
              callers.run(scopeName, { ...context, signal: invocation.signal }, (calls) =>
                withInvocationStorage(invocation, options.storage, storagePolicy, async () =>
                  next({
                    context: {
                      ...calls,
                      signal: invocation.signal,
                      "effect/context": Context.add(context["effect/context"], Invocation, {
                        ...context,
                        signal: invocation.signal,
                      }),
                    },
                  }),
                ),
              );
            const result = streaming
              ? await withLiveInvocation(liveTarget, () => startLive(input, context, invocation.signal), execute)
              : await execute();
            return { ...result, output: await streams.own(v.parse(rpcOutput, result.output), invocation.signal, run) };
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
    const ownProcedure = (procedure: AnyProcedure) =>
      new Procedure({
        ...procedure["~orpc"],
        orderedMiddlewares: [
          { middleware: rpcErrorBoundary, inputSchemasLengthAtUse: inputCount, outputSchemasLengthAtUse: 0 },
          { middleware: own, inputSchemasLengthAtUse: inputCount, outputSchemasLengthAtUse: 0 },
          ...procedure["~orpc"].orderedMiddlewares.map((middleware) => ({
            ...middleware,
            inputSchemasLengthAtUse: inputCount,
          })),
        ],
      });
    const owned = ownProcedure(bound);
    // The initial subscription owns native event validation. Snapshot evaluations
    // rerun authorization but return raw events, so output transforms run once.
    const snapshotBound =
      streaming && policy ? bindRpcDatabaseProcedure(entry.procedure, options.database, true) : entry.procedure;
    const snapshotProcedure = new Procedure({
      ...ownProcedure(snapshotBound)["~orpc"],
      disableInputValidation: true,
      disableOutputValidation: true,
    });
    function startLive(input: RpcValue, context: ProcedureContext, signal: AbortSignal) {
      const captured = serializeRpcValue(v.parse(rpcValue, input));
      return createSnapshotStream({
        signal,
        expiresAt: context.expiresAt,
        coordinator: options.coordinator,
        evaluate: (evaluationSignal) =>
          outsideRpcDatabase(() =>
            evaluateLiveSnapshot(liveTarget, () =>
              evaluateSnapshot(async () => {
                const result = await call(snapshotProcedure, deserializeRpcValue(structuredClone(captured)), {
                  context: { ...context, operation: "live", signal: evaluationSignal },
                  signal: evaluationSignal,
                  path,
                });
                const iterator = v.parse(
                  v.custom<AsyncIteratorObject<RpcValue, RpcValue>>(isAsyncIteratorObject),
                  result,
                );
                try {
                  const snapshot = await iterator.next();
                  if (snapshot.done) throw new Error("Live evaluation produced no snapshot");
                  return v.parse(rpcValue, snapshot.value);
                } finally {
                  await iterator.return?.();
                }
              }),
            ),
          ),
      });
    }
    if (entry.visibility === "internal") {
      if (!scopeName) internal.push({ path, procedure: owned });
      insert(scope.internal, path, owned);
    } else if (entry.visibility === "exported") {
      insert(scope.exported, path, owned);
      for (const exposure of options.exposures ?? []) {
        if (exposure.scope !== scopeName) continue;
        const projected = v.parse(rpcJobCall.entries.path, [exposure.prefix, ...path]);
        insert(publicRouter, projected, owned);
        insert(finiteRouter, projected, owned);
      }
    } else {
      if (scopeName) throw new Error("Component public routes require an explicit projection");
      insert(finiteRouter, path, owned);
      insert(publicRouter, path, owned);
    }
  }
  const callers = createComponentCallRegistry([...scopeRouters.values()]);
  const router: Router<ProcedureContext> = publicRouter;
  const snapshots: Router<ProcedureContext> = finiteRouter;
  return Object.freeze({ router, snapshots, internal: Object.freeze(internal), stop: streams.stop });
}
