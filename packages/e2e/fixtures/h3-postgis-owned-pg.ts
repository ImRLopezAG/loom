import assert from "node:assert/strict";
import pg from "pg";
import { startSharedOwnedPg } from "./shared-owned-pg.ts";

export const H3_POSTGIS_DIGEST = "9803892394c3cec2d4305ca64a925baefbe37c9108e8bb2601c7f384575f481e";
export const H3_POSTGIS_CUSTOM_PLACEMENT = {
  h3: "custom H3",
  postgis: "postgis 地",
  postgis_raster: "postgis 地",
  h3_postgis: "h3 Pg",
} as const;
export const H3_POSTGIS_DEFAULT_PLACEMENT = {
  h3: "extensions",
  postgis: "extensions",
  postgis_raster: "extensions",
  h3_postgis: "extensions",
} as const;
export const H3_POSTGIS_CONFIGURED_PLACEMENT = {
  h3: "h3_custom",
  postgis: "postgis_custom",
  postgis_raster: "postgis_custom",
  h3_postgis: "h3_postgis_custom",
} as const;
/** Versions provision() asserts from pg_extension on the parent-managed server; no image provenance is implied. */
export const H3_POSTGIS_OBSERVED_EXTENSIONS = {
  postgis: "3.6.4",
  postgis_raster: "3.6.4",
  h3: "4.2.3",
  h3_postgis: "4.2.3",
} as const;
export type H3PostgisPlacement = { readonly [Key in keyof typeof H3_POSTGIS_CUSTOM_PLACEMENT]: string };
/** Exact extension installation in UUID databases on the parent-managed server. */
export async function startH3PostgisOwnedPg(directory: string) {
  const fixture = await startSharedOwnedPg(directory, "loom_h3pg");
  return {
    runId: fixture.runId,
    journal: fixture.journalFile,
    async provision(placement: H3PostgisPlacement) {
      assert.equal(placement.postgis, placement.postgis_raster, "Native raster requires PostGIS's schema");
      const { database, connectionString } = await fixture.createDatabase();
      await fixture.journal("extension-ddl-intent", { database, placement });
      const client = new pg.Client({ connectionString });
      try {
        await client.connect();
        for (const schema of new Set(Object.values(placement)))
          await client.query(`CREATE SCHEMA ${pg.escapeIdentifier(schema)}`);
        for (const [name, version] of [
          ["postgis", "3.6.4"],
          ["postgis_raster", "3.6.4"],
          ["h3", "4.2.3"],
          ["h3_postgis", "4.2.3"],
        ] as const)
          await client.query(
            `CREATE EXTENSION ${pg.escapeIdentifier(name)} WITH SCHEMA ${pg.escapeIdentifier(placement[name])} VERSION '${version}'`,
          );
        const observed = await client.query<{ extname: string; extversion: string; schema: string }>(
          "SELECT e.extname,e.extversion,n.nspname AS schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname=ANY($1::text[]) ORDER BY e.extname",
          [Object.keys(placement)],
        );
        assert.deepEqual(observed.rows, [
          { extname: "h3", extversion: "4.2.3", schema: placement.h3 },
          { extname: "h3_postgis", extversion: "4.2.3", schema: placement.h3_postgis },
          { extname: "postgis", extversion: "3.6.4", schema: placement.postgis },
          { extname: "postgis_raster", extversion: "3.6.4", schema: placement.postgis_raster },
        ]);
        await client.query(
          `ALTER DATABASE ${pg.escapeIdentifier(database)} SET search_path TO ${[...new Set([placement.h3_postgis, placement.h3, placement.postgis]), "pg_catalog", "public"].map(pg.escapeIdentifier).join(",")}`,
        );
      } finally {
        await client.end();
      }
      return connectionString;
    },
    registerRole: fixture.registerRole,
    stop: fixture.stop,
    proveAbsent: fixture.proveAbsent,
    fail: fixture.fail,
    close: fixture.close,
  };
}
