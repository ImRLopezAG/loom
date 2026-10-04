import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import pg from "pg";
import { startSharedOwnedPg } from "./shared-owned-pg.ts";

/** Requires the parent to prepare exact native data-US files in the shared fixture. */
export async function startDataUsOwnedPg() {
  const fixture = await startSharedOwnedPg(tmpdir(), "loom_dataus");
  const journal = fixture.journal;
  return {
    runId: fixture.runId,
    journalFile: fixture.journalFile,
    async provision(schema: string) {
      const { database, connectionString } = await fixture.createDatabase();
      const client = new pg.Client({ connectionString });
      try {
        await client.connect();
        await journal("extension-ddl-intent", {
          database,
          schema,
          extension: "address_standardizer_data_us",
          version: "3.6.4",
        });
        await client.query(
          `CREATE SCHEMA ${pg.escapeIdentifier(schema)}; CREATE EXTENSION address_standardizer_data_us WITH SCHEMA ${pg.escapeIdentifier(schema)} VERSION '3.6.4'`,
        );
        const installed = await client.query(
          "SELECT e.extname,e.extversion,n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname LIKE 'address_standardizer%'",
        );
        assert.deepEqual(installed.rows, [
          { extname: "address_standardizer_data_us", extversion: "3.6.4", nspname: schema },
        ]);
        assert.equal(
          Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000),
          18,
        );
        await journal("installed", { database, schema, exactVersion: true, baseAbsent: true });
      } finally {
        await client.end();
      }
      return connectionString;
    },
    journal,
    stop: fixture.stop,
    proveAbsent: fixture.proveAbsent,
    fail: fixture.fail,
    close: fixture.close,
  };
}
