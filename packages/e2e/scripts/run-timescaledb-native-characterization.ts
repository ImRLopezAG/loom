import { writeFileSync } from "node:fs";
import pg from "pg";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
import { characterizeTimescaledb } from "../fixtures/timescaledb-native";

/**
 * Native characterization of TimescaleDB 2.24.0 (Apache license) on a disposable PostgreSQL 18 fixture whose server
 * preloads timescaledb. It creates and force-drops its own UUID database and writes one JSON receipt (see
 * fixtures/timescaledb-native.ts). It is not a Neon provider gate.
 *
 *   LOOM_TEST_DATABASE_URL=postgresql://... bun packages/e2e/scripts/run-timescaledb-native-characterization.ts [out]
 */
const connectionString = process.env.LOOM_TEST_DATABASE_URL;
if (!connectionString) throw new Error("Missing PostgreSQL 18 TimescaleDB fixture");
const output = process.argv[2] ?? "packages/e2e/fixtures/timescaledb-native-characterization.json";
const runId = crypto.randomUUID();
const suffix = runId.replaceAll("-", "");
const database = `loom_ext_${suffix}`;
const admin = new pg.Client({ connectionString });
await admin.connect();
let receipt: Awaited<ReturnType<typeof characterizeTimescaledb>>;
try {
  // template0 excludes images whose template1 preinstalls the extension.
  await admin.query(`CREATE DATABASE ${quoteIdentifier(database)} TEMPLATE template0`);
  const url = new URL(connectionString);
  url.pathname = `/${database}`;
  const client = new pg.Client({ connectionString: url.href });
  await client.connect();
  try {
    receipt = await characterizeTimescaledb(client, "extensions", suffix);
  } finally {
    await client.end();
  }
} finally {
  await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(database)} WITH (FORCE)`);
  await admin.end();
}
writeFileSync(
  output,
  JSON.stringify({ runId, database, extension: "timescaledb", version: "2.24.0", ...receipt }, null, 1) + "\n",
);
console.log(JSON.stringify({ output, runId, members: Object.keys(receipt.members).length }));
