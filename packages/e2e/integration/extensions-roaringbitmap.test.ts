import assert from "node:assert/strict";
import pg from "pg";
import * as v from "valibot";
import { defineRelations, sql, type SQL } from "drizzle-orm";
import {
  createRoaringbitmap_1_2,
  type PostgreSqlArray,
  type RoaringBitmap,
  type RoaringBitmap64,
} from "../../../apps/loom/src/core/extensions/adapters/roaringbitmap";
import type { NonfiniteNumber } from "../../../apps/loom/src/core/extensions/codecs";
import { extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { connectDatabase, type DatabaseConnection } from "../../../apps/loom/src/core/server/database/connection";
import {
  createSnapshot,
  emptySnapshot,
  inspectSnapshot,
  migrationStatements,
  snapshotHash,
} from "../../../apps/loom/src/tooling/migrations/adapter";
import {
  roaringbitmapAnnotations,
  roaringbitmapSearchPathMembers,
} from "../../../apps/loom/src/tooling/extensions/annotations/roaringbitmap";
import captured from "../../../apps/loom/src/tooling/extensions/manifests/roaringbitmap.json";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import {
  withRoaringbitmapSession,
  type RoaringbitmapSession,
} from "../../../apps/loom/src/tooling/extensions/operations/roaringbitmap";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import {
  roaringbitmapAggregateProofCase,
  roaringbitmapProofSchema,
  roaringbitmapScalarProofCase,
  roaringbitmapSchemaProofCase,
  roaringbitmapSessionProofCase,
} from "../fixtures/roaringbitmap-proof-cases";

const n = pg.escapeIdentifier(roaringbitmapProofSchema);
const T = "$extension:roaringbitmap.roaringbitmap",
  T64 = "$extension:roaringbitmap.roaringbitmap64",
  I4 = "pg_catalog.int4",
  I8 = "pg_catalog.int8";
const descriptor = {
  name: "roaringbitmap",
  version: "1.2",
  schema: roaringbitmapProofSchema,
  apiSupport: { status: "verified", digest: "967ad98be988b37be7f198057e9f02bcbe325a0eab5364722ba4c6763cbc406a" },
} as const;
const api = createRoaringbitmap_1_2(descriptor);
const managed = defineSchema(
  () => ({
    bitmaps: defineTable({
      bits: api.field(),
      bits64: api.field64(),
      history: api.arrayField(),
      history64: api.array64Field(),
    }),
  }),
  { namespace: "app" },
);
const relations = defineRelations(managed.tables);
/** Native-only inputs: every value is parsed by roaringbitmap_in or PostgreSQL, never by the adapter's encoders. */
const inputs = `select '{1,2,3,-1,2147483647,-2147483648,70000}'::${n}.roaringbitmap a, '{2,3,4,-1}'::${n}.roaringbitmap b,
  '{1,2,3,-1,9223372036854775807,-9223372036854775808,4294967296}'::${n}.roaringbitmap64 a64,
  '{2,3,4,-1}'::${n}.roaringbitmap64 b64, -1::int4 e4, -1::int8 e8, 2::int8 s, 70001::int8 t, 2::int8 d,
  3::int8 lim, 1::int8 off, true rev, '{1,2,3,-1,2147483647,-2147483648,70000}'::${n}.roaringbitmap::bytea ab,
  '{1,2,3,-1,9223372036854775807,-9223372036854775808,4294967296}'::${n}.roaringbitmap64::bytea ab64,
  '{5,-5,5}'::int4[] arr4, '{5,-5,9223372036854775807}'::int8[] arr8`;
const nullInputs = `(select NULL::${n}.roaringbitmap a, NULL::${n}.roaringbitmap b, NULL::${n}.roaringbitmap64 a64,
  NULL::${n}.roaringbitmap64 b64, NULL::int4 e4, NULL::int8 e8, NULL::int8 s, NULL::int8 t, NULL::int8 d, NULL::int8 lim,
  NULL::int8 off, NULL::bool rev, NULL::bytea ab, NULL::bytea ab64, NULL::int4[] arr4, NULL::int8[] arr8) rb_inputs`;

type Text<Value> = (value: Value) => string | null;
const bitmapText: Text<RoaringBitmap | RoaringBitmap64 | null> = (value) => value && `{${value.join(",")}}`;
const scalarText: Text<number | bigint | boolean | null> = (value) => (value === null ? null : String(value));
const floatText: Text<number | NonfiniteNumber | null> = (value) =>
  value === null ? null : v.is(v.number(), value) ? String(value) : value.nonfinite;
const bytesText: Text<{ hex: string } | null> = (value) => value && `\\x${value.hex}`;
const arrayText: Text<PostgreSqlArray<number | bigint> | null> = (value) => {
  if (value === null) return null;
  assert(value.dimensions.length === 0 || (value.dimensions.length === 1 && value.dimensions[0]!.lowerBound === 1));
  return `{${value.values.join(",")}}`;
};
interface Case {
  readonly member: string;
  readonly expression: SQL;
  readonly native: string;
  readonly text: Text<never>;
  readonly rows?: true;
}
const scalar = <Value>(member: string, expression: SQL<Value>, native: string, text: Text<Value>): Case => ({
  member,
  expression,
  native,
  // SAFETY: Value is the exact output of expression, and each case's text runs only on that expression's decoded rows.
  text: text as Text<never>,
});
type Erased = (...values: unknown[]) => SQL<never>;
// Runtime check: every binding family member is a callable or a named-overload object of callables.
type Bindings =
  | typeof api.sql.functions
  | typeof api.sql.operators.roaringbitmap
  | typeof api.sql.operators.roaringbitmap64
  | Erased;
function erased(value: Bindings): value is Bindings & Record<string, Erased> {
  return v.is(v.record(v.string(), v.union([v.function(), v.record(v.string(), v.function())])), value);
}

function scalarCases(): Case[] {
  const f = api.sql.functions;
  const e4 = sql<number>`e4`,
    e8 = sql<bigint>`e8`,
    s = sql<bigint>`s`,
    t = sql<bigint>`t`,
    d = sql<bigint>`d`,
    lim = sql<bigint>`lim`,
    off = sql<bigint>`off`,
    rev = sql<boolean>`rev`;
  const routine = (signature: string) => `routine:$extension:roaringbitmap.${signature}`;
  const operator = (name: string, left: string, right: string) =>
    `operator:$extension:roaringbitmap.${name}(${left},${right})`;
  const op = (name: string, left: string, right: string) => `(${left} operator(${n}.${name}) ${right})`;
  const width = <const Prefix extends "rb" | "rb64">(prefix: Prefix): Case[] => {
    const wide = prefix === "rb64";
    const type = wide ? T64 : T,
      element = wide ? I8 : I4;
    const a = wide ? sql<RoaringBitmap64>`a64` : sql<RoaringBitmap>`a`,
      b = wide ? sql<RoaringBitmap64>`b64` : sql<RoaringBitmap>`b`,
      sa = wide ? "a64" : "a",
      sb = wide ? "b64" : "b",
      m = wide ? e8 : e4,
      sm = wide ? "e8" : "e4";
    // Each width selects its own exact binding family; erasing to SQL<never> only drops the 32/64 union here, while
    // every result is still decoded by its bound codec and compared with the native oracle.
    const functions = api.sql.functions,
      operators = wide ? api.sql.operators.roaringbitmap64 : api.sql.operators.roaringbitmap;
    assert(erased(functions) && erased(operators));
    const g = (name: string) => functions[`${prefix}_${name}`]!;
    const nested = (name: string, overload: string) => {
      const group = functions[`${prefix}_${name}`]!;
      assert(erased(group));
      return group[overload]!;
    };
    const o = (name: string) => operators[name]!;
    const pair = `${type},${type}`,
      range = `${type},${I8},${I8}`,
      withElement = `${type},${element}`;
    const call = (name: string, ...values: string[]) => `${n}.${prefix}_${name}(${values.join(",")})`;
    const bitmaps = (name: string) =>
      scalar(routine(`${prefix}_${name}(${pair})`), g(name)(a, b), call(name, sa, sb), bitmapText);
    const counts = (name: string) =>
      scalar(routine(`${prefix}_${name}(${pair})`), g(name)(a, b), call(name, sa, sb), scalarText);
    const ranged = (name: string) =>
      scalar(routine(`${prefix}_${name}(${range})`), g(name)(a, s, t), call(name, sa, "s", "t"), bitmapText);
    return [
      scalar(
        routine(`${prefix}_add(${withElement})`),
        nested("add", "bitmapElement")(b, m),
        call("add", sb, sm),
        bitmapText,
      ),
      scalar(
        routine(`${prefix}_add(${element},${type})`),
        nested("add", "elementBitmap")(m, b),
        call("add", sm, sb),
        bitmapText,
      ),
      counts("and_cardinality"),
      bitmaps("and"),
      counts("andnot_cardinality"),
      bitmaps("andnot"),
      scalar(
        routine(`${prefix}_build(${wide ? "pg_catalog._int8" : "pg_catalog._int4"})`),
        g("build")(wide ? sql<PostgreSqlArray<bigint>>`arr8` : sql<PostgreSqlArray<number>>`arr4`),
        call("build", wide ? "arr8" : "arr4"),
        bitmapText,
      ),
      scalar(routine(`${prefix}_cardinality(${type})`), g("cardinality")(a), call("cardinality", sa), scalarText),
      ranged("clear"),
      scalar(
        routine(`${prefix}_containedby(${pair})`),
        nested("containedby", "bitmap")(b, a),
        call("containedby", sb, sa),
        scalarText,
      ),
      scalar(
        routine(`${prefix}_containedby(${element},${type})`),
        nested("containedby", "element")(m, a),
        call("containedby", sm, sa),
        scalarText,
      ),
      scalar(
        routine(`${prefix}_contains(${pair})`),
        nested("contains", "bitmap")(a, b),
        call("contains", sa, sb),
        scalarText,
      ),
      scalar(
        routine(`${prefix}_contains(${withElement})`),
        nested("contains", "element")(a, m),
        call("contains", sa, sm),
        scalarText,
      ),
      counts("equals"),
      ranged("fill"),
      ranged("flip"),
      scalar(routine(`${prefix}_index(${withElement})`), g("index")(a, m), call("index", sa, sm), scalarText),
      counts("intersect"),
      scalar(routine(`${prefix}_is_empty(${type})`), g("is_empty")(a), call("is_empty", sa), scalarText),
      {
        ...scalar(routine(`${prefix}_iterate(${type})`), g("iterate")(a), call("iterate", sa), scalarText),
        rows: true,
      },
      scalar(
        routine(`${prefix}_jaccard_dist(${pair})`),
        g("jaccard_dist")(a, b),
        call("jaccard_dist", sa, sb),
        floatText,
      ),
      scalar(routine(`${prefix}_max(${type})`), g("max")(a), call("max", sa), scalarText),
      scalar(routine(`${prefix}_min(${type})`), g("min")(a), call("min", sa), scalarText),
      counts("not_equals"),
      counts("or_cardinality"),
      bitmaps("or"),
      scalar(
        routine(`${prefix}_range_cardinality(${range})`),
        g("range_cardinality")(a, s, t),
        call("range_cardinality", sa, "s", "t"),
        scalarText,
      ),
      ranged("range"),
      scalar(routine(`${prefix}_rank(${withElement})`), g("rank")(a, m), call("rank", sa, sm), scalarText),
      scalar(routine(`${prefix}_remove(${withElement})`), g("remove")(a, m), call("remove", sa, sm), bitmapText),
      scalar(routine(`${prefix}_runoptimize(${type})`), g("runoptimize")(a), call("runoptimize", sa), bitmapText),
      scalar(
        routine(`${prefix}_select(${type},${I8},${I8},pg_catalog.bool,${I8},${I8})`),
        g("select")(a, lim, off, rev, s, t),
        call("select", sa, "lim", "off", "rev", "s", "t"),
        bitmapText,
      ),
      scalar(
        routine(`${prefix}_shiftleft(${type},${I8})`),
        g("shiftleft")(a, d),
        call("shiftleft", sa, "d"),
        bitmapText,
      ),
      scalar(
        routine(`${prefix}_shiftright(${type},${I8})`),
        g("shiftright")(a, d),
        call("shiftright", sa, "d"),
        bitmapText,
      ),
      scalar(routine(`${prefix}_to_array(${type})`), g("to_array")(a), call("to_array", sa), arrayText),
      counts("xor_cardinality"),
      bitmaps("xor"),
      scalar(operator("-", type, type), o("andnot")(a, b), op("-", sa, sb), bitmapText),
      scalar(operator("-", type, element), o("remove")(a, m), op("-", sa, sm), bitmapText),
      scalar(operator("@>", type, type), o("contains")(a, b), op("@>", sa, sb), scalarText),
      scalar(operator("@>", type, element), o("containsElement")(a, m), op("@>", sa, sm), scalarText),
      scalar(operator("&", type, type), o("and")(a, b), op("&", sa, sb), bitmapText),
      scalar(operator("&&", type, type), o("intersect")(a, b), op("&&", sa, sb), scalarText),
      scalar(operator("#", type, type), o("xor")(a, b), op("#", sa, sb), bitmapText),
      scalar(operator("<@", type, type), o("containedBy")(b, a), op("<@", sb, sa), scalarText),
      scalar(operator("<@", element, type), o("elementContainedBy")(m, a), op("<@", sm, sa), scalarText),
      scalar(operator("<<", type, I8), o("shiftLeft")(a, d), op("<<", sa, "d"), bitmapText),
      scalar(operator("<>", type, type), o("notEqual")(a, b), op("<>", sa, sb), scalarText),
      scalar(operator("=", type, type), o("equal")(a, a), op("=", sa, sa), scalarText),
      scalar(operator(">>", type, I8), o("shiftRight")(a, d), op(">>", sa, "d"), bitmapText),
      scalar(operator("|", type, type), o("or")(a, b), op("|", sa, sb), bitmapText),
      scalar(operator("|", type, element), o("add")(b, m), op("|", sb, sm), bitmapText),
      scalar(operator("|", element, type), o("addReverse")(m, b), op("|", sm, sb), bitmapText),
    ];
  };
  const a = sql<RoaringBitmap>`a`,
    b64 = sql<RoaringBitmap64>`b64`,
    a64 = sql<RoaringBitmap64>`a64`,
    ab = sql<{ hex: string }>`ab`,
    ab64 = sql<{ hex: string }>`ab64`;
  const c = api.sql.casts;
  return [
    ...width("rb"),
    ...width("rb64"),
    scalar(
      routine(`rb64_from_roaringbitmap(${T})`),
      f.rb64_from_roaringbitmap(a),
      `${n}.rb64_from_roaringbitmap(a)`,
      bitmapText,
    ),
    scalar(
      routine(`rb64_to_roaringbitmap(${T64})`),
      f.rb64_to_roaringbitmap(b64),
      `${n}.rb64_to_roaringbitmap(b64)`,
      bitmapText,
    ),
    scalar(routine("roaringbitmap(pg_catalog.bytea)"), f.roaringbitmap(ab), `${n}.roaringbitmap(ab)`, bitmapText),
    scalar(
      routine("roaringbitmap64(pg_catalog.bytea)"),
      f.roaringbitmap64(ab64),
      `${n}.roaringbitmap64(ab64)`,
      bitmapText,
    ),
    scalar(routine(`roaringbitmap_send(${T})`), f.roaringbitmap_send(a), `${n}.roaringbitmap_send(a)`, bytesText),
    scalar(
      routine(`roaringbitmap64_send(${T64})`),
      f.roaringbitmap64_send(a64),
      `${n}.roaringbitmap64_send(a64)`,
      bytesText,
    ),
    scalar(`cast:${T}->${T64}`, c.roaringbitmap_to_roaringbitmap64(a), `a::${n}.roaringbitmap64`, bitmapText),
    scalar(`cast:${T}->pg_catalog.bytea`, c.roaringbitmap_to_bytea(a), "a::bytea", bytesText),
    scalar(`cast:${T64}->${T}`, c.roaringbitmap64_to_roaringbitmap(b64), `b64::${n}.roaringbitmap`, bitmapText),
    scalar(`cast:${T64}->pg_catalog.bytea`, c.roaringbitmap64_to_bytea(a64), "a64::bytea", bytesText),
    scalar(`cast:pg_catalog.bytea->${T}`, c.bytea_to_roaringbitmap(ab), `ab::${n}.roaringbitmap`, bitmapText),
    scalar(`cast:pg_catalog.bytea->${T64}`, c.bytea_to_roaringbitmap64(ab64), `ab64::${n}.roaringbitmap64`, bitmapText),
  ];
}

async function withApi(
  proofCaseId: string,
  work: (fixture: { client: pg.Client; connection: DatabaseConnection<typeof relations> }) => Promise<void>,
) {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const server = await client.query("select current_setting('server_version_num')::int version");
      assert.equal(Math.floor(server.rows[0].version / 10000), 18);
      await client.query(`create schema ${n}; create extension roaringbitmap with schema ${n} version '1.2'`);
      await observeExtensionProofDatabase(url, proofCaseId, "roaringbitmap");
      for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(managed)))
        await client.query(statement);
      await client.query(`create table public.rb_inputs as ${inputs}`);
      // The oracle reads the C array printer, independent of the adapter's portable-bytes decoder.
      await client.query("set roaringbitmap.output_format = 'array'");
      const connection = await connectDatabase({ schema: managed, relations, connectionString: url });
      try {
        await work({ client, connection });
      } finally {
        await connection.close();
      }
    } finally {
      await client.end();
    }
  });
}

