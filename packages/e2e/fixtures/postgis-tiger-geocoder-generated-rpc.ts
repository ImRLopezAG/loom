import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import pg from "pg";
import * as v from "valibot";
import {
  POSTGIS_TIGER_ADDRESS,
  POSTGIS_TIGER_FIXED_SCHEMA,
  POSTGIS_TIGER_LINE,
  POSTGIS_TIGER_NORMALIZED,
  POSTGIS_TIGER_POINT,
  POSTGIS_TIGER_PRETTY,
} from "./postgis-tiger-geocoder-generated-project.ts";
import type { startPostgisTigerGeocoderOwnedPg } from "./postgis-tiger-geocoder-owned-pg.ts";

function quote(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

/** Execute emitted host/mounted runtime against the owned local fixture. Source emitters do not qualify. */
export async function runPostgisTigerGeocoderGeneratedRpc(
  root: string,
  version: string,
  connectionString: string,
  postgisSchema: string,
  journal: Awaited<ReturnType<typeof startPostgisTigerGeocoderOwnedPg>>["journal"],
) {
  assert.equal(new URL(connectionString).hostname, "127.0.0.1");
  const { createRpcRuntime, defineRpcAuth, Invocation } = await import("kello/server");
  const { bootstrapDatabase } = await import("kello/tooling");
  const { runtimeOptions } = await import(pathToFileURL(join(root, ".loom/generations", version, "runtime.js")).href);
  const options = runtimeOptions();
  const mounted = options.scopes.find((scope: { name: string }) => scope.name === "tiger");
  assert(mounted);
  assert.deepEqual(Object.keys(mounted.extensions).sort(), ["postgis", "postgis_tiger_geocoder"]);
  assert.equal(mounted.extensions.postgis_tiger_geocoder.schema, POSTGIS_TIGER_FIXED_SCHEMA);
  assert.equal(mounted.extensions.postgis.schema, postgisSchema);
  const runtimeRole = `tiger_${randomUUID().replaceAll("-", "")}`;
  const metadataNamespace = `loom_tiger_${randomUUID().replaceAll("-", "")}`;
  const client = new pg.Client({ connectionString });
  let runtime: Awaited<ReturnType<typeof createRpcRuntime>> | undefined;
  try {
    await client.connect();
    await journal("runtime-ddl-intent", { runtimeRole, metadataNamespace, postgisSchema });
    await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
    runtime = await createRpcRuntime({
      ...options,
      metadataNamespace,
      connectionString,
      deployment: runtimeRole,
      auth: defineRpcAuth({ authorize: async () => {} }),
      assertActive: async (signal) => signal.throwIfAborted(),
    });
    const route = getRouter(runtime.router, ["tasks", "list"]);
    assert(route instanceof Procedure);
    const invocation = { requestId: runtimeRole, identity: null, signal: new AbortController().signal };
    const response = await call(route, undefined, {
      context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
      path: ["tasks", "list"],
    });
    const scopeSchema = v.strictObject({
      version: v.literal("3.6.4"),
      tigerSchema: v.literal("tiger"),
      postgisSchema: v.string(),
      effectSame: v.literal(true),
      normalized: v.nullable(
        v.strictObject({
          address: v.nullable(v.number()),
          predirabbrev: v.nullable(v.string()),
          streetname: v.nullable(v.string()),
          streettypeabbrev: v.nullable(v.string()),
          postdirabbrev: v.nullable(v.string()),
          internal: v.nullable(v.string()),
          location: v.nullable(v.string()),
          stateabbrev: v.nullable(v.string()),
          zip: v.nullable(v.string()),
          parsed: v.nullable(v.boolean()),
          zip4: v.nullable(v.string()),
          address_alphanumeric: v.nullable(v.string()),
        }),
      ),
      pretty: v.nullable(v.string()),
      debugSetting: v.nullable(v.string()),
      utmzone: v.nullable(v.number()),
      interpolate: v.nullable(v.string()),
      geocodeCount: v.number(),
      reverse: v.strictObject({ intpt: v.null(), addy: v.null(), street: v.null() }),
      stateLookupCount: v.number(),
      emptyAddrCount: v.number(),
    });
    const actual = v.parse(v.strictObject({ host: scopeSchema, child: scopeSchema }), response);
    const nativeInterpolate = await client.query<{ value: string }>(
      `SELECT ${quote(postgisSchema)}.st_asewkt(tiger.interpolate_from_address(15,'10','20',$1::${quote(postgisSchema)}.geometry)) AS value`,
      [POSTGIS_TIGER_LINE],
    );
    const nativeZone = await client.query<{ value: number }>(
      `SELECT tiger.utmzone($1::${quote(postgisSchema)}.geometry) AS value`,
      [POSTGIS_TIGER_POINT],
    );
    for (const scope of [actual.host, actual.child]) {
      assert.equal(scope.version, "3.6.4");
      assert.equal(scope.tigerSchema, POSTGIS_TIGER_FIXED_SCHEMA);
      assert.equal(scope.postgisSchema, postgisSchema);
      assert.equal(scope.effectSame, true);
      assert.deepEqual(scope.normalized, POSTGIS_TIGER_NORMALIZED);
      assert.equal(scope.pretty, POSTGIS_TIGER_PRETTY);
      assert.equal(scope.debugSetting, "false");
      assert.equal(scope.utmzone, nativeZone.rows[0]?.value);
      assert.equal(scope.utmzone, 32619);
      const interpolateEwkt = await client.query<{ value: string }>(
        `SELECT ${quote(postgisSchema)}.st_asewkt($1::${quote(postgisSchema)}.geometry) AS value`,
        [scope.interpolate],
      );
      assert.equal(interpolateEwkt.rows[0]?.value, nativeInterpolate.rows[0]?.value);
      assert.equal(scope.geocodeCount, 0);
      assert.deepEqual(scope.reverse, { intpt: null, addy: null, street: null });
      assert.equal(scope.stateLookupCount, 59);
      assert.equal(scope.emptyAddrCount, 0);
    }
    await journal("generated-rpc-proven", {
      postgisSchema,
      tigerSchema: POSTGIS_TIGER_FIXED_SCHEMA,
      hostMounted: true,
      effect: true,
      address: POSTGIS_TIGER_ADDRESS,
      loaderExecuted: false,
    });
  } finally {
    try {
      await runtime?.stop();
    } finally {
      try {
        await journal("runtime-cleanup-ddl-intent", { runtimeRole, metadataNamespace });
        const exists = await client.query("SELECT 1 FROM pg_roles WHERE rolname=$1", [runtimeRole]);
        if (exists.rows.length) {
          const role = pg.escapeIdentifier(runtimeRole);
          await client.query(`GRANT ${role} TO CURRENT_USER; DROP OWNED BY ${role}; DROP ROLE ${role}`);
        }
        await client.query(`DROP SCHEMA IF EXISTS ${pg.escapeIdentifier(metadataNamespace)} CASCADE`);
        const leftoverRole = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [runtimeRole]);
        assert.equal(leftoverRole.rows.length, 0, `Owned tiger role ${runtimeRole} is still present`);
        const leftoverSchema = await client.query("SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname=$1", [
          metadataNamespace,
        ]);
        assert.equal(
          leftoverSchema.rows.length,
          0,
          `Owned tiger metadata schema ${metadataNamespace} is still present`,
        );
        await journal("independent-absence-proven", { runtimeRole, metadataNamespace });
      } finally {
        await client.end();
      }
    }
  }
}
