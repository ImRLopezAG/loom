import { expect, test } from "vite-plus/test";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createH3Postgis_4_2_3 } from "../../../apps/loom/src/core/extensions/adapters/h3-postgis";
import { h3Index } from "../../../apps/loom/src/core/extensions/adapters/h3-codecs";
import { geographyEwkt, geometryEwkt } from "../../../apps/loom/src/core/extensions/adapters/postgis-codecs";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { h3PostgisAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/h3-postgis";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/h3_postgis.json";
import h3Manifest from "../../../apps/loom/src/tooling/extensions/manifests/h3.json";
import postgisManifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json";
import rasterManifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis_raster.json";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { h3PostgisUnitProofCases } from "../../e2e/fixtures/h3-postgis-proof-cases";
import { rasterHex } from "../../../apps/loom/src/core/extensions/adapters/h3-postgis-codecs";

const digest = "9803892394c3cec2d4305ca64a925baefbe37c9108e8bb2601c7f384575f481e";
const dialect = extensionSqlDialect(nodePgCodecs);
const descriptor = {
  name: "h3_postgis",
  version: "4.2.3",
  schema: 'h3"pg',
  apiSupport: { status: "verified", digest },
} as const;
const h3 = {
  name: "h3",
  version: "4.2.3",
  schema: 'custom"h3',
  apiSupport: { status: "verified", digest: h3Manifest.digest },
} as const;
const postgis = {
  name: "postgis",
  version: "3.6.4",
  schema: 'Spatial"日本',
  apiSupport: { status: "verified", digest: postgisManifest.digest },
} as const;
const raster = {
  name: "postgis_raster",
  version: "3.6.4",
  schema: postgis.schema,
  apiSupport: { status: "verified", digest: rasterManifest.digest },
} as const;
const cell = h3Index("8928308280fffff");
const point = geographyEwkt("SRID=4326;POINT(-122.4089866999972 37.81331899998324)");
const polygon = geometryEwkt(
  "SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))",
);
const rasterValue = rasterHex(
  "01000000000000000000000000000000000000000000000000000000000024400000000000003440000000000000f03f000000000000f0bf00000000000000000000000000000000e610000002000300",
);
const sorted = (values: readonly string[]) => [...values].sort((a, b) => a.localeCompare(b));

extensionProofUnitTest(h3PostgisUnitProofCases[0]!, () => {
  expect(manifest.digest).toBe(digest);
  expect(manifest.contract.version).toBe("4.2.3");
  expect(manifest.contract.requires).toEqual(["h3", "postgis", "postgis_raster"]);
  expect(manifest.contract.members).toHaveLength(62);
  expect(
    manifest.contract.members.filter(
      (row) => /opclass|opfamily|access method/.test(row.kind) || row.id.includes("opclass:"),
    ),
  ).toEqual([]);
  expect(h3PostgisAnnotations.map((row) => row.id).sort()).toEqual(
    manifest.contract.members.map((row) => row.id).sort(),
  );
  const api = createH3Postgis_4_2_3(descriptor, h3, postgis, raster);
  expect(Object.isFrozen(api)).toBe(true);
  expect(sorted(Object.keys(api.sql.overloads))).toEqual(
    sorted(h3PostgisAnnotations.filter((row) => row.disposition === "query").map((row) => row.id)),
  );
  expect(sorted(h3PostgisAnnotations.filter((row) => row.disposition === "schema").map((row) => row.id))).toEqual([
    "type:$extension:h3_postgis._h3_raster_class_summary_item",
    "type:$extension:h3_postgis._h3_raster_summary_stats",
    "type:$extension:h3_postgis.h3_raster_class_summary_item",
    "type:$extension:h3_postgis.h3_raster_summary_stats",
  ]);
  expect(sorted(h3PostgisAnnotations.filter((row) => row.disposition === "internal").map((row) => row.id))).toEqual([
    'composite type:"$extension:h3_postgis".h3_raster_class_summary_item',
    'composite type:"$extension:h3_postgis".h3_raster_summary_stats',
  ]);
  expect(api.indexes).toEqual({});
  expect(() =>
    // @ts-expect-error wrong h3_postgis version must be rejected at runtime
    createH3Postgis_4_2_3({ ...descriptor, version: "4.2.2" }, h3, postgis, raster),
  ).toThrow(/4\.2\.3/);
  expect(() =>
    createH3Postgis_4_2_3(
      { ...descriptor, apiSupport: { status: "verified", digest: "0".repeat(64) } },
      h3,
      postgis,
      raster,
    ),
  ).toThrow(/exact verified/);
  expect(() =>
    // @ts-expect-error wrong h3 version must be rejected at runtime
    createH3Postgis_4_2_3(descriptor, { ...h3, version: "4.2.2" }, postgis, raster),
  ).toThrow(/h3 4\.2\.3/);
  expect(() =>
    // @ts-expect-error wrong postgis version must be rejected at runtime
    createH3Postgis_4_2_3(descriptor, h3, { ...postgis, version: "3.5.0" }, raster),
  ).toThrow(/postgis 3\.6\.4/);
  expect(() =>
    // @ts-expect-error wrong postgis_raster version must be rejected at runtime
    createH3Postgis_4_2_3(descriptor, h3, postgis, { ...raster, version: "3.5.0" }),
  ).toThrow(/postgis_raster 3\.6\.4/);
  for (const companion of ["h3", "postgis", "raster"] as const) {
    const unsupported = { status: "verified", digest: "0".repeat(64) } as const;
    expect(() =>
      createH3Postgis_4_2_3(
        descriptor,
        companion === "h3" ? { ...h3, apiSupport: unsupported } : h3,
        companion === "postgis" ? { ...postgis, apiSupport: unsupported } : postgis,
        companion === "raster" ? { ...raster, apiSupport: unsupported } : raster,
      ),
    ).toThrow(/verified/);
  }
  expect(() => createH3Postgis_4_2_3(descriptor, h3, postgis, { ...raster, schema: 'rast"q' })).toThrow(
    /same installation schema/,
  );
});

extensionProofUnitTest(h3PostgisUnitProofCases[1]!, () => {
  const api = createH3Postgis_4_2_3(descriptor, h3, postgis, raster);
  const indexed = dialect.sqlToQuery(api.latLngToCell(point, 9));
  expect(indexed.sql).toContain('"h3""pg"."h3_lat_lng_to_cell"');
  expect(indexed.sql).toContain('"Spatial""日本"."geography"');
  expect(indexed.params).toEqual([point.text, 9]);
  expect(extensionExpressionContract(api.latlngToCell(point, 9))?.member).toBe(
    "routine:$extension:h3_postgis.h3_latlng_to_cell($extension:postgis.geography,pg_catalog.int4)",
  );
  expect(extensionExpressionContract(api.latLngToCell(polygon, 9))?.member).toBe(
    "routine:$extension:h3_postgis.h3_lat_lng_to_cell($extension:postgis.geometry,pg_catalog.int4)",
  );
  const boundary = dialect.sqlToQuery(api.cellToBoundaryGeometry(cell));
  expect(boundary.sql).toContain('"h3""pg"."h3_cell_to_boundary_geometry"');
  expect(boundary.params).toEqual(["8928308280fffff"]);
  const extended = dialect.sqlToQuery(api.cellToBoundaryGeometry(cell, true));
  expect(extended.sql).toContain('"extend_antimeridian" =>');
  expect(extended.params).toEqual(["8928308280fffff", true]);
  const operator = dialect.sqlToQuery(api.sql.operators["@"](point, 9));
  expect(operator.sql).toContain('operator("h3""pg".@)');
  const cast = dialect.sqlToQuery(api.sql.casts.h3index_to_geometry(cell));
  expect(cast.sql).toContain('::"custom""h3"."h3index")::"Spatial""日本"."geometry"');
  const cells = { dimensions: [{ lowerBound: 1, length: 1 }], values: [cell] };
  expect(dialect.sqlToQuery(api.cellsToMultiPolygonGeometry(cells)).sql).toContain('::"custom""h3"."h3index"[]');
  expect(() => api.cellsToMultiPolygonGeometry({ dimensions: [], values: [] })).toThrow(
    "h3_cells_to_multi_polygon requires at least one array element",
  );
  const experimental = dialect.sqlToQuery(api.polygonToCellsExperimental(polygon, 9));
  expect(experimental.sql).toContain('"h3""pg"."h3_polygon_to_cells_experimental"');
  expect(experimental.params).toEqual([polygon.text, 9]);
  expect(dialect.sqlToQuery(api.polygonToCellsExperimental(polygon, 9, "overlapping_bbox")).params).toEqual([
    polygon.text,
    9,
    "overlapping_bbox",
  ]);
  // SAFETY: the containment codec must reject this captured-invalid spelling if a caller bypasses the picklist.
  expect(() => api.polygonToCellsExperimental(polygon, 9, "bbox" as "center")).toThrow();
  const zoom = dialect.sqlToQuery(api.getResolutionFromTileZoom(10));
  expect(zoom.sql).toContain('"h3""pg"."h3_get_resolution_from_tile_zoom"');
  expect(zoom.params).toEqual([10]);
  const rasterCall = dialect.sqlToQuery(api.rasterSummary(rasterValue, 8));
  expect(rasterCall.sql).toContain('"h3""pg"."h3_raster_summary"');
  expect(rasterCall.params).toEqual([rasterValue.hex, 8]);
  expect(extensionExpressionContract(api.rasterSummary(rasterValue, 8, 2))?.member).toBe(
    "routine:$extension:h3_postgis.h3_raster_summary($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
  );
  expect(api.field().metadata.extension).toMatchObject({
    type: "h3_raster_class_summary_item",
    member: "type:$extension:h3_postgis.h3_raster_class_summary_item",
  });
  expect(api.statsField().metadata.extension).toMatchObject({
    type: "h3_raster_summary_stats",
    member: "type:$extension:h3_postgis.h3_raster_summary_stats",
  });
  expect(() =>
    // SAFETY: a raw lng/lat point is not a PostGIS geography or geometry value.
    api.latLngToCell({ lng: 1, lat: 2 } as never, 9),
  ).toThrow();
  expect(h3PostgisAnnotations.every((row) => row.reason.length > 0 && row.evidence.length >= 4 && row.semantics)).toBe(
    true,
  );
  expect(
    h3PostgisAnnotations.every(
      (row) => row.semantics.providerAcceptance === "pending" && row.semantics.publicExportAcceptance === "pending",
    ),
  ).toBe(true);
});

test("h3_postgis source contract has no index graph and no invented native pass", () => {
  expect(manifest.provenance.verified).toBe(true);
  expect(manifest.contract.members.some((row) => row.kind === "opclass" || row.kind === "opfamily")).toBe(false);
});
