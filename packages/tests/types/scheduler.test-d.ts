import { createProjectProcedures, defineSchema, procedureCron } from "@loom/core/server";
import type { RpcScheduler } from "@loom/core/server";
import * as v from "valibot";

const { procedure } = createProjectProcedures(defineSchema(() => ({})));
const task = procedure.input(v.object({ value: v.number() })).handler(() => null);
const transformed = procedure.input(v.pipe(v.string(), v.transform(Number))).handler(() => null);
declare const scheduler: RpcScheduler;
const id: Promise<string> = scheduler.runAt(new Date(), task, { value: 1 });
void id;
void scheduler.runAfter(5000, transformed, "42", { maxAttempts: 2 });
// @ts-expect-error Scheduling arguments are inferred from the procedure.
void scheduler.runAfter(0, task, { value: "invalid" });
// @ts-expect-error Scheduling stores wire input for later validation and transformation.
void scheduler.runAfter(0, transformed, 42);
void procedureCron("0 9 * * 1-5", task, { value: 1 });
// @ts-expect-error Cron arguments come from the native procedure.
void procedureCron("* * * * *", task, { value: "invalid" });
// Visibility belongs to the generated graph; rpc-capabilities tests reject public targets at compilation.
