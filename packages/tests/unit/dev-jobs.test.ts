import { expect, test, vi } from "vite-plus/test";
import { createDevelopmentJobLoop } from "@loom/tooling";

const result = { claimed: 0, completed: 0, failed: 0, leaseLost: 0 };

test("halting between timer delivery and the queued pass prevents worker admission", async () => {
  vi.useFakeTimers();
  const worker = { run: vi.fn(async () => result), stop: vi.fn(async () => {}) };
  const loop = createDevelopmentJobLoop(worker);
  try {
    loop.start();
    vi.advanceTimersByTime(0);
    loop.halt();
    await loop.stop();
    expect(worker.run).not.toHaveBeenCalled();
  } finally {
    await loop.stop();
    vi.useRealTimers();
  }
});

test("development jobs start on activation, serialize bounded passes and drain on halt", async () => {
  vi.useFakeTimers();
  const pending = Promise.withResolvers<typeof result>();
  const worker = {
    run: vi.fn(() => pending.promise),
    stop: vi.fn(async () => {
      pending.resolve(result);
    }),
  };
  const loop = createDevelopmentJobLoop(worker, 100);
  try {
    await vi.advanceTimersByTimeAsync(1000);
    expect(worker.run).not.toHaveBeenCalled();
    loop.start();
    loop.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(worker.run).toHaveBeenCalledExactlyOnceWith(10);
    await vi.advanceTimersByTimeAsync(1000);
    expect(worker.run).toHaveBeenCalledTimes(1);
    loop.halt();
    await loop.stop();
    expect(worker.stop).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1000);
    expect(worker.run).toHaveBeenCalledTimes(1);
    expect(() => loop.start()).toThrow("stopped");
  } finally {
    await loop.stop();
    vi.useRealTimers();
  }
});

test("development jobs redact failures and retry after the configured delay", async () => {
  vi.useFakeTimers();
  const worker = {
    run: vi.fn().mockRejectedValueOnce(new Error("secret")).mockResolvedValue(result),
    stop: vi.fn(async () => {}),
  };
  const loop = createDevelopmentJobLoop(worker, 100);
  try {
    loop.start();
    await vi.advanceTimersByTimeAsync(0);
    expect(loop.failure?.message).toBe("Development job worker failed");
    expect(loop.failure?.cause).toBeUndefined();
    await vi.advanceTimersByTimeAsync(99);
    expect(worker.run).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(worker.run).toHaveBeenCalledTimes(2);
    expect(loop.failure).toBeNull();
  } finally {
    await loop.stop();
    vi.useRealTimers();
  }
});

test("development job shutdown failure is retained and inactive candidates never run", async () => {
  const worker = {
    run: vi.fn(async () => result),
    stop: vi.fn(async () => {
      throw new Error("secret");
    }),
  };
  const loop = createDevelopmentJobLoop(worker);
  loop.halt();
  await expect(loop.stop()).rejects.toThrow("Development job worker cleanup failed");
  await expect(loop.stop()).rejects.toThrow("Development job worker cleanup failed");
  expect(worker.run).not.toHaveBeenCalled();
  expect(worker.stop).toHaveBeenCalledTimes(1);
  expect(() => createDevelopmentJobLoop(worker, 0)).toThrow();
});
