import * as v from "valibot";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { InvocationIdentity } from "../auth/context";
import type { FunctionCall, RuntimeFunction } from "../dispatch";
import { isRegisteredFunction } from "../functions/definition";
import { jobCall } from "./contracts";
import type { ClaimedJob, JobScheduleOptions } from "./contracts";
import { createDurableJobQueue } from "./durable-queue";
import type { DurableQueueOptions } from "./durable-queue";

export interface JobQueueOptions extends Omit<
  DurableQueueOptions<v.InferOutput<typeof jobCall>>,
  "parseCall" | "prepare"
> {
  readonly functions: Readonly<Record<string, RuntimeFunction>>;
}

/** Compatibility adapter for stored legacy calls while native projects migrate. */
export function createJobQueue(options: JobQueueOptions) {
  const functions = new Map(Object.entries(options.functions));
  for (const definition of functions.values())
    if (!isRegisteredFunction(definition)) throw new Error("Invalid job registry entry");
  const queue = createDurableJobQueue({
    ...options,
    parseCall: (input) => v.parse(jobCall, input),
    prepare: async (call) => {
      const definition = functions.get(call.name);
      if (!definition || definition.kind !== call.kind) throw new Error("Job function not found");
      await definition.prepare(call.args);
    },
  });
  return {
    ...queue,
    async enqueue(
      transaction: NodePgDatabase,
      input: FunctionCall,
      identity: InvocationIdentity | null,
      scheduling: JobScheduleOptions,
      requiredVisibility?: "internal",
    ) {
      const call = v.parse(jobCall, {
        name: input.name,
        kind: input.kind,
        version: input.version,
        args: structuredClone(input.args),
      });
      const definition = functions.get(call.name);
      if (requiredVisibility && definition?.visibility !== requiredVisibility)
        throw new Error("Scheduling requires an internal function");
      return queue.enqueue(transaction, call, identity, scheduling);
    },
    async claim(owner: string, seconds: number): Promise<ClaimedJob | null> {
      const saved = await queue.claim(owner, seconds);
      return saved ? { ...saved, call: { ...saved.call, idempotencyKey: saved.id } } : null;
    },
  };
}
