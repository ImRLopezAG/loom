import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import pg from "pg";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";

function record(kind: string, name: string) {
  const output = process.env.LOOM_EXTENSION_PROOF_FIXTURE_OUTPUT;
  if (output) {
    assert(process.env.LOOM_EXTENSION_PROOF_RUN_ID);
    appendFileSync(output, JSON.stringify({ runId: process.env.LOOM_EXTENSION_PROOF_RUN_ID, kind, name }) + "\n", {
      mode: 0o600,
    });
  }
}

/** Own UUID database only; the parent supplies the local/provider target and owns acceptance. */
export async function withPostgisTopologyDatabase<Result>(
  operation: (url: string) => Promise<Result>,
  postgisSchema = "extensions",
): Promise<Result> {
  const connectionString = process.env.LOOM_TEST_DATABASE_URL;
  assert(
    connectionString,
    "Exact PostGIS/topology 3.6.4 requires LOOM_TEST_DATABASE_URL; missing target is a failure, never a skip",
  );
  const admin = new pg.Client({ connectionString });
  const name = `loom_topology_${crypto.randomUUID().replaceAll("-", "")}`;
  const url = new URL(connectionString);
  url.pathname = "/" + name;
  let attempted = false;
  try {
    await admin.connect();
    assert.equal(
      Math.floor(Number((await admin.query("SHOW server_version_num")).rows[0].server_version_num) / 10000),
      18,
    );
    for (const extension of ["postgis", "postgis_topology"]) {
      const available = await admin.query("SELECT version FROM pg_available_extension_versions WHERE name=$1", [
        extension,
      ]);
      assert(
        available.rows.some((row) => row.version === "3.6.4"),
        `Exact ${extension} 3.6.4 is unavailable`,
      );
    }
    attempted = true;
    record("attempted", name);
    await admin.query(`CREATE DATABASE ${quoteIdentifier(name)}`);
    record("created", name);
    const client = new pg.Client({ connectionString: url.href });
    await client.connect();
    try {
      await client.query(
        `CREATE SCHEMA ${quoteIdentifier(postgisSchema)}; CREATE EXTENSION postgis WITH SCHEMA ${quoteIdentifier(postgisSchema)} VERSION '3.6.4'; CREATE EXTENSION postgis_topology VERSION '3.6.4'`,
      );
      assert.deepEqual(
        (
          await client.query(
            "SELECT extname,extversion FROM pg_extension WHERE extname IN ('postgis','postgis_topology') ORDER BY extname",
          )
        ).rows,
        [
          { extname: "postgis", extversion: "3.6.4" },
          { extname: "postgis_topology", extversion: "3.6.4" },
        ],
      );
    } finally {
      await client.end();
    }
    return await operation(url.href);
  } finally {
    try {
      if (attempted) {
        await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(name)} WITH (FORCE)`);
        assert.equal((await admin.query("SELECT 1 FROM pg_database WHERE datname=$1", [name])).rowCount, 0);
        record("dropped", name);
      }
    } finally {
      await admin.end();
    }
  }
}
