import { createHash } from "node:crypto";
import type pg from "pg";
import * as v from "valibot";
import { databaseIdentifier, quoteIdentifier, withMigrationConnection } from "./connection";

const bootstrapOptions = v.strictObject({
  connectionString: v.string(),
  metadataNamespace: v.optional(v.pipe(databaseIdentifier, v.regex(/^loom_/)), "loom_meta"),
  runtimeRole: databaseIdentifier,
});
export type BootstrapOptions = v.InferInput<typeof bootstrapOptions>;

function frameworkStatements(namespace: string): readonly string[] {
  const schema = quoteIdentifier(namespace);
  return [
    `CREATE TABLE ${schema}.migration_history (
      namespace text NOT NULL, ordinal integer NOT NULL CHECK (ordinal > 0), name text NOT NULL,
      hash text NOT NULL CHECK (hash ~ '^[a-f0-9]{64}$'),
      before_hash text NOT NULL, after_hash text NOT NULL, catalog_hash text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (namespace, ordinal), UNIQUE (namespace, hash)
    )`,
  ];
}
export function frameworkMigrations(namespace: string) {
  const schema = quoteIdentifier(namespace);
  const versions = [
    frameworkStatements(namespace),
    [
      `CREATE TABLE ${schema}.development_history (
      namespace text NOT NULL, ordinal integer NOT NULL CHECK (ordinal > 0),
      source_version text NOT NULL CHECK (source_version ~ '^[a-f0-9]{64}$'),
      project_id text NOT NULL, branch_id text NOT NULL, endpoint_id text NOT NULL,
      artifact_hash text NOT NULL CHECK (artifact_hash ~ '^[a-f0-9]{64}$'),
      artifact jsonb NOT NULL CHECK (jsonb_typeof(artifact) = 'object'),
      before_catalog_hash text NOT NULL, after_catalog_hash text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT clock_timestamp(),
      PRIMARY KEY (namespace, ordinal)
    )`,
    ],
    [
      `CREATE TABLE ${schema}.mutation_results (
      scope_hash text NOT NULL CHECK (scope_hash ~ '^[a-f0-9]{64}$'),
      key_hash text NOT NULL CHECK (key_hash ~ '^[a-f0-9]{64}$'),
      fingerprint text NOT NULL CHECK (fingerprint ~ '^[a-f0-9]{64}$'),
      result jsonb NOT NULL, expires_at timestamptz NOT NULL,
      PRIMARY KEY (scope_hash, key_hash)
    )`,
    ],
    [
      `CREATE TABLE ${schema}.connection_tickets (
      deployment text NOT NULL CHECK (length(deployment) BETWEEN 1 AND 256),
      ticket_hash text NOT NULL CHECK (ticket_hash ~ '^[a-f0-9]{64}$'),
      origin text NOT NULL,
      identity jsonb NOT NULL CHECK (jsonb_typeof(identity) = 'object'),
      session_expires_at timestamptz NOT NULL,
      expires_at timestamptz NOT NULL CHECK (expires_at <= session_expires_at),
      PRIMARY KEY (deployment, ticket_hash)
    )`,
      `CREATE INDEX connection_tickets_expiry ON ${schema}.connection_tickets (expires_at)`,
    ],
    [
      `CREATE TABLE ${schema}.table_revisions (
      namespace text NOT NULL, table_name text NOT NULL,
      revision bigint NOT NULL CHECK (revision > 0),
      PRIMARY KEY (namespace, table_name)
    )`,
      `CREATE FUNCTION ${schema}.advance_table_revision() RETURNS trigger
      LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog AS $loom$
      BEGIN
        UPDATE ${schema}.table_revisions SET revision = revision + 1
        WHERE namespace = TG_TABLE_SCHEMA AND table_name = TG_TABLE_NAME;
        IF NOT FOUND THEN RAISE EXCEPTION 'Missing Loom table revision'; END IF;
        RETURN NULL;
      END
      $loom$`,
    ],
  ];
  return versions.map((statements, index) => ({
    version: index + 1,
    statements,
    hash: createHash("sha256").update(JSON.stringify(statements)).digest("hex"),
  }));
}

