import { sql, type SQL } from "drizzle-orm";
import * as v from "valibot";
import {
  createHll_2_21,
  hllSketch,
  type HllSketch,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/adapters/hll";
import { withHllSession, type HllDefaults } from "../../../apps/loom/src/tooling/extensions/hll";
import type { NonfiniteNumber } from "../../../apps/loom/src/core/extensions/codecs";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";

const api = createHll_2_21({
  name: "hll",
  version: "2.21",
  schema: 'Hll"日本',
  apiSupport: {
    status: "verified",
    digest: "44f6623b1b7a463ea7cb26fcd02b434cb33c36a4bd9edfe0397e2536f66f6b19",
  },
});
const sketch = hllSketch("118b7f");
const array: PostgreSqlArray<HllSketch> = {
  dimensions: [{ lowerBound: 1, length: 2 }],
  values: [sketch, null],
};
const schema = defineSchema(() => ({
  sketches: {
    value: api.field().notNull(),
    sized: api.field({ log2m: 10, regwidth: 4, expthresh: -1, sparseon: 1 }),
    hash: api.hashvalField(),
  },
}));
const version: "2.21" = api.version;
const column: SQL<boolean | null> = api.equal(schema.tables.sketches.value, sketch);
const o = api.sql.overloads;
const h = "$extension:hll.hll" as const;
const results = [
  o["operator:$extension:hll.#(,$extension:hll.hll)"](sketch) satisfies SQL<number | NonfiniteNumber | null>,
  o["operator:$extension:hll.||($extension:hll.hll,$extension:hll.hll_hashval)"](
    sketch,
    1n,
  ) satisfies SQL<HllSketch | null>,
  o["operator:$extension:hll.||($extension:hll.hll_hashval,$extension:hll.hll)"](
    1n,
    sketch,
  ) satisfies SQL<HllSketch | null>,
  o["operator:$extension:hll.=($extension:hll.hll_hashval,$extension:hll.hll_hashval)"](1n, 2n) satisfies SQL<
    boolean | null
  >,
  o[
    "routine:$extension:hll.hll_add_agg($extension:hll.hll_hashval,pg_catalog.int4,pg_catalog.int4,pg_catalog.int8,pg_catalog.int4)"
  ](1n, 12, 5, -1n, 1) satisfies SQL<HllSketch | null>,
  o["routine:$extension:hll.hll_empty()"]() satisfies SQL<HllSketch | null>,
  o["routine:$extension:hll.hll_empty(pg_catalog.int4,pg_catalog.int4,pg_catalog.int8)"](
    10,
    4,
    -1n,
  ) satisfies SQL<HllSketch | null>,
  o["routine:$extension:hll.hll_expthresh($extension:hll.hll)"](sketch) satisfies SQL<{
    readonly specified: bigint;
    readonly effective: bigint;
  } | null>,
  o["routine:$extension:hll.hll_hash_text(pg_catalog.text,pg_catalog.int4)"]("a") satisfies SQL<bigint | null>,
  o["routine:$extension:hll.hll_hash_text(pg_catalog.text,pg_catalog.int4)"]("a", 0) satisfies SQL<bigint | null>,
  o["routine:$extension:hll.hll_hash_any(pg_catalog.anyelement,pg_catalog.int4)"](sql`label`) satisfies SQL<
    bigint | null
  >,
  o["routine:$extension:hll.hll_send($extension:hll.hll)"](sketch) satisfies SQL<{ hex: string } | null>,
  o["routine:$extension:hll.hll_print($extension:hll.hll)"](sketch) satisfies SQL<string | null>,
  o["routine:$extension:hll.hll_typmod_in(pg_catalog._cstring)"](["12", "5"]) satisfies SQL<number | null>,
  o[`routine:$extension:hll.hll(${h},pg_catalog.int4,pg_catalog.bool)`](
    sketch,
    1,
    false,
  ) satisfies SQL<HllSketch | null>,
  o["cast:pg_catalog.bytea->$extension:hll.hll"]({
    hex: "118b7f",
  }) satisfies SQL<HllSketch | null>,
  api.sql.casts.hll_to_hll(sketch, {
    log2m: 12,
    regwidth: 5,
    expthresh: -1,
    sparseon: 1,
  }) satisfies SQL<HllSketch | null>,
  api.unionAggregate.filter(sql<boolean>`ok`, sketch) satisfies SQL<HllSketch | null>,
  api.addAggregate.hashval.over({}, 1n) satisfies SQL<HllSketch | null>,
];
const defaults: HllDefaults = {
  log2m: 11,
  regwidth: 5,
  expthresh: -1,
  sparseon: 1,
};
// @ts-expect-error hll_hashval is an exact int8 bigint, not a lossy JS number.
api.add(sketch, 1);
// @ts-expect-error Storage bytes are an opaque hex record, not native text.
api.cardinality("\\x118b7f");
// @ts-expect-error The int8 expthresh overload position requires bigint.
api.empty.expthresh(10, 4, -1);
// @ts-expect-error hll_hash_any is polymorphic; raw JS values have no PostgreSQL element type.
api.hash.any("a");
// @ts-expect-error PostgreSQL rejects DISTINCT for hll aggregates, so no helper is offered.
api.addAggregate.hashval.distinct(1n);
// @ts-expect-error Aggregate transition and finalizer internals are not query helpers.
api.sql.functions.hll_add_trans0(sketch);
// @ts-expect-error Process-local setters are operator tooling, never query helpers.
api.sql.functions.hll_set_defaults(11, 5, -1n, 1);
// @ts-expect-error Unconstructible internal-argument routines are not exported.
api.sql.functions.hll_card_unpacked(sketch);
// @ts-expect-error Result codecs cannot be chosen by the caller.
api.cardinality<string>(sketch);
// @ts-expect-error Wrong selected version is rejected statically.
createHll_2_21({ ...api, version: "2.20" });
// @ts-expect-error Arrays require explicit native bounds and dimensions.
api.arrayCodec.encode([sketch]);
// @ts-expect-error Tooling sessions require the exact selected version.
void withHllSession("postgres://unused/db", { ...api, version: "2.20" }, async () => 1);
const settled: Promise<{ readonly completion: "committed"; readonly value: readonly number[] }> = withHllSession(
  "postgres://unused/db",
  api,
  async (session) => {
    // @ts-expect-error The owned operator backend is never exposed to the callback.
    void session.client;
    // @ts-expect-error Rows are parsed by an explicit schema; unparsed dictionaries are not offered.
    void session.query("select 1 value");
    // @ts-expect-error Query values are a positional parameter array.
    void session.query("select $1::int value", v.number(), 1);
    return session.query(
      "select $1::int value",
      v.pipe(
        v.strictObject({ value: v.number() }),
        v.transform((row) => row.value),
      ),
      [1],
    );
  },
);
void settled;
void [array, version, column, results, defaults];
