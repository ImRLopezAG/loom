import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { createExtensionCodec, floatCodec, nullableCodec } from "../codecs";
import { createExtensionField, type ExtensionValueSchema } from "../fields";
import { createSqlFunction, createSqlOperator } from "../sql";
import { createCube_1_5 } from "./cube";
import { createCubeCodec, createCubeArrayCodec, type CubeValue } from "./cube-codecs";
export type { PostgreSqlArray, NonfiniteNumber } from "../codecs";

/** Cube-shaped input whose point, dimension and surface constraints are checked by PostgreSQL's earth domain. */
export type EarthValue = CubeValue;
const coordinate = v.union([
  v.pipe(v.number(), v.finite()),
  v.strictObject({ nonfinite: v.picklist(["NaN", "Infinity", "-Infinity"]) }),
]);
const point = v.strictObject({ longitude: coordinate, latitude: coordinate });
/** Native point uses longitude first, latitude second, both in degrees. */
export type EarthPoint = v.InferOutput<typeof point>;
type Descriptor = ExtensionDescriptor<"earthdistance", { readonly version: "1.2"; readonly schema: string }>;
type CubeDescriptor = ExtensionDescriptor<"cube", { readonly version: "1.5"; readonly schema: string }>;
const digest = "13bae0f141ff6fb7a7e4253e02958e7b6dd18c82db9b51c03bf12605df99fcd6";

/**
 * Exact Earthdistance 1.2 contract. Install cube first; use trusted schemas and search paths.
 * Cube distances use meters with the captured earth() radius. Point distances always use statute miles.
 * The explicit dependency supplies the cube result namespace, even when schemas differ.
 * PostgreSQL's @extschema:cube@ substitution rejects double quotes, dollar signs,
 * apostrophes and backslashes in the cube dependency namespace.
 */
