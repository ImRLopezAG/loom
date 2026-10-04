import { expect, test } from "bun:test";
import pg from "pg";
import * as v from "valibot";
import { defineRelations, sql, SQL, eq } from "drizzle-orm";
import { bigint } from "drizzle-orm/pg-core";
import { getColumnFromDecoder } from "drizzle-orm/utils";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { Field } from "../../../apps/loom/src/core/schema/fields";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { createSearchValidators } from "../../../apps/loom/src/core/search/contract";
import { nestedQuery } from "../../../apps/loom/src/core/extensions/nested-query";
import { withNestedQueryInvocation } from "../../../apps/loom/src/core/extensions/nested-query-private";
import { createPgrouting_3_8_0 } from "../../../apps/loom/src/core/extensions/adapters/pgrouting";
import { createPostgis_3_6_4 } from "../../../apps/loom/src/core/extensions/adapters/postgis";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import {
  extensionExpressionContract,
  extensionSqlDialect,
  checkCompiledExtensionQuery,
  withExtensionSqlExecution,
} from "../../../apps/loom/src/core/extensions/sql";
import { withPgroutingOperations } from "../../../apps/loom/src/tooling/extensions/operations/pgrouting";
import { writeFile } from "node:fs/promises";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/pgrouting.json";
import postgisManifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json";
import nativeCases from "../fixtures/pgrouting-native-cases.json";

const descriptor = {
  name: "pgrouting",
  version: "3.8.0",
  schema: "routing",
  apiSupport: { status: "verified", digest: manifest.digest },
} as const;
const postgis = {
  name: "postgis",
  version: "3.6.4",
  schema: "spatial",
  apiSupport: { status: "verified", digest: postgisManifest.digest },
} as const;
// A native PG array source column, not an extension-owned schema type. The fixture metadata
// uses JSON's non-filterable projection category; its native builder still owns bigint[].
const idsField = () =>
  new Field((name: string) => bigint(name, { mode: "bigint" }).array(), {
    kind: "json",
    notNull: false,
    unique: false,
  });
