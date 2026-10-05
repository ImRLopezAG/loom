import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { accessSync, constants, readFileSync } from "node:fs";
import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { startSharedOwnedPg, withOwnedCleanup } from "./shared-owned-pg.ts";

const pgRepackVersion = "1.5.2";

export async function withPgRepackDatabase<Result>(
  work: (fixture: { readonly url: string; readonly binary: string }) => Promise<Result>,
): Promise<Result> {
  const binary = process.env.LOOM_PG_REPACK_BINARY;
  assert(binary, "Supply LOOM_PG_REPACK_BINARY for the parent-prepared exact pg_repack 1.5.2 client");
  const expectedSha256 = process.env.LOOM_PG_REPACK_BINARY_SHA256;
  assert(
    expectedSha256 && /^[a-f0-9]{64}$/.test(expectedSha256),
    "Supply LOOM_PG_REPACK_BINARY_SHA256 for the parent-prepared pg_repack client",
  );
  accessSync(binary, constants.X_OK);
  assert.equal(
    createHash("sha256").update(readFileSync(binary)).digest("hex"),
    expectedSha256,
    "The supplied pg_repack client bytes differ from the parent-recorded SHA-256",
  );
  const version = spawnSync(binary, ["--version"], { encoding: "utf8", timeout: 30_000 });
  assert.equal(version.status, 0, "The supplied pg_repack client did not report its version");
  assert.equal(
    version.stdout.trim(),
    `pg_repack ${pgRepackVersion}`,
    "The supplied pg_repack client version differs from the contract",
  );
  const directory = await mkdtemp(join(tmpdir(), "loom-pg-repack-shared-"));
  const owner = await startSharedOwnedPg(directory, "loom_repack");
  return withOwnedCleanup(async () => {
    const database = await owner.createDatabase();
    const client = new pg.Client({ connectionString: database.connectionString, connectionTimeoutMillis: 15_000 });
    try {
      await client.connect();
      const available = await client.query<{ default_version: string | null }>(
        "SELECT default_version FROM pg_available_extensions WHERE name='pg_repack'",
      );
      assert.equal(
        available.rows[0]?.default_version,
        pgRepackVersion,
        "The shared server must offer the exact pg_repack 1.5.2 extension",
      );
    } finally {
      await client.end();
    }
    return work({ url: database.connectionString, binary });
  }, [owner.stop, owner.proveAbsent]);
}
