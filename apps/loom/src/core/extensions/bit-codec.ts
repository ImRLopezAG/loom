import * as v from "valibot";
import { arrayCodec, createExtensionCodec, decodeFailure, type ExtensionCodec, type PostgreSqlArray } from "./codecs";

/** PostgreSQL 18 varbit.c: typmod at most MaxAttrSize * BITS_PER_BYTE, values at most VARBITMAXLEN. */
export const bitLimits = Object.freeze({ typmod: 83_886_080, bits: 2_147_483_640 });

/** One character per bit, most significant first; leading, trailing and zero-length bits are kept. */
export interface BitStringValue {
  readonly bits: string;
}

function typmod(length: number | undefined) {
  return length === undefined
    ? undefined
    : v.parse(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(bitLimits.typmod)), length);
}
function bitString(check: (length: number) => boolean) {
  const schema = v.strictObject({
    bits: v.pipe(
      v.string(),
      v.regex(/^[01]*$/, "Expected binary digits"),
      v.maxLength(bitLimits.bits),
      v.check((bits) => check(bits.length), "Unexpected bit string length"),
    ),
  });
  // The strict schema validates runtime data while this fixed public type accepts readonly input.
  return v.custom<BitStringValue>((input) => v.is(schema, input), "Expected a PostgreSQL bit string");
}
const exact = (length: number | undefined) => bitString((actual) => length === undefined || actual === length);
const bounded = (length: number | undefined) => bitString((actual) => length === undefined || actual <= length);
/** varbit_out prints only binary digits; bit_in's B/X prefixes are input syntax, not native output. */
function nativeOutput(bits: string): BitStringValue {
  if (!/^[01]*$/.test(bits)) throw new Error("Expected native PostgreSQL bit output");
  return { bits };
}

/**
 * bit(n) binds as unconstrained pg_catalog.bit, so the optional length is a runtime check rather
 * than a cast: explicit SQL casts to bit(n) zero-pad or truncate and are never applied implicitly.
 */
export function createBitCodec(length?: number) {
  const expected = typmod(length);
  return createExtensionCodec({
    id: `pg:bit:bits:1${expected === undefined ? "" : `:length:${expected}`}`,
    sqlType: { schema: "pg_catalog", name: "bit" },
    input: exact(expected),
    output: exact(expected),
    transport: "text",
    encode: (input) => input.bits,
    decode: (input) => nativeOutput(v.parse(v.string(), input)),
  });
}

/** varbit(n): the optional maximum length is checked at runtime; explicit casts would truncate. */
export function createVarbitCodec(maxLength?: number) {
  const expected = typmod(maxLength);
  return createExtensionCodec({
    id: `pg:varbit:bits:1${expected === undefined ? "" : `:maxLength:${expected}`}`,
    sqlType: { schema: "pg_catalog", name: "varbit" },
    input: bounded(expected),
    output: bounded(expected),
    transport: "text",
    encode: (input) => input.bits,
    decode: (input) => nativeOutput(v.parse(v.string(), input)),
  });
}

const arrayDimensions = v.pipe(
  v.array(
    v.strictObject({
      lowerBound: v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647)),
      length: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2147483647)),
    }),
  ),
  v.maxLength(6),
);
const nativeArray = v.strictObject({ dimensions: arrayDimensions, values: v.array(v.unknown()) });
// Narrow copy of the hstore array guard until a shared native array validator exists.
function checkArray(input: PostgreSqlArray<BitStringValue>, leaf: v.GenericSchema): void {
  const checked = v.parse(nativeArray, input);
  if (checked.dimensions.some(({ lowerBound, length }) => lowerBound + length > 2147483647))
    throw new Error("PostgreSQL array upper bound overflow");
  if (checked.dimensions.length === 0) {
    if (checked.values.length !== 0) throw new Error("Empty bit arrays require no values or dimensions");
    return;
  }
  const checkValues = (entries: readonly unknown[], depth: number): void => {
    if (entries.length !== checked.dimensions[depth]!.length) throw new Error("Invalid bit array cardinality");
    for (const entry of entries) {
      if (depth + 1 < checked.dimensions.length) checkValues(v.parse(v.array(v.unknown()), entry), depth + 1);
      else if (entry !== null) v.parse(leaf, entry);
    }
  };
  checkValues(checked.values, 0);
}
function checkedArrayCodec(
  scalar: ExtensionCodec<BitStringValue, BitStringValue>,
  leaf: v.GenericSchema,
): ExtensionCodec<PostgreSqlArray<BitStringValue>, PostgreSqlArray<BitStringValue>> {
  const array = arrayCodec(scalar);
  return Object.freeze({
    ...array,
    encode(value: PostgreSqlArray<BitStringValue>) {
      checkArray(value, leaf);
      return array.encode(value);
    },
    // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Native driver text is validated by the scalar and array codecs.
    decode(value: unknown) {
      return decodeFailure(() => {
        const result = array.decode(value);
        checkArray(result, leaf);
        return result;
      });
    },
  });
}

/** Full native ranks 0–6, lower bounds, rectangular nesting and nullable bit leaves. */
export function createBitArrayCodec(length?: number) {
  const expected = typmod(length);
  return checkedArrayCodec(createBitCodec(expected), exact(expected));
}
export function createVarbitArrayCodec(maxLength?: number) {
  const expected = typmod(maxLength);
  return checkedArrayCodec(createVarbitCodec(expected), bounded(expected));
}
