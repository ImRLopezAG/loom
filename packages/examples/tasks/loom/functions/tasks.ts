import { clientMode } from "@loom/core/server";
import { procedure, databaseRead, databaseWrite } from "../_generated/server";
import { ORPCError } from "@orpc/server";
import { and, eq, sql } from "drizzle-orm";
import * as v from "valibot";
import schema from "../schema";
import { ownedProjects, requireIdentity } from "../access";

const { projects, tasks } = schema.tables;
const id = schema.id("tasks");

export const list = procedure
  .meta(clientMode("live"))
  .input(v.strictObject({ projectId: schema.id("projects") }))
  .use(databaseRead)
  .handler(({ context: { db, identity }, input: args }) => {
    const owner = requireIdentity(identity);
    return db.query.tasks.findMany({
      columns: { _id: true, projectId: true, title: true, done: true },
      where: { projectId: { eq: args.projectId }, project: { ownerIssuer: owner.issuer, ownerId: owner.subject } },
      orderBy: { _createdAt: "asc", _id: "asc" },
      limit: 100,
    });
  });

export const create = procedure
  .meta(clientMode("mutation"))
  .input(schema.validators.tasks.insert)
  .use(databaseWrite)
  .handler(async ({ context: { db, identity }, input: args }) => {
    const [project] = await db
      .select({ _id: projects._id })
      .from(projects)
      .where(and(ownedProjects(identity), eq(projects._id, args.projectId)))
      .limit(1);
    if (!project) throw new ORPCError("FORBIDDEN");
    const [task] = await db
      .insert(tasks)
      .values(args)
      .returning({ _id: tasks._id, projectId: tasks.projectId, title: tasks.title, done: tasks.done });
    if (!task) throw new Error("Task insert did not return a row");
    return task;
  });

export const setDone = procedure
  .meta(clientMode("mutation"))
  .input(v.strictObject({ id, done: v.boolean() }))
  .use(databaseWrite)
  .handler(async ({ context: { db, identity }, input: args }) => {
    const [owned] = await db
      .select({ _id: tasks._id })
      .from(tasks)
      .innerJoin(projects, eq(tasks.projectId, projects._id))
      .where(and(ownedProjects(identity), eq(tasks._id, sql`${args.id}`)))
      .limit(1);
    if (!owned) throw new ORPCError("FORBIDDEN");
    const [task] = await db
      .update(tasks)
      .set({ done: args.done })
      .where(eq(tasks._id, owned._id))
      .returning({ _id: tasks._id, projectId: tasks.projectId, title: tasks.title, done: tasks.done });
    if (!task) throw new ORPCError("FORBIDDEN");
    return task;
  });