/** Caller owns the session; this function owns one transaction and its bootstrap lock. */
export async function bootstrapSession(
  client: pg.Client,
  metadataNamespace: string,
  runtimeRole: string,
): Promise<void> {
  const schema = quoteIdentifier(metadataNamespace);
  const role = quoteIdentifier(runtimeRole);
  await client.query("BEGIN");
  try {
    await client.query("SELECT pg_advisory_xact_lock(hashtextextended('loom:bootstrap', 0))");
    const existingRole = await client.query<{ unsafe: boolean }>(
      `SELECT
      rolsuper OR rolcreatedb OR rolcreaterole OR rolreplication OR rolbypassrls OR rolname = current_user
      OR pg_has_role(oid, current_user, 'MEMBER')
      OR EXISTS (SELECT 1 FROM pg_auth_members WHERE member = pg_roles.oid)
      AS unsafe FROM pg_roles WHERE rolname = $1`,
      [runtimeRole],
    );
    if (existingRole.rows[0]?.unsafe)
      throw new Error("Runtime role must not have migration or administrative authority");
    if (!existingRole.rows.length)
      await client.query(
        `CREATE ROLE ${role} NOLOGIN NOINHERIT NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS`,
      );
    const namespaces = await client.query<{ owned: boolean }>(
      "SELECT nspowner = (SELECT oid FROM pg_roles WHERE rolname = current_user) AS owned FROM pg_namespace WHERE nspname = $1",
      [metadataNamespace],
    );
    if (namespaces.rows[0] && !namespaces.rows[0].owned)
      throw new Error("Migration identity must own the metadata namespace");
    const created = namespaces.rows.length === 0;
    if (created) {
      await client.query(`CREATE SCHEMA ${schema}`);
      await client.query(`REVOKE ALL ON SCHEMA ${schema} FROM PUBLIC`);
      await client.query(
        `CREATE TABLE ${schema}.framework_migrations (version integer PRIMARY KEY, hash text NOT NULL, applied_at timestamptz NOT NULL DEFAULT clock_timestamp())`,
      );
    }
    const versions = await client.query<{ version: number; hash: string }>(
      `SELECT version, hash FROM ${schema}.framework_migrations ORDER BY version`,
    );
    const migrations = frameworkMigrations(metadataNamespace);
    for (const [index, row] of versions.rows.entries()) {
      const expected = migrations[index];
      if (!expected || row.version !== expected.version)
        throw new Error("Unsupported framework metadata version or gap");
      if (row.hash !== expected.hash) throw new Error("Framework migration hash mismatch");
    }
    if (!versions.rows.length && !created) throw new Error("Refusing unversioned existing framework metadata");
    for (const migration of migrations.slice(versions.rows.length)) {
      for (const statement of migration.statements) await client.query(statement);
      await client.query(`INSERT INTO ${schema}.framework_migrations (version, hash) VALUES ($1, $2)`, [
        migration.version,
        migration.hash,
      ]);
    }
    await client.query(`REVOKE ALL ON SCHEMA ${schema} FROM PUBLIC, ${role}`);
    await client.query(`REVOKE ALL ON ALL TABLES IN SCHEMA ${schema} FROM PUBLIC, ${role}`);
    await client.query(`REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ${schema} FROM PUBLIC, ${role}`);
    await client.query(`GRANT USAGE ON SCHEMA ${schema} TO ${role}`);
    await client.query(`GRANT SELECT, INSERT ON ${schema}.mutation_results TO ${role}`);
    await client.query(`GRANT SELECT, INSERT, DELETE ON ${schema}.connection_tickets TO ${role}`);
    await client.query(`GRANT SELECT ON ${schema}.table_revisions TO ${role}`);
    await client.query("COMMIT");
  } catch (cause) {
    await client.query("ROLLBACK");
    throw cause;
  }
}

export async function bootstrapDatabase(options: BootstrapOptions): Promise<void> {
  const config = v.parse(bootstrapOptions, options);
  await withMigrationConnection(config.connectionString, (client) =>
    bootstrapSession(client, config.metadataNamespace, config.runtimeRole),
  );
}
