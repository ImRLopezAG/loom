import * as v from "valibot";
import {
  arrayCodec,
  binaryCodec,
  createExtensionCodec,
  decodeFailure,
  type ExtensionCodec,
  type PostgreSqlArray,
} from "../codecs";
export type { PostgreSqlArray } from "../codecs";

const int4 = v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647));
const int8 = v.pipe(v.bigint(), v.minValue(-9223372036854775808n), v.maxValue(9223372036854775807n));
const unsigned32 = (value: number) => value >>> 0;
const unsigned64 = (value: bigint) => BigInt.asUintN(64, value);
/** Native iteration is unsigned: non-negative members first, then negative two's-complement members. */
function canonical<Value extends number | bigint>(values: readonly Value[], unsigned: (value: Value) => number | bigint) {
  for (let index = 1; index < values.length; index++)
    if (unsigned(values[index - 1]!) >= unsigned(values[index]!)) return false;
  return true;
}
/**
 * roaringbitmap members as PostgreSQL prints them: signed int4 in native unsigned set order.
 * Input may repeat or reorder members; roaringbitmap_in normalizes them.
 */
export type RoaringBitmap = number[];
/**
 * roaringbitmap64 members as PostgreSQL prints them: signed int8 (uint64 two's complement) in native unsigned set order.
 */
export type RoaringBitmap64 = bigint[];
const bitmapOutput = v.pipe(
  v.array(int4),
  v.check((values) => canonical(values, unsigned32), "roaringbitmap output must be in native unsigned set order"),
);
const bitmap64Output = v.pipe(
  v.array(int8),
  v.check((values) => canonical(values, unsigned64), "roaringbitmap64 output must be in native unsigned set order"),
);

// CRoaring portable format, as pg_roaringbitmap 1.2 stores and byteaout prints it.
const serialCookieNoRun = 12346,
  serialCookie = 12347,
  noOffsetThreshold = 4,
  arrayMaximum = 4096;
