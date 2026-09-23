import { action, FunctionAccessDenied, mutation, query } from "@loom/core/server";
import { and, eq } from "drizzle-orm";
import * as v from "valibot";
import { schema } from "./schema";

const { tasks } = schema.tables;

export const list = query({
  args: v.strictObject({}),
  returns: v.array(v.strictObject({ _id: v.pipe(v.string(), v.uuid()), title: v.string(), done: v.boolean() })),
  handler: async ({ db, identity }) => {
    if (!identity) throw new FunctionAccessDenied();
    return db
      .select({ _id: tasks._id, title: tasks.title, done: tasks.done })
      .from(tasks)
      .where(and(eq(tasks.ownerId, identity.subject), eq(tasks.ownerIssuer, identity.issuer)))
      .orderBy(tasks._createdAt, tasks._id)
      .limit(100);
  },
});

export const create = mutation({
  args: schema.validators.tasks.command,
  returns: schema.validators.tasks.public,
  handler: async ({ db, identity }, args) => {
    if (!identity) throw new FunctionAccessDenied();
    const [task] = await db
      .insert(tasks)
      .values({ ...args, ownerId: identity.subject, ownerIssuer: identity.issuer })
      .returning();
    if (!task) throw new Error("Task insert did not return a row");
    return task;
  },
});

export const greeting = action({
  args: v.strictObject({ name: v.pipe(v.string(), v.minLength(1)) }),
  returns: v.string(),
  handler: (_context, { name }) => `Hello, ${name}`,
});
