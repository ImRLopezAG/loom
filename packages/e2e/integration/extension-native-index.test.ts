import { expect, test } from "bun:test";
import * as v from "valibot";
import { defineRelations, sql } from "drizzle-orm";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import {
  createExtensionField,
  createExtensionIndex,
  createNativeExtensionField,
} from "../../../apps/loom/src/core/extensions/fields";
import { int4ArrayCodec } from "../../../apps/loom/src/core/extensions/native-codecs";
import { arrayCodec, textCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import pgTrgmCapture from "../../../apps/loom/src/tooling/extensions/manifests/pg_trgm.json";
import intarrayCapture from "../../../apps/loom/src/tooling/extensions/manifests/intarray.json";
import ltreeCapture from "../../../apps/loom/src/tooling/extensions/manifests/ltree.json";
import {
  createSnapshot,
  emptySnapshot,
  inspectSnapshot,
  migrationStatements,
  snapshotHash,
} from "../../../apps/loom/src/tooling/migrations/adapter";

const noSearch = { filter: false, comparison: false, order: false, text: false } as const;
for (const capture of [pgTrgmCapture, intarrayCapture, ltreeCapture]) {
  const manifest = v.parse(extensionManifestValidator, capture);
  const extension = {
    name: manifest.contract.extension,
    version: manifest.contract.version,
    schema: "custom",
    apiSupport: { status: "verified" as const, digest: manifest.digest },
  };
  test(`${extension.name} native inputs and qualified indexes inspect without repeated migration drift`, async () => {
    await withExtensionDatabase(async (url) => {
      const classes =
        extension.name === "pg_trgm"
          ? ([
              ["gin", "gin_trgm_ops"],
              ["gist", "gist_trgm_ops"],
            ] as const)
          : extension.name === "intarray"
            ? ([
                ["gin", "gin__int_ops"],
                ["gist", "gist__int_ops"],
                ["gist", "gist__intbig_ops"],
              ] as const)
            : ([["gist", "gist__ltree_ops"]] as const);
      const schema = defineSchema(
        (fields) => ({
          documents: defineTable(
            {
              value:
                extension.name === "pg_trgm"
                  ? fields.text().notNull().default("hello")
                  : extension.name === "intarray"
                    ? createNativeExtensionField({
                        extension,
                        manifest,
                        member: "opclass:$extension:intarray.gin__int_ops/gin",
                        input: { namespace: "pg_catalog", name: "_int4" },
                        codec: int4ArrayCodec,
                        value: {
                          kind: "array",
                          items: { kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 },
                        },
                        search: noSearch,
                      })
                        .notNull()
                        .default([1, 2])
                    : createExtensionField({
                        extension,
                        member: "type:$extension:ltree.ltree",
                        type: "ltree",
                        array: true,
                        codec: arrayCodec(textCodec),
                        value: {
                          kind: "object",
                          properties: {
                            dimensions: {
                              kind: "array",
                              items: {
                                kind: "object",
                                properties: {
                                  lowerBound: { kind: "number", integer: true },
                                  length: { kind: "number", integer: true },
                                },
                              },
                            },
                            values: { kind: "array", items: { kind: "string" } },
                          },
                        },
                        search: noSearch,
                      })
                        .notNull()
                        .default({ dimensions: [{ lowerBound: 1, length: 2 }], values: ["Top.Science", "Top.Arts"] }),
            },
            {
              indexes: classes.map(([method, opclass]) => ({
                fields: ["value"] as const,
                extension: createExtensionIndex({
                  extension,
                  manifest,
                  member: `opclass:$extension:${extension.name}.${opclass}/${method}`,
                  method,
                  opclass,
                  type: extension.name === "pg_trgm" ? "text" : extension.name === "intarray" ? "int4" : "ltree",
                }),
                ...(method === "gist" && opclass === "gist_trgm_ops" && { with: { fillfactor: 80 } }),
              })),
            },
          ),
        }),
        { namespace: "app" },
      );
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: url,
      });
      try {
        await connection.db.execute(
          sql.raw(
            `create schema custom; create extension "${extension.name}" with schema custom version '${extension.version}'`,
          ),
        );
        const desired = await createSnapshot(schema);
        for (const statement of await migrationStatements(await emptySnapshot("app"), desired))
          await connection.db.execute(sql.raw(statement));
        const inserted = await connection.db.insert(schema.tables.documents).values({}).returning();
        expect(inserted[0]?.value).toEqual(
          extension.name === "pg_trgm"
            ? "hello"
            : extension.name === "intarray"
              ? [1, 2]
              : { dimensions: [{ lowerBound: 1, length: 2 }], values: ["Top.Science", "Top.Arts"] },
        );
        expect((await connection.db.query.documents.findMany())[0]?.value).toEqual(inserted[0]?.value);
        const inspected = await inspectSnapshot(connection.db, "app");
        expect(snapshotHash(inspected)).toBe(snapshotHash(desired));
        expect(await migrationStatements(inspected, desired)).toEqual([]);
        const catalog = await connection.db
          .execute(sql`select tn.nspname as namespace, t.typname as name, a.attndims as dimensions
          from pg_attribute a join pg_class c on c.oid=a.attrelid join pg_namespace n on n.oid=c.relnamespace
          join pg_type original on original.oid=a.atttypid join pg_type t on t.oid=case when original.typcategory='A' then original.typelem else original.oid end
          join pg_namespace tn on tn.oid=t.typnamespace where n.nspname='app' and c.relname='documents' and a.attname='value'`);
        expect(catalog.rows).toEqual([
          {
            namespace: extension.name === "ltree" ? "custom" : "pg_catalog",
            name: extension.name === "pg_trgm" ? "text" : extension.name === "intarray" ? "int4" : "ltree",
            dimensions: extension.name === "pg_trgm" ? 0 : 1,
          },
        ]);
      } finally {
        await connection.close();
      }
    });
  });
}
