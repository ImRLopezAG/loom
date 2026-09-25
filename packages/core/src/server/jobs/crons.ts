import { cronScheduleValidator, createDurableCronDispatcher } from "./durable-crons";
import type { CronPolicy, CronEnqueue } from "./durable-crons";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import type { FunctionReference } from "../../client/reference";
import { wire } from "../../validation/encoding";
import { jobCall, scheduleOptions } from "./contracts";
import type { SchedulerBackend } from "./scheduler";

import type { IdempotencyOptions } from "../idempotency";

const definition = v.object({
  schedule: cronScheduleValidator,
  call: jobCall,
  maxAttempts: scheduleOptions.entries.maxAttempts,
  retryDelaySeconds: v.optional(scheduleOptions.entries.retryDelaySeconds.wrapped),
});
export type CronDefinition = v.InferOutput<typeof definition>;
export type CronDeclarations = Readonly<Record<string, CronDefinition>>;

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
  readonly assertIngress?: (signal: AbortSignal, transaction: NodePgDatabase) => Promise<void>;
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

export function createCronDispatcher(options: CronDispatcherOptions) {
  const queue = options.queue;
  const crons = new Map<string, CronEnqueue>();
  for (const [name, configured] of Object.entries(
    v.parse(v.record(cronName, definition), structuredClone(options.crons)),
  )) {
    crons.set(name, (transaction, dueAt, deduplicationKey) =>
      queue.enqueue(
        transaction,
        configured.call,
        null,
        {
          dueAt,
          deduplicationKey,
          maxAttempts: configured.maxAttempts,
          retryDelaySeconds: configured.retryDelaySeconds,
        },
        "internal",
      ),
    );
  }
  return createDurableCronDispatcher({ ...options, crons });
}

export { cronScheduleValidator } from "./durable-crons";
export type { CronPolicy, TriggerDeliveryReceipt } from "./durable-crons";
