import * as v from "valibot";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/pg-core/async";
import { systemFieldSql } from "@loom/core/server";
import { bootstrapSession } from "./bootstrap";
import { databaseIdentifier, quoteIdentifier, withMigrationConnection } from "./connection";
import { catalogFingerprint } from "./drift";
import { readMigrations } from "./history";
import { inspectHistory, ormHistoryTable } from "./state";
import { assertGeneratedVersion } from "../codegen/generate";
import { databaseIdentity } from "./status";
import type { DatabaseIdentity } from "./status";

export const runnerOptions = v.strictObject({
  connectionString: v.string(),
  root: v.string(),
  migrations: v.string(),
  runtimeRole: databaseIdentifier,
  namespace: v.pipe(
    databaseIdentifier,
    v.check(
      (name) =>
        name !== "public" && name !== "information_schema" && !name.startsWith("pg_") && !name.startsWith("loom_"),
      "Application migrations require an isolated namespace",
    ),
  ),
  metadataNamespace: v.optional(v.pipe(databaseIdentifier, v.regex(/^loom_/)), "loom_meta"),
  sourceVersion: v.optional(v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/))),
  reviewedHashes: v.optional(v.array(v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/))), []),
});
export type ApplyMigrationsOptions = v.InferInput<typeof runnerOptions>;
export interface MigrationReceipt {
  readonly target: DatabaseIdentity;
  readonly namespace: string;
  readonly applied: readonly string[];
  readonly head: string | null;
}

export async function applyMigrations(options: ApplyMigrationsOptions): Promise<MigrationReceipt> {
  const config = v.parse(runnerOptions, options);
  return withMigrationConnection(config.connectionString, async (client) => {
    // Session lifetime bounds this lock, including failure paths and nested ORM transactions.
    await client.query("SELECT pg_advisory_lock(hashtextextended($1, 0))", [`loom:migrations:${config.namespace}`]);
    if (config.sourceVersion) await assertGeneratedVersion(config.root, config.sourceVersion);
    const artifacts = await readMigrations(config.root, config.migrations);
    for (const artifact of artifacts) {
      for (const snapshot of [artifact.plan.baseline, artifact.plan.snapshot]) {
        if (
          snapshot.ddl.some((entity) =>
            entity.entityType === "schemas"
              ? entity.name !== config.namespace
              : !("schema" in entity) || entity.schema !== config.namespace,
          )
        ) {
          throw new Error("Migration artifact escapes the selected application namespace");
        }
      }
      if (!artifact.plan.safety.transactional)
        throw new Error("Nontransactional migration requires the explicit recovery runner");
    }
    await bootstrapSession(client, config.metadataNamespace, config.runtimeRole);
    const metadata = quoteIdentifier(config.metadataNamespace);
    const state = await inspectHistory(client, config, artifacts);
    if (state.issues.includes("LIVE_DRIFT") || state.issues.includes("UNTRACKED_NAMESPACE"))
      throw new Error("Live database drift detected; migration stopped");
    if (state.issues.length)
      throw new Error("Applied migration history differs from committed artifacts or ORM history");
    const drizzleTable = ormHistoryTable(config.namespace);
    const applied: string[] = [];
    const db = drizzle({ client });
    for (const [index, artifact] of artifacts.entries()) {
      if (index < state.applied.length) continue;
      if (!artifact.plan.safety.automatic && !config.reviewedHashes.includes(artifact.plan.hash))
        throw new Error(`Migration requires review of artifact ${artifact.plan.hash}`);
      await db.transaction(async (tx) => {
        // The exported ORM migrator nests a savepoint within this outer transaction.
        await migrate(
          [
            {
              sql: [...artifact.plan.statements],
              folderMillis: index + 1,
              hash: artifact.plan.hash,
              bps: true,
              name: artifact.name,
            },
          ],
          tx,
          {
            migrationsFolder: config.migrations,
            migrationsSchema: config.metadataNamespace,
            migrationsTable: drizzleTable,
          },
        );
        const entities = artifact.plan.snapshot.ddl
          .filter((entity) => entity.entityType === "tables")
          .map((entity) => ({ name: entity.name, sqlName: entity.name, fields: [], options: {} }));
        for (const statement of systemFieldSql({ namespace: config.namespace, entities }))
          await client.query(statement);
        const application = quoteIdentifier(config.namespace);
        const role = quoteIdentifier(config.runtimeRole);
        await client.query(`REVOKE ALL ON SCHEMA ${application} FROM PUBLIC, ${role}`);
        await client.query(`GRANT USAGE ON SCHEMA ${application} TO ${role}`);
        await client.query(`REVOKE ALL ON ALL TABLES IN SCHEMA ${application} FROM PUBLIC, ${role}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${application} TO ${role}`);
        await client.query(`REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ${application} FROM PUBLIC, ${role}`);
        const catalogHash = await catalogFingerprint(client, config.namespace);
        await client.query(
          `INSERT INTO ${metadata}.migration_history (namespace, ordinal, name, hash, before_hash, after_hash, catalog_hash) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [
            config.namespace,
            index + 1,
            artifact.name,
            artifact.plan.hash,
            artifact.plan.before,
            artifact.plan.after,
            catalogHash,
          ],
        );
      });
      applied.push(artifact.plan.hash);
    }
    return {
      target: await databaseIdentity(client),
      namespace: config.namespace,
      applied,
      head: artifacts.at(-1)?.plan.after ?? null,
    };
  });
}
