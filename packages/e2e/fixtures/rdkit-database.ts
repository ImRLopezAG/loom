import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { appendFileSync } from "node:fs";
import pg from "pg";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
const requiredVersion = "4.8.0";

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

/** Disposable local PostgreSQL 18 fixture. Installs only captured rdkit 4.8.0. Never substitutes another version. */
export async function withRdkitDatabase(operation: (url: string) => Promise<void>) {
  if (!connectionString)
    throw new Error(
      "rdkit 4.8.0 native oracle requires LOOM_TEST_DATABASE_URL. This is not a five-gate pass and does not authorize Neon.",
    );
  const admin = new pg.Client({ connectionString });
  const name = `loom_rdkit_${crypto.randomUUID().replaceAll("-", "")}`;
  const url = new URL(connectionString);
  url.pathname = `/${name}`;
  try {
    await admin.connect();
    const major = Math.floor(Number((await admin.query("SHOW server_version_num")).rows[0]!.server_version_num) / 10000);
    if (major !== 18)
      throw new Error(`rdkit 4.8.0 native oracle requires PostgreSQL 18, observed major ${major}`);
    const available = await admin.query<{ version: string }>(
      "SELECT version FROM pg_available_extension_versions WHERE name='rdkit' ORDER BY version",
    );
    const versions = available.rows.map((row) => row.version);
    if (!versions.includes(requiredVersion))
      throw new Error(
        `Exact rdkit ${requiredVersion} is not an available PostgreSQL extension version. Observed: ${versions.join(",") || "none"}. Do not substitute another cartridge version. Parent must execute this harness against the Neon provider binary.`,
      );
    let attempted = false;
    let operationError: unknown;
    try {
      recordFixture("attempted", name);
      attempted = true;
      await admin.query(`CREATE DATABASE ${quoteIdentifier(name)}`);
      recordFixture("created", name);
      const client = new pg.Client({ connectionString: url.href });
      await client.connect();
      try {
        await client.query(`CREATE EXTENSION rdkit VERSION '${requiredVersion}'`);
        const installed = (await client.query("SELECT extversion FROM pg_extension WHERE extname='rdkit'")).rows[0]
          ?.extversion;
        if (installed !== requiredVersion)
          throw new Error(`Installed rdkit ${installed} is not captured 4.8.0; refusing substituted acceptance`);
      } finally {
        await client.end();
      }
      await operation(url.href);
    } catch (error) {
      operationError = error;
    }
    let dropError: unknown;
    try {
      await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(name)} WITH (FORCE)`);
      if (attempted) recordFixture("dropped", name);
    } catch (error) {
      if (attempted) recordFixture("drop-failed", name);
      dropError = error;
    }
    if (operationError) throw operationError;
    if (dropError) throw dropError;
  } finally {
    await admin.end();
  }
}
