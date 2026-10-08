import { ciStage, ciId, ciScope } from "./ci-trace";
export interface DevelopmentRevision {
  readonly number: number;
  readonly signal: AbortSignal;
  /** Call under the relevant lock immediately before a database or publication side effect. */
  assertCurrent(): void;
}
export interface DevelopmentFailure {
  readonly revision: number;
  readonly error: Error;
}
export interface DevelopmentCoordinatorOptions {
  readonly debounceMs?: number;
}

/** Owns one update pipeline at a time, including cleanup after cancellation. */
export function createDevelopmentCoordinator(
  update: (revision: DevelopmentRevision) => Promise<void>,
  options: DevelopmentCoordinatorOptions = {},
) {
  const ciCoordinator = ciId();
  ciStage("coordinator.create", { coordinator: ciCoordinator });
  const debounceMs = options.debounceMs ?? 75;
  if (!Number.isInteger(debounceMs) || debounceMs < 0 || debounceMs > 60_000)
    throw new Error("Development debounce must be between 0 and 60000 milliseconds");
  let number = 0;
  let stopped = false;
  let pending = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<void> | undefined;
  let controller: AbortController | undefined;
  let failure: DevelopmentFailure | null = null;
  const waiters = new Set<() => void>();

  function notifyIdle() {
    if (running || timer || pending) return;
    for (const resolve of waiters) resolve();
    waiters.clear();
  }
  async function run() {
    while (pending && !stopped) {
      pending = false;
      const revisionNumber = number;
      const cancellation = new AbortController();
      controller = cancellation;
      const revision: DevelopmentRevision = {
        number: revisionNumber,
        signal: cancellation.signal,
        assertCurrent() {
          if (stopped || revisionNumber !== number || cancellation.signal.aborted)
            throw new Error("Development revision is no longer current");
        },
      };
      ciStage("revision.begin", { coordinator: ciCoordinator, revision: revisionNumber });
      try {
        await ciScope({ coordinator: ciCoordinator, revision: revisionNumber }, () => update(revision));
        ciStage("revision.success", { coordinator: ciCoordinator, revision: revisionNumber, aborted: cancellation.signal.aborted });
        if (revisionNumber === number && !stopped) failure = null;
      } catch (cause) {
        ciStage("revision.failure", { coordinator: ciCoordinator, revision: revisionNumber, aborted: cancellation.signal.aborted });
        if (revisionNumber === number && !stopped && !cancellation.signal.aborted)
          failure = { revision: revisionNumber, error: new Error("Development update failed", { cause }) };
      } finally {
        ciStage("revision.end", { coordinator: ciCoordinator, revision: revisionNumber, aborted: cancellation.signal.aborted, pending });
        controller = undefined;
      }
    }
  }
  function begin() {
    if (running || stopped || !pending) return;
    running = run().finally(() => {
      running = undefined;
      begin();
      notifyIdle();
    });
  }
  function cancelTimer() {
    if (timer) clearTimeout(timer);
    timer = undefined;
  }
  function ready() {
    ciStage("coordinator.ready", { coordinator: ciCoordinator, revision: number });
    cancelTimer();
    pending = true;
    begin();
  }
  function settled(): Promise<void> {
    if (!running && !timer && !pending) return Promise.resolve();
    return new Promise((resolve) => waiters.add(resolve));
  }
  return {
    get failure(): DevelopmentFailure | null {
      return failure;
    },
    invalidate(): void {
      if (stopped) throw new Error("Development coordinator is stopped");
      number++;
      ciStage("coordinator.invalidate", { coordinator: ciCoordinator, revision: number, pending, aborted: controller?.signal.aborted ?? false });
      controller?.abort();
      ciStage("revision.cancel", { coordinator: ciCoordinator, revision: number, aborted: controller?.signal.aborted ?? false });
      pending = false;
      cancelTimer();
      timer = setTimeout(ready, debounceMs);
    },
    async flush(this: void): Promise<void> {
      if (timer) ready();
      await settled();
    },
    settled,
    async stop(): Promise<void> {
      stopped = true;
      pending = false;
      cancelTimer();
      controller?.abort();
      ciStage("revision.cancel", { coordinator: ciCoordinator, revision: number, aborted: controller?.signal.aborted ?? false });
      notifyIdle();
      await settled();
    },
  };
}
