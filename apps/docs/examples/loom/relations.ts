import { defineRelations } from "drizzle-orm";
import schema from "./schema";

export default defineRelations(schema.tables, (r) => ({
  tasks: {
    project: r.one.projects({ from: r.tasks.projectId, to: r.projects._id }),
    labels: r.many.labels({
      from: r.tasks._id.through(r.taskLabels.taskId),
      to: r.labels._id.through(r.taskLabels.labelId),
    }),
  },
  projects: { tasks: r.many.tasks({ from: r.projects._id, to: r.tasks.projectId }) },
}));
