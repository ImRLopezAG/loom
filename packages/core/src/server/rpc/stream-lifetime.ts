import { isAsyncIteratorObject, wrapAsyncIterator } from "@orpc/shared";
import type { RpcOutput } from "./stream";
import type { RpcValue } from "./serialization";

/** Own iterators until completion, cancellation or runtime shutdown. The native
 * wrapper serializes next/return and restores the application's environment. */
export function createStreamLifetime() {
  const active = new Set<AsyncIteratorObject<RpcValue, RpcValue>>();
  let stopped = false;
  let stopping: Promise<void> | undefined;

  async function own(
    output: RpcOutput,
    signal: AbortSignal,
    run: <Result>(work: () => Result) => Result,
  ): Promise<RpcOutput> {
    if (!isAsyncIteratorObject(output)) return output;
    if (stopped || signal.aborted) {
      await run(() => output.return?.());
      throw new Error("Stream invocation stopped");
    }
    const stream = wrapAsyncIterator(output, {
      runWith: run,
      mapResult(result) {
        signal.throwIfAborted();
        return result;
      },
      onFinish() {
        signal.removeEventListener("abort", abort);
        active.delete(stream);
      },
    });
    const abort = () => {
      // The transport already observes cancellation. Cleanup failures must not
      // become unhandled rejections or expose their private causes.
      void stream.return().catch(() => undefined);
    };
    active.add(stream);
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) abort();
    return stream;
  }

  function stop(): Promise<void> {
    if (stopping) return stopping;
    stopped = true;
    stopping = Promise.allSettled([...active].map(async (stream) => stream.return?.())).then(() => undefined);
    return stopping;
  }
  return Object.freeze({ own, stop });
}
