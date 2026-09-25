import { os } from "../_generated/rpc";
import { and, eq, sql } from "drizzle-orm";
import { ownedProjects, requireIdentity } from "../access";
export default os.tasks.router({
  list: os.tasks.list.handler(({ context, input }) =>
    context.live(({ db, identity }) => {
      const owner = requireIdentity(identity);
      return db.query.tasks.findMany({
        columns: { _id: true, projectId: true, title: true, done: true },
        where: { projectId: { eq: input.projectId }, project: { ownerIssuer: owner.issuer, ownerId: owner.subject } },
        orderBy: { _createdAt: "asc", _id: "asc" },
        limit: 100,
      });
    }),
  ),
  create: os.tasks.create.handler(
    async ({
      context: {
        db,
        tables: { projects, tasks },
        identity,
      },
      input,
      errors,
    }) => {
      const [project] = await db
        .select({ _id: projects._id })
        .from(projects)
        .where(and(ownedProjects(identity), eq(projects._id, input.projectId)))
        .limit(1);
      if (!project) throw errors.FORBIDDEN();
      const [task] = await db
        .insert(tasks)
        .values(input)
        .returning({ _id: tasks._id, projectId: tasks.projectId, title: tasks.title, done: tasks.done });
      if (!task) throw new Error("Task insert did not return a row");
      return task;
    },
  ),
  setDone: os.tasks.setDone.handler(
    async ({
      context: {
        db,
        tables: { projects, tasks },
        identity,
      },
      input,
      errors,
    }) => {
      const [owned] = await db
        .select({ _id: tasks._id })
        .from(tasks)
        .innerJoin(projects, eq(tasks.projectId, projects._id))
        .where(and(ownedProjects(identity), eq(tasks._id, sql`${input.id}`)))
        .limit(1);
      if (!owned) throw errors.FORBIDDEN();
      const [task] = await db
        .update(tasks)
        .set({ done: input.done })
        .where(eq(tasks._id, owned._id))
        .returning({ _id: tasks._id, projectId: tasks.projectId, title: tasks.title, done: tasks.done });
      if (!task) throw errors.FORBIDDEN();
      return task;
    },
  ),
});
