import { Effect } from "effect";
import { and, eq, desc } from "drizzle-orm";
import { auth } from "../_generated/rpc";
import { Database, Tables } from "../_generated/server";
import { Greeting } from "../services";
export default auth.examples.router({
  greeting: auth.examples.greeting.effect(function* ({ input, context }) {
    const greeting = yield* Greeting;
    return { message: `${greeting.prefix}, ${input.name}!`, owner: context.user.subject };
  }),
  notes: auth.examples.notes.effect(function* ({ context }) {
    const db = yield* Database;
    const tables = yield* Tables;
    return yield* Effect.promise(() =>
      db
        .select({ _id: tables.notes._id, text: tables.notes.text })
        .from(tables.notes)
        .where(and(eq(tables.notes.owner, context.user.subject), eq(tables.notes.issuer, context.user.issuer)))
        .orderBy(desc(tables.notes._createdAt), desc(tables.notes._id))
        .limit(50),
    );
  }),
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
