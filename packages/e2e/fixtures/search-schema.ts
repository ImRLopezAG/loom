import { defineRelations } from "drizzle-orm";
import { defineSchema } from "kello/server";

/** A real compiled graph: four edges, two aliases, self links, and M2M. */
export function createSearchFixture(namespace: string) {
  const schema = defineSchema(
    (s) => ({
      tasks: {
        title: s.text().notNull(),
        owner: s.text().notNull(),
        done: s.boolean().notNull(),
        projectId: s.reference("projects"),
        authorId: s.reference("users"),
        reviewerId: s.reference("users"),
        at: s.timestamp().notNull(),
        count: s.bigint().notNull(),
        amount: s.numeric().notNull(),
        rank: s.integer(),
      },
      projects: {
        name: s.text().notNull(),
        active: s.boolean().notNull(),
        organizationId: s.reference("organizations").notNull(),
      },
      organizations: { name: s.text().notNull(), visible: s.boolean().notNull() },
      teams: { name: s.text().notNull(), organizationId: s.reference("organizations").notNull() },
      members: { name: s.text().notNull(), teamId: s.reference("teams").notNull() },
      users: { name: s.text().notNull(), managerId: s.reference("users") },
      labels: { name: s.text().notNull(), owner: s.text().notNull() },
      taskLabels: {
        taskId: s.reference("tasks").notNull(),
        labelId: s.reference("labels").notNull(),
        owner: s.text().notNull(),
      },
    }),
    { namespace },
  );
  const relations = defineRelations(schema.tables, (r) => ({
    tasks: {
      project: r.one.projects({ from: r.tasks.projectId, to: r.projects._id, where: { active: true } }),
      author: r.one.users({ from: r.tasks.authorId, to: r.users._id, alias: "author" }),
      reviewer: r.one.users({ from: r.tasks.reviewerId, to: r.users._id, alias: "reviewer" }),
      labels: r.many.labels({
        from: r.tasks._id.through(r.taskLabels.taskId),
        to: r.labels._id.through(r.taskLabels.labelId),
      }),
      secondaryLabels: r.many.labels({
        from: r.tasks._id.through(r.taskLabels.taskId),
        to: r.labels._id.through(r.taskLabels.labelId),
        alias: "secondary-labels",
      }),
    },
    projects: {
      organization: r.one.organizations({ from: r.projects.organizationId, to: r.organizations._id, optional: false }),
    },
    organizations: { teams: r.many.teams({ from: r.organizations._id, to: r.teams.organizationId }) },
    teams: { members: r.many.members({ from: r.teams._id, to: r.members.teamId }) },
    users: { manager: r.one.users({ from: r.users.managerId, to: r.users._id }) },
    labels: {
      tasks: r.many.tasks({
        from: r.labels._id.through(r.taskLabels.labelId),
        to: r.tasks._id.through(r.taskLabels.taskId),
      }),
    },
  }));
  return { schema, relations };
}
