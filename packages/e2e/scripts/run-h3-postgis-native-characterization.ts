// Native h3_postgis 4.2.3 oracle. Requires an image with h3-pg 4.2.3 built over PostGIS 3.6.4 / postgis_raster 3.6.4.
// Usage: bun packages/e2e/scripts/run-h3-postgis-native-characterization.ts <image> <out.json>
// Without that image this script records pending and exits 2. It is not a generation, packed-consumer, or Neon gate.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import pg from "pg";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import source from "../../../apps/loom/src/tooling/extensions/manifests/h3_postgis.json";

const digest = "9803892394c3cec2d4305ca64a925baefbe37c9108e8bb2601c7f384575f481e";
const pending = {
  status: "pending" as const,
  gate: "h3_postgis.native-characterization",
  extension: "h3_postgis",
  version: "4.2.3",
  digest,
  members: 62,
  indexGraph: "empty",
  reason:
    "h3 native companion artifact is not ready. Core PostGIS 3.6.4 (loom-postgis-core-3.6.4-pg18:local) is not sufficient; h3 4.2.3 plus h3_postgis 4.2.3 must be present. This is not a native pass.",
};

const [image, out] = process.argv.slice(2);
if (!image || !out) {
  console.log(JSON.stringify(pending, null, 2));
  process.exit(2);
}
try {
  execFileSync("docker", ["image", "inspect", image], { stdio: "pipe" });
} catch {
  const missing = { ...pending, image, reason: `${pending.reason} Image ${image} is not present locally.` };
  await writeFile(out, `${JSON.stringify(missing, null, 2)}\n`);
  console.log(JSON.stringify(missing, null, 2));
  process.exit(2);
}

assert.equal(source.digest, digest);
assert.equal(source.contract.members.length, 62);

