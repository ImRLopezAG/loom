import * as v from "valibot";
import { createExtensionCodec } from "../codecs";

/** Header-only raster identity. Pixel payloads stay opaque; PostgreSQL owns every raster algorithm. */
export interface PostgisRasterWkb {
  readonly kind: "raster";
  readonly format: "wkb";
  readonly hex: string;
  readonly srid: number;
  readonly width: number;
  readonly height: number;
  readonly numBands: number;
  readonly scaleX: number;
  readonly scaleY: number;
  readonly ipX: number;
  readonly ipY: number;
}
export type PostgisRasterValue = PostgisRasterWkb;
export interface PostgisRasterSemantics {
  readonly srid?: number;
  readonly width?: number;
  readonly height?: number;
  readonly numBands?: number;
}

const hexText = v.pipe(v.string(), v.regex(/^(?:[0-9a-fA-F]{2}){61,}$/));

function readHeader(hex: string): PostgisRasterWkb {
  const bytes = Uint8Array.from(v.parse(hexText, hex).match(/../g)!, (byte) => Number.parseInt(byte, 16));
  if (bytes[0] !== 0 && bytes[0] !== 1) throw new Error("Invalid raster WKB byte order");
  const view = new DataView(bytes.buffer),
    little = bytes[0] === 1;
  const version = view.getUint16(1, little);
  if (version !== 0) throw new Error("Unsupported raster WKB version");
  return Object.freeze({
    kind: "raster",
    format: "wkb",
    hex,
    numBands: view.getUint16(3, little),
    scaleX: view.getFloat64(5, little),
    scaleY: view.getFloat64(13, little),
    ipX: view.getFloat64(21, little),
    ipY: view.getFloat64(29, little),
    srid: view.getInt32(53, little),
    width: view.getUint16(57, little),
    height: view.getUint16(59, little),
  });
}

export function rasterWkb(hex: string): PostgisRasterWkb {
  return readHeader(hex);
}

export function createPostgisRasterCodec(schema: string, semantics: PostgisRasterSemantics = {}) {
  const value = v.custom<PostgisRasterWkb>((input) => {
    if (
      !v.is(
        v.object({
          kind: v.literal("raster"),
          format: v.literal("wkb"),
          hex: v.string(),
          srid: v.number(),
          width: v.number(),
          height: v.number(),
          numBands: v.number(),
        }),
        input,
      )
    )
      return false;
    try {
      const parsed = readHeader(input.hex);
      return (
        parsed.srid === input.srid &&
        parsed.width === input.width &&
        parsed.height === input.height &&
        parsed.numBands === input.numBands &&
        (semantics.srid === undefined || parsed.srid === semantics.srid) &&
        (semantics.width === undefined || parsed.width === semantics.width) &&
        (semantics.height === undefined || parsed.height === semantics.height) &&
        (semantics.numBands === undefined || parsed.numBands === semantics.numBands)
      );
    } catch {
      return false;
    }
  });
  const codec = createExtensionCodec({
    id: `postgis_raster:3.6.4:raster:wkb:1:srid=${semantics.srid ?? "native"}:width=${semantics.width ?? "native"}:height=${semantics.height ?? "native"}:bands=${semantics.numBands ?? "native"}`,
    sqlType: { schema, name: "raster" },
    input: value,
    output: value,
    transport: "text",
    encode: (input) => input.hex,
    decode: (input) => readHeader(v.parse(v.string(), input)),
  });
  return Object.freeze({ ...codec, encodeOutputParameter: codec.encode });
}
