import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";

assert.equal(process.versions.node.split(".")[0], "24");
const [root, version, connectionString] = process.argv.slice(2);
assert(root && version && connectionString);
const { runtimeOptions } = await import(pathToFileURL(join(root, ".loom/generations", version, "runtime.js")).href);
const runtime = await createRpcRuntime({
  ...runtimeOptions(),
  connectionString,
  deployment: "postgis-node24",
  auth: defineRpcAuth({ authorize: async () => {} }),
  assertActive: async (signal) => signal.throwIfAborted(),
});
try {
  const route = getRouter(runtime.router, ["spatial", "native"]);
  assert(route instanceof Procedure);
  const invocation = { requestId: "postgis-node24", identity: null, signal: new AbortController().signal };
  const actual = await call(route, undefined, {
    context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
    path: ["spatial", "native"],
  });
  assert.equal(actual.planar, 5);
  assert.equal(actual.meters, 110574.3885578);
  assert.equal(actual.srid, 4326);
  assert.equal(actual.dimensions, "XYZM");
  assert.equal(actual.effectSame, true);
  console.log(
    JSON.stringify({ coldNodeMajor: 24, nativeCompiledRpcEffect: true, planar: actual.planar, meters: actual.meters }),
  );
} finally {
  await runtime.stop();
}
