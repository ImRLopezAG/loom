import { expect, test } from "vite-plus/test";
import {
  createPostgisGeometryCodec,
  geometryEwkb,
  geometryEwkt,
  createPostgisGeographyCodec,
  geographyEwkb,
} from "../../../apps/loom/src/core/extensions/adapters/postgis-codecs";

test("PostGIS EWKB preserves binary SRID and ZM payload across wire and parameter encoding", () => {
  const hex = "01010000e0e6100000000000000000f03f000000000000004000000000000008400000000000001040";
  const value = geometryEwkb(hex);
  expect(value).toMatchObject({ kind: "geometry", format: "ewkb", hex, srid: 4326, dimensions: "XYZM" });
  const codec = createPostgisGeometryCodec("Spatial");
  expect(codec.decode(codec.encode(value))).toEqual(value);
  expect(JSON.parse(JSON.stringify(value))).toEqual(value);
  expect(codec.encode(geometryEwkt("SRID=4326;POINT ZM (1 2 3 4)"))).toBe("SRID=4326;POINT ZM (1 2 3 4)");
  expect(createPostgisGeographyCodec("Spatial").decode(hex)).toEqual(geographyEwkb(hex));
});

import { createPostgis_3_6_4 } from "../../../apps/loom/src/core/extensions/adapters/postgis";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json";
import { postgisAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/postgis";
import { extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { sql } from "drizzle-orm";
const descriptor = {
  name: "postgis",
  version: "3.6.4",
  schema: 'Spatial"日本',
  apiSupport: { status: "verified", digest: manifest.digest },
} as const;
test("PostGIS exact callable/member identity and qualified units", () => {
  const api = createPostgis_3_6_4(descriptor);
  expect(postgisAnnotations.map((row) => row.id).sort()).toEqual(manifest.contract.members.map((row) => row.id).sort());
  const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(
    api.geometry.distance(geometryEwkt("SRID=3857;POINT(0 0)"), geometryEwkt("SRID=3857;POINT(3 4)")),
  );
  expect(query.params).toEqual(["SRID=3857;POINT(0 0)", "SRID=3857;POINT(3 4)"]);
  expect(query.sql).toContain('"Spatial""日本"."st_distance"');
  expect(() =>
    api.geometry.distance(geometryEwkt("SRID=4326;POINT(0 0)"), geometryEwkt("SRID=3857;POINT(3 4)")),
  ).toThrow();
});
test("native EWKT dimension markers may be omitted by ST_AsEWKT", () => {
  expect(geometryEwkt("SRID=4326;POINT(1 2 3 4)").dimensions).toBe("XYZM");
  expect(geometryEwkt("POINT(1 2 3)").dimensions).toBe("XYZ");
  expect(geometryEwkt("GEOMETRYCOLLECTION(POINT Z(1 2 3))").dimensions).toBe("XYZ");
});

test("all captured PostGIS scalar/array types and cache_bbox trigger retain schema identities", () => {
  const api = createPostgis_3_6_4(descriptor);
  const native = manifest.contract.members.filter((row) => row.kind === "type");
  expect(Object.keys(api.fields).sort()).toEqual(
    native
      .filter((row) => !row.element)
      .map((row) => row.name)
      .sort(),
  );
  expect(Object.keys(api.arrayFields).sort()).toEqual(
    native
      .filter((row) => row.element)
      .map((row) => row.element!.name)
      .sort(),
  );
  expect(api.triggers.cacheBbox).toBeTypeOf("function");
  expect("st_fromflatgeobuftotable" in api.sql.functions).toBe(false);
});

test("PostGIS FlatGeobuf rejects literal NULL bytes and guards SQL bytes before native invocation", () => {
  const api = createPostgis_3_6_4(descriptor);
  const member = "routine:$extension:postgis.st_fromflatgeobuf(pg_catalog.anyelement,pg_catalog.bytea)";
  const seed = sql<null>`NULL::${sql.identifier(descriptor.schema)}.geometry_dump`;
  for (const factory of [api.sql.functions.st_fromflatgeobuf, api.sql.overloads[member]]) {
    const call = factory(api.codecs.geometry_dump);
    expect(() => call(seed, null)).toThrow("PostGIS 3.6.4 ST_FromFlatGeobuf rejects NULL bytea");
    for (const payload of [sql<null>`NULL::bytea`, sql<null>`${null}::bytea`, sql<null>`NULL::bytea`.as("payload")]) {
      const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(call(seed, payload));
      expect(query.sql).toContain('"pg_catalog"."decode"(coalesce("pg_catalog"."encode"(');
      expect(query.params).toContain("PostGIS 3.6.4 ST_FromFlatGeobuf rejects NULL bytea");
    }
    const valid = extensionSqlDialect(nodePgCodecs).sqlToQuery(call(seed, { hex: "666762" }));
    expect(valid.params).toEqual(["\\x666762"]);
    expect(valid.sql).toContain('"Spatial""日本"."st_fromflatgeobuf"');
    expect(valid.sql).not.toContain('"pg_catalog"."encode"');
  }
  // Other nullable PostGIS functions retain their captured NULL behavior.
  expect(extensionSqlDialect(nodePgCodecs).sqlToQuery(api.sql.functions.st_geomfromewkt(null)).params).toEqual([null]);
});