export function createEarthdistance_1_2<const Selected extends Descriptor>(descriptor: Selected, cube: CubeDescriptor) {
  if (
    descriptor.name !== "earthdistance" ||
    descriptor.version !== "1.2" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("earthdistance 1.2 requires its exact verified contract");
  if (/["$'\\]/.test(cube.schema))
    throw new Error(
      "earthdistance 1.2 requires a cube dependency schema without double quotes, dollar signs, apostrophes or backslashes (PostgreSQL @extschema:cube@ restriction)",
    );
  createCube_1_5(cube);
  const cubeCodec = createCubeCodec(cube.schema);
  // A domain inherits cube's text/binary representation. PostgreSQL owns domain constraint semantics.
  const codec = Object.freeze({
    ...cubeCodec,
    id: "earthdistance:earth:corners:1",
    sqlType: Object.freeze({ schema: descriptor.schema, name: "earth" }),
  });
  const arrayCodec = Object.freeze({
    ...createCubeArrayCodec(cube.schema),
    id: `pg:array:1:,:${codec.id}`,
    sqlType: Object.freeze({ ...codec.sqlType, array: true }),
  });
  const pointCodec = createExtensionCodec({
    id: "earthdistance:pg-point:longitude-latitude:1",
    sqlType: { schema: "pg_catalog", name: "point" },
    input: point,
    output: point,
    transport: "text",
    encode(value) {
      const text = (number: EarthPoint["longitude"]) =>
        Object.is(number, -0) ? "-0" : String(floatCodec.encode(number));
      return `(${text(value.longitude)}, ${text(value.latitude)})`;
    },
    decode(value) {
      const decoded = cubeCodec.decode(value);
      if (decoded.kind !== "point" || decoded.coordinates.length !== 2)
        throw new Error("Invalid native longitude/latitude point");
      return { longitude: decoded.coordinates[0]!, latitude: decoded.coordinates[1]! };
    },
  });
  const earth = nullableCodec(codec),
    floats = nullableCodec(floatCodec),
    points = nullableCodec(pointCodec);
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const earth_box = createSqlFunction({
    ...base,
    name: "earth_box",
    member: "routine:$extension:earthdistance.earth_box($extension:earthdistance.earth,pg_catalog.float8)",
    arguments: [earth, floats] as const,
    result: nullableCodec(cubeCodec),
  });
  const earth_distance = createSqlFunction({
    ...base,
    name: "earth_distance",
    member:
      "routine:$extension:earthdistance.earth_distance($extension:earthdistance.earth,$extension:earthdistance.earth)",
    arguments: [earth, earth] as const,
    result: floats,
  });
  const earthRadius = createSqlFunction({
    ...base,
    name: "earth",
    member: "routine:$extension:earthdistance.earth()",
    arguments: [] as const,
    result: floats,
  });
  const gc_to_sec = createSqlFunction({
    ...base,
    name: "gc_to_sec",
    member: "routine:$extension:earthdistance.gc_to_sec(pg_catalog.float8)",
    arguments: [floats] as const,
    result: floats,
  });
  const geo_distance = createSqlFunction({
    ...base,
    name: "geo_distance",
    member: "routine:$extension:earthdistance.geo_distance(pg_catalog.point,pg_catalog.point)",
    arguments: [points, points] as const,
    result: floats,
  });
  const latitude = createSqlFunction({
    ...base,
    name: "latitude",
    member: "routine:$extension:earthdistance.latitude($extension:earthdistance.earth)",
    arguments: [earth] as const,
    result: floats,
  });
  const ll_to_earth = createSqlFunction({
    ...base,
    name: "ll_to_earth",
    member: "routine:$extension:earthdistance.ll_to_earth(pg_catalog.float8,pg_catalog.float8)",
    arguments: [floats, floats] as const,
    result: earth,
  });
  const longitude = createSqlFunction({
    ...base,
    name: "longitude",
    member: "routine:$extension:earthdistance.longitude($extension:earthdistance.earth)",
    arguments: [earth] as const,
    result: floats,
  });
  const sec_to_gc = createSqlFunction({
    ...base,
    name: "sec_to_gc",
    member: "routine:$extension:earthdistance.sec_to_gc(pg_catalog.float8)",
    arguments: [floats] as const,
    result: floats,
  });
  const distanceMiles = createSqlOperator({
    ...base,
    name: "<@>",
    member: "operator:$extension:earthdistance.<@>(pg_catalog.point,pg_catalog.point)",
    left: points,
    right: points,
    result: floats,
  });
  const functions = Object.freeze({
    earth: earthRadius,
    earth_box,
    earth_distance,
    gc_to_sec,
    geo_distance,
    latitude,
    ll_to_earth,
    longitude,
    sec_to_gc,
  });
  const operators = Object.freeze({ "<@>": distanceMiles });
  const overloads = Object.freeze({
    "routine:$extension:earthdistance.earth_box($extension:earthdistance.earth,pg_catalog.float8)": earth_box,
    "routine:$extension:earthdistance.earth_distance($extension:earthdistance.earth,$extension:earthdistance.earth)":
      earth_distance,
    "routine:$extension:earthdistance.earth()": earthRadius,
    "routine:$extension:earthdistance.gc_to_sec(pg_catalog.float8)": gc_to_sec,
    "routine:$extension:earthdistance.geo_distance(pg_catalog.point,pg_catalog.point)": geo_distance,
    "routine:$extension:earthdistance.latitude($extension:earthdistance.earth)": latitude,
    "routine:$extension:earthdistance.ll_to_earth(pg_catalog.float8,pg_catalog.float8)": ll_to_earth,
    "routine:$extension:earthdistance.longitude($extension:earthdistance.earth)": longitude,
    "routine:$extension:earthdistance.sec_to_gc(pg_catalog.float8)": sec_to_gc,
    "operator:$extension:earthdistance.<@>(pg_catalog.point,pg_catalog.point)": distanceMiles,
  });
  const valueCoordinate: ExtensionValueSchema = {
    kind: "union",
    variants: [
      { kind: "number" },
      { kind: "object", properties: { nonfinite: { kind: "string", enum: ["NaN", "Infinity", "-Infinity"] } } },
    ],
  };
  const corner: ExtensionValueSchema = { kind: "array", items: valueCoordinate };
  const value: ExtensionValueSchema = {
    kind: "union",
    variants: [
      { kind: "object", properties: { kind: { kind: "string", enum: ["point"] }, coordinates: corner } },
      { kind: "object", properties: { kind: { kind: "string", enum: ["box"] }, lower: corner, upper: corner } },
    ],
  };
  let nested: ExtensionValueSchema = { kind: "union", variants: [value, { kind: "null" }] };
  const depths: ExtensionValueSchema[] = [];
  for (let rank = 0; rank < 6; rank++) {
    nested = { kind: "array", items: nested };
    depths.push(nested);
  }
  const arrayValue: ExtensionValueSchema = {
    kind: "object",
    properties: {
      dimensions: {
        kind: "array",
        items: {
          kind: "object",
          properties: {
            lowerBound: { kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 },
            length: { kind: "number", integer: true, minimum: 0, maximum: 2147483647 },
          },
        },
      },
      values: { kind: "union", variants: depths },
    },
  };
  const search = { filter: false, comparison: false, order: false, text: false } as const;
  const field = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:earthdistance.earth",
      type: "earth",
      codec,
      value,
      search,
    });
  const arrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: "type:$extension:earthdistance._earth",
      type: "earth",
      array: true,
      codec: arrayCodec,
      value: arrayValue,
      search,
    });
  return bindExtension(descriptor, {
    codec,
    arrayCodec,
    cubeCodec,
    pointCodec,
    field,
    arrayField,
    fromDegrees: ll_to_earth,
    latitudeDegrees: latitude,
    longitudeDegrees: longitude,
    radiusMeters: earthRadius,
    distanceMeters: earth_distance,
    /** Candidate box; apply distanceMeters too, since the box includes points outside the radius. */
    boxMeters: earth_box,
    secantToGreatCircleMeters: sec_to_gc,
    greatCircleToSecantMeters: gc_to_sec,
    pointDistanceMiles: distanceMiles,
    geoDistanceMiles: geo_distance,
    sql: Object.freeze({ functions, operators, overloads }),
  });
}
