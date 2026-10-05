// Native postgis_raster 3.6.4 oracle: catalog graph, same-schema install, and I/O.
// Usage: bun packages/e2e/scripts/postgis-raster-native-characterization.ts <image> <out.json>
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import pg from "pg";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import source from "../../../apps/loom/src/tooling/extensions/manifests/postgis_raster.json";

const [image, out] = process.argv.slice(2);
assert(image && out, "usage: <image> <out.json>");
assert.equal(source.digest, "8f7cd8fe4d832fcc153344cc70b5693f79fa29acb1a6b7f97c0c3de31943def2");
assert.equal(source.contract.members.length, 583);

const password = "raster-local";
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
    const spatial = pg.escapeIdentifier("spatial 地");
    await client.query(
      `CREATE SCHEMA ${spatial}; CREATE EXTENSION postgis WITH SCHEMA ${spatial} VERSION '3.6.4'; CREATE EXTENSION postgis_raster WITH SCHEMA ${spatial} VERSION '3.6.4'`,
    );
    const version = (
      await client.query(
        `SELECT current_setting('server_version_num') major, ${spatial}.postgis_raster_lib_version() version, ${spatial}.postgis_raster_scripts_installed() scripts, ${spatial}.postgis_gdal_version() gdal, (SELECT extversion FROM pg_extension WHERE extname='postgis_raster') extversion`,
      )
    ).rows[0];
    assert.equal(Math.floor(Number(version.major) / 10000), 18);
    assert.equal(version.extversion, "3.6.4");
    assert.match(String(version.version), /^3\.6\.4(?:\s|$)/);
    let recapture:
      | { status: "matched"; digest: string; members: number }
      | { status: "blocked"; error: string } = { status: "blocked", error: "not attempted" };
    try {
      const observed = await captureExtensionContract(client, {
        name: "postgis_raster",
        provider: "neon",
        fixture: "owned-local-pg18-postgis_raster-3.6.4",
      });
      recapture = { status: "matched", digest: observed.digest, members: observed.contract.members.length };
      await writeFile("/tmp/loom-postgis-raster-observed-manifest.json", JSON.stringify(observed, null, 2));
    } catch (error) {
      recapture = { status: "blocked", error: error instanceof Error ? error.message : String(error) };
    }
    const owned = (
      await client.query(
        `SELECT pg_describe_object(d.classid,d.objid,d.objsubid) AS identity, d.classid::regclass::text AS class, d.objsubid
         FROM pg_depend d JOIN pg_extension e ON e.oid=d.refobjid
         WHERE e.extname='postgis_raster' AND d.refclassid='pg_extension'::regclass AND d.deptype='e'
         ORDER BY 1`,
      )
    ).rows as Array<{ identity: string; class: string; objsubid: number }>;
    const expectedNames = new Set(source.contract.members.filter((member) => member.kind === "routine").map((member) => member.name));
    const installedRoutines = (
      await client.query(
        `SELECT p.proname AS name FROM pg_proc p
         JOIN pg_depend d ON d.objid=p.oid AND d.deptype='e'
         JOIN pg_extension e ON e.oid=d.refobjid
         WHERE e.extname='postgis_raster'`,
      )
    ).rows.map((row) => row.name as string);
    const missingRoutines = [...expectedNames].filter((name) => !installedRoutines.includes(name)).sort();
    assert.equal(missingRoutines.length, 0);
    const graph = (
      await client.query(
        `SELECT
          (SELECT count(*)::int FROM pg_proc JOIN pg_depend d ON d.objid=pg_proc.oid AND d.deptype='e' JOIN pg_extension e ON e.oid=d.refobjid WHERE e.extname='postgis_raster') routines,
          (SELECT count(*)::int FROM pg_operator JOIN pg_depend d ON d.objid=pg_operator.oid AND d.deptype='e' JOIN pg_extension e ON e.oid=d.refobjid WHERE e.extname='postgis_raster') operators,
          (SELECT count(*)::int FROM pg_type JOIN pg_depend d ON d.objid=pg_type.oid AND d.deptype='e' JOIN pg_extension e ON e.oid=d.refobjid WHERE e.extname='postgis_raster') types,
          (SELECT count(*)::int FROM pg_cast JOIN pg_depend d ON d.objid=pg_cast.oid AND d.deptype='e' JOIN pg_extension e ON e.oid=d.refobjid WHERE e.extname='postgis_raster') casts,
          (SELECT json_agg(json_build_object('name', opcname, 'am', amname, 'default', opcdefault) ORDER BY opcname)
             FROM pg_opclass JOIN pg_am ON pg_am.oid=opcmethod
             JOIN pg_depend d ON d.objid=pg_opclass.oid AND d.deptype='e'
             JOIN pg_extension e ON e.oid=d.refobjid WHERE e.extname='postgis_raster') opclass_rows,
          (SELECT json_agg(json_build_object('schema', n.nspname, 'name', c.relname, 'kind', c.relkind) ORDER BY c.relname)
             FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
             JOIN pg_depend d ON d.objid=c.oid AND d.deptype='e'
             JOIN pg_extension e ON e.oid=d.refobjid WHERE e.extname='postgis_raster' AND c.relkind IN ('c','v')) relations`,
      )
    ).rows[0];
    const native = (
      await client.query(
        `SELECT
          ${spatial}.st_makeemptyraster(2,3,10,20,1,-1,0,0,4326)::text empty_hex,
          ${spatial}.st_ashexwkb(${spatial}.st_makeemptyraster(2,3,10,20,1,-1,0,0,4326)) ashex,
          ${spatial}.st_width(${spatial}.st_makeemptyraster(2,3,10,20,1,-1,0,0,4326)) width,
          ${spatial}.st_height(${spatial}.st_makeemptyraster(2,3,10,20,1,-1,0,0,4326)) height,
          ${spatial}.st_srid(${spatial}.st_makeemptyraster(2,3,10,20,1,-1,0,0,4326)) srid,
          ${spatial}.st_numbands(${spatial}.st_makeemptyraster(2,3,10,20,1,-1,0,0,4326)) bands,
          ${spatial}.st_scalex(${spatial}.st_makeemptyraster(2,3,10,20,1,-1,0,0,4326)) scalex,
          ${spatial}.st_scaley(${spatial}.st_makeemptyraster(2,3,10,20,1,-1,0,0,4326)) scaley,
          ${spatial}.st_upperleftx(${spatial}.st_makeemptyraster(2,3,10,20,1,-1,0,0,4326)) ulx,
          ${spatial}.st_upperlefty(${spatial}.st_makeemptyraster(2,3,10,20,1,-1,0,0,4326)) uly,
          ${spatial}.st_metadata(${spatial}.st_addband(${spatial}.st_makeemptyraster(2,3,10,20,1,-1,0,0,4326),'8BUI'::text,7::float8,0::float8)) metadata,
          ${spatial}.st_value(${spatial}.st_addband(${spatial}.st_makeemptyraster(2,3,10,20,1,-1,0,0,4326),'8BUI'::text,7::float8,0::float8),1,1) pixel,
          ${spatial}.st_asewkt(${spatial}.st_envelope(${spatial}.st_makeemptyraster(2,3,10,20,1,-1,0,0,4326))) envelope,
          (SELECT json_agg(column_name ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='spatial 地' AND table_name='raster_columns') raster_columns,
          (SELECT json_agg(column_name ORDER BY ordinal_position) FROM information_schema.columns WHERE table_schema='spatial 地' AND table_name='raster_overviews') raster_overviews`,
      )
    ).rows[0];
    assert.equal(native.width, 2);
    assert.equal(native.height, 3);
    assert.equal(native.srid, 4326);
    assert.equal(native.bands, 0);
    assert.equal(Number(native.pixel), 7);
    const identity = {
      expectedDigest: source.digest,
      expectedMembers: 583,
      recapture,
      version,
      schemas: { postgis: "spatial 地", raster: "spatial 地", sameSchemaRequired: true },
      missingRoutines,
      ownedDirect: owned.length,
    };
    const receipt = { image, identity, graph, native, owned };
    await writeFile(out, JSON.stringify(receipt, null, 2));
    console.log(JSON.stringify({ identity, graph }, null, 2));
  } finally {
    await client.end();
  }
} finally {
  execFileSync("docker", ["rm", "-f", container]);
}
