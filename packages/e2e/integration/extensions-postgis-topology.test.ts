import assert from "node:assert/strict";
import pg from "pg";
import { sql, type SQL } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { createPostgisTopology_3_6_4 } from "../../../apps/loom/src/core/extensions/adapters/postgis-topology";
import { createPostgisTopologyCodecs } from "../../../apps/loom/src/core/extensions/adapters/postgis-topology-codecs";
import { withPostgisTopologyOperations } from "../../../apps/loom/src/tooling/extensions/operations/postgis-topology";
import { extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import rawManifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis_topology.json";
import postgisManifest from "../../../apps/loom/src/tooling/extensions/manifests/postgis.json";
import { withPostgisTopologyDatabase } from "../fixtures/postgis-topology-database";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import {
  postgisTopologyOrdinaryProofCase,
  postgisTopologySchemaProofCase,
  postgisTopologyOperatorProofCase,
  postgisTopologyPopulatedOperatorProofCase,
} from "../fixtures/postgis-topology-proof-cases";
import { populatedTopologyOperatorArguments } from "../fixtures/postgis-topology-populated-operators";

const manifest = v.parse(extensionManifestValidator, rawManifest);
const descriptor = {
  name: "postgis_topology",
  version: "3.6.4",
  schema: "topology",
  apiSupport: { status: "verified", digest: manifest.digest },
} as const;
const postgis = {
  name: "postgis",
  version: "3.6.4",
  schema: "extensions",
  apiSupport: { status: "verified", digest: postgisManifest.digest },
} as const;
const api = createPostgisTopology_3_6_4(descriptor, postgis);
const codecs = createPostgisTopologyCodecs("topology", "extensions");
const dialect = extensionSqlDialect(nodePgCodecs);
const quote = (name: string) => '"' + name.replaceAll('"', '""') + '"';
const typeSql = (ref: { namespace: string; name: string }) => {
  const schema =
    ref.namespace === "$extension:postgis_topology"
      ? "topology"
      : ref.namespace === "$extension:postgis"
        ? "extensions"
        : ref.namespace;
  return `${quote(schema)}.${quote(ref.name)}`;
};
type NativeOutcome = (string | null)[] | { code: string | undefined; message: string };
type OperatorSession = Parameters<Parameters<typeof withPostgisTopologyOperations>[3]>[0];
type OperatorValue = Awaited<ReturnType<OperatorSession["routines"][keyof OperatorSession["routines"]]>>;
const routines = manifest.contract.members.filter((row) => row.kind === "routine");
async function query(client: pg.Client, expression: SQL): Promise<(string | null)[]> {
  const compiled = dialect.sqlToQuery(sql`select (${expression})::pg_catalog.text value`);
  return (await client.query(compiled.sql, compiled.params)).rows.map((row) => row.value);
}
async function connected<Result>(url: string, operation: (client: pg.Client) => Promise<Result>) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  try {
    await client.query("SET search_path TO topology,extensions,pg_catalog");
    return await operation(client);
  } finally {
    await client.end();
  }
}
function nullCall(member: (typeof routines)[number]) {
  return `SELECT (topology.${quote(member.name)}(${member.arguments
    .filter((arg) => ["in", "inout", "variadic"].includes(arg.mode))
    .map((arg) => `NULL::${typeSql(arg.type)}`)
    .join(",")}))::pg_catalog.text value`;
}

