import { defineSchema, defineTable } from "@loom/core/server";
import * as v from "valibot";
export default defineSchema(
  (s) => ({
    notes: defineTable(
      {
        text: s
          .text()
          .notNull()
          .validate(v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(200))),
        owner: s.text().notNull(),
        issuer: s.text().notNull(),
      },
      { serverFields: ["owner", "issuer"], publicFields: ["_id", "text"], indexes: [{ fields: ["issuer", "owner"] }] },
    ),
  }),
  { namespace: "start_app" },
);
