/** Packed consumers generate the application RPC before checking its transaction-bound context. */
export const roaringbitmapPackedPlacement = "packed_bitmap_tools";

export const roaringbitmapPackedSchema = `import { defineSchema } from "kello/server";
import { extensions } from "./_generated/extensions";
const api = extensions.roaringbitmap;
if (api.version !== "1.2" || api.schema !== "packed_bitmap_tools" || Object.keys(api.sql.overloads).length !== 132)
  throw new Error("Wrong first-load roaringbitmap binding");
export default defineSchema(s => ({
  writes: { value: s.text().notNull() },
  segments: { bits: api.field().notNull(), bits64: api.field64(), history: api.arrayField(), history64: api.array64Field() },
}), { namespace: "packed_app" });`;

export const roaringbitmapPackedContract = `import { defineContract, oc } from "kello/contract";
import type { PostgreSqlArray, RoaringBitmap, RoaringBitmap64 } from "kello/extensions/roaringbitmap";
import * as v from "valibot";
const bitmap = v.array(v.number()), bitmap64 = v.array(v.bigint());
type ArrayValues<T> = readonly (T | null | ArrayValues<T>)[];
const values: v.GenericSchema<ArrayValues<RoaringBitmap>> = v.lazy(() => v.array(v.union([bitmap, v.null(), values])));
const values64: v.GenericSchema<ArrayValues<RoaringBitmap64>> = v.lazy(() => v.array(v.union([bitmap64, v.null(), values64])));
const dimensions = v.array(v.object({ lowerBound: v.number(), length: v.number() }));
const history: v.GenericSchema<PostgreSqlArray<RoaringBitmap>> = v.object({ dimensions, values });
const history64: v.GenericSchema<PostgreSqlArray<RoaringBitmap64>> = v.object({ dimensions, values: values64 });
export default defineContract({ list: oc.output(v.object({
  rows: v.array(v.object({
    bits: bitmap, bits64: v.nullable(bitmap64),
    history: v.nullable(history), history64: v.nullable(history64),
    count: v.nullable(v.bigint()), max: v.nullable(v.number()), widened: v.nullable(bitmap64),
    union: v.nullable(bitmap), contains: v.nullable(v.boolean()), selected: v.nullable(bitmap),
    jaccard: v.nullable(v.union([v.number(), v.object({ nonfinite: v.picklist(["NaN", "Infinity", "-Infinity"]) })])), nullMax: v.nullable(v.number()),
  })),
  aggregate: v.object({ or: v.nullable(bitmap), count: v.nullable(v.bigint()), built: v.nullable(bitmap64) }),
})) });`;

export const roaringbitmapPackedFunctions = `import { os } from "../_generated/rpc";
import { Extensions } from "../_generated/server";
import { extensions } from "../_generated/extensions";
import type { PostgreSqlArray, RoaringBitmap, RoaringBitmap64 } from "kello/extensions/roaringbitmap";
import { Effect } from "effect";
import { sql } from "drizzle-orm";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context }) => {
  const binding = Effect.runSync(Effect.provide(Extensions, context["effect/context"]));
  if (binding !== context.extensions || binding !== extensions) throw new Error("Generated RPC/Effect selection differs");
  const api = binding.roaringbitmap;
  const placement: "packed_bitmap_tools" = api.schema;
  const version: "1.2" = api.version;
  void [placement, version];
  const f = api.sql.functions, segments = context.tables.segments;
  await context.db.insert(segments).values([
    { bits: [3, -1, 1, 3], bits64: [-1n, 9223372036854775807n, 0n], history: { dimensions: [{ lowerBound: 0, length: 2 }], values: [[2, 1], null] }, history64: null },
    { bits: [], bits64: null, history: null, history64: { dimensions: [{ lowerBound: 1, length: 1 }], values: [[4294967296n]] } },
  ]);
  const rows = await context.db.select({
    bits: segments.bits, bits64: segments.bits64, history: segments.history, history64: segments.history64,
    count: api.cardinality(segments.bits), max: f.rb_max(segments.bits), widened: api.sql.casts.roaringbitmap_to_roaringbitmap64(segments.bits),
    union: api.sql.operators.roaringbitmap.or(segments.bits, [7]), contains: api.sql.operators.roaringbitmap.containsElement(segments.bits, -1),
    selected: f.rb_select([1, 2, 3, -1], 2n, undefined, true), jaccard: f.rb_jaccard_dist([], []), nullMax: f.rb_max(null),
  }).from(segments).orderBy(f.rb_cardinality(segments.bits));
  const row = rows[0];
  if (!row) throw new Error("Missing native roaringbitmap row");
  const bits: RoaringBitmap = row.bits;
  const bits64: RoaringBitmap64 | null = row.bits64;
  const history: PostgreSqlArray<RoaringBitmap | null> | null = row.history;
  const history64: PostgreSqlArray<RoaringBitmap64 | null> | null = row.history64;
  const rowCount: bigint | null = row.count;
  // @ts-expect-error A NOT NULL bitmap field decodes to int4 members, never bigint members.
  const wrong: RoaringBitmap64 = row.bits;
  // @ts-expect-error Nullable fields keep SQL NULL in their decoded type.
  const present: RoaringBitmap64 = row.bits64;
  void [bits, bits64, history, history64, rowCount, wrong, present];
  const [aggregate] = await context.db.select({ or: f.rb_or_agg(segments.bits), count: f.rb_or_cardinality_agg(segments.bits), built: f.rb64_build_agg.distinct(sql<bigint>\`member\`) }).from(sql.raw("(values (1::int8), (1), (-1)) fixture(member)")).leftJoin(segments, sql.raw("true"));
  if (!aggregate) throw new Error("Missing native roaringbitmap aggregate");
  return { rows, aggregate };
}) });`;
