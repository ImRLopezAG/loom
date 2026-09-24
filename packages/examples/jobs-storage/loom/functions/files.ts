import { procedure, databaseRead } from "../_generated/server";
import { clientMode } from "@loom/core/server";
import { ORPCError } from "@orpc/server";
import type { InvocationIdentity } from "@loom/core/server";
import { and, eq, sql } from "drizzle-orm";
import * as v from "valibot";
import schema from "../schema";

const { files } = schema.tables;
const intentArgs = v.strictObject({ intentId: v.pipe(v.string(), v.uuid()) });
const jobStatus = v.strictObject({
  state: v.picklist(["pending", "running", "succeeded", "failed", "cancelled"]),
  attempts: v.number(),
});
function owned(identity: InvocationIdentity | null) {
  if (!identity) throw new ORPCError("FORBIDDEN");
  return and(
    eq(files.ownerIssuer, identity.issuer),
    eq(files.ownerId, identity.subject),
    eq(files.ownerTenant, identity.tenantId ?? ""),
  );
}

export const list = procedure
  .meta(clientMode("live"))
  .input(v.strictObject({}))
  .use(databaseRead)
  .handler(({ context: { db, identity } }) =>
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
  );

export const status = procedure
  .meta(clientMode("finite"))
  .input(intentArgs)
  .use(databaseRead)
  .handler(async ({ context: { db, identity }, input: { intentId } }) => {
    const [file] = await db
      .select({ jobId: files.jobId })
      .from(files)
      .where(and(owned(identity), eq(files.intentId, intentId)));
    if (!file) throw new ORPCError("FORBIDDEN");
    if (!file.jobId) return null;
    // This example uses the default metadata namespace from its independent config.
    const result = await db.execute(sql`SELECT state, attempts FROM loom_meta.jobs WHERE id = ${file.jobId}::uuid`);
    const [job] = v.parse(v.array(jobStatus), result.rows);
    return job ?? null;
  });
