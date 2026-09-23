import { FunctionAccessDenied, internalMutation, query, storageObjectCreatedValidator } from "@loom/core/server";
import type { InvocationIdentity } from "@loom/core/server";
import { and, eq, sql } from "drizzle-orm";
import * as v from "valibot";
import { internal } from "../_generated/internal";
import schema from "../schema";

const { files } = schema.tables;
const intentArgs = v.strictObject({ intentId: v.pipe(v.string(), v.uuid()) });
const jobStatus = v.strictObject({
  state: v.picklist(["pending", "running", "succeeded", "failed", "cancelled"]),
  attempts: v.number(),
});
function owned(identity: InvocationIdentity | null) {
  if (!identity) throw new FunctionAccessDenied();
  return and(
    eq(files.ownerIssuer, identity.issuer),
    eq(files.ownerId, identity.subject),
    eq(files.ownerTenant, identity.tenantId ?? ""),
  );
}

export const list = query({
  args: v.strictObject({}),
  returns: v.array(
    v.strictObject({
      _id: v.pipe(v.string(), v.uuid()),
      intentId: v.pipe(v.string(), v.uuid()),
      bucket: v.string(),
      size: v.number(),
      contentType: v.string(),
      sha256: v.string(),
      summary: v.nullable(v.string()),
    }),
  ),
  handler: ({ db, identity }) =>
    db
      .select({
        _id: files._id,
        intentId: files.intentId,
        bucket: files.bucket,
        size: files.size,
        contentType: files.contentType,
        sha256: files.sha256,
        summary: files.summary,
      })
      .from(files)
      .where(owned(identity))
      .orderBy(files._createdAt, files._id)
      .limit(100),
});

export const status = query({
  args: intentArgs,
  returns: v.nullable(jobStatus),
  handler: async ({ db, identity }, { intentId }) => {
    const [file] = await db
      .select({ jobId: files.jobId })
      .from(files)
      .where(and(owned(identity), eq(files.intentId, intentId)));
    if (!file) throw new FunctionAccessDenied();
    if (!file.jobId) return null;
    // This example uses the default metadata namespace from its independent config.
    const result = await db.execute(sql`SELECT state, attempts FROM loom_meta.jobs WHERE id = ${file.jobId}::uuid`);
    const [job] = v.parse(v.array(jobStatus), result.rows);
    return job ?? null;
  },
});

export const created = internalMutation({
  args: storageObjectCreatedValidator,
  returns: v.null(),
  handler: async ({ db, scheduler, job }, event): Promise<null> => {
    if (!job) throw new FunctionAccessDenied();
    const [inserted] = await db
      .insert(files)
      .values({
        intentId: event.intentId,
        ownerIssuer: event.uploadedBy.issuer,
        ownerId: event.uploadedBy.subject,
        ownerTenant: event.uploadedBy.tenantId ?? "",
        bucket: event.bucket,
        size: event.size,
        contentType: event.contentType,
        sha256: event.sha256,
      })
      .onConflictDoNothing({ target: files.intentId })
      .returning({ _id: files._id });
    if (!inserted) return null;
    const jobId = await scheduler.runAfter(
      0,
      internal["files:process"],
      { intentId: event.intentId },
      {
        deduplicationKey: `catalog:${event.intentId}`,
        maxAttempts: 3,
        retryDelaySeconds: 2,
      },
    );
    await db.update(files).set({ jobId }).where(eq(files._id, inserted._id));
    return null;
  },
});

export const process = internalMutation({
  args: intentArgs,
  returns: v.null(),
  handler: async ({ db, job }, { intentId }): Promise<null> => {
    if (!job) throw new FunctionAccessDenied();
    const [file] = await db
      .select({
        _id: files._id,
        bucket: files.bucket,
        contentType: files.contentType,
        size: files.size,
        sha256: files.sha256,
      })
      .from(files)
      .where(eq(files.intentId, intentId));
    if (!file) throw new Error("Verified upload is missing");
    if (file.bucket === "failure-demo" || (file.bucket === "retry-demo" && job.attempt === 1)) {
      throw new Error("Intentional processing failure for the retry demonstration");
    }
    await db
      .update(files)
      .set({ summary: `Verified ${file.contentType} upload: ${file.size} bytes; SHA-256 ${file.sha256}.` })
      .where(eq(files._id, file._id));
    return null;
  },
});
