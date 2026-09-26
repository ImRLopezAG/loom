import { createHash } from "node:crypto";
import type pg from "pg";
import { acquireMigrationLock, assertMigrationConnection, quoteIdentifier } from "./connection";
import { catalogFingerprint } from "./drift";
import { frameworkMigrations } from "./bootstrap";
import { inspectHistory, ormHistoryTable } from "./state";
import type { AppliedMigration, HistoryScope } from "./state";
import type { MigrationArtifact } from "./history";

interface SchemaBaseline {
  readonly initialized: boolean;
  readonly scope: HistoryScope;
  readonly applicationCatalog: string;
  readonly metadataCatalog: string;
  readonly migrations: readonly AppliedMigration[];
  readonly fingerprint: string;
}
// A baseline is usable only while its source's owned session still holds the locks.
const sources = new WeakMap<SchemaBaseline, pg.Client>();

async function snapshot(client: pg.Client, scope: HistoryScope, artifacts: readonly MigrationArtifact[]) {
  const state = await inspectHistory(client, scope, artifacts);
  if (state.issues.length || (state.initialized && !state.applied.length))
    throw new Error("Schema baseline requires consistent, applied source migrations");
  // pg_dump can represent an explicit owner-only table ACL as the identical default ACL.
  const metadataCatalog = await catalogFingerprint(client, scope.metadataNamespace, [], "schema-copy");
  const value = {
    initialized: state.initialized,
    scope,
    applicationCatalog: state.actualCatalog,
    metadataCatalog,
    migrations: state.applied,
  };
  return { ...value, fingerprint: createHash("sha256").update(JSON.stringify(value)).digest("hex") };
}

/** Capture before branch creation. Keep this callback's owned source connection open until adoption finishes. */
export async function captureSchemaBaseline(
  source: pg.Client,
  scope: HistoryScope,
  artifacts: readonly MigrationArtifact[],
): Promise<SchemaBaseline> {
  assertMigrationConnection(source);
  quoteIdentifier(scope.namespace);
  quoteIdentifier(scope.metadataNamespace);
  if (scope.namespace === scope.metadataNamespace) throw new Error("Baseline namespaces must differ");
  await acquireMigrationLock(source, `loom:migrations:${scope.namespace}`);
  await acquireMigrationLock(source, "loom:bootstrap");
  const baseline = await snapshot(source, Object.freeze({ ...scope }), artifacts);
  for (const migration of baseline.migrations) Object.freeze(migration);
  Object.freeze(baseline.migrations);
  Object.freeze(baseline);
  sources.set(baseline, source);
  return baseline;
}

/** Internal database stage. The branch owner must verify provider identity and withhold activation. */
export async function establishSchemaBaseline(
  source: pg.Client,
  target: pg.Client,
  baseline: SchemaBaseline,
  artifacts: readonly MigrationArtifact[],
): Promise<void> {
  assertMigrationConnection(source);
  assertMigrationConnection(target);
  if (source === target || sources.get(baseline) !== source) throw new Error("Baseline source session changed");
  const { namespace, metadataNamespace } = baseline.scope;
  await acquireMigrationLock(target, `loom:migrations:${namespace}`);
  await acquireMigrationLock(target, "loom:bootstrap");
  if ((await snapshot(source, baseline.scope, artifacts)).fingerprint !== baseline.fingerprint)
    throw new Error("Source schema changed during branch provisioning");
  const metadata = quoteIdentifier(metadataNamespace);
  const ormName = ormHistoryTable(namespace);
  const orm = `${metadata}.${quoteIdentifier(ormName)}`;
  await target.query("BEGIN");
  try {
    const tables = await target.query<{ name: string }>(
      "SELECT c.relname AS name FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=$1 AND c.relkind IN ('r','p') ORDER BY c.relname",
      [metadataNamespace],
    );
    for (const { name } of tables.rows)
      await target.query(`LOCK TABLE ${metadata}.${quoteIdentifier(name)} IN ACCESS EXCLUSIVE MODE`);
    if (
      (await catalogFingerprint(target, namespace)) !== baseline.applicationCatalog ||
      (await catalogFingerprint(target, metadataNamespace, [], "schema-copy")) !== baseline.metadataCatalog
    )
      throw new Error("Copied branch catalog differs from its source baseline");
    if (!baseline.initialized) {
      if ((await snapshot(source, baseline.scope, artifacts)).fingerprint !== baseline.fingerprint)
        throw new Error("Source schema changed during branch provisioning");
      await target.query("COMMIT");
      return;
    }
    const allowed = new Set(["framework_migrations", "migration_history", ormName, "table_revisions"]);
    for (const { name } of tables.rows) {
      if (allowed.has(name)) continue;
      const existing = await target.query(`SELECT 1 FROM ${metadata}.${quoteIdentifier(name)} LIMIT 1`);
      if (existing.rowCount) throw new Error("Schema baseline refuses inherited runtime records");
    }
    const state = await inspectHistory(target, baseline.scope, artifacts);
    if (state.applied.length) {
      if (state.issues.length || JSON.stringify(state.applied) !== JSON.stringify(baseline.migrations))
        throw new Error("Existing branch baseline is partial or differs");
    } else {
      for (const name of allowed) {
        const existing = await target.query(`SELECT 1 FROM ${metadata}.${quoteIdentifier(name)} LIMIT 1`);
        if (existing.rowCount) throw new Error("Existing branch baseline is partial or differs");
      }
      for (const migration of frameworkMigrations(metadataNamespace))
        await target.query(`INSERT INTO ${metadata}.framework_migrations(version,hash) VALUES($1,$2)`, [
          migration.version,
          migration.hash,
        ]);
      for (const migration of baseline.migrations) {
        await target.query(
          `INSERT INTO ${metadata}.migration_history(namespace,ordinal,name,hash,before_hash,after_hash,catalog_hash) VALUES($1,$2,$3,$4,$5,$6,$7)`,
          [
            namespace,
            migration.ordinal,
            migration.name,
            migration.hash,
            migration.before_hash,
            migration.after_hash,
            migration.catalog_hash,
          ],
        );
        await target.query(`INSERT INTO ${orm}(hash,created_at,name) VALUES($1,$2,$3)`, [
          migration.hash,
          migration.ordinal,
          migration.name,
        ]);
      }
      const latest = artifacts[baseline.migrations.length - 1];
      if (!latest) throw new Error("Source migration artifact is missing");
      for (const entity of latest.plan.snapshot.ddl) {
        if (entity.entityType !== "tables") continue;
        await target.query(`INSERT INTO ${metadata}.table_revisions(namespace,table_name,revision) VALUES($1,$2,1)`, [
          namespace,
          entity.name,
        ]);
      }
    }
    const verified = await inspectHistory(target, baseline.scope, artifacts);
    if (verified.issues.length) throw new Error("Branch baseline failed migration verification");
    if ((await snapshot(source, baseline.scope, artifacts)).fingerprint !== baseline.fingerprint)
      throw new Error("Source schema changed during branch provisioning");
    await target.query("COMMIT");
  } catch (cause) {
    await target.query("ROLLBACK").catch(() => {});
    throw cause;
  }
}
