import { mutation, query } from "../_generated/server";
import { FunctionAccessDenied } from "@loom/core/server";
import { and, eq, sql } from "drizzle-orm";
import * as v from "valibot";
import schema from "../schema";
import { ownedProjects, requireIdentity } from "../access";

const { projects, tasks } = schema.tables;
const id = schema.id("tasks");

export const list = query({
  args: v.strictObject({ projectId: schema.id("projects") }),
  handler: ({ db, identity }, args) => {
    const owner = requireIdentity(identity);
    return db.query.tasks.findMany({
      columns: { _id: true, projectId: true, title: true, done: true },
      where: { projectId: { eq: args.projectId }, project: { ownerIssuer: owner.issuer, ownerId: owner.subject } },
      orderBy: { _createdAt: "asc", _id: "asc" },
      limit: 100,
    });
  },
});

export const create = mutation({
  args: schema.validators.tasks.insert,
  returns: schema.validators.tasks.public,
  handler: async ({ db, identity }, args) => {
    const [project] = await db
      .select({ _id: projects._id })
      .from(projects)
      .where(and(ownedProjects(identity), eq(projects._id, args.projectId)))
      .limit(1);
    if (!project) throw new FunctionAccessDenied();
    const [task] = await db.insert(tasks).values(args).returning();
    if (!task) throw new Error("Task insert did not return a row");
    return task;
  },
});

export const setDone = mutation({
  args: v.strictObject({ id, done: v.boolean() }),
  returns: schema.validators.tasks.public,
  handler: async ({ db, identity }, args) => {
    const [owned] = await db
      .select({ _id: tasks._id })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects._id))
      .where(and(ownedProjects(identity), eq(tasks._id, sql`${args.id}`)))
      .limit(1);
    if (!owned) throw new FunctionAccessDenied();
    const [task] = await db.update(tasks).set({ done: args.done }).where(eq(tasks._id, owned._id)).returning();
    if (!task) throw new FunctionAccessDenied();
    return task;
  },
});
