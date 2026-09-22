import { createHash } from "node:crypto";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import type { FunctionReference } from "../../client/reference";
import { wire } from "../../validation/encoding";
import { jobCall, scheduleOptions } from "./contracts";
import type { SchedulerBackend } from "./scheduler";

const bounds = [
  [0, 59],
  [0, 23],
  [1, 31],
  [1, 12],
  [0, 7],
] as const;
function validSchedule(expression: string): boolean {
  const fields = expression.trim().split(/\s+/);
  if (fields.length !== 5) return false;
  return bounds.every(([minimum, maximum], index) => {
    const field = fields[index];
    return (
      field?.split(",").every((part) => {
        const match = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part);
        if (!match) return false;
        const step = Number(match[2] ?? 1);
        if (!Number.isSafeInteger(step) || step < 1) return false;
        if (match[1] === "*") return true;
        const range = match[1]?.split("-").map(Number);
        const start = range?.[0];
        const end = range?.[1] ?? start;
        return start !== undefined && end !== undefined && start >= minimum && end <= maximum && start <= end;
      }) ?? false
    );
  });
}
const schedule = v.pipe(v.string(), v.maxLength(200), v.check(validSchedule, "Invalid five-field UTC cron schedule"));
const definition = v.object({
  schedule,
  call: jobCall,
  maxAttempts: scheduleOptions.entries.maxAttempts,
  retryDelaySeconds: scheduleOptions.entries.retryDelaySeconds,
});
export type CronDefinition = v.InferOutput<typeof definition>;
export type CronPolicy = Pick<v.InferInput<typeof scheduleOptions>, "maxAttempts" | "retryDelaySeconds">;

/** Declare provider-evaluated UTC cron work. Arguments are captured at definition time. */
export function cron<Input, Output>(
  expression: string,
  reference: FunctionReference<"mutation" | "action", "internal", Input, Output>,
  args: NoInfer<Input>,
  policy: CronPolicy = {},
): CronDefinition {
  if (reference.visibility !== "internal") throw new Error("Cron requires an internal function");
  return Object.freeze(
    v.parse(definition, {
      schedule: expression,
      call: { name: reference.name, kind: reference.kind, version: reference.version, args: v.parse(wire, args) },
      maxAttempts: policy.maxAttempts,
      retryDelaySeconds: policy.retryDelaySeconds,
    }),
  );
}

export interface CronDispatcherOptions {
  readonly db: NodePgDatabase;
  readonly queue: SchedulerBackend;
  readonly crons: Readonly<Record<string, CronDefinition>>;
  /** Verify actual branch/deployment authorization before persisting an occurrence. */
  readonly assertActive: (signal: AbortSignal) => Promise<void>;
}
const cronName = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/));

/** Trusted ingress after provider verification. Never infer or backfill occurrences that were not delivered. */
export function createCronDispatcher(options: CronDispatcherOptions) {
  const { db, queue, assertActive } = options;
  const crons = new Map(Object.entries(v.parse(v.record(cronName, definition), structuredClone(options.crons))));
  return Object.freeze({
    async dispatch(
      name: string,
      scheduledAt: Date,
      signal: AbortSignal = new AbortController().signal,
    ): Promise<string> {
      signal.throwIfAborted();
      const occurrence = new Date(v.parse(v.date(), scheduledAt).getTime());
      const configured = crons.get(name);
      if (!configured) throw new Error("Cron is not configured");
      const key = createHash("sha256")
        .update(JSON.stringify([name, occurrence.toISOString()]))
        .digest("hex");
      await assertActive(signal);
      signal.throwIfAborted();
      return queue.enqueue(
        db,
        configured.call,
        null,
        {
          dueAt: occurrence,
          deduplicationKey: `cron:${key}`,
          maxAttempts: configured.maxAttempts,
          retryDelaySeconds: configured.retryDelaySeconds,
        },
        "internal",
      );
    },
  });
}
