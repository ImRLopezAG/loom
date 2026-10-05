import assert from "node:assert/strict";
import { writeFileSync } from "node:fs";
import pg from "pg";
import type { SQL } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createPostgisSfcgal_3_6_4 } from "../../../apps/loom/src/core/extensions/adapters/postgis-sfcgal";
import { geometryEwkt } from "../../../apps/loom/src/core/extensions/adapters/postgis-codecs";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis_sfcgal.json";
import postgisManifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json";

// Owned disposable oracle: loom-postgis-sfcgal-3.6.4-pg18:local (postgis-sfcgal-native.Dockerfile).
const url = process.env.LOOM_SFCGAL_URL ?? "postgres://postgres@127.0.0.1:55491/postgres";
const output = process.env.LOOM_SFCGAL_OUTPUT ?? "/tmp/loom-postgis-sfcgal-native-characterization.json";
const schema = 'sf"cgal日本';
const postgisSchema = "Spatial日本";
const client = new pg.Client({ connectionString: url });
await client.connect();
const ns = pg.escapeIdentifier(schema);
const gns = pg.escapeIdentifier(postgisSchema);
const dialect = extensionSqlDialect(nodePgCodecs);
try {
  await client.query(`DROP EXTENSION IF EXISTS postgis_sfcgal; DROP EXTENSION IF EXISTS postgis; DROP SCHEMA IF EXISTS ${ns}; DROP SCHEMA IF EXISTS ${gns}`);
  await client.query(`CREATE SCHEMA ${gns}; CREATE SCHEMA ${ns}; CREATE EXTENSION postgis WITH SCHEMA ${gns} VERSION '3.6.4'; CREATE EXTENSION postgis_sfcgal WITH SCHEMA ${ns} VERSION '3.6.4'`);
  const observed = await captureExtensionContract(client, { name: "postgis_sfcgal", provider: "neon", fixture: "owned-local-pg18-postgis_sfcgal-3.6.4" });
  const identity = {
    expectedDigest: manifest.digest,
    observedDigest: observed.digest,
    expectedMembers: manifest.contract.members.length,
    observedMembers: observed.contract.members.length,
    exactContract: JSON.stringify(observed.contract) === JSON.stringify(manifest.contract),
    library: (await client.query(`SELECT ${ns}.postgis_sfcgal_version() v, ${gns}.postgis_lib_version() p, current_setting('server_version_num') s`)).rows[0],
  };
  writeFileSync("/tmp/loom-postgis-sfcgal-observed-manifest.json", JSON.stringify(observed, null, 2));
  assert.equal(identity.observedDigest, identity.expectedDigest, "postgis_sfcgal 3.6.4 native catalog digest drifted");
  assert.equal(identity.exactContract, true);
  assert.equal(identity.observedMembers, 76);

  const api = createPostgisSfcgal_3_6_4(
    { name: "postgis_sfcgal", version: "3.6.4", schema, apiSupport: { status: "verified", digest: manifest.digest } },
    { name: "postgis", version: "3.6.4", schema: postgisSchema, apiSupport: { status: "verified", digest: postgisManifest.digest } },
  );
  const g = geometryEwkt;
  const cube = g("SRID=0;POLYHEDRALSURFACE Z (((0 0 0,0 1 0,1 1 0,1 0 0,0 0 0)),((0 0 0,0 0 1,0 1 1,0 1 0,0 0 0)),((0 0 0,1 0 0,1 0 1,0 0 1,0 0 0)),((1 1 1,1 0 1,1 0 0,1 1 0,1 1 1)),((1 1 1,1 1 0,0 1 0,0 1 1,1 1 1)),((1 1 1,0 1 1,0 0 1,1 0 1,1 1 1)))");
  const square = g("SRID=0;POLYGON((0 0,4 0,4 4,0 4,0 0))");
  const ell = g("SRID=0;POLYGON((0 0,4 0,4 1,1 1,1 4,0 4,0 0))");
  const shifted = g("SRID=0;POLYGON((2 2,6 2,6 6,2 6,2 2))");
  const points = g("SRID=0;MULTIPOINT((0 0),(4 0),(0 4),(4 4),(2 2),(1 3))");
  const point = g("SRID=0;POINT(2 2)");
  const point3d = g("SRID=0;POINT Z (5 5 5)");
  const line = g("SRID=0;LINESTRING(0 0,1 1)");
  const segment = g("SRID=0;LINESTRING(1 1,2 1)");
  const mpoly = g("SRID=0;POLYGON M ((0 0 1,4 0 1,4 4 1,0 4 1,0 0 1))");
  const f = api.sql.functions;
  const calls = {
    cg_2drotate: () => f.cg_2drotate(square, Math.PI / 2, 0, 0),
    cg_3dalphawrapping: () => f.cg_3dalphawrapping(points, 50),
    cg_3darea: () => f.cg_3darea(cube),
    cg_3dbuffer: () => f.cg_3dbuffer(point3d, 1, 8, 0),
    cg_3dconvexhull: () => f.cg_3dconvexhull(points),
    cg_3ddifference: () => f.cg_3ddifference(cube, cube),
    cg_3ddistance: () => f.cg_3ddistance(cube, point3d),
    cg_3dintersection: () => f.cg_3dintersection(cube, cube),
    cg_3dintersects: () => f.cg_3dintersects(cube, point3d),
    cg_3drotate: () => f.cg_3drotate(cube, Math.PI, 0, 0, 1),
    cg_3dscale: () => f.cg_3dscale(cube, 2, 2, 2),
    cg_3dscalearoundcenter: () => f.cg_3dscalearoundcenter(cube, 2, 2, 2, 0.5, 0.5, 0.5),
    cg_3dtranslate: () => f.cg_3dtranslate(cube, 1, 2, 3),
    "cg_3dunion(1)": () => f.cg_3dunion(cube),
    "cg_3dunion(2)": () => f.cg_3dunion(cube, cube),
    "cg_alphashape": () => f.cg_alphashape(points),
    cg_approxconvexpartition: () => f.cg_approxconvexpartition(ell),
    cg_approximatemedialaxis: () => f.cg_approximatemedialaxis(ell),
    cg_area: () => f.cg_area(square),
    cg_constraineddelaunaytriangles: () => f.cg_constraineddelaunaytriangles(square),
    cg_difference: () => f.cg_difference(square, shifted),
    cg_distance: () => f.cg_distance(square, g("SRID=0;POINT(7 4)")),
    cg_extrude: () => f.cg_extrude(square, 0, 0, 1),
    cg_extrudestraightskeleton: () => f.cg_extrudestraightskeleton(square, 2),
    cg_forcelhr: () => f.cg_forcelhr(cube),
    cg_greeneapproxconvexpartition: () => f.cg_greeneapproxconvexpartition(ell),
    cg_intersection: () => f.cg_intersection(square, shifted),
    cg_intersects: () => f.cg_intersects(square, shifted),
    cg_isplanar: () => f.cg_isplanar(square),
    cg_issolid: () => f.cg_issolid(cube),
    cg_makesolid: () => f.cg_makesolid(cube),
    cg_minkowskisum: () => f.cg_minkowskisum(line, square),
    "cg_optimalalphashape": () => f.cg_optimalalphashape(points),
    cg_optimalconvexpartition: () => f.cg_optimalconvexpartition(ell),
    cg_orientation: () => f.cg_orientation(square),
    cg_rotate: () => f.cg_rotate(square, Math.PI),
    cg_rotatex: () => f.cg_rotatex(cube, Math.PI),
    cg_rotatey: () => f.cg_rotatey(cube, Math.PI),
    cg_rotatez: () => f.cg_rotatez(cube, Math.PI),
    cg_scale: () => f.cg_scale(square, 2),
    cg_simplify: () => f.cg_simplify(ell, 0.5),
    cg_straightskeleton: () => f.cg_straightskeleton(square),
    cg_straightskeletonpartition: () => f.cg_straightskeletonpartition(square, false),
    cg_tesselate: () => f.cg_tesselate(square),
    cg_translate: () => f.cg_translate(square, 1, 1),
    cg_triangulate: () => f.cg_triangulate(points),
    "cg_union(1)": () => f.cg_union(square),
    "cg_union(2)": () => f.cg_union(square, shifted),
    "cg_visibility(2)": () => f.cg_visibility(square, point),
    "cg_visibility(3)": () => f.cg_visibility(square, g("SRID=0;POINT(0 0)"), g("SRID=0;POINT(4 0)")),
    cg_volume: () => f.cg_volume(cube),
    cg_ymonotonepartition: () => f.cg_ymonotonepartition(ell),
    postgis_sfcgal_full_version: () => f.postgis_sfcgal_full_version(),
    postgis_sfcgal_noop: () => f.postgis_sfcgal_noop(cube),
    postgis_sfcgal_scripts_installed: () => f.postgis_sfcgal_scripts_installed(),
    postgis_sfcgal_version: () => f.postgis_sfcgal_version(),
    st_3darea: () => f.st_3darea(cube),
    st_3dconvexhull: () => f.st_3dconvexhull(points),
    st_3ddifference: () => f.st_3ddifference(cube, cube),
    st_3dintersection: () => f.st_3dintersection(cube, cube),
    "st_3dunion(1)": () => f.st_3dunion(cube),
    "st_3dunion(2)": () => f.st_3dunion(cube, cube),
    "st_alphashape": () => f.st_alphashape(points),
    st_approximatemedialaxis: () => f.st_approximatemedialaxis(ell),
    st_constraineddelaunaytriangles: () => f.st_constraineddelaunaytriangles(square),
    st_extrude: () => f.st_extrude(square, 0, 0, 1),
    st_forcelhr: () => f.st_forcelhr(cube),
    st_isplanar: () => f.st_isplanar(square),
    st_issolid: () => f.st_issolid(cube),
    st_makesolid: () => f.st_makesolid(cube),
    st_minkowskisum: () => f.st_minkowskisum(segment, square),
    "st_optimalalphashape": () => f.st_optimalalphashape(points),
    st_orientation: () => f.st_orientation(ell),
    st_straightskeleton: () => f.st_straightskeleton(mpoly),
    st_tesselate: () => f.st_tesselate(square),
    st_volume: () => f.st_volume(cube),
  } satisfies Record<string, () => SQL>;
  type NativeValue = string | number | boolean | null;
  type NativeOutcome =
    | { readonly outcome: "value"; readonly raw: NativeValue; readonly ewkt?: string | null }
    | { readonly outcome: "native-error"; readonly code: string | undefined; readonly message: string };
  interface MemberWitness {
    readonly label: string;
    readonly codec: string;
    readonly sql: string;
    readonly params: readonly unknown[];
    readonly native: NativeOutcome;
    readonly withSearchPath?: NativeOutcome & { readonly notices: readonly string[] };
  }
  async function evaluate(query: { readonly sql: string; readonly params: unknown[] }, geometry: boolean): Promise<NativeOutcome> {
    try {
      const [row] = (await client.query<{ v: NativeValue }>(`SELECT ${query.sql} AS v`, query.params)).rows;
      assert(row);
      if (!geometry || row.v === null) return { outcome: "value", raw: row.v };
      const [text] = (await client.query<{ v: string | null }>(`SELECT ${gns}.st_asewkt($1::${gns}.geometry) v`, [row.v])).rows;
      return { outcome: "value", raw: row.v, ewkt: text?.v ?? null };
    } catch (error) {
      if (!(error instanceof pg.DatabaseError)) throw error;
      return { outcome: "native-error", code: error.code, message: error.message };
    }
  }
  const members = new Map<string, MemberWitness>();
  for (const [label, call] of Object.entries(calls)) {
    const expression = call();
    const contract = extensionExpressionContract(expression);
    assert(contract, label);
    assert(!members.has(contract.member), `duplicate member ${contract.member}`);
    const query = dialect.sqlToQuery(expression);
    const geometry = contract.codec.startsWith("postgis:");
    const native = await evaluate(query, geometry);
    const witness = { label, codec: contract.codec, sql: query.sql, params: query.params, native };
    if (native.outcome === "value" || native.code !== "42883") {
      members.set(contract.member, witness);
      continue;
    }
    // Deprecated ST_* SQL wrappers call _postgis_deprecate and CG_* unqualified; witness the search_path they need.
    const notices: string[] = [];
    const listener = (notice: { readonly severity: string | undefined; readonly message: string | undefined }) => {
      notices.push(`${notice.severity}: ${notice.message}`);
    };
    client.on("notice", listener);
    await client.query("BEGIN");
    try {
      await client.query(`SET LOCAL client_min_messages = debug1; SET LOCAL search_path = ${gns}, ${ns}`);
      members.set(contract.member, { ...witness, withSearchPath: { ...(await evaluate(query, geometry)), notices } });
    } finally {
      await client.query("ROLLBACK");
      client.off("notice", listener);
    }
  }
  assert.deepEqual(
    [...members.keys()].toSorted(),
    manifest.contract.members.map((row) => row.id).toSorted(),
    "every manifest member is natively characterized once",
  );
  // STRICT catalog routines return NULL for NULL input through the adapter's nullable codec; witness one.
  const strict = await evaluate(dialect.sqlToQuery(f.cg_volume(null)), false);
  assert.deepEqual(strict, { outcome: "value", raw: null });
  writeFileSync(output, JSON.stringify({ identity, schema, postgisSchema, members: Object.fromEntries(members) }, null, 2));
  const summary = { value: 0, "native-error": 0, "value-with-search-path": 0 };
  for (const witness of members.values())
    if (witness.withSearchPath?.outcome === "value") summary["value-with-search-path"]++;
    else summary[witness.native.outcome]++;
  console.log(JSON.stringify({ identity, summary, output }, null, 2));
} finally {
  await client.end();
}
