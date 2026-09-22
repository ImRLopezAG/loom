import type { InvocationIdentity } from "../auth/context";
import type { VerifiedSession } from "../auth/verify";
import type { EvaluationResponse, FunctionCall } from "../dispatch";
import type { TableRevisions } from "./revisions";

export type SubscriptionCloseReason = "UNSUBSCRIBED" | "AUTH_EXPIRED" | "QUERY_ERROR" | "RESYNC_REQUIRED" | "STOPPED";
export interface SubscriptionUpdate {
  readonly sequence: number;
  readonly response: EvaluationResponse;
}
export interface SubscriptionSink {
  /** Synchronously enqueue one message; false means the transport buffer is full. */
  readonly publish: (update: SubscriptionUpdate) => boolean;
  readonly close: (reason: SubscriptionCloseReason) => void;
}
export interface SubscriptionPollerOptions {
  readonly readRevisions: () => Promise<TableRevisions>;
  readonly evaluate: (
    call: FunctionCall,
    identity: InvocationIdentity,
    signal: AbortSignal,
  ) => Promise<EvaluationResponse>;
  readonly intervalMs?: number;
  readonly maxSubscriptions?: number;
  readonly concurrency?: number;
}
interface Subscription {
  readonly call: FunctionCall;
  readonly session: VerifiedSession;
  readonly sink: SubscriptionSink;
  readonly controller: AbortController;
  expiry?: ReturnType<typeof setTimeout>;
  revisions?: TableRevisions;
  sequence: number;
}

function changed(before: TableRevisions | undefined, after: TableRevisions): boolean {
  return (
    !before ||
    Object.keys(before).length !== Object.keys(after).length ||
    Object.entries(before).some(([table, revision]) => after[table] !== revision)
  );
}
function bounded(value: number, maximum: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= maximum;
}

/** One instance per active isolate/generation. All subscriptions share its conservative table set. */
export function createSubscriptionPoller(options: SubscriptionPollerOptions) {
  const { readRevisions, evaluate } = options;
  const interval = options.intervalMs ?? 1000;
  const maximum = options.maxSubscriptions ?? 1000;
  const concurrency = options.concurrency ?? 4;
  if (!bounded(interval, 60_000) || interval < 10 || !bounded(maximum, 1000) || !bounded(concurrency, 20))
    throw new Error("Invalid subscription polling limits");
  const subscriptions = new Set<Subscription>();
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<void> | undefined;

  function cancelTimer() {
    if (timer) clearTimeout(timer);
    timer = undefined;
  }
  function close(subscription: Subscription, reason: SubscriptionCloseReason) {
    if (!subscriptions.delete(subscription)) return;
    if (subscription.expiry) clearTimeout(subscription.expiry);
    subscription.controller.abort();
    if (!subscriptions.size) cancelTimer();
    try {
      subscription.sink.close(reason);
    } catch {
      /* A disconnected transport cannot receive another close. */
    }
  }
  function closeAll(reason: SubscriptionCloseReason) {
    // Close callbacks may subscribe again; they must not join this removal pass.
    const previous = [...subscriptions];
    for (const subscription of previous) close(subscription, reason);
  }
  function expire(subscription: Subscription) {
    if (!subscriptions.has(subscription)) return;
    const remaining = subscription.session.expiresAt * 1000 - Date.now();
    if (remaining <= 0) {
      close(subscription, "AUTH_EXPIRED");
      return;
    }
    subscription.expiry = setTimeout(() => expire(subscription), Math.min(remaining, 2_147_483_647));
  }
  function active(subscription: Subscription): boolean {
    if (!subscriptions.has(subscription)) return false;
    if (subscription.session.expiresAt * 1000 <= Date.now()) {
      close(subscription, "AUTH_EXPIRED");
      return false;
    }
    return true;
  }
  async function run() {
    if (stopped || !subscriptions.size) return;
    let revisions: TableRevisions;
    try {
      revisions = await readRevisions();
    } catch {
      closeAll("RESYNC_REQUIRED");
      return;
    }
    if (stopped) return;
    const queue = [...subscriptions].filter((subscription) => changed(subscription.revisions, revisions));
    let next = 0;
    async function worker() {
      for (;;) {
        const subscription = queue[next++];
        if (!subscription) return;
        if (!active(subscription)) continue;
        try {
          const response = await evaluate(
            subscription.call,
            subscription.session.identity,
            subscription.controller.signal,
          );
          if (!active(subscription)) continue;
          if (response.ok) subscription.revisions = Object.freeze({ ...response.revisions });
          const accepted = subscription.sink.publish({ sequence: ++subscription.sequence, response });
          if (!accepted) close(subscription, "RESYNC_REQUIRED");
          else if (!response.ok) close(subscription, "QUERY_ERROR");
        } catch {
          close(subscription, "RESYNC_REQUIRED");
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, queue.length) }, worker));
  }
  function schedule(delay: number) {
    if (stopped || !subscriptions.size || timer || running) return;
    timer = setTimeout(() => {
      timer = undefined;
      void poll();
    }, delay);
  }
  function poll(): Promise<void> {
    if (running) return running;
    cancelTimer();
    // Register the cycle before invoking callbacks, which may reenter the coordinator.
    running = Promise.resolve()
      .then(run)
      .finally(() => {
        running = undefined;
        schedule(interval);
      });
    return running;
  }
  return {
    poll,
    subscribe(call: FunctionCall, verifiedSession: VerifiedSession, sink: SubscriptionSink) {
      if (stopped) throw new Error("Subscription poller is stopped");
      if (subscriptions.size >= maximum) throw new Error("Subscription limit reached");
      if (call.kind !== "query") throw new Error("Only queries can be subscribed");
      if (!Number.isSafeInteger(verifiedSession.expiresAt) || verifiedSession.expiresAt <= Date.now() / 1000)
        throw new Error("Subscription session has expired");
      const subscription: Subscription = {
        call: structuredClone(call),
        session: structuredClone(verifiedSession),
        sink,
        controller: new AbortController(),
        sequence: 0,
      };
      subscriptions.add(subscription);
      expire(subscription);
      schedule(0);
      return { unsubscribe: () => close(subscription, "UNSUBSCRIBED") };
    },
    async stop() {
      stopped = true;
      cancelTimer();
      closeAll("STOPPED");
      await running;
    },
  };
}
