import * as v from "valibot";
import type { FunctionReference } from "../../client/reference";
import { jobCall, scheduleOptions } from "../jobs/contracts";
import type { SchedulerBackend } from "../jobs/scheduler";
import { storageUploadValidator } from "./contracts";
import type { StorageObjectCreatedEvent } from "./contracts";
import { createDurableStorageEventDispatcher } from "./durable-events";
import type { DurableStorageEventOptions, StorageEventEnqueue } from "./durable-events";
export type { StorageDelivery, StorageDeliveryResult } from "./durable-events";
export const storageHandlerValidator = v.strictObject({
  call: v.omit(jobCall, ["args"]),
  maxAttempts: scheduleOptions.entries.maxAttempts,
  retryDelaySeconds: scheduleOptions.entries.retryDelaySeconds,
});
export type StorageHandlerDefinition = v.InferOutput<typeof storageHandlerValidator>;
export function onObjectCreated<Input, Output>(
  reference: StorageObjectCreatedEvent extends Input
    ? FunctionReference<"mutation" | "action", "internal", Input, Output>
    : never,
  policy: Pick<v.InferInput<typeof scheduleOptions>, "maxAttempts" | "retryDelaySeconds"> = {},
): StorageHandlerDefinition {
  if (reference.visibility !== "internal") throw new Error("Storage handlers must be internal functions");
  return Object.freeze(
    v.parse(storageHandlerValidator, {
      call: { name: reference.name, kind: reference.kind, version: reference.version },
      maxAttempts: policy.maxAttempts,
      retryDelaySeconds: policy.retryDelaySeconds,
    }),
  );
}
export interface StorageEventDispatcherOptions extends Omit<DurableStorageEventOptions, "handlers"> {
  readonly queue: SchedulerBackend;
  readonly handlers: Readonly<Record<string, StorageHandlerDefinition>>;
}
/** Legacy declaration adapter; all receipt and upload state stays in the shared dispatcher. */
export function createStorageEventDispatcher(options: StorageEventDispatcherOptions) {
  const queue = options.queue;
  const handlers = v.parse(
    v.record(storageUploadValidator.entries.bucket, storageHandlerValidator),
    structuredClone(options.handlers),
  );
  const enqueue = new Map<string, StorageEventEnqueue>();
  for (const [bucket, handler] of Object.entries(handlers)) {
    enqueue.set(bucket, (transaction, event, dueAt, deduplicationKey) =>
      queue.enqueue(
        transaction,
        { ...handler.call, args: event },
        null,
        { dueAt, deduplicationKey, maxAttempts: handler.maxAttempts, retryDelaySeconds: handler.retryDelaySeconds },
        "internal",
      ),
    );
  }
  return createDurableStorageEventDispatcher({ ...options, handlers: enqueue });
}
