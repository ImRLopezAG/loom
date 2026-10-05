import { sql, type SQL } from "drizzle-orm";
import {
  createSeg_1_4,
  segBoundary,
  segPoint,
  type SegValue,
  type NonfiniteNumber,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/adapters/seg";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
const api = createSeg_1_4({
  name: "seg",
  version: "1.4",
  schema: 'Seg"日本',
  apiSupport: { status: "verified", digest: "bba7c8f626ee6352397bd765ae103231780c7aa366ff9819bcf948ed22bd5fff" },
});
const lhs = segPoint(segBoundary("6.50")),
  rhs = segPoint(segBoundary("6.5"));
const array: PostgreSqlArray<SegValue> = { dimensions: [{ lowerBound: -2, length: 2 }], values: [lhs, null] };
const schema = defineSchema(() => ({ entries: { value: api.field().notNull(), tags: api.arrayField() } }));
const column: SQL<boolean | null> = api.equal(schema.tables.entries.value, lhs);
const version: "1.4" = api.version;
const result0: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:seg.@>($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result1: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:seg.&&($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result2: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:seg.&<($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result3: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:seg.&>($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result4: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:seg.<($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result5: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:seg.<@($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result6: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:seg.<<($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result7: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:seg.<=($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result8: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:seg.<>($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result9: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:seg.=($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result10: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:seg.>($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result11: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:seg.>=($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result12: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:seg.>>($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result13: SQL<number | NonfiniteNumber | null> =
  api.sql.overloads["routine:$extension:seg.seg_center($extension:seg.seg)"](lhs);
const result14: SQL<number | null> = api.sql.overloads[
  "routine:$extension:seg.seg_cmp($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result15: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:seg.seg_contained($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result16: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:seg.seg_contains($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result17: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:seg.seg_different($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result18: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:seg.seg_ge($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result19: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:seg.seg_gt($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result20: SQL<SegValue | null> = api.sql.overloads[
  "routine:$extension:seg.seg_inter($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result21: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:seg.seg_le($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result22: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:seg.seg_left($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result23: SQL<number | NonfiniteNumber | null> =
  api.sql.overloads["routine:$extension:seg.seg_lower($extension:seg.seg)"](lhs);
const result24: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:seg.seg_lt($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result25: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:seg.seg_over_left($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result26: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:seg.seg_over_right($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result27: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:seg.seg_overlap($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result28: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:seg.seg_right($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result29: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:seg.seg_same($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result30: SQL<number | NonfiniteNumber | null> =
  api.sql.overloads["routine:$extension:seg.seg_size($extension:seg.seg)"](lhs);
const result31: SQL<SegValue | null> = api.sql.overloads[
  "routine:$extension:seg.seg_union($extension:seg.seg,$extension:seg.seg)"
](lhs, rhs);
const result32: SQL<number | NonfiniteNumber | null> =
  api.sql.overloads["routine:$extension:seg.seg_upper($extension:seg.seg)"](lhs);
// @ts-expect-error Native text cannot substitute for a structured seg value.
api.equal("6.50", lhs);
// @ts-expect-error Precision tokens are decimal strings, not lossy JS numbers.
segBoundary(6.5);
// @ts-expect-error Only the captured certainty markers are allowed.
segBoundary("1", "?");
// @ts-expect-error Result codec cannot be chosen by the caller.
api.lower<string>(lhs);
// @ts-expect-error Backend internal callbacks are not ordinary query helpers.
api.sql.functions.gseg_consistent(lhs);
// @ts-expect-error Typed boolean SQL cannot substitute for a seg column.
api.contains(sql<boolean>`true`, lhs);
// @ts-expect-error Wrong selected version is rejected statically.
createSeg_1_4({ ...api, version: "1.3" });
// @ts-expect-error Arrays require explicit native bounds and dimensions.
api.arrayCodec.encode([lhs]);
void [
  array,
  column,
  version,
  result0,
  result1,
  result2,
  result3,
  result4,
  result5,
  result6,
  result7,
  result8,
  result9,
  result10,
  result11,
  result12,
  result13,
  result14,
  result15,
  result16,
  result17,
  result18,
  result19,
  result20,
  result21,
  result22,
  result23,
  result24,
  result25,
  result26,
  result27,
  result28,
  result29,
  result30,
  result31,
  result32,
];