extensionProofTest(
  roaringbitmapScalarProofCase,
  async () => {
    await withApi(roaringbitmapScalarProofCase.id, async ({ client, connection }) => {
      const cases = scalarCases();
      assert.deepEqual(
        cases.map((entry) => entry.member).sort(),
        roaringbitmapScalarProofCase.claims.map((claim) => claim.member).sort(),
      );
      for (const item of cases) {
        const claim = roaringbitmapScalarProofCase.claims.find((entry) => entry.member === item.member)!;
        await extensionProofWitness({ ...claim, schema: roaringbitmapProofSchema }, async () => {
          assert.equal(extensionExpressionContract(item.expression)?.member, item.member);
          // SQL-language members resolve their unqualified helper only through the session search_path.
          const searchPath = roaringbitmapSearchPathMembers.has(item.member)
            ? `set local search_path = ${n}, pg_catalog`
            : undefined;
          if (searchPath)
            await assert.rejects(
              connection.transaction((db) => db.select({ value: item.expression }).from(sql`public.rb_inputs`)),
              (error: Error) => v.is(v.object({ code: v.literal("42883") }), error.cause),
            );
          for (const from of ["public.rb_inputs", nullInputs]) {
            const actual = await connection.transaction(async (db) => {
              if (searchPath) await db.execute(sql.raw(searchPath));
              return db.select({ value: item.expression }).from(sql.raw(from));
            });
            const native = item.rows
              ? `select value::text value from ${from}, lateral ${item.native} value`
              : `select (${item.native})::text value from ${from}`;
            await client.query("begin");
            let oracle: unknown[];
            try {
              if (searchPath) await client.query(searchPath);
              oracle = (await client.query(native)).rows.map((row) => row.value);
            } finally {
              await client.query("rollback");
            }
            assert.deepEqual(
              // SAFETY: row.value is the decoded output of item.expression, the input type of item.text.
              actual.map((row) => item.text(row.value as never)),
              oracle,
              `${item.member} from ${from === nullInputs ? "NULLs" : "values"}`,
            );
          }
        });
      }
      // Exact native semantics, beyond agreement with the oracle.
      const exact = await connection.transaction((db) =>
        db
          .select({
            order: sql<RoaringBitmap>`a`.mapWith(api.codec.decode),
            order64: sql<RoaringBitmap64>`a64`.mapWith(api.codec64.decode),
            min: api.sql.functions.rb_min(sql<RoaringBitmap>`a`),
            max: api.sql.functions.rb_max(sql<RoaringBitmap>`a`),
            max64: api.sql.functions.rb64_max(sql<RoaringBitmap64>`a64`),
            widened: api.sql.casts.roaringbitmap_to_roaringbitmap64([-1]),
            directCount: api.cardinality(sql<RoaringBitmap>`a`),
            directCount64: api.bitmap64.cardinality(sql<RoaringBitmap64>`a64`),
            emptyMin: api.sql.functions.rb_min([]),
            missing: api.sql.functions.rb_index([1, 2], 3),
            defaults: api.sql.functions.rb_select([1, 2, 3, -1], 2n),
            reverse: api.sql.functions.rb_select([1, 2, 3, -1], 2n, undefined, true),
            unbounded: api.sql.functions.rb64_range([1n, -1n], 0n, 0n),
            clamped: api.sql.functions.rb_range([1, -1], -5n, 9223372036854775807n),
            empty: api.sql.functions.rb_jaccard_dist([], []),
          })
          .from(sql`rb_inputs`),
      );
      assert.deepEqual(exact, [
        {
          order: [1, 2, 3, 70000, 2147483647, -2147483648, -1],
          order64: [1n, 2n, 3n, 4294967296n, 9223372036854775807n, -9223372036854775808n, -1n],
          min: 1,
          max: -1,
          max64: -1n,
          widened: [-1n],
          directCount: 7n,
          directCount64: 7n,
          emptyMin: null,
          missing: -1n,
          defaults: [1, 2],
          reverse: [3, -1],
          unbounded: [1n, -1n],
          clamped: [1, -1],
          empty: { nonfinite: "NaN" },
        },
      ]);
      await assert.rejects(
        client.query(`select ${n}.rb64_to_roaringbitmap(a64) from rb_inputs`),
        /out of range for type integer/,
      );
      await assert.rejects(client.query(`select ${n}.roaringbitmap('\\x00'::bytea)`), /bitmap format is error/);
      await assert.rejects(client.query(`select ${n}.rb_build('{1,NULL}'::int4[])`));
    });
  },
  300000,
);

