import { Context, Effect, Layer, ManagedRuntime } from "effect";
import type { Scope } from "effect";
import type { InvocationContext } from "../auth/context";
import { captureJobInvocation } from "../auth/context";
import { publishRuntimeMetric } from "../observability";

export class Invocation extends Context.Service<Invocation, InvocationContext>()("loom/Invocation") {}
export class Diagnostics extends Context.Service<Diagnostics, typeof publishRuntimeMetric>()("loom/Diagnostics") {}
export type InvocationInput = Omit<InvocationContext, "signal">;

/** Owns shared services; every call receives an isolated, scoped invocation. */
export function createEffectRuntime<Services, Failure>(layer: Layer.Layer<Services, Failure>) {
  const runtime = ManagedRuntime.make(Layer.merge(layer, Layer.succeed(Diagnostics, publishRuntimeMetric)));
  const shutdown = new AbortController();
  const pending = new Set<Promise<unknown>>();
  let stopped = false;
  let stopping: Promise<void> | undefined;

  function run<Value, Error>(
    input: InvocationInput,
    operation: Effect.Effect<Value, Error, Services | Invocation | Diagnostics | Scope.Scope>,
    signal?: AbortSignal,
  ): Promise<Value> {
    if (stopped) return Promise.reject(new globalThis.Error("Runtime stopped"));
    const current = signal ? AbortSignal.any([signal, shutdown.signal]) : shutdown.signal;
    const context: InvocationContext = Object.freeze({
      identity: input.identity ? Object.freeze({ ...input.identity }) : null,
      requestId: input.requestId,
      job: captureJobInvocation(input.job),
      signal: current,
    });
    const work = runtime
      .runPromise(Effect.scoped(Effect.provideService(operation, Invocation, context)), { signal: current })
      .finally(() => pending.delete(work));
    pending.add(work);
    return work;
  }

  function promise<Value>(
    input: InvocationInput,
    operation: (context: InvocationContext) => Promise<Value>,
    signal?: AbortSignal,
  ): Promise<Value> {
    return run(
      input,
      Effect.gen(function* () {
        const context = yield* Invocation;
        // pg cannot abort every in-flight query. Wait for the operation's rollback and
        // client release before interruption completes or shared resources are disposed.
        return yield* Effect.uninterruptible(
          Effect.tryPromise({
            try: async () => {
              context.signal.throwIfAborted();
              const value = await operation(context);
              context.signal.throwIfAborted();
              return value;
            },
            catch: (cause) => cause,
          }),
        );
      }),
      signal,
    );
  }

  function stop(): Promise<void> {
    if (stopping) return stopping;
    stopped = true;
    shutdown.abort();
    stopping = Promise.resolve().then(async () => {
      await Promise.allSettled(pending);
      await runtime.dispose();
    });
    return stopping;
  }
  return Object.freeze({ run, promise, stop });
}
