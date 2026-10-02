import * as v from "valibot";
import { arrayCodec, createExtensionCodec } from "./codecs";

const int4 = v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647));
/** PostgreSQL int4 is an exact signed 32-bit number, independent of int8's bigint codec. */
export const int4Codec = createExtensionCodec({
  id: "pg:int4:1",
  sqlType: { schema: "pg_catalog", name: "int4" },
  input: int4,
  output: int4,
  transport: "native",
  encode: (value) => value,
  decode: (value) => (v.is(v.string(), value) ? Number(v.parse(v.pipe(v.string(), v.regex(/^-?\d+$/)), value)) : value),
});

const arrays = arrayCodec(int4Codec);
/** Shallow, one-dimensional, null-free int4 arrays used by the selected intarray adapter. */
export const int4ArrayCodec = createExtensionCodec({
  id: "pg:int4:array:null-free:1",
  sqlType: { schema: "pg_catalog", name: "int4", array: true },
  input: v.array(int4),
  output: v.array(int4),
  transport: "text",
  encode: (value) => `{${value.join(",")}}`,
  decode(value) {
    const array = arrays.decode(value);
    if (array.dimensions.length && (array.dimensions.length !== 1 || array.dimensions[0]?.lowerBound !== 1))
      throw new Error("intarray field requires one-dimensional arrays with lower bound 1");
    return array.values;
  },
});
