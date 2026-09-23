import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import type { FunctionReference } from "../../client/reference";
import { jobCall, scheduleOptions } from "../jobs/contracts";
import type { SchedulerBackend } from "../jobs/scheduler";
import { validateIdempotencyOptions } from "../idempotency";
import {
  storageIntentValidator,
  storageUploadValidator,
  storageOwnerValidator,
  storageObjectCreatedValidator,
  StorageVerificationError,
} from "./contracts";
import type { StorageObjectCreatedEvent } from "./contracts";
import type { createStorageIntents } from "./intents";
import { storageUploadPrefix } from "./keys";

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
const identifier = v.pipe(v.string(), v.minLength(1), v.maxLength(256));
const deliveryValidator = v.strictObject({
  invocationId: identifier,
  triggerId: identifier,
  triggerName: identifier,
  bucket: storageUploadValidator.entries.bucket,
  key: v.pipe(v.string(), v.minLength(1), v.maxLength(1024)),
});
export type StorageDelivery = v.InferOutput<typeof deliveryValidator>;
export interface StorageEventDispatcherOptions {
  readonly db: NodePgDatabase;
  readonly metadataNamespace: string;
  readonly deployment: string;
  readonly projectId: string;
  readonly branchId: string;
  readonly intents: Pick<ReturnType<typeof createStorageIntents>, "finalize">;
  readonly queue: SchedulerBackend;
  readonly handlers: Readonly<Record<string, StorageHandlerDefinition>>;
  readonly assertActive: (signal: AbortSignal, database?: NodePgDatabase) => Promise<void>;
  readonly assertIngress?: (signal: AbortSignal, transaction: NodePgDatabase) => Promise<void>;
}
const intentRow = v.object({
  id: storageIntentValidator.entries.id,
  upload: storageUploadValidator,
  owner_identity: storageOwnerValidator,
  state: v.picklist(["pending", "ready", "failed"]),
  event_job_id: v.nullable(storageIntentValidator.entries.id),
  created_ms: v.pipe(v.number(), v.safeInteger()),
});
const receiptRow = v.object({
  fingerprint: v.string(),
  state: v.picklist(["pending", "dispatched", "failed"]),
  job_id: v.nullable(storageIntentValidator.entries.id),
});
export type StorageDeliveryResult =
  | { readonly state: "dispatched"; readonly jobId: string }
  | { readonly state: "failed" };
function terminal(row: v.InferOutput<typeof receiptRow>): StorageDeliveryResult | undefined {
  if (row.state === "failed") return Object.freeze({ state: "failed" });
  if (row.state === "dispatched") {
    if (!row.job_id) throw new Error("Invalid storage receipt");
    return Object.freeze({ state: "dispatched", jobId: row.job_id });
  }
  return undefined;
}

