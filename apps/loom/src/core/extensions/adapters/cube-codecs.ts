import * as v from "valibot";
import {
  arrayCodec,
  createExtensionCodec,
  decodeFailure,
  floatCodec,
  type CodecInput,
  type PostgreSqlArray,
} from "../codecs";

export type CubeCoordinate = CodecInput<typeof floatCodec>;
const coordinate = v.union([
  v.pipe(v.number(), v.finite()),
  v.strictObject({ nonfinite: v.picklist(["NaN", "Infinity", "-Infinity"]) }),
]);
const coordinates = v.pipe(v.array(coordinate), v.maxLength(100));
const cube = v.variant("kind", [
  v.strictObject({ kind: v.literal("point"), coordinates }),
  v.pipe(
    v.strictObject({ kind: v.literal("box"), lower: coordinates, upper: coordinates }),
    v.check((value) => value.lower.length === value.upper.length, "Cube corners require equal dimensions"),
  ),
]);
export type CubeValue = v.InferOutput<typeof cube>;
/** PostgreSQL owns coordinate ordering, NaN comparison and point compression. */
export function cubePoint(input: readonly CubeCoordinate[]): CubeValue {
  return v.parse(cube, { kind: "point", coordinates: input });
}
export function cubeBox(lower: readonly CubeCoordinate[], upper: readonly CubeCoordinate[]): CubeValue {
  return v.parse(cube, { kind: "box", lower, upper });
}
function corner(values: readonly CubeCoordinate[]): string {
  return `(${values.map((value) => (v.is(v.number(), value) ? (Object.is(value, -0) ? "-0" : String(value)) : value.nonfinite)).join(", ")})`;
}
function parseCorner(text: string): CubeCoordinate[] {
  if (!text.trim()) return [];
  return text.split(",").map((token) => {
    const value = token.trim();
    if (["NaN", "Infinity", "-Infinity"].includes(value)) return floatCodec.decode(value);
    if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value))
      throw new Error("Invalid native cube coordinate");
    const number = Number(value);
    if (!Number.isFinite(number)) throw new Error("Native cube coordinate overflow");
    return number;
  });
}
/** Decode cube_out's canonical text, including dimension zero and explicit nonfinite float8 values. */
export function createCubeCodec(schema: string) {
  return createExtensionCodec({
    id: "cube:cube:corners:1",
    sqlType: { schema, name: "cube" },
    input: cube,
    output: cube,
    transport: "text",
    encode: (value) =>
      value.kind === "point" ? corner(value.coordinates) : `${corner(value.lower)},${corner(value.upper)}`,
    decode(value) {
      const text = v.parse(v.string(), value);
      const parsed = /^\s*\(([^()]*)\)\s*(?:,\s*\(([^()]*)\)\s*)?$/.exec(text);
      if (!parsed) throw new Error("Invalid native cube text");
      const first = parseCorner(parsed[1]!);
      return parsed[2] === undefined ? cubePoint(first) : cubeBox(first, parseCorner(parsed[2]));
    },
  });
}
/** Native PostgreSQL arrays retain lower bounds, all six ranks and NULL elements. */
export function createCubeArrayCodec(schema: string) {
  const codec = arrayCodec(createCubeCodec(schema));
  function bounds(value: PostgreSqlArray<CubeValue>) {
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
      throw new Error("Invalid native cube array bounds");
  }
  return Object.freeze({
    ...codec,
    encode(value: PostgreSqlArray<CubeValue>) {
      bounds(value);
      return codec.encode(value);
    },
    // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Native array text is validated by the paired cube decoder.
    decode(value: unknown) {
      return decodeFailure(() => {
        const parsed = codec.decode(value);
        bounds(parsed);
        return parsed;
      });
    },
  });
}
