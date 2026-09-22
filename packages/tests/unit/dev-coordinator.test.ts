import { expect, test } from "vite-plus/test";
import { createDevelopmentCoordinator } from "@loom/tooling";

function deferred() {
  let release = () => {};
  const promise = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { promise, release };
}

test("development revisions serialize work and supersede an in-flight candidate", async () => {
  const entered = deferred();
  const finish = deferred();
  const prepared: number[] = [];
  const activated: number[] = [];
  let active = 0;
  let maximumActive = 0;
  const coordinator = createDevelopmentCoordinator(
    async (revision) => {
      active++;
      maximumActive = Math.max(maximumActive, active);
      try {
        prepared.push(revision.number);
        if (revision.number === 1) {
          entered.release();
          await finish.promise;
        }
        revision.assertCurrent();
        activated.push(revision.number);
      } finally {
        active--;
      }
    },
    { debounceMs: 60_000 },
  );
  coordinator.invalidate();
  const drained = coordinator.flush();
  await entered.promise;
  coordinator.invalidate();
  coordinator.invalidate();
  const latest = coordinator.flush();
  finish.release();
  await Promise.all([drained, latest]);
  expect(prepared).toEqual([1, 3]);
  expect(activated).toEqual([3]);
  expect(maximumActive).toBe(1);
  expect(coordinator.failure).toBeNull();
  await coordinator.stop();
});

test("failed edits preserve active state and the next edit can recover", async () => {
  let activated = 0;
  const coordinator = createDevelopmentCoordinator(async (revision) => {
    if (revision.number === 2) throw new Error("Compilation failed");
    revision.assertCurrent();
    activated = revision.number;
  });
  coordinator.invalidate();
  await coordinator.flush();
  coordinator.invalidate();
  await coordinator.flush();
  expect(activated).toBe(1);
  expect(coordinator.failure?.revision).toBe(2);
  coordinator.invalidate();
  await coordinator.flush();
  expect(activated).toBe(3);
  expect(coordinator.failure).toBeNull();
  await coordinator.stop();
});

test("stop aborts active work, drains cleanup, and cancels debounced edits", async () => {
  const entered = deferred();
  const finish = deferred();
  let cleaned = false;
  let activated = false;
  const coordinator = createDevelopmentCoordinator(async (revision) => {
    entered.release();
    try {
      await finish.promise;
      revision.assertCurrent();
      activated = true;
    } finally {
      cleaned = true;
    }
  });
  coordinator.invalidate();
  const drained = coordinator.flush();
  await entered.promise;
  coordinator.invalidate();
  const stopped = coordinator.stop();
  expect(cleaned).toBe(false);
  finish.release();
  await Promise.all([drained, stopped]);
  expect(cleaned).toBe(true);
  expect(activated).toBe(false);
  expect(() => coordinator.invalidate()).toThrow("stopped");
  await coordinator.stop();
});
