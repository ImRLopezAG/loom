import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import pg from "pg";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";
import { journalPgPartmanResources } from "./pg_partman-local-resources.ts";

export async function preparePgPartmanGeneratedRpc(connectionString: string) {
  assert(["127.0.0.1", "localhost"].includes(new URL(connectionString).hostname));
  const runtimeRole = `partman_gen_${randomUUID().replaceAll("-", "")}`;
  const metadataNamespace = `loom_partman_${randomUUID().replaceAll("-", "")}`;
  await journalPgPartmanResources({ event: "bootstrap-owned", runtimeRole, metadataNamespace });
  // Project tooling is Bun-native; the emitted runtime consumer executes separately in cold Node24.
  const { bootstrapDatabase } = await import("kello/tooling");
  await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
  return { runtimeRole, metadataNamespace };
}

/** Execute the emitted runtime, including mounted RPC and generated Effect context. */
export async function runPgPartmanGeneratedRpc(
  root: string,
  version: string,
  connectionString: string,
  placement: string,
  prepared: { runtimeRole: string; metadataNamespace: string },
): Promise<void> {
  assert(["127.0.0.1", "localhost"].includes(new URL(connectionString).hostname));
  const { runtimeOptions } = await import(pathToFileURL(join(root, ".loom/generations", version, "runtime.js")).href);
  const options = runtimeOptions();
  const { runtimeRole, metadataNamespace } = prepared;
  const client = new pg.Client({ connectionString });
  await client.connect();
  let runtime: Awaited<ReturnType<typeof createRpcRuntime>> | undefined;
  try {
    assert.equal(
      Math.floor(Number((await client.query("SHOW server_version_num")).rows[0]!.server_version_num) / 10000),
      18,
    );
    assert.equal(
      (await client.query("SELECT extversion FROM pg_catalog.pg_extension WHERE extname='pg_partman'")).rows[0]
        ?.extversion,
      "5.1.0",
    );
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
    const actual = await call(route, undefined, {
      context: { ...invocation, operation: "query", "effect/context": Context.make(Invocation, invocation) },
      path: ["tasks", "list"],
    });
    assert.deepEqual(actual, { version: "5.1.0", placement, child: "5.1.0" });
  } finally {
    try {
      await runtime?.stop();
    } finally {
      try {
        const exists = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [runtimeRole]);
        if (exists.rows.length) {
          const role = pg.escapeIdentifier(runtimeRole);
          await client.query(`GRANT ${role} TO CURRENT_USER; DROP OWNED BY ${role}; DROP ROLE ${role}`);
        }
        await client.query(`DROP SCHEMA IF EXISTS ${pg.escapeIdentifier(metadataNamespace)} CASCADE`);
        const observer = new pg.Client({ connectionString });
        await observer.connect();
        try {
          assert.equal(
            (await observer.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [runtimeRole])).rowCount,
            0,
          );
          assert.equal(
            (await observer.query("SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname=$1", [metadataNamespace]))
              .rowCount,
            0,
          );
          await journalPgPartmanResources({ event: "independent-absence-verified", runtimeRole, metadataNamespace });
        } finally {
          await observer.end();
        }
      } finally {
        await client.end();
      }
    }
  }
}
