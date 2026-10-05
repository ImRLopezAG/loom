import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import pg from "pg";
import * as v from "valibot";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";
import { withPgroutingOperations } from "kello/tooling/extensions/pgrouting";

assert.equal(process.versions.node.split(".")[0], "24", "Cold runtime requires Node 24");
const root = process.cwd();
const state: {
  root: string;
  selection: string;
  version: string;
  connectionString?: string;
  runtimeConnectionString?: string;
  metadataNamespace?: string;
  runtimeRole?: string;
}[] = JSON.parse(await readFile(join(root, "runtime-state.json"), "utf8"));
const results: {
  selection: string;
  generatedRuntime: boolean;
  hostMountedRpc: boolean;
  operatorMembers: number;
  runtimePrincipal?: string;
  runtimeNonAdministrative?: true;
}[] = [];
for (const project of state) {
  const bindings = await import(pathToFileURL(join(project.root, ".loom-proof/public-bindings.js")).href);
  assert.equal(bindings.serverExtensions, bindings.extensions);
  if (!project.connectionString) {
    if (project.selection === "future") {
      assert.equal(bindings.extensions.pgrouting.apiSupport.status, "unverified");
      assert.equal("sql" in bindings.extensions.pgrouting, false);
    } else assert.equal(bindings.extensions, undefined);
    results.push({ selection: project.selection, generatedRuntime: true, hostMountedRpc: false, operatorMembers: 0 });
    continue;
  }
  assert(project.metadataNamespace && project.runtimeRole && project.runtimeConnectionString);
  const principal = new pg.Client({ connectionString: project.runtimeConnectionString });
  await principal.connect();
  try {
    const proof = await principal.query<{ username: string; administrative: boolean }>(
      "SELECT current_user AS username,rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls AS administrative FROM pg_roles WHERE rolname=current_user",
    );
    assert.equal(proof.rows[0]!.username, project.runtimeRole);
    assert.equal(proof.rows[0]!.administrative, false);
  } finally {
    await principal.end();
  }
  const { runtimeOptions } = await import(
    pathToFileURL(join(project.root, ".loom/generations", project.version, "runtime.js")).href
  );
  const runtime = await createRpcRuntime({
    ...runtimeOptions(),
    metadataNamespace: project.metadataNamespace,
    connectionString: project.runtimeConnectionString,
    deployment: project.runtimeRole,
    auth: defineRpcAuth({ authorize: async () => {} }),
    assertActive: async (signal) => signal.throwIfAborted(),
  });
  try {
    const route = getRouter(runtime.router, ["tasks", "list"]);
    assert(route instanceof Procedure);
    const invocation = { requestId: project.runtimeRole, identity: null, signal: new AbortController().signal };
    const result = await call(route, undefined, {
      context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
      path: ["tasks", "list"],
    });
    const scope = v.strictObject({
      nativeVersion: v.string(),
      effectSame: v.literal(true),
      safetyRejected: v.literal(true),
    });
    const actual = v.parse(v.strictObject({ host: scope, child: scope }), result);
    for (const scope of [actual.host, actual.child]) {
      assert.equal(scope.nativeVersion, "3.8.0");
      assert.equal(scope.effectSame, true);
      assert.equal(scope.safetyRejected, true);
    }
  } finally {
    await runtime.stop();
  }
  const api = bindings.extensions.pgrouting,
    spatial = bindings.extensions.postgis;
  assert.equal(Object.keys(api.sql.overloads).length, 223);
  assert.equal(Object.keys(api.sql.rows).length, 208);
  assert.equal("pgr_createtopology" in api.sql.functions, false);
  assert.equal("_pgr_alphashape" in api.sql.functions, false);
  for (const call of [
    api.pgrAlphashape,
    api.sql.functions.pgr_alphashape,
    api.sql.overloads["routine:$extension:pgrouting.pgr_alphashape($extension:postgis.geometry,pg_catalog.float8)"],
  ])
    assert.throws(() => call(null), /verified native repair/);
  const client = new pg.Client({ connectionString: project.connectionString });
  await client.connect();
  let operatorMembers = 0;
  try {
    await client.query("CREATE SCHEMA fixture");
    await client.query(
      `SET search_path TO fixture,${pg.escapeIdentifier(api.schema)},${pg.escapeIdentifier(spatial.schema)},pg_catalog`,
    );
    await client.query(
      `CREATE TABLE fixture.edges(id bigint,source bigint,target bigint,the_geom ${pg.escapeIdentifier(spatial.schema)}.geometry,oneway text)`,
    );
    await client.query(
      `INSERT INTO fixture.edges VALUES (1,1,2,${pg.escapeIdentifier(spatial.schema)}.st_geomfromtext('LINESTRING(0 0,1 0)'),'B'),(2,2,3,${pg.escapeIdentifier(spatial.schema)}.st_geomfromtext('LINESTRING(1 0,2 0)'),'B')`,
    );
    await withPgroutingOperations(project.connectionString, api, spatial, async (session) => {
      const ids = { dimensions: [{ lowerBound: 1, length: 1 }], values: ["B"] };
      for (const operation of [
        () => session.pgrCreatetopology("fixture.edges", 0.01),
        () => session.pgrCreateverticestable("fixture.edges"),
        () => session.pgrAnalyzegraph("fixture.edges", 0.01),
        () => session.pgrAnalyzeoneway("fixture.edges", ids, ids, ids, ids),
        () => session.pgrNodenetwork("fixture.edges", 0.01),
      ]) {
        assert.equal(await operation(), "OK");
        operatorMembers++;
      }
    });
    for (const table of ["edges_vertices_pgr", "edges_noded"]) {
      const proof = await client.query<{ count: number }>(`SELECT count(*)::int AS count FROM fixture.${table}`);
      assert(proof.rows[0]!.count > 0);
    }
  } finally {
    await client.end();
  }
  results.push({
    selection: project.selection,
    generatedRuntime: true,
    hostMountedRpc: true,
    operatorMembers,
    runtimePrincipal: project.runtimeRole,
    runtimeNonAdministrative: true,
  });
}
await writeFile(
  join(root, "cold-node24-result.json"),
  JSON.stringify({ results, nativeRepair: "blocked", fullMemberAcceptance: false }, null, 2) + "\n",
);
console.log("Cold Node24 public generated runtime, host/mounted RPC/Effect, and five operator members passed");
