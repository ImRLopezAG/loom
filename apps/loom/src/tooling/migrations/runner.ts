import type pg from "pg";
import * as v from "valibot";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/pg-core/async";
import { protectApplication } from "./application";
import { bootstrapSession } from "./bootstrap";
import {
  acquireMigrationLock,
  acquireExtensionLock,
  assertMigrationConnection,
  databaseIdentifier,
  quoteIdentifier,
  withMigrationConnection,
} from "./connection";
import { catalogFingerprint } from "./drift";
import { readMigrations } from "./history";
import { validateRequiredApiForTarget, verifyRequiredApiOnTarget } from "./required-api-verification";
import { inspectHistory, ormHistoryTable } from "./state";
import { preparedComponentIssues } from "./component-extensions";
import { assertGeneratedVersion } from "../codegen/generate";
import { databaseIdentity } from "./status";
import type { DatabaseIdentity } from "./status";
import { assertRuntimeCompatibility } from "./runtime-compatibility";
import { assertRetainedExtensionCompatibility } from "./extension-compatibility";
import {
  inspectExtensions,
  verifyExtensions,
  preflightExtensionPlan,
  applyExtensionOperations,
  grantExtensionUsage,
  ExtensionError,
} from "./extensions";
import type { ExtensionState } from "./extensions";
import { neonExtensionNames } from "../config/extensions";
import {
  concurrentIndexOperations,
  executeConcurrentIndexes,
  readConcurrentRecovery,
  verifyConcurrentBaseline,
} from "./nontransactional";

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
  expectedHashes: v.optional(v.array(v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)))),
  recoverNontransactional: v.optional(v.boolean(), false),
});
const connectionOptions = v.omit(runnerOptions, ["connectionString"]);
export type ApplyMigrationsOnConnectionOptions = v.InferInput<typeof connectionOptions>;
export type ApplyMigrationsOptions = v.InferInput<typeof runnerOptions>;
export interface MigrationReceipt {
  readonly target: DatabaseIdentity;
  readonly namespace: string;
  readonly applied: readonly string[];
  readonly head: string | null;
  readonly extensions?: { readonly required: readonly ExtensionState[]; readonly installed: readonly ExtensionState[] };
}

export async function applyMigrations(options: ApplyMigrationsOptions): Promise<MigrationReceipt> {
  const config = v.parse(runnerOptions, options);
  const { connectionString, ...migrationOptions } = config;
  return withMigrationConnection(connectionString, (client) => applyMigrationsOnConnection(client, migrationOptions));
}

