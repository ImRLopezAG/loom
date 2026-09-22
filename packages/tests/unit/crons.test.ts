import { expect, test } from "vite-plus/test";
import { cron } from "@loom/core/server";
import type { FunctionReference } from "@loom/core/client";

const reference: FunctionReference<"mutation", "internal", { value: number }, null> = {
  name: "jobs:write",
  kind: "mutation",
  visibility: "internal",
  version: "a".repeat(64),
};

test("cron declarations capture typed arguments and bounded policy with numeric UTC schedules", () => {
  const args = { value: 1 };
  const declared = cron("*/15 0-23 1,15 * 0-6", reference, args, { maxAttempts: 2 });
  args.value = 2;
  expect(declared.call.args).toEqual({ value: 1 });
  expect(declared.schedule).toBe("*/15 0-23 1,15 * 0-6");
  expect(declared.maxAttempts).toBe(2);
  expect(declared.retryDelaySeconds).toBeUndefined();
  expect(cron("* * * * *", reference, args, { retryDelaySeconds: 0 }).retryDelaySeconds).toBe(0);
  expect(Object.isFrozen(declared)).toBe(true);
  for (const invalid of [
    "@daily",
    "* * * * * *",
    "60 * * * *",
    "0 24 * * *",
    "0 0 0 * *",
    "0 0 * 13 *",
    "0 0 * * 8",
    "*/0 * * * *",
    "5-1 * * * *",
    "0 0 * * MON",
    "1,,2 * * * *",
  ])
    expect(() => cron(invalid, reference, args)).toThrow();
  expect(() => cron("* * * * *", reference, args, { maxAttempts: 11 })).toThrow();
});
