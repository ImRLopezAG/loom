import { expectTypeOf, test } from "vite-plus/test";
import { createPostgisRaster_3_6_4 } from "../../../apps/loom/src/core/extensions/adapters/postgis-raster";
import {
  rasterWkb,
  type PostgisRasterWkb,
} from "../../../apps/loom/src/core/extensions/adapters/postgis-raster-codecs";
import { geometryEwkt } from "../../../apps/loom/src/core/extensions/adapters/postgis-codecs";
import type { PostgisRasterOperatorSession } from "../../../apps/loom/src/tooling/extensions/operations/postgis_raster";

declare const api: ReturnType<
  typeof createPostgisRaster_3_6_4<{
    name: "postgis_raster";
    version: "3.6.4";
    schema: "r";
    apiSupport: { status: "verified"; digest: string };
  }>
>;
const raster = rasterWkb(
  "0100000000000000000000f03f000000000000f0bf0000000000002440000000000000344000000000000000000000000000000000e610000002000300",
);
const point = geometryEwkt("SRID=4326;POINT(10 20)");

test("postgis_raster exact arities, fields, and hash index", () => {
  expectTypeOf(api.sql.functions.st_width).toBeCallableWith(raster);
  expectTypeOf(
    api.sql.functions.st_makeemptyraster[
      "(pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)"
    ],
  ).toBeCallableWith(2, 3, 1, 0, 0);
  expectTypeOf(
    api.sql.functions.st_value["($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool)"],
  ).toBeCallableWith(raster, point);
  expectTypeOf(api.raster.field).toBeCallableWith();
  expectTypeOf(api.raster.field).toBeCallableWith({ srid: 4326, width: 2, height: 3, numBands: 0 });
  expectTypeOf(api.indexes.hash_raster_ops).toBeCallableWith();
  // @ts-expect-error text is not a raster WKB value
  api.sql.functions.st_width("not-a-raster");
});

test("raster tooling preserves the complete set-valued retile result", () => {
  type Retile =
    PostgisRasterOperatorSession["routine:$extension:postgis_raster.st_retile(pg_catalog.regclass,pg_catalog.name,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.text)"];
  expectTypeOf<ReturnType<Retile>>().toEqualTypeOf<Promise<Array<PostgisRasterWkb | null>>>();
});

test("native safety rejection retains exact quantile arguments, arrays, defaults, and null contracts", () => {
  const scalar =
    api.sql.functions.st_approxquantile["($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)"];
  const array = api.sql.functions.st_approxquantile["($extension:postgis_raster.raster,pg_catalog._float8)"];
  expectTypeOf(scalar).toBeCallableWith(raster, true);
  expectTypeOf(scalar).toBeCallableWith(raster, true, 0.5);
  expectTypeOf(scalar).toBeCallableWith(null, null, null);
  expectTypeOf(array).toBeCallableWith(raster, { values: [0.5, null], dimensions: [{ length: 2, lowerBound: 1 }] });
  expectTypeOf(array).toBeCallableWith(null, null);
  // @ts-expect-error quantile array is not a scalar number
  array(raster, 0.5);
  // @ts-expect-error boolean position retains the captured type
  scalar(raster, 1, 0.5);
});
