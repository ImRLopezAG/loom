import { ORPCError } from "@orpc/server";
import { os } from "../_generated/rpc";

export default os.internal.tasks.router({
  create: os.internal.tasks.create.handler(async ({ context: { db, tables, job }, input }) => {
    if (!job) throw new ORPCError("FORBIDDEN");
    await db.insert(tables.tasks).values({
      title: input.title,
      ownerId: input.ownerId,
      ownerIssuer: input.ownerIssuer,
    });
    return null;
  }),
});