function populatedArguments(
  member: (typeof routines)[number],
  topologyId: number,
  layerId: number,
  topogeometry: { topology_id: number; layer_id: number; id: bigint; type: number },
): unknown[] {
  const args = member.arguments.filter((arg) => ["in", "inout", "variadic"].includes(arg.mode));
  switch (member.name) {
    case "asgml":
      return [topogeometry, "gml", 8, 0].slice(0, args.length);
    case "equals":
    case "intersects":
      return [topogeometry, topogeometry];
    case "findlayer":
      if (args[0]!.type.name === "topogeometry") return [topogeometry];
      if (args[0]!.type.name === "int4") return [topologyId, layerId];
      return args.length === 2 ? ["features.points", "shape"] : ["features", "points", "shape"];
    case "findtopology":
      if (args[0]!.type.name === "topogeometry") return [topogeometry];
      if (args[0]!.type.name === "int4") return [topologyId];
      if (args[0]!.type.name === "text") return ["query_graph"];
      return args.length === 2 ? ["features.points", "shape"] : ["features", "points", "shape"];
    case "geometry":
    case "geometrytype":
    case "st_geometrytype":
    case "st_srid":
    case "topoelement":
      return [topogeometry];
    case "getedgebypoint":
      return ["query_graph", api.geometry.ewkt("SRID=4326;POINT(1 0)"), 0];
    case "getnodebypoint":
      return ["query_graph", api.geometry.ewkt("SRID=4326;POINT(8 8)"), 0];
    case "getfacebypoint":
      return ["query_graph", api.geometry.ewkt("SRID=4326;POINT(11 11)"), 0];
    case "getfacecontainingpoint":
      return ["query_graph", api.geometry.ewkt("SRID=4326;POINT(11 11)")];
    case "getnodeedges":
      return ["query_graph", 1n];
    case "getringedges":
      return ["query_graph", 1n, 100];
    case "gettopogeomelementarray":
    case "gettopogeomelements":
      return args.length === 1 ? [topogeometry] : ["query_graph", layerId, topogeometry.id];
    case "gettopologyname":
      return [topologyId];
    case "gettopologyid":
    case "gettopologysrid":
    case "topologysummary":
    case "totaltopologysize":
      return ["query_graph"];
    case "postgis_topology_scripts_installed":
      return [];
    case "st_getfaceedges":
    case "st_getfacegeometry":
      return ["query_graph", 1n];
    case "st_simplify":
      return [topogeometry, 0];
    case "topoelementarray_agg":
      return [api.codecs.topoelement.decode("{3,1}")];
    case "topoelementarray_append":
      return [api.codecs.topoelementarray.decode("{{3,1}}"), api.codecs.topoelement.decode("{3,1}")];
    case "validatetopologyprecision":
      return ["query_graph", null, 0];
    default:
      throw new Error("Missing populated native query scenario: " + member.id);
  }
}

