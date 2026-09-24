import type { LiveQueryStore, QuerySnapshot } from "../client/live";
import { LoomClientError } from "../client/transport";

/** Keep only the newest snapshot while a slow observer is catching up. */
export async function* snapshots<T>(store: LiveQueryStore<T>, signal: AbortSignal): AsyncGenerator<T> {
  let wake: (() => void) | undefined;
  let previous: QuerySnapshot<T> | undefined;
  const notify = () => {
    wake?.();
  };
  signal.addEventListener("abort", notify);
  let unsubscribe: (() => void) | undefined;
  try {
    signal.throwIfAborted();
    unsubscribe = store.subscribe(notify);
    while (!signal.aborted) {
      const snapshot = store.getSnapshot();
      if (snapshot !== previous) {
        previous = snapshot;
        if (snapshot.status === "success") {
          yield snapshot.value;
          continue;
        }
        if (snapshot.status === "error") throw snapshot.error;
        if (snapshot.status === "signed-out" || snapshot.status === "stopped")
          throw new LoomClientError("AUTH_CHANGED", "The live session ended");
      }
      await new Promise<void>((resolve) => {
        wake = resolve;
      });
      wake = undefined;
    }
    signal.throwIfAborted();
  } finally {
    signal.removeEventListener("abort", notify);
    unsubscribe?.();
  }
}
