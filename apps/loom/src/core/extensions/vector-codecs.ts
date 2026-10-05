import * as v from "valibot";
import { arrayCodec, createExtensionCodec, decodeFailure, type ExtensionCodec, type PostgreSqlArray } from "./codecs";

/** pgvector v0.8.6 VECTOR_MAX_DIM, HALFVEC_MAX_DIM, SPARSEVEC_MAX_DIM and SPARSEVEC_MAX_NNZ. */
export const vectorLimits = Object.freeze({
  vectorDimensions: 16000,
  halfvecDimensions: 16000,
  sparsevecDimensions: 1_000_000_000,
  sparsevecNonzero: 16000,
});

/** Dense vector or halfvec elements, in dimension order. */
export type DenseVectorValue = readonly number[];
/** Canonical sparsevec: 1-based indices in ascending order, nonzero float4 values only. */
export interface SparseVectorValue {
  readonly dimensions: number;
  readonly entries: readonly {
    readonly index: number;
    readonly value: number;
  }[];
}

const float64 = new DataView(new ArrayBuffer(8));
const float32 = new DataView(new ArrayBuffer(4));
function adjacentFloat32(magnitude: number, step: 1 | -1): number {
  float32.setFloat32(0, magnitude);
  float32.setUint32(0, float32.getUint32(0) + step);
  return float32.getFloat32(0);
}
/** Exact sign of an unsigned decimal minus a nonnegative double. */
function compareDecimal(decimal: string, binary: number): number {
  const [mantissa, exponent = "0"] = decimal.split("e");
  const [whole, fraction = ""] = mantissa!.split(".");
  let left = BigInt(`${whole}${fraction}`);
  const power10 = Number(exponent) - fraction.length;
  float64.setFloat64(0, binary);
  const bits = float64.getBigUint64(0);
  const biased = Number(bits >> 52n);
  let right = biased ? (bits & 0xfffffffffffffn) | 0x10000000000000n : bits & 0xfffffffffffffn;
  const power2 = Math.max(biased, 1) - 1075;
  if (power10 >= 0) left *= 10n ** BigInt(power10);
  else right *= 10n ** BigInt(-power10);
  if (power2 >= 0) right *= 2n ** BigInt(power2);
  else left *= 2n ** BigInt(-power2);
  return left < right ? -1 : left > right ? 1 : 0;
}

// PostgreSQL 18 float_to_shortest_decimal output: fixed notation, or e±DD exponent notation.
const nativeFloat4 = /^-?\d+(?:\.\d+)?(?:e[+-]\d{2})?$/;
/**
 * Restore the stored float4 from vector_out's shortest decimal. Math.fround rounds the parsed
 * double; when that double is exactly a float4 midpoint the decimal itself decides, as strtof does.
 */
function decodeFloat4(token: string): number {
  if (!nativeFloat4.test(token)) throw new Error("Expected pgvector float4 output");
  const negative = token.startsWith("-");
  const magnitude = negative ? token.slice(1) : token;
  const approximate = Number(magnitude);
  let result = Math.fround(approximate);
  if (approximate !== result) {
    const lower = approximate > result ? result : adjacentFloat32(result, -1);
    const upper = approximate > result ? adjacentFloat32(result, 1) : result;
    if (approximate === (lower + upper) / 2) {
      const order = compareDecimal(magnitude, approximate);
      if (order) result = order > 0 ? upper : lower;
    }
  }
  if (!Number.isFinite(result)) throw new Error("pgvector float4 overflow");
  if (result === 0 && /[1-9]/.test(magnitude.split("e")[0]!)) throw new Error("pgvector float4 underflow");
  return negative ? -result : result;
}

/** Round a double once to IEEE binary16, ties to even; values beyond HALF_MAX become infinite. */
function roundBinary16(value: number): number {
  const magnitude = Math.abs(value);
  if (magnitude === 0 || !Number.isFinite(magnitude)) return value;
  let exponent = Math.floor(Math.log2(magnitude));
  if (2 ** exponent > magnitude) exponent--;
  else if (2 ** (exponent + 1) <= magnitude) exponent++;
  const quantum = 2 ** (Math.max(exponent, -14) - 10);
  const scaled = magnitude / quantum;
  const floor = Math.floor(scaled);
  const rest = scaled - floor;
  const rounded = (rest > 0.5 || (rest === 0.5 && floor % 2 === 1) ? floor + 1 : floor) * quantum;
  const result = rounded > 65504 ? Infinity : rounded;
  return value < 0 ? -result : result;
}

