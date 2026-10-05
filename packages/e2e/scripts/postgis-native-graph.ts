import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import pg from "pg";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json";
const fixture = JSON.parse(
  await readFile(process.env.POSTGIS_FIXTURE_PATH ?? "/tmp/loom-postgis-fixture.json", "utf8"),
);
const native = JSON.parse(await readFile("/tmp/loom-postgis-observed-manifest.json", "utf8"));
assert.equal(native.digest, manifest.digest);
assert.deepEqual(native.contract, manifest.contract);
const client = new pg.Client({ connectionString: fixture.url });
await client.connect();
try {
  const extra = (
    await client.query(
      `WITH callbacks AS (
 SELECT 'type-analysis' role,'pg_type' owner_class,t.oid owner_oid,t.typanalyze::oid callback FROM pg_catalog.pg_type t JOIN pg_catalog.pg_namespace n ON n.oid=t.typnamespace WHERE n.nspname=$1 AND t.typanalyze<>0
 UNION ALL SELECT 'planner-support','pg_proc',p.oid,p.prosupport::oid FROM pg_catalog.pg_proc p JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname=$1 AND p.prosupport<>0
 ) SELECT c.role,c.owner_class,COALESCE(t.typname,own.proname) owner_name,owner_ns.nspname owner_namespace,
 COALESCE((SELECT jsonb_agg(jsonb_build_object('namespace',ns.nspname,'name',ty.typname) ORDER BY a.ordinality) FROM unnest(own.proargtypes) WITH ORDINALITY a(type,ordinality) JOIN pg_catalog.pg_type ty ON ty.oid=a.type JOIN pg_catalog.pg_namespace ns ON ns.oid=ty.typnamespace),'[]') owner_arguments,
 p.proname callback_name,n.nspname callback_namespace,COALESCE((SELECT jsonb_agg(jsonb_build_object('namespace',ns.nspname,'name',ty.typname) ORDER BY a.ordinality) FROM unnest(p.proargtypes) WITH ORDINALITY a(type,ordinality) JOIN pg_catalog.pg_type ty ON ty.oid=a.type JOIN pg_catalog.pg_namespace ns ON ns.oid=ty.typnamespace),'[]') callback_arguments
 FROM callbacks c JOIN pg_catalog.pg_proc p ON p.oid=c.callback JOIN pg_catalog.pg_namespace n ON n.oid=p.pronamespace
 LEFT JOIN pg_catalog.pg_type t ON c.owner_class='pg_type' AND t.oid=c.owner_oid LEFT JOIN pg_catalog.pg_proc own ON c.owner_class='pg_proc' AND own.oid=c.owner_oid JOIN pg_catalog.pg_namespace owner_ns ON owner_ns.oid=COALESCE(t.typnamespace,own.pronamespace)`,
      ["postgis日本"],
    )
  ).rows;
  const normalize = (namespace: string) => (namespace === "postgis日本" ? "$extension:postgis" : namespace);
  const routine = (namespace: string, name: string, args: readonly { namespace: string; name: string }[]) =>
    `routine:${normalize(namespace)}.${name}(${args.map((arg) => `${normalize(arg.namespace)}.${arg.name}`).join(",")})`;
  const extraEdges = extra.map((row) => ({
    owner:
      row.owner_class === "pg_type"
        ? `type:${normalize(row.owner_namespace)}.${row.owner_name}`
        : routine(row.owner_namespace, row.owner_name, row.owner_arguments),
    role: row.role,
    callback: routine(row.callback_namespace, row.callback_name, row.callback_arguments),
  }));
  await writeFile(
    `${process.env.POSTGIS_EVIDENCE_DIR ?? "/tmp"}/loom-postgis-native-extra-graph.json`,
    JSON.stringify({ digest: manifest.digest, exactNativeCapture: true, edges: extraEdges }, null, 2),
  );
  console.log(JSON.stringify({ exactNativeCapture: true, extraNativeEdges: extraEdges.length }));
} finally {
  await client.end();
}
