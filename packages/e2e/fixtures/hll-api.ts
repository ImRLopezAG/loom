import pg from "pg";
import * as v from "valibot";
import assert from "node:assert/strict";
import { sql, defineRelations, type SQL } from "drizzle-orm";
import { createHll_2_21, type HllHashval, type HllSketch } from "../../../apps/loom/src/core/extensions/adapters/hll";
import type { NonfiniteNumber } from "../../../apps/loom/src/core/extensions/codecs";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { defineTable } from "../../../apps/loom/src/core/schema/table";
import { connectDatabase, type DatabaseConnection } from "../../../apps/loom/src/core/server/database/connection";
import { createSnapshot, emptySnapshot, migrationStatements } from "../../../apps/loom/src/tooling/migrations/adapter";
import { withExtensionDatabase } from "./extension-database";
import { observeExtensionProofDatabase } from "./extension-proof-database";
import { hllProofSchema } from "./hll-proof-cases";

export const hllNamespace = pg.escapeIdentifier(hllProofSchema);
export const hllType = `${hllNamespace}.hll`;
export const hllHashvalType = `${hllNamespace}.hll_hashval`;
export const hllDigest = "44f6623b1b7a463ea7cb26fcd02b434cb33c36a4bd9edfe0397e2536f66f6b19";
export const hllApi = createHll_2_21({
  name: "hll",
  version: "2.21",
  schema: hllProofSchema,
  apiSupport: { status: "verified", digest: hllDigest },
});
export const hllManaged = defineSchema(
  () => ({
    sketches: defineTable({
      value: hllApi.field(),
      sized: hllApi.field({
        log2m: 10,
        regwidth: 4,
        expthresh: -1,
        sparseon: 1,
      }),
      history: hllApi.arrayField(),
      hash: hllApi.hashvalField(),
      hashes: hllApi.hashvalArrayField(),
    }),
  }),
  { namespace: "app" },
);
const relations = defineRelations(hllManaged.tables);
/** Native-only input row: every value comes from hll SQL, never from the adapter's encoders. */
const inputs = `
  select ${hllNamespace}.hll_add(${hllNamespace}.hll_empty(), ${hllNamespace}.hll_hash_integer(1)) lhs,
    (select ${hllNamespace}.hll_add_agg(${hllNamespace}.hll_hash_integer(g)) from generate_series(1,50) g) rhs,
    ${hllNamespace}.hll_hash_integer(7) hv, 7::int4 i4, 7::int8 i8, 3::int2 i2, true flag, '\\x0102'::bytea raw,
    '\\x118b7f'::bytea packed, 'Kello 日本'::text label, 10::int4 log2m, 4::int4 regwidth, -1::int8 expthresh,
    1::int4 sparseon, '{11,5,-1,1}'::text[] mods, ${hllNamespace}.hll_typmod_in('{11,5,-1,1}'::cstring[]) typmod,
    false explicit`;
export const hllNullInputs = `(select NULL::${hllType} lhs, NULL::${hllType} rhs, NULL::${hllHashvalType} hv, NULL::int4 i4,
  NULL::int8 i8, NULL::int2 i2, NULL::bool flag, NULL::bytea raw, NULL::bytea packed, NULL::text label, NULL::int4 log2m,
  NULL::int4 regwidth, NULL::int8 expthresh, NULL::int4 sparseon, NULL::text[] mods, NULL::int4 typmod,
  NULL::bool explicit) hll_inputs`;

export async function withHllApi(
  work: (fixture: {
    client: pg.Client;
    url: string;
    connection: DatabaseConnection<typeof relations>;
    api: typeof hllApi;
  }) => Promise<void>,
  proofCaseId?: string,
) {
  await withExtensionDatabase(async (url) => {
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    try {
      const server = await client.query("select current_setting('server_version_num')::int version");
      assert.equal(Math.floor(server.rows[0].version / 10000), 18);
      await client.query(
        `create schema ${hllNamespace}; create extension hll with schema ${hllNamespace} version '2.21'`,
      );
      if (proofCaseId) await observeExtensionProofDatabase(url, proofCaseId, "hll");
      for (const statement of await migrationStatements(await emptySnapshot("app"), await createSnapshot(hllManaged)))
        await client.query(statement);
      await client.query(`create table hll_inputs as ${inputs}`);
      const connection = await connectDatabase({
        schema: hllManaged,
        relations,
        connectionString: url,
      });
      try {
        await work({ client, url, connection, api: hllApi });
      } finally {
        await connection.close();
      }
    } finally {
      await client.end();
    }
  });
}

