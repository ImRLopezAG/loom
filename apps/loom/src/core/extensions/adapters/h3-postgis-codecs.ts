import * as v from "valibot";
import {
  arrayCodec,
  compositeCodec,
  createExtensionCodec,
  floatCodec,
  integerCodec,
  nullableCodec,
  withCodecSqlType,
} from "../codecs";
import { int4Codec } from "../native-codecs";
export type { PostgreSqlArray, NonfiniteNumber } from "../codecs";

const hexText = v.pipe(v.string(), v.regex(/^(?:[0-9a-fA-F]{2})+$/, "Expected even-length hexadecimal raster WKB"));
const rasterValue = v.strictObject({ kind: v.literal("raster"), format: v.literal("wkb"), hex: hexText });
/** Native PostGIS raster WKB hex identity. Pixel layout stays in PostgreSQL. */
export type H3PostgisRaster = v.InferOutput<typeof rasterValue>;
export function rasterHex(hex: string): H3PostgisRaster {
  return Object.freeze({ kind: "raster", format: "wkb", hex: v.parse(hexText, hex) });
}
export function createH3PostgisRasterHexCodec(schema: string) {
  const codec = createExtensionCodec({
    id: "postgis_raster:3.6.4:raster:wkb-hex:1",
    sqlType: { schema, name: "raster" },
    input: rasterValue,
    output: rasterValue,
    transport: "text",
    encode: (value) => value.hex,
    decode: (value) => rasterHex(v.parse(v.string(), value)),
  });
  return Object.freeze({ ...codec, encodeOutputParameter: codec.encode });
}

const containment = v.picklist(["center", "full", "overlap", "overlapping_bbox"]);
/** h3-pg 4.2.3 experimental polygon containment_mode spellings. */
export type H3PostgisContainmentMode = v.InferOutput<typeof containment>;
export const h3PostgisContainmentModeCodec = createExtensionCodec({
  id: "h3_postgis:4.2.3:containment-mode:1",
  sqlType: { schema: "pg_catalog", name: "text" },
  input: containment,
  output: containment,
  transport: "text",
  encode: (value) => value,
  decode: (value) => v.parse(containment, value),
});

export function createPostgisRasterSummaryStatsCodec(schema: string) {
  return withCodecSqlType(
    compositeCodec("postgis_raster:3.6.4:summarystats", {
      count: nullableCodec(integerCodec),
      sum: nullableCodec(floatCodec),
      mean: nullableCodec(floatCodec),
      stddev: nullableCodec(floatCodec),
      min: nullableCodec(floatCodec),
      max: nullableCodec(floatCodec),
    }),
    { schema, name: "summarystats" },
  );
}

const classFields = {
  val: nullableCodec(int4Codec),
  count: nullableCodec(floatCodec),
  area: nullableCodec(floatCodec),
} as const;
const statsFields = {
  count: nullableCodec(floatCodec),
  sum: nullableCodec(floatCodec),
  mean: nullableCodec(floatCodec),
  stddev: nullableCodec(floatCodec),
  min: nullableCodec(floatCodec),
  max: nullableCodec(floatCodec),
} as const;

export function createH3RasterClassSummaryItemCodec(schema: string) {
  return withCodecSqlType(compositeCodec("h3_postgis:4.2.3:h3_raster_class_summary_item", classFields), {
    schema,
    name: "h3_raster_class_summary_item",
  });
}
export function createH3RasterSummaryStatsCodec(schema: string) {
  return withCodecSqlType(compositeCodec("h3_postgis:4.2.3:h3_raster_summary_stats", statsFields), {
    schema,
    name: "h3_raster_summary_stats",
  });
}
export function createH3RasterClassSummaryItemArrayCodec(schema: string) {
  return arrayCodec(createH3RasterClassSummaryItemCodec(schema));
}
export function createH3RasterSummaryStatsArrayCodec(schema: string) {
  return arrayCodec(createH3RasterSummaryStatsCodec(schema));
}
export { classFields as h3RasterClassSummaryItemFields, statsFields as h3RasterSummaryStatsFields };
