import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import * as v from "valibot";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/ltree.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";

// Local, read-only-output characterization: every captured routine and operator is called directly with literal
// operands in a disposable database, and the native result or SQLSTATE is recorded. No Kello codec is involved.
// Supply the authorized local fixture through LOOM_TEST_DATABASE_URL; Neon is never contacted.
const connectionString = process.env.LOOM_TEST_DATABASE_URL;
assert(connectionString, "Missing authorized local PostgreSQL fixture");
const address = new URL(connectionString);
assert(["127.0.0.1", "localhost", "[::1]"].includes(address.hostname), "Local fixture required; no Neon execution");
const output = fileURLToPath(new URL("../fixtures/ltree-native-characterization.json", import.meta.url));
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const schema = 'Ltree "Q';
const quotedSchema = pg.escapeIdentifier(schema);
const samples = {
  "$extension:ltree.ltree": ["'Top.Science.Astronomy'", "'Top.Science'", "'Top.Science.Astronomy.Stars'"],
  "$extension:ltree._ltree": ["'{Top.Science,Top.Arts}'", "'{Top.Collections.Pictures,Top.Science}'"],
  "$extension:ltree.lquery": ["'*.Science.*'"],
  "$extension:ltree._lquery": ["'{*.Arts,*.Science}'"],
  "$extension:ltree.ltxtquery": ["'Astro* & !Arts'"],
  "pg_catalog.text": ["'Leaf'"],
  "pg_catalog.int4": ["1", "2", "3"],
  "pg_catalog.int8": ["7"],
  "pg_catalog.cstring": ["'Top.Science'"],
  "$extension:ltree.ltree_gist": ["NULL"],
  "pg_catalog.internal": ["NULL"],
  "pg_catalog.int2": ["NULL"],
  "pg_catalog.oid": ["NULL"],
} satisfies Readonly<Record<string, readonly string[]>>;
function reference(type: { readonly namespace: string | null; readonly name: string }): string {
  return `${type.namespace}.${type.name}`;
}
function sqlType(type: { readonly namespace: string | null; readonly name: string }): string {
  return type.namespace === "$extension:ltree"
    ? `${quotedSchema}.${pg.escapeIdentifier(type.name)}`
    : `pg_catalog.${pg.escapeIdentifier(type.name)}`;
}
function operand(type: { readonly namespace: string | null; readonly name: string }, position: number): string {
  const values = Object.entries(samples).find(([name]) => name === reference(type))?.[1];
  assert(values, `No characterization sample for ${reference(type)}`);
  return `${values[position % values.length]}::${sqlType(type)}`;
}
const admin = new pg.Client({ connectionString });
const database = `loom_ltree_${randomUUID().replaceAll("-", "")}`;
await admin.connect();
const observations: { member: string; sql: string; result?: string | null; sqlstate?: string; message?: string }[] = [];
try {
  const server = await admin.query("select current_setting('server_version_num')::int version");
  assert.equal(Math.floor(server.rows[0]!.version / 10000), 18);
  await admin.query(`create database ${pg.escapeIdentifier(database)}`);
  const url = new URL(connectionString);
  url.pathname = `/${database}`;
  const client = new pg.Client({ connectionString: url.href });
  await client.connect();
  try {
    await client.query(`create schema ${quotedSchema}; create extension ltree schema ${quotedSchema} version '1.3'`);
    const version = await client.query("select extversion from pg_extension where extname='ltree'");
    assert.equal(version.rows[0]!.extversion, "1.3");
    async function observe(member: string, statement: string) {
      try {
        const result = await client.query({ text: `select (${statement})::text as value`, rowMode: "array" });
        observations.push({ member, sql: statement, result: result.rows[0]![0] });
      } catch (error) {
        const failure = v.parse(v.object({ code: v.string(), message: v.string() }), error);
        observations.push({ member, sql: statement, sqlstate: failure.code, message: failure.message });
      }
    }
    for (const member of manifest.contract.members) {
      if (member.kind === "routine") {
        const call = `${quotedSchema}.${pg.escapeIdentifier(member.name)}(${member.arguments
          .map((argument, index) => operand(argument.type, index))
          .join(", ")})`;
        await observe(member.id, call);
      } else if (member.kind === "operator") {
        assert(member.left && member.right);
        await observe(
          member.id,
          `${operand(member.left, 0)} operator(${quotedSchema}.${member.name}) ${operand(member.right, 1)}`,
        );
      }
    }
  } finally {
    await client.end();
  }
} finally {
  await admin.query(`drop database if exists ${pg.escapeIdentifier(database)} with (force)`);
  await admin.end();
}
const routines = manifest.contract.members.filter((member) => member.kind === "routine").length;
const operators = manifest.contract.members.filter((member) => member.kind === "operator").length;
assert.equal(observations.length, routines + operators);
writeFileSync(
  output,
  JSON.stringify(
    { format: 1, extension: "ltree", version: "1.3", digest: manifest.digest, schema, observations },
    null,
    2,
  ) + "\n",
);
console.log(`${observations.length} native observations written`);
