import { procedure, databaseRead, databaseWrite, validators } from "../_generated/server";
import { clientMode } from "@loom/core/server";
import { ORPCError } from "@orpc/server";
import * as v from "valibot";

export const list = procedure
  .meta(clientMode("live"))
  .use(databaseRead)
  .handler(({ context: { db, identity } }) => {
    if (!identity) throw new ORPCError("UNAUTHORIZED");
    return db.query.tasks.findMany({
      columns: { _id: true, title: true, done: true },
      where: { ownerId: identity.subject, ownerIssuer: identity.issuer },
      orderBy: { _createdAt: "asc", _id: "asc" },
      limit: 100,
    });
  });

export const create = procedure
  .input(validators.tables.tasks.command)
  .output(validators.tables.tasks.public)
  .use(databaseWrite)
  .handler(async ({ context: { db, tables, identity }, input }) => {
    if (!identity) throw new ORPCError("UNAUTHORIZED");
    const [task] = await db
      .insert(tables.tasks)
      .values({ ...input, ownerId: identity.subject, ownerIssuer: identity.issuer })
      .returning();
    if (!task) throw new Error("Task insert did not return a row");
    return task;
  });

export const greeting = procedure
  .meta(clientMode("finite"))
  .input(v.strictObject({ name: v.pipe(v.string(), v.minLength(1)) }))
  .output(v.string())
  .handler(({ input }) => `Hello, ${input.name}`);
