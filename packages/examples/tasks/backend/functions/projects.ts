import { mutation, query } from "@loom/core/server";
import * as v from "valibot";
import schema from "../schema";
import { ownedProjects, requireIdentity } from "../access";

const { projects } = schema.tables;

export const list = query({
  args: v.strictObject({}),
  returns: v.array(v.strictObject({ _id: v.pipe(v.string(), v.uuid()), name: v.string() })),
  handler: ({ db, identity }) =>
    db
      .select({ _id: projects._id, name: projects.name })
      .from(projects)
      .where(ownedProjects(identity))
      .orderBy(projects._createdAt, projects._id)
      .limit(100),
});

export const create = mutation({
  args: schema.validators.projects.insert,
  returns: schema.validators.projects.public,
  handler: async ({ db, identity }, args) => {
    const owner = requireIdentity(identity);
    const [project] = await db
      .insert(projects)
      .values({ ...args, ownerIssuer: owner.issuer, ownerId: owner.subject })
      .returning();
    if (!project) throw new Error("Project insert did not return a row");
    return project;
  },
});
