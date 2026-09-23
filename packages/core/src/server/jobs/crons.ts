import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import type { FunctionReference } from "../../client/reference";
import { wire } from "../../validation/encoding";
import { jobCall, scheduleOptions } from "./contracts";
import type { SchedulerBackend } from "./scheduler";

import { validateIdempotencyOptions } from "../idempotency";
import type { IdempotencyOptions } from "../idempotency";

const deliveryReceipt = v.strictObject({
  invocationId: v.pipe(v.string(), v.minLength(1), v.maxLength(256)),
  triggerId: v.pipe(v.string(), v.minLength(1), v.maxLength(256)),
  triggerName: v.pipe(v.string(), v.minLength(1), v.maxLength(256)),
});
export type TriggerDeliveryReceipt = v.InferOutput<typeof deliveryReceipt>;

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
export const cronScheduleValidator = v.pipe(
  v.string(),
  v.maxLength(200),
  v.check(validSchedule, "Invalid five-field UTC cron schedule"),
);
const definition = v.object({
  schedule: cronScheduleValidator,
  call: jobCall,
  maxAttempts: scheduleOptions.entries.maxAttempts,
  retryDelaySeconds: v.optional(scheduleOptions.entries.retryDelaySeconds.wrapped),
});
export type CronDefinition = v.InferOutput<typeof definition>;
export type CronDeclarations = Readonly<Record<string, CronDefinition>>;
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

export interface CronDispatcherOptions extends IdempotencyOptions {
  readonly db: NodePgDatabase;
  readonly queue: SchedulerBackend;
  readonly crons: CronDeclarations;
  /** Verify actual branch/deployment authorization before persisting an occurrence. */
  readonly assertActive: (signal: AbortSignal) => Promise<void>;
}
const cronName = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,127}$/));
const declarations = v.record(
  cronName,
  v.object({
    ...definition.entries,
    maxAttempts: scheduleOptions.entries.maxAttempts.wrapped,
  }),
);

/** Validate a loaded authoring module without supplying defaults that a type guard cannot materialize. */
export function isCronDeclarations(value: unknown): value is CronDeclarations {
  return v.is(declarations, value);
}

/** Trusted ingress after provider verification. Never infer or backfill occurrences that were not delivered. */
export function createCronDispatcher(options: CronDispatcherOptions) {
  validateIdempotencyOptions(options);
  const { db, queue, assertActive, deployment } = options;
  const receipts = sql`${sql.identifier(options.metadataNamespace)}.${sql.identifier("trigger_receipts")}`;
  async function record(
    transaction: NodePgDatabase,
    delivery: TriggerDeliveryReceipt,
    at: Date,
    kind: "cron" | "wake",
    jobId: string | null,
  ) {
    const fingerprint = createHash("sha256")
      .update(JSON.stringify([delivery.triggerId, delivery.triggerName, at.toISOString(), kind]))
      .digest("hex");
    await transaction.execute(sql`INSERT INTO ${receipts}
      (deployment, invocation_id, trigger_id, trigger_name, scheduled_at, kind, fingerprint, job_id)
      VALUES (${deployment}, ${delivery.invocationId}, ${delivery.triggerId}, ${delivery.triggerName}, ${at.toISOString()}::timestamptz, ${kind}, ${fingerprint}, ${jobId}::uuid)
      ON CONFLICT (deployment, invocation_id) DO NOTHING`);
    // A separate statement observes the winning insert after a concurrent conflict wait.
    const saved = await transaction.execute<{ fingerprint: string; job_id: string | null }>(sql`
      SELECT fingerprint, job_id FROM ${receipts} WHERE deployment = ${deployment} AND invocation_id = ${delivery.invocationId}`);
    if (saved.rows[0]?.fingerprint !== fingerprint || saved.rows[0]?.job_id !== jobId)
      throw new Error("Trigger invocation conflict");
  }
  const crons = new Map(Object.entries(v.parse(v.record(cronName, definition), structuredClone(options.crons))));
  return Object.freeze({
    async recordWake(
      input: TriggerDeliveryReceipt,
      scheduledAt: Date,
      signal: AbortSignal = new AbortController().signal,
    ): Promise<void> {
      const delivery = v.parse(deliveryReceipt, structuredClone(input));
      const at = new Date(v.parse(v.date(), scheduledAt).getTime());
      signal.throwIfAborted();
      await assertActive(signal);
      signal.throwIfAborted();
      await db.transaction(async (transaction) => {
        await record(transaction, delivery, at, "wake", null);
      });
    },
    async dispatch(
      name: string,
      scheduledAt: Date,
      signal: AbortSignal = new AbortController().signal,
      input?: TriggerDeliveryReceipt,
    ): Promise<string> {
      signal.throwIfAborted();
      const delivery = input ? v.parse(deliveryReceipt, structuredClone(input)) : undefined;
      const occurrence = new Date(v.parse(v.date(), scheduledAt).getTime());
      const configured = crons.get(name);
      if (!configured) throw new Error("Cron is not configured");
      const key = createHash("sha256")
        .update(JSON.stringify([name, occurrence.toISOString()]))
        .digest("hex");
      await assertActive(signal);
      signal.throwIfAborted();
      const enqueue = async (transaction: NodePgDatabase) => {
        return queue.enqueue(
          transaction,
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
      };
      if (!delivery) return enqueue(db);
      return db.transaction(async (transaction) => {
        const jobId = await enqueue(transaction);
        signal.throwIfAborted();
        await record(transaction, delivery, occurrence, "cron", jobId);
        return jobId;
      });
    },
  });
}
