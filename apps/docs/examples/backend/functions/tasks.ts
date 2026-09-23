import { action, FunctionAccessDenied, mutation, query } from "@loom/core/server";
import * as v from "valibot";
import schema from "../schema";
import relations from "../relations";

const { tasks } = schema.tables;

export const list = query({
  relations,
  args: v.strictObject({}),
  returns: v.array(v.strictObject({ _id: v.pipe(v.string(), v.uuid()), title: v.string(), done: v.boolean() })),
  handler: async ({ db, identity }) => {
    if (!identity) throw new FunctionAccessDenied();
    return db.query.tasks.findMany({
      columns: { _id: true, title: true, done: true },
      where: { ownerId: identity.subject, ownerIssuer: identity.issuer },
      orderBy: { _createdAt: "asc", _id: "asc" },
      limit: 100,
    });
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
