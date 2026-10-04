import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { call, getRouter, Procedure } from "@orpc/server";
import { Context } from "effect";
import pg from "pg";
import * as v from "valibot";
import { createRpcRuntime, defineRpcAuth, Invocation } from "kello/server";
import { bootstrapDatabase } from "kello/tooling";
import {
  ADDRESS_STANDARDIZER_PARSE_FIELDS,
  ADDRESS_STANDARDIZER_STDADDR_FIELDS,
  addressStandardizerFiveExpected,
  addressStandardizerFourExpected,
  addressStandardizerParsedExpected,
} from "./address-standardizer-generated-project.ts";

function assertAllFields(
  value: Record<string, string | null>,
  fields: readonly string[],
  expected: Record<string, string | null>,
  label: string,
) {
  assert.deepEqual(Object.keys(value).sort(), [...fields].sort(), `${label} field names`);
  for (const field of fields) assert.equal(value[field], expected[field], `${label}.${field}`);
}

/** Execute the emitted runtime, including mounted RPC and generated Effect context. */
export async function runAddressStandardizerGeneratedRpc(
  root: string,
  version: string,
  connectionString: string,
  placement: string,
): Promise<void> {
  assert(["127.0.0.1", "localhost"].includes(new URL(connectionString).hostname));
  const { runtimeOptions } = await import(pathToFileURL(join(root, ".loom/generations", version, "runtime.js")).href);
  const options = runtimeOptions();
  const runtimeRole = `addrstd_gen_${randomUUID().replaceAll("-", "")}`;
  const metadataNamespace = `loom_addrstd_${randomUUID().replaceAll("-", "")}`;
  const client = new pg.Client({ connectionString });
  await client.connect();
  let runtime: Awaited<ReturnType<typeof createRpcRuntime>> | undefined;
  try {
    assert.equal(
      Math.floor(Number((await client.query("SHOW server_version_num")).rows[0]!.server_version_num) / 10000),
      18,
    );
    const installed = await client.query<{ extversion: string; nspname: string }>(
      `SELECT e.extversion, n.nspname
       FROM pg_catalog.pg_extension e
       JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
       WHERE e.extname = 'address_standardizer'`,
    );
    assert.equal(installed.rows[0]?.extversion, "3.6.4");
    assert.equal(installed.rows[0]?.nspname, placement);
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
    const actual = v.parse(
      v.strictObject({
        version: v.literal("3.6.4"),
        placement: v.string(),
        child: v.literal("3.6.4"),
        effectSame: v.literal(true),
        debugRultab: v.literal("us_rules"),
        five: v.record(v.string(), v.nullable(v.string())),
        four: v.record(v.string(), v.nullable(v.string())),
        parsed: v.record(v.string(), v.nullable(v.string())),
        debug: v.string(),
        missing: v.null(),
      }),
      response,
    );
    assert.equal(actual.version, "3.6.4");
    assert.equal(actual.placement, placement);
    assert.equal(actual.child, "3.6.4");
    assert.equal(actual.effectSame, true);
    assert.equal(actual.debugRultab, "us_rules");
    assert.equal(actual.missing, null);
    assert.match(actual.debug, /HOUSE|STREET|MAIN/);
    assertAllFields(actual.five, ADDRESS_STANDARDIZER_STDADDR_FIELDS, addressStandardizerFiveExpected, "five");
    assertAllFields(actual.four, ADDRESS_STANDARDIZER_STDADDR_FIELDS, addressStandardizerFourExpected, "four");
    assertAllFields(actual.parsed, ADDRESS_STANDARDIZER_PARSE_FIELDS, addressStandardizerParsedExpected, "parsed");
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
