import assert from "node:assert/strict";
import { test } from "bun:test";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createH3Postgis_4_2_3 } from "../../../apps/loom/src/core/extensions/adapters/h3-postgis";
import { h3Index } from "../../../apps/loom/src/core/extensions/adapters/h3-codecs";
import { geographyEwkt, geometryEwkt } from "../../../apps/loom/src/core/extensions/adapters/postgis-codecs";
import { rasterHex } from "../../../apps/loom/src/core/extensions/adapters/h3-postgis-codecs";
import { extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/h3_postgis.json";
import h3Manifest from "../../../apps/loom/src/tooling/extensions/manifests/h3.json";
import postgisManifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json";
import rasterManifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis_raster.json";

// Source-only contract characterization. This is not native PG execution, generation, packed-consumer, or Neon.

const digest = "9803892394c3cec2d4305ca64a925baefbe37c9108e8bb2601c7f384575f481e";
const dialect = extensionSqlDialect(nodePgCodecs);

test("h3_postgis 4.2.3 source contract is characterized without claiming native or shipping gates", () => {
  assert.equal(manifest.digest, digest);
  assert.equal(manifest.contract.version, "4.2.3");
  assert.deepEqual(manifest.contract.requires, ["h3", "postgis", "postgis_raster"]);
  assert.equal(manifest.contract.members.length, 62);
  assert.equal(
    manifest.contract.members.filter((row) => row.kind === "opclass" || row.kind === "opfamily").length,
    0,
  );
  const api = createH3Postgis_4_2_3(
    { name: "h3_postgis", version: "4.2.3", schema: 'h3"pg', apiSupport: { status: "verified", digest } },
    { name: "h3", version: "4.2.3", schema: 'custom"h3', apiSupport: { status: "verified", digest: h3Manifest.digest } },
    {
      name: "postgis",
      version: "3.6.4",
      schema: "postgis 地",
      apiSupport: { status: "verified", digest: postgisManifest.digest },
    },
    {
      name: "postgis_raster",
      version: "3.6.4",
      schema: "postgis 地",
      apiSupport: { status: "verified", digest: rasterManifest.digest },
    },
  );
  const query = dialect.sqlToQuery(
    api.latLngToCell(geographyEwkt("SRID=4326;POINT(-122.4 37.8)"), 9),
  );
  assert.match(query.sql, /"h3""pg"\."h3_lat_lng_to_cell"/);
  assert.match(dialect.sqlToQuery(api.latLngToCell(geometryEwkt("SRID=4326;POINT(-122.4 37.8)"), 9)).sql, /geometry/);
  assert.match(
    dialect.sqlToQuery(api.cellsToMultiPolygonGeometry({ dimensions: [{ lowerBound: 1, length: 1 }], values: [h3Index("8928308280fffff")] })).sql,
    /"h3index"\[\]/,
  );
  assert.throws(() => api.cellsToMultiPolygonGeometry({ dimensions: [], values: [] }));
  assert.match(dialect.sqlToQuery(api.rasterSummary(rasterHex("01000000"), 8)).sql, /h3_raster_summary/);
  assert.deepEqual(api.indexes, {});
});
