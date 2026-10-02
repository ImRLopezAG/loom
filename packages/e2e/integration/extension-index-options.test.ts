import { expect, test } from "bun:test";
import * as v from "valibot";
import { defineRelations, sql } from "drizzle-orm";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { createExtensionIndex } from "../../../apps/loom/src/core/extensions/fields";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/pg_trgm.json";
import {
  createSnapshot,
  emptySnapshot,
  inspectSnapshot,
  migrationStatements,
  snapshotHash,
} from "../../../apps/loom/src/tooling/migrations/adapter";

test("GiST operator class options survive creation, inspection and changed-option migrations", async () => {
  await withExtensionDatabase(async (url) => {
    const manifest = v.parse(extensionManifestValidator, capture);
    const schemaFor = (siglen: number) =>
      defineSchema(
        (fields) => ({
          documents: defineTable(
            { title: fields.text() },
            {
              indexes: [
                {
                  fields: ["title"],
                  extension: createExtensionIndex({
                    extension: {
                      name: "pg_trgm",
                      version: "1.6",
                      schema: "custom",
                      apiSupport: { status: "verified", digest: manifest.digest },
                    },
                    manifest,
                    member: "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
                    method: "gist",
                    opclass: "gist_trgm_ops",
                    type: "text",
                    options: { siglen },
                  }),
                },
              ],
            },
          ),
        }),
        { namespace: "app" },
      );
    const schema = schemaFor(32);
    const connection = await connectDatabase({
      schema,
      relations: defineRelations(schema.tables),
      connectionString: url,
    });
    try {
      await connection.db.execute(sql.raw("create schema custom; create extension pg_trgm with schema custom"));
      const desired = await createSnapshot(schema);
      for (const statement of await migrationStatements(await emptySnapshot("app"), desired))
        await connection.db.execute(sql.raw(statement));
      const actual = await connection.db.execute(sql`
        select a.attoptions from pg_catalog.pg_attribute a
        join pg_catalog.pg_class c on c.oid=a.attrelid
        join pg_catalog.pg_namespace n on n.oid=c.relnamespace
        where n.nspname='app' and c.relkind='i' and a.attnum=1 and a.attoptions is not null
      `);
      expect(actual.rows).toEqual([{ attoptions: ["siglen=32"] }]);
      const inspected = await inspectSnapshot(connection.db, "app");
      expect(snapshotHash(inspected)).toBe(snapshotHash(desired));
      expect(await migrationStatements(inspected, desired)).toEqual([]);
      const changed = await createSnapshot(schemaFor(64));
      expect(snapshotHash(changed)).not.toBe(snapshotHash(desired));
      const statements = await migrationStatements(inspected, changed);
      expect(statements.length).toBeGreaterThan(0);
      for (const statement of statements) await connection.db.execute(sql.raw(statement));
      expect(snapshotHash(await inspectSnapshot(connection.db, "app"))).toBe(snapshotHash(changed));
    } finally {
      await connection.close();
    }
  });
});