const spatial = createPostgis_3_6_4(postgis);
const schema = defineSchema(
  (s) => ({
    source0: {
      id: s.bigint().notNull(),
      source: s.bigint().notNull(),
      target: s.bigint().notNull(),
      cost: s.numeric().notNull(),
      reverse_cost: s.numeric().notNull(),
      capacity: s.bigint().notNull(),
      reverse_capacity: s.bigint().notNull(),
      x1: s.numeric().notNull(),
      y1: s.numeric().notNull(),
      x2: s.numeric().notNull(),
      y2: s.numeric().notNull(),
      geom: spatial.geometry.field().notNull(),
    },
    source1: { source: s.bigint().notNull(), target: s.bigint().notNull() },
    source2: { source: s.bigint().notNull(), target: s.bigint().notNull() },
    source3: {
      id: s.bigint().notNull(),
      source: s.bigint().notNull(),
      target: s.bigint().notNull(),
      cost: s.numeric().notNull(),
    },
    source4: {
      id: s.bigint().notNull(),
      source: s.bigint().notNull(),
      target: s.bigint().notNull(),
      cost: s.numeric().notNull(),
      reverse_cost: s.numeric().notNull(),
      capacity: s.bigint().notNull(),
      reverse_capacity: s.bigint().notNull(),
      x1: s.numeric().notNull(),
      y1: s.numeric().notNull(),
      x2: s.numeric().notNull(),
      y2: s.numeric().notNull(),
      geom: spatial.geometry.field().notNull(),
    },
    source5: { id: s.bigint().notNull(), in_edges: idsField(), out_edges: idsField() },
    source6: { id: s.bigint().notNull(), geom: spatial.geometry.field().notNull() },
    source7: {
      id: s.bigint().notNull(),
      demand: s.numeric().notNull(),
      p_node_id: s.bigint().notNull(),
      p_x: s.numeric().notNull(),
      p_y: s.numeric().notNull(),
      p_open: s.numeric().notNull(),
      p_close: s.numeric().notNull(),
      p_service: s.numeric().notNull(),
      d_node_id: s.bigint().notNull(),
      d_x: s.numeric().notNull(),
      d_y: s.numeric().notNull(),
      d_open: s.numeric().notNull(),
      d_close: s.numeric().notNull(),
      d_service: s.numeric().notNull(),
    },
    source8: {
      id: s.bigint().notNull(),
      capacity: s.numeric().notNull(),
      start_node_id: s.bigint().notNull(),
      start_x: s.numeric().notNull(),
      start_y: s.numeric().notNull(),
      start_open: s.numeric().notNull(),
      start_close: s.numeric().notNull(),
    },
    source9: { start_vid: s.bigint().notNull(), end_vid: s.bigint().notNull(), agg_cost: s.numeric().notNull() },
    source10: { cost: s.numeric().notNull(), path: idsField() },
    source11: {
      pid: s.bigint().notNull(),
      edge_id: s.bigint().notNull(),
      fraction: s.numeric().notNull(),
      side: s.text().notNull(),
    },
    source12: {
      id: s.integer().notNull(),
      source: s.integer().notNull(),
      target: s.integer().notNull(),
      cost: s.numeric().notNull(),
      reverse_cost: s.numeric().notNull(),
      x1: s.numeric().notNull(),
      y1: s.numeric().notNull(),
      x2: s.numeric().notNull(),
      y2: s.numeric().notNull(),
    },
    source13: { id: s.bigint().notNull(), x: s.numeric().notNull(), y: s.numeric().notNull() },
    source14: {
      id: s.bigint().notNull(),
      x: s.numeric().notNull(),
      y: s.numeric().notNull(),
      open_time: s.numeric().notNull(),
      close_time: s.numeric().notNull(),
      service_time: s.numeric().notNull(),
      order_unit: s.numeric().notNull(),
    },
    source15: { vehicle_id: s.bigint().notNull(), capacity: s.numeric().notNull() },
    source16: { src_id: s.bigint().notNull(), dest_id: s.bigint().notNull(), traveltime: s.numeric().notNull() },
    source17: {
      id: s.bigint().notNull(),
      source: s.bigint().notNull(),
      target: s.bigint().notNull(),
      cost: s.numeric().notNull(),
      capacity: s.bigint().notNull(),
    },
  }),
  { namespace: "fixture" },
);
const graph = defineRelations(schema.tables);
const validators = createSearchValidators(schema, graph);

