import { createHash } from "node:crypto";
import type pg from "pg";
import type { MigrationArtifact } from "./history";
import { quoteIdentifier } from "./connection";
import { catalogFingerprint } from "./drift";
import { frameworkMigrationHash } from "./bootstrap";

export interface HistoryScope {
  readonly namespace: string;
  readonly metadataNamespace: string;
}
export interface AppliedMigration {
  ordinal: number;
  name: string;
  hash: string;
  before_hash: string;
  after_hash: string;
  catalog_hash: string;
}
export type HistoryIssue =
  | "HISTORY_DIVERGED"
  | "LIVE_DRIFT"
  | "UNTRACKED_NAMESPACE"
  | "ORM_HISTORY_DIVERGED"
  | "FRAMEWORK_HISTORY_DIVERGED";
export interface HistoryState {
  readonly initialized: boolean;
  readonly applied: readonly AppliedMigration[];
  readonly issues: readonly HistoryIssue[];
  readonly expectedCatalog: string | null;
  readonly actualCatalog: string;
}
export function ormHistoryTable(namespace: string): string {
  return `drizzle_${createHash("sha256").update(namespace).digest("hex").slice(0, 48)}`;
}
async function relationExists(client: pg.Client, name: string): Promise<boolean> {
  const result = await client.query<{ relation: string | null }>("SELECT to_regclass($1)::text AS relation", [name]);
  return result.rows[0]?.relation != null;
}

export async function inspectHistory(
  client: pg.Client,
  scope: HistoryScope,
  artifacts: readonly MigrationArtifact[],
): Promise<HistoryState> {
  const metadata = quoteIdentifier(scope.metadataNamespace);
  const initialized = await relationExists(client, `${metadata}.migration_history`);
  const history = initialized
    ? (
        await client.query<AppliedMigration>(
          `SELECT ordinal, name, hash, before_hash, after_hash, catalog_hash FROM ${metadata}.migration_history WHERE namespace = $1 ORDER BY ordinal`,
          [scope.namespace],
        )
      ).rows
    : [];
  const issues: HistoryIssue[] = [];
  if (await relationExists(client, `${metadata}.framework_migrations`)) {
    const versions = await client.query<{ version: number; hash: string }>(
      `SELECT version, hash FROM ${metadata}.framework_migrations ORDER BY version`,
    );
    if (
      !initialized ||
      versions.rows.length !== 1 ||
      versions.rows[0]?.version !== 1 ||
      versions.rows[0]?.hash !== frameworkMigrationHash(scope.metadataNamespace)
    )
      issues.push("FRAMEWORK_HISTORY_DIVERGED");
  } else {
    const namespace = await client.query("SELECT 1 FROM pg_namespace WHERE nspname = $1", [scope.metadataNamespace]);
    if (namespace.rows.length) issues.push("FRAMEWORK_HISTORY_DIVERGED");
  }
  if (
    history.some((applied, index) => {
      const artifact = artifacts[index];
      return (
        !artifact ||
        applied.ordinal !== index + 1 ||
        artifact.name !== applied.name ||
        artifact.plan.hash !== applied.hash ||
        artifact.plan.before !== applied.before_hash ||
        artifact.plan.after !== applied.after_hash
      );
    })
  )
    issues.push("HISTORY_DIVERGED");
  const last = history.at(-1);
  const actualCatalog = await catalogFingerprint(client, scope.namespace);
  if (last) {
    if (actualCatalog !== last.catalog_hash) issues.push("LIVE_DRIFT");
  } else {
    const existing = await client.query("SELECT 1 FROM pg_namespace WHERE nspname = $1", [scope.namespace]);
    if (existing.rows.length) issues.push("UNTRACKED_NAMESPACE");
  }
  const drizzleName = `${metadata}.${quoteIdentifier(ormHistoryTable(scope.namespace))}`;
  if (await relationExists(client, drizzleName)) {
    const recorded = await client.query<{ name: string; hash: string }>(
      `SELECT name, hash FROM ${drizzleName} ORDER BY id`,
    );
    if (
      recorded.rows.length !== history.length ||
      recorded.rows.some((row, index) => row.name !== history[index]?.name || row.hash !== history[index]?.hash)
    )
      issues.push("ORM_HISTORY_DIVERGED");
  } else if (history.length) issues.push("ORM_HISTORY_DIVERGED");
  return { initialized, applied: history, issues, expectedCatalog: last?.catalog_hash ?? null, actualCatalog };
}
