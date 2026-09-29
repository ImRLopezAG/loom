import { and, count, eq } from "drizzle-orm";
import { os } from "../_generated/rpc";

export default os.internal.counts.router({
  tasks: os.internal.counts.tasks.handler(async ({ context, errors }) => {
    const {
      identity,
      db,
      tables: { tasks },
    } = context;
    if (!identity) throw errors.UNAUTHORIZED();
    const [result] = await db
      .select({ total: count() })
      .from(tasks)
      .where(and(eq(tasks.ownerId, identity.subject), eq(tasks.ownerIssuer, identity.issuer)));
    return result?.total ?? 0;
  }),
});
