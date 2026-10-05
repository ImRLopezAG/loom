import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import pg from "pg";
import { POSTGIS_TIGER_FIXED_SCHEMA } from "./postgis-tiger-geocoder-generated-project.ts";
import { startSharedOwnedPg } from "./shared-owned-pg.ts";

function quote(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

/** UUID databases on the shared fixture; exact 3.6.4 only and no census downloads. */
export async function startPostgisTigerGeocoderOwnedPg() {
  const fixture = await startSharedOwnedPg(tmpdir(), "loom_tiger");
  const journal = fixture.journal;
  return {
    runId: fixture.runId,
    journalFile: fixture.journalFile,
    async provision(postgisSchema: string) {
      const { database, connectionString } = await fixture.createDatabase();
      const client = new pg.Client({ connectionString });
      try {
        await client.connect();
        await journal("extension-ddl-intent", {
          database,
          postgisSchema,
          tigerSchema: POSTGIS_TIGER_FIXED_SCHEMA,
          extensions: ["fuzzystrmatch", "postgis", "postgis_tiger_geocoder"],
          versions: { postgis: "3.6.4", postgis_tiger_geocoder: "3.6.4" },
        });
        await client.query("CREATE EXTENSION fuzzystrmatch");
        if (postgisSchema !== "public") await client.query(`CREATE SCHEMA IF NOT EXISTS ${quote(postgisSchema)}`);
        await client.query(`CREATE EXTENSION postgis WITH SCHEMA ${quote(postgisSchema)} VERSION '3.6.4'`);
        if (postgisSchema !== "public") {
          await journal("native-condition", {
            condition:
              "postgis_tiger_geocoder--3.6.4.sql resolves unqualified geometry only from public during CREATE EXTENSION",
            postgisSchema,
          });
        }
        await client.query("CREATE EXTENSION postgis_tiger_geocoder VERSION '3.6.4'");
        await client.query(
          `ALTER DATABASE ${pg.escapeIdentifier(database)} SET search_path TO ${quote(postgisSchema)}, tiger, public`,
        );
        const installed = await client.query<{ extname: string; extversion: string; nspname: string }>(
          `SELECT e.extname, e.extversion, n.nspname
             FROM pg_catalog.pg_extension e
             JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
             WHERE e.extname = ANY($1::text[])
             ORDER BY e.extname`,
          [["fuzzystrmatch", "postgis", "postgis_tiger_geocoder"]],
        );
        const byName = Object.fromEntries(installed.rows.map((row) => [row.extname, row]));
        assert.equal(byName.postgis?.extversion, "3.6.4");
        assert.equal(byName.postgis?.nspname, postgisSchema);
        assert.equal(byName.postgis_tiger_geocoder?.extversion, "3.6.4");
        assert.equal(byName.postgis_tiger_geocoder?.nspname, POSTGIS_TIGER_FIXED_SCHEMA);
        assert.ok(byName.fuzzystrmatch);
        assert.equal(
          Math.floor(Number((await client.query("SHOW server_version_num")).rows[0]!.server_version_num) / 10000),
          18,
        );
        const empty = await client.query<{ n: string }>("SELECT count(*)::text AS n FROM tiger.addr");
        const states = await client.query<{ n: string }>("SELECT count(*)::text AS n FROM tiger.state_lookup");
        assert.equal(Number(empty.rows[0]?.n), 0);
        assert.equal(Number(states.rows[0]?.n), 59);
        await journal("installed", {
          database,
          postgisSchema,
          tigerSchema: POSTGIS_TIGER_FIXED_SCHEMA,
          exactVersion: true,
          emptyAddr: 0,
          stateLookup: 59,
          loaderExecuted: false,
          nativeCondition: "CREATE EXTENSION postgis_tiger_geocoder 3.6.4 requires public.geometry",
        });
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
