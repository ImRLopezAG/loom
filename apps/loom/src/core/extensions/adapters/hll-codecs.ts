import * as v from "valibot";
import { arrayCodec, createExtensionCodec, decodeFailure, type ExtensionCodec, type PostgreSqlArray } from "../codecs";
export type { PostgreSqlArray } from "../codecs";

const hex = v.pipe(
  v.string(),
  v.regex(/^(?:[0-9a-f]{2})+$/, "hll requires non-empty lowercase hexadecimal storage bytes"),
);
const sketch = v.strictObject({ hex });
/** Opaque hll storage bytes. hll_in owns schema-version, type and register validation. */
export type HllSketch = v.InferOutput<typeof sketch>;
export function hllSketch(value: string): HllSketch {
  return v.parse(sketch, { hex: value });
}
const int8 = v.pipe(v.bigint(), v.minValue(-9223372036854775808n), v.maxValue(9223372036854775807n));
/** A 64-bit hash value; hll_hashval_in accepts the same decimal grammar as int8. */
export type HllHashval = v.InferOutput<typeof int8>;

export function createHllCodec(schema: string) {
  return createExtensionCodec({
    id: "hll:hll:hex:1",
    sqlType: { schema, name: "hll" },
    input: sketch,
    output: sketch,
    transport: "text",
    encode: (value) => `\\x${value.hex}`,
    decode(value) {
      const text = v.parse(v.string(), value);
      if (!/^\\x(?:[0-9a-f]{2})+$/.test(text)) throw new Error("Invalid native hll text");
      return { hex: text.slice(2) };
    },
  });
}
export function createHllHashvalCodec(schema: string) {
  return createExtensionCodec({
    id: "hll:hll_hashval:int8:1",
    sqlType: { schema, name: "hll_hashval" },
    input: int8,
    output: int8,
    transport: "text",
    encode: (value) => value.toString(),
    decode: (value) => BigInt(v.parse(v.pipe(v.string(), v.regex(/^-?\d+$/)), value)),
  });
}
function boundedArray<Input, Output>(
  codec: ExtensionCodec<PostgreSqlArray<Input>, PostgreSqlArray<Output>>,
  label: string,
) {
  function bounds(value: PostgreSqlArray<Output> | PostgreSqlArray<Input>) {
    if (
      value.dimensions.length > 6 ||
      value.dimensions.some(
        ({ lowerBound, length }) =>
          !Number.isInteger(lowerBound) ||
          lowerBound < -2147483648 ||
          lowerBound > 2147483647 ||
          !Number.isInteger(length) ||
          length < 1 ||
          lowerBound + length > 2147483647,
      )
    )
      throw new Error(`Invalid native ${label} array bounds`);
  }
  return Object.freeze({
    ...codec,
    encode(value: PostgreSqlArray<Input>) {
      bounds(value);
      return codec.encode(value);
    },
    // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Native array text is validated by the paired element decoder.
    decode(value: unknown) {
      return decodeFailure(() => {
        const parsed = codec.decode(value);
        bounds(parsed);
        return parsed;
      });
    },
  });
}
export function createHllArrayCodec(schema: string) {
  return boundedArray(arrayCodec(createHllCodec(schema)), "hll");
}
export function createHllHashvalArrayCodec(schema: string) {
  return boundedArray(arrayCodec(createHllHashvalCodec(schema)), "hll_hashval");
}