const password = "h3-postgis-local";
const container = execFileSync(
  "docker",
  ["run", "-d", "--rm", "-e", `POSTGRES_PASSWORD=${password}`, "-p", "127.0.0.1::5432", image],
  { encoding: "utf8" },
).trim();
try {
  const port = execFileSync("docker", ["port", container, "5432/tcp"], { encoding: "utf8" }).trim().split(":").at(-1);
  const url = `postgresql://postgres:${password}@127.0.0.1:${port}/postgres`;
  let client: pg.Client | undefined;
  for (let attempt = 0; !client; attempt++) {
    const candidate = new pg.Client({ connectionString: url });
    try {
      await candidate.connect();
      await candidate.query("SELECT 1");
      client = candidate;
    } catch (error) {
      await candidate.end().catch(() => {});
      if (attempt > 60) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  try {
    const h = pg.escapeIdentifier("custom H3");
    const p = pg.escapeIdentifier("postgis 地");
    const r = p; // postgis_raster 3.6.4 natively refuses any schema other than PostGIS's.
    const s = pg.escapeIdentifier("h3 Pg");
    await client.query(`CREATE SCHEMA ${h}; CREATE SCHEMA ${p}; CREATE SCHEMA ${s}`);
    await client.query(`CREATE EXTENSION postgis WITH SCHEMA ${p} VERSION '3.6.4'`);
    await client.query(`CREATE EXTENSION postgis_raster WITH SCHEMA ${r} VERSION '3.6.4'`);
    await client.query(`CREATE EXTENSION h3 WITH SCHEMA ${h} VERSION '4.2.3'`);
    await client.query(`CREATE EXTENSION h3_postgis WITH SCHEMA ${s} VERSION '4.2.3'`);
    await client.query(`BEGIN; SET LOCAL search_path TO pg_catalog`);
    const observed = await captureExtensionContract(client, {
      name: "h3_postgis",
      provider: "neon",
      fixture: "owned-local-pg18-h3_postgis-4.2.3",
    });
    const identity = {
      expectedDigest: source.digest,
      observedDigest: observed.digest,
      exactContract: JSON.stringify(observed.contract) === JSON.stringify(source.contract),
      members: observed.contract.members.length,
      opclasses: observed.contract.members.filter((row) => row.kind === "opclass" || row.kind === "opfamily").length,
      server: (await client.query("SELECT current_setting('server_version') v")).rows[0].v,
    };
    const geog = `${p}.st_geogfromtext('SRID=4326;POINT(-122.4089866999972 37.81331899998324)')`;
    const geom = `${p}.st_geomfromewkt('SRID=4326;POINT(-122.4089866999972 37.81331899998324)')`;
    const poly = `${p}.st_geomfromewkt('SRID=4326;POLYGON((-122.4089 37.8133,-122.4089 37.8033,-122.3989 37.8033,-122.3989 37.8133,-122.4089 37.8133))')`;
    const cell = `'8928308280fffff'::${h}.h3index`;
    const cells = `ARRAY[${cell}]::${h}.h3index[]`;
    // A valid 2x3 geotransform over the witness polygon; degenerate geotransforms are never probed.
    const rast = `${r}.st_addband(${r}.st_makeemptyraster(2,3,-122.41,37.814,0.005,-0.005,0,0,4326),'8BUI'::text,1::float8,0::float8)`;
    const classItem = `ROW(1,1::float8,1::float8)::${s}.h3_raster_class_summary_item`;
    const stats = `ROW(1::float8,1::float8,1::float8,0::float8,1::float8,1::float8)::${s}.h3_raster_summary_stats`;
    const rasterStats = `ROW(1::int8,1::float8,1::float8,0::float8,1::float8,1::float8)::${r}.summarystats`;
    const witnesses = {
      "cast:$extension:h3.h3index->$extension:postgis.geography": `${cell}::${p}.geography`,
      "cast:$extension:h3.h3index->$extension:postgis.geometry": `${cell}::${p}.geometry`,
      "operator:$extension:h3_postgis.@($extension:postgis.geography,pg_catalog.int4)": `${geog} operator(${s}.@) 9`,
      "operator:$extension:h3_postgis.@($extension:postgis.geometry,pg_catalog.int4)": `${geom} operator(${s}.@) 9`,
      "routine:$extension:h3_postgis.__h3_raster_band_nodata($extension:postgis_raster.raster,pg_catalog.int4)":
        `${s}.__h3_raster_band_nodata(${rast},1)`,
      "routine:$extension:h3_postgis.__h3_raster_class_polygon_summary_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)":
        `(SELECT t FROM ${s}.__h3_raster_class_polygon_summary_clip(${rast},${poly},8,1,1) t LIMIT 1)`,
      "routine:$extension:h3_postgis.__h3_raster_class_polygon_summary_subpixel($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)":
        `(SELECT t FROM ${s}.__h3_raster_class_polygon_summary_subpixel(${rast},${poly},8,1,1,1) t LIMIT 1)`,
      "routine:$extension:h3_postgis.__h3_raster_class_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)":
        `(SELECT t FROM ${s}.__h3_raster_class_summary_centroids(${rast},8,1,1) t LIMIT 1)`,
      "routine:$extension:h3_postgis.__h3_raster_class_summary_item_agg_transfn($extension:h3_postgis.h3_raster_class_summary_item,$extension:h3_postgis.h3_raster_class_summary_item)":
        `${s}.__h3_raster_class_summary_item_agg_transfn(${classItem},${classItem})`,
      "routine:$extension:h3_postgis.__h3_raster_class_summary_part($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)":
        `(SELECT t FROM ${s}.__h3_raster_class_summary_part(${rast},1,1) t LIMIT 1)`,
      "routine:$extension:h3_postgis.__h3_raster_polygon_centroid_cell_area($extension:postgis.geometry,pg_catalog.int4)":
        `${s}.__h3_raster_polygon_centroid_cell_area(${poly},8)`,
      "routine:$extension:h3_postgis.__h3_raster_polygon_centroid_cell($extension:postgis.geometry,pg_catalog.int4)":
        `${s}.__h3_raster_polygon_centroid_cell(${poly},8)`,
      "routine:$extension:h3_postgis.__h3_raster_polygon_pixel_area($extension:postgis_raster.raster,$extension:postgis.geometry)":
        `${s}.__h3_raster_polygon_pixel_area(${rast},${poly})`,
      "routine:$extension:h3_postgis.__h3_raster_polygon_subpixel_cell_values($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)":
        `(SELECT t FROM ${s}.__h3_raster_polygon_subpixel_cell_values(${rast},${poly},8,1) t LIMIT 1)`,
      "routine:$extension:h3_postgis.__h3_raster_polygon_summary_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)":
        `(SELECT t FROM ${s}.__h3_raster_polygon_summary_clip(${rast},${poly},8,1) t LIMIT 1)`,
      "routine:$extension:h3_postgis.__h3_raster_polygon_summary_subpixel($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)":
        `(SELECT t FROM ${s}.__h3_raster_polygon_summary_subpixel(${rast},${poly},8,1,1) t LIMIT 1)`,
      "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_boundaries_intersects($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)":
        `(SELECT t FROM ${s}.__h3_raster_polygon_to_cell_boundaries_intersects(${rast},${poly},8) t LIMIT 1)`,
      "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_coords_centroid($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)":
        `(SELECT t FROM ${s}.__h3_raster_polygon_to_cell_coords_centroid(${rast},${poly},8) t LIMIT 1)`,
      "routine:$extension:h3_postgis.__h3_raster_polygon_to_cell_parts($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4)":
        `(SELECT t FROM ${s}.__h3_raster_polygon_to_cell_parts(${rast},${poly},8,1) t LIMIT 1)`,
      "routine:$extension:h3_postgis.__h3_raster_polygon_to_cells($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.float8)":
        `(SELECT t FROM ${s}.__h3_raster_polygon_to_cells(${rast},${poly},8,1) t LIMIT 1)`,
      "routine:$extension:h3_postgis.__h3_raster_summary_stats_agg_transfn($extension:h3_postgis.h3_raster_summary_stats,$extension:h3_postgis.h3_raster_summary_stats)":
        `${s}.__h3_raster_summary_stats_agg_transfn(${stats},${stats})`,
      "routine:$extension:h3_postgis.__h3_raster_to_polygon($extension:postgis_raster.raster,pg_catalog.int4)":
        `${s}.__h3_raster_to_polygon(${rast},1)`,
      "routine:$extension:h3_postgis.__h3_raster_to_summary_stats($extension:postgis_raster.summarystats)":
        `${s}.__h3_raster_to_summary_stats(${rasterStats})`,
      "routine:$extension:h3_postgis.h3_cell_to_boundary_geography($extension:h3.h3index)":
        `${s}.h3_cell_to_boundary_geography(${cell})`,
      "routine:$extension:h3_postgis.h3_cell_to_boundary_geography($extension:h3.h3index,pg_catalog.bool)":
        `${s}.h3_cell_to_boundary_geography(${cell},true)`,
      "routine:$extension:h3_postgis.h3_cell_to_boundary_geometry($extension:h3.h3index)":
        `${s}.h3_cell_to_boundary_geometry(${cell})`,
      "routine:$extension:h3_postgis.h3_cell_to_boundary_geometry($extension:h3.h3index,pg_catalog.bool)":
        `${s}.h3_cell_to_boundary_geometry(${cell},true)`,
      "routine:$extension:h3_postgis.h3_cell_to_boundary_wkb($extension:h3.h3index)": `${s}.h3_cell_to_boundary_wkb(${cell})`,
      "routine:$extension:h3_postgis.h3_cell_to_geography($extension:h3.h3index)": `${s}.h3_cell_to_geography(${cell})`,
      "routine:$extension:h3_postgis.h3_cell_to_geometry($extension:h3.h3index)": `${s}.h3_cell_to_geometry(${cell})`,
      "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geography($extension:h3._h3index)":
        `${s}.h3_cells_to_multi_polygon_geography(${cells})`,
      "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geography($extension:h3.h3index)":
        `(SELECT ${s}.h3_cells_to_multi_polygon_geography(c) FROM (VALUES (${cell})) v(c))`,
      "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geometry($extension:h3._h3index)":
        `${s}.h3_cells_to_multi_polygon_geometry(${cells})`,
      "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_geometry($extension:h3.h3index)":
        `(SELECT ${s}.h3_cells_to_multi_polygon_geometry(c) FROM (VALUES (${cell})) v(c))`,
      "routine:$extension:h3_postgis.h3_cells_to_multi_polygon_wkb($extension:h3._h3index)":
        `${s}.h3_cells_to_multi_polygon_wkb(${cells})`,
      "routine:$extension:h3_postgis.h3_get_resolution_from_tile_zoom(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)":
        `${s}.h3_get_resolution_from_tile_zoom(10)`,
      "routine:$extension:h3_postgis.h3_grid_path_cells_recursive($extension:h3.h3index,$extension:h3.h3index)":
        `(SELECT t FROM ${s}.h3_grid_path_cells_recursive(${cell},${cell}) t LIMIT 1)`,
      "routine:$extension:h3_postgis.h3_lat_lng_to_cell($extension:postgis.geography,pg_catalog.int4)":
        `${s}.h3_lat_lng_to_cell(${geog},9)`,
      "routine:$extension:h3_postgis.h3_lat_lng_to_cell($extension:postgis.geometry,pg_catalog.int4)":
        `${s}.h3_lat_lng_to_cell(${geom},9)`,
      "routine:$extension:h3_postgis.h3_latlng_to_cell($extension:postgis.geography,pg_catalog.int4)":
        `${s}.h3_latlng_to_cell(${geog},9)`,
      "routine:$extension:h3_postgis.h3_latlng_to_cell($extension:postgis.geometry,pg_catalog.int4)":
        `${s}.h3_latlng_to_cell(${geom},9)`,
      "routine:$extension:h3_postgis.h3_polygon_to_cells($extension:postgis.geography,pg_catalog.int4)":
        `(SELECT t FROM ${s}.h3_polygon_to_cells(${p}.geography(${poly}),9) t LIMIT 1)`,
      "routine:$extension:h3_postgis.h3_polygon_to_cells($extension:postgis.geometry,pg_catalog.int4)":
        `(SELECT t FROM ${s}.h3_polygon_to_cells(${poly},9) t LIMIT 1)`,
      "routine:$extension:h3_postgis.h3_polygon_to_cells_experimental($extension:postgis.geography,pg_catalog.int4,pg_catalog.text)":
        `(SELECT t FROM ${s}.h3_polygon_to_cells_experimental(${p}.geography(${poly}),9,'overlapping_bbox') t LIMIT 1)`,
      "routine:$extension:h3_postgis.h3_polygon_to_cells_experimental($extension:postgis.geometry,pg_catalog.int4,pg_catalog.text)":
        `(SELECT t FROM ${s}.h3_polygon_to_cells_experimental(${poly},9,'overlapping_bbox') t LIMIT 1)`,
      "routine:$extension:h3_postgis.h3_raster_class_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
        `(SELECT t FROM ${s}.h3_raster_class_summary_centroids(${rast},8) t LIMIT 1)`,
      "routine:$extension:h3_postgis.h3_raster_class_summary_clip($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
        `(SELECT t FROM ${s}.h3_raster_class_summary_clip(${rast},8) t LIMIT 1)`,
      "routine:$extension:h3_postgis.h3_raster_class_summary_item_agg($extension:h3_postgis.h3_raster_class_summary_item)":
        `(SELECT ${s}.h3_raster_class_summary_item_agg(i) FROM (VALUES (${classItem})) v(i))`,
      "routine:$extension:h3_postgis.h3_raster_class_summary_item_to_jsonb($extension:h3_postgis.h3_raster_class_summary_item)":
        `${s}.h3_raster_class_summary_item_to_jsonb(${classItem})`,
      "routine:$extension:h3_postgis.h3_raster_class_summary_subpixel($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
        `(SELECT t FROM ${s}.h3_raster_class_summary_subpixel(${rast},8) t LIMIT 1)`,
      "routine:$extension:h3_postgis.h3_raster_class_summary($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
        `(SELECT t FROM ${s}.h3_raster_class_summary(${rast},8) t LIMIT 1)`,
      "routine:$extension:h3_postgis.h3_raster_summary_centroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
        `(SELECT t FROM ${s}.h3_raster_summary_centroids(${rast},8) t LIMIT 1)`,
      "routine:$extension:h3_postgis.h3_raster_summary_clip($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
        `(SELECT t FROM ${s}.h3_raster_summary_clip(${rast},8) t LIMIT 1)`,
      "routine:$extension:h3_postgis.h3_raster_summary_stats_agg($extension:h3_postgis.h3_raster_summary_stats)":
        `(SELECT ${s}.h3_raster_summary_stats_agg(i) FROM (VALUES (${stats})) v(i))`,
      "routine:$extension:h3_postgis.h3_raster_summary_subpixel($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
        `(SELECT t FROM ${s}.h3_raster_summary_subpixel(${rast},8) t LIMIT 1)`,
      "routine:$extension:h3_postgis.h3_raster_summary($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)":
        `(SELECT t FROM ${s}.h3_raster_summary(${rast},8) t LIMIT 1)`,
    } as const;
    const callable = source.contract.members
      .filter((row) => row.kind === "routine" || row.kind === "operator" || row.kind === "cast")
      .map((row) => row.id)
      .toSorted();
    assert.deepEqual(Object.keys(witnesses).toSorted(), callable, "witness table must cover each SQL-callable member");
    type WitnessResult =
      | { id: string; ok: true; sql: string; type: string; value: string }
      | { id: string; ok: false; sql: string; sqlstate: string | undefined; message: string };
    const observe = async (searchPath: string) => {
    await client.query(`SET LOCAL search_path TO ${searchPath}`);
    const results: WitnessResult[] = [];
    for (const [id, expr] of Object.entries(witnesses)) {
      await client.query("SAVEPOINT w");
      try {
        const row = (await client.query(`SELECT pg_typeof(v)::text AS type, v::text AS raw FROM (SELECT ${expr} AS v) q`))
          .rows[0];
        results.push({ id, ok: true, sql: expr, type: row.type, value: row.raw });
        await client.query("RELEASE SAVEPOINT w");
      } catch (error) {
        const e = error instanceof pg.DatabaseError ? error : undefined;
        results.push({ id, ok: false, sql: expr, sqlstate: e?.code, message: error instanceof Error ? error.message : String(error) });
        await client.query("ROLLBACK TO SAVEPOINT w");
      }
    }
    return { searchPath, ok: results.filter((row) => row.ok).length, results };
    };
    // h3_postgis 4.2.3 SQL bodies reference h3/PostGIS/own names unqualified, so native results depend on search_path.
    const isolated = await observe("pg_catalog");
    const dependencyPath = await observe(`${s}, ${h}, ${p}, pg_catalog`);
    const report = { image, identity, isolated, dependencyPath, emptyIndexGraph: identity.opclasses === 0, observedContract: observed.contract };
    await writeFile(out, `${JSON.stringify(report, null, 2)}\n`);
    assert.equal(identity.expectedDigest, identity.observedDigest);
    assert.equal(identity.exactContract, true);
    assert.equal(identity.opclasses, 0);
    console.log(JSON.stringify(identity, null, 2));
  } finally {
    await client.end();
  }
} finally {
  execFileSync("docker", ["rm", "-f", container]);
}
