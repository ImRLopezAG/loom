import { defineSchema, defineTable } from "@loom/core/server";
import { z } from "zod";
export default defineSchema(
  (s) => ({
    notes: defineTable(
      {
        text: s.text().notNull().validate(z.string().trim().min(1).max(200)),
        owner: s.text().notNull(),
        issuer: s.text().notNull(),
      },
      { serverFields: ["owner", "issuer"], publicFields: ["_id", "text"], indexes: [{ fields: ["issuer", "owner"] }] },
    ),
  }),
  { namespace: "app" },
);
