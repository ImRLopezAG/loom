import { createHash } from "node:crypto";
import * as v from "valibot";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/pg-core/async";
import { systemFieldSql } from "@loom/core/server";
import { bootstrapSession } from "./bootstrap.js";
import { databaseIdentifier, quoteIdentifier, withMigrationConnection } from "./connection.js";
import { catalogFingerprint } from "./drift.js";
import { readMigrations } from "./history.js";

const runnerOptions = v.strictObject({
  connectionString: v.string(), root: v.string(), migrations: v.string(), runtimeRole: databaseIdentifier,
  namespace: v.pipe(databaseIdentifier, v.check((name) => name !== "public" && name !== "information_schema" && !name.startsWith("pg_") && !name.startsWith("loom_"), "Application migrations require an isolated namespace")),
  metadataNamespace: v.optional(v.pipe(databaseIdentifier, v.regex(/^loom_/)), "loom_meta"),
  reviewedHashes: v.optional(v.array(v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/))), []),
});
export type ApplyMigrationsOptions = v.InferInput<typeof runnerOptions>;
export interface MigrationReceipt { readonly namespace: string; readonly applied: readonly string[]; readonly head: string | null }
interface AppliedMigration { ordinal: number; name: string; hash: string; before_hash: string; after_hash: string; catalog_hash: string }

export async function applyMigrations(options: ApplyMigrationsOptions): Promise<MigrationReceipt> {
  const config = v.parse(runnerOptions, options);
  return withMigrationConnection(config.connectionString, async (client) => {
    // Session lifetime bounds this lock, including failure paths and nested ORM transactions.
    await client.query("SELECT pg_advisory_lock(hashtextextended($1, 0))", [`loom:migrations:${config.namespace}`]);
    const artifacts = await readMigrations(config.root, config.migrations);
    for (const artifact of artifacts) {
      for (const snapshot of [artifact.plan.baseline, artifact.plan.snapshot]) {
        if (snapshot.ddl.some((entity) => entity.entityType === "schemas" ? entity.name !== config.namespace : !("schema" in entity) || entity.schema !== config.namespace)) {
          throw new Error("Migration artifact escapes the selected application namespace");
        }
      }
      if (!artifact.plan.safety.transactional) throw new Error("Nontransactional migration requires the explicit recovery runner");
    }
    await bootstrapSession(client, config.metadataNamespace, config.runtimeRole);
    const metadata = quoteIdentifier(config.metadataNamespace);
    const history = await client.query<AppliedMigration>(`SELECT ordinal, name, hash, before_hash, after_hash, catalog_hash FROM ${metadata}.migration_history WHERE namespace = $1 ORDER BY ordinal`, [config.namespace]);
    for (const [index, applied] of history.rows.entries()) {
      const artifact = artifacts[index];
      if (!artifact || applied.ordinal !== index + 1 || artifact.name !== applied.name || artifact.plan.hash !== applied.hash
        || artifact.plan.before !== applied.before_hash || artifact.plan.after !== applied.after_hash) throw new Error("Applied migration history differs from committed artifacts");
    }
    const last = history.rows.at(-1);
    if (last) {
      if (await catalogFingerprint(client, config.namespace) !== last.catalog_hash) throw new Error("Live database drift detected; migration stopped");
    } else {
      const existing = await client.query("SELECT 1 FROM pg_namespace WHERE nspname = $1", [config.namespace]);
      if (existing.rows.length) throw new Error("Live database drift: refusing an existing untracked application namespace");
    }
    const drizzleTable = `drizzle_${createHash("sha256").update(config.namespace).digest("hex").slice(0, 48)}`;
    const drizzleName = `${metadata}.${quoteIdentifier(drizzleTable)}`;
    const exists = await client.query<{ relation: string | null }>("SELECT to_regclass($1)::text AS relation", [drizzleName]);
    if (exists.rows[0]?.relation) {
      const recorded = await client.query<{ name: string; hash: string }>(`SELECT name, hash FROM ${drizzleName} ORDER BY id`);
      if (recorded.rows.length !== history.rows.length || recorded.rows.some((row, index) => row.name !== history.rows[index]?.name || row.hash !== history.rows[index]?.hash)) {
        throw new Error("ORM and Loom migration histories disagree");
      }
    } else if (history.rows.length) throw new Error("ORM migration history is missing");
    const applied: string[] = [];
    const db = drizzle({ client });
    for (const [index, artifact] of artifacts.entries()) {
      if (index < history.rows.length) continue;
      if (!artifact.plan.safety.automatic && !config.reviewedHashes.includes(artifact.plan.hash)) throw new Error(`Migration requires review of artifact ${artifact.plan.hash}`);
      await db.transaction(async (tx) => {
        // The exported ORM migrator nests a savepoint within this outer transaction.
        await migrate([{ sql: [...artifact.plan.statements], folderMillis: index + 1, hash: artifact.plan.hash, bps: true, name: artifact.name }], tx,
          { migrationsFolder: config.migrations, migrationsSchema: config.metadataNamespace, migrationsTable: drizzleTable });
        const entities = artifact.plan.snapshot.ddl.filter((entity) => entity.entityType === "tables").map((entity) => ({ name: entity.name, sqlName: entity.name, fields: [], options: {} }));
        for (const statement of systemFieldSql({ namespace: config.namespace, entities })) await client.query(statement);
        const application = quoteIdentifier(config.namespace);
        const role = quoteIdentifier(config.runtimeRole);
        await client.query(`REVOKE ALL ON SCHEMA ${application} FROM PUBLIC, ${role}`);
        await client.query(`GRANT USAGE ON SCHEMA ${application} TO ${role}`);
        await client.query(`REVOKE ALL ON ALL TABLES IN SCHEMA ${application} FROM PUBLIC, ${role}`);
        await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ${application} TO ${role}`);
        await client.query(`REVOKE ALL ON ALL FUNCTIONS IN SCHEMA ${application} FROM PUBLIC, ${role}`);
        const catalogHash = await catalogFingerprint(client, config.namespace);
        await client.query(`INSERT INTO ${metadata}.migration_history (namespace, ordinal, name, hash, before_hash, after_hash, catalog_hash) VALUES ($1,$2,$3,$4,$5,$6,$7)`,
          [config.namespace, index + 1, artifact.name, artifact.plan.hash, artifact.plan.before, artifact.plan.after, catalogHash]);
      });
      applied.push(artifact.plan.hash);
    }
    return { namespace: config.namespace, applied, head: artifacts.at(-1)?.plan.after ?? null };
  });
}