extensionProofTest(postgisTopologyOrdinaryProofCase, async () => {
  await withPostgisTopologyDatabase((url) =>
    connected(url, async (client) => {
      await client.query("BEGIN");
      assert.equal(Object.keys(api.sql.overloads).length, 41);
      assert.equal(Object.keys(api.sql.casts).length, 2);
      await client.query(
        "SELECT CreateTopology('query_graph',4326,0,false,0,true); SELECT TopoGeo_AddLineString('query_graph',ST_GeomFromText('LINESTRING(0 0,2 0)',4326)); SELECT TopoGeo_AddPoint('query_graph',ST_GeomFromText('POINT(8 8)',4326)); SELECT TopoGeo_AddPolygon('query_graph',ST_GeomFromText('POLYGON((10 10,12 10,12 12,10 12,10 10))',4326)); CREATE SCHEMA features; CREATE TABLE features.points(id int)",
      );
      const topologyId = v.parse(v.number(), (await client.query("SELECT GetTopologyID('query_graph') id")).rows[0].id);
      const layerId = v.parse(
        v.number(),
        (await client.query("SELECT AddTopoGeometryColumn('query_graph','features','points','shape','POINT') id"))
          .rows[0].id,
      );
      const topogeometry = api.codecs.topogeometry.decode(
        (
          await client.query(
            "SELECT CreateTopoGeom('query_graph',1,$1,'{{3,1}}'::topology.topoelementarray)::text value",
            [layerId],
          )
        ).rows[0].value,
      );
      for (const claim of postgisTopologyOrdinaryProofCase.claims.filter((row) => row.member.startsWith("routine:"))) {
        const member = routines.find((row) => row.id === claim.member)!;
        /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
        const fn = api.sql.overloads[claim.member as keyof typeof api.sql.overloads] as (...args: null[]) => SQL;
        await extensionProofWitness({ ...claim, schema: "topology" }, async () => {
          const args = member.arguments.filter((arg) => ["in", "inout", "variadic"].includes(arg.mode)).map(() => null);
          await client.query("SAVEPOINT oracle");
          let expected: NativeOutcome;
          try {
            expected = (await client.query(nullCall(member))).rows.map((row) => row.value);
          } catch (error) {
            /* SAFETY: This reads an oracle/operator failure; the following assertions check its native SQLSTATE or error contract. */
            expected = { code: (error as pg.DatabaseError).code, message: (error as Error).message };
          }
          await client.query("ROLLBACK TO oracle");
          let actual: NativeOutcome;
          try {
            actual = await query(client, fn(...args));
          } catch (error) {
            /* SAFETY: This reads an oracle/operator failure; the following assertions check its native SQLSTATE or error contract. */
            actual = { code: (error as pg.DatabaseError).code, message: (error as Error).message };
          }
          await client.query("ROLLBACK TO oracle");
          assert.deepEqual(actual, expected, claim.member);
          /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
          const values = populatedArguments(
            member,
            topologyId,
            layerId,
            topogeometry as { topology_id: number; layer_id: number; id: bigint; type: number },
          );
          const input = member.arguments.filter((arg) => ["in", "inout", "variadic"].includes(arg.mode));
          const params = input.map((arg, index) => {
            if (values[index] === null) return null;
            /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
            const codec =
              arg.type.namespace === "$extension:postgis_topology"
                ? codecs.types[arg.type.name as keyof typeof codecs.types]
                : codecs.primitives[`${arg.type.namespace}:${arg.type.name}` as keyof typeof codecs.primitives];
            /* SAFETY: The captured member selects this exact codec, which validates the fixture value before native SQL. */
            return codec.encode(values[index] as never);
          });
          const native = await client.query(
            `SELECT (topology.${quote(member.name)}(${input.map((arg, index) => `$${index + 1}::${typeSql(arg.type)}`).join(",")}))::text value`,
            params,
          );
          /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
          assert.deepEqual(
            await query(client, (fn as (...args: unknown[]) => SQL)(...values)),
            native.rows.map((row) => row.value),
            "Populated native oracle: " + claim.member,
          );
        });
      }
      for (const claim of postgisTopologyOrdinaryProofCase.claims.filter((row) => row.member.startsWith("cast:"))) {
        const member = manifest.contract.members.find((row) => row.id === claim.member);
        assert(member?.kind === "cast");
        await extensionProofWitness({ ...claim, schema: "topology" }, async () => {
          /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
          const fn = api.sql.casts[claim.member as keyof typeof api.sql.casts];
          assert.deepEqual(
            await query(client, fn(null)),
            (
              await client.query(`SELECT (NULL::topology.topogeometry::${typeSql(member.target)})::text value`)
            ).rows.map((row) => row.value),
          );
          assert.deepEqual(
            await query(client, fn(topogeometry)),
            (
              await client.query(`SELECT ($1::topology.topogeometry::${typeSql(member.target)})::text value`, [
                api.codecs.topogeometry.encode(topogeometry),
              ])
            ).rows.map((row) => row.value),
          );
        });
      }
      assert.deepEqual(
        await query(client, api.getnodebypoint("query_graph", api.geometry.ewkt("SRID=4326;POINT(8 8)"), 0)),
        ["3"],
      );
      assert.deepEqual(
        await query(client, api.getedgebypoint("query_graph", api.geometry.ewkt("SRID=4326;POINT(1 0)"), 0)),
        ["1"],
      );
      assert.deepEqual(
        await query(client, api.getfacecontainingpoint("query_graph", api.geometry.ewkt("SRID=4326;POINT(5 5)"))),
        ["0"],
      );
      const edgeRows = api.sql.rows[
        "routine:$extension:postgis_topology.getnodeedges(pg_catalog.varchar,pg_catalog.int8)"
      ]("edge_rows", "query_graph", 1n);
      const compiled = dialect.sqlToQuery(sql`select ${edgeRows.columns.edge}::text edge from ${edgeRows.from}`);
      assert.deepEqual((await client.query(compiled.sql, compiled.params)).rows, [{ edge: "1" }]);
      const element = api.codecs.topoelement.decode("{7,1}");
      assert.deepEqual(await query(client, api.topoelementarray_agg(element)), ["{{7,1}}"]);
      assert.deepEqual(await query(client, api.topoelementarray_agg.over({}, element)), ["{{7,1}}"]);
      for (const claim of postgisTopologyOrdinaryProofCase.claims.filter(
        (row) => row.member.startsWith("table:") || row.member.startsWith("sequence:"),
      )) {
        await extensionProofWitness({ ...claim, schema: "topology" }, async () => {
          const member = manifest.contract.members.find((row) => row.id === claim.member);
          assert(member?.kind === "relation");
          /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
          const rows = api.sql.rows[claim.member as keyof typeof api.sql.rows] as (alias: string) => { from: SQL };
          const compiled = dialect.sqlToQuery(sql`select * from ${rows("native_rows").from}`);
          assert.deepEqual(
            (await client.query(compiled.sql, compiled.params)).rows,
            (await client.query(`SELECT * FROM topology.${quote(member.name)}`)).rows,
          );
        });
      }
      await client.query("ROLLBACK");
    }).then(() => {}),
  );
});

