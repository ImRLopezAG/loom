import * as v from "valibot";
import {
  arrayCodec,
  compositeCodec,
  createExtensionCodec,
  nullableCodec,
  textCodec,
  withCodecSqlType,
} from "../codecs";
import { int4Codec } from "../native-codecs";

export type PostgisDimensions = "XY" | "XYZ" | "XYM" | "XYZM";
export type PostgisKind = "geometry" | "geography";
export interface PostgisEwkb<Kind extends PostgisKind = PostgisKind> {
  readonly kind: Kind;
  readonly format: "ewkb";
  /** Verbatim bytes, including byte order, SRID and all coordinates. */
  readonly hex: string;
  readonly srid: number;
  readonly dimensions: PostgisDimensions;
  readonly geometryType: number;
}
export interface PostgisEwkt<Kind extends PostgisKind = PostgisKind> {
  readonly kind: Kind;
  readonly format: "ewkt";
  /** Verbatim EWKT. PostgreSQL alone parses and normalizes coordinate payloads. */
  readonly text: string;
  readonly srid: number;
  readonly dimensions: PostgisDimensions;
}
export type PostgisValue<Kind extends PostgisKind = PostgisKind> = PostgisEwkb<Kind> | PostgisEwkt<Kind>;
export type Geometry = PostgisValue<"geometry">;
export type Geography = PostgisValue<"geography">;
export interface PostgisSemantics {
  readonly srid?: number;
  readonly dimensions?: PostgisDimensions;
}
const hexText = v.pipe(v.string(), v.regex(/^(?:[0-9a-fA-F]{2}){5,}$/));
function ewkb<const Kind extends PostgisKind>(kind: Kind, source: string): PostgisEwkb<Kind> {
  const hex = v.parse(hexText, source);
  const bytes = Uint8Array.from(hex.match(/../g)!, (byte) => Number.parseInt(byte, 16));
  if (bytes[0] !== 0 && bytes[0] !== 1) throw new Error("Invalid EWKB byte order");
  const view = new DataView(bytes.buffer),
    little = bytes[0] === 1;
  const header = view.getUint32(1, little),
    flags = header >>> 28;
  const type = header & 0x0fffffff,
    iso = Math.floor(type / 1000);
  const z = (flags & 8) !== 0 || iso === 1 || iso === 3;
  const m = (flags & 4) !== 0 || iso === 2 || iso === 3;
  const srid = (flags & 2) !== 0 ? view.getInt32(5, little) : 0;
  return Object.freeze({
    kind,
    format: "ewkb",
    hex,
    srid,
    dimensions: z ? (m ? "XYZM" : "XYZ") : m ? "XYM" : "XY",
    geometryType: type % 1000,
  });
}
function ewkt<const Kind extends PostgisKind>(kind: Kind, text: string): PostgisEwkt<Kind> {
  const match = /^(?:SRID=(-?\d+);)?\s*[A-Za-z]+\s*(ZM|Z|M)?\s*(?:\(|EMPTY)/i.exec(v.parse(v.string(), text));
  if (!match) throw new Error("Expected EWKT geometry header");
  const srid = match[1] === undefined ? 0 : Number(match[1]);
  if (!Number.isInteger(srid) || srid < -2147483648 || srid > 2147483647) throw new Error("Invalid EWKT SRID");
  const implicitMeasure =
    /(?:^|;)\s*(?:POINT|LINESTRING|POLYGON|MULTIPOINT|MULTILINESTRING|MULTIPOLYGON|GEOMETRYCOLLECTION|CIRCULARSTRING|COMPOUNDCURVE|CURVEPOLYGON|MULTICURVE|MULTISURFACE|POLYHEDRALSURFACE|TIN|TRIANGLE)M\b/i.test(
      text,
    );
  const coordinate = /\(\s*([+\-\d.eE]+(?:\s+[+\-\d.eE]+){1,3})\s*[,)]/.exec(text);
  const arity = coordinate?.[1]?.trim().split(/\s+/).length;
  const dimension =
    match[2]?.toUpperCase() ?? (implicitMeasure ? "M" : arity === 4 ? "ZM" : arity === 3 ? "Z" : undefined);
  return Object.freeze({
    kind,
    format: "ewkt",
    text,
    srid,
    dimensions: dimension === "ZM" ? "XYZM" : dimension === "Z" ? "XYZ" : dimension === "M" ? "XYM" : "XY",
  });
}
export const geometryEwkb = (hex: string) => ewkb("geometry", hex);
export const geographyEwkb = (hex: string) => ewkb("geography", hex);
export const geometryEwkt = (text: string) => ewkt("geometry", text);
export const geographyEwkt = (text: string) => ewkt("geography", text);

function spatialCodec<const Kind extends PostgisKind>(schema: string, kind: Kind, semantics: PostgisSemantics) {
  const value = v.custom<PostgisValue<Kind>>((input) => {
    if (
      !v.is(
        v.object({
          kind: v.literal(kind),
          format: v.picklist(["ewkb", "ewkt"]),
          srid: v.number(),
          dimensions: v.picklist(["XY", "XYZ", "XYM", "XYZM"]),
        }),
        input,
      )
    )
      return false;
    try {
      const parsed =
        input.format === "ewkb" && "hex" in input && typeof input.hex === "string"
          ? ewkb(kind, input.hex)
          : input.format === "ewkt" && "text" in input && typeof input.text === "string"
            ? ewkt(kind, input.text)
            : undefined;
      return (
        parsed !== undefined &&
        parsed.srid === input.srid &&
        parsed.dimensions === input.dimensions &&
        (semantics.srid === undefined || parsed.srid === semantics.srid) &&
        (semantics.dimensions === undefined || parsed.dimensions === semantics.dimensions)
      );
    } catch {
      return false;
    }
  });
  const codec = createExtensionCodec({
    id: `postgis:3.6.4:${kind}:ewkb-ewkt:1:srid=${semantics.srid ?? "native"}:dimensions=${semantics.dimensions ?? "native"}`,
    sqlType: { schema, name: kind },
    input: value,
    output: value,
    transport: "text",
    encode: (input) => (input.format === "ewkb" ? input.hex : input.text),
    decode: (input) => ewkb(kind, v.parse(v.string(), input)),
  });
  return Object.freeze({ ...codec, encodeOutputParameter: codec.encode });
}
export function createPostgisGeometryCodec(schema: string, semantics: PostgisSemantics = {}) {
  return spatialCodec(schema, "geometry", semantics);
}
export function createPostgisGeographyCodec(schema: string, semantics: PostgisSemantics = {}) {
  return spatialCodec(schema, "geography", semantics);
}
/** Native text values retain their type identity; no JS box/spheroid geometry calculations. */
export function postgisNativeText<const Type extends string>(type: Type, text: string) {
  return Object.freeze({ type, text });
}
export function createPostgisTextCodec<const Type extends string>(schema: string, type: Type) {
  const value = v.object({ type: v.literal(type), text: v.string() });
  const codec = createExtensionCodec({
    id: `postgis:3.6.4:${type}:native-text:1`,
    sqlType: { schema, name: type },
    input: value,
    output: value,
    transport: "text",
    encode: (input) => input.text,
    decode: (input) => ({ type, text: v.parse(v.string(), input) }),
  });
  return Object.freeze({ ...codec, encodeOutputParameter: codec.encode });
}
export function createPostgisCompositeCodecs(schema: string) {
  const geometry = nullableCodec(createPostgisGeometryCodec(schema));
  return Object.freeze({
    geometry_dump: withCodecSqlType(
      compositeCodec("postgis:geometry_dump:3.6.4", { path: nullableCodec(arrayCodec(int4Codec)), geom: geometry }),
      { schema, name: "geometry_dump" },
    ),
    valid_detail: withCodecSqlType(
      compositeCodec("postgis:valid_detail:3.6.4", {
        valid: nullableCodec(
          createExtensionCodec({
            id: "pg:bool:postgis",
            input: v.boolean(),
            output: v.boolean(),
            transport: "native",
            encode: (value) => value,
            decode: (value) => (value === "t" ? true : value === "f" ? false : value),
          }),
        ),
        reason: nullableCodec(textCodec),
        location: geometry,
      }),
      { schema, name: "valid_detail" },
    ),
  });
}