export type HllCaseCheck = <Value>(expression: SQL<Value>, text: (value: Value) => string | null) => Promise<void>;
export interface HllCase {
  readonly member: string;
  readonly expression: SQL;
  readonly native: string;
  /** Compares the decoded adapter result, in PostgreSQL ::text spelling, with the independent native oracle. */
  readonly check: (run: HllCaseCheck) => Promise<void>;
}
type Text<Value> = (value: Value) => string | null;
export const hllSketchText: Text<HllSketch | { hex: string } | null> = (value) => value && `\\x${value.hex}`;
const scalarText: Text<HllHashval | number | string | null> = (value) => (value === null ? null : String(value));
const boolText: Text<boolean | null> = (value) => (value === null ? null : String(value));
const floatText: Text<number | NonfiniteNumber | null> = (value) =>
  value === null ? null : v.is(v.number(), value) ? String(value) : value.nonfinite;
const expthreshText: Text<{ readonly specified: bigint; readonly effective: bigint } | null> = (value) =>
  value && `(${value.specified},${value.effective})`;
function scalar<Value>(member: string, expression: SQL<Value>, native: string, text: Text<Value>): HllCase {
  return { member, expression, native, check: (run) => run(expression, text) };
}
export function hllScalarCases(api = hllApi): readonly HllCase[] {
  const lhs = sql<HllSketch>`lhs`,
    rhs = sql<HllSketch>`rhs`,
    hv = sql<HllHashval>`hv`,
    i4 = sql<number>`i4`,
    i8 = sql<bigint>`i8`,
    i2 = sql<number>`i2`,
    flag = sql<boolean>`flag`,
    raw = sql<{ hex: string }>`raw`,
    label = sql<string>`label`,
    log2m = sql<number>`log2m`,
    regwidth = sql<number>`regwidth`,
    expthresh = sql<bigint>`expthresh`,
    sparseon = sql<number>`sparseon`;
  const n = hllNamespace,
    h = "$extension:hll.hll",
    hvt = "$extension:hll.hll_hashval";
  const property = (name: "hll_log2m" | "hll_regwidth" | "hll_schema_version" | "hll_sparseon" | "hll_type"): HllCase =>
    scalar(`routine:$extension:hll.${name}(${h})`, api.sql.functions[name](rhs), `${n}.${name}(rhs)`, scalarText);
  return [
    scalar(
      `cast:${h}->${h}`,
      api.sql.casts.hll_to_hll(lhs, { log2m: 11, regwidth: 5, expthresh: -1, sparseon: 1 }),
      `lhs::${hllType}(11,5,-1,1)`,
      hllSketchText,
    ),
    scalar(
      `cast:pg_catalog.bytea->${h}`,
      api.sql.casts.bytea_to_hll(sql<{ hex: string }>`packed`),
      `packed::${hllType}`,
      hllSketchText,
    ),
    scalar(`cast:pg_catalog.int4->${hvt}`, api.sql.casts.int4_to_hll_hashval(i4), `i4::${hllHashvalType}`, scalarText),
    scalar(`cast:pg_catalog.int8->${hvt}`, api.sql.casts.int8_to_hll_hashval(i8), `i8::${hllHashvalType}`, scalarText),
    scalar(`operator:$extension:hll.#(,${h})`, api.sql.operators.cardinality(rhs), `(operator(${n}.#) rhs)`, floatText),
    scalar(
      `operator:$extension:hll.<>(${hvt},${hvt})`,
      api.sql.operators.hashvalNotEqual(hv, api.sql.functions.hll_hash_integer(i4)),
      `(hv operator(${n}.<>) ${n}.hll_hash_integer(i4))`,
      boolText,
    ),
    scalar(`operator:$extension:hll.<>(${h},${h})`, api.notEqual(lhs, rhs), `(lhs operator(${n}.<>) rhs)`, boolText),
    scalar(
      `operator:$extension:hll.=(${hvt},${hvt})`,
      api.sql.operators.hashvalEqual(hv, api.sql.functions.hll_hash_integer(i4)),
      `(hv operator(${n}.=) ${n}.hll_hash_integer(i4))`,
      boolText,
    ),
    scalar(`operator:$extension:hll.=(${h},${h})`, api.equal(lhs, rhs), `(lhs operator(${n}.=) rhs)`, boolText),
    scalar(
      `operator:$extension:hll.||(${hvt},${h})`,
      api.sql.operators.addReverse(hv, lhs),
      `(hv operator(${n}.||) lhs)`,
      hllSketchText,
    ),
    scalar(
      `operator:$extension:hll.||(${h},${hvt})`,
      api.sql.operators.add(lhs, hv),
      `(lhs operator(${n}.||) hv)`,
      hllSketchText,
    ),
    scalar(
      `operator:$extension:hll.||(${h},${h})`,
      api.sql.operators.union(lhs, rhs),
      `(lhs operator(${n}.||) rhs)`,
      hllSketchText,
    ),
    scalar(
      `routine:$extension:hll.hll_add_rev(${hvt},${h})`,
      api.sql.functions.hll_add_rev(hv, rhs),
      `${n}.hll_add_rev(hv,rhs)`,
      hllSketchText,
    ),
    scalar(`routine:$extension:hll.hll_add(${h},${hvt})`, api.add(rhs, hv), `${n}.hll_add(rhs,hv)`, hllSketchText),
    scalar(
      `routine:$extension:hll.hll_cardinality(${h})`,
      api.cardinality(rhs),
      `${n}.hll_cardinality(rhs)`,
      floatText,
    ),
    scalar("routine:$extension:hll.hll_empty()", api.empty.defaults(), `${n}.hll_empty()`, hllSketchText),
    scalar(
      "routine:$extension:hll.hll_empty(pg_catalog.int4,pg_catalog.int4,pg_catalog.int8,pg_catalog.int4)",
      api.empty.sparseon(log2m, regwidth, expthresh, sparseon),
      `${n}.hll_empty(log2m,regwidth,expthresh,sparseon)`,
      hllSketchText,
    ),
    scalar(
      "routine:$extension:hll.hll_empty(pg_catalog.int4,pg_catalog.int4,pg_catalog.int8)",
      api.empty.expthresh(log2m, regwidth, expthresh),
      `${n}.hll_empty(log2m,regwidth,expthresh)`,
      hllSketchText,
    ),
    scalar(
      "routine:$extension:hll.hll_empty(pg_catalog.int4,pg_catalog.int4)",
      api.empty.regwidth(log2m, regwidth),
      `${n}.hll_empty(log2m,regwidth)`,
      hllSketchText,
    ),
    scalar(
      "routine:$extension:hll.hll_empty(pg_catalog.int4)",
      api.empty.log2m(log2m),
      `${n}.hll_empty(log2m)`,
      hllSketchText,
    ),
    scalar(
      `routine:$extension:hll.hll_eq(${h},${h})`,
      api.sql.functions.hll_eq(lhs, lhs),
      `${n}.hll_eq(lhs,lhs)`,
      boolText,
    ),
    scalar(
      `routine:$extension:hll.hll_expthresh(${h})`,
      api.sql.functions.hll_expthresh(rhs),
      `${n}.hll_expthresh(rhs)`,
      expthreshText,
    ),
    scalar(
      "routine:$extension:hll.hll_hash_any(pg_catalog.anyelement,pg_catalog.int4)",
      api.hash.any(label, i4),
      `${n}.hll_hash_any(label,i4)`,
      scalarText,
    ),
    scalar(
      "routine:$extension:hll.hll_hash_bigint(pg_catalog.int8,pg_catalog.int4)",
      api.hash.bigint(i8),
      `${n}.hll_hash_bigint(i8)`,
      scalarText,
    ),
    scalar(
      "routine:$extension:hll.hll_hash_boolean(pg_catalog.bool,pg_catalog.int4)",
      api.hash.boolean(flag, i4),
      `${n}.hll_hash_boolean(flag,i4)`,
      scalarText,
    ),
    scalar(
      "routine:$extension:hll.hll_hash_bytea(pg_catalog.bytea,pg_catalog.int4)",
      api.hash.bytea(raw),
      `${n}.hll_hash_bytea(raw)`,
      scalarText,
    ),
    scalar(
      "routine:$extension:hll.hll_hash_integer(pg_catalog.int4,pg_catalog.int4)",
      api.hash.integer(i4, i4),
      `${n}.hll_hash_integer(i4,i4)`,
      scalarText,
    ),
    scalar(
      "routine:$extension:hll.hll_hash_smallint(pg_catalog.int2,pg_catalog.int4)",
      api.hash.smallint(i2),
      `${n}.hll_hash_smallint(i2)`,
      scalarText,
    ),
    scalar(
      "routine:$extension:hll.hll_hash_text(pg_catalog.text,pg_catalog.int4)",
      api.hash.text(label),
      `${n}.hll_hash_text(label)`,
      scalarText,
    ),
    scalar(
      `routine:$extension:hll.hll_hashval_eq(${hvt},${hvt})`,
      api.sql.functions.hll_hashval_eq(hv, hv),
      `${n}.hll_hashval_eq(hv,hv)`,
      boolText,
    ),
    scalar(
      "routine:$extension:hll.hll_hashval_int4(pg_catalog.int4)",
      api.sql.functions.hll_hashval_int4(i4),
      `${n}.hll_hashval_int4(i4)`,
      scalarText,
    ),
    scalar(
      `routine:$extension:hll.hll_hashval_ne(${hvt},${hvt})`,
      api.sql.functions.hll_hashval_ne(hv, hv),
      `${n}.hll_hashval_ne(hv,hv)`,
      boolText,
    ),
    scalar(
      "routine:$extension:hll.hll_hashval(pg_catalog.int8)",
      api.sql.functions.hll_hashval(i8),
      `${n}.hll_hashval(i8)`,
      scalarText,
    ),
    property("hll_log2m"),
    scalar(
      `routine:$extension:hll.hll_ne(${h},${h})`,
      api.sql.functions.hll_ne(lhs, rhs),
      `${n}.hll_ne(lhs,rhs)`,
      boolText,
    ),
    scalar(
      `routine:$extension:hll.hll_print(${h})`,
      api.sql.functions.hll_print(rhs),
      `${n}.hll_print(rhs)`,
      scalarText,
    ),
    property("hll_regwidth"),
    property("hll_schema_version"),
    scalar(
      `routine:$extension:hll.hll_send(${h})`,
      api.sql.functions.hll_send(rhs),
      `${n}.hll_send(rhs)`,
      hllSketchText,
    ),
    property("hll_sparseon"),
    property("hll_type"),
    scalar(
      "routine:$extension:hll.hll_typmod_in(pg_catalog._cstring)",
      api.sql.functions.hll_typmod_in(sql<string[]>`mods::pg_catalog.cstring[]`),
      `${n}.hll_typmod_in(mods::cstring[])`,
      scalarText,
    ),
    scalar(
      `routine:$extension:hll.hll_union(${h},${h})`,
      api.union(lhs, rhs),
      `${n}.hll_union(lhs,rhs)`,
      hllSketchText,
    ),
    scalar(
      `routine:$extension:hll.hll(${h},pg_catalog.int4,pg_catalog.bool)`,
      api.sql.functions.hll(lhs, sql<number>`typmod`, sql<boolean>`explicit`),
      `${n}.hll(lhs,typmod,explicit)`,
      hllSketchText,
    ),
  ];
}
