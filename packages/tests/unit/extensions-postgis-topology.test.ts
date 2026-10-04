import { expect, test } from "vite-plus/test";
import * as v from "valibot";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createPostgisTopology_3_6_4 } from "../../../apps/loom/src/core/extensions/adapters/postgis-topology";
import { postgisTopologyAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/postgis-topology";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis_topology.json";
import core from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { extensionValueParser } from "../../../apps/loom/src/core/extensions/values";

const descriptor = {
  name: "postgis_topology",
  version: "3.6.4",
  schema: "topology",
  apiSupport: { status: "verified", digest: manifest.digest },
} as const;
const postgis = {
  name: "postgis",
  version: "3.6.4",
  schema: 'spatial"日本',
  apiSupport: { status: "verified", digest: core.digest },
} as const;

test("all 191 captured members have exactly one authored disposition", () => {
  expect(postgisTopologyAnnotations.map((member) => member.id).sort()).toEqual(
    manifest.contract.members.map((member) => member.id).sort(),
  );
  expect(postgisTopologyAnnotations.every((member) => member.semantics.providerAcceptance === "pending")).toBe(true);
});

test("topology composites, domains and arrays preserve bigint IDs, bounds and NULL attributes", () => {
  const api = createPostgisTopology_3_6_4(descriptor, postgis);
  const tg = api.codecs.topogeometry.decode("(1,2,9223372036854775807,3)");
  expect(tg).toEqual({ topology_id: 1, layer_id: 2, id: 9223372036854775807n, type: 3 });
  expect(api.codecs.topogeometry.decode(api.codecs.topogeometry.encode(tg))).toEqual(tg);
  expect(api.codecs.topology.decode("(,,,,,)")).toEqual({
    id: null,
    name: null,
    srid: null,
    precision: null,
    hasz: null,
    useslargeids: null,
  });
  const elements = api.codecs.topoelementarray.decode("[0:1][1:2]={{9223372036854775807,3},{-9223372036854775808,2}}");
  expect(elements.dimensions).toEqual([
    { lowerBound: 0, length: 2 },
    { lowerBound: 1, length: 2 },
  ]);
  expect(api.codecs.topoelementarray.decode(api.codecs.topoelementarray.encode(elements))).toEqual(elements);
  expect(api.codecs._topogeometry.decode('{"(1,2,9223372036854775807,3)",NULL}').values).toEqual([tg, null]);
});

test("full query composition excludes graph mutations and qualifies the dependency geometry schema", () => {
  const api = createPostgisTopology_3_6_4(descriptor, postgis);
  const expression = api.getnodebypoint("some topology", api.geometry.ewkt("POINT(1 2)"), 0);
  const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(expression);
  expect(compiled.sql).toContain('"topology"."getnodebypoint"');
  expect(compiled.sql).toContain('"spatial""日本"."geometry"');
  expect(compiled.params).toEqual(["some topology", "POINT(1 2)", 0]);
  expect(extensionExpressionContract(expression)?.observability).toBe("external");
  expect("createtopology" in api.sql.functions).toBe(false);
  expect("topogeo_addpoint" in api.sql.functions).toBe(false);
  const aggregate = extensionSqlDialect(nodePgCodecs).sqlToQuery(
    api.topoelementarray_agg.over({}, api.codecs.topoelement.decode("{7,1}")),
  );
  expect(aggregate.sql).toContain("over ()");
  const rows = api.sql.rows["routine:$extension:postgis_topology.getnodeedges(pg_catalog.varchar,pg_catalog.int8)"](
    "e",
    "some topology",
    1n,
  );
  expect(
    extensionSqlDialect(nodePgCodecs).sqlToQuery(sql`select ${rows.columns.edge} from ${rows.from}`).sql,
  ).toContain('as "e"("sequence", "edge")');
});

test("only the exact selected contract and fixed topology schema are accepted", () => {
  expect(() =>
    createPostgisTopology_3_6_4({ ...descriptor, apiSupport: { status: "verified", digest: "wrong" } }, postgis),
  ).toThrow();
  expect(() => createPostgisTopology_3_6_4({ ...descriptor, schema: "other" }, postgis)).toThrow();
  expect(() =>
    createPostgisTopology_3_6_4(descriptor, { ...postgis, apiSupport: { status: "verified", digest: "wrong" } }),
  ).toThrow();
});

test("standalone topology composite fields keep native nonfinite precision in portable schemas", () => {
  const api = createPostgisTopology_3_6_4(descriptor, postgis);
  const row = api.codecs.topology.decode("(1,graph,4326,NaN,f,t)");
  expect(row.precision).toEqual({ nonfinite: "NaN" });
  const parse = extensionValueParser(api.fields.topology().metadata.extension!.value);
  expect(v.parse(parse, row)).toEqual(row);
});
