import * as v from "valibot";
import type { DispatchResponse, FunctionCall } from "../dispatch";
import type { InvocationIdentity, JobInvocation } from "../auth/context";
import type { createJobQueue } from "./queue";
import { leaseDuration, leaseOwner } from "./contracts";
import type { ClaimedJob } from "./contracts";

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
export interface JobRunResult {
  claimed: number;
  completed: number;
  /** Failed attempts may be rescheduled by the stored retry policy. */
  failed: number;
  leaseLost: number;
}
export class JobWorkerError extends Error {
  constructor(readonly code: "ACTIVATION_DENIED" | "QUEUE_UNAVAILABLE") {
    super(code);
  }
}

/** One bounded execution slot. Provider wake-ups may overlap; calls on the same worker join one pass. */
export function createJobWorker(options: JobWorkerOptions) {
  const owner = v.parse(leaseOwner, options.owner ?? crypto.randomUUID());
  const seconds = v.parse(leaseDuration, options.leaseSeconds ?? 30);
  const queue = Object.freeze({ ...options.queue });
  const dispatcher = options.dispatcher;
  const assertActive = options.assertActive;
  let running: Promise<JobRunResult> | undefined;
  let active: AbortController | undefined;
  let stopped = false;
  let stopping: Promise<void> | undefined;

  async function verifyActive(signal: AbortSignal): Promise<void> {
    try {
      await assertActive(signal);
    } catch {
      throw new JobWorkerError("ACTIVATION_DENIED");
    }
  }

  async function execute(job: ClaimedJob, parent: AbortSignal): Promise<"completed" | "failed" | "leaseLost"> {
    const expired = new AbortController();
    const signal = AbortSignal.any([parent, expired.signal]);
    let finished = false;
    let heartbeat: ReturnType<typeof setTimeout> | undefined;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    let renewing: Promise<boolean> | undefined;
    let renewalFailure: JobWorkerError | undefined;
    function armDeadline(milliseconds: number): void {
      clearTimeout(deadline);
      deadline = setTimeout(() => expired.abort(), Math.max(0, milliseconds));
    }
    async function renew(): Promise<boolean> {
      try {
        if (signal.aborted || finished) return false;
        await verifyActive(signal);
        if (signal.aborted || finished) return false;
        const started = performance.now();
        const owned = await queue.renew(job, seconds);
        if (signal.aborted || finished) return false;
        const remaining = seconds * 1000 - (performance.now() - started);
        if (!owned || remaining <= 0) {
          expired.abort();
          return false;
        }
        armDeadline(remaining);
        return true;
      } catch (cause) {
        renewalFailure = cause instanceof JobWorkerError ? cause : new JobWorkerError("QUEUE_UNAVAILABLE");
        expired.abort();
        return false;
      }
    }
    function scheduleHeartbeat(): void {
      heartbeat = setTimeout(
        () => {
          renewing = renew().then((owned) => {
            if (owned && !finished) scheduleHeartbeat();
            return owned;
          });
        },
        Math.floor((seconds * 1000) / 3),
      );
    }
    let response: DispatchResponse | undefined;
    armDeadline(seconds * 1000);
    try {
      if (await renew()) {
        scheduleHeartbeat();
        try {
          response = await dispatcher.internal(job.call, job.identity, signal, { id: job.id, attempt: job.attempt });
        } catch {
          response = {
            ok: false,
            requestId: crypto.randomUUID(),
            error: { code: signal.aborted ? "CANCELLED" : "INTERNAL", message: "Job execution failed" },
          };
        }
      }
    } finally {
      finished = true;
      clearTimeout(heartbeat);
      clearTimeout(deadline);
      await renewing;
    }
    if (renewalFailure) throw renewalFailure;
    if (!response) return "leaseLost";
    try {
      if (response.ok) return (await queue.complete(job, response.value)) ? "completed" : "leaseLost";
      return (await queue.fail(job, response.error.code)) ? "failed" : "leaseLost";
    } catch {
      // A failed acknowledgement leaves the lease recoverable, including an already committed mutation.
      throw new JobWorkerError("QUEUE_UNAVAILABLE");
    }
  }

  async function runPass(limit: number, signal: AbortSignal): Promise<JobRunResult> {
    const result = { claimed: 0, completed: 0, failed: 0, leaseLost: 0 };
    while (result.claimed < limit && !signal.aborted) {
      await verifyActive(signal);
      if (signal.aborted) break;
      let job: ClaimedJob | null;
      try {
        job = await queue.claim(owner, seconds);
      } catch {
        throw new JobWorkerError("QUEUE_UNAVAILABLE");
      }
      if (!job) break;
      result.claimed++;
      const outcome = await execute(job, signal);
      result[outcome]++;
    }
    return result;
  }

  return {
    run(maxJobs = 10): Promise<JobRunResult> {
      if (!Number.isInteger(maxJobs) || maxJobs < 1 || maxJobs > 100)
        return Promise.reject(new Error("maxJobs must be an integer from 1 to 100"));
      if (stopped) return Promise.reject(new Error("Job worker stopped"));
      if (running) return running;
      const controller = new AbortController();
      active = controller;
      running = Promise.resolve()
        .then(() => runPass(maxJobs, controller.signal))
        .finally(() => {
          active = undefined;
          running = undefined;
        });
      return running;
    },
    stop(): Promise<void> {
      if (stopping) return stopping;
      stopped = true;
      const pending = running;
      stopping = Promise.resolve().then(async () => {
        await pending?.catch(() => undefined);
      });
      active?.abort();
      return stopping;
    },
  };
}
