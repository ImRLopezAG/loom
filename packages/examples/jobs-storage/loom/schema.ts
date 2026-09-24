import { defineSchema, defineTable } from "@loom/core/server";

export default defineSchema(
  (s) => ({
    files: defineTable(
      {
        intentId: s.uuid().notNull().unique(),
        ownerIssuer: s.text().notNull(),
        ownerId: s.text().notNull(),
        ownerTenant: s.text().notNull(),
        bucket: s.text().notNull(),
        size: s.integer().notNull(),
        contentType: s.text().notNull(),
        sha256: s.text().notNull(),
        jobId: s.uuid(),
        summary: s.text(),
      },
      {
        serverFields: [
          "intentId",
          "ownerIssuer",
          "ownerId",
          "ownerTenant",
          "bucket",
          "size",
          "contentType",
          "sha256",
          "jobId",
          "summary",
        ],
        publicFields: ["_id", "intentId", "bucket", "size", "contentType", "sha256", "summary"],
        indexes: [{ fields: ["ownerIssuer", "ownerId", "ownerTenant"] }],
      },
    ),
  }),
  { namespace: "app" },
);
