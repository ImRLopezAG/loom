// Run with cold Node 24 after Bun generation and administrative preparation.
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";
import { createPostgisRaster_3_6_4, PostgisRasterNativeSafetyError } from "kello/extensions/postgis-raster";

const [prepared, output] = process.argv.slice(2);
assert(prepared && output, "usage: <prepared-local-fixture.json> <output.json>");
assert.match(process.version, /^v24\./);
assert.equal("Bun" in globalThis, false);
const projects = JSON.parse(await readFile(prepared, "utf8"));
const results = [];
const rejectedMembers = [
  "routine:$extension:postgis_raster.st_setgeotransform($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog._float8)",
  "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)",
];
for (const project of projects) {
  const api = createPostgisRaster_3_6_4(
    {
      name: "postgis_raster",
      version: "3.6.4",
      schema: project.placement,
      apiSupport: { status: "verified", digest: "8f7cd8fe4d832fcc153344cc70b5693f79fa29acb1a6b7f97c0c3de31943def2" },
    },
    {
      name: "postgis",
      version: "3.6.4",
      schema: project.placement,
      apiSupport: { status: "verified", digest: "640e798698403a7115f41d3c4e5106917cef0f9dc896b6078f3bd068f3b60d29" },
    },
  );
  const calls = [
    () => api.sql.functions.st_setgeotransform(null, 1, 1, 0, Math.PI / 2, 10, 20),
    () => api.sql.overloads[rejectedMembers[1]](null, null),
    () =>
      api.sql.functions.st_approxquantile["($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)"](
        null,
        true,
      ),
  ];
  for (const [index, call] of calls.entries()) {
    assert.throws(
      call,
      (error) =>
        error instanceof PostgisRasterNativeSafetyError &&
        error.member === rejectedMembers[index] &&
        error.code === "POSTGIS_RASTER_NATIVE_REPAIR_REQUIRED",
    );
  }
  const { runtimeOptions } = await import(pathToFileURL(project.runtime).href);
  const options = runtimeOptions();
  const runtime = await createRpcRuntime({
    ...options,
    connectionString: project.runtimeUrl,
    deployment: "raster-cold-node24",
    auth: defineRpcAuth({ authorize: async () => {} }),
    assertActive: async (signal) => signal.throwIfAborted(),
  });
  try {
    const route = getRouter(runtime.router, ["tasks", "list"]);
    assert(route instanceof Procedure);
    const invocation = { requestId: "raster-cold-node24", identity: null, signal: new AbortController().signal };
    const actual = await call(route, undefined, {
      context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
      path: ["tasks", "list"],
    });
    for (const result of [actual.host, actual.child]) {
      assert.equal(result.width, 2);
      assert.equal(result.height, 3);
      assert.equal(result.srid, 4326);
      assert.equal(result.pixel, 7);
      assert.equal(result.raster.numBands, 1);
      assert.equal(result.schema, project.placement);
      assert.equal(result.effectSame, true);
      assert.deepEqual(JSON.parse(JSON.stringify(result)), result);
    }
    results.push({
      selection: project.selection,
      placement: project.placement,
      host: actual.host,
      child: actual.child,
      restrictedRole: project.runtimeRole,
      rejectedMembers,
    });
  } finally {
    await runtime.stop();
  }
}
await writeFile(output, JSON.stringify({ node: process.version, bunGlobal: false, results }, null, 2));
console.log(JSON.stringify({ node: process.version, contexts: results.length, hostAndComponent: true }));
