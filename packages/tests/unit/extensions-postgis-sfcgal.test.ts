import { expect, test } from "vite-plus/test";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createPostgisSfcgal_3_6_4 } from "../../../apps/loom/src/core/extensions/adapters/postgis-sfcgal";
import { geometryEwkt } from "../../../apps/loom/src/core/extensions/adapters/postgis-codecs";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { postgisSfcgalAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/postgis_sfcgal";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis_sfcgal.json";
import postgisManifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json";

const dialect = extensionSqlDialect(nodePgCodecs);
const descriptor = {
  name: "postgis_sfcgal",
  version: "3.6.4",
  schema: 'sf"cgal',
  apiSupport: { status: "verified", digest: manifest.digest },
} as const;
const postgis = {
  name: "postgis",
  version: "3.6.4",
  schema: "Spatial日本",
  apiSupport: { status: "verified", digest: postgisManifest.digest },
} as const;
const cube = geometryEwkt("SRID=0;POLYHEDRALSURFACE Z (((0 0 0,0 1 0,1 1 0,1 0 0,0 0 0)))");

test("postgis_sfcgal 3.6.4 pins its exact 76-member manifest", () => {
  expect(manifest.digest).toBe("a9f128c0489a24e8fa4bb0b35000570c2f8b1e6db26609863b9e4a24a1518c76");
  expect(manifest.contract.members).toHaveLength(76);
  expect(postgisSfcgalAnnotations.map((row) => row.id).sort()).toEqual(
    manifest.contract.members.map((row) => row.id).sort(),
  );
  const api = createPostgisSfcgal_3_6_4(descriptor, postgis);
  const members = new Set<string>();
  for (const call of Object.values(api.sql.functions)) for (const member of call.members) members.add(member);
  expect([...members].sort()).toEqual(manifest.contract.members.map((row) => row.id).sort());
});

test("postgis_sfcgal rejects unverified, mismatched or wrong-version descriptors", () => {
  // SAFETY: deliberately ill-typed descriptor; the runtime guard is the behavior under test.
  expect(() => createPostgisSfcgal_3_6_4({ ...descriptor, version: "3.6.3" } as never, postgis)).toThrow(/3\.6\.4/);
  expect(() =>
    createPostgisSfcgal_3_6_4({ ...descriptor, apiSupport: { status: "verified", digest: "0".repeat(64) } }, postgis),
  ).toThrow(/exact verified/);
  // SAFETY: deliberately ill-typed dependency; the runtime guard is the behavior under test.
  expect(() => createPostgisSfcgal_3_6_4(descriptor, { ...postgis, version: "3.5.0" } as never)).toThrow(/postgis 3\.6\.4/);
  expect(() =>
    createPostgisSfcgal_3_6_4(descriptor, { ...postgis, apiSupport: { status: "verified", digest: "0".repeat(64) } }),
  ).toThrow(/postgis 3\.6\.4/);
  // Native CREATE EXTENSION postgis_sfcgal rejects these characters in @extschema:postgis@ (SQLSTATE 22P02).
  for (const schema of ['a"b', "a$b", "a'b", "a\\b"])
    expect(() => createPostgisSfcgal_3_6_4(descriptor, { ...postgis, schema })).toThrow(/@extschema:postgis@/);
});

test("postgis_sfcgal compiles qualified native calls with PostGIS geometry codecs and native defaults", () => {
  const api = createPostgisSfcgal_3_6_4(descriptor, postgis);
  const volume = api.cgVolume(cube);
  expect(extensionExpressionContract(volume)).toMatchObject({
    member: "routine:$extension:postgis_sfcgal.cg_volume($extension:postgis.geometry)",
    codec: "pg:float8:1:nullable",
  });
  const query = dialect.sqlToQuery(volume);
  expect(query.sql).toContain('"sf""cgal"."cg_volume"');
  expect(query.params).toEqual([cube.text]);
  const alpha = dialect.sqlToQuery(api.cgAlphashape(cube));
  expect(alpha.sql).toContain('"sf""cgal"."cg_alphashape"');
  expect(alpha.params).toEqual([cube.text]);
  const holes = dialect.sqlToQuery(api.cgAlphashape(cube, undefined, true));
  expect(holes.sql).toContain('"allow_holes" =>');
  expect(holes.params).toEqual([cube.text, true]);
  const unionAgg = dialect.sqlToQuery(api.cgUnion(cube));
  const unionPair = dialect.sqlToQuery(api.cgUnion(cube, cube));
  expect(unionAgg.params).toHaveLength(1);
  expect(unionPair.params).toHaveLength(2);
  expect(extensionExpressionContract(api.cgVisibility(cube, cube))?.member).toBe(
    "routine:$extension:postgis_sfcgal.cg_visibility($extension:postgis.geometry,$extension:postgis.geometry)",
  );
  expect(extensionExpressionContract(api.cgVisibility(cube, cube, cube))?.member).toContain("geometry,$extension:postgis.geometry,$extension:postgis.geometry)");
  expect(extensionExpressionContract(api.postgisSfcgalVersion())?.codec).toBe("pg:text:1:nullable");
  expect(extensionExpressionContract(api.cgIssolid(cube))?.codec).toBe("pg:bool:1:nullable");
  expect(() => api.cgVolume(geometryEwkt("SRID=0;POINT(0 0)"))).not.toThrow();
  // SAFETY: deliberately ill-typed geography value; the geometry codec's runtime rejection is under test.
  expect(() => api.cgVolume({ kind: "geography" } as never)).toThrow();
});

test("postgis_sfcgal annotation codecs match the adapter's result codecs", () => {
  const api = createPostgisSfcgal_3_6_4(descriptor, postgis);
  const byId = new Map(postgisSfcgalAnnotations.map((row) => [row.id, row.semantics.codec]));
  expect(extensionExpressionContract(api.cg3dintersection(cube, cube))?.codec).toBe(
    byId.get("routine:$extension:postgis_sfcgal.cg_3dintersection($extension:postgis.geometry,$extension:postgis.geometry)"),
  );
  expect(extensionExpressionContract(api.cgOrientation(cube))?.codec).toBe(
    byId.get("routine:$extension:postgis_sfcgal.cg_orientation($extension:postgis.geometry)"),
  );
});
