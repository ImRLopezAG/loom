import assert from "node:assert/strict";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import pg from "pg";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";
import * as v from "valibot";
import { DATA_US_SEEDS } from "./address-standardizer-data-us-generated-project.ts";
import type { startDataUsOwnedPg } from "./address-standardizer-data-us-owned-pg.ts";
import type { DataUsPreparedRuntime } from "./address-standardizer-data-us-preparation.ts";

const lexicalRow = v.strictObject({
  id: v.number(),
  seq: v.nullable(v.number()),
  word: v.nullable(v.string()),
  stdword: v.nullable(v.string()),
  token: v.nullable(v.number()),
  is_custom: v.boolean(),
});
const scopeResult = v.strictObject({
  version: v.literal("3.6.4"),
  placement: v.string(),
  effectSame: v.literal(true),
  lex: v.array(lexicalRow),
  gaz: v.array(lexicalRow),
  rules: v.array(v.strictObject({ id: v.number(), rule: v.nullable(v.string()), is_custom: v.boolean() })),
});
const resultSchema = v.strictObject({ host: scopeResult, child: scopeResult });

/** Runs emitted JS in Node 24 or Bun. Compares every typed host/mounted seed column with native rows. */
export async function runDataUsGeneratedRpc(
  root: string,
  version: string,
  prepared: DataUsPreparedRuntime,
  placement: string,
  journal: Awaited<ReturnType<typeof startDataUsOwnedPg>>["journal"],
) {
  const { connectionString, metadataNamespace, runtimeRole } = prepared;
  assert.equal(new URL(connectionString).hostname, "127.0.0.1");
  const { runtimeOptions } = await import(pathToFileURL(join(root, ".loom/generations", version, "runtime.js")).href);
  const options = runtimeOptions();
  const mounted = options.scopes.find((scope: { name: string }) => scope.name === "dataus");
  assert(mounted);
  assert.deepEqual(Object.keys(mounted.extensions), ["address_standardizer_data_us"]);
  assert.equal(mounted.extensions.address_standardizer_data_us.schema, placement);
  const client = new pg.Client({ connectionString });
  let runtime: Awaited<ReturnType<typeof createRpcRuntime>> | undefined;
  try {
    await client.connect();
    const authority = await client.query<{ current_user: string; unsafe: boolean }>(
      "SELECT current_user, rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls AS unsafe FROM pg_roles WHERE rolname=current_user",
    );
    assert.deepEqual(authority.rows, [{ current_user: runtimeRole, unsafe: false }]);
    runtime = await createRpcRuntime({
      ...options,
      metadataNamespace,
      connectionString,
      deployment: runtimeRole,
      // Both complete native corpora total 1,316,280 bytes; retain every row under the existing runtime option.
      config: { realtime: { maxResultBytes: 2097152 } },
      auth: defineRpcAuth({ authorize: async () => {} }),
      assertActive: async (signal) => signal.throwIfAborted(),
    });
    const route = getRouter(runtime.router, ["tasks", "list"]);
    assert(route instanceof Procedure);
    const invocation = { requestId: runtimeRole, identity: null, signal: new AbortController().signal };
    const actual = v.parse(
      resultSchema,
      await call(route, undefined, {
        context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
        path: ["tasks", "list"],
      }),
    );
    for (const scope of [actual.host, actual.child]) {
      assert.equal(scope.version, "3.6.4");
      assert.equal(scope.placement, placement);
      assert.equal(scope.effectSame, true);
      for (const seed of DATA_US_SEEDS) {
        const relation = `${pg.escapeIdentifier(placement)}.${pg.escapeIdentifier(seed.name)}`;
        const native = await client.query(`SELECT * FROM ${relation} ORDER BY id`);
        const fingerprint = await client.query(
          `SELECT count(*)::int AS count, count(*) FILTER (WHERE is_custom)::int AS custom, md5(string_agg(row_to_json(t)::text, E'\\n' ORDER BY id)) AS hash FROM ${relation} t`,
        );
        assert.deepEqual(fingerprint.rows, [{ count: seed.count, custom: 0, hash: seed.hash }]);
        assert.deepEqual(
          scope[seed.name === "us_lex" ? "lex" : seed.name === "us_gaz" ? "gaz" : "rules"],
          native.rows,
          `Every ${seed.name} seed column through generated RPC`,
        );
      }
    }
    await journal("generated-rpc-proven", {
      placement,
      hostMounted: true,
      effect: true,
      typedSeeds: 8383,
      administrativeRpcCredentials: false,
    });
  } finally {
    try {
      await runtime?.stop();
    } finally {
      await client.end();
    }
  }
}
