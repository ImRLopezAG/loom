import { defineSchema, defineTable } from "kello/server";
import * as v from "valibot";

const schema = defineSchema(
  (s) => ({
    projects: { name: s.text().notNull() },
    tasks: defineTable(
      {
        title: s
          .text()
          .notNull()
          .validate(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200))),
        done: s.boolean().notNull().default(false),
        projectId: s.reference("projects"),
        ownerId: s.text().notNull(),
        ownerIssuer: s.text().notNull(),
      },
      {
        serverFields: ["ownerId", "ownerIssuer"],
        commandFields: ["title"],
        publicFields: ["_id", "title", "done"],
        indexes: [{ fields: ["ownerIssuer", "ownerId"] }],
      },
    ),
    labels: { name: s.text().notNull() },
    taskLabels: {
      taskId: s.reference("tasks").notNull(),
      labelId: s.reference("labels").notNull(),
    },
  }),
  { namespace: "app" },
);

export default schema;
