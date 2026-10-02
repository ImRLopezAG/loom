import assert from "node:assert/strict";
import { test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { defineRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as v from "valibot";
import { defineConfig, inspectDeploymentTarget } from "loom/tooling";
import { withExtensionDatabase } from "../fixtures/extension-database";
import manifestInput from "../../../apps/loom/src/tooling/extensions/manifests/vector.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { createExtensionCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { createExtensionField, createExtensionIndex } from "../../../apps/loom/src/core/extensions/fields";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import {
  createSnapshot,
  emptySnapshot,
  inspectSnapshot,
  migrationStatements,
  snapshotHash,
} from "../../../apps/loom/src/tooling/migrations/adapter";

test.skipIf(process.env.LOOM_CLOUD_EXTENSION_SCHEMA !== "1")(
  "Neon vector fields and HNSW indexes retain their custom namespace without migration drift",
  async () => {
    const projectId = process.env.LOOM_CLOUD_PROJECT_ID;
    const branchId = process.env.LOOM_CLOUD_BRANCH_ID;
    const databaseUrl = process.env.LOOM_TEST_DATABASE_URL;
    const receiptPath = process.env.LOOM_CLOUD_RECEIPT;
    assert(projectId && branchId && databaseUrl && receiptPath);
    const target = await inspectDeploymentTarget(
      defineConfig({
        project: "typed-extension-schema-acceptance",
        provider: { projectId, targets: { preview: { branchId, protected: false } } },
      }),
      "preview",
    );
    assert.match(target.branchName, /^loom-acceptance-/);
    const address = new URL(databaseUrl);
    assert.equal(address.hostname.split(".")[0], target.endpointId);
    assert(address.hostname.endsWith(".neon.tech") && !address.hash && !address.port);
    assert.equal(address.searchParams.get("sslmode"), "verify-full");

    await withExtensionDatabase(async (url) => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      let stage = "extension installation";
      try {
        const available = await client.query(
          "select 1 from pg_available_extension_versions where name='vector' and version='0.8.6'",
        );
        assert.equal(available.rowCount, 1, "Required provider vector version is available");
        await client.query("create schema embedding; create extension vector with schema embedding version '0.8.6'");
        const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestInput));
        assert.equal(manifest.contract.version, "0.8.6");
        const extension = {
          name: "vector",
          version: "0.8.6",
          schema: "embedding",
          apiSupport: { status: "verified" as const, digest: manifest.digest },
        };
        const value = v.pipe(v.array(v.pipe(v.number(), v.finite())), v.length(3));
        const codec = createExtensionCodec({
          id: "acceptance:vector:3",
          sqlType: { schema: "embedding", name: "vector" },
          input: value,
          output: value,
          transport: "text",
          encode: (value) => `[${value.join(",")}]`,
          decode: (value) => JSON.parse(v.parse(v.string(), value)),
        });
        const field = () =>
          createExtensionField({
            extension,
            member: "type:$extension:vector.vector",
            type: "vector",
            codec,
            typmods: [3],
            parameters: { dimensions: 3 },
            value: { kind: "array", items: { kind: "number" }, length: 3 },
            search: { filter: false, comparison: false, order: false, text: false },
          });
        const index = createExtensionIndex({
          extension,
          member: "opclass:$extension:vector.vector_l2_ops/hnsw",
          method: "hnsw",
          opclass: "vector_l2_ops",
          type: "vector",
        });
        const schema = defineSchema(
          () => ({
            documents: defineTable(
              { embedding: field().notNull().default([1, 2, 3]), optional: field() },
              { indexes: [{ fields: ["embedding"], extension: index, with: { m: 8, ef_construction: 32 } }] },
            ),
          }),
          { namespace: "typed_app" },
        );
        stage = "generated schema DDL";
        const desired = await createSnapshot(schema);
        for (const statement of await migrationStatements(await emptySnapshot("typed_app"), desired))
          await client.query(statement);
        stage = "native field decoding";
        const connection = await connectDatabase({
          schema,
          relations: defineRelations(schema.tables),
          connectionString: url,
        });
        try {
          const [row] = await connection.transaction(async (db) =>
            db.insert(schema.tables.documents).values({}).returning(),
          );
          assert(row);
          assert.deepEqual(row.embedding, [1, 2, 3]);
          assert.equal(row.optional, null);
          await assert.rejects(
            connection.transaction(async (db) =>
              db
                .insert(schema.tables.documents)
                .values({ embedding: [1, 2] })
                .returning(),
            ),
          );
        } finally {
          await connection.close();
        }
        stage = "custom type and operator-class introspection";
        const actual = await client.query(
          "select tn.nspname as type_schema,t.typname as type_name,a.atttypmod as typmod from pg_attribute a join pg_type t on t.oid=a.atttypid join pg_namespace tn on tn.oid=t.typnamespace where a.attrelid='typed_app.documents'::regclass and a.attname='embedding'",
        );
        assert.deepEqual(actual.rows, [{ type_schema: "embedding", type_name: "vector", typmod: 3 }]);
        const actualIndex = await client.query(
          "select n.nspname as schema,o.opcname as opclass,am.amname as method,c.reloptions as options from pg_index i join pg_class c on c.oid=i.indexrelid join pg_am am on am.oid=c.relam join pg_opclass o on o.oid=i.indclass[0] join pg_namespace n on n.oid=o.opcnamespace where c.oid='typed_app.documents_0_idx'::regclass",
        );
        assert.deepEqual(actualIndex.rows, [
          { schema: "embedding", opclass: "vector_l2_ops", method: "hnsw", options: ["m=8", "ef_construction=32"] },
        ]);
        stage = "snapshot agreement and migration regeneration";
        const inspected = await inspectSnapshot(drizzle({ client }), "typed_app");
        assert.equal(snapshotHash(desired), snapshotHash(inspected));
        assert.deepEqual(await migrationStatements(inspected, await createSnapshot(schema, inspected)), []);
      } catch (cause) {
        const code = v.safeParse(v.object({ code: v.pipe(v.string(), v.regex(/^[A-Z0-9]{5}$/)) }), cause);
        throw new Error(
          `Neon typed extension schema acceptance failed during ${stage}${code.success ? ` (${code.output.code})` : ""}`,
        );
      } finally {
        await client.end();
      }
    });
    await writeFile(
      receiptPath,
      JSON.stringify(
        {
          projectId,
          branchId,
          passed: true,
          extension: "vector",
          version: "0.8.6",
          customSchema: "embedding",
          dimensions: 3,
          nativeCodec: true,
          desiredInspectedAgreement: true,
          repeatedMigrationStatements: 0,
        },
        null,
        2,
      ) + "\n",
    );
  },
  120000,
);
