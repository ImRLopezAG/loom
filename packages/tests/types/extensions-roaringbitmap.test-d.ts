import { sql, type SQL } from "drizzle-orm";
import {
  createRoaringbitmap_1_2,
  type PostgreSqlArray,
  type RoaringBitmap,
  type RoaringBitmap64,
} from "../../../apps/loom/src/core/extensions/adapters/roaringbitmap";
import type { NonfiniteNumber } from "../../../apps/loom/src/core/extensions/codecs";

const rb = createRoaringbitmap_1_2({
  name: "roaringbitmap",
  version: "1.2",
  schema: "bits",
  apiSupport: { status: "verified", digest: "967ad98be988b37be7f198057e9f02bcbe325a0eab5364722ba4c6763cbc406a" },
});
const name: "roaringbitmap" = rb.name;
const version: "1.2" = rb.version;
const schema: "bits" = rb.schema;
const f = rb.sql.functions,
  o32 = rb.sql.operators.roaringbitmap,
  o64 = rb.sql.operators.roaringbitmap64;
const bits = sql<RoaringBitmap>`bits`,
  bits64 = sql<RoaringBitmap64>`bits64`;

const union: SQL<RoaringBitmap | null> = f.rb_or(bits, [1, -1]);
const union64: SQL<RoaringBitmap64 | null> = f.rb64_or(bits64, [1n, -1n]);
const count: SQL<bigint | null> = f.rb_cardinality(bits);
const directCount: SQL<bigint | null> = rb.cardinality(bits);
const directCount64: SQL<bigint | null> = rb.bitmap64.cardinality(bits64);
const minimum: SQL<number | null> = f.rb_min(bits);
const minimum64: SQL<bigint | null> = f.rb64_min(bits64);
const members: SQL<PostgreSqlArray<number> | null> = f.rb_to_array(bits);
const members64: SQL<PostgreSqlArray<bigint> | null> = f.rb64_to_array(bits64);
const rows: SQL<number | null> = f.rb_iterate(bits);
const distance: SQL<number | NonfiniteNumber | null> = f.rb_jaccard_dist(bits, bits);
const bytes: SQL<{ hex: string } | null> = f.roaringbitmap_send(bits);
const parsed: SQL<RoaringBitmap | null> = f.roaringbitmap({ hex: "3a30000000000000" });
const widened: SQL<RoaringBitmap64 | null> = rb.sql.casts.roaringbitmap_to_roaringbitmap64(bits);
const narrowed: SQL<RoaringBitmap | null> = f.rb64_to_roaringbitmap(bits64);
const aggregated: SQL<RoaringBitmap | null> = f.rb_or_agg(bits);
const filtered: SQL<bigint | null> = f.rb64_xor_cardinality_agg.filter(sql<boolean>`true`, bits64);
const built: SQL<RoaringBitmap64 | null> = f.rb64_build_agg.distinct(sql<bigint>`member`);
const contains: SQL<boolean | null> = o32.containsElement(bits, -1);
const contains64: SQL<boolean | null> = o64.elementContainedBy(-1n, bits64);
f.rb_select(bits, 10n);
f.rb_select(bits, 10n, 2n, true, 0n, 4294967296n);
f.rb64_select(bits64, 10n, undefined, undefined, -1n);
f.rb_add.bitmapElement(bits, null);
f.rb_add.elementBitmap(null, bits);
f.rb_build({ dimensions: [{ lowerBound: 1, length: 2 }], values: [1, null] });
f.rb64_build(null);
f.rb_fill(bits, 0n, 10n);
f.rb64_shiftleft(bits64, -1n);
rb.field();
rb.array64Field();

// @ts-expect-error 32-bit members are int4 numbers, never bigint.
f.rb_add.bitmapElement(bits, 1n);
// @ts-expect-error Direct helpers preserve the 32-bit member contract.
rb.add.bitmapElement(bits, 1n);
// @ts-expect-error The wide direct helpers preserve exact bigint members.
rb.bitmap64.add.bitmapElement(bits64, 1);
// @ts-expect-error 64-bit members are exact int8 bigints, never lossy numbers.
f.rb64_add.bitmapElement(bits64, 1);
// @ts-expect-error Range bounds are int8 bigints for both widths.
f.rb_range(bits, 0, 10);
// @ts-expect-error Widths are distinct native types.
f.rb_or(bits64, bits);
// @ts-expect-error Overloads are selected by name, never guessed from runtime values.
f.rb_contains(bits, 1);
// @ts-expect-error The bitset limit is required.
f.rb_select(bits);
// @ts-expect-error Bitmap aggregates cannot use DISTINCT without a btree/hash opclass.
f.rb_or_agg.distinct(bits);
// @ts-expect-error Casting to bytea yields bytes, not members.
const wrong: SQL<RoaringBitmap | null> = rb.sql.casts.roaringbitmap_to_bytea(bits);
// @ts-expect-error Internal aggregate state routines are not public bindings.
void f.rb_or_trans;
// @ts-expect-error Type I/O callbacks are not public bindings.
void f.roaringbitmap_in;

export {
  name,
  version,
  schema,
  union,
  union64,
  count,
  directCount,
  directCount64,
  minimum,
  minimum64,
  members,
  members64,
  rows,
  distance,
  bytes,
  parsed,
  widened,
  narrowed,
  aggregated,
  filtered,
  built,
  contains,
  contains64,
  wrong,
};