const float4Input = v.pipe(
  v.number(),
  v.finite(),
  v.check((value) => Number.isFinite(Math.fround(value)), "pgvector float4 overflow"),
  v.check((value) => value === 0 || Math.fround(value) !== 0, "pgvector float4 underflow"),
);
const float4Output = v.pipe(
  v.number(),
  v.finite(),
  v.check((value) => Math.fround(value) === value, "Expected an exact float4"),
);
const binary16Input = v.pipe(
  v.number(),
  v.finite(),
  v.check((value) => Number.isFinite(roundBinary16(value)), "pgvector halfvec overflow"),
  v.check((value) => value === 0 || roundBinary16(value) !== 0, "pgvector halfvec underflow"),
);
const binary16Output = v.pipe(
  v.number(),
  v.finite(),
  v.check((value) => roundBinary16(value) === value, "Expected an exact binary16"),
);
const decimal = (value: number) => (Object.is(value, -0) ? "-0" : String(value));

function typmod(dimensions: number | undefined, maximum: number) {
  return dimensions === undefined
    ? undefined
    : v.parse(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(maximum)), dimensions);
}
function dense(element: v.GenericSchema<number>, maximum: number, dimensions: number | undefined) {
  const schema = v.pipe(
    v.array(element),
    v.minLength(1, "pgvector requires at least 1 dimension"),
    v.maxLength(maximum),
    v.check((values) => dimensions === undefined || values.length === dimensions, "Unexpected vector dimensions"),
  );
  // The strict schema validates runtime data while this fixed public type accepts readonly input.
  return v.custom<DenseVectorValue>((input) => v.is(schema, input), "Expected pgvector dense elements");
}
function nativeDense(text: string, decodeElement: (token: string) => number): number[] {
  if (!text.startsWith("[") || !text.endsWith("]")) throw new Error("Expected native pgvector dense output");
  return text.slice(1, -1).split(",").map(decodeElement);
}

/** vector(n): float4 elements; JavaScript numbers round once to float4 before binding. */
export function createVectorCodec(schema: string, dimensions?: number) {
  const expected = typmod(dimensions, vectorLimits.vectorDimensions);
  return createExtensionCodec({
    id: `vector:vector:float4:1${expected === undefined ? "" : `:dimensions:${expected}`}`,
    sqlType: { schema, name: "vector" },
    input: dense(float4Input, vectorLimits.vectorDimensions, expected),
    output: dense(float4Output, vectorLimits.vectorDimensions, expected),
    transport: "text",
    encode: (input) => `[${input.map((value) => decimal(Math.fround(value))).join(",")}]`,
    decode: (input) => nativeDense(v.parse(v.string(), input), decodeFloat4),
  });
}

/**
 * halfvec(n): binary16 elements. JavaScript numbers round once to binary16 and bind as exact
 * decimals, avoiding halfvec_in's strtof-then-float4-to-half double rounding.
 */
export function createHalfvecCodec(schema: string, dimensions?: number) {
  const expected = typmod(dimensions, vectorLimits.halfvecDimensions);
  return createExtensionCodec({
    id: `vector:halfvec:binary16:1${expected === undefined ? "" : `:dimensions:${expected}`}`,
    sqlType: { schema, name: "halfvec" },
    input: dense(binary16Input, vectorLimits.halfvecDimensions, expected),
    output: dense(binary16Output, vectorLimits.halfvecDimensions, expected),
    transport: "text",
    encode: (input) => `[${input.map((value) => decimal(roundBinary16(value))).join(",")}]`,
    // halfvec_out prints each half widened to float4, so only exact binary16 values are native.
    decode: (input) => nativeDense(v.parse(v.string(), input), decodeFloat4),
  });
}

