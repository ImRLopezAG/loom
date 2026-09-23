import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import type { InvocationIdentity } from "../auth/context";
import { validateIdempotencyOptions } from "../idempotency";
import {
  storageIntentValidator,
  storageUploadValidator,
  storageOwnerValidator,
  StorageVerificationError,
  StorageIntentError,
} from "./contracts";
import type { ObjectStorageBackend, StorageUpload } from "./contracts";

export interface StorageAuthorization {
  readonly identity: InvocationIdentity;
  readonly operation: "upload" | "read";
  readonly upload: StorageUpload;
  readonly signal: AbortSignal;
}
export interface StorageIntentsOptions {
  readonly db: NodePgDatabase;
  readonly metadataNamespace: string;
  readonly deployment: string;
  readonly projectId: string;
  readonly branchId: string;
  readonly buckets: readonly string[];
  readonly storage: ObjectStorageBackend;
  readonly assertActive: (signal: AbortSignal) => Promise<void>;
  /** Required application policy, in addition to owner and tenant isolation. Throw to deny. */
  readonly authorize: (context: StorageAuthorization) => void | Promise<void>;
}
const identifier = v.pipe(v.string(), v.minLength(1), v.maxLength(1024));
const uuid = storageIntentValidator.entries.id;
const rowValidator = v.object({
  id: uuid,
  upload: storageUploadValidator,
  state: v.picklist(["pending", "ready", "failed"]),
  error_code: v.nullable(v.picklist(["VERIFICATION_FAILED", "EXPIRED"])),
  fingerprint: v.string(),
  remaining: v.number(),
});
function digest(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

/** Trusted server capability: identity must come from the request verifier, never request arguments. */
export function createStorageIntents(options: StorageIntentsOptions) {
  validateIdempotencyOptions(options);
  const { db, deployment, storage, assertActive, authorize } = options;
  const projectId = v.parse(identifier, options.projectId);
  const branchId = v.parse(identifier, options.branchId);
  if (storage.target.projectId !== projectId || storage.target.branchId !== branchId)
    throw new Error("Storage provider target mismatch");
  const buckets = new Set(v.parse(v.array(storageUploadValidator.entries.bucket), [...options.buckets]));
  const table = sql`${sql.identifier(options.metadataNamespace)}.${sql.identifier("storage_intents")}`;
  const scope = sql`deployment = ${deployment} AND project_id = ${projectId} AND branch_id = ${branchId}`;
  const columns = sql`id, upload, state, error_code, fingerprint,
    floor(extract(epoch FROM upload_expires_at - clock_timestamp()))::float8 AS remaining`;
  function principal(input: InvocationIdentity) {
    const identity = Object.freeze(v.parse(storageOwnerValidator, input));
    return { identity, hash: digest(JSON.stringify([identity.issuer, identity.subject, identity.tenantId ?? null])) };
  }
  async function active(signal: AbortSignal) {
    signal.throwIfAborted();
    await assertActive(signal);
    signal.throwIfAborted();
  }
  async function permit(
    owner: ReturnType<typeof principal>,
    upload: StorageUpload,
    operation: "upload" | "read",
    signal: AbortSignal,
  ) {
    if (!buckets.has(upload.bucket)) throw new StorageIntentError("FORBIDDEN");
    try {
      await authorize(
        Object.freeze({ identity: owner.identity, operation, upload: Object.freeze({ ...upload }), signal }),
      );
    } catch {
      signal.throwIfAborted();
      throw new StorageIntentError("FORBIDDEN");
    }
    await active(signal);
  }
  function view(row: v.InferOutput<typeof rowValidator>) {
    return Object.freeze({ id: row.id, state: row.state, errorCode: row.error_code });
  }
  async function load(owner: ReturnType<typeof principal>, id: string) {
    const result = await db.execute(
      sql`SELECT ${columns} FROM ${table} WHERE ${scope} AND owner_hash = ${owner.hash} AND id = ${id}::uuid`,
    );
    const parsed = v.safeParse(rowValidator, result.rows[0]);
    if (!parsed.success) throw new StorageIntentError("FORBIDDEN");
    return parsed.output;
  }
  async function access(
    owner: ReturnType<typeof principal>,
    id: string,
    operation: "upload" | "read",
    signal: AbortSignal,
  ) {
    await active(signal);
    const row = await load(owner, id);
    await permit(owner, row.upload, operation, signal);
    return row;
  }
  return Object.freeze({
    async create(
      identity: InvocationIdentity,
      input: StorageUpload,
      requestKey: string,
      signal: AbortSignal = new AbortController().signal,
    ) {
      const owner = principal(identity);
      const upload = v.parse(storageUploadValidator, input);
      const key = v.parse(v.pipe(v.string(), v.regex(/^[a-zA-Z0-9_-]{1,128}$/)), requestKey);
      const fingerprint = digest(JSON.stringify(upload));
      const requestHash = digest(key);
      await active(signal);
      await permit(owner, upload, "upload", signal);
      await db.execute(sql`INSERT INTO ${table} (deployment, project_id, branch_id, owner_hash, owner_identity, request_hash, fingerprint, upload)
        VALUES (${deployment}, ${projectId}, ${branchId}, ${owner.hash}, ${JSON.stringify(owner.identity)}::jsonb, ${requestHash}, ${fingerprint}, ${JSON.stringify(upload)}::jsonb)
        ON CONFLICT (deployment, project_id, branch_id, owner_hash, request_hash) DO NOTHING`);
      // Separate read observes the winner after a concurrent INSERT conflict wait.
      const result = await db.execute(
        sql`SELECT ${columns} FROM ${table} WHERE ${scope} AND owner_hash = ${owner.hash} AND request_hash = ${requestHash}`,
      );
      const row = v.parse(rowValidator, result.rows[0]);
      if (row.fingerprint !== fingerprint) throw new StorageIntentError("IDEMPOTENCY_CONFLICT");
      return view(row);
    },
    async status(identity: InvocationIdentity, input: string, signal: AbortSignal = new AbortController().signal) {
      const owner = principal(identity);
      const id = v.parse(uuid, input);
      return view(await access(owner, id, "read", signal));
    },
    async signUpload(identity: InvocationIdentity, input: string, signal: AbortSignal = new AbortController().signal) {
      const owner = principal(identity);
      const id = v.parse(uuid, input);
      await access(owner, id, "upload", signal);
      const row = await load(owner, id);
      if (row.state !== "pending" || row.remaining < 1) throw new StorageIntentError("STORAGE_UNAVAILABLE");
      signal.throwIfAborted();
      return storage.signUpload({ id, ...row.upload }, Math.min(300, row.remaining));
    },
    async finalize(identity: InvocationIdentity, input: string, signal: AbortSignal = new AbortController().signal) {
      const owner = principal(identity);
      const id = v.parse(uuid, input);
      const row = await access(owner, id, "upload", signal);
      if (row.state === "ready") return view(row);
      if (row.state !== "pending") throw new StorageIntentError("STORAGE_UNAVAILABLE");
      try {
        await storage.sealUpload({ id, ...row.upload }, signal);
      } catch (cause) {
        if (cause instanceof StorageVerificationError) {
          await active(signal);
          await db.execute(sql`UPDATE ${table} SET state = 'failed', error_code = 'VERIFICATION_FAILED', updated_at = clock_timestamp()
            WHERE ${scope} AND id = ${id}::uuid AND owner_hash = ${owner.hash} AND state = 'pending'`);
        }
        throw cause;
      }
      await active(signal);
      const result =
        await db.execute(sql`UPDATE ${table} SET state = 'ready', error_code = NULL, updated_at = clock_timestamp()
        WHERE ${scope} AND id = ${id}::uuid AND owner_hash = ${owner.hash} AND state IN ('pending', 'ready') RETURNING ${columns}`);
      const completed = v.safeParse(rowValidator, result.rows[0]);
      if (!completed.success) throw new StorageIntentError("STORAGE_UNAVAILABLE");
      return view(completed.output);
    },
    async signDownload(
      identity: InvocationIdentity,
      input: string,
      signal: AbortSignal = new AbortController().signal,
    ) {
      const owner = principal(identity);
      const id = v.parse(uuid, input);
      const row = await access(owner, id, "read", signal);
      if (row.state !== "ready") throw new StorageIntentError("STORAGE_UNAVAILABLE");
      return storage.signDownload({ id, ...row.upload }, 60, signal);
    },
  });
}
