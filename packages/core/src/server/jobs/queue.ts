import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import type { JsonValue } from "../../schema/fields";
import { canonical } from "../../validation/canonical";
import { json } from "../../validation/encoding";
import type { InvocationIdentity } from "../auth/context";
import type { FunctionCall, RuntimeFunction } from "../dispatch";
import { isRegisteredFunction } from "../functions/definition";
import { validateIdempotencyOptions } from "../idempotency";
import type { IdempotencyOptions } from "../idempotency";
import {
  claimedJob,
  jobCall,
  jobFailure,
  jobId,
  jobIdentity,
  jobLease,
  jobRecord,
  leaseDuration,
  leaseOwner,
  scheduleOptions,
} from "./contracts";
import type { ClaimedJob, JobFailureCode, JobLease, JobRecord, JobScheduleOptions } from "./contracts";

export interface JobQueueOptions extends IdempotencyOptions {
  readonly db: NodePgDatabase;
  readonly version: string;
  readonly functions: Readonly<Record<string, RuntimeFunction>>;
}

/** Trusted server capability. Enqueue with the mutation's transaction; never expose queue methods to clients. */
export function createJobQueue(options: JobQueueOptions) {
  validateIdempotencyOptions(options);
  const { db, deployment, version } = options;
  if (!/^[a-f0-9]{64}$/.test(version)) throw new Error("Invalid job registry version");
  const functions = new Map(Object.entries(options.functions));
  for (const definition of functions.values())
    if (!isRegisteredFunction(definition)) throw new Error("Invalid job registry entry");
  const table = sql`${sql.identifier(options.metadataNamespace)}.${sql.identifier("jobs")}`;

  async function fenced(lease: JobLease, update: SQL, condition: SQL = sql`TRUE`): Promise<boolean> {
    const captured = v.parse(jobLease, { id: lease.id, owner: lease.owner, token: lease.token });
    // Lock first, then check the clock: time spent waiting for a row lock cannot revive an expired lease.
    const result = await db.execute(sql`
      WITH locked AS MATERIALIZED (
        SELECT id, state, lease_owner, fencing_token, lease_expires_at, cancel_requested
        FROM ${table} WHERE deployment = ${deployment} AND id = ${captured.id}::uuid FOR UPDATE
      ), eligible AS MATERIALIZED (
        SELECT job.id FROM locked AS job WHERE job.state = 'running'
          AND job.lease_owner = ${captured.owner} AND job.fencing_token = ${captured.token}::bigint
          AND job.lease_expires_at > clock_timestamp() AND ${condition}
      )
      UPDATE ${table} AS job SET ${update} FROM eligible
      WHERE job.id = eligible.id AND job.deployment = ${deployment}
      RETURNING job.id
    `);
    return result.rows.length === 1;
  }

  return {
    async enqueue(
      transaction: NodePgDatabase,
      input: FunctionCall,
      identity: InvocationIdentity | null,
      scheduling: JobScheduleOptions,
    ): Promise<string> {
      const call = v.parse(jobCall, {
        name: input.name,
        kind: input.kind,
        version: input.version,
        args: structuredClone(input.args),
      });
      const principal = v.parse(jobIdentity, structuredClone(identity));
      const policy = v.parse(scheduleOptions, structuredClone(scheduling));
      if (call.version !== version) throw new Error("Job function version does not match registry");
      const definition = functions.get(call.name);
      if (!definition || definition.kind !== call.kind) throw new Error("Job function not found");
      const payload = JSON.stringify(call);
      if (Buffer.byteLength(payload) > 65536) throw new Error("Job arguments exceed 64 KiB");
      await definition.prepare(call.args);
      const fingerprint = createHash("sha256")
        .update(
          canonical({
            call,
            identity: principal,
            dueAt: policy.dueAt.toISOString(),
            maxAttempts: policy.maxAttempts,
            retryDelaySeconds: policy.retryDelaySeconds,
          }),
        )
        .digest("hex");
      const saved = await transaction.execute<{ id: string; fingerprint: string }>(sql`
        INSERT INTO ${table} (id, deployment, deduplication_key, fingerprint, call, identity, due_at, max_attempts, retry_delay_seconds)
        VALUES (${crypto.randomUUID()}::uuid, ${deployment}, ${policy.deduplicationKey}, ${fingerprint},
          ${payload}::jsonb, ${JSON.stringify(principal)}::jsonb, ${policy.dueAt.toISOString()}::timestamptz,
          ${policy.maxAttempts}, ${policy.retryDelaySeconds})
        ON CONFLICT (deployment, deduplication_key) DO UPDATE SET deduplication_key = EXCLUDED.deduplication_key
        RETURNING id, fingerprint
      `);
      const row = saved.rows[0];
      if (!row || row.fingerprint !== fingerprint) throw new Error("Job deduplication conflict");
      return row.id;
    },
    async claim(owner: string, seconds: number): Promise<ClaimedJob | null> {
      v.parse(leaseOwner, owner);
      v.parse(leaseDuration, seconds);
      // Reap at most 100 abandoned terminal attempts per call; no unbounded sweep or process-local recovery state.
      await db.execute(sql`
        WITH expired AS (
          SELECT id FROM ${table} WHERE deployment = ${deployment} AND state = 'running'
            AND lease_expires_at <= clock_timestamp() AND (cancel_requested OR attempts >= max_attempts)
          ORDER BY lease_expires_at, id LIMIT 100 FOR UPDATE SKIP LOCKED
        )
        UPDATE ${table} AS job SET state = CASE WHEN job.cancel_requested THEN 'cancelled' ELSE 'failed' END,
          error_code = CASE WHEN job.cancel_requested THEN 'CANCELLED' ELSE 'LEASE_EXPIRED' END,
          lease_owner = NULL, lease_expires_at = NULL
        FROM expired WHERE job.id = expired.id
      `);
      const result = await db.execute(sql`
        WITH candidate AS (
          SELECT id FROM ${table} WHERE deployment = ${deployment} AND NOT cancel_requested AND attempts < max_attempts
            AND ((state = 'pending' AND due_at <= clock_timestamp()) OR (state = 'running' AND lease_expires_at <= clock_timestamp()))
          ORDER BY due_at, id LIMIT 1 FOR UPDATE SKIP LOCKED
        )
        UPDATE ${table} AS job SET state = 'running', lease_owner = ${owner},
          lease_expires_at = clock_timestamp() + ${seconds} * interval '1 second',
          fencing_token = job.fencing_token + 1, attempts = job.attempts + 1
        FROM candidate WHERE job.id = candidate.id
        RETURNING job.id, job.lease_owner AS owner, job.fencing_token::text AS token, job.call, job.identity, job.attempts AS attempt
      `);
      const row = result.rows[0];
      if (!row) return null;
      const saved = v.parse(claimedJob, row);
      return { ...saved, call: { ...saved.call, idempotencyKey: saved.id } };
    },
    renew(lease: JobLease, seconds: number): Promise<boolean> {
      v.parse(leaseDuration, seconds);
      return fenced(
        lease,
        sql`lease_expires_at = clock_timestamp() + ${seconds} * interval '1 second'`,
        sql`NOT job.cancel_requested`,
      );
    },
    complete(lease: JobLease, result: JsonValue): Promise<boolean> {
      const payload = JSON.stringify(v.parse(json, result));
      if (Buffer.byteLength(payload) > 1048576) throw new Error("Job result exceeds 1 MiB");
      return fenced(
        lease,
        sql`state = 'succeeded', result = ${payload}::jsonb, error_code = NULL, lease_owner = NULL, lease_expires_at = NULL`,
      );
    },
    fail(lease: JobLease, errorCode: JobFailureCode): Promise<boolean> {
      v.parse(jobFailure, errorCode);
      return fenced(
        lease,
        sql`
        state = CASE WHEN job.cancel_requested THEN 'cancelled' WHEN job.attempts >= job.max_attempts THEN 'failed' ELSE 'pending' END,
        due_at = clock_timestamp() + job.retry_delay_seconds * interval '1 second',
        error_code = ${errorCode}, lease_owner = NULL, lease_expires_at = NULL
      `,
      );
    },
    async cancel(id: string): Promise<"cancelled" | "requested" | "finished" | "missing"> {
      v.parse(jobId, id);
      const result = await db.execute<{ state: string }>(sql`
        UPDATE ${table} SET cancel_requested = CASE WHEN state IN ('pending', 'running') THEN TRUE ELSE cancel_requested END,
          state = CASE WHEN state = 'pending' THEN 'cancelled' ELSE state END
        WHERE deployment = ${deployment} AND id = ${id}::uuid RETURNING state
      `);
      const row = result.rows[0];
      if (!row) return "missing";
      if (row.state === "running") return "requested";
      return row.state === "cancelled" ? "cancelled" : "finished";
    },
    async inspect(id: string): Promise<JobRecord | null> {
      v.parse(jobId, id);
      const result = await db.execute(sql`
        SELECT id, state, attempts, cancel_requested AS "cancelRequested", error_code AS "errorCode", result
        FROM ${table} WHERE deployment = ${deployment} AND id = ${id}::uuid
      `);
      return result.rows[0] ? v.parse(jobRecord, result.rows[0]) : null;
    },
  };
}