type StoredSamples = Record<
  | "getfaceedges_returntype"
  | "layer"
  | "topoelement"
  | "topoelementarray"
  | "topogeometry"
  | "topology"
  | "validatetopology_returntype",
  string
>;
const storedSamples: StoredSamples = {
  getfaceedges_returntype: "(1,9223372036854775807)",
  layer: '(1,2,"schema,日本","table,quoted",feature,1,0,)',
  topoelement: "{9223372036854775807,1}",
  topoelementarray: "[0:1][1:2]={{9223372036854775807,1},{-9223372036854775808,2}}",
  topogeometry: "(1,2,9223372036854775807,3)",
  topology: '(1,"graph,日本",4326,0,f,t)',
  validatetopology_returntype: '("error,quoted",9223372036854775807,-9223372036854775808)',
};
extensionProofTest(postgisTopologySchemaProofCase, async () => {
  await withPostgisTopologyDatabase((url) =>
    connected(url, async (client) => {
      await client.query("BEGIN");
      for (const claim of postgisTopologySchemaProofCase.claims.filter((row) => row.member.startsWith("type:"))) {
        const name = claim.member.slice("type:$extension:postgis_topology.".length);
        /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
        const codec = api.codecs[name as keyof typeof api.codecs];
        await extensionProofWitness({ ...claim, schema: "topology" }, async () => {
          const nativeType = `topology.${quote(name)}`;
          const baseName = name.startsWith("_") ? name.slice(1) : name;
          /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
          const raw = name.startsWith("_")
            ? codec.encode({
                dimensions: [{ lowerBound: -2, length: 2 }],
                values: [
                  api.codecs[baseName as keyof typeof api.codecs].decode(
                    storedSamples[baseName as keyof StoredSamples],
                  ),
                  null,
                ],
              } as never)
            : storedSamples[name as keyof StoredSamples];
          const canonical = (await client.query(`SELECT ($1::${nativeType})::text value`, [raw])).rows[0].value;
          const decoded = codec.decode(canonical);
          await client.query(`CREATE TEMP TABLE sample (${quote("value")} ${nativeType})`);
          /* SAFETY: The captured member selects this exact codec, which validates the fixture value before native SQL. */
          await client.query(`INSERT INTO sample VALUES ($1::${nativeType}),(NULL)`, [codec.encode(decoded as never)]);
          const rows = (await client.query("SELECT value::text value FROM sample")).rows;
          assert.deepEqual(codec.decode(rows[0].value), decoded);
          assert.equal(rows[1].value, null);
          /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
          const field = api.fields[name as keyof typeof api.fields]();
          assert.equal(field.metadata.extension?.member, claim.member);
          await client.query("DROP TABLE sample");
        });
      }
      const compositeExpected = {
        getfaceedges_returntype: { sequence: 1, edge: 9223372036854775807n },
        topogeometry: { topology_id: 1, layer_id: 2, id: 9223372036854775807n, type: 3 },
        validatetopology_returntype: {
          error: "error,quoted",
          id1: 9223372036854775807n,
          id2: -9223372036854775808n,
        },
      } as const;
      for (const name of ["getfaceedges_returntype", "topogeometry", "validatetopology_returntype"] as const) {
        const claim = postgisTopologySchemaProofCase.claims.find(
          (row) => row.member === `composite type:"$extension:postgis_topology".${name}`,
        );
        assert(claim);
        await extensionProofWitness({ ...claim, schema: "topology" }, async () => {
          const native = await client.query(`SELECT ($1::topology.${quote(name)})::text value`, [storedSamples[name]]);
          assert.deepEqual(api.codecs[name].decode(native.rows[0].value), compositeExpected[name]);
        });
      }
      const domainChecks = [
        { type: "topoelement", constraint: "dimensions", valid: "{1,1}", invalid: "{1}" },
        { type: "topoelement", constraint: "lower_dimension", valid: "{1,1}", invalid: "[0:2]={1,1,1}" },
        { type: "topoelement", constraint: "type_range", valid: "{1,9}", invalid: "{1,0}" },
        { type: "topoelementarray", constraint: "type_range", valid: "{{1,1}}", invalid: "{{1,1,1}}" },
      ] as const;
      for (const check of domainChecks) {
        const claim = postgisTopologySchemaProofCase.claims.find(
          (row) =>
            row.member === `domain constraint:${check.constraint} on "$extension:postgis_topology".${check.type}`,
        );
        assert(claim);
        await extensionProofWitness({ ...claim, schema: "topology" }, async () => {
          const codec = api.codecs[check.type];
          const datum = codec.decode(check.valid);
          const native = await client.query(`SELECT ($1::topology.${quote(check.type)})::text value`, [
            codec.encode(datum),
          ]);
          assert.deepEqual(codec.decode(native.rows[0].value), datum);
          await client.query("SAVEPOINT domain_check");
          await assert.rejects(client.query(`SELECT $1::topology.${quote(check.type)}`, [check.invalid]), (error) => {
            assert(error instanceof Error && "code" in error && "constraint" in error);
            assert.equal(error.code, "23514");
            assert.equal(error.constraint, check.constraint);
            return true;
          });
          await client.query("ROLLBACK TO domain_check");
        });
      }
      assert.equal((await client.query("SELECT '{1,9}'::topology.topoelement::text value")).rows[0].value, "{1,9}");
      assert.equal((await client.query("SELECT '(,,,,,)'::topology.topology::text value")).rows[0].value, "(,,,,,)");
      await client.query("ROLLBACK");
    }).then(() => {}),
  );
});

