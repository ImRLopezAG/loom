import * as v from "valibot";
import { databaseIdentifier, withMigrationConnection } from "./connection.js";
import { readMigrations } from "./history.js";
import { inspectHistory } from "./state.js";
import type { HistoryIssue } from "./state.js";
import type { MigrationSafety } from "./classifier.js";
import type pg from "pg";

const statusOptions = v.strictObject({
  connectionString: v.string(), root: v.string(), migrations: v.string(), namespace: databaseIdentifier,
  metadataNamespace: v.optional(v.pipe(databaseIdentifier, v.regex(/^loom_/)), "loom_meta"),
});
export type MigrationStatusOptions = v.InferInput<typeof statusOptions>;
export interface DatabaseIdentity { database: string; role: string; address: string | null; port: number | null }
export async function databaseIdentity(client: pg.Client): Promise<DatabaseIdentity> {
  const result = await client.query<DatabaseIdentity>("SELECT current_database() AS database, current_user AS role, inet_server_addr()::text AS address, inet_server_port() AS port");
  const identity = result.rows[0];
  if (!identity) throw new Error("Missing database identity");
  return identity;
}
export interface MigrationStatus {
  readonly target: DatabaseIdentity;
  readonly namespace: string;
  readonly initialized: boolean;
  readonly consistent: boolean;
  readonly issues: readonly HistoryIssue[];
  readonly head: string | null;
  readonly committedHead: string | null;
  readonly applied: readonly string[];
  readonly pending: readonly { readonly name: string; readonly hash: string; readonly safety: MigrationSafety }[];
  readonly catalog: { readonly expected: string | null; readonly actual: string };
}

export async function migrationStatus(options: MigrationStatusOptions): Promise<MigrationStatus> {
  const config = v.parse(statusOptions, options);
  return withMigrationConnection(config.connectionString, async (client) => {
    await client.query("SELECT pg_advisory_lock_shared(hashtextextended($1, 0))", [`loom:migrations:${config.namespace}`]);
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    try {
      const artifacts = await readMigrations(config.root, config.migrations);
      const state = await inspectHistory(client, config, artifacts);
      const target = await databaseIdentity(client);
      await client.query("COMMIT");
      return { target, namespace: config.namespace, initialized: state.initialized, consistent: state.issues.length === 0,
        issues: state.issues, head: state.applied.at(-1)?.after_hash ?? null, committedHead: artifacts.at(-1)?.plan.after ?? null,
        applied: state.applied.map((row) => row.hash), pending: artifacts.slice(state.applied.length).map((artifact) => ({ name: artifact.name, hash: artifact.plan.hash, safety: artifact.plan.safety })),
        catalog: { expected: state.expectedCatalog, actual: state.actualCatalog } };
    } catch (cause) { await client.query("ROLLBACK"); throw cause; }
  });
}
