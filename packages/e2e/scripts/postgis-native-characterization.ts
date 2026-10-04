import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import pg from "pg";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import source from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json";
const fixture = JSON.parse(await readFile("/tmp/loom-postgis-fixture.json", "utf8"));
const client = new pg.Client({ connectionString: fixture.url });
await client.connect();
const schema = "postgis日本";
const ns = pg.escapeIdentifier(schema);
try {
  await client.query(`CREATE SCHEMA ${ns}; CREATE EXTENSION postgis WITH SCHEMA ${ns} VERSION '3.6.4'`);
  const version = (
    await client.query(
      `SELECT current_setting('server_version_num') major, ${ns}.postgis_lib_version() version, ${ns}.postgis_full_version() full`,
    )
  ).rows[0];
  assert.equal(Math.floor(Number(version.major) / 10000), 18);
  assert.equal(version.version, "3.6.4");
  const observed = await captureExtensionContract(client, {
    name: "postgis",
    provider: "neon",
    fixture: "owned-local-pg18-postgis-3.6.4",
  });
  const identity = {
    expectedDigest: source.digest,
    observedDigest: observed.digest,
    expectedMembers: source.contract.members.length,
    observedMembers: observed.contract.members.length,
    exactContract: JSON.stringify(observed.contract) === JSON.stringify(source.contract),
    version,
    schema,
  };
  const native = (
    await client.query(
      `SELECT ${ns}.st_asewkt(${ns}.st_geomfromewkt('SRID=4326;POINT ZM(1 2 3 4)')) ewkt, ${ns}.st_geomfromewkt('SRID=4326;POINT ZM(1 2 3 4)')::text ewkb, encode(${ns}.st_asewkb(${ns}.st_geomfromewkt('SRID=4326;POINT ZM(1 2 3 4)'),'XDR'),'hex') xdr, ${ns}.st_distance(${ns}.st_geomfromewkt('SRID=3857;POINT(0 0)'),${ns}.st_geomfromewkt('SRID=3857;POINT(3 4)')) planar, ${ns}.st_distance(${ns}.st_geogfromtext('SRID=4326;POINT(0 0)'),${ns}.st_geogfromtext('SRID=4326;POINT(0 1)')) meters`,
    )
  ).rows[0];
  assert.equal(native.planar, 5);
  assert.equal(native.ewkt, "SRID=4326;POINT(1 2 3 4)");
  assert(native.meters > 110000 && native.meters < 111000);
  await writeFile("/tmp/loom-postgis-native-characterization.json", JSON.stringify({ identity, native }, null, 2));
  await writeFile("/tmp/loom-postgis-observed-manifest.json", JSON.stringify(observed, null, 2));
  console.log(JSON.stringify({ identity, native }, null, 2));
} finally {
  await client.end();
}
