import { createHmac } from "node:crypto";
import type pg from "pg";
import * as v from "valibot";
import { assertGeneratedVersion } from "../../codegen/generate";
import { createSnapshot, snapshotHash } from "../../migrations/adapter";
import { bootstrapSession } from "../../migrations/bootstrap";
import { acquireMigrationLock, databaseIdentifier, quoteIdentifier } from "../../migrations/connection";
import { applyMigrationsOnConnection } from "../../migrations/runner";
import { migrationStatusOnConnection } from "../../migrations/status";
import { loadProject } from "../../project/load";
import { inspectReleaseSchema, releaseSchemaRangeValidator } from "../compatibility";
import { withDeploymentActivationSessionOnConnection } from "./activation";
import type { DeploymentActivationSession } from "./activation";
import { withDeploymentConnection } from "./connection";
import type { DeploymentDatabaseProvider } from "./connection";
import { inspectReleaseDatabase } from "./live-schema";
import type { ReleaseDatabaseInspection } from "./live-schema";
import { withNeonReleaseReceipt } from "./release-receipt";
import type { NeonReleaseJournal } from "./release-receipt";

const hash = v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/));
export const releaseDatabaseOptionsValidator = v.strictObject({
  releaseKey: hash,
  inputHash: hash,
  deployment: v.pipe(v.string(), v.minLength(1), v.maxLength(256)),
  version: hash,
  activationToken: hash,
  environment: v.picklist(["preview", "production"]),
  databaseName: databaseIdentifier,
  migrationRole: databaseIdentifier,
  runtimeRole: databaseIdentifier,
  quarantine: v.picklist(["clone", "preserve"]),
  reviewedHashes: v.array(hash),
  migrationHashes: v.array(hash),
  schema: releaseSchemaRangeValidator,
});
export type NeonReleaseDatabaseOptions = v.InferInput<typeof releaseDatabaseOptionsValidator> & {
  readonly signal?: AbortSignal;
};
export interface NeonReleaseDatabaseSession {
  readonly client: pg.Client;
  readonly activation: DeploymentActivationSession;
  readonly journal: NeonReleaseJournal;
  readonly database: ReleaseDatabaseInspection;
}

/** Prepares database stages, then retains both locks for provider stages in the callback. */
export async function withNeonReleaseDatabase<T>(
  root: string,
  input: NeonReleaseDatabaseOptions,
  operation: (session: NeonReleaseDatabaseSession) => Promise<T>,
  provider?: DeploymentDatabaseProvider,
): Promise<T> {
  const { signal, ...values } = input;
  const parsed = v.safeParse(releaseDatabaseOptionsValidator, structuredClone(values));
  if (!parsed.success) throw new Error("Invalid release database input");
  const options = parsed.output;
  signal?.throwIfAborted();
  if (options.environment === "production" && options.quarantine === "clone")
    throw new Error("Production release cannot quarantine work");
  const project = await loadProject(root);
  if (project.version !== options.version) throw new Error("Release source version changed");
  if (snapshotHash(await createSnapshot(project.schema)) !== options.schema.target)
    throw new Error("Release schema differs from project source");
  const { namespace, metadataNamespace, migrations } = project.config.database;
  const schemaOptions = { namespace, migrations, schema: options.schema, migrationHashes: options.migrationHashes };
  await inspectReleaseSchema(project.root, schemaOptions);
  // Bind confidential inputs without writing credentials or an unkeyed secret fingerprint to disk.
  const { activationToken, ...identityInputs } = options;
  const inputHash = createHmac("sha256", activationToken)
    .update(JSON.stringify({ config: project.config, options: identityInputs }))
    .digest("hex");
  const connectionOptions = {
    config: project.config,
    environment: options.environment,
    databaseName: options.databaseName,
    migrationRole: options.migrationRole,
  };
  return withDeploymentConnection(
    signal ? { ...connectionOptions, signal } : connectionOptions,
    async (client, target, database) =>
      withNeonReleaseReceipt(
        project.root,
        options.releaseKey,
        {
          deployment: options.deployment,
          version: options.version,
          inputHash,
          target,
          database: { ...database, namespace, metadataNamespace },
          schema: options.schema,
          migrationHashes: options.migrationHashes,
        },
        async (journal) => {
          await acquireMigrationLock(client, `loom:migrations:${namespace}`, false, signal);
          await assertGeneratedVersion(project.root, options.version);
          await inspectReleaseSchema(project.root, schemaOptions);
          signal?.throwIfAborted();
          const completed = new Set(journal.read().completed.map((entry) => entry.stage));
          const status = await migrationStatusOnConnection(client, {
            root: project.root,
            migrations,
            namespace,
            metadataNamespace,
          });
          if (status.pending.some((artifact) => !artifact.safety.transactional))
            throw new Error("Nontransactional migration requires the explicit recovery runner");
          if (
            status.issues.some((issue) => issue !== "FRAMEWORK_HISTORY_DIVERGED") ||
            (completed.has("metadata") && (!status.initialized || !status.consistent))
          )
            throw new Error("Release database history or catalog is inconsistent");
          if (
            status.pending.some(
              (artifact) => !artifact.safety.automatic && !options.reviewedHashes.includes(artifact.hash),
            )
          )
            throw new Error("Release migration requires review");
          if (!completed.has("metadata")) {
            await bootstrapSession(client, metadataNamespace, options.runtimeRole);
            await journal.complete({ stage: "metadata" });
          }
          return withDeploymentActivationSessionOnConnection(client, options, async (activation) => {
            signal?.throwIfAborted();
            if (!completed.has("quarantine")) {
              if (options.quarantine === "clone") {
                const active = await client.query(
                  `SELECT 1 FROM ${quoteIdentifier(metadataNamespace)}.deployment_activations WHERE state = 'active' AND project_id = $1 AND branch_id = $2 LIMIT 1`,
                  [target.projectId, target.branchId],
                );
                if (active.rowCount) throw new Error("Clone quarantine refuses an active branch");
                const receipt = await activation.quarantinePreview();
                await journal.complete({
                  stage: "quarantine",
                  revokedGrants: receipt.revokedGrants,
                  cancelledJobs: receipt.cancelledJobs,
                });
              } else {
                await journal.complete({ stage: "quarantine", revokedGrants: 0, cancelledJobs: 0 });
              }
            }
            signal?.throwIfAborted();
            if (!completed.has("migrations")) {
              await applyMigrationsOnConnection(client, {
                root: project.root,
                migrations,
                namespace,
                metadataNamespace,
                runtimeRole: options.runtimeRole,
                reviewedHashes: options.reviewedHashes,
                expectedHashes: options.migrationHashes,
                sourceVersion: options.version,
              });
            }
            const database = await inspectReleaseDatabase(client, project.root, schemaOptions);
            await journal.complete({ stage: "migrations", head: database.head });
            if (completed.has("prepared")) await activation.inspect();
            else {
              await activation.prepare();
              await journal.complete({ stage: "prepared" });
            }
            if (completed.has("activated")) await activation.assertActive();
            signal?.throwIfAborted();
            return operation(Object.freeze({ client, activation, journal, database }));
          });
        },
      ),
    provider,
  );
}
