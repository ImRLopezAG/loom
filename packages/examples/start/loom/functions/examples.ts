import { and, eq, desc } from "drizzle-orm";
import { auth } from "../_generated/rpc";
export default auth.examples.router({
  greeting: auth.examples.greeting.handler(({ input, context }) => ({
    message: `${context.env.GREETING_PREFIX}, ${input.name}!`,
    owner: context.user.subject,
  })),
  notes: auth.examples.notes.handler(({ context }) =>
    context.db
      .select({ _id: context.tables.notes._id, text: context.tables.notes.text })
      .from(context.tables.notes)
      .where(
        and(eq(context.tables.notes.owner, context.user.subject), eq(context.tables.notes.issuer, context.user.issuer)),
      )
      .orderBy(desc(context.tables.notes._createdAt), desc(context.tables.notes._id))
      .limit(50),
  ),
  add: auth.examples.add.handler(async ({ input, context, errors }) => {
    const [note] = await context.db
      .insert(context.tables.notes)
      .values({ ...input, owner: context.user.subject, issuer: context.user.issuer })
      .returning({ _id: context.tables.notes._id, text: context.tables.notes.text });
    if (!note) throw errors.REJECTED();
    return note;
  }),
  watch: auth.examples.watch.handler(({ context }) =>
    context.live(({ db, tables, identity }) => {
      if (!identity) throw new Error("Authentication required");
      return db
        .select({ _id: tables.notes._id, text: tables.notes.text })
        .from(tables.notes)
        .where(and(eq(tables.notes.owner, identity.subject), eq(tables.notes.issuer, identity.issuer)))
        .orderBy(desc(tables.notes._createdAt), desc(tables.notes._id))
        .limit(50);
    }),
  ),
});
