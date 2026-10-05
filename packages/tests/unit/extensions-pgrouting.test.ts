import { expect, test } from "vite-plus/test";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createPgrouting_3_8_0 } from "../../../apps/loom/src/core/extensions/adapters/pgrouting";
import { pgroutingAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pgrouting";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/pgrouting.json";
import postgisManifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json";
import { extensionSqlDialect, extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import type { NestedQuery } from "../../../apps/loom/src/core/extensions/nested-query";
import { sql } from "drizzle-orm";
import type { Geometry } from "../../../apps/loom/src/core/extensions/adapters/postgis-codecs";

const descriptor = {
  name: "pgrouting",
  version: "3.8.0",
  schema: 'route"日本',
  apiSupport: { status: "verified", digest: manifest.digest },
} as const;
const postgis = {
  name: "postgis",
  version: "3.6.4",
  schema: 'spatial"日本',
  apiSupport: { status: "verified", digest: postgisManifest.digest },
} as const;

test("pgRouting pins all 354 exact members and keeps native/internal/tooling dispositions distinct", () => {
  const api = createPgrouting_3_8_0(descriptor, postgis);
  expect(manifest.digest).toBe("853d0e847c740dc95f877297db1c3515a4ebac8f454a85b266ba20be7324ae4c");
  expect(manifest.contract.members).toHaveLength(354);
  expect(pgroutingAnnotations.map((row) => row.id).sort()).toEqual(
    manifest.contract.members.map((row) => row.id).sort(),
  );
  expect(Object.keys(api.sql.overloads).sort()).toEqual(
    pgroutingAnnotations
      .filter((row) => row.disposition === "query")
      .map((row) => row.id)
      .sort(),
  );
  expect(Object.keys(api.sql.types)).toEqual([]);
});

test("pgRouting requires its exact descriptor and exact PostGIS dependency", () => {
  // SAFETY: the intentionally invalid literal exercises runtime validation against a statically excluded version.
  expect(() => createPgrouting_3_8_0({ ...descriptor, version: "3.7.0" } as never, postgis)).toThrow(/exact/);
  expect(() =>
    createPgrouting_3_8_0({ ...descriptor, apiSupport: { status: "verified", digest: "wrong" } }, postgis),
  ).toThrow(/exact/);
  // SAFETY: the intentionally invalid dependency literal must also fail runtime validation.
  expect(() => createPgrouting_3_8_0(descriptor, { ...postgis, version: "3.6.3" } as never)).toThrow(/exact/);
});

test("pgRouting uses qualified native calls and rejects unproven graph SQL", () => {
  const api = createPgrouting_3_8_0(descriptor, postgis);
  const version = api.pgrVersion();
  expect(extensionSqlDialect(nodePgCodecs).sqlToQuery(version).sql).toContain('"route""日本"."pgr_version"()');
  expect(extensionExpressionContract(version)?.member).toBe("routine:$extension:pgrouting.pgr_version()");
  // SAFETY: deliberately missing managed provenance must fail before any database call.
  const fake = {} as NestedQuery<{ id: bigint; source: bigint; target: bigint; cost: number }>;
  expect(() =>
    api.sql.overloads[
      "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"
    ](fake, 1n, 3n),
  ).toThrow(/managed provenance/);
});

test("pgRouting native integer arrays preserve exact values, NULL elements and lower bounds", () => {
  const api = createPgrouting_3_8_0(descriptor, postgis);
  const value = { dimensions: [{ lowerBound: -4, length: 3 }], values: [1, 9007199254740993n, null] };
  const encoded = api.codecs.idsArray.encode(value);
  expect(api.codecs.idsArray.decode(encoded)).toEqual({ ...value, values: [1n, 9007199254740993n, null] });
  expect(() =>
    api.codecs.idsArray.encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: [9007199254740992] }),
  ).toThrow(/exact integers/);
  expect(api.codecs.idsArray.encode(null)).toBe(null);
});

test("pgRouting rejects the confirmed unsafe alpha-shape routine before producing executable SQL", () => {
  const api = createPgrouting_3_8_0(descriptor, postgis);
  const member = "routine:$extension:pgrouting.pgr_alphashape($extension:postgis.geometry,pg_catalog.float8)";
  const geometry = sql<Geometry | null>`unexecuted_geometry_column`;
  for (const call of [api.pgrAlphashape, api.sql.functions.pgr_alphashape, api.sql.overloads[member]]) {
    expect(() => call(geometry)).toThrow(/pgRouting 3\.8\.0 pgr_alphashape.*verified native repair/);
    expect(() => call(geometry, 1)).toThrow(/verified native repair/);
    expect(() => call(null, null)).toThrow(/verified native repair/);
  }
  expect("_pgr_alphashape" in api.sql.functions).toBe(false);
});
