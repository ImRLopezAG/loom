import { arrayCodec, nullableCodec, type PostgreSqlArray } from "../codecs";
import { int4Codec } from "../native-codecs";

export type { PostgreSqlArray } from "../codecs";

/** Native `_int4` with dimensions, lower bounds, and NULL elements. Not the null-free intarray collapse. */
export const intaggInt4ArrayCodec = arrayCodec(int4Codec);
export const nullableIntaggInt4ArrayCodec = nullableCodec(intaggInt4ArrayCodec);

/** One-dimensional helper; empty input has no retained bounds, matching PostgreSQL array I/O. */
export function int4NativeArray(values: readonly (number | null)[], lowerBound = 1): PostgreSqlArray<number> {
  if (values.length === 0) return { dimensions: [], values: [] };
  return { dimensions: [{ lowerBound, length: values.length }], values };
}