const source0 = validators.source0.search({
  columns: [
    "id",
    "source",
    "target",
    "cost",
    "reverse_cost",
    "capacity",
    "reverse_capacity",
    "x1",
    "y1",
    "x2",
    "y2",
    "geom",
  ],
  filter: [],
  order: [],
  scope: "public",
});
const source1 = validators.source1.search({ columns: ["source", "target"], filter: [], order: [], scope: "public" });
const source2 = validators.source2.search({ columns: ["source", "target"], filter: [], order: [], scope: "public" });
const source3 = validators.source3.search({
  columns: ["id", "source", "target", "cost"],
  filter: [],
  order: [],
  scope: "public",
});
const source4 = validators.source4.search({
  columns: [
    "id",
    "source",
    "target",
    "cost",
    "reverse_cost",
    "capacity",
    "reverse_capacity",
    "x1",
    "y1",
    "x2",
    "y2",
    "geom",
  ],
  filter: [],
  order: [],
  scope: "public",
});
const source5 = validators.source5.search({
  columns: ["id", "in_edges", "out_edges"],
  filter: [],
  order: [],
  scope: "public",
});
const source6 = validators.source6.search({ columns: ["id", "geom"], filter: [], order: [], scope: "public" });
const source7 = validators.source7.search({
  columns: [
    "id",
    "demand",
    "p_node_id",
    "p_x",
    "p_y",
    "p_open",
    "p_close",
    "p_service",
    "d_node_id",
    "d_x",
    "d_y",
    "d_open",
    "d_close",
    "d_service",
  ],
  filter: [],
  order: [],
  scope: "public",
});
const source8 = validators.source8.search({
  columns: ["id", "capacity", "start_node_id", "start_x", "start_y", "start_open", "start_close"],
  filter: [],
  order: [],
  scope: "public",
});
const source9 = validators.source9.search({
  columns: ["start_vid", "end_vid", "agg_cost"],
  filter: [],
  order: [],
  scope: "public",
});
const source10 = validators.source10.search({ columns: ["cost", "path"], filter: [], order: [], scope: "public" });
const source11 = validators.source11.search({
  columns: ["pid", "edge_id", "fraction", "side"],
  filter: [],
  order: [],
  scope: "public",
});
const source12 = validators.source12.search({
  columns: ["id", "source", "target", "cost", "reverse_cost", "x1", "y1", "x2", "y2"],
  filter: [],
  order: [],
  scope: "public",
});
const source13 = validators.source13.search({ columns: ["id", "x", "y"], filter: [], order: [], scope: "public" });
const source14 = validators.source14.search({
  columns: ["id", "x", "y", "open_time", "close_time", "service_time", "order_unit"],
  filter: [],
  order: [],
  scope: "public",
});
const source15 = validators.source15.search({
  columns: ["vehicle_id", "capacity"],
  filter: [],
  order: [],
  scope: "public",
});
const source16 = validators.source16.search({
  columns: ["src_id", "dest_id", "traveltime"],
  filter: [],
  order: [],
  scope: "public",
});
const source17 = validators.source17.search({
  columns: ["id", "source", "target", "cost", "capacity"],
  filter: [],
  order: [],
  scope: "public",
});
const sources = {
  "SELECT * FROM fixture.connected": () =>
    nestedQuery(source17, { columns: { id: true, source: true, target: true, cost: true, capacity: true } }),
  "SELECT * FROM fixture.edges WHERE cost>=0": () =>
    nestedQuery(source0, {
      columns: {
        id: true,
        source: true,
        target: true,
        cost: true,
        reverse_cost: true,
        capacity: true,
        reverse_capacity: true,
        x1: true,
        y1: true,
        x2: true,
        y2: true,
        geom: true,
      },
    }),
  "SELECT source,target FROM fixture.combinations": () =>
    nestedQuery(source1, { columns: { source: true, target: true } }),
  "SELECT 1::bigint source,3::bigint target": () => nestedQuery(source2, { columns: { source: true, target: true } }),
  "SELECT id,source,target,cost FROM fixture.edges WHERE cost>=0 AND source<target": () =>
    nestedQuery(source3, { columns: { id: true, source: true, target: true, cost: true } }),
  "SELECT * FROM fixture.edges WHERE cost>=0 AND source<target": () =>
    nestedQuery(source4, {
      columns: {
        id: true,
        source: true,
        target: true,
        cost: true,
        reverse_cost: true,
        capacity: true,
        reverse_capacity: true,
        x1: true,
        y1: true,
        x2: true,
        y2: true,
        geom: true,
      },
    }),
  "SELECT id,in_edges,out_edges FROM fixture.vertices": () =>
    nestedQuery(source5, { columns: { id: true, in_edges: true, out_edges: true } }),
  "SELECT id,geom FROM fixture.edges": () => nestedQuery(source6, { columns: { id: true, geom: true } }),
  "SELECT * FROM fixture.orders": () =>
    nestedQuery(source7, {
      columns: {
        id: true,
        demand: true,
        p_node_id: true,
        p_x: true,
        p_y: true,
        p_open: true,
        p_close: true,
        p_service: true,
        d_node_id: true,
        d_x: true,
        d_y: true,
        d_open: true,
        d_close: true,
        d_service: true,
      },
    }),
  "SELECT * FROM fixture.vehicles": () =>
    nestedQuery(source8, {
      columns: {
        id: true,
        capacity: true,
        start_node_id: true,
        start_x: true,
        start_y: true,
        start_open: true,
        start_close: true,
      },
    }),
  "SELECT a.id AS start_vid,b.id AS end_vid,spatial.ST_Distance(a.geom,b.geom)::float8 AS agg_cost FROM fixture.vertices a CROSS JOIN fixture.vertices b":
    () => nestedQuery(source9, { columns: { start_vid: true, end_vid: true, agg_cost: true } }),
  "SELECT cost,path FROM fixture.restrictions": () => nestedQuery(source10, { columns: { cost: true, path: true } }),
  "SELECT pid,edge_id,fraction,side FROM fixture.pointsofinterest": () =>
    nestedQuery(source11, { columns: { pid: true, edge_id: true, fraction: true, side: true } }),
  "SELECT id::int4,source::int4,target::int4,cost,reverse_cost,x1,y1,x2,y2 FROM fixture.edges WHERE cost>=0": () =>
    nestedQuery(source12, {
      columns: {
        id: true,
        source: true,
        target: true,
        cost: true,
        reverse_cost: true,
        x1: true,
        y1: true,
        x2: true,
        y2: true,
      },
    }),
  "SELECT id,x,y FROM fixture.vertices": () => nestedQuery(source13, { columns: { id: true, x: true, y: true } }),
  "SELECT * FROM fixture.customers": () =>
    nestedQuery(source14, {
      columns: { id: true, x: true, y: true, open_time: true, close_time: true, service_time: true, order_unit: true },
    }),
  "SELECT * FROM fixture.trucks": () => nestedQuery(source15, { columns: { vehicle_id: true, capacity: true } }),
  "SELECT a.id src_id,b.id dest_id,spatial.ST_Distance(a.geom,b.geom)::float8 traveltime FROM fixture.vertices a CROSS JOIN fixture.vertices b":
    () => nestedQuery(source16, { columns: { src_id: true, dest_id: true, traveltime: true } }),
};
const sourceRecipes = [
  { name: "source17", query: "SELECT * FROM fixture.connected" },
  { name: "source0", query: "SELECT * FROM fixture.edges WHERE cost>=0" },
  { name: "source1", query: "SELECT source,target FROM fixture.combinations" },
  { name: "source2", query: "SELECT 1::bigint source,3::bigint target" },
  { name: "source3", query: "SELECT id,source,target,cost FROM fixture.edges WHERE cost>=0 AND source<target" },
  { name: "source4", query: "SELECT * FROM fixture.edges WHERE cost>=0 AND source<target" },
  { name: "source5", query: "SELECT id,in_edges,out_edges FROM fixture.vertices" },
  { name: "source6", query: "SELECT id,geom FROM fixture.edges" },
  { name: "source7", query: "SELECT * FROM fixture.orders" },
  { name: "source8", query: "SELECT * FROM fixture.vehicles" },
  {
    name: "source9",
    query:
      "SELECT a.id AS start_vid,b.id AS end_vid,spatial.ST_Distance(a.geom,b.geom)::float8 AS agg_cost FROM fixture.vertices a CROSS JOIN fixture.vertices b",
  },
  { name: "source10", query: "SELECT cost,path FROM fixture.restrictions" },
  { name: "source11", query: "SELECT pid,edge_id,fraction,side FROM fixture.pointsofinterest" },
  {
    name: "source12",
    query: "SELECT id::int4,source::int4,target::int4,cost,reverse_cost,x1,y1,x2,y2 FROM fixture.edges WHERE cost>=0",
  },
  { name: "source13", query: "SELECT id,x,y FROM fixture.vertices" },
  { name: "source14", query: "SELECT * FROM fixture.customers" },
  { name: "source15", query: "SELECT * FROM fixture.trucks" },
  {
    name: "source16",
    query:
      "SELECT a.id src_id,b.id dest_id,spatial.ST_Distance(a.geom,b.geom)::float8 traveltime FROM fixture.vertices a CROSS JOIN fixture.vertices b",
  },
] as const;

