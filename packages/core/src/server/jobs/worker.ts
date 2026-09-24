import type { DispatchResponse, FunctionCall } from "../dispatch";
import type { InvocationIdentity, JobInvocation } from "../auth/context";
import type { createJobQueue } from "./queue";

export interface JobWorkerOptions {
  readonly queue: Pick<ReturnType<typeof createJobQueue>, "claim" | "renew" | "complete" | "fail">;
  readonly dispatcher: {
    internal(
      call: FunctionCall,
      identity: InvocationIdentity | null,
      signal?: AbortSignal,
      job?: JobInvocation,
    ): Promise<DispatchResponse>;
  };
  /** Must verify the current branch/deployment authorization, not merely a copied activation row. */
  readonly assertActive: (signal: AbortSignal) => Promise<void>;
  readonly owner?: string;
  readonly leaseSeconds?: number;
}
export { JobWorkerError } from "./durable-worker";
export type { JobRunResult } from "./durable-worker";
import { createDurableJobWorker } from "./durable-worker";

/** Compatibility adapter; native and legacy jobs share lease ownership and shutdown. */
export function createJobWorker(options: JobWorkerOptions) {
  return createDurableJobWorker({
    ...options,
    execute: (job, signal) =>
      options.dispatcher.internal(job.call, job.identity, signal, { id: job.id, attempt: job.attempt }),
  });
}
