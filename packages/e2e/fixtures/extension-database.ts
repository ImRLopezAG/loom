import assert from "node:assert/strict";
import pg from "pg";
import { quoteIdentifier } from "../../../apps/loom/src/tooling/migrations/connection";
const connectionString = process.env.LOOM_TEST_DATABASE_URL;
export async function withExtensionDatabase(operation: (url: string) => Promise<void>) {
  if (!connectionString) throw new Error("Missing PostgreSQL 18 extension fixture");
  const admin = new pg.Client({ connectionString });
  const name = `loom_ext_${crypto.randomUUID().replaceAll("-", "")}`;
  const url = new URL(connectionString);
  url.pathname = `/${name}`;
  await admin.connect();
  try {
    const binaries = await admin.query<{ name: string }>(
      "SELECT DISTINCT name FROM pg_available_extension_versions WHERE name=ANY($1::name[])",
      [["pg_trgm", "citext", "hstore", "uuid-ossp", "cube", "earthdistance"]],
    );
    assert.equal(binaries.rowCount, 6, "The PostgreSQL 18 fixture must include contrib extension binaries");
    await admin.query(`CREATE DATABASE ${quoteIdentifier(name)}`);
    await operation(url.href);
  } finally {
    await admin.query(`DROP DATABASE IF EXISTS ${quoteIdentifier(name)} WITH (FORCE)`);
    await admin.end();
  }
}
