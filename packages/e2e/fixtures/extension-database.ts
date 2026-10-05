import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";
import pg from "pg";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
const connectionString = process.env.LOOM_TEST_DATABASE_URL;

/**
 * Test-only ownership events. When a proof host supplies LOOM_EXTENSION_PROOF_FIXTURE_OUTPUT (and the run id), the
 * unique fixture name this helper allocates is recorded as `attempted` BEFORE the CREATE DATABASE query is sent, so a
 * creation whose acknowledgement is lost is still inspectable; `created` and `dropped` (or `drop-failed`) follow only
 * after the corresponding statement was acknowledged. Events are scoped to the run and identified by exact name and
 * sha256. The host inspects every attempted name in an independent catalog read, even when the child failed, and lets
 * only confirmed created-and-dropped fixtures back a successful receipt. They make no claim about any other database
 * or about concurrent runs.
 */
function recordFixture(kind: "attempted" | "created" | "dropped" | "drop-failed", name: string): void {
  const output = process.env.LOOM_EXTENSION_PROOF_FIXTURE_OUTPUT;
  if (!output) return;
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  assert(runId, "Fixture ownership events need the proof run ID");
  const sha256 = createHash("sha256").update(name).digest("hex");
  appendFileSync(output, JSON.stringify({ runId, kind, name, sha256 }) + "\n", { mode: 0o600 });
}

export async function withExtensionDatabase(operation: (url: string) => Promise<void>) {
  if (!connectionString) throw new Error("Missing PostgreSQL 18 extension fixture");
  const admin = new pg.Client({ connectionString });
  const name = `loom_ext_${crypto.randomUUID().replaceAll("-", "")}`;
  const url = new URL(connectionString);
  url.pathname = `/${name}`;
  // The admin session is always ended, including after a failed connect or a failed DROP.
  try {
    await admin.connect();
    let attempted = false;
    try {
      const binaries = await admin.query<{ name: string }>(
        "SELECT DISTINCT name FROM pg_available_extension_versions WHERE name=ANY($1::name[])",
        [["pg_trgm", "citext", "hstore", "uuid-ossp", "cube", "earthdistance"]],
      );
      assert.equal(binaries.rowCount, 6, "The PostgreSQL 18 fixture must include contrib extension binaries");
      // Recorded before the statement is sent: an unacknowledged CREATE must still leave its name inspectable.
      recordFixture("attempted", name);
      attempted = true;
      await admin.query(`CREATE DATABASE ${quoteIdentifier(name)}`);
      recordFixture("created", name);
      await operation(url.href);
    } finally {
      try {
        await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(name)} WITH (FORCE)`);
        if (attempted) recordFixture("dropped", name);
      } catch (error) {
        if (attempted) recordFixture("drop-failed", name);
        throw error;
      }
    }
  } finally {
    await admin.end();
  }
}
