import * as v from "valibot";
import {
  arrayCodec,
  compositeCodec,
  createExtensionCodec,
  decodeFailure,
  floatCodec,
  type ExtensionCodec,
  type NonfiniteNumber,
  type PostgreSqlArray,
} from "../codecs";
export type { PostgreSqlArray, NonfiniteNumber } from "../codecs";

/**
 * h3index_out prints any unsigned 64-bit address (cell, directed edge, vertex or invalid bits) as lower-case
 * hexadecimal without leading zeros. Input admits the case-insensitive 1-16 digit forms h3index_in parses to the
 * same 64 bits; Kello normalizes them to that exact native output text.
 */
export const h3IndexPattern = "^(?:0|[1-9a-f][0-9a-f]{0,15})$";
const input = v.pipe(
  v.string(),
  v.regex(/^[0-9a-f]{1,16}$/i, "Expected 1-16 hexadecimal digits of an unsigned 64-bit H3 index"),
  v.transform((text) => text.toLowerCase().replace(/^0+(?=.)/, "")),
);
const value = v.pipe(
  v.string(),
  v.regex(new RegExp(h3IndexPattern), "Expected canonical h3index_out text"),
  v.brand("H3Index"),
);
export type H3Index = v.InferOutput<typeof value>;
/** Normalizes lossless unsigned 64-bit hexadecimal text to the native h3index_out spelling. */
export const h3Index = (text: string): H3Index => v.parse(value, v.parse(input, text));

export function createH3IndexCodec(schema: string) {
  return createExtensionCodec({
    id: "h3:h3index:hex:1",
    sqlType: { schema, name: "h3index" },
    input,
    output: value,
    transport: "text",
    encode: (text) => text,
    decode: (text) => text,
  });
}
const dimensions = v.pipe(
  v.array(
    v.strictObject({
      lowerBound: v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647)),
      length: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2147483647)),
    }),
  ),
  v.maxLength(6),
);
function checkedArray<Input, Output>(codec: ExtensionCodec<PostgreSqlArray<Input>, PostgreSqlArray<Output>>) {
  const bounds = <Value>(checked: PostgreSqlArray<Value>) => {
    if (v.parse(dimensions, checked.dimensions).some(({ lowerBound, length }) => lowerBound + length > 2147483648))
      throw new Error("PostgreSQL array upper bound overflow");
  };
  return Object.freeze({
    ...codec,
    encode(values: PostgreSqlArray<Input>) {
      bounds(values);
      return codec.encode(values);
    },
    // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Driver array text is validated by the paired element codec.
    decode(driver: unknown) {
      return decodeFailure(() => {
        const result = codec.decode(driver);
        bounds(result);
        return result;
      });
    },
  });
}
/** Full native h3index[] dimensions, lower bounds, nested values and NULL elements. */
export function createH3IndexArrayCodec(schema: string) {
  return checkedArray(arrayCodec(createH3IndexCodec(schema)));
}

const coordinate = v.union([
  v.pipe(v.number(), v.finite()),
  v.strictObject({ nonfinite: v.picklist(["NaN", "Infinity", "-Infinity"]) }),
]);
type Coordinate = number | NonfiniteNumber;
function coordinateText(number: Coordinate): string {
  return v.is(v.number(), number) && Object.is(number, -0) ? "-0" : String(floatCodec.encode(number));
}
const driverNumber = (number: number): Coordinate =>
  Number.isNaN(number)
    ? { nonfinite: "NaN" }
    : number === Infinity
      ? { nonfinite: "Infinity" }
      : number === -Infinity
        ? { nonfinite: "-Infinity" }
        : number;
