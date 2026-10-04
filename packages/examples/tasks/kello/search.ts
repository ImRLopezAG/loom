import { sql } from "drizzle-orm";
import type { SearchPolicy } from "kello/server";
import relations from "./relations";
import schema from "./schema";
import { ownedProjects } from "./access";

const { projects, tasks } = schema.tables;

/** Server-owned capabilities. Client selections can only narrow these scopes. */
export const taskSearchPolicy = {
  scope: {
    name: "project-owner",
    version: "1",
    where: ({ table, identity }) =>
      sql`${table.projectId} IN (SELECT ${projects._id} FROM ${projects} WHERE ${ownedProjects(identity)})`,
  },
  columns: ["_id", "projectId", "title", "done"],
  filter: ["projectId", "title", "done"],
  text: ["title"],
  order: ["title", "_createdAt"],
  through: {
    taskLabels: {
      name: "task-owner",
      version: "1",
      where: ({ table, identity }) =>
        sql`${table.taskId} IN (SELECT ${tasks._id} FROM ${tasks} JOIN ${projects} ON ${tasks.projectId}=${projects._id} WHERE ${ownedProjects(identity)})`,
    },
  },
  relations: {
    labels: {
      scope: {
        name: "label-project-owner",
        version: "1",
        where: ({ table, identity }) =>
          sql`${table.projectId} IN (SELECT ${projects._id} FROM ${projects} WHERE ${ownedProjects(identity)})`,
      },
      columns: ["name"],
      filter: ["name"],
      text: ["name"],
      order: ["name"],
    },
  },
} as const satisfies SearchPolicy<typeof relations, typeof relations.tasks>;
