import type { MutationFunctionContext, QueryClient, QueryKey } from "@tanstack/react-query";

export interface OptimisticAttempt {
  release?: () => void;
  committed?: { data: unknown };
  settled: boolean;
}

/** Refcounts protect overlapping optimistic edits. No result data is stored here. */
export function createLivePause(queryClient: QueryClient, sessionSignal: AbortSignal) {
  const paused = new Map<string, { count: number; wake: Set<() => void> }>();
  sessionSignal.addEventListener("abort", () => paused.clear(), { once: true });
  const hash = (key: QueryKey) => queryClient.defaultQueryOptions({ queryKey: key }).queryHash;
  return {
    attempts: new WeakMap<MutationFunctionContext, OptimisticAttempt>(),
    async wait(key: QueryKey, signal: AbortSignal) {
      const abort = AbortSignal.any([sessionSignal, signal]);
      for (;;) {
        abort.throwIfAborted();
        const entry = paused.get(hash(key));
        if (!entry) return;
        await new Promise<void>((resolve, reject) => {
          const done = () => {
            abort.removeEventListener("abort", cancelled);
            entry.wake.delete(done);
            resolve();
          };
          const cancelled = () => {
            entry.wake.delete(done);
            reject(abort.reason);
          };
          entry.wake.add(done);
          abort.addEventListener("abort", cancelled, { once: true });
          if (abort.aborted) cancelled();
        });
      }
    },
    async pause(keys: readonly QueryKey[]) {
      sessionSignal.throwIfAborted();
      const unique = new Map(keys.map((key) => [hash(key), key]));
      for (const id of unique.keys()) {
        const entry = paused.get(id) ?? { count: 0, wake: new Set<() => void>() };
        entry.count++;
        paused.set(id, entry);
      }
      let released = false;
      const release = () => {
        if (released) return;
        released = true;
        for (const [id, key] of unique) {
          const entry = paused.get(id);
          if (!entry || --entry.count) continue;
          paused.delete(id);
          // Cancel gated refetches before waking them. The new invocation alone
          // may continue; its signal is checked again by the live interceptor.
          if (!sessionSignal.aborted) void queryClient.invalidateQueries({ queryKey: key, exact: true });
          for (const wake of entry.wake) wake();
        }
      };
      try {
        await Promise.all(
          [...unique.values()].map((key) =>
            queryClient.cancelQueries({ queryKey: key, exact: true }, { revert: false }),
          ),
        );
        sessionSignal.throwIfAborted();
        return release;
      } catch (error) {
        release();
        throw error;
      }
    },
  };
}