extensionProofTest(
  roaringbitmapAggregateProofCase,
  async () => {
    await withApi(roaringbitmapAggregateProofCase.id, async ({ client, connection }) => {
      await client.query(
        `create table rb_rows as select g,
           case when g % 10 = 0 then NULL else ${n}.rb_build(array[g % 1000, -(g % 7), g]) end bits,
           case when g % 10 = 0 then NULL else ${n}.rb64_build(array[(g % 1000)::int8 << 33, -(g % 7)::int8, g]) end bits64,
           case when g % 10 = 0 then NULL else (g % 5000 - 2500)::int4 end m4,
           case when g % 10 = 0 then NULL else ((g % 5000 - 2500)::int8 << 32) end m8
         from generate_series(1,200000) g;
         alter table rb_rows set (parallel_workers = 2); analyze rb_rows`,
      );
      const f = api.sql.functions;
      const bits = sql<RoaringBitmap>`bits`,
        bits64 = sql<RoaringBitmap64>`bits64`;
      const routine = (signature: string) => `routine:$extension:roaringbitmap.${signature}`;
      const cases: Case[] = [
        scalar(routine(`rb_and_agg(${T})`), f.rb_and_agg(bits), `${n}.rb_and_agg(bits)`, bitmapText),
        scalar(
          routine(`rb_and_cardinality_agg(${T})`),
          f.rb_and_cardinality_agg(bits),
          `${n}.rb_and_cardinality_agg(bits)`,
          scalarText,
        ),
        scalar(routine(`rb_build_agg(${I4})`), f.rb_build_agg(sql<number>`m4`), `${n}.rb_build_agg(m4)`, bitmapText),
        scalar(routine(`rb_or_agg(${T})`), f.rb_or_agg(bits), `${n}.rb_or_agg(bits)`, bitmapText),
        scalar(
          routine(`rb_or_cardinality_agg(${T})`),
          f.rb_or_cardinality_agg(bits),
          `${n}.rb_or_cardinality_agg(bits)`,
          scalarText,
        ),
        scalar(routine(`rb_xor_agg(${T})`), f.rb_xor_agg(bits), `${n}.rb_xor_agg(bits)`, bitmapText),
        scalar(
          routine(`rb_xor_cardinality_agg(${T})`),
          f.rb_xor_cardinality_agg(bits),
          `${n}.rb_xor_cardinality_agg(bits)`,
          scalarText,
        ),
        scalar(routine(`rb64_and_agg(${T64})`), f.rb64_and_agg(bits64), `${n}.rb64_and_agg(bits64)`, bitmapText),
        scalar(
          routine(`rb64_and_cardinality_agg(${T64})`),
          f.rb64_and_cardinality_agg(bits64),
          `${n}.rb64_and_cardinality_agg(bits64)`,
          scalarText,
        ),
        scalar(
          routine(`rb64_build_agg(${I8})`),
          f.rb64_build_agg(sql<bigint>`m8`),
          `${n}.rb64_build_agg(m8)`,
          bitmapText,
        ),
        scalar(routine(`rb64_or_agg(${T64})`), f.rb64_or_agg(bits64), `${n}.rb64_or_agg(bits64)`, bitmapText),
        scalar(
          routine(`rb64_or_cardinality_agg(${T64})`),
          f.rb64_or_cardinality_agg(bits64),
          `${n}.rb64_or_cardinality_agg(bits64)`,
          scalarText,
        ),
        scalar(routine(`rb64_xor_agg(${T64})`), f.rb64_xor_agg(bits64), `${n}.rb64_xor_agg(bits64)`, bitmapText),
        scalar(
          routine(`rb64_xor_cardinality_agg(${T64})`),
          f.rb64_xor_cardinality_agg(bits64),
          `${n}.rb64_xor_cardinality_agg(bits64)`,
          scalarText,
        ),
      ];
      assert.deepEqual(
        cases.map((entry) => entry.member).sort(),
        roaringbitmapAggregateProofCase.claims.map((claim) => claim.member).sort(),
      );
      for (const item of cases) {
        const claim = roaringbitmapAggregateProofCase.claims.find((entry) => entry.member === item.member)!;
        assert.equal(extensionExpressionContract(item.expression)?.member, item.member);
        await extensionProofWitness({ ...claim, schema: roaringbitmapProofSchema }, async () => {
          for (const parallel of [false, true]) {
            const settings = parallel
              ? "set local max_parallel_workers_per_gather=2; set local parallel_setup_cost=0; set local parallel_tuple_cost=0; set local min_parallel_table_scan_size=0"
              : "set local max_parallel_workers_per_gather=0";
            const actual = await connection.transaction(async (db) => {
              await db.execute(sql.raw(settings));
              return db.select({ value: item.expression }).from(sql`rb_rows`);
            });
            await client.query("begin");
            try {
              await client.query(settings);
              const plan = (
                await client.query(
                  `explain (analyze, costs off, timing off, summary off) select ${item.native} from rb_rows`,
                )
              ).rows
                .map((row) => row["QUERY PLAN"])
                .join("\n");
              // Partial aggregation runs combine, serialize and deserialize; serial plans run transition and final only.
              if (parallel) assert.match(plan, /Workers Launched: [1-9][\s\S]*Partial Aggregate/);
              else assert.doesNotMatch(plan, /Partial Aggregate/);
              const oracle = (await client.query(`select (${item.native})::text value from rb_rows`)).rows[0]!.value;
              // SAFETY: the value is the decoded output of item.expression, the input type of item.text.
              assert.equal(item.text(actual[0]!.value as never), oracle, `${item.member} parallel=${parallel}`);
            } finally {
              await client.query("rollback");
            }
          }
          // NULL inputs are skipped; empty and all-NULL groups finalize to SQL NULL rather than an empty bitmap.
          for (const where of [sql`g < 0`, sql`g % 10 = 0`]) {
            const empty = await connection.transaction((db) =>
              db
                .select({ value: item.expression })
                .from(sql`rb_rows`)
                .where(where),
            );
            assert.deepEqual(empty, [{ value: null }]);
          }
          const grouped = await connection.transaction((db) =>
            db
              .select({ value: item.expression })
              .from(sql`rb_rows`)
              .where(sql`g <= 30`)
              .groupBy(sql`g % 3`)
              .orderBy(sql`g % 3`),
          );
          const nativeGrouped = (
            await client.query(
              `select (${item.native})::text value from rb_rows where g <= 30 group by g % 3 order by g % 3`,
            )
          ).rows.map((row) => row.value);
          assert.deepEqual(
            // SAFETY: row.value is the decoded output of item.expression, the input type of item.text.
            grouped.map((row) => item.text(row.value as never)),
            nativeGrouped,
          );
        });
      }
      assert.equal("distinct" in f.rb_or_agg, false);
      assert.equal("distinct" in f.rb64_xor_cardinality_agg, false);
      // Native: the bitmap types have no default btree/hash opclass, so DISTINCT cannot identify equality (42883).
      for (const [aggregate, column, type] of [
        ["rb_or_agg", "bits", "roaringbitmap"],
        ["rb64_xor_cardinality_agg", "bits64", "roaringbitmap64"],
      ] as const)
        await assert.rejects(client.query(`select ${n}.${aggregate}(distinct ${column}) from rb_rows`), {
          code: "42883",
          message: `could not identify an equality operator for type ${n}.${type}`,
        });
      const distinct = await connection.transaction((db) =>
        db.select({ value: f.rb_build_agg.distinct(sql<number>`m4`) }).from(sql`rb_rows`),
      );
      const nativeDistinct = (await client.query(`select ${n}.rb_build_agg(distinct m4)::text value from rb_rows`))
        .rows[0]!.value;
      assert.equal(bitmapText(distinct[0]!.value), nativeDistinct);
      const running = await connection.transaction((db) =>
        db
          .select({ value: f.rb_or_agg.over({ orderBy: [sql`g`] }, bits) })
          .from(sql`rb_rows`)
          .where(sql`g <= 30`)
          .orderBy(sql`g`),
      );
      const nativeRunning = (
        await client.query(
          `select ${n}.rb_or_agg(bits) over (order by g)::text value from rb_rows where g <= 30 order by g`,
        )
      ).rows.map((row) => row.value);
      assert.equal(running.length, 30);
      assert.deepEqual(
        running.map((row) => bitmapText(row.value)),
        nativeRunning,
      );
    });
  },
  180000,
);