/** Runs on a connection owned by Loom. The migration lock remains held until its owning callback ends. */
export async function applyMigrationsOnConnection(
  client: pg.Client,
  options: ApplyMigrationsOnConnectionOptions,
): Promise<MigrationReceipt> {
  assertMigrationConnection(client);
  const config = v.parse(connectionOptions, options);
  const artifacts = await readMigrations(config.root, config.migrations);
  for (const { plan } of artifacts)
    if (plan.format === 3 && plan.requiredApi) validateRequiredApiForTarget(plan.requiredApi);
  const extensionHead = artifacts.at(-1)?.plan;
  if (extensionHead?.format === 3) await acquireExtensionLock(client);
  // Session lifetime bounds this lock, including failure paths and nested ORM transactions.
  await acquireMigrationLock(client, `loom:migrations:${config.namespace}`);
  if (config.sourceVersion) await assertGeneratedVersion(config.root, config.sourceVersion);
  if (
    config.expectedHashes &&
    JSON.stringify(artifacts.map((artifact) => artifact.plan.hash)) !== JSON.stringify(config.expectedHashes)
  )
    throw new Error("Release migration history changed");
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
  }
  let state = await inspectHistory(client, config, artifacts);
  let pending = artifacts.slice(state.applied.length);
  let issues = await preparedComponentIssues(client, state.issues, pending.length, extensionHead);
  if (issues.includes("EXTENSION_DRIFT"))
    throw new ExtensionError("DRIFT", "Extension drift detected; inspect loom migrations status before applying");
  if (!pending.length && extensionHead?.format === 3 && extensionHead.requiredApi)
    await verifyRequiredApiOnTarget(client, extensionHead.requiredApi, config.runtimeRole);
  for (const artifact of pending) {
    if (!artifact.plan.safety.automatic && !config.reviewedHashes.includes(artifact.plan.hash))
      throw new Error(`Migration requires review of artifact ${artifact.plan.hash}`);
  }
  if (extensionHead?.format === 3) {
    let target = await inspectExtensions(client);
    for (const { plan } of pending) {
      if (plan.format !== 3) continue;
      if (plan.extensionScope === "component") verifyExtensions(target, plan.extensions.requirements);
      else target = preflightExtensionPlan(target, plan.extensions);
    }
  }
  // An authenticated framework prefix cannot authorize repair of unrelated history.
  // Explicit concurrent recovery retains its existing, later journal/baseline validation.
  const recovering = config.recoverNontransactional && issues.includes("NONTRANSACTIONAL_IN_PROGRESS");
  if (issues.includes("BACKFILL_IN_PROGRESS"))
    throw new Error("Complete running backfills before applying further migrations");
  if ((!recovering && issues.includes("LIVE_DRIFT")) || issues.includes("UNTRACKED_NAMESPACE"))
    throw new Error("Live database drift detected; migration stopped");
  if (
    issues.some(
      (issue) =>
        issue !== "FRAMEWORK_UPGRADE_REQUIRED" &&
        !(recovering && (issue === "LIVE_DRIFT" || issue === "NONTRANSACTIONAL_IN_PROGRESS")),
    )
  )
    throw new Error("Applied migration history differs from committed artifacts or ORM history");
  await bootstrapSession(client, config.metadataNamespace, config.runtimeRole);
  state = await inspectHistory(client, config, artifacts);
  if (state.framework.state !== "current") throw new Error("Framework metadata is not current after bootstrap");
  pending = artifacts.slice(state.applied.length);
  issues = await preparedComponentIssues(client, state.issues, pending.length, extensionHead);
  if (issues.includes("EXTENSION_DRIFT"))
    throw new ExtensionError("DRIFT", "Extension drift detected; inspect loom migrations status before applying");
  const metadata = quoteIdentifier(config.metadataNamespace);
  if (issues.includes("BACKFILL_IN_PROGRESS"))
    throw new Error("Complete running backfills before applying further migrations");
  const recovery = await readConcurrentRecovery(client, config);
  for (const artifact of artifacts.slice(state.applied.length)) {
    if (!artifact.plan.safety.transactional) {
      if (!config.recoverNontransactional)
        throw new Error("Nontransactional migration requires explicit recovery mode");
      await concurrentIndexOperations(artifact, config.namespace);
    }
  }
  if (recovery) {
    const pending = artifacts[state.applied.length];
    if (!config.recoverNontransactional || !pending || !state.expectedCatalog)
      throw new Error("Concurrent migration requires explicit recovery of its pending artifact");
    await verifyConcurrentBaseline(client, config, pending, state.expectedCatalog, state.applied.length + 1);
  }
  if ((!recovery && issues.includes("LIVE_DRIFT")) || issues.includes("UNTRACKED_NAMESPACE"))
    throw new Error("Live database drift detected; migration stopped");
  if (issues.some((issue) => !(recovery && (issue === "LIVE_DRIFT" || issue === "NONTRANSACTIONAL_IN_PROGRESS"))))
    throw new Error("Applied migration history differs from committed artifacts or ORM history");
  const drizzleTable = ormHistoryTable(config.namespace);
  await assertRetainedExtensionCompatibility(client, config.metadataNamespace, pending);
  await assertRuntimeCompatibility(
    client,
    config,
    artifacts.map((artifact) => artifact.plan.hash),
    state.applied.length,
  );
  const applied: string[] = [];
  const db = drizzle({ client });
  let expectedCatalog = state.expectedCatalog;
  for (const [index, artifact] of artifacts.entries()) {
    if (index < state.applied.length) continue;
    if (!artifact.plan.safety.transactional) {
      if (!expectedCatalog) throw new Error("Concurrent recovery requires an applied structural baseline");
      // Validated nontransactional artifacts cannot carry extension operations. Recheck the
      // already-installed target before the index runner can journal or execute application DDL.
      if (artifact.plan.format === 3 && artifact.plan.requiredApi)
        await verifyRequiredApiOnTarget(client, artifact.plan.requiredApi, config.runtimeRole);
      await executeConcurrentIndexes(client, config, artifact, expectedCatalog, index + 1);
    }
    await db.transaction(async (tx) => {
      if (artifact.plan.format === 3) {
        if (artifact.plan.extensionScope === "application")
          await applyExtensionOperations(client, artifact.plan.extensions);
        else verifyExtensions(await inspectExtensions(client), artifact.plan.extensions.requirements);
        await grantExtensionUsage(client, artifact.plan.extensions.requirements, config.runtimeRole);
        if (artifact.plan.requiredApi)
          await verifyRequiredApiOnTarget(client, artifact.plan.requiredApi, config.runtimeRole);
      }
      let statements = [...artifact.plan.statements];
      if (
        artifact.plan.format === 3 &&
        artifact.plan.kind === "generated" &&
        !artifact.plan.baseline.ddl.some(
          (entity) => entity.entityType === "schemas" && entity.name === config.namespace,
        ) &&
        artifact.plan.extensions.operations.some(
          (operation) =>
            (operation.kind === "install" || operation.kind === "move" || operation.kind === "adopt") &&
            operation.after.schema === config.namespace,
        )
      ) {
        // Checked preparation or adoption has already established this namespace.
        const createSchema = `CREATE SCHEMA ${quoteIdentifier(config.namespace)};`;
        statements = statements.filter((statement) => statement.trim() !== createSchema);
      }
      // The exported ORM migrator nests a savepoint within this outer transaction.
      await migrate(
        [
          {
            sql: artifact.plan.safety.transactional ? statements : [],
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
      const tables = artifact.plan.snapshot.ddl
        .filter((entity) => entity.entityType === "tables")
        .map((entity) => entity.name)
        .filter((table) =>
          ["_id", "_createdAt"].every((name) =>
            artifact.plan.snapshot.ddl.some(
              (entity) => entity.entityType === "columns" && entity.table === table && entity.name === name,
            ),
          ),
        );
      await protectApplication(client, config.namespace, config.runtimeRole, tables, config.metadataNamespace);
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
      if (!artifact.plan.safety.transactional) {
        const removed = await client.query(
          `DELETE FROM ${metadata}.nontransactional_migrations WHERE namespace=$1 AND hash=$2`,
          [config.namespace, artifact.plan.hash],
        );
        if (removed.rowCount !== 1) throw new Error("Concurrent migration journal changed before completion");
      }
      expectedCatalog = catalogHash;
    });
    applied.push(artifact.plan.hash);
  }
  const receipt: MigrationReceipt = {
    target: await databaseIdentity(client),
    namespace: config.namespace,
    applied,
    head: artifacts.at(-1)?.plan.after ?? null,
  };
  if (extensionHead?.format !== 3) return receipt;
  const observed = await inspectExtensions(client);
  verifyExtensions(observed, extensionHead.extensions.requirements);
  const names = new Set<string>(extensionHead.extensions.after.map((entry) => entry.name));
  return {
    ...receipt,
    extensions: {
      required: extensionHead.extensions.requirements,
      installed: observed.installed
        .filter((entry) => names.has(entry.name))
        .map(({ name, version, schema, requires }) => ({
          name: v.parse(v.picklist(neonExtensionNames), name),
          version,
          schema,
          requires,
        })),
    },
  };
}
