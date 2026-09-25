import * as v from "valibot";
import type { FunctionReference } from "../../client/reference";
import { wire } from "../../validation/encoding";
import type { FunctionCall } from "../dispatch";
import type { JobScheduleOptions, SchedulingPolicy } from "./contracts";
import type { createJobQueue } from "./queue";

export type SchedulerBackend = Pick<ReturnType<typeof createJobQueue>, "enqueue">;
export type { SchedulingPolicy } from "./contracts";

export interface FunctionScheduler {
  runAt<Input, Output>(
    timestamp: Date | number,
    reference: FunctionReference<"mutation" | "action", "internal", Input, Output>,
    args: NoInfer<Input>,
    policy?: SchedulingPolicy,
  ): Promise<string>;
  runAfter<Input, Output>(
    delayMs: number,
    reference: FunctionReference<"mutation" | "action", "internal", Input, Output>,
    args: NoInfer<Input>,
    policy?: SchedulingPolicy,
  ): Promise<string>;
}

const delay = v.pipe(v.number(), v.safeInteger(), v.minValue(0));
const timestamp = v.union([v.date(), v.pipe(v.number(), v.safeInteger())]);

/** The owner tracks work and dooms the parent transaction even if a handler catches a scheduling error. */
export function createFunctionScheduler(
  enqueue: (call: FunctionCall, policy: JobScheduleOptions) => Promise<string>,
  own: (work: () => Promise<string>) => Promise<string>,
): FunctionScheduler {
  function schedule<Input, Output>(
    dueAt: () => Date,
    reference: FunctionReference<"mutation" | "action", "internal", Input, Output>,
    args: Input,
    policy: SchedulingPolicy = {},
  ): Promise<string> {
    return own(async () => {
      if (reference.visibility !== "internal" || !["mutation", "action"].includes(reference.kind))
        throw new Error("Scheduling requires an internal mutation or action");
      return enqueue(
        { name: reference.name, kind: reference.kind, version: reference.version, args: v.parse(wire, args) },
        {
          dueAt: dueAt(),
          deduplicationKey: policy.deduplicationKey ?? crypto.randomUUID(),
          maxAttempts: policy.maxAttempts,
          retryDelaySeconds: policy.retryDelaySeconds,
        },
      );
    });
  }
  return Object.freeze<FunctionScheduler>({
    runAt: (at, reference, args, policy) =>
      schedule(() => v.parse(v.date(), new Date(v.parse(timestamp, at))), reference, args, policy),
    runAfter: (delayMs, reference, args, policy) =>
      schedule(() => v.parse(v.date(), new Date(Date.now() + v.parse(delay, delayMs))), reference, args, policy),
  });
}
