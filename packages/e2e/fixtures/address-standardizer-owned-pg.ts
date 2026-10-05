import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import pg from "pg";
import { startSharedOwnedPg } from "./shared-owned-pg.ts";

export const ADDRESS_STANDARDIZER_FAMILY_IMAGE = "loom-address-standardizer-3.6.4-pg18:local";
export const ADDRESS_STANDARDIZER_SOURCE_TARBALL = "/tmp/loom-postgis-3.6.4-source/postgis-3.6.4.tar.gz";
export const ADDRESS_STANDARDIZER_SOURCE_TARBALL_SHA256 =
  "ed8dc6679f1e06f7b113592b04cde2a7e00f1b1e681294c8ca2204058990cec6";

export type AddressStandardizerOwnedPg = {
  readonly runId: string;
  readonly journalFile: string;
  readonly controlUrl: string;
  provision(schema: string): Promise<string>;
  stop(): Promise<void>;
  proveAbsent(): Promise<void>;
  fail(cause: unknown): void;
  close(): Promise<void>;
};

function execute(command: string[]) {
  return spawnSync(command[0]!, command.slice(1), {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function requireSuccess(child: ReturnType<typeof execute>, label: string) {
  assert.equal(child.status, 0, `${label}\n${child.stdout}\n${child.stderr}`);
  return child;
}

function extractSql(name: string) {
  return requireSuccess(
    execute([
      "tar",
      "-xOf",
      ADDRESS_STANDARDIZER_SOURCE_TARBALL,
      `postgis-3.6.4/extensions/address_standardizer/${name}`,
    ]),
    name,
  ).stdout;
}

/** Own only UUID databases on the parent-managed shared PostgreSQL fixture. */
export async function startAddressStandardizerOwnedPg(): Promise<AddressStandardizerOwnedPg> {
  const tarballSha = createHash("sha256").update(readFileSync(ADDRESS_STANDARDIZER_SOURCE_TARBALL)).digest("hex");
  assert.equal(tarballSha, ADDRESS_STANDARDIZER_SOURCE_TARBALL_SHA256, "Exact PostGIS 3.6.4 source tarball required");
  const lex = extractSql("us_lex.sql");
  const gaz = extractSql("us_gaz.sql");
  const rules = extractSql("us_rules.sql");
  const fixture = await startSharedOwnedPg(tmpdir(), "loom_addrstd");
  return {
    runId: fixture.runId,
    journalFile: fixture.journalFile,
    controlUrl: fixture.controlUrl,
    async provision(schema: string) {
      const { database, connectionString } = await fixture.createDatabase();
      await fixture.journal("extension-ddl-intent", { database, schema, version: "3.6.4" });
      const client = new pg.Client({ connectionString });
      try {
        await client.connect();
        const ns = pg.escapeIdentifier(schema);
        await client.query(`CREATE SCHEMA ${ns}`);
        await client.query(`CREATE EXTENSION address_standardizer WITH SCHEMA ${ns} VERSION '3.6.4'`);
        const installed = await client.query<{ extversion: string; nspname: string }>(
          `SELECT e.extversion, n.nspname
             FROM pg_extension e
             JOIN pg_namespace n ON n.oid = e.extnamespace
             WHERE e.extname = 'address_standardizer'`,
        );
        assert.equal(installed.rows[0]?.extversion, "3.6.4");
        assert.equal(installed.rows[0]?.nspname, schema);
        const companion = await client.query<{ count: string }>(
          "SELECT count(*)::text AS count FROM pg_extension WHERE extname = 'address_standardizer_data_us'",
        );
        assert.equal(companion.rows[0]?.count, "0");
        await client.query("CREATE SCHEMA lex_schema");
        await client.query("SET search_path TO lex_schema, pg_catalog");
        await client.query(lex);
        await client.query(gaz);
        await client.query(rules);
        await client.query(`ALTER DATABASE ${pg.escapeIdentifier(database)} SET search_path TO lex_schema, pg_catalog`);
      } finally {
        await client.end();
      }
      return connectionString;
    },
    stop: fixture.stop,
    proveAbsent: fixture.proveAbsent,
    fail: fixture.fail,
    close: fixture.close,
  };
}
