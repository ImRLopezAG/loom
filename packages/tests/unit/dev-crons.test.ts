import { expect, test, vi } from "vite-plus/test";
import { createDevelopmentCronLoop } from "@loom/tooling";

test("clock rollback cannot turn the startup minute into a delivered occurrence", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-23T12:15:30Z"));
  const dispatch = vi.fn(async () => "job");
  const loop = createDevelopmentCronLoop({ minute: "* * * * *" }, { dispatch });
  try {
    loop.start();
    vi.setSystemTime(new Date("2026-09-23T12:14:30Z"));
    await vi.advanceTimersByTimeAsync(30_000);
    expect(dispatch).not.toHaveBeenCalled();
  } finally {
    await loop.stop();
    vi.useRealTimers();
  }
});

test("development crons dispatch UTC minute occurrences without startup or missed-minute replay", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-23T12:14:30Z"));
  const dispatch = vi.fn<(name: string, at: Date, signal?: AbortSignal) => Promise<string>>(async () => "job");
  const loop = createDevelopmentCronLoop({ quarter: "*/15 * * * *", sunday: "0 0 * * 7" }, { dispatch });
  try {
    loop.start();
    await vi.advanceTimersByTimeAsync(29_999);
    expect(dispatch).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);
    expect(dispatch).toHaveBeenCalledExactlyOnceWith(
      "quarter",
      new Date("2026-09-23T12:15:00Z"),
      expect.any(AbortSignal),
    );
    vi.setSystemTime(new Date("2026-09-23T12:59:00Z"));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch.mock.calls[1]?.[1]).toEqual(new Date("2026-09-23T13:00:00Z"));
    vi.setSystemTime(new Date("2026-09-23T12:59:00Z"));
    await vi.advanceTimersByTimeAsync(60_000);
    expect(dispatch).toHaveBeenCalledTimes(2);
  } finally {
    await loop.stop();
    vi.useRealTimers();
  }
});

test("development crons retry only failed current occurrences and abort admitted work on halt", async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-23T12:00:00Z"));
  const pending = Promise.withResolvers<string>();
  const dispatch = vi
    .fn()
    .mockRejectedValueOnce(new Error("secret"))
    .mockResolvedValueOnce("job")
    .mockImplementation((_name, _at, signal: AbortSignal) => {
      signal.addEventListener("abort", () => pending.resolve("cancelled"), { once: true });
      return pending.promise;
    });
  const loop = createDevelopmentCronLoop({ minute: "* * * * *" }, { dispatch });
  try {
    loop.start();
    await vi.advanceTimersByTimeAsync(60_000);
    expect(loop.failure?.message).toBe("Development cron dispatch failed");
    expect(loop.failure?.cause).toBeUndefined();
    await vi.advanceTimersByTimeAsync(1000);
    expect(loop.failure).toBeNull();
    expect(dispatch.mock.calls[0]?.[1]).toEqual(dispatch.mock.calls[1]?.[1]);
    await vi.advanceTimersByTimeAsync(59_000);
    expect(dispatch).toHaveBeenCalledTimes(3);
    loop.halt();
    await loop.stop();
    await vi.advanceTimersByTimeAsync(120_000);
    expect(dispatch).toHaveBeenCalledTimes(3);
    expect(() => loop.start()).toThrow("stopped");
  } finally {
    await loop.stop();
    vi.useRealTimers();
  }
});

test("development cron validation preserves Loom's numeric five-field dialect", () => {
  for (const schedule of ["@daily", "* * * * * *", "0 0 * * MON", "*/0 * * * *"])
    expect(() => createDevelopmentCronLoop({ invalid: schedule }, { dispatch: async () => "job" })).toThrow();
});

test.each([
  ["0,30 0 * * 7", "2026-09-27T00:30:00Z", true],
  ["0,30 0 * * 0", "2026-09-27T00:30:00Z", true],
  ["0 9 * * 1-5", "2026-09-27T09:00:00Z", false],
  ["5/20 * * * *", "2026-09-23T12:25:00Z", true],
  ["0 12 1 * 3", "2026-09-23T12:00:00Z", true],
  ["0 0 29 2 *", "2028-02-29T00:00:00Z", true],
] as const)("development calendar matching %s at %s", async (schedule, at, matches) => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(new Date(at).getTime() - 30_000));
  const dispatch = vi.fn(async () => "job");
  const loop = createDevelopmentCronLoop({ configured: schedule }, { dispatch });
  try {
    loop.start();
    await vi.advanceTimersByTimeAsync(30_000);
    expect(dispatch).toHaveBeenCalledTimes(matches ? 1 : 0);
  } finally {
    await loop.stop();
    vi.useRealTimers();
  }
});
