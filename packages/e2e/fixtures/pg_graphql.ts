import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";
import pg from "pg";
import { defineRelations } from "drizzle-orm";
import { createPgGraphql_1_5_12 } from "../../../apps/loom/src/core/extensions/adapters/pg_graphql";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase, type DatabaseConnection } from "../../../apps/loom/src/core/server/database/connection";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";

function recordFixture(kind: "attempted" | "created" | "dropped" | "drop-failed", name: string): void {
  const output = process.env.LOOM_EXTENSION_PROOF_FIXTURE_OUTPUT;
  if (!output) return;
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  assert(runId, "Fixture ownership events need the proof run ID");
  appendFileSync(
    output,
    JSON.stringify({ runId, kind, name, sha256: createHash("sha256").update(name).digest("hex") }) + "\n",
    { mode: 0o600 },
  );
}

export function recordPgGraphqlRole(name: string): void {
  const output = process.env.LOOM_EXTENSION_PROOF_ROLE_OUTPUT;
  if (!output) return;
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  assert(runId, "Role ownership events need the proof run ID");
  appendFileSync(
    output,
    JSON.stringify({ runId, name, sha256: createHash("sha256").update(name).digest("hex") }) + "\n",
    { mode: 0o600 },
  );
}

export const pgGraphqlSchema = "graphql";
export const pgGraphqlDigest = "a64a8bd702ab1dad6e9b171e6f5cc61ec54c2e31411da5d7c6aec86933538d5f";
export const pgGraphqlApi = createPgGraphql_1_5_12({
  name: "pg_graphql",
  version: "1.5.12",
  schema: pgGraphqlSchema,
  apiSupport: { status: "verified", digest: pgGraphqlDigest },
});
const schema = defineSchema(() => ({}));
const relations = defineRelations(schema.tables);

/**
 * Disposable UUID database on a local PostgreSQL 18 fixture that already has pg_graphql 1.5.12.
 * It is not a Neon provider gate and does not use the shared contrib-extension helper.
 */
export async function withPgGraphqlApi(
  work: (fixture: {
    url: string;
    client: pg.Client;
    connection: DatabaseConnection<typeof relations>;
    api: typeof pgGraphqlApi;
  }) => Promise<void>,
): Promise<void> {
  const connectionString = process.env.LOOM_TEST_DATABASE_URL;
  if (!connectionString) throw new Error("Missing PostgreSQL 18 pg_graphql fixture");
  const database = `loom_ext_${crypto.randomUUID().replaceAll("-", "")}`;
  const admin = new pg.Client({ connectionString });
  await admin.connect();
  let attempted = false;
  try {
    recordFixture("attempted", database);
    attempted = true;
    await admin.query(`CREATE DATABASE ${quoteIdentifier(database)}`);
    recordFixture("created", database);
    const url = new URL(connectionString);
    url.pathname = `/${database}`;
    const client = new pg.Client({ connectionString: url.href });
    await client.connect();
    try {
      await client.query("CREATE EXTENSION pg_graphql VERSION '1.5.12'");
      await client.query(
        "CREATE TABLE public.account(id bigint PRIMARY KEY, name text, balance numeric, big bigint); COMMENT ON TABLE public.account IS e'@graphql({\"totalCount\": {\"enabled\": true}})'",
      );
      await client.query(
        "INSERT INTO public.account VALUES (1,'a',12345678901234567890.123456789,9007199254740993),(2,NULL,NULL,NULL)",
      );
      const connection = await connectDatabase({ schema, relations, connectionString: url.href });
      try {
        await work({ url: url.href, client, connection, api: pgGraphqlApi });
      } finally {
        await connection.close();
      }
    } finally {
      await client.end();
    }
  } finally {
    try {
      await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(database)} WITH (FORCE)`);
      if (attempted) recordFixture("dropped", database);
    } catch (error) {
      if (attempted) recordFixture("drop-failed", database);
      throw error;
    }
    await admin.end();
  }
}