extensionProofTest(
  postgisTopologyOperatorProofCase,
  async () => {
    await withPostgisTopologyDatabase(async (url) => {
      const outcomes = await connected(url, async (client) => {
        const result = new Map<
          string,
          { rows?: (string | null)[]; error?: { code: string | undefined; message: string } }
        >();
        await client.query("BEGIN");
        for (const claim of postgisTopologyOperatorProofCase.claims) {
          const member = routines.find((row) => row.id === claim.member)!;
          await client.query("SAVEPOINT native_operator");
          try {
            result.set(claim.member, { rows: (await client.query(nullCall(member))).rows.map((row) => row.value) });
          } catch (error) {
            /* SAFETY: This reads an oracle/operator failure; the following assertions check its native SQLSTATE or error contract. */
            result.set(claim.member, {
              error: { code: (error as pg.DatabaseError).code, message: (error as Error).message },
            });
          }
          await client.query("ROLLBACK TO native_operator");
        }
        await client.query("ROLLBACK");
        return result;
      });
      for (const claim of postgisTopologyOperatorProofCase.claims) {
        const member = routines.find((row) => row.id === claim.member)!;
        const expected = outcomes.get(claim.member)!;
        await extensionProofWitness({ ...claim, schema: "topology" }, async () => {
          let result: Awaited<ReturnType<typeof withPostgisTopologyOperations<OperatorValue>>>;
          try {
            result = await withPostgisTopologyOperations(url, descriptor, postgis, (session) => {
              assert.equal(Object.keys(session.routines).length, 56);
              /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
              const operation = session.routines[claim.member as keyof typeof session.routines] as (
                ...args: null[]
              ) => Promise<OperatorValue>;
              return operation(
                ...member.arguments.filter((arg) => ["in", "inout", "variadic"].includes(arg.mode)).map(() => null),
              );
            });
          } catch (error) {
            /* SAFETY: This reads an oracle/operator failure; the following assertions check its native SQLSTATE or error contract. */
            assert(
              expected.error,
              `Unexpected operator admission or execution failure: ${claim.member}\n${String(error)}\n${String((error as Error).cause)}`,
            );
            /* SAFETY: This reads an oracle/operator failure; the following assertions check its native SQLSTATE or error contract. */
            const cause = (error as Error).cause as pg.DatabaseError;
            assert.deepEqual({ code: cause.code, message: cause.message }, expected.error, claim.member);
            return;
          }
          assert(!expected.error, `Expected native failure: ${claim.member}`);
          /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
          assert.equal((result as { completion: string }).completion, "committed");
          /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
          const codec =
            member.returns.name === "record"
              ? codecs[`${member.name}Result` as "populate_topology_layerResult" | "validatetopologyrelationResult"]
              : member.returns.namespace === "$extension:postgis_topology"
                ? codecs.types[member.returns.name as keyof typeof codecs.types]
                : codecs.primitives[
                    `${member.returns.namespace}:${member.returns.name}` as keyof typeof codecs.primitives
                  ];
          const decoded = expected.rows!.map((value) => (value === null ? null : codec.decode(value)));
          /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
          assert.deepEqual(
            (result as { value: unknown }).value,
            member.returnsSet ? decoded : decoded[0],
            claim.member,
          );
        });
      }
      const result = await withPostgisTopologyOperations(url, descriptor, postgis, async (session) => {
        const id = await session.createtopology("operator_graph", 4326, undefined, undefined, undefined, true);
        v.parse(v.number(), id);
        const point = await session.topogeo_addpoint("operator_graph", api.geometry.ewkt("SRID=4326;POINT(8 8)"));
        assert.equal(point, 1n);
        const edges = await session.topogeo_addlinestring(
          "operator_graph",
          api.geometry.ewkt("SRID=4326;LINESTRING(0 0,2 0)"),
        );
        assert.deepEqual(edges, [1n]);
        assert.deepEqual(await session.validatetopology("operator_graph"), []);
        await session.st_moveisonode("operator_graph", point, api.geometry.ewkt("SRID=4326;POINT(9 9)"));
        await session.st_removeisonode("operator_graph", point);
        await session.maketopologyprecise("operator_graph");
        const copy = await session.copytopology("operator_graph", "operator_copy");
        v.parse(v.number(), copy);
        await session.renametopology("operator_copy", "operator_renamed");
        await session.droptopology("operator_renamed");
        return id;
      });
      assert.equal(result.completion, "committed");
      await connected(url, async (client) => {
        assert.equal((await client.query("SELECT count(*) FROM operator_graph.edge_data")).rows[0].count, "1");
      });
      await assert.rejects(
        withPostgisTopologyOperations(url, descriptor, postgis, async (session) => {
          await session.createtopology("rolled_back_graph");
          throw new Error("rollback oracle");
        }),
      );
      await connected(url, async (client) => {
        assert.equal((await client.query("SELECT 1 FROM pg_namespace WHERE nspname='rolled_back_graph'")).rowCount, 0);
      });
      let escapedSession: OperatorSession | undefined;
      await assert.rejects(
        withPostgisTopologyOperations(url, descriptor, postgis, async (session) => {
          escapedSession = session;
          await session.createtopology("caught_failure_graph");
          try {
            // SAFETY: This deliberately violates the public argument type to prove executable SQL is rejected at runtime.
            await session.topogeo_addpoint(
              "caught_failure_graph",
              sql`extensions.ST_GeomFromText('POINT(1 2)')` as never,
            );
          } catch {
            /* The transaction owner must retain the failure even when the callback catches it. */
          }
        }),
      );
      assert(escapedSession);
      await assert.rejects(escapedSession.createtopology("escaped_graph"), /inactive|owner/);
      await connected(url, async (client) => {
        assert.equal(
          (await client.query("SELECT 1 FROM pg_namespace WHERE nspname IN ('caught_failure_graph','escaped_graph')"))
            .rowCount,
          0,
        );
      });
    });
  },
  180000,
);

