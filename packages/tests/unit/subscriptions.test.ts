import { expect, test, vi } from "vite-plus/test";
import { createRevisionCoordinator } from "@loom/core/server";
type Evaluation = { value: string; revisions: { tasks: string } };

const session = () => ({
  identity: { issuer: "test", subject: "alice" },
  expiresAt: Math.floor(Date.now() / 1000) + 60,
});
const result = (revision: string): Evaluation => ({
  value: revision,
  revisions: { tasks: revision },
});

test("LISTEN readiness precedes snapshots and burst wakeups reconcile an in-flight commit", async () => {
  const ready = Promise.withResolvers<void>();
  const evaluated = Promise.withResolvers<void>();
  const finish = Promise.withResolvers<Evaluation>();
  let wake: (() => void) | undefined;
  let revision = "1";
  let reads = 0;
  let evaluations = 0;
  let listeners = 0;
  const updates: string[] = [];
  const evaluate = async () => {
    evaluations++;
    if (evaluations === 1) {
      evaluated.resolve();
      return finish.promise;
    }
    return result(revision);
  };
  const poller = createRevisionCoordinator({
    intervalMs: 60_000,
    wakeups: (notify) => {
      wake = notify;
      listeners++;
      return {
        ready: ready.promise,
        stop: async () => {
          listeners--;
        },
      };
    },
    readRevisions: async () => {
      reads++;
      return { tasks: revision };
    },
  });
  const subscription = poller.subscribe(session(), {
    evaluate,
    publish: (update) => {
      updates.push(update);
      return true;
    },
    close: () => {},
  });
  const first = poller.poll();
  await vi.waitFor(() => expect(listeners).toBe(1));
  expect(reads).toBe(0);
  ready.resolve();
  await evaluated.promise;
  revision = "2";
  for (let i = 0; i < 1000; i++) wake?.();
  finish.resolve(result("1"));
  await first;
  await vi.waitFor(() => expect(updates).toHaveLength(2));
  expect(updates[1]).toBe("2");
  expect(evaluations).toBe(2);
  expect(reads).toBe(2);
  await subscription.unsubscribe();
  await poller.stop();
  expect(listeners).toBe(0);
});

test("one poll serves all subscriptions and unchanged revisions skip evaluation", async () => {
  let reads = 0;
  let evaluations = 0;
  let revision = "1";
  const updates: string[] = [];
  const evaluate = async () => {
    evaluations++;
    return result(revision);
  };
  const poller = createRevisionCoordinator({
    intervalMs: 60_000,
    readRevisions: async () => {
      reads++;
      return { tasks: revision };
    },
  });
  const subscribe = () =>
    poller.subscribe(session(), {
      evaluate,
      publish: (update) => {
        updates.push(update);
        return true;
      },
      close: () => {},
    });
  const first = subscribe();
  const second = subscribe();
  await Promise.all([poller.poll(), poller.poll()]);
  expect(reads).toBe(1);
  expect(evaluations).toBe(2);
  await poller.poll();
  expect(evaluations).toBe(2);
  revision = "2";
  await poller.poll();
  expect(evaluations).toBe(4);
  expect(updates).toEqual(["1", "1", "2", "2"]);
  void first.unsubscribe();
  await second.unsubscribe();
  await poller.poll();
  expect(reads).toBe(3);
  await poller.stop();
});

test("continuous notification traffic cannot postpone reconciliation indefinitely", async () => {
  vi.useFakeTimers();
  let wake: (() => void) | undefined;
  let revision = "1";
  let evaluations = 0;
  const evaluate = async () => {
    evaluations++;
    return result(revision);
  };
  const poller = createRevisionCoordinator({
    intervalMs: 60_000,
    wakeups: (notify) => {
      wake = notify;
      return { ready: Promise.resolve(), stop: async () => {} };
    },
    readRevisions: async () => ({ tasks: revision }),
  });
  try {
    poller.subscribe(session(), { evaluate, publish: () => true, close: () => {} });
    await poller.poll();
    revision = "2";
    for (let i = 0; i < 20; i++) {
      wake?.();
      await vi.advanceTimersByTimeAsync(1);
    }
    expect(evaluations).toBe(2);
  } finally {
    await poller.stop();
    vi.useRealTimers();
  }
});

