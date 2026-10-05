import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { appendFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import pg from "pg";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";
import { bootstrapDatabase } from "kello/tooling";
import { H3_CENTER, H3_EDGE_BOUNDARY, H3_INDEX_CELL, H3_INT8, H3_PARENT } from "./h3-generated-project.ts";

function quote(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function journalRole(kind: "attempted" | "created" | "dropped" | "absent", name: string) {
  const output = process.env.LOOM_EXTENSION_PROOF_ROLE_OUTPUT;
  if (!output) return;
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  assert(runId, "Role ownership events need the proof run ID");
  appendFileSync(
    output,
    `${JSON.stringify({ runId, kind, name, sha256: createHash("sha256").update(name).digest("hex") })}\n`,
    { mode: 0o600 },
  );
}

function journalSchema(kind: "attempted" | "created" | "dropped" | "absent", name: string) {
  const output = process.env.LOOM_EXTENSION_PROOF_ROLE_OUTPUT;
  if (!output) return;
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  assert(runId, "Schema ownership events need the proof run ID");
  appendFileSync(
    output,
    `${JSON.stringify({ runId, kind, name, surface: "schema", sha256: createHash("sha256").update(name).digest("hex") })}\n`,
    { mode: 0o600 },
  );
}

export async function provisionH3Placement(connectionString: string, placement: string): Promise<void> {
  assert(["127.0.0.1", "localhost"].includes(new URL(connectionString).hostname), "h3 native proof stays on a local fixture");
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    assert.equal(
      Math.floor(Number((await client.query("SHOW server_version_num")).rows[0]!.server_version_num) / 10000),
      18,
    );
    journalSchema("attempted", placement);
    await client.query(`CREATE SCHEMA ${quote(placement)}`);
    journalSchema("created", placement);
    await client.query(`CREATE EXTENSION h3 WITH SCHEMA ${quote(placement)} VERSION '4.2.3'`);
    const installed = await client.query<{ extversion: string; nspname: string }>(
      `SELECT e.extversion, n.nspname
       FROM pg_catalog.pg_extension e
       JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
       WHERE e.extname = 'h3'`,
    );
    assert.equal(installed.rows[0]?.extversion, "4.2.3");
    assert.equal(installed.rows[0]?.nspname, placement);
  } finally {
    await client.end();
  }
}

/** Execute the emitted host/mounted runtime. Empty h3_cells_to_multi_polygon arrays are never sent. */
export async function runH3GeneratedRpc(root: string, version: string, connectionString: string, placement: string) {
  assert(["127.0.0.1", "localhost"].includes(new URL(connectionString).hostname), "h3 native proof stays on a local fixture");
  const { runtimeOptions } = await import(pathToFileURL(join(root, ".loom/generations", version, "runtime.js")).href);
  const options = runtimeOptions();
  const runtimeRole = `h3_gen_${randomUUID().replaceAll("-", "")}`;
  const metadataNamespace = `loom_h3_${randomUUID().replaceAll("-", "")}`;
  const client = new pg.Client({ connectionString });
  await client.connect();
  let runtime: Awaited<ReturnType<typeof createRpcRuntime>> | undefined;
  journalRole("attempted", runtimeRole);
  journalSchema("attempted", metadataNamespace);
  try {
    const installed = await client.query<{ extversion: string; nspname: string }>(
      `SELECT e.extversion, n.nspname
       FROM pg_catalog.pg_extension e
       JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
       WHERE e.extname = 'h3'`,
    );
    assert.equal(installed.rows[0]?.extversion, "4.2.3");
    assert.equal(installed.rows[0]?.nspname, placement);
    await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
    journalRole("created", runtimeRole);
    journalSchema("created", metadataNamespace);
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
    assert(actual !== null && typeof actual === "object");
    const row = actual as {
      version: unknown;
      placement: unknown;
      child: unknown;
      effectSame: unknown;
      cell: unknown;
      center: unknown;
      edge: unknown;
      parent: unknown;
      contains: unknown;
      area: unknown;
      int8: unknown;
      unsigned: unknown;
      nullParent: unknown;
    };
    assert.equal(row.version, "4.2.3");
    assert.equal(row.placement, placement);
    assert.equal(row.child, "4.2.3");
    assert.equal(row.effectSame, true);
    assert.equal(row.cell, H3_INDEX_CELL);
    assert.deepEqual(row.center, H3_CENTER);
    assert.deepEqual(row.edge, [...H3_EDGE_BOUNDARY]);
    assert.equal(row.parent, H3_PARENT);
    assert.equal(row.contains, true);
    assert.equal(typeof row.area, "number");
    assert.equal(row.int8, H3_INT8);
    assert.equal(row.unsigned, true);
    assert.equal(row.nullParent, null);
  } finally {
    try {
      await runtime?.stop();
    } finally {
      try {
        const roleExists = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [runtimeRole]);
        if (roleExists.rows.length) {
          await client.query(`GRANT ${quote(runtimeRole)} TO CURRENT_USER; DROP OWNED BY ${quote(runtimeRole)}; DROP ROLE ${quote(runtimeRole)}`);
          journalRole("dropped", runtimeRole);
        }
        await client.query(`DROP SCHEMA IF EXISTS ${quote(metadataNamespace)} CASCADE`);
        journalSchema("dropped", metadataNamespace);
        const leftoverRole = await client.query("SELECT 1 FROM pg_catalog.pg_roles WHERE rolname=$1", [runtimeRole]);
        assert.equal(leftoverRole.rows.length, 0, `Owned h3 role ${runtimeRole} is still present`);
        journalRole("absent", runtimeRole);
        const leftoverSchema = await client.query("SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname=$1", [metadataNamespace]);
        assert.equal(leftoverSchema.rows.length, 0, `Owned h3 metadata schema ${metadataNamespace} is still present`);
        journalSchema("absent", metadataNamespace);
      } finally {
        await client.end();
      }
    }
  }
}
