import assert from "node:assert/strict";
import { appendFile } from "node:fs/promises";
import pg from "pg";

export async function journalPgPartmanResources(event: Record<string, string | readonly string[]>): Promise<void> {
  const file = process.env.PG_PARTMAN_RESOURCE_JOURNAL;
  if (file) await appendFile(file, JSON.stringify(event) + "\n", { mode: 0o600 });
}

/** Only the UUID schema and its native UUID-named extension templates belong to this fixture. */
export async function cleanPgPartmanSchema(client: pg.Client, connectionString: string, schema: string): Promise<void> {
  assert.match(schema, /^partman_[a-f0-9]{32}$/);
  const prefix = `template_${schema}_`;
  const resources = await client.query<{ schema: string; name: string; kind: string }>(
    "SELECT n.nspname AS schema,c.relname AS name,c.relkind AS kind FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=$1 OR (n.nspname='extensions' AND left(c.relname,length($2))=$2) ORDER BY n.nspname,c.relname",
    [schema, prefix],
  );
  await journalPgPartmanResources({
    event: "cleanup-inventory",
    schema,
    relations: resources.rows.map((row) => `${row.schema}.${row.name}`),
  });
  for (const table of resources.rows.filter((row) => row.schema === "extensions" && ["r", "p"].includes(row.kind))) {
    await client.query(
      `DROP TABLE IF EXISTS ${pg.escapeIdentifier(table.schema)}.${pg.escapeIdentifier(table.name)} CASCADE`,
    );
  }
  await client.query(`DROP SCHEMA IF EXISTS ${pg.escapeIdentifier(schema)} CASCADE`);
  await client.query("DELETE FROM extensions.part_config WHERE starts_with(parent_table,$1)", [`${schema}.`]);
  await client.query("DELETE FROM extensions.part_config_sub WHERE starts_with(sub_parent,$1)", [`${schema}.`]);
  const observer = new pg.Client({ connectionString });
  await observer.connect();
  try {
    assert.equal(
      (await observer.query("SELECT 1 FROM pg_catalog.pg_namespace WHERE nspname=$1", [schema])).rowCount,
      0,
    );
    assert.equal(
      (
        await observer.query(
          "SELECT 1 FROM pg_catalog.pg_class c JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='extensions' AND left(c.relname,length($1))=$1",
          [prefix],
        )
      ).rowCount,
      0,
    );
    assert.equal(
      (
        await observer.query(
          "SELECT 1 FROM extensions.part_config WHERE starts_with(parent_table,$1) UNION ALL SELECT 1 FROM extensions.part_config_sub WHERE starts_with(sub_parent,$1)",
          [`${schema}.`],
        )
      ).rowCount,
      0,
    );
    await journalPgPartmanResources({ event: "independent-absence-verified", schema });
  } finally {
    await observer.end();
  }
}
