import { sql, type SQL } from "drizzle-orm";
import {
  createPrefix_1_2_0,
  prefixRange,
  type PrefixRange,
  type NonfiniteNumber,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/adapters/prefix";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";

const api = createPrefix_1_2_0({
  name: "prefix",
  version: "1.2.0",
  schema: 'Prefix"日本',
  apiSupport: {
    status: "verified",
    digest: "954698fcbe5ada03bdf4bcbd9b22014e77570456f0d8471d4ca2bd99d75581a7",
  },
});
const lhs = prefixRange("123"),
  rhs = prefixRange("123[4-5]");
const array: PostgreSqlArray<PrefixRange> = { dimensions: [{ lowerBound: -2, length: 2 }], values: [lhs, null] };
const schema = defineSchema(() => ({ entries: { value: api.field().notNull(), tags: api.arrayField() } }));
const column: SQL<boolean | null> = api.equal(schema.tables.entries.value, lhs);
const version: "1.2.0" = api.version;
const result0: SQL<string | null> = api.sql.overloads["cast:$extension:prefix.prefix_range->pg_catalog.text"](lhs);
const result1: SQL<PrefixRange | null> = api.sql.overloads["cast:pg_catalog.text->$extension:prefix.prefix_range"](
  "123",
);
const result2: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:prefix.@>($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result3: SQL<PrefixRange | null> = api.sql.overloads[
  "operator:$extension:prefix.&($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result4: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:prefix.&&($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result5: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:prefix.<($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result6: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:prefix.<@($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result7: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:prefix.<=($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result8: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:prefix.<>($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result9: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:prefix.=($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result10: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:prefix.>($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result11: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:prefix.>=($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result12: SQL<PrefixRange | null> = api.sql.overloads[
  "operator:$extension:prefix.|($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result13: SQL<number | null> =
  api.sql.overloads["routine:$extension:prefix.length($extension:prefix.prefix_range)"](lhs);
const result14: SQL<number | NonfiniteNumber | null> = api.sql.overloads[
  "routine:$extension:prefix.pr_penalty($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result15: SQL<number | null> = api.sql.overloads[
  "routine:$extension:prefix.prefix_range_cmp($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result16: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:prefix.prefix_range_contained_by_strict($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result17: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:prefix.prefix_range_contained_by($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result18: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:prefix.prefix_range_contains_strict($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result19: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:prefix.prefix_range_contains($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result20: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:prefix.prefix_range_eq($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result21: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:prefix.prefix_range_ge($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result22: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:prefix.prefix_range_gt($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result23: SQL<PrefixRange | null> = api.sql.overloads[
  "routine:$extension:prefix.prefix_range_inter($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result24: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:prefix.prefix_range_le($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result25: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:prefix.prefix_range_lt($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result26: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:prefix.prefix_range_neq($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result27: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:prefix.prefix_range_overlaps($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result28: SQL<{ readonly hex: string } | null> =
  api.sql.overloads["routine:$extension:prefix.prefix_range_send($extension:prefix.prefix_range)"](lhs);
const result29: SQL<PrefixRange | null> = api.sql.overloads[
  "routine:$extension:prefix.prefix_range_union($extension:prefix.prefix_range,$extension:prefix.prefix_range)"
](lhs, rhs);
const result30: SQL<PrefixRange | null> = api.sql.overloads[
  "routine:$extension:prefix.prefix_range(pg_catalog.text,pg_catalog.text,pg_catalog.text)"
]("123", "4", "5");
const result31: SQL<PrefixRange | null> =
  api.sql.overloads["routine:$extension:prefix.prefix_range(pg_catalog.text)"]("123");
const result32: SQL<string | null> =
  api.sql.overloads["routine:$extension:prefix.text($extension:prefix.prefix_range)"](lhs);
// @ts-expect-error Native text cannot substitute for a branded prefix_range value.
api.equal("123", lhs);
// @ts-expect-error Semver strings are not prefix_range values.
api.contains("1.2.3", lhs);
// @ts-expect-error Result codec cannot be chosen by the caller.
api.length<string>(lhs);
// @ts-expect-error Backend GiST callbacks are not ordinary query helpers.
api.sql.functions.gpr_consistent(lhs);
// @ts-expect-error Typed boolean SQL cannot substitute for a prefix_range column.
api.contains(sql<boolean>`true`, lhs);
// @ts-expect-error Wrong selected version is rejected statically.
createPrefix_1_2_0({ ...api, version: "1.1.0" });
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
