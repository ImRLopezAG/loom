import { os } from "../_generated/rpc";

export default os.tasks.router({
  list: os.tasks.list.handler(({ context, errors }) =>
    context.live(({ db, identity }) => {
      if (!identity) throw errors.UNAUTHORIZED();
      return db.query.tasks.findMany({
        columns: { _id: true, title: true, done: true },
        where: { ownerId: identity.subject, ownerIssuer: identity.issuer },
        orderBy: { _createdAt: "asc", _id: "asc" },
        limit: 100,
      });
    }),
  ),
  create: os.tasks.create.handler(async ({ context: { db, tables, identity }, input, errors }) => {
    if (!identity) throw errors.UNAUTHORIZED();
    const [task] = await db
      .insert(tables.tasks)
      .values({ ...input, ownerId: identity.subject, ownerIssuer: identity.issuer })
      .returning();
    if (!task) throw new Error("Task insert did not return a row");
    return task;
  }),
  greeting: os.tasks.greeting.handler(({ input }) => `Hello, ${input.name}`),
});
