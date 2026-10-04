import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import pg from "pg";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";

type AnonGeneratedResult =
  | { version: "2.5.1"; placement: string; email: string; child: "2.5.1" }
  | { mode: "empty" | "future"; child: "empty" | "future" };

export async function prepareAnonGeneratedRpc(connectionString: string) {
  assert(["127.0.0.1", "localhost"].includes(new URL(connectionString).hostname));
  const runtimeRole = `anon_gen_${randomUUID().replaceAll("-", "")}`;
  const metadataNamespace = `loom_anon_${randomUUID().replaceAll("-", "")}`;
  const { bootstrapDatabase } = await import("kello/tooling");
  await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
  return { runtimeRole, metadataNamespace };
}

/** Execute the emitted runtime, including mounted RPC and generated Effect context. */
export async function runAnonGeneratedRpc(
  root: string,
  version: string,
  connectionString: string,
  placement: string,
  prepared: { runtimeRole: string; metadataNamespace: string },
  expected: AnonGeneratedResult = { version: "2.5.1", placement, email: "da******@gm******.com", child: "2.5.1" },
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
    assert.deepEqual(
      (
        await client.query(
          "SELECT extversion,extnamespace::regnamespace::text AS schema FROM pg_catalog.pg_extension WHERE extname='anon'",
        )
      ).rows[0],
      { extversion: "2.5.1", schema: placement },
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
    assert.deepEqual(actual, expected);
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
      } finally {
        await client.end();
      }
    }
  }
}
