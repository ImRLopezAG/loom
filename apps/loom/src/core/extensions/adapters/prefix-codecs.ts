import * as v from "valibot";
import {
  arrayCodec,
  createExtensionCodec,
  decodeFailure,
  type ExtensionCodec,
  type PostgreSqlArray,
} from "../codecs";

const OPEN = 0x5b;
const SEPARATOR = 0x2d;
const CLOSE = 0x5d;

const lossless = v.pipe(
  v.string(),
  v.check((value) => !value.includes("\0") && !/[\uD800-\uDFFF]/u.test(value), "Expected lossless PostgreSQL UTF8 text"),
);

function bytesOf(text: string): Uint8Array {
  return new TextEncoder().encode(v.parse(lossless, text));
}

function textOf(bytes: Uint8Array): string {
  return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
}

function parsePrefixRange(text: string) {
  const source = bytesOf(text);
  const prefix = [];
  let current = 0;
  let previous = 0;
  let opened = false;
  let closed = false;
  let sawsep = false;
  let first = 0;
  let last = 0;
  for (const byte of source) {
    previous = current;
    current = byte;
    if (!opened && current !== OPEN) prefix.push(current);
    switch (current) {
      case OPEN:
        if (opened) throw new Error("Invalid native prefix_range text");
        opened = true;
        break;
      case SEPARATOR:
        if (opened) {
          if (closed) throw new Error("Invalid native prefix_range text");
          sawsep = true;
          if (previous === OPEN) throw new Error("Invalid native prefix_range text");
          first = previous;
        }
        break;
      case CLOSE:
        if (!opened || closed) throw new Error("Invalid native prefix_range text");
        closed = true;
        if (sawsep) {
          if (previous === SEPARATOR) throw new Error("Invalid native prefix_range text");
          last = previous;
        } else if (previous !== OPEN) throw new Error("Invalid native prefix_range text");
        break;
      default:
        if (closed) throw new Error("Invalid native prefix_range text");
        break;
    }
  }
  if (opened && !closed) throw new Error("Invalid native prefix_range text");
  return { prefix: new Uint8Array(prefix), first, last };
}

function normalizePrefixRange(value: { prefix: Uint8Array; first: number; last: number }) {
  if (value.first === value.last) {
    if (value.first === 0) return { prefix: value.prefix, first: 0, last: 0 };
    const prefix = new Uint8Array(value.prefix.length + 1);
    prefix.set(value.prefix);
    prefix[value.prefix.length] = value.first;
    return { prefix, first: 0, last: 0 };
  }
  if (value.first > value.last) return { prefix: value.prefix, first: value.last, last: value.first };
  return value;
}

function formatPrefixRange(value: { prefix: Uint8Array; first: number; last: number }): string {
  if (value.first !== 0 && (value.first < 1 || value.first > 127 || value.last < 1 || value.last > 127))
    throw new Error("prefix_range range bounds must be single-byte UTF8");
  if (value.first) {
    return textOf(value.prefix) + `[${String.fromCharCode(value.first)}-${String.fromCharCode(value.last)}]`;
  }
  return textOf(value.prefix);
}

function canonicalPrefixRange(text: string): string {
  const canonical = formatPrefixRange(normalizePrefixRange(parsePrefixRange(text)));
  if (canonical !== text) throw new Error("prefix_range requires canonical native text");
  return canonical;
}

const value = v.pipe(lossless, v.brand("PrefixRange"));
export type PrefixRange = v.InferOutput<typeof value>;

/** Parse native input spelling, then return the prefix_range_out canonical form. */
export function prefixRange(input: string): PrefixRange {
  return v.parse(value, formatPrefixRange(normalizePrefixRange(parsePrefixRange(input))));
}

export function createPrefixRangeCodec(schema: string): ExtensionCodec<PrefixRange, PrefixRange> {
  const codec = createExtensionCodec({
    id: "prefix:prefix_range:canonical-text:1",
    sqlType: { schema, name: "prefix_range" },
    input: value,
    output: value,
    transport: "text",
    encode: (text) => canonicalPrefixRange(text),
    decode(input) {
      return canonicalPrefixRange(v.parse(v.string(), input));
    },
  });
  // SAFETY: Valibot brand inference keeps string input; SQL helpers must require the canonical PrefixRange.
  return codec as ExtensionCodec<PrefixRange, PrefixRange>;
}

export function createPrefixRangeArrayCodec(schema: string) {
  const codec = arrayCodec(createPrefixRangeCodec(schema));
  function bounds(value: PostgreSqlArray<PrefixRange>) {
    if (
      value.dimensions.length > 6 ||
      value.dimensions.some(
        ({ lowerBound, length }) =>
          !Number.isInteger(lowerBound) ||
          lowerBound < -2147483648 ||
          lowerBound > 2147483647 ||
          !Number.isInteger(length) ||
          length < 1 ||
          length > 2147483647 ||
          lowerBound + length > 2147483647,
      )
    )
      throw new Error("Invalid native prefix_range array bounds");
  }
  return Object.freeze({
    ...codec,
    encode(value: PostgreSqlArray<PrefixRange>) {
      bounds(value);
      return codec.encode(value);
    },
    // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Native array text is validated by the paired prefix_range decoder.
    decode(value: unknown) {
      return decodeFailure(() => {
        const parsed = codec.decode(value);
        bounds(parsed);
        return parsed;
      });
    },
  });
}
