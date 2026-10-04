import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import pg from "pg";
import * as v from "valibot";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import source from "../../../apps/loom/src/tooling/extensions/manifests/postgis_topology.json";

const fixture = JSON.parse(await readFile("/tmp/loom-postgis-topology-fixture.json", "utf8"));
const client = new pg.Client({ connectionString: fixture.url });
await client.connect();
try {
  await client.query(
    "CREATE SCHEMA IF NOT EXISTS \"spatial日本\"; CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA \"spatial日本\" VERSION '3.6.4'; CREATE EXTENSION IF NOT EXISTS postgis_topology VERSION '3.6.4'",
  );
  await client.query('SET search_path TO topology,"spatial日本",pg_catalog');
  const version = (
    await client.query(
      "SELECT current_setting('server_version_num') major, postgis_lib_version() core, postgis_topology_scripts_installed() topology",
    )
  ).rows[0];
  assert.equal(Math.floor(Number(version.major) / 10000), 18);
  assert.equal(version.core, "3.6.4");
  assert.equal(version.topology.split(" ")[0], "3.6.4");
  const observed = await captureExtensionContract(client, {
    name: "postgis_topology",
    provider: "neon",
    fixture: "owned-local-pg18-topology-3.6.4",
  });
  const expected = new Map(source.contract.members.map((member) => [member.id, member]));
  const actual = new Map(observed.contract.members.map((member) => [member.id, member]));
  const missing = [...expected.keys()].filter((id) => !actual.has(id));
  const added = [...actual.keys()].filter((id) => !expected.has(id));
  const changed = [...expected.keys()].filter(
    (id) => actual.has(id) && JSON.stringify(expected.get(id)) !== JSON.stringify(actual.get(id)),
  );
  await client.query("BEGIN");
  const native = (
    await client.query(`SELECT '(1,2,9223372036854775807,3)'::topogeometry::text composite,
    '[1:2]={9223372036854775807,3}'::topoelement::text element,
    '[1:2][1:2]={{9223372036854775807,3},{-9223372036854775808,2}}'::topoelementarray::text elements,
    ARRAY['(1,2,9223372036854775807,3)'::topogeometry,NULL]::text composites,
    '(,,,,,)'::topology.topology::text nullable_row`)
  ).rows[0];
  const created = (await client.query("SELECT CreateTopology('owned_characterization',4326,0,false,0,true) id")).rows[0]
    .id;
  v.parse(v.number(), created);
  const node = (
    await client.query("SELECT TopoGeo_AddPoint('owned_characterization',ST_GeomFromText('POINT(1 2)',4326))::text id")
  ).rows[0].id;
  assert.equal(node, "1");
  const read = (
    await client.query(
      "SELECT GetNodeByPoint('owned_characterization',ST_GeomFromText('POINT(1 2)',4326),0)::text node, FindTopology('owned_characterization'::text)::text metadata",
    )
  ).rows[0];
  assert.equal(read.node, node);
  const validation = (await client.query("SELECT * FROM ValidateTopology('owned_characterization')")).rows;
  assert.deepEqual(validation, []);
  await client.query("ROLLBACK");
  const report = {
    version,
    identity: {
      expectedDigest: source.digest,
      observedDigest: observed.digest,
      expectedMembers: expected.size,
      observedMembers: actual.size,
      exactContract: source.digest === observed.digest,
      missing,
      added,
      changed,
    },
    native,
    read,
    validation,
  };
  await writeFile("/tmp/loom-postgis-topology-characterization.json", JSON.stringify(report, null, 2));
  await writeFile("/tmp/loom-postgis-topology-observed-manifest.json", JSON.stringify(observed, null, 2));
  console.log(JSON.stringify(report, null, 2));
} finally {
  await client.end();
}
