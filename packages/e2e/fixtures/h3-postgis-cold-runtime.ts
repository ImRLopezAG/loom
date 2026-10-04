import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";
import { H3_POSTGIS_CONFIGURED_PLACEMENT, H3_POSTGIS_DEFAULT_PLACEMENT } from "./h3-postgis-owned-pg.ts";
import { runH3PostgisPackedMembers } from "./h3-postgis-packed-members.ts";

assert.equal(process.versions.node.split(".")[0], "24");
const [root, selection, version] = process.argv.slice(2);
assert(root && (selection === "selected" || selection === "custom") && version);
const placement = selection === "custom" ? H3_POSTGIS_CONFIGURED_PLACEMENT : H3_POSTGIS_DEFAULT_PLACEMENT;
const { runtimeOptions } = await import(pathToFileURL(join(root, ".loom/generations", version, "runtime.js")).href);
const {
  H3_POSTGIS_LOCAL_URL: connectionString,
  H3_POSTGIS_RUNTIME_ROLE: runtimeRole,
  H3_POSTGIS_METADATA_SCHEMA: metadataNamespace,
} = process.env;
assert(connectionString && runtimeRole && metadataNamespace);
assert.equal(new URL(connectionString).hostname, "127.0.0.1");
const options = runtimeOptions();
await runH3PostgisPackedMembers(root, connectionString, placement);
const runtime = await createRpcRuntime({
  ...options,
  connectionString,
  metadataNamespace,
  deployment: runtimeRole,
  auth: defineRpcAuth({ authorize: async () => {} }),
  assertActive: async (signal) => signal.throwIfAborted(),
});
try {
  const route = getRouter(runtime.router, ["tasks", "list"]);
  assert(route instanceof Procedure);
  const invocation = { requestId: runtimeRole, identity: null, signal: new AbortController().signal };
  const result = await call(route, undefined, {
    context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
    path: ["tasks", "list"],
  });
  assert.deepEqual(result, {
    version: "4.2.3",
    placement: placement.h3_postgis,
    child: "4.2.3",
    effectSame: true,
    cell: "89283080dcbffff",
    srid: 4326,
    nullBoundary: null,
  });
  console.log(`cold Node24 ${selection} native host/component RPC/Effect PASS`);
} finally {
  await runtime.stop();
}