extensionProofTest(
  postgisTopologyPopulatedOperatorProofCase,
  async () => {
    await withPostgisTopologyDatabase((url) =>
      connected(url, async (client) => {
        for (const claim of postgisTopologyPopulatedOperatorProofCase.claims) {
          const member = routines.find((row) => row.id === claim.member)!;
          const input = member.arguments.filter((arg) => ["in", "inout", "variadic"].includes(arg.mode));
          const values = await populatedTopologyOperatorArguments(
            client,
            member.name,
            input.map((arg) => arg.type.name),
          );
          await extensionProofWitness({ ...claim, schema: "topology" }, async () => {
            const sequences = (
              await client.query(
                "SELECT schemaname,sequencename FROM pg_sequences WHERE schemaname IN ('topology','features') OR schemaname IN (SELECT name FROM topology.topology) ORDER BY schemaname,sequencename",
              )
            ).rows;
            const counters: { name: string; value: string; called: boolean }[] = [];
            for (const row of sequences) {
              const name = `${quote(row.schemaname)}.${quote(row.sequencename)}`;
              const state = (await client.query(`SELECT last_value::text value,is_called FROM ${name}`)).rows[0];
              counters.push({ name, value: state.value, called: state.is_called });
            }
            const params = input.map((arg, index) => {
              if (values[index] === null) return null;
              /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
              const codec =
                arg.type.namespace === "$extension:postgis_topology"
                  ? codecs.types[arg.type.name as keyof typeof codecs.types]
                  : codecs.primitives[`${arg.type.namespace}:${arg.type.name}` as keyof typeof codecs.primitives];
              /* SAFETY: The captured member selects this exact codec, which validates the fixture value before native SQL. */
              return codec.encode(values[index] as never);
            });
            await client.query("BEGIN");
            let native: (string | null)[] = [];
            let unsupported: pg.DatabaseError | undefined;
            try {
              native = (
                await client.query(
                  `SELECT (topology.${quote(member.name)}(${input.map((arg, index) => `$${index + 1}::${typeSql(arg.type)}`).join(",")}))::text value`,
                  params,
                )
              ).rows.map((row) => row.value);
            } catch (error) {
              if (member.name !== "topogeo_addgeometry")
                throw new Error(`Populated native fixture failed: ${claim.member}`, { cause: error });
              /* SAFETY: This reads an oracle/operator failure; the following assertions check its native SQLSTATE or error contract. */
              unsupported = error as pg.DatabaseError;
              assert.equal(unsupported.code, "P0001");
              assert.equal(unsupported.message, "TopoGeo_AddGeometry not implemented yet, use TopoGeo_LoadGeometry");
            } finally {
              await client.query("ROLLBACK");
            }
            // PostgreSQL sequences are not transactional; restore the native oracle's counters before replay.
            for (const counter of counters)
              await client.query("SELECT pg_catalog.setval($1::regclass,$2::bigint,$3)", [
                counter.name,
                counter.value,
                counter.called,
              ]);
            const execute = () =>
              withPostgisTopologyOperations(url, descriptor, postgis, (session) => {
                /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
                const operation = session.routines[claim.member as keyof typeof session.routines] as (
                  ...args: unknown[]
                ) => Promise<OperatorValue>;
                return operation(...values);
              });
            if (unsupported) {
              await assert.rejects(execute(), (error) => {
                /* SAFETY: This reads an oracle/operator failure; the following assertions check its native SQLSTATE or error contract. */
                const cause = (error as Error).cause as pg.DatabaseError;
                assert.equal(cause.code, unsupported!.code);
                assert.equal(cause.message, unsupported!.message);
                /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
                assert.equal((error as { completion?: string }).completion, "rolled-back");
                return true;
              });
              return;
            }
            const actual = await execute();
            /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
            const codec =
              member.returns.name === "record"
                ? codecs[`${member.name}Result` as "populate_topology_layerResult" | "validatetopologyrelationResult"]
                : member.returns.namespace === "$extension:postgis_topology"
                  ? codecs.types[member.returns.name as keyof typeof codecs.types]
                  : codecs.primitives[
                      `${member.returns.namespace}:${member.returns.name}` as keyof typeof codecs.primitives
                    ];
            const decoded = native.map((value) => (value === null ? null : codec.decode(value)));
            assert.equal(actual.completion, "committed");
            assert.deepEqual(actual.value, member.returnsSet ? decoded : decoded[0], claim.member);
          });
        }
        // Keep a real upstream failure visible; the public API delegates it and rolls back its transaction.
        const values = await populatedTopologyOperatorArguments(client, "st_modedgesplit", [
          "varchar",
          "int8",
          "geometry",
        ]);
        await client.query("BEGIN");
        let nativeError: pg.DatabaseError | undefined;
        try {
          await client.query("SELECT ST_NewEdgesSplit('op_graph',1,ST_GeomFromText('POINT(1 0)',4326))");
        } catch (error) {
          /* SAFETY: This reads an oracle/operator failure; the following assertions check its native SQLSTATE or error contract. */
          nativeError = error as pg.DatabaseError;
        } finally {
          await client.query("ROLLBACK");
        }
        assert.equal(
          nativeError?.code,
          "42601",
          "Selected 3.6.4 referenced-edge behavior changed; investigate native artifact before updating the characterization",
        );
        /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
        await assert.rejects(
          withPostgisTopologyOperations(url, descriptor, postgis, (session) =>
            session.st_newedgessplit(
              values[0] as string,
              values[1] as bigint,
              values[2] as ReturnType<typeof api.geometry.ewkt>,
            ),
          ),
          (error) => {
            /* SAFETY: This reads an oracle/operator failure; the following assertions check its native SQLSTATE or error contract. */
            const cause = (error as Error).cause as pg.DatabaseError;
            assert.equal(cause.code, nativeError!.code);
            assert.equal(cause.message, nativeError!.message);
            /* SAFETY: The exact manifest/case registry selects this heterogeneous API member; its runtime codec checks the associated input and output. */
            assert.equal((error as { completion?: string }).completion, "rolled-back");
            return true;
          },
        );
      }).then(() => {}),
    );
  },
  180000,
);