const driverFloat = v.union([v.number(), v.nan()]);
const driverPoint = v.strictObject({ x: driverFloat, y: driverFloat });
/**
 * PostgreSQL point_out "(x,y)" with float8 text, or node-postgres' parsed {x, y} for a top-level point column
 * (its parseFloat is lossless for float8_out's shortest round-trip text, including NaN, ±Infinity and -0).
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- Driver point values are validated as text or the driver's {x, y}.
function pointCoordinates(source: unknown): readonly [Coordinate, Coordinate] {
  if (v.is(driverPoint, source)) return [driverNumber(source.x), driverNumber(source.y)];
  const match = /^\(([^,()]+),([^,()]+)\)$/.exec(v.parse(v.string(), source));
  if (!match) throw new Error("Invalid native point");
  return [floatCodec.decode(match[1]), floatCodec.decode(match[2])];
}
const latLng = v.strictObject({ lng: coordinate, lat: coordinate });
/** h3 geographic points: native point x is longitude and y is latitude, both in degrees. */
export type H3LatLng = v.InferOutput<typeof latLng>;
const pointText = ({ lng, lat }: H3LatLng) => `(${coordinateText(lng)},${coordinateText(lat)})`;
const point = { schema: "pg_catalog", name: "point" } as const;
export const h3LatLngCodec = createExtensionCodec({
  id: "h3:point:lng-lat-degrees:1",
  sqlType: point,
  input: latLng,
  output: latLng,
  transport: "text",
  encode: pointText,
  decode(source) {
    const [lng, lat] = pointCoordinates(source);
    return { lng, lat };
  },
});
// Native localIjToCell truncates doubles toward zero and casts NaN to an arbitrary int32; only int32 is lossless.
const ij = v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647));
const localIj = v.strictObject({ i: ij, j: ij });
/** h3 local IJ coordinates: native point x is i and y is j, anchored by an origin cell. */
export type H3LocalIj = v.InferOutput<typeof localIj>;
export const h3LocalIjCodec = createExtensionCodec({
  id: "h3:point:local-ij:1",
  sqlType: point,
  input: localIj,
  output: localIj,
  transport: "text",
  encode: ({ i, j }) => `(${i},${j})`,
  decode(source) {
    const [i, j] = pointCoordinates(source);
    return v.parse(localIj, { i, j });
  },
});
const loop = v.pipe(v.array(latLng), v.minLength(1));
/** A native polygon's ordered vertices; PostgreSQL closes the loop implicitly. */
export type H3Polygon = v.InferOutput<typeof loop>;
function polygonCodec(id: string, order: "lng-lat" | "lat-lng") {
  const vertex = ({ lng, lat }: H3LatLng) => (order === "lng-lat" ? pointText({ lng, lat }) : pointText({ lng: lat, lat: lng }));
  return createExtensionCodec({
    id,
    sqlType: { schema: "pg_catalog", name: "polygon" },
    input: loop,
    output: loop,
    transport: "text",
    encode: (vertices) => `(${vertices.map(vertex).join(",")})`,
    decode(source) {
      const text = v.parse(v.string(), source);
      if (!text.startsWith("((") || !text.endsWith("))")) throw new Error("Invalid native polygon");
      return text
        .slice(1, -1)
        .split(/(?<=\)),(?=\()/)
        .map((entry) => {
          const [x, y] = pointCoordinates(entry);
          return order === "lng-lat" ? { lng: x, lat: y } : { lng: y, lat: x };
        });
    },
  });
}
export const h3PolygonCodec = polygonCodec("h3:polygon:lng-lat-degrees:1", "lng-lat");
/** h3_directed_edge_to_boundary writes latitude into x and longitude into y; values still read as {lng, lat}. */
export const h3LatFirstPolygonCodec = polygonCodec("h3:polygon:lat-lng-degrees:1", "lat-lng");
/** Native polygon[] values; NULL elements are retained as PostgreSQL returns them. */
export const h3PolygonArrayCodec = checkedArray(arrayCodec(h3PolygonCodec));
/** h3_cells_to_multi_polygon OUT columns: one exterior loop and its hole loops. */
export const h3MultiPolygonPartCodec = compositeCodec("h3:cells-to-multi-polygon", {
  exterior: h3PolygonCodec,
  holes: h3PolygonArrayCodec,
});
