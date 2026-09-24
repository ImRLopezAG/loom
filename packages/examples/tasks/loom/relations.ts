import { defineRelations } from "drizzle-orm";
import schema from "./schema";

export default defineRelations(schema.tables, (r) => ({
  projects: { tasks: r.many.tasks({ from: r.projects._id, to: r.tasks.projectId }) },
  tasks: { project: r.one.projects({ from: r.tasks.projectId, to: r.projects._id, optional: false }) },
}));
