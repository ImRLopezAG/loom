import { defineSchema, defineTable } from "@loom/core/server";
import * as v from "valibot";

export const schema = defineSchema((s) => ({
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
}));
