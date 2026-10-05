import { expectTypeOf, test } from "vite-plus/test";
import { createH3Postgis_4_2_3 } from "../../../apps/loom/src/core/extensions/adapters/h3-postgis";
import { h3Index } from "../../../apps/loom/src/core/extensions/adapters/h3-codecs";
import { geographyEwkt, geometryEwkt } from "../../../apps/loom/src/core/extensions/adapters/postgis-codecs";
import { rasterHex } from "../../../apps/loom/src/core/extensions/adapters/h3-postgis-codecs";

declare const api: ReturnType<
  typeof createH3Postgis_4_2_3<{
    name: "h3_postgis";
    version: "4.2.3";
    schema: "s";
    apiSupport: { status: "verified"; digest: string };
  }>
>;
const cell = h3Index("8928308280fffff");
const geography = geographyEwkt("SRID=4326;POINT(-122.4 37.8)");
const geometry = geometryEwkt("SRID=4326;POINT(-122.4 37.8)");
const raster = rasterHex("01000000");
test("h3_postgis exact arities, spellings and dependency descriptors", () => {
  expectTypeOf(api.latLngToCell).toBeCallableWith(geography, 9);
  expectTypeOf(api.latLngToCell).toBeCallableWith(geometry, 9);
  expectTypeOf(api.latlngToCell).toBeCallableWith(geography, 9);
  expectTypeOf(api.cellToBoundaryGeometry).toBeCallableWith(cell);
  expectTypeOf(api.cellToBoundaryGeometry).toBeCallableWith(cell, true);
  expectTypeOf(api.polygonToCellsExperimental).toBeCallableWith(geometry, 9);
  expectTypeOf(api.polygonToCellsExperimental).toBeCallableWith(geometry, 9, "overlapping_bbox");
  expectTypeOf(api.getResolutionFromTileZoom).toBeCallableWith(10);
  expectTypeOf(api.rasterSummary).toBeCallableWith(raster, 8);
  expectTypeOf(api.rasterSummary).toBeCallableWith(raster, 8, 2);
  // @ts-expect-error H3 lat/lng points are not PostGIS geography.
  api.latLngToCell({ lng: -122.4, lat: 37.8 }, 9);
  // @ts-expect-error containment_mode is the captured h3-pg spelling set.
  api.polygonToCellsExperimental(geometry, 9, "bbox");
  // @ts-expect-error raster hex is not a geometry.
  api.cellToGeometry(raster);
  // @ts-expect-error Missing typed h3/postgis/postgis_raster descriptors.
  createH3Postgis_4_2_3(api);
});