extensionProofTest(
  roaringbitmapSchemaProofCase,
  async () => {
    const prove = async (index: number, work: () => Promise<void>): Promise<void> => {
      const claim = roaringbitmapSchemaProofCase.claims[index];
      if (!claim) return work();
      await extensionProofWitness({ ...claim, schema: roaringbitmapProofSchema }, () => prove(index + 1, work));
    };
    await prove(0, async () => {
      await withApi(roaringbitmapSchemaProofCase.id, async ({ client, connection }) => {
        const live = await captureExtensionContract(client, {
          name: "roaringbitmap",
          provider: "postgres",
          fixture: "roaringbitmap-local-member-characterization",
        });
        // Compare every native member fact independently of annotations. Changing the profile label here compares
        // signatures only; the actual capture remains PostgreSQL evidence and never establishes Neon acceptance.
        assert.deepEqual({ ...live.contract, provider: captured.contract.provider }, captured.contract);
        const liveMembers = new Map(live.contract.members.map((member) => [member.id, member]));
        for (const annotation of roaringbitmapAnnotations) {
          if (!("proofTransfer" in annotation)) continue;
          const parent = liveMembers.get(annotation.proofTransfer.from[0]!);
          assert(parent);
          const relation = annotation.proofTransfer.relation;
          if (relation.kind === "aggregate-routine") {
            assert(parent.kind === "routine" && parent.aggregate);
            assert.equal(`routine:${parent.aggregate[relation.slot]}`, annotation.id);
          } else {
            assert(parent.kind === "type");
            assert.equal(`routine:${parent[relation.slot]}`, annotation.id);
          }
        }
        const table = managed.tables.bitmaps;
        const history: PostgreSqlArray<RoaringBitmap> = {
          dimensions: [
            { lowerBound: -1, length: 2 },
            { lowerBound: 4, length: 2 },
          ],
          values: [
            [[1, -1], null],
            [[], [70000, 2147483647, -2147483648]],
          ],
        };
        const history64: PostgreSqlArray<RoaringBitmap64> = {
          dimensions: [{ lowerBound: 0, length: 3 }],
          values: [[-1n, 9223372036854775807n], null, [4294967296n]],
        };
        const inserted = await connection.transaction((db) =>
          db
            .insert(table)
            .values({ bits: [-1, 3, 1, 3], bits64: [-9223372036854775808n, -1n, 0n], history, history64 })
            .returning(),
        );
        const { _id, _createdAt, ...row } = inserted[0]!;
        // Values, including array elements, return in native unsigned set order, de-duplicated by roaringbitmap_in.
        const expected = {
          bits: [1, 3, -1],
          bits64: [0n, -9223372036854775808n, -1n],
          history,
          history64: { ...history64, values: [[9223372036854775807n, -1n], null, [4294967296n]] },
        };
        assert.deepEqual(row, expected);
        // Native array output is read independently of the adapter's portable-bytes decoder.
        const stored = (
          await client.query(
            "select bits::text bits, bits64::text bits64, history::text history, history64::text history64 from app.bitmaps",
          )
        ).rows[0]!;
        assert.deepEqual(stored, {
          bits: "{1,3,-1}",
          bits64: "{0,-9223372036854775808,-1}",
          history: '[-1:0][4:5]={{"{1,-1}",NULL},{"{}","{70000,2147483647,-2147483648}"}}',
          history64: '[0:2]={"{9223372036854775807,-1}",NULL,"{4294967296}"}',
        });
        // Default bytea output (hex), escape bytea output and array output all decode to the same members.
        for (const settings of [
          "set local roaringbitmap.output_format = 'bytea'",
          "set local roaringbitmap.output_format = 'bytea'; set local bytea_output = 'escape'",
          "set local roaringbitmap.output_format = 'array'",
        ]) {
          const selected = await connection.transaction(async (db) => {
            await db.execute(sql.raw(settings));
            return db
              .select({ bits: table.bits, bits64: table.bits64, history: table.history, history64: table.history64 })
              .from(table);
          });
          assert.deepEqual(selected, [expected], settings);
        }
        const raw = (await client.query("select bits::bytea::text bits, bits64::bytea::text bits64 from app.bitmaps"))
          .rows[0]!;
        assert.deepEqual(api.codec.decode(raw.bits), expected.bits);
        assert.deepEqual(api.codec64.decode(raw.bits64), expected.bits64);
        // Native portable bytes for every CRoaring container family (array, bitset, run), run cookies with and without
        // the offset header (fewer than four containers or not), and 64-bit buckets, each against rb_to_array.
        const portable = [
          ["array", `'{1,2,3,-1,65537,131073,196609}'::${n}.roaringbitmap`],
          ["bitset", `${n}.rb_build(array(select generate_series(0, 10000, 2)))`],
          ["run-without-offsets", `${n}.rb_runoptimize(${n}.rb_fill('{}'::${n}.roaringbitmap, 0, 100000))`],
          ["run-with-offsets", `${n}.rb_runoptimize(${n}.rb_fill('{-1}'::${n}.roaringbitmap, 7, 300000))`],
          [
            "mixed",
            `${n}.rb_runoptimize(${n}.rb_or(${n}.rb_fill('{}'::${n}.roaringbitmap, 0, 70000), ${n}.rb_or(${n}.rb_build(array(select (327680 + g * 3)::int4 from generate_series(0, 6000) g)), '{458752,458760,-2147483648,-5}'::${n}.roaringbitmap)))`,
          ],
        ] as const;
        const portable64 = [
          ["array", `'{1,-1,4294967296,9223372036854775807,-9223372036854775808}'::${n}.roaringbitmap64`],
          ["bitset", `${n}.rb64_build(array(select (4294967296 + g * 2)::int8 from generate_series(0, 5000) g))`],
          ["run", `${n}.rb64_runoptimize(${n}.rb64_fill('{5}'::${n}.roaringbitmap64, 8589934592, 8590334592))`],
        ] as const;
        for (const [wide, fixtures] of [
          [false, portable],
          [true, portable64],
        ] as const)
          for (const [kind, expression] of fixtures) {
            const observed = (
              await client.query(
                `select (${expression})::bytea::text bytes, ${n}.${wide ? "rb64" : "rb"}_to_array(${expression})::text members`,
              )
            ).rows[0]!;
            const decoded = wide ? api.codec64.decode(observed.bytes) : api.codec.decode(observed.bytes);
            assert.equal(`{${decoded.join(",")}}`, observed.members, `${wide ? "64" : "32"}-bit ${kind}`);
            // Buffer parameters use the PostgreSQL binary Bind format, invoking the captured type.receive callback.
            // The bytes come from native send; neither the adapter encoder nor bytea-to-bitmap casts supply the input.
            const type = wide ? "roaringbitmap64" : "roaringbitmap";
            const received = await client.query(
              `select ${n}.${wide ? "rb64" : "rb"}_to_array($1::${n}.${type})::text members`,
              [Buffer.from(observed.bytes.slice(2), "hex")],
            );
            assert.equal(received.rows[0]!.members, observed.members, `${type}.receive ${kind}`);
            // The run fixtures really carry the run cookie (0x303b little-endian); 64-bit buckets each embed one.
            if (kind.startsWith("run")) assert.match(observed.bytes, wide ? /3b30/ : /^\\x3b30/);
          }
        // array_send/array_recv also preserve custom bounds and NULL elements through the element receive callback.
        for (const [column, type, expectedText] of [
          ["history", "roaringbitmap", stored.history],
          ["history64", "roaringbitmap64", stored.history64],
        ] as const) {
          const sent = (await client.query(`select pg_catalog.array_send(${column}) bytes from app.bitmaps`)).rows[0]!;
          assert(Buffer.isBuffer(sent.bytes));
          const received = await client.query(`select ($1::${n}.${type}[])::text value`, [sent.bytes]);
          assert.equal(received.rows[0]!.value, expectedText);
        }
        const equal = await connection.transaction((db) =>
          db
            .select({ id: sql<number>`1` })
            .from(table)
            .where(
              sql`${table.bits} operator(${sql.raw(n)}.=) ${table.bits} and ${table.bits64} operator(${sql.raw(n)}.<>) ${table.bits64} is false`,
            ),
        );
        assert.equal(equal.length, 1);
        const desired = await createSnapshot(managed),
          observed = await inspectSnapshot(connection.db, "app");
        assert.deepEqual(observed, desired);
        assert.equal(snapshotHash(observed), snapshotHash(desired));
        for (const invalid of ["{1,}", "{2147483648}", "\\x00", "1"])
          await assert.rejects(client.query(`select $1::${n}.roaringbitmap`, [invalid]));
        await assert.rejects(client.query(`select $1::${n}.roaringbitmap64`, ["{9223372036854775808}"]));
        // The sixth native array rank, non-default bounds, empty bitmaps and NULL outer values remain distinct.
        const dimensions = Array.from({ length: 6 }, (_, rank) => ({ lowerBound: rank - 3, length: 1 }));
        const six = { dimensions, values: [[[[[[[-1]]]]]]] };
        const six64 = { dimensions, values: [[[[[[[-1n]]]]]]] };
        const ranked = await connection.transaction((db) =>
          db.insert(table).values({ bits: null, bits64: [], history: six, history64: six64 }).returning(),
        );
        assert.deepEqual(
          ranked.map(({ _id, _createdAt, ...value }) => value),
          [{ bits: null, bits64: [], history: six, history64: six64 }],
        );
        // Both a native narrowing error and a caught decoder error poison the invocation transaction after a write.
        const countBefore = (await client.query("select count(*)::int count from app.bitmaps")).rows[0]!.count;
        await assert.rejects(
          connection.transaction(async (db) => {
            await db.insert(table).values({ bits: [9], bits64: [9n], history: null, history64: null });
            await db
              .select({ value: api.sql.casts.roaringbitmap64_to_roaringbitmap([4294967296n]) })
              .from(sql`public.rb_inputs`);
          }),
        );
        assert.equal((await client.query("select count(*)::int count from app.bitmaps")).rows[0]!.count, countBefore);
        let decoderReached = false;
        await assert.rejects(
          connection.transaction(async (db) => {
            await db.insert(table).values({ bits: [9], bits64: [9n], history: null, history64: null });
            try {
              await db
                .select({
                  value: api.or([1], [2]).mapWith(() => {
                    decoderReached = true;
                    throw new Error("roaringbitmap decoder proof");
                  }),
                })
                .from(sql`public.rb_inputs`);
            } catch {
              // Catching a decode failure cannot commit the preceding write.
            }
          }),
          /roaringbitmap decoder proof/,
        );
        assert(decoderReached);
        assert.equal((await client.query("select count(*)::int count from app.bitmaps")).rows[0]!.count, countBefore);
      });
    });
  },
  120000,
);

