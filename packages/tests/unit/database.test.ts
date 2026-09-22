import { expect, test } from "vite-plus/test";
import { connectDatabase, defineSchema } from "@loom/core/server";
import { defineRelations } from "drizzle-orm";

test("connection rejects unrelated relation tables before any network connection", async () => {
  const schema = defineSchema((s) => ({ items: { title: s.text() } }));
  const other = defineSchema((s) => ({ items: { title: s.text() } }));
  await expect(
    connectDatabase({
      schema,
      relations: defineRelations(other.tables),
      connectionString: "postgres://localhost:1/unreachable",
    }),
  ).rejects.toThrow("compiled table");
});

test("connection validates protocol and pool bounds before connecting", async () => {
  const schema = defineSchema(() => ({}));
  await expect(
    connectDatabase({ schema, relations: defineRelations(schema.tables), connectionString: "https://example.com" }),
  ).rejects.toThrow("PostgreSQL URL");
  await expect(
    connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: "postgres://localhost:1/unreachable",
      maxConnections: 0,
    }),
  ).rejects.toThrow("maxConnections");
});
