import type { FunctionScheduler, FunctionContext, ActionContext } from "@loom/core/server";
import type { FunctionReference } from "@loom/core/client";

declare const scheduler: FunctionScheduler;
declare const write: FunctionReference<"mutation", "internal", { value: number }, null>;
declare const send: FunctionReference<"action", "internal", { message: string }, null>;
declare const read: FunctionReference<"query", "internal", null, string>;
declare const publicWrite: FunctionReference<"mutation", "public", { value: number }, null>;
const id: Promise<string> = scheduler.runAt(new Date(), write, { value: 1 });
void id;
void scheduler.runAfter(5000, send, { message: "hello" }, { maxAttempts: 2 });
// @ts-expect-error Scheduling arguments are inferred from the reference.
void scheduler.runAfter(0, write, { value: "invalid" });
// @ts-expect-error Queries cannot be scheduled.
void scheduler.runAfter(0, read, null);
// @ts-expect-error Only internal references can be scheduled.
void scheduler.runAt(0, publicWrite, { value: 1 });
declare const context: FunctionContext;
void context.scheduler.runAfter(0, write, { value: 1 });
declare const action: ActionContext;
// @ts-expect-error Actions do not own a database transaction for scheduling.
void action.scheduler;