function ordered<Output>(rows: Output[]) {
  return [...rows].sort((a, b) =>
    JSON.stringify(a, (_, value) => (v.is(v.bigint(), value) ? value.toString() + "n" : value)).localeCompare(
      JSON.stringify(b, (_, value) => (v.is(v.bigint(), value) ? value.toString() + "n" : value)),
    ),
  );
}
function localUrl() {
  const url = process.env.PGROUTING_PROOF_URL;
  if (!url || !["127.0.0.1", "localhost", "[::1]"].includes(new URL(url).hostname))
    throw new Error("A disposable local pgRouting oracle URL is required");
  return url;
}
// Dynamic catalogue traversal is confined to this oracle harness. Public signatures are separately
// checked by the exact, non-erased overload interface and compile-time negative tests.
const callable = v.custom<(...values: unknown[]) => SQL>((value) => v.is(v.function(), value));
const sourceCallable = v.custom<() => ReturnType<(typeof sources)["SELECT source,target FROM fixture.combinations"]>>(
  (value) => v.is(v.function(), value),
);
const sourceDictionary = v.record(v.string(), sourceCallable);
const members = v.record(v.string(), callable);
const nativeType = v.picklist([
  "text",
  "bool",
  "int4",
  "int8",
  "float8",
  "numeric",
  "bpchar",
  "geometry",
  "_int4",
  "_int8",
  "anyarray",
  "_float8",
  "_text",
  "_geometry",
]);
const rowCallable = v.custom<(...values: unknown[]) => { from: SQL; columns: { [key: string]: SQL } }>((value) =>
  v.is(v.function(), value),
);
const types = {
  text: "text",
  bool: "bool",
  int4: "int4",
  int8: "int8",
  float8: "float8",
  numeric: "numeric",
  bpchar: "bpchar",
  geometry: "geometry",
  _int4: "int4Array",
  _int8: "int8Array",
  anyarray: "idsArray",
  _float8: "float8Array",
  _text: "textArray",
  _geometry: "geometryArray",
} as const;

