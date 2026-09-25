import { os } from "../_generated/rpc";
import { ownedProjects, requireIdentity } from "../access";
export default os.projects.router({
  list: os.projects.list.handler(({ context }) =>
    context.live(({ db, tables: { projects }, identity }) =>
      db
        .select({ _id: projects._id, name: projects.name })
        .from(projects)
        .where(ownedProjects(identity))
        .orderBy(projects._createdAt, projects._id)
        .limit(100),
    ),
  ),
  create: os.projects.create.handler(
    async ({
      context: {
        db,
        tables: { projects },
        identity,
      },
      input,
    }) => {
      const owner = requireIdentity(identity);
      const [project] = await db
        .insert(projects)
        .values({ ...input, ownerIssuer: owner.issuer, ownerId: owner.subject })
        .returning({ _id: projects._id, name: projects.name });
      if (!project) throw new Error("Project insert did not return a row");
      return project;
    },
  ),
});
