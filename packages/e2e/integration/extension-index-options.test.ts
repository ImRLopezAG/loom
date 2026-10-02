import { expect, test } from "bun:test";
import * as v from "valibot";
import { defineRelations, sql } from "drizzle-orm";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { createExtensionField, createExtensionIndex } from "../../../apps/loom/src/core/extensions/fields";
import { textCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/pg_trgm.json";
import ltreeCapture from "../../../apps/loom/src/tooling/extensions/manifests/ltree.json";
import {
  createSnapshot,
  emptySnapshot,
  inspectSnapshot,
  migrationStatements,
  snapshotHash,
} from "../../../apps/loom/src/tooling/migrations/adapter";

for (const captured of [capture, ltreeCapture]) {
  test(`${captured.contract.extension} GiST options survive creation, changes and final-option removal`, async () => {
    await withExtensionDatabase(async (url) => {
      const manifest = v.parse(extensionManifestValidator, captured);
      const name = manifest.contract.extension;
      const extension = {
        name,
        version: manifest.contract.version,
        schema: "custom",
        apiSupport: { status: "verified" as const, digest: manifest.digest },
      };
      const opclass = name === "pg_trgm" ? "gist_trgm_ops" : "gist_ltree_ops";
      const schemaFor = (siglen?: number) =>
        defineSchema(
          (fields) => ({
            documents: defineTable(
              {
                title:
                  name === "pg_trgm"
                    ? fields.text()
                    : createExtensionField({
                        extension,
                        member: "type:$extension:ltree.ltree",
                        type: "ltree",
                        codec: textCodec,
                        value: { kind: "string" },
                        search: { filter: false, comparison: false, order: false, text: false },
                      }),
              },
              {
                indexes: [
                  {
                    fields: ["title"],
                    extension: createExtensionIndex({
                      extension,
                      manifest,
                      member: `opclass:$extension:${name}.${opclass}/gist`,
                      method: "gist",
                      opclass,
                      type: name === "pg_trgm" ? "text" : "ltree",
                      ...(siglen !== undefined && { options: { siglen } }),
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
        await connection.db.execute(sql.raw(`create schema custom; create extension "${name}" with schema custom`));
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
        let previous = inspected;
        for (const siglen of [64, undefined, 32]) {
          const changed = await createSnapshot(schemaFor(siglen));
          expect(snapshotHash(changed)).not.toBe(snapshotHash(previous));
          const statements = await migrationStatements(previous, changed);
          expect(statements.length).toBeGreaterThan(0);
          for (const statement of statements) await connection.db.execute(sql.raw(statement));
          previous = await inspectSnapshot(connection.db, "app");
          expect(snapshotHash(previous)).toBe(snapshotHash(changed));
          expect(await migrationStatements(previous, changed)).toEqual([]);
        }
      } finally {
        await connection.close();
      }
    });
  });
}
