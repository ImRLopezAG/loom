import assert from "node:assert/strict";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { defineRelations, sql } from "drizzle-orm";
import { pgSchema, integer, numeric } from "drizzle-orm/pg-core";
import { createBtreeGin_1_3 } from "../../../apps/loom/src/core/extensions/adapters/btree_gin";
import { defineSchema } from "../../../apps/loom/src/core/server/index";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/btree_gin.json";
import type { CodecInput } from "../../../apps/loom/src/core/extensions/codecs";
import { numericCodec } from "../../../apps/loom/src/core/extensions/codecs";
import {
  createSnapshot,
  emptySnapshot,
  inspectSnapshot,
  migrationStatements,
} from "../../../apps/loom/src/tooling/migrations/adapter";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { btreeGinNativeProofCase, btreeGinProofSchema, btreeGinProofFamily } from "../fixtures/btree_gin-proof-cases";
import {
  btreeGinNativeSchema,
  btreeGinSamples,
  btreeGinSqlType,
  type BtreeGinClass,
} from "../fixtures/btree_gin-schema";

const strategies = ["<", "<=", "=", ">=", ">"] as const;
async function checkCallable(client: pg.Client, url: string, placement: string, kind: "numeric" | "enum") {
  const api = createBtreeGin_1_3({
    name: "btree_gin",
    version: "1.3",
    schema: placement,
    apiSupport: { status: "verified", digest: btreeGinProofFamily.manifestDigest },
  });
  const empty = defineSchema(() => ({}));
  const connection = await connectDatabase({
    schema: empty,
    relations: defineRelations(empty.tables),
    connectionString: url,
  });
  const prefix = pg.escapeIdentifier(placement);
  try {
    if (kind === "numeric") {
      const cases: readonly (readonly [
        CodecInput<typeof numericCodec> | null,
        CodecInput<typeof numericCodec> | null,
        number | null,
      ])[] = [
        ["9007199254740992.0001", "9007199254740992.0002", -1],
        ["-123456789012345678901234567890.123456789", "-123456789012345678901234567890.123456788", -1],
        ["1.000", "1", 0],
        ["2", "1", 1],
        ["1e1000", "9e999", 1],
        [{ nonfinite: "-Infinity" }, "-1e1000", -1],
        [{ nonfinite: "Infinity" }, "1e1000", 1],
        [{ nonfinite: "NaN" }, { nonfinite: "Infinity" }, 1],
        [{ nonfinite: "NaN" }, { nonfinite: "NaN" }, 0],
        [null, "1", null],
        ["1", null, null],
        [null, null, null],
      ];
      for (const [left, right, expected] of cases) {
        const rows = await connection.transaction((db) =>
          db.select({ value: api.ginNumericCmp(left, right) }).from(sql`(values (1)) fixture(id)`),
        );
        const params = [
          left === null ? null : numericCodec.encode(left),
          right === null ? null : numericCodec.encode(right),
        ];
        const oracle = await client.query(
          `select ${prefix}.gin_numeric_cmp($1::numeric,$2::numeric) value, pg_catalog.numeric_cmp($1::numeric,$2::numeric) builtin`,
          params,
        );
        assert.deepEqual(rows, [{ value: expected }]);
        assert.deepEqual(oracle.rows, [{ value: expected, builtin: expected }]);
      }
      const native = pgSchema("app").table("btree_gin_numeric", { id: integer(), value: numeric() });
      const rows = await connection.transaction((db) =>
        db
          .select({ id: native.id, cmp: api.sql.functions.gin_numeric_cmp(native.value, btreeGinSamples.numeric[1]) })
          .from(native)
          .orderBy(native.id)
          .limit(8),
      );
      assert.deepEqual(
        rows,
        (
          await client.query(
            `select id, ${prefix}.gin_numeric_cmp(value,$1::numeric) cmp from app.btree_gin_numeric order by id limit 8`,
            [btreeGinSamples.numeric[1]],
          )
        ).rows,
      );
    } else {
      const ordered = pgSchema("btree_gin_types").enum("ordered", ["low", "after-low", "middle", "high"]);
      const cases = [
        ["low", "high", -1],
        ["middle", "middle", 0],
        ["high", "low", 1],
        [null, "low", null],
        ["high", null, null],
        [null, null, null],
      ] as const;
      for (const [left, right, expected] of cases) {
        const rows = await connection.transaction((db) =>
          db
            .select({ value: api.sql.functions.gin_enum_cmp(ordered, left, right) })
            .from(sql`(values (1)) fixture(id)`),
        );
        const oracle = await client.query(
          `select ${prefix}.gin_enum_cmp($1::btree_gin_types.ordered,$2::btree_gin_types.ordered) value, pg_catalog.enum_cmp($1::btree_gin_types.ordered,$2::btree_gin_types.ordered) builtin`,
          [left, right],
        );
        assert.deepEqual(rows, [{ value: expected }]);
        assert.deepEqual(oracle.rows, [{ value: expected, builtin: expected }]);
      }
      const native = pgSchema("app").table("btree_gin_enum", { id: integer(), value: ordered() });
      const rows = await connection.transaction((db) =>
        db
          .select({ id: native.id, cmp: api.ginEnumCmp(ordered, native.value, "middle") })
          .from(native)
          .orderBy(native.id)
          .limit(8),
      );
      assert.deepEqual(
        rows,
        (
          await client.query(
            `select id, ${prefix}.gin_enum_cmp(value,'middle'::btree_gin_types.ordered) cmp from app.btree_gin_enum order by id limit 8`,
          )
        ).rows,
      );
      if (placement === btreeGinProofSchema) {
        await client.query("alter type btree_gin_types.ordered add value 'after-low' before 'middle'");
        const altered = await connection.transaction((db) =>
          db.select({ value: api.ginEnumCmp(ordered, "after-low", "middle") }).from(sql`(values (1)) fixture(id)`),
        );
        assert.deepEqual(altered, [{ value: -1 }]);
      }
    }
  } finally {
    await connection.close();
  }
}
async function scanAllStrategies(client: pg.Client, key: BtreeGinClass) {
  const results = [];
  // Each oracle comparison owns a transaction on this client; they must run serially.
  for (const strategy of strategies) results.push(await scanMatchesOracle(client, key, strategy));
  return results;
}
async function scanMatchesOracle(client: pg.Client, key: BtreeGinClass, strategy: (typeof strategies)[number]) {
  const query = `select id from app.btree_gin_${key} where value OPERATOR(pg_catalog.${strategy}) $1::${btreeGinSqlType(key)} order by id`;
  const params = [btreeGinSamples[key][1]];
  await client.query("begin; set local enable_seqscan=off; set local enable_indexscan=off");
  try {
    const plan = JSON.stringify((await client.query(`explain (format json) ${query}`, params)).rows);
    assert.match(plan, /"Node Type":"Bitmap Index Scan"/);
    assert(plan.includes(`"Index Name":"btree_gin_${key}_idx"`), plan);
    const indexed = (await client.query(query, params)).rows;
    await client.query("set local enable_bitmapscan=off; set local enable_seqscan=on");
    const oraclePlan = JSON.stringify((await client.query(`explain (format json) ${query}`, params)).rows);
    assert.match(oraclePlan, /"Node Type":"Seq Scan"/);
    assert.doesNotMatch(oraclePlan, /"Node Type":"(?:Bitmap )?Index/);
    assert.deepEqual(indexed, (await client.query(query, params)).rows, `${key} ${strategy}`);
    return indexed;
  } finally {
    await client.query("rollback");
  }
}

extensionProofTest(
  btreeGinNativeProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      try {
        const initial = 'Initial"btree_gin';
        const quoted = pg.escapeIdentifier;
        await client.query(`create schema ${quoted(initial)}; create extension btree_gin with schema ${quoted(initial)} version '1.3';
        create schema btree_gin_types; create type btree_gin_types.ordered as enum ('low','middle','high')`);
        assert.equal(
          Math.floor(Number((await client.query("show server_version_num")).rows[0].server_version_num) / 10000),
          18,
        );
        const captured = await captureExtensionContract(client, {
          name: "btree_gin",
          provider: "postgres",
          fixture: "btree-gin-local-native",
        });
        // This is local PostgreSQL characterization, never evidence of Neon ownership or availability.
        assert.deepEqual(captured.contract, { ...manifest.contract, provider: "postgres" });
        const desired = await createSnapshot(btreeGinNativeSchema(initial));
        for (const statement of await migrationStatements(await emptySnapshot("app"), desired))
          await client.query(statement);
        const keys = Object.keys(btreeGinSamples);
        const before = new Map<string, unknown[]>();
        for (const name of keys) {
          // SAFETY: own keys of the exact literal fixture select only its declared native classes.
          const key = name as BtreeGinClass;
          const type = btreeGinSqlType(key);
          await client.query(
            `insert into app.btree_gin_${key} select g, ($1::text[])[1 + g % 3]::${type} from generate_series(1,2000) g`,
            [[...btreeGinSamples[key]]],
          );
          await client.query(
            `insert into app.btree_gin_${key} values (0,null); analyze app.btree_gin_${key}; reindex index app.btree_gin_${key}_idx`,
          );
          before.set(key, await scanAllStrategies(client, key));
        }
        await checkCallable(client, url, initial, "numeric");
        await checkCallable(client, url, initial, "enum");
        // Class OIDs remain stable while their namespaces relocate. Every scan below must still resolve the real class.
        await client.query(
          `create schema ${quoted(btreeGinProofSchema)}; alter extension btree_gin set schema ${quoted(btreeGinProofSchema)}`,
        );
        await observeExtensionProofDatabase(url, btreeGinNativeProofCase.id, "btree_gin");
        for (const kind of ["numeric", "enum"] as const) {
          const claim = btreeGinNativeProofCase.claims.find((claim) =>
            claim.member.startsWith(`routine:$extension:btree_gin.gin_${kind}_cmp(`),
          )!;
          await extensionProofWitness({ ...claim, schema: btreeGinProofSchema }, () =>
            checkCallable(client, url, btreeGinProofSchema, kind),
          );
        }
        const inspected = await inspectSnapshot(drizzle({ client }), "app");
        const indexes = inspected.ddl.filter((entity) => entity.entityType === "indexes");
        assert.equal(indexes.length, 29);
        for (const name of keys) {
          // SAFETY: keys come exclusively from the closed literal fixture.
          const key = name as BtreeGinClass;
          const claim = btreeGinNativeProofCase.claims.find(
            (claim) => claim.member === `opclass:$extension:btree_gin.${key}_ops/gin`,
          )!;
          await extensionProofWitness({ ...claim, schema: btreeGinProofSchema }, async () => {
            const catalog = await client.query(
              `select o.opcname, n.nspname, o.opcdefault, am.amname,
            t.typname input, tn.nspname input_schema from pg_catalog.pg_index i
            join pg_catalog.pg_class c on c.oid=i.indexrelid join pg_catalog.pg_opclass o on o.oid=i.indclass[0]
            join pg_catalog.pg_namespace n on n.oid=o.opcnamespace join pg_catalog.pg_am am on am.oid=o.opcmethod
            join pg_catalog.pg_type t on t.oid=o.opcintype join pg_catalog.pg_namespace tn on tn.oid=t.typnamespace
            where c.oid=$1::regclass`,
              [`app.btree_gin_${key}_idx`],
            );
            assert.deepEqual(catalog.rows, [
              {
                opcname: `${key}_ops`,
                nspname: btreeGinProofSchema,
                opcdefault: true,
                amname: "gin",
                input: key === "enum" ? "anyenum" : key,
                input_schema: "pg_catalog",
              },
            ]);
            const snapshot = indexes.find((entity) => entity.name === `btree_gin_${key}_idx`)!;
            assert.equal(snapshot.method, "gin");
            assert.equal(snapshot.columns.length, 1);
            // PostgreSQL's default class is omitted by the pinned inspector; exact qualification is corroborated above.
            assert.equal(snapshot.columns[0]!.opclass, null);
            const relocated = await scanAllStrategies(client, key);
            assert.deepEqual(relocated, before.get(key));
            // Insertion, update and deletion exercise class support after relocation, not just the initial build.
            await client.query(`insert into app.btree_gin_${key} values (9000,$1::${btreeGinSqlType(key)})`, [
              btreeGinSamples[key][1],
            ]);
            await client.query(`update app.btree_gin_${key} set value=$1::${btreeGinSqlType(key)} where id=1`, [
              btreeGinSamples[key][0],
            ]);
            await client.query(`delete from app.btree_gin_${key} where id=2`);
            for (const strategy of strategies) await scanMatchesOracle(client, key, strategy);
            assert.deepEqual((await client.query(`select id from app.btree_gin_${key} where value is null`)).rows, [
              { id: 0 },
            ]);
          });
        }
      } finally {
        await client.end();
      }
    });
  },
  180000,
);
