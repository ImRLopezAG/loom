import assert from "node:assert/strict";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { defineRelations, sql, type SQL } from "drizzle-orm";
import { createBtreeGist_1_8 } from "../../../apps/loom/src/core/extensions/adapters/btree_gist";
import { timestamp, timestamptz } from "../../../apps/loom/src/core/extensions/native-timestamp-codecs";
import { defineSchema } from "../../../apps/loom/src/core/server/index";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/btree_gist.json";
import * as v from "valibot";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import {
  createSnapshot,
  emptySnapshot,
  inspectSnapshot,
  migrationStatements,
} from "../../../apps/loom/src/tooling/migrations/adapter";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import {
  btreeGistClasses,
  btreeGistDistances,
  btreeGistNativeProofCase,
  btreeGistProofFamily,
  btreeGistProofSchema,
} from "../fixtures/btree_gist-proof-cases";
import {
  btreeGistNativeSchema,
  btreeGistSamples,
  btreeGistSqlType,
  type BtreeGistClass,
} from "../fixtures/btree_gist-schema";

const strategies = ["<", "<=", "=", ">=", ">", "<>"] as const;
const ordered = new Set<string>(btreeGistDistances.map(([, type]) => type));
type Api = ReturnType<typeof createBtreeGist_1_8>;
type Distance = (typeof btreeGistDistances)[number];
/** Native PostgreSQL 18.6 observations: [decoded Loom value, raw native text] per callable distance. */
function distanceCases(api: Api, [name, type]: Distance) {
  const cases = {
    money: [api.sql.functions.cash_dist("1.5", "-3"), api.distance.money("1.5", "-3"), "4.50", "$4.50", ["1.5", "-3"]],
    date: [
      api.sql.functions.date_dist("2000-01-01", "2001-01-01"),
      api.distance.date("2000-01-01", "2001-01-01"),
      366,
      "366",
      ["2000-01-01", "2001-01-01"],
    ],
    float4: [
      api.sql.functions.float4_dist(1.5, { nonfinite: "NaN" }),
      api.distance.float4(1.5, { nonfinite: "NaN" }),
      { nonfinite: "Infinity" },
      "Infinity",
      ["1.5", "NaN"],
    ],
    float8: [
      api.sql.functions.float8_dist(0.1, -0.2),
      api.distance.float8(0.1, -0.2),
      0.30000000000000004,
      "0.30000000000000004",
      ["0.1", "-0.2"],
    ],
    int2: [api.sql.functions.int2_dist(-1, 3), api.distance.int2(-1, 3), 4, "4", ["-1", "3"]],
    int4: [
      api.sql.functions.int4_dist(-2147483648, -1),
      api.distance.int4(-2147483648, -1),
      2147483647,
      "2147483647",
      ["-2147483648", "-1"],
    ],
    int8: [
      api.sql.functions.int8_dist(9007199254740993n, -1n),
      api.distance.int8(9007199254740993n, -1n),
      9007199254740994n,
      "9007199254740994",
      ["9007199254740993", "-1"],
    ],
    interval: [
      api.sql.functions.interval_dist("1 day", "-02:00:00"),
      api.distance.interval("1 day", "-02:00:00"),
      "1 day 02:00:00",
      "1 day 02:00:00",
      ["1 day", "-02:00:00"],
    ],
    oid: [
      api.sql.functions.oid_dist(1, 4294967295),
      api.distance.oid(1, 4294967295),
      4294967294,
      "4294967294",
      ["1", "4294967295"],
    ],
    time: [
      api.sql.functions.time_dist("01:00:00", "23:30:00.5"),
      api.distance.time("01:00:00", "23:30:00.5"),
      "22:30:00.5",
      "22:30:00.5",
      ["01:00:00", "23:30:00.5"],
    ],
    timestamp: [
      api.sql.functions.ts_dist(timestamp("2000-01-01 00:00:00"), timestamp("2000-03-01 01:00:00")),
      api.distance.timestamp(timestamp("2000-01-01 00:00:00"), timestamp("2000-03-01 01:00:00")),
      "60 days 01:00:00",
      "60 days 01:00:00",
      ["2000-01-01 00:00:00", "2000-03-01 01:00:00"],
    ],
    timestamptz: [
      api.sql.functions.tstz_dist(timestamptz("2000-01-01 00:00:00Z"), timestamptz("1999-01-01 00:00:00Z")),
      api.distance.timestamptz(timestamptz("2000-01-01 00:00:00Z"), timestamptz("1999-01-01 00:00:00Z")),
      "365 days",
      "365 days",
      ["2000-01-01 00:00:00+00", "1999-01-01 00:00:00+00"],
    ],
  } satisfies Record<string, readonly [SQL, SQL, unknown, string, readonly [string, string]]>;
  const [call, operator, decoded, text, params] = cases[type];
  return { name, type, call, operator, decoded, text, params };
}
function nullCall(api: Api, name: Distance[0]): SQL {
  switch (name) {
    case "cash_dist":
      return api.sql.functions.cash_dist(null, "1");
    case "date_dist":
      return api.sql.functions.date_dist("2000-01-01", null);
    case "float4_dist":
      return api.sql.functions.float4_dist(null, null);
    case "float8_dist":
      return api.sql.functions.float8_dist(null, 1);
    case "int2_dist":
      return api.sql.functions.int2_dist(1, null);
    case "int4_dist":
      return api.sql.functions.int4_dist(null, 1);
    case "int8_dist":
      return api.sql.functions.int8_dist(null, 1n);
    case "interval_dist":
      return api.sql.functions.interval_dist(null, "1 day");
    case "oid_dist":
      return api.sql.functions.oid_dist(1, null);
    case "time_dist":
      return api.sql.functions.time_dist(null, "01:00:00");
    case "ts_dist":
      return api.sql.functions.ts_dist(null, null);
    case "tstz_dist":
      return api.sql.functions.tstz_dist(timestamptz("2000-01-01 00:00:00Z"), null);
  }
}
const checkedManifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifest));
/** PostgreSQL's native overflow (SQLSTATE 22003) arrives as the cause of Drizzle's query error. */
function outOfRange(message: string) {
  return (error: { cause?: { code?: string; message?: string } }) =>
    error.cause?.code === "22003" && error.cause.message === message;
}
/** Each member of a union of typed expressions decodes to its own result type. */
type Decoded<Expression> = Expression extends SQL<infer Value> ? Value : never;
async function withLoom<Result>(
  url: string,
  work: (
    select: <Expression extends SQL<unknown>>(value: Expression) => Promise<Decoded<Expression>>,
  ) => Promise<Result>,
) {
  const empty = defineSchema(() => ({}));
  const connection = await connectDatabase({
    schema: empty,
    relations: defineRelations(empty.tables),
    connectionString: url,
  });
  try {
    return await work(async <Expression extends SQL<unknown>>(value: Expression): Promise<Decoded<Expression>> => {
      const rows = await connection.transaction((db) => db.select({ value }).from(sql`(values (1)) fixture(id)`));
      assert.equal(rows.length, 1);
      return rows[0]!.value;
    });
  } finally {
    await connection.close();
  }
}
async function checkDistance(
  client: pg.Client,
  url: string,
  placement: string,
  distance: Distance,
  via: "function" | "operator",
) {
  const api = createBtreeGist_1_8({
    name: "btree_gist",
    version: "1.8",
    schema: placement,
    apiSupport: { status: "verified", digest: btreeGistProofFamily.manifestDigest },
  });
  const expected = distanceCases(api, distance);
  const prefix = pg.escapeIdentifier(placement);
  const native =
    via === "function"
      ? `${prefix}.${expected.name}($1::pg_catalog.${expected.type},$2::pg_catalog.${expected.type})`
      : `$1::pg_catalog.${expected.type} OPERATOR(${prefix}.<->) $2::pg_catalog.${expected.type}`;
  assert.deepEqual((await client.query(`select (${native})::text value`, [...expected.params])).rows, [
    { value: expected.text },
  ]);
  await withLoom(url, async (select) => {
    assert.deepEqual(await select(via === "function" ? expected.call : expected.operator), expected.decoded);
    if (via === "function") {
      assert.equal(await select(nullCall(api, expected.name)), null);
      if (expected.name === "int4_dist")
        await assert.rejects(select(api.sql.functions.int4_dist(-2147483648, 1)), outOfRange("integer out of range"));
      if (expected.name === "cash_dist")
        await assert.rejects(
          select(api.sql.functions.cash_dist("-92233720368547758.08", "1")),
          outOfRange("money out of range"),
        );
    } else {
      assert.equal(await select(api.distance.int2(null, 1)), null);
    }
  });
}
async function checkTranslate(client: pg.Client, url: string, placement: string) {
  const api = createBtreeGist_1_8({
    name: "btree_gist",
    version: "1.8",
    schema: placement,
    apiSupport: { status: "verified", digest: btreeGistProofFamily.manifestDigest },
  });
  const prefix = pg.escapeIdentifier(placement);
  await withLoom(url, async (select) => {
    for (let value = -1; value <= 9; value++) {
      const oracle = await client.query(`select ${prefix}.gist_translate_cmptype_btree($1::int4)::int4 value`, [value]);
      assert.equal(await select(api.sql.functions.gist_translate_cmptype_btree(value)), oracle.rows[0].value);
    }
    assert.deepEqual(
      await Promise.all(
        [1, 2, 3, 4, 5, 6].map((value) => select(api.sql.functions.gist_translate_cmptype_btree(value))),
      ),
      [1, 2, 3, 4, 5, 0],
    );
    assert.equal(await select(api.sql.functions.gist_translate_cmptype_btree(null)), null);
  });
}
async function scanMatchesOracle(client: pg.Client, key: BtreeGistClass, strategy: (typeof strategies)[number]) {
  const query = `select id from app.btree_gist_${key} where value OPERATOR(pg_catalog.${strategy}) $1::${btreeGistSqlType(key)} order by id`;
  const params = [btreeGistSamples[key][1]];
  await client.query("begin; set local enable_seqscan=off; set local enable_indexscan=off");
  try {
    const plan = JSON.stringify((await client.query(`explain (format json) ${query}`, params)).rows);
    assert.match(plan, /"Node Type":"Bitmap Index Scan"/);
    assert(plan.includes(`"Index Name":"btree_gist_${key}_idx"`), plan);
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
/** Strategy 15: the GiST distance callback orders an index scan; distances must equal the sequential sort. */
async function knnMatchesOracle(client: pg.Client, key: BtreeGistClass, placement: string) {
  const operator = `OPERATOR(${pg.escapeIdentifier(placement)}.<->)`;
  const query = `select (value ${operator} $1::${btreeGistSqlType(key)})::text distance from app.btree_gist_${key} where value is not null order by value ${operator} $1::${btreeGistSqlType(key)} limit 50`;
  const params = [btreeGistSamples[key][1]];
  await client.query("begin; set local enable_seqscan=off; set local enable_bitmapscan=off");
  try {
    const plan = JSON.stringify((await client.query(`explain (format json) ${query}`, params)).rows);
    assert.match(plan, /"Node Type":"Index (?:Only )?Scan"/);
    assert(plan.includes(`"Index Name":"btree_gist_${key}_idx"`) && plan.includes('"Order By"'), plan);
    const indexed = (await client.query(query, params)).rows;
    await client.query("set local enable_indexscan=off; set local enable_seqscan=on");
    assert.doesNotMatch(JSON.stringify((await client.query(`explain (format json) ${query}`, params)).rows), /Index/);
    const oracle = (await client.query(query, params)).rows;
    if (key === "int8") {
      // Native characterization: gbt_int8_dist orders by a float8 distance, so beyond 2^53 the KNN index order is
      // approximate. The exact <-> result never changes; only rows within float8 rounding (here 1) interleave.
      assert.notDeepEqual(indexed, oracle);
      assert(
        indexed.every((row: { distance: string }) => row.distance === "0" || row.distance === "1"),
        JSON.stringify(indexed),
      );
      assert(oracle.every((row: { distance: string }) => row.distance === "0"));
    } else assert.deepEqual(indexed, oracle, `${key} <->`);
    return indexed;
  } finally {
    await client.query("rollback");
  }
}
async function scanAll(client: pg.Client, key: BtreeGistClass, placement: string) {
  const results = [];
  // Each oracle comparison owns a transaction on this client; they must run serially.
  for (const strategy of strategies) results.push(await scanMatchesOracle(client, key, strategy));
  if (ordered.has(key)) results.push(await knnMatchesOracle(client, key, placement));
  return results;
}

extensionProofTest(
  btreeGistNativeProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      try {
        const initial = 'Initial"btree_gist';
        const quoted = pg.escapeIdentifier;
        await client.query(`create schema ${quoted(initial)}; create extension btree_gist with schema ${quoted(initial)} version '1.8';
        create schema btree_gist_types; create type btree_gist_types.ordered as enum ('low','middle','high')`);
        assert.equal(
          Math.floor(Number((await client.query("show server_version_num")).rows[0].server_version_num) / 10000),
          18,
        );
        const captured = await captureExtensionContract(client, {
          name: "btree_gist",
          provider: "postgres",
          fixture: "btree-gist-local-native",
        });
        // This is local PostgreSQL characterization, never evidence of Neon ownership or availability.
        assert.deepEqual(captured.contract, { ...manifest.contract, provider: "postgres" });
        // Private storage keys reject text input natively; their cstring I/O callbacks are not application APIs.
        await assert.rejects(
          client.query(`select 'x'::${quoted(initial)}.gbtreekey8`),
          /cannot accept a value of type/,
        );
        const desired = await createSnapshot(btreeGistNativeSchema(initial));
        for (const statement of await migrationStatements(await emptySnapshot("app"), desired))
          await client.query(statement);
        const keys = btreeGistClasses.map(([key]) => key);
        const before = new Map<string, unknown[]>();
        for (const key of keys) {
          const type = btreeGistSqlType(key);
          await client.query(
            `insert into app.btree_gist_${key} select g, ($1::text[])[1 + g % 3]::${type} from generate_series(1,2000) g`,
            [[...btreeGistSamples[key]]],
          );
          await client.query(`insert into app.btree_gist_${key} values (0,null)`);
          await client.query(`analyze app.btree_gist_${key}; reindex index app.btree_gist_${key}_idx`);
          before.set(key, await scanAll(client, key, initial));
        }
        for (const distance of btreeGistDistances) {
          await checkDistance(client, url, initial, distance, "function");
          await checkDistance(client, url, initial, distance, "operator");
        }
        await checkTranslate(client, url, initial);
        // Exclusion constraints are btree_gist's primary purpose: scalar equality combined with range overlap.
        await client.query(`create table app.bookings (room int4, during tstzrange,
          exclude using gist (room ${quoted(initial)}.gist_int4_ops with =, during with &&))`);
        await client.query(
          "insert into app.bookings values (1, '[2000-01-01,2000-01-02)'), (2, '[2000-01-01,2000-01-02)')",
        );
        await assert.rejects(
          client.query("insert into app.bookings values (1, '[2000-01-01 12:00,2000-01-03)')"),
          (error: { code?: string }) => error.code === "23P01",
        );
        // Class OIDs remain stable while their namespaces relocate. Every scan below must still resolve the real class.
        await client.query(
          `create schema ${quoted(btreeGistProofSchema)}; alter extension btree_gist set schema ${quoted(btreeGistProofSchema)}`,
        );
        await observeExtensionProofDatabase(url, btreeGistNativeProofCase.id, "btree_gist");
        for (const distance of btreeGistDistances) {
          const [name, type] = distance;
          for (const via of ["function", "operator"] as const) {
            const member =
              via === "function"
                ? `routine:$extension:btree_gist.${name}(pg_catalog.${type},pg_catalog.${type})`
                : `operator:$extension:btree_gist.<->(pg_catalog.${type},pg_catalog.${type})`;
            const claim = btreeGistNativeProofCase.claims.find((entry) => entry.member === member)!;
            await extensionProofWitness({ ...claim, schema: btreeGistProofSchema }, () =>
              checkDistance(client, url, btreeGistProofSchema, distance, via),
            );
          }
        }
        const translate = btreeGistNativeProofCase.claims.find((entry) =>
          entry.member.includes("gist_translate_cmptype_btree"),
        )!;
        await extensionProofWitness({ ...translate, schema: btreeGistProofSchema }, () =>
          checkTranslate(client, url, btreeGistProofSchema),
        );
        await assert.rejects(
          client.query("insert into app.bookings values (2, '[2000-01-01 12:00,2000-01-03)')"),
          (error: { code?: string }) => error.code === "23P01",
        );
        const inspected = await inspectSnapshot(drizzle({ client }), "app");
        const indexes = inspected.ddl.filter((entity) => entity.entityType === "indexes");
        for (const [key, opclass] of btreeGistClasses) {
          const claim = btreeGistNativeProofCase.claims.find(
            (entry) => entry.member === `opclass:$extension:btree_gist.${opclass}/gist`,
          )!;
          await extensionProofWitness({ ...claim, schema: btreeGistProofSchema }, async () => {
            const catalog = await client.query(
              `select o.opcname, n.nspname, o.opcdefault, am.amname,
            t.typname input, tn.nspname input_schema, k.typname storage from pg_catalog.pg_index i
            join pg_catalog.pg_class c on c.oid=i.indexrelid join pg_catalog.pg_opclass o on o.oid=i.indclass[0]
            join pg_catalog.pg_namespace n on n.oid=o.opcnamespace join pg_catalog.pg_am am on am.oid=o.opcmethod
            join pg_catalog.pg_type t on t.oid=o.opcintype join pg_catalog.pg_namespace tn on tn.oid=t.typnamespace
            join pg_catalog.pg_type k on k.oid=o.opckeytype
            where c.oid=$1::regclass`,
              [`app.btree_gist_${key}_idx`],
            );
            const captured = checkedManifest.contract.members.find((member) => member.id === claim.member);
            assert(captured?.kind === "opclass");
            assert.deepEqual(catalog.rows, [
              {
                opcname: opclass,
                nspname: btreeGistProofSchema,
                opcdefault: true,
                amname: "gist",
                input: key === "enum" ? "anyenum" : key,
                input_schema: "pg_catalog",
                storage: captured.storage?.name,
              },
            ]);
            const snapshot = indexes.find((entity) => entity.name === `btree_gist_${key}_idx`)!;
            assert.equal(snapshot.method, "gist");
            assert.equal(snapshot.columns.length, 1);
            const relocated = await scanAll(client, key, btreeGistProofSchema);
            assert.deepEqual(relocated, before.get(key));
            // Insertion, update and deletion exercise class support after relocation, not just the initial build.
            await client.query(`insert into app.btree_gist_${key} values (9000,$1::${btreeGistSqlType(key)})`, [
              btreeGistSamples[key][1],
            ]);
            await client.query(`update app.btree_gist_${key} set value=$1::${btreeGistSqlType(key)} where id=1`, [
              btreeGistSamples[key][0],
            ]);
            await client.query(`delete from app.btree_gist_${key} where id=2`);
            await scanAll(client, key, btreeGistProofSchema);
            assert.deepEqual((await client.query(`select id from app.btree_gist_${key} where value is null`)).rows, [
              { id: 0 },
            ]);
          });
        }
        assert.equal(indexes.filter((entity) => entity.name.startsWith("btree_gist_")).length, 26);
      } finally {
        await client.end();
      }
    });
  },
  300000,
);
