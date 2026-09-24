import { defineSchema, defineTable } from "@loom/core/server";
import * as v from "valibot";

const title = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200));

export default defineSchema(
  (s) => ({
    projects: defineTable(
      {
        name: s.text().notNull().validate(title),
        ownerIssuer: s.text().notNull(),
        ownerId: s.text().notNull(),
      },
      {
        serverFields: ["ownerIssuer", "ownerId"],
        publicFields: ["_id", "name"],
        indexes: [{ fields: ["ownerIssuer", "ownerId"] }],
      },
    ),
    tasks: defineTable(
      {
        projectId: s.reference("projects").notNull(),
        title: s.text().notNull().validate(title),
        done: s.boolean().notNull().default(false),
      },
      {
        publicFields: ["_id", "projectId", "title", "done"],
        indexes: [{ fields: ["projectId"] }],
      },
    ),
  }),
  { namespace: "app" },
);
