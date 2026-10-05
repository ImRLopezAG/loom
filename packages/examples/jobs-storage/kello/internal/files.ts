import { os } from "../_generated/rpc";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";

const created = os.internal.files.created.handler(
  async ({
    context: {
      db,
      scheduler,
      job,
      tables: { files },
    },
    input: event,
  }): Promise<null> => {
    if (!job) throw new ORPCError("FORBIDDEN");
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
      filesRouter.process,
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
);

const process = os.internal.files.process.handler(
  async ({
    context: {
      db,
      job,
      tables: { files },
    },
    input: { intentId },
  }): Promise<null> => {
    if (!job) throw new ORPCError("FORBIDDEN");
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
);

const filesRouter = os.internal.files.router({ created, process });
export default filesRouter;