class Reader {
  offset = 0;
  constructor(readonly bytes: Uint8Array) {}
  take(length: number): number {
    const start = this.offset;
    if (length < 0 || start + length > this.bytes.length) throw new Error("Truncated roaring bitmap");
    this.offset += length;
    return start;
  }
  u16(at = this.take(2)): number {
    return this.bytes[at]! | (this.bytes[at + 1]! << 8);
  }
  u32(at = this.take(4)): number {
    return (this.u16(at) | (this.u16(at + 2) << 16)) >>> 0;
  }
}
/** Yields unsigned 32-bit members of one portable 32-bit bitmap in ascending order. */
function readPortable32(reader: Reader): number[] {
  const cookie = reader.u32();
  let size: number;
  const hasRun = (cookie & 0xffff) === serialCookie;
  if (hasRun) size = (cookie >>> 16) + 1;
  else if (cookie === serialCookieNoRun) size = reader.u32();
  else throw new Error("Invalid roaring bitmap cookie");
  if (size > 65536) throw new Error("Invalid roaring bitmap container count");
  const runs = hasRun ? reader.take(Math.ceil(size / 8)) : 0;
  const headers = reader.take(size * 4);
  if (!hasRun || size >= noOffsetThreshold) reader.take(size * 4);
  const values: number[] = [];
  let previousKey = -1;
  for (let index = 0; index < size; index++) {
    const key = reader.u16(headers + index * 4);
    const cardinality = reader.u16(headers + index * 4 + 2) + 1;
    if (key <= previousKey) throw new Error("Roaring bitmap keys must be strictly increasing");
    previousKey = key;
    const high = key * 65536;
    const before = values.length;
    let previous = -1;
    const push = (low: number) => {
      if (low <= previous) throw new Error("Roaring bitmap container values must be strictly increasing");
      previous = low;
      values.push(high + low);
    };
    if (hasRun && (reader.bytes[runs + (index >> 3)]! & (1 << (index & 7))) !== 0) {
      const count = reader.u16();
      for (let run = 0; run < count; run++) {
        const start = reader.u16();
        const length = reader.u16();
        if (start + length > 65535) throw new Error("Roaring bitmap run exceeds its container");
        for (let low = start; low <= start + length; low++) push(low);
      }
    } else if (cardinality > arrayMaximum) {
      const words = reader.take(8192);
      for (let byte = 0; byte < 8192; byte++) {
        const bits = reader.bytes[words + byte]!;
        for (let bit = 0; bit < 8; bit++) if (bits & (1 << bit)) push(byte * 8 + bit);
      }
    } else for (let member = 0; member < cardinality; member++) push(reader.u16());
    if (values.length - before !== cardinality) throw new Error("Roaring bitmap container cardinality mismatch");
  }
  return values;
}
/** Native bytea text (hex or escape, per bytea_output) or driver bytes. */
export type RoaringBitmapStorage = string | Uint8Array;
const storage = v.union([v.string(), v.instance(Uint8Array)]);
function bytes(value: RoaringBitmapStorage): Uint8Array {
  const { hex } = binaryCodec.decode(value);
  return Uint8Array.from(hex.match(/../g) ?? [], (pair) => Number.parseInt(pair, 16));
}
function exhausted(reader: Reader) {
  if (reader.offset !== reader.bytes.length) throw new Error("Trailing roaring bitmap bytes");
}
/** Decodes roaringbitmap storage bytes into signed int4 members in native order. */
export function decodeRoaringBitmapBytes(value: RoaringBitmapStorage): RoaringBitmap {
  const reader = new Reader(bytes(value));
  const values = readPortable32(reader).map((member) => member | 0);
  exhausted(reader);
  return values;
}
/** Decodes roaringbitmap64 storage bytes (uint64 bucket count, then high32 + portable 32-bit bitmap per bucket). */
export function decodeRoaringBitmap64Bytes(value: RoaringBitmapStorage): RoaringBitmap64 {
  const reader = new Reader(bytes(value));
  const low = BigInt(reader.u32());
  const high = BigInt(reader.u32());
  const buckets = (high << 32n) | low;
  if (buckets > 0xffffffffn) throw new Error("Invalid roaring bitmap64 bucket count");
  const values: bigint[] = [];
  let previous = -1;
  for (let bucket = 0n; bucket < buckets; bucket++) {
    const key = reader.u32();
    if (key <= previous) throw new Error("Roaring bitmap64 buckets must be strictly increasing");
    previous = key;
    const prefix = BigInt(key) << 32n;
    for (const member of readPortable32(reader)) values.push(BigInt.asIntN(64, prefix | BigInt(member)));
  }
  exhausted(reader);
  return values;
}
const arrayText = /^\{(?:-?\d+(?:,-?\d+)*)?\}$/;
function decodeText<Value>(
  value: RoaringBitmapStorage,
  parse: (member: string) => Value,
  binary: (value: RoaringBitmapStorage) => Value[],
) {
  if (v.is(v.string(), value) && value.startsWith("{")) {
    if (!arrayText.test(value)) throw new Error("Invalid native roaring bitmap array text");
    return value === "{}" ? [] : value.slice(1, -1).split(",").map(parse);
  }
  // roaringbitmap.output_format defaults to bytea; byteaout then follows bytea_output (hex or escape).
  return binary(value);
}
/** Exact signed int8: unlike the shared bigint codec, out-of-range bigints are rejected before binding. */
export const boundedInt8Codec = createExtensionCodec({
  id: "pg:int8:bounded:1",
  sqlType: { schema: "pg_catalog", name: "int8" },
  input: int8,
  output: int8,
  transport: "text",
  encode: (value) => value.toString(),
  decode: (value) => BigInt(v.parse(v.pipe(v.string(), v.regex(/^-?\d+$/)), value)),
});
export function createRoaringBitmapCodec(schema: string) {
  return createExtensionCodec({
    id: "roaringbitmap:roaringbitmap:int4-set:1",
    sqlType: { schema, name: "roaringbitmap" },
    input: v.array(int4),
    output: bitmapOutput,
    transport: "text",
    encode: (value) => `{${value.join(",")}}`,
    decode: (value) => decodeText(v.parse(storage, value), Number, decodeRoaringBitmapBytes),
  });
}
export function createRoaringBitmap64Codec(schema: string) {
  return createExtensionCodec({
    id: "roaringbitmap:roaringbitmap64:int8-set:1",
    sqlType: { schema, name: "roaringbitmap64" },
    input: v.array(int8),
    output: bitmap64Output,
    transport: "text",
    encode: (value) => `{${value.join(",")}}`,
    decode: (value) => decodeText(v.parse(storage, value), BigInt, decodeRoaringBitmap64Bytes),
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
  // Native array text is validated by the paired element decoder, then its bounds are checked.
  const decode: typeof codec.decode = (value) =>
    decodeFailure(() => {
      const parsed = codec.decode(value);
      bounds(parsed);
      return parsed;
    });
  return Object.freeze({
    ...codec,
    encode(value: PostgreSqlArray<Input>) {
      bounds(value);
      return codec.encode(value);
    },
    decode,
  });
}
export function createRoaringBitmapArrayCodec(schema: string) {
  return boundedArray(arrayCodec(createRoaringBitmapCodec(schema)), "roaringbitmap");
}
export function createRoaringBitmap64ArrayCodec(schema: string) {
  return boundedArray(arrayCodec(createRoaringBitmap64Codec(schema)), "roaringbitmap64");
}