test("subscriptions bound concurrency, discard cancelled work and disconnect slow consumers", async () => {
  const pending = Promise.withResolvers<Evaluation>();
  const started = Promise.withResolvers<void>();
  let attempts = 0;
  let signal: AbortSignal | undefined;
  const reasons: string[] = [];
  const updates: string[] = [];
  const evaluate = async (abort: AbortSignal) => {
    attempts++;
    signal = abort;
    if (attempts === 1) {
      started.resolve();
      return pending.promise;
    }
    return result("1");
  };
  const poller = createRevisionCoordinator({
    maxSubscriptions: 2,
    concurrency: 1,
    intervalMs: 60_000,
    readRevisions: async () => ({ tasks: "1" }),
  });
  const first = poller.subscribe(session(), {
    evaluate,
    publish: (update) => {
      updates.push(update);
      return true;
    },
    close: (reason) => {
      reasons.push(reason);
    },
  });
  poller.subscribe(session(), {
    evaluate,
    publish: () => false,
    close: (reason) => {
      reasons.push(reason);
    },
  });
  expect(() => poller.subscribe(session(), { evaluate, publish: () => true, close: () => {} })).toThrow(/limit/);
  const cycle = poller.poll();
  await started.promise;
  expect(attempts).toBe(1);
  void first.unsubscribe();
  expect(signal?.aborted).toBe(true);
  pending.resolve(result("old"));
  await cycle;
  expect(updates).toEqual([]);
  expect(reasons).toEqual(["UNSUBSCRIBED", "RESYNC_REQUIRED"]);
  await poller.stop();
});

test("expiry closes a session during evaluation and polling failures require resync", async () => {
  vi.useFakeTimers();
  try {
    const pending = Promise.withResolvers<Evaluation>();
    const started = Promise.withResolvers<void>();
    const reasons: string[] = [];
    let published = 0;
    const evaluate = async () => {
      started.resolve();
      return pending.promise;
    };
    const poller = createRevisionCoordinator({
      intervalMs: 60_000,
      readRevisions: async () => ({ tasks: "1" }),
    });
    poller.subscribe(
      { ...session(), expiresAt: Math.floor(Date.now() / 1000) + 1 },
      {
        evaluate,
        publish: () => {
          published++;
          return true;
        },
        close: (reason) => {
          reasons.push(reason);
        },
      },
    );
    const cycle = poller.poll();
    await started.promise;
    await vi.advanceTimersByTimeAsync(1000);
    expect(reasons).toEqual(["AUTH_EXPIRED"]);
    pending.resolve(result("late"));
    await cycle;
    expect(published).toBe(0);
    await poller.stop();
    const broken = createRevisionCoordinator({
      readRevisions: async () => {
        throw new Error("secret");
      },
    });
    broken.subscribe(session(), {
      evaluate: async () => result("1"),
      publish: () => true,
      close: (reason) => {
        reasons.push(reason);
      },
    });
    await broken.poll();
    await broken.stop();
    expect(reasons).toEqual(["AUTH_EXPIRED", "RESYNC_REQUIRED"]);
  } finally {
    vi.useRealTimers();
  }
});

test("timer polling coalesces a slow evaluation and shutdown discards its result", async () => {
  vi.useFakeTimers();
  try {
    const pending = Promise.withResolvers<Evaluation>();
    let reads = 0;
    let evaluations = 0;
    const updates: string[] = [];
    const reasons: string[] = [];
    const evaluate = async () => {
      evaluations++;
      return evaluations === 1 ? result("1") : pending.promise;
    };
    const poller = createRevisionCoordinator({
      intervalMs: 10,
      readRevisions: async () => {
        reads++;
        return { tasks: String(reads) };
      },
    });
    poller.subscribe(session(), {
      evaluate,
      publish: (update) => {
        updates.push(update);
        return true;
      },
      close: (reason) => {
        reasons.push(reason);
      },
    });
    await vi.advanceTimersByTimeAsync(0);
    expect(updates).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(100);
    expect(reads).toBe(2);
    expect(evaluations).toBe(2);
    const joined = poller.poll();
    const stopped = poller.stop();
    pending.resolve(result("late"));
    await Promise.all([joined, stopped]);
    await vi.advanceTimersByTimeAsync(100);
    expect(updates).toHaveLength(1);
    expect(reasons).toEqual(["STOPPED"]);
    expect(reads).toBe(2);
    expect(() => poller.subscribe(session(), { evaluate, publish: () => true, close: () => {} })).toThrow(/stopped/);
  } finally {
    vi.useRealTimers();
  }
});
