import type { AnyProcedure, InferRouterInputs } from "@orpc/server";
import * as v from "valibot";
import { rpcValue } from "../rpc/serialization";
import { encodeRpcJobCall } from "./rpc-contracts";
import type { RpcJobCall } from "./rpc-contracts";
import type { InternalProcedureEntry } from "./rpc-queue";
import type { JobScheduleOptions } from "./contracts";
import type { SchedulingPolicy } from "./scheduler";

export interface RpcScheduler {
  runAt<P extends AnyProcedure>(
    at: Date | number,
    procedure: P,
    input: NoInfer<InferRouterInputs<P>>,
    policy?: SchedulingPolicy,
  ): Promise<string>;
  runAfter<P extends AnyProcedure>(
    delayMs: number,
    procedure: P,
    input: NoInfer<InferRouterInputs<P>>,
    policy?: SchedulingPolicy,
  ): Promise<string>;
}

/** Procedure identity is resolved through the generated internal graph. Public
 * procedures and lookalike objects cannot acquire scheduling authority. */
export function createRpcScheduler(
  version: string,
  internal: readonly InternalProcedureEntry[],
  enqueue: (call: RpcJobCall, policy: JobScheduleOptions) => Promise<string>,
  own: (work: () => Promise<string>) => Promise<string>,
): RpcScheduler {
  const paths = new Map<AnyProcedure, readonly string[]>();
  for (const entry of internal) {
    if (paths.has(entry.procedure)) throw new Error("Scheduled procedure has multiple internal paths");
    paths.set(entry.procedure, [...entry.path]);
  }
  function schedule<P extends AnyProcedure>(
    at: () => Date,
    procedure: P,
    input: InferRouterInputs<P>,
    policy: SchedulingPolicy = {},
  ) {
    return own(async () => {
      const path = paths.get(procedure);
      if (!path) throw new Error("Scheduling requires a registered internal procedure");
      return enqueue(encodeRpcJobCall(version, path, v.parse(rpcValue, input)), {
        dueAt: v.parse(v.date(), at()),
        deduplicationKey: policy.deduplicationKey ?? crypto.randomUUID(),
        maxAttempts: policy.maxAttempts,
        retryDelaySeconds: policy.retryDelaySeconds,
      });
    });
  }
  return Object.freeze<RpcScheduler>({
    runAt: (at, procedure, input, policy) => schedule(() => new Date(at), procedure, input, policy),
    runAfter: (delayMs, procedure, input, policy) =>
      schedule(
        () => {
          v.parse(v.pipe(v.number(), v.safeInteger(), v.minValue(0)), delayMs);
          return new Date(Date.now() + delayMs);
        },
        procedure,
        input,
        policy,
      ),
  });
}
