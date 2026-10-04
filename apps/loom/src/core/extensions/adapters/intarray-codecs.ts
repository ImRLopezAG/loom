import * as v from "valibot";
import { arrayCodec, createExtensionCodec, type PostgreSqlArray } from "../codecs";
import { int4Codec } from "../native-codecs";

export type { PostgreSqlArray } from "../codecs";

/** Native `_int4` with dimensions, lower bounds and NULL elements; intarray itself rejects NULL elements. */
export const intarrayInt4ArrayCodec = arrayCodec(int4Codec);

const int4 = v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647));
const plainArray = v.array(v.nullable(int4));
const arrayArgument = v.custom<PostgreSqlArray<number>>(
  (value) => v.is(v.object({ dimensions: v.array(v.unknown()), values: v.array(v.unknown()) }), value),
  "Expected a PostgreSQL int4 array",
);
/**
 * `_int4` arguments: a plain one-dimensional `number[]` (drizzle `integer().array()` columns) or an exact
 * PostgreSqlArray (intarray results), so stored columns and composed results are both accepted.
 */
export const intarrayInt4ArgumentCodec = createExtensionCodec({
  id: "intarray:int4-array-argument:1",
  sqlType: { schema: "pg_catalog", name: "int4", array: true },
  input: v.union([plainArray, arrayArgument]),
  output: v.union([plainArray, arrayArgument]),
  transport: "text",
  encode: (value) =>
    Array.isArray(value)
      ? `{${value.map((entry) => (entry === null ? "NULL" : String(entry))).join(",")}}`
      : intarrayInt4ArrayCodec.encode(v.parse(arrayArgument, value)),
  decode: (value) => intarrayInt4ArrayCodec.decode(value),
});

/** One-dimensional `_int4` value; empty input has no retained bounds, matching PostgreSQL array I/O. */
export function intarrayValues(values: readonly number[], lowerBound = 1): PostgreSqlArray<number> {
  if (values.length === 0) return { dimensions: [], values: [] };
  return { dimensions: [{ lowerBound, length: values.length }], values };
}

/** `query_int` text, bound with its selected schema; PostgreSQL normalizes spacing and parentheses on output. */
export function createQueryIntCodec(schema: string) {
  return createExtensionCodec({
    id: "intarray:query_int:1",
    sqlType: { schema, name: "query_int" },
    input: v.string(),
    output: v.string(),
    transport: "text",
    encode: (value) => value,
    decode: (value) => value,
  });
}

/** PostgreSQL accepts every ASCII case combination of ASC or DESC. */
type Direction = `${"a" | "A"}${"s" | "S"}${"c" | "C"}` | `${"d" | "D"}${"e" | "E"}${"s" | "S"}${"c" | "C"}`;
export const intarraySortDirectionCodec = createExtensionCodec({
  id: "intarray:sort-direction:1",
  sqlType: { schema: "pg_catalog", name: "text" },
  input: v.custom<Direction>((value) => v.is(v.string(), value) && /^(asc|desc)$/i.test(value)),
  output: v.string(),
  transport: "native",
  encode: (value) => value,
  decode: (value) => value,
});