test("222 safe pgRouting query overloads, managed graph transfer and native decoders; alpha-shape rejects", async () => {
  const url = localUrl(),
    api = createPgrouting_3_8_0(descriptor, postgis),
    functions = v.parse(members, api.sql.overloads),
    managedSources = v.parse(sourceDictionary, sources),
    rowFactories = v.parse(v.record(v.string(), rowCallable), api.sql.rows);
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const connection = await connectDatabase({ schema, relations: graph, connectionString: url });
  const receipts: {
    id: string;
    rows: number;
    dependencies: readonly string[];
    decoded: boolean;
    rowsHelper: boolean;
    defaults: boolean;
    strictNull: boolean;
  }[] = [];
  const blockedNativeRepair: string[] = [];
  try {
    await client.query("SET search_path TO fixture,routing,spatial,pg_catalog");
    for (const recipe of sourceRecipes) {
      await client.query(`DROP TABLE IF EXISTS fixture.${recipe.name}`);
      await client.query(`CREATE TABLE fixture.${recipe.name} AS ${recipe.query}`);
    }
    // Native pgRouting SQL wrapper bodies use these dependency schemas internally.
    await connection.db.execute(
      sql`select pg_catalog.set_config('search_path','fixture,routing,spatial,pg_catalog',false)`,
    );
    await withNestedQueryInvocation(
      {
        graph,
        identity: null,
        assertCurrent: () => {},
        fail: (cause) => {
          throw cause;
        },
      },
      () =>
        withExtensionSqlExecution({ check: () => {} }, async () => {
          for (const proof of nativeCases.cases) {
            const fn = functions[proof.id];
            if (!fn) continue;
            if (proof.name === "pgr_alphashape") {
              expect(() => fn(null)).toThrow(/verified native repair/);
              blockedNativeRepair.push(proof.id);
              continue;
            }
            const member = manifest.contract.members.find((row) => row.id === proof.id)!;
            if (member.kind !== "routine") throw new Error("Unexpected native member kind");
            const inputs = member.arguments.filter((row) => row.mode === "in");
            const values: unknown[] = [];
            for (const [index, arg] of inputs.entries()) {
              const input = proof.arguments[index]!;
              if (arg.type.name === "text" && input.startsWith("NULL")) {
                values.push(null);
              } else if (arg.type.name === "text") {
                const text = input.slice(1, input.lastIndexOf("'")).replaceAll("''", "'");
                const source = managedSources[text];
                if (!source) throw new Error(`Missing managed query source: ${text}`);
                values.push(source());
              } else {
                const native = await client.query<{ value: string | null }>(
                  `SELECT (${input})::pg_catalog.text AS value`,
                );
                const type = types[v.parse(nativeType, arg.type.name)];
                if (!type) throw new Error(`Unreviewed native argument ${arg.type.name}`);
                values.push(
                  api.codecs[type].decode(
                    arg.type.name === "bool" ? native.rows[0]!.value === "true" : native.rows[0]!.value,
                  ),
                );
              }
            }
            const expression = fn(...values),
              contract = extensionExpressionContract(expression)!;
            expect(contract.member).toBe(proof.id);
            const statement = extensionSqlDialect(nodePgCodecs).sqlToQuery(
              sql`SELECT (${expression})::pg_catalog.text AS value`,
            );
            expect(checkCompiledExtensionQuery(statement).some((row) => row.member === proof.id)).toBe(true);
            for (const input of proof.arguments.filter((row) => /^'(SELECT|WITH)/.test(row))) {
              const query = input.slice(1, input.lastIndexOf("'")).replaceAll("''", "'");
              const source = sourceRecipes.find((row) => row.query === query)!;
              expect(contract.dependencies.some((row) => row.endsWith(source.name))).toBe(true);
            }
            const actual = await client.query<{ value: string | null }>(statement.sql, statement.params);
            // Native split routines assign seq with row_number() over unordered edge groups.
            const unstableSequence = ["pgr_separatecrossing", "pgr_separatetouching"].includes(proof.name);
            const textIdentity = (value: string | null) => (unstableSequence ? value?.replace(/^\(\d+,/, "(") : value);
            // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Native heterogeneous results are validated as records before the test compares their unstable sequence field.
            const rowIdentity = (value: unknown) => {
              if (!unstableSequence || !v.is(v.record(v.string(), v.unknown()), value)) return value;
              expect(v.is(v.number(), value.seq)).toBe(true);
              const { seq, ...rest } = value;
              void seq;
              return rest;
            };
            const native = await client.query<{ value: string | null }>(
              `SELECT (${proof.sql.replace("SELECT * FROM ", "")})::pg_catalog.text AS value`,
            );
            const resultIdentity = rowIdentity;
            expect(
              actual.rows.map((row) => textIdentity(row.value)).sort((a, b) => String(a).localeCompare(String(b))),
            ).toEqual(
              native.rows.map((row) => textIdentity(row.value)).sort((a, b) => String(a).localeCompare(String(b))),
            );
            const decoder = getColumnFromDecoder(expression);
            if (!decoder) throw new Error(`Missing decoder ${proof.id}`);
            const expected = native.rows.map((row) => ({
              value:
                row.value === null
                  ? null
                  : decoder.mapFromDriverValue(member.returns.name === "bool" ? row.value === "true" : row.value),
            }));
            const decoded = await connection.db.select({ value: expression }).from(sql`(SELECT 1) AS native_one`);
            expect(
              ordered(await Promise.all(decoded.map(async (row) => ({ value: await resultIdentity(row.value) })))),
            ).toEqual(
              ordered(await Promise.all(expected.map(async (row) => ({ value: await resultIdentity(row.value) })))),
            );
            let rowsHelper = false;
            if (proof.returnsSet) {
              const factory = rowFactories[proof.id]!;
              const row = factory("route", ...values);
              const selected = await connection.db.select(row.columns).from(row.from);
              expect(selected.length).toBe(decoded.length);
              if (proof.out.length > 1)
                expect(ordered(selected.map(rowIdentity))).toEqual(
                  ordered(decoded.map((row) => rowIdentity(row.value))),
                );
              else if (proof.out.length === 1)
                expect(ordered(selected)).toEqual(ordered(decoded.map((row) => ({ [proof.out[0]!.name]: row.value }))));
              else expect(ordered(selected)).toEqual(ordered(decoded));
              rowsHelper = true;
            }
            let defaults = false;
            const firstDefault = inputs.findIndex((row) => row.hasDefault);
            if (firstDefault >= 0) {
              const shorter = fn(...values.slice(0, firstDefault));
              const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
                sql`SELECT (${shorter})::pg_catalog.text AS value`,
              );
              const actualDefault = await client.query(compiled.sql, compiled.params);
              const nativeDefault = await client.query(
                `SELECT (routing.${'"' + proof.name + '"'}(${proof.arguments.slice(0, firstDefault).join(",")}))::pg_catalog.text AS value`,
              );
              expect(
                actualDefault.rows
                  .map((row) => textIdentity(row.value))
                  .sort((a, b) => String(a).localeCompare(String(b))),
              ).toEqual(
                nativeDefault.rows
                  .map((row) => textIdentity(row.value))
                  .sort((a, b) => String(a).localeCompare(String(b))),
              );
              defaults = true;
            }
            let strictNull = false;
            if (member.strict && inputs.length) {
              const nullValues = [null, ...values.slice(1)];
              const actualNull = await connection.db
                .select({ value: fn(...nullValues) })
                .from(sql`(SELECT 1) AS native_one`);
              const firstType = api.codecs[types[v.parse(nativeType, inputs[0]!.type.name)]].sqlType!;
              const nativeNull = await client.query<{ value: string | null }>(
                `SELECT (routing."${proof.name}"(${[`NULL::"${firstType.schema}"."${firstType.name}"${firstType.array ? "[]" : ""}`, ...proof.arguments.slice(1)].join(",")}))::pg_catalog.text AS value`,
              );
              expect(actualNull).toEqual(nativeNull.rows);
              strictNull = true;
            }
            receipts.push({
              id: proof.id,
              rows: decoded.length,
              dependencies: contract.dependencies,
              decoded: true,
              rowsHelper,
              defaults,
              strictNull,
            });
          }
        }),
    );
    expect(receipts.length).toBe(222);
    expect(blockedNativeRepair).toEqual([
      "routine:$extension:pgrouting.pgr_alphashape($extension:postgis.geometry,pg_catalog.float8)",
    ]);
    expect(receipts.filter((row) => row.rowsHelper).length).toBe(208);
    if (process.env.PGROUTING_ADAPTER_PROOF_OUTPUT)
      await writeFile(
        process.env.PGROUTING_ADAPTER_PROOF_OUTPUT,
        JSON.stringify(
          {
            sourceImportLocalOnly: true,
            publicOverloads: receipts.length,
            blockedNativeRepair,
            completePublicNativeAcceptance: false,
            receipts,
            providerAcceptance: "pending",
            generationAcceptance: "pending",
            tarballAcceptance: "pending",
          },
          null,
          2,
        ) + "\n",
      );
  } finally {
    await connection.pool.end();
    await client.end();
  }
}, 120000);

const textIds = (...values: string[]) => ({ dimensions: [{ lowerBound: 1, length: values.length }], values });
test("all five pgRouting tooling routines mutate only the owned local operator transaction", async () => {
  const url = localUrl(),
    name = "operator_" + crypto.randomUUID().replaceAll("-", ""),
    table = "fixture." + name;
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const results: { name: string; result: string | null }[] = [];
  let escaped: (() => Promise<string | null>) | undefined;
  try {
    await client.query(
      `CREATE TABLE fixture.${name} AS SELECT id,source,target,geom AS the_geom,'B'::text AS oneway FROM fixture.edges`,
    );
    await withPgroutingOperations(url, descriptor, postgis, async (session) => {
      expect(Object.keys(session.sql.overloads).length).toBe(5);
      const record = async (name: string, result: Promise<string | null>) => {
        const value = await result;
        expect(value).toBe("OK");
        results.push({ name, result: value });
      };
      await record("pgr_createtopology", session.pgrCreatetopology(table, 0.01));
      await record("pgr_createverticestable", session.pgrCreateverticestable(table));
      await record("pgr_analyzegraph", session.pgrAnalyzegraph(table, 0.01));
      await record(
        "pgr_analyzeoneway",
        session.pgrAnalyzeoneway(table, textIds("B"), textIds("B"), textIds("B"), textIds("B")),
      );
      await record("pgr_nodenetwork", session.pgrNodenetwork(table, 0.01, "id", "the_geom", "noded", "true", false));
      escaped = () => session.pgrCreatetopology(table, 0.01);
    });
    const vertices = await client.query(`SELECT count(*)::integer AS count FROM fixture.${name}_vertices_pgr`);
    const nodes = await client.query(`SELECT count(*)::integer AS count FROM fixture.${name}_noded`);
    expect(vertices.rows[0]!.count).toBeGreaterThan(0);
    expect(nodes.rows[0]!.count).toBeGreaterThan(0);
    expect(escaped).toBeDefined();
    await escaped!().then(
      () => {
        throw new Error("Escaped operator unexpectedly remained active");
      },
      (cause) => expect(String(cause)).toMatch(/closed|active|expired|transaction|ended/i),
    );
    if (process.env.PGROUTING_OPERATOR_PROOF_OUTPUT)
      await writeFile(
        process.env.PGROUTING_OPERATOR_PROOF_OUTPUT,
        JSON.stringify(
          {
            sourceImportLocalOnly: true,
            results,
            vertices: vertices.rows[0]!.count,
            noded: nodes.rows[0]!.count,
            escapedRejected: true,
            providerAcceptance: "pending",
          },
          null,
          2,
        ) + "\n",
      );
  } finally {
    await client.query(`DROP TABLE IF EXISTS fixture.${name}_noded,fixture.${name}_vertices_pgr,fixture.${name}`);
    await client.end();
  }
}, 120000);

test("routing preserves high int8 vertex IDs, bounded arrays, policy filters and invocation ownership", async () => {
  const url = localUrl(),
    offset = 9007199254740993n,
    api = createPgrouting_3_8_0(descriptor, postgis);
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const connection = await connectDatabase({ schema, relations: graph, connectionString: url });
  const route =
    api.sql.overloads[
      "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)"
    ];
  const arrayRoute =
    api.sql.overloads[
      "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"
    ];
  const selection = { columns: { id: true, source: true, target: true, cost: true, reverse_cost: true } } as const;
  const scoped = validators.source0.search({
    columns: ["id", "source", "target", "cost", "reverse_cost"],
    filter: [],
    order: [],
    scope: {
      name: "routing-owner",
      version: "1",
      where: ({ table, identity }) => eq(table.source, identity?.subject === "alice" ? offset + 1n : -1n),
    },
  });
  const run = async (subject: string, work: () => Promise<void>) =>
    withNestedQueryInvocation(
      {
        graph,
        identity: { issuer: "test", subject },
        assertCurrent: () => {},
        fail: (cause) => {
          throw cause;
        },
      },
      () => withExtensionSqlExecution({ check: () => {} }, work),
    );
  let escaped: SQL | undefined;
  try {
    await client.query("UPDATE fixture.source0 SET id=id+$1,source=source+$1,target=target+$1", [offset.toString()]);
    await connection.db.execute(
      sql`select pg_catalog.set_config('search_path','fixture,routing,spatial,pg_catalog',false)`,
    );
    await run("alice", async () => {
      const source = nestedQuery(scoped, selection),
        expression = route(source, offset + 1n, offset + 3n);
      const rows = await connection.db.select({ value: expression }).from(sql`(SELECT 1) AS native_one`);
      expect(rows.length).toBeGreaterThan(0);
      expect(
        rows.every((row) => row.value !== null && row.value.node !== null && row.value.node > Number.MAX_SAFE_INTEGER),
      ).toBe(true);
      const bounded = api.sql.rows[
        "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)"
      ](
        "precise",
        source,
        { dimensions: [{ lowerBound: -4, length: 1 }], values: [offset + 1n] },
        { dimensions: [{ lowerBound: 7, length: 1 }], values: [offset + 3n] },
      );
      const selected = await connection.db.select(bounded.columns).from(bounded.from);
      expect(selected).toEqual(rows.flatMap((row) => (row.value === null ? [] : [row.value])));
      expect(
        extensionExpressionContract(arrayRoute(source, { dimensions: [], values: [] }, { dimensions: [], values: [] }))
          ?.dependencies,
      ).toContain("source0");
      escaped = expression;
    });
    await run("bob", async () => {
      const expression = route(nestedQuery(scoped, selection), offset + 1n, offset + 3n);
      expect(await connection.db.select({ value: expression }).from(sql`(SELECT 1) AS native_one`)).toEqual([]);
      expect(() => extensionSqlDialect(nodePgCodecs).sqlToQuery(escaped!)).toThrow(/invocation/);
    });
    expect(() => extensionSqlDialect(nodePgCodecs).sqlToQuery(escaped!)).toThrow(/invocation/);
  } finally {
    await client.query("UPDATE fixture.source0 SET id=id-$1,source=source-$1,target=target-$1", [offset.toString()]);
    await connection.pool.end();
    await client.end();
  }
}, 120000);