extensionProofTest(
  roaringbitmapSessionProofCase,
  async () => {
    await withExtensionDatabase(async (url) => {
      const admin = new pg.Client({ connectionString: url });
      await admin.connect();
      try {
        await admin.query(`create schema ${n}; create extension roaringbitmap with schema ${n} version '1.2'`);
        await observeExtensionProofDatabase(url, roaringbitmapSessionProofCase.id, "roaringbitmap");
        const a = [1, 2, 3, -1, 2147483647, -2147483648, 70000],
          a64 = [1n, 2n, 3n, -1n, 9223372036854775807n, -9223372036854775808n, 4294967296n];
        const literal = (values: readonly (number | bigint)[], type: string) => `'{${values.join(",")}}'::${n}.${type}`;
        const routine = (signature: string) => `routine:$extension:roaringbitmap.${signature}`;
        const operator = (name: string, left: string, right: string) =>
          `operator:$extension:roaringbitmap.${name}(${left},${right})`;
        type Call = (session: RoaringbitmapSession) => Promise<RoaringBitmap | RoaringBitmap64 | boolean | null>;
        // Each entry: exact member, the session call with values, the same call with SQL NULLs, and the native SQL.
        const cases: readonly (readonly [string, Call, Call, string])[] = [
          [
            routine(`rb_add(${I4},${T})`),
            (s) => s.functions.rb_add.elementBitmap(-1, a),
            (s) => s.functions.rb_add.elementBitmap(null, a),
            `${n}.rb_add(-1::int4, ${literal(a, "roaringbitmap")})`,
          ],
          [
            routine(`rb_containedby(${I4},${T})`),
            (s) => s.functions.rb_containedby.element(70000, a),
            (s) => s.functions.rb_containedby.element(1, null),
            `${n}.rb_containedby(70000::int4, ${literal(a, "roaringbitmap")})`,
          ],
          [
            routine(`rb_shiftleft(${T},${I8})`),
            (s) => s.functions.rb_shiftleft(a, 2n),
            (s) => s.functions.rb_shiftleft(a, null),
            `${n}.rb_shiftleft(${literal(a, "roaringbitmap")}, 2::int8)`,
          ],
          [
            routine(`rb64_add(${I8},${T64})`),
            (s) => s.functions.rb64_add.elementBitmap(-2n, a64),
            (s) => s.functions.rb64_add.elementBitmap(-2n, null),
            `${n}.rb64_add(-2::int8, ${literal(a64, "roaringbitmap64")})`,
          ],
          [
            routine(`rb64_containedby(${I8},${T64})`),
            (s) => s.functions.rb64_containedby.element(4294967296n, a64),
            (s) => s.functions.rb64_containedby.element(null, a64),
            `${n}.rb64_containedby(4294967296::int8, ${literal(a64, "roaringbitmap64")})`,
          ],
          [
            routine(`rb64_shiftleft(${T64},${I8})`),
            (s) => s.functions.rb64_shiftleft(a64, 2n),
            (s) => s.functions.rb64_shiftleft(null, 2n),
            `${n}.rb64_shiftleft(${literal(a64, "roaringbitmap64")}, 2::int8)`,
          ],
          [
            operator("|", I4, T),
            (s) => s.operators.roaringbitmap.addReverse(5, a),
            (s) => s.operators.roaringbitmap.addReverse(null, a),
            `(5::int4 operator(${n}.|) ${literal(a, "roaringbitmap")})`,
          ],
          [
            operator("<@", I4, T),
            (s) => s.operators.roaringbitmap.elementContainedBy(4, a),
            (s) => s.operators.roaringbitmap.elementContainedBy(4, null),
            `(4::int4 operator(${n}.<@) ${literal(a, "roaringbitmap")})`,
          ],
          [
            operator("<<", T, I8),
            (s) => s.operators.roaringbitmap.shiftLeft(a, -3n),
            (s) => s.operators.roaringbitmap.shiftLeft(null, null),
            `(${literal(a, "roaringbitmap")} operator(${n}.<<) -3::int8)`,
          ],
          [
            operator("|", I8, T64),
            (s) => s.operators.roaringbitmap64.addReverse(-9223372036854775808n, [5n]),
            (s) => s.operators.roaringbitmap64.addReverse(null, [5n]),
            `('-9223372036854775808'::int8 operator(${n}.|) '{5}'::${n}.roaringbitmap64)`,
          ],
          [
            operator("<@", I8, T64),
            (s) => s.operators.roaringbitmap64.elementContainedBy(-1n, a64),
            (s) => s.operators.roaringbitmap64.elementContainedBy(-1n, null),
            `(-1::int8 operator(${n}.<@) ${literal(a64, "roaringbitmap64")})`,
          ],
          [
            operator("<<", T64, I8),
            (s) => s.operators.roaringbitmap64.shiftLeft(a64, 1n),
            (s) => s.operators.roaringbitmap64.shiftLeft(a64, null),
            `(${literal(a64, "roaringbitmap64")} operator(${n}.<<) 1::int8)`,
          ],
        ];
        assert.deepEqual(
          cases.map(([member]) => member).sort(),
          roaringbitmapSessionProofCase.claims.map((claim) => claim.member).sort(),
        );
        const text = (value: RoaringBitmap | RoaringBitmap64 | boolean | null) =>
          value === null ? null : v.is(v.boolean(), value) ? String(value) : `{${value.join(",")}}`;
        let escaped: RoaringbitmapSession | undefined;
        const result = await withRoaringbitmapSession(url, descriptor, async (session) => {
          escaped = session;
          const observed: { member: string; values: string | null; nulls: string | null }[] = [];
          for (const [member, values, nulls] of cases)
            observed.push({ member, values: text(await values(session)), nulls: text(await nulls(session)) });
          return { path: await session.searchPath(), observed };
        });
        const path = `${n}, pg_catalog`;
        const { before } = result.searchPath;
        assert.deepEqual(result.searchPath, { scope: "transaction", before, during: path, after: before });
        assert.equal(result.completion, "committed");
        assert.equal(result.value.path, path);
        // The owned operator backend starts from its own pinned path; the extension schema is never on it.
        assert(!before.includes(roaringbitmapProofSchema));
        const ordinaryPath = (await admin.query("select current_setting('search_path') value")).rows[0].value;
        for (const [index, [member, , , native]] of cases.entries()) {
          const claim = roaringbitmapSessionProofCase.claims.find((entry) => entry.member === member)!;
          await extensionProofWitness({ ...claim, schema: roaringbitmapProofSchema }, async () => {
            // Ordinary sessions cannot resolve the unqualified helper inside the captured SQL-language body.
            await assert.rejects(admin.query(`select (${native})::text value`), { code: "42883" });
            await admin.query("begin");
            try {
              await admin.query(`set local search_path = ${path}; set local roaringbitmap.output_format = 'array'`);
              const oracle = (await admin.query(`select (${native})::text value`)).rows[0].value;
              assert.equal(
                result.value.observed[index]!.values,
                oracle === "t" || oracle === "f" ? String(oracle === "t") : oracle,
                member,
              );
            } finally {
              await admin.query("rollback");
            }
            // Every captured body is STRICT SQL: a NULL argument returns SQL NULL.
            assert.equal(result.value.observed[index]!.nulls, null, member);
          });
        }
        assert(escaped);
        await assert.rejects(escaped.functions.rb_shiftleft([1], 1n));
        // Typed inputs are validated before binding; the owned transaction rolls back and never leaks its setting.
        await assert.rejects(
          withRoaringbitmapSession(url, descriptor, (session) =>
            session.functions.rb_add.elementBitmap(2147483648, [1]),
          ),
        );
        await assert.rejects(
          withRoaringbitmapSession(url, descriptor, (session) =>
            session.operators.roaringbitmap64.addReverse(9223372036854775808n, [1n]),
          ),
        );
        const failure = new Error("roaringbitmap callback proof");
        await assert.rejects(
          withRoaringbitmapSession(url, descriptor, async (session) => {
            assert.equal(await session.searchPath(), path);
            throw failure;
          }),
          (error) =>
            error instanceof Error &&
            error.cause === failure &&
            v.is(v.object({ completion: v.literal("rolled-back") }), error),
        );
        const abort = new AbortController();
        await assert.rejects(
          withRoaringbitmapSession(
            url,
            descriptor,
            async (session) => {
              escaped = session;
              assert.equal(await session.searchPath(), path);
              abort.abort(failure);
              await session.functions.rb_shiftleft([5], 1n);
            },
            abort.signal,
          ),
          (error) =>
            error instanceof Error &&
            error.cause === failure &&
            v.is(v.object({ completion: v.literal("rolled-back") }), error),
        );
        await assert.rejects(escaped.functions.rb_shiftleft([5], 1n));
        const backends = await admin.query(
          "select pid from pg_catalog.pg_stat_activity where datname=current_database() and application_name='loom-migrations'",
        );
        assert.equal(
          backends.rows.length,
          0,
          "Every owned operator backend closed after success, failure and cancellation",
        );
        assert.equal((await admin.query("select current_setting('search_path') value")).rows[0].value, ordinaryPath);
      } finally {
        await admin.end();
      }
    });
  },
  120000,
);