function sparse(element: v.GenericSchema<number>, dimensions: number | undefined) {
  const schema = v.pipe(
    v.strictObject({
      dimensions: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(vectorLimits.sparsevecDimensions)),
      entries: v.pipe(
        v.array(
          v.strictObject({
            index: v.pipe(v.number(), v.integer(), v.minValue(1)),
            value: v.pipe(
              element,
              v.check((value) => value !== 0, "sparsevec stores only nonzero values"),
            ),
          }),
        ),
        v.maxLength(vectorLimits.sparsevecNonzero),
      ),
    }),
    v.check(
      (value) =>
        value.entries.every(
          (entry, position) =>
            entry.index <= value.dimensions && (position === 0 || value.entries[position - 1]!.index < entry.index),
        ),
      "Expected ascending unique in-range sparsevec indices",
    ),
    v.check((value) => dimensions === undefined || value.dimensions === dimensions, "Unexpected vector dimensions"),
  );
  return v.custom<SparseVectorValue>((input) => v.is(schema, input), "Expected a canonical sparsevec");
}
/** sparsevec_out: {index:value,...}/dimensions with 1-based ascending indices and no whitespace. */
function nativeSparse(text: string): SparseVectorValue {
  const parts = /^\{([^{}]*)\}\/([1-9]\d*)$/.exec(text);
  if (!parts) throw new Error("Expected native sparsevec output");
  const entries = parts[1]
    ? parts[1].split(",").map((entry) => {
        const pair = /^([1-9]\d*):(.+)$/.exec(entry);
        if (!pair) throw new Error("Expected native sparsevec entry");
        return { index: Number(pair[1]), value: decodeFloat4(pair[2]!) };
      })
    : [];
  return { dimensions: Number(parts[2]), entries };
}

/** sparsevec(n): canonical entries, so decoding native output returns the encoded value. */
export function createSparsevecCodec(schema: string, dimensions?: number) {
  const expected = typmod(dimensions, vectorLimits.sparsevecDimensions);
  return createExtensionCodec({
    id: `vector:sparsevec:float4:1${expected === undefined ? "" : `:dimensions:${expected}`}`,
    sqlType: { schema, name: "sparsevec" },
    input: sparse(float4Input, expected),
    output: sparse(float4Output, expected),
    transport: "text",
    encode: (input) =>
      `{${input.entries.map((entry) => `${entry.index}:${decimal(Math.fround(entry.value))}`).join(",")}}/${input.dimensions}`,
    decode: (input) => nativeSparse(v.parse(v.string(), input)),
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
function checkArray<Value>(input: PostgreSqlArray<Value>, leaf: v.GenericSchema): void {
  const checked = v.parse(nativeArray, input);
  if (checked.dimensions.some(({ lowerBound, length }) => lowerBound + length > 2147483647))
    throw new Error("PostgreSQL array upper bound overflow");
  if (checked.dimensions.length === 0) {
    if (checked.values.length !== 0) throw new Error("Empty vector arrays require no values or dimensions");
    return;
  }
  const checkValues = (entries: readonly unknown[], depth: number): void => {
    if (entries.length !== checked.dimensions[depth]!.length) throw new Error("Invalid vector array cardinality");
    for (const entry of entries) {
      if (depth + 1 < checked.dimensions.length) checkValues(v.parse(v.array(v.unknown()), entry), depth + 1);
      else if (entry !== null) v.parse(leaf, entry);
    }
  };
  checkValues(checked.values, 0);
}
function checkedArrayCodec<Value>(
  scalar: ExtensionCodec<Value, Value>,
  input: v.GenericSchema,
  output: v.GenericSchema,
): ExtensionCodec<PostgreSqlArray<Value>, PostgreSqlArray<Value>> {
  const array = arrayCodec(scalar);
  return Object.freeze({
    ...array,
    encode(value: PostgreSqlArray<Value>) {
      checkArray(value, input);
      return array.encode(value);
    },
    // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Native driver text is validated by the scalar and array codecs.
    decode(value: unknown) {
      return decodeFailure(() => {
        const result = array.decode(value);
        checkArray(result, output);
        return result;
      });
    },
  });
}

/** Full native ranks 0–6, lower bounds, rectangular nesting and nullable vector leaves. */
export function createVectorArrayCodec(schema: string, dimensions?: number) {
  const expected = typmod(dimensions, vectorLimits.vectorDimensions);
  return checkedArrayCodec(
    createVectorCodec(schema, expected),
    dense(float4Input, vectorLimits.vectorDimensions, expected),
    dense(float4Output, vectorLimits.vectorDimensions, expected),
  );
}
export function createHalfvecArrayCodec(schema: string, dimensions?: number) {
  const expected = typmod(dimensions, vectorLimits.halfvecDimensions);
  return checkedArrayCodec(
    createHalfvecCodec(schema, expected),
    dense(binary16Input, vectorLimits.halfvecDimensions, expected),
    dense(binary16Output, vectorLimits.halfvecDimensions, expected),
  );
}
export function createSparsevecArrayCodec(schema: string, dimensions?: number) {
  const expected = typmod(dimensions, vectorLimits.sparsevecDimensions);
  return checkedArrayCodec(
    createSparsevecCodec(schema, expected),
    sparse(float4Input, expected),
    sparse(float4Output, expected),
  );
}
