import { clientMode } from "@loom/core/server";
import { procedure, databaseRead, databaseWrite } from "../_generated/server";

import * as v from "valibot";
import schema from "../schema";
import { ownedProjects, requireIdentity } from "../access";

const { projects } = schema.tables;

export const list = procedure
  .meta(clientMode("live"))
  .input(v.strictObject({}))
  .use(databaseRead)
  .handler(({ context: { db, identity } }) =>
    db
      .select({ _id: projects._id, name: projects.name })
      .from(projects)
      .where(ownedProjects(identity))
      .orderBy(projects._createdAt, projects._id)
      .limit(100),
  );

export const create = procedure
  .meta(clientMode("mutation"))
  .input(schema.validators.projects.insert)
  .use(databaseWrite)
  .handler(async ({ context: { db, identity }, input: args }) => {
    const owner = requireIdentity(identity);
    const [project] = await db
      .insert(projects)
      .values({ ...args, ownerIssuer: owner.issuer, ownerId: owner.subject })
      .returning({ _id: projects._id, name: projects.name });
    if (!project) throw new Error("Project insert did not return a row");
    return project;
  });