/** Trusted provider ingress. Saved intent ownership is event data, never the queued job's identity. */
export function createStorageEventDispatcher(options: StorageEventDispatcherOptions) {
  validateIdempotencyOptions(options);
  const { db, deployment, intents, queue, assertActive, assertIngress } = options;
  const projectId = v.parse(identifier, options.projectId);
  const branchId = v.parse(identifier, options.branchId);
  const handlers = new Map(
    Object.entries(
      v.parse(
        v.record(storageUploadValidator.entries.bucket, storageHandlerValidator),
        structuredClone(options.handlers),
      ),
    ),
  );
  const prefix = storageUploadPrefix(projectId, branchId);
  const uploads = sql`${sql.identifier(options.metadataNamespace)}.${sql.identifier("storage_intents")}`;
  const receipts = sql`${sql.identifier(options.metadataNamespace)}.${sql.identifier("storage_receipts")}`;
  const scope = sql`deployment = ${deployment} AND project_id = ${projectId} AND branch_id = ${branchId}`;
  const columns = sql`id, upload, owner_identity, state, event_job_id, floor(extract(epoch FROM created_at) * 1000)::float8 AS created_ms`;
  async function active(signal: AbortSignal, database?: NodePgDatabase) {
    signal.throwIfAborted();
    await assertActive(signal, database);
    signal.throwIfAborted();
  }
  return Object.freeze({
    async receive(
      input: StorageDelivery,
      signal: AbortSignal = new AbortController().signal,
    ): Promise<StorageDeliveryResult> {
      const delivery = v.parse(deliveryValidator, input);
      const configured = handlers.get(delivery.bucket);
      if (!configured || !delivery.key.startsWith(prefix)) throw new Error("Unbound storage event");
      const id = v.parse(storageIntentValidator.entries.id, delivery.key.slice(prefix.length));
      if (delivery.key !== `${prefix}${id}`) throw new Error("Unbound storage event");
      const fingerprint = createHash("sha256")
        .update(JSON.stringify([delivery.triggerId, delivery.triggerName, delivery.bucket, delivery.key]))
        .digest("hex");
      await active(signal);
      if (assertIngress) await db.transaction((transaction) => assertIngress(signal, transaction));
      const found = await db.execute(sql`SELECT ${columns} FROM ${uploads} WHERE ${scope} AND id = ${id}::uuid`);
      const upload = v.parse(intentRow, found.rows[0]);
      if (upload.upload.bucket !== delivery.bucket) throw new Error("Unbound storage event");
      await db.execute(sql`INSERT INTO ${receipts} (deployment, project_id, branch_id, invocation_id, trigger_id, trigger_name, bucket, object_key, intent_id, fingerprint)
        VALUES (${deployment}, ${projectId}, ${branchId}, ${delivery.invocationId}, ${delivery.triggerId}, ${delivery.triggerName}, ${delivery.bucket}, ${delivery.key}, ${id}::uuid, ${fingerprint})
        ON CONFLICT (deployment, project_id, branch_id, invocation_id) DO NOTHING`);
      const recorded = await db.execute(
        sql`SELECT fingerprint, state, job_id FROM ${receipts} WHERE ${scope} AND invocation_id = ${delivery.invocationId}`,
      );
      const receipt = v.parse(receiptRow, recorded.rows[0]);
      if (receipt.fingerprint !== fingerprint) throw new Error("Storage invocation conflict");
      const complete = terminal(receipt);
      if (complete) return complete;
      if (upload.state !== "failed") {
        try {
          await intents.finalize(upload.owner_identity, id, signal);
        } catch (cause) {
          if (!(cause instanceof StorageVerificationError)) throw cause;
        }
      }
      await active(signal);
      return db.transaction(async (transaction) => {
        await assertIngress?.(signal, transaction);
        // Lock order is always intent then receipt, including different invocations for the same object.
        const locked = await transaction.execute(
          sql`SELECT ${columns} FROM ${uploads} WHERE ${scope} AND id = ${id}::uuid FOR UPDATE`,
        );
        const current = v.parse(intentRow, locked.rows[0]);
        const saved = await transaction.execute(
          sql`SELECT fingerprint, state, job_id FROM ${receipts} WHERE ${scope} AND invocation_id = ${delivery.invocationId} FOR UPDATE`,
        );
        const currentReceipt = v.parse(receiptRow, saved.rows[0]);
        if (currentReceipt.fingerprint !== fingerprint) throw new Error("Storage invocation conflict");
        const done = terminal(currentReceipt);
        if (done) return done;
        await active(signal, transaction);
        if (current.state === "failed") {
          await transaction.execute(
            sql`UPDATE ${receipts} SET state = 'failed' WHERE ${scope} AND invocation_id = ${delivery.invocationId}`,
          );
          return Object.freeze({ state: "failed" as const });
        }
        if (current.state !== "ready") throw new Error("Storage object is not verified");
        let jobId = current.event_job_id;
        if (!jobId) {
          const args = v.parse(storageObjectCreatedValidator, {
            intentId: id,
            ...current.upload,
            uploadedBy: current.owner_identity,
          });
          jobId = await queue.enqueue(
            transaction,
            { ...configured.call, args },
            null,
            {
              dueAt: new Date(current.created_ms),
              deduplicationKey: `storage:${id}`,
              maxAttempts: configured.maxAttempts,
              retryDelaySeconds: configured.retryDelaySeconds,
            },
            "internal",
          );
          await transaction.execute(
            sql`UPDATE ${uploads} SET event_job_id = ${jobId}::uuid WHERE ${scope} AND id = ${id}::uuid`,
          );
        }
        await transaction.execute(
          sql`UPDATE ${receipts} SET state = 'dispatched', job_id = ${jobId}::uuid WHERE ${scope} AND invocation_id = ${delivery.invocationId}`,
        );
        signal.throwIfAborted();
        return Object.freeze({ state: "dispatched" as const, jobId });
      });
    },
  });
}
