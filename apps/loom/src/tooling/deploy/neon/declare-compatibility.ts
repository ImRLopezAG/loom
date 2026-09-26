import { assertGeneratedVersion } from "../../codegen/generate";
import { createSnapshot, snapshotHash } from "../../migrations/adapter";
import { acquireMigrationLock, quoteIdentifier } from "../../migrations/connection";
import { recordRuntimeCompatibility } from "../../migrations/runtime-compatibility";
import { migrationStatusOnConnection } from "../../migrations/status";
import { inspectReleaseSchema } from "../compatibility";
import { withDeploymentConnection } from "./connection";
import type { DeploymentDatabaseProvider } from "./connection";
import { readProjectRelease } from "./project";

/** Record reviewed compatibility for existing code without applying DDL or changing release ingress. */
export async function declareProjectCompatibility(
  root: string,
  file: string,
  provider?: DeploymentDatabaseProvider,
  signal?: AbortSignal,
) {
  const { project, declaration } = await readProjectRelease(root, file, signal);
  if (declaration.quarantine !== "preserve" || declaration.retainedReleaseKey)
    throw new Error("Compatibility declaration requires existing code in preserve mode");
  const { namespace, metadataNamespace, migrations } = project.config.database;
  const sourceSchema = snapshotHash(await createSnapshot(project.schema));
  const connection = {
    config: project.config,
    environment: declaration.environment,
    databaseName: declaration.databaseName,
    migrationRole: declaration.migrationRole,
  };
  return withDeploymentConnection(
    signal ? { ...connection, signal } : connection,
    async (client, target, database) => {
      await acquireMigrationLock(client, `loom:migrations:${namespace}`, false, signal);
      await assertGeneratedVersion(project.root, declaration.version);
      const inspection = await inspectReleaseSchema(project.root, {
        namespace,
        migrations,
        schema: declaration.schema,
        migrationHashes: declaration.migrationHashes,
      });
      const owner = await client.query<{ owned: boolean }>(
        "SELECT nspowner=(SELECT oid FROM pg_roles WHERE rolname=current_user) AS owned FROM pg_namespace WHERE nspname=$1",
        [metadataNamespace],
      );
      if (owner.rows[0]?.owned !== true) throw new Error("Migration identity must own the metadata namespace");
      const status = await migrationStatusOnConnection(client, {
        root: project.root,
        namespace,
        metadataNamespace,
        migrations,
      });
      if (!status.initialized || !status.consistent)
        throw new Error("Compatibility requires consistent database history and catalog");
      const active = await client.query(
        `SELECT 1 FROM ${quoteIdentifier(metadataNamespace)}.deployment_activations WHERE deployment=$1 AND version=$2 AND project_id=$3 AND branch_id=$4 AND endpoint_host=$5 AND database_name=$6 AND state='active'`,
        [
          declaration.deployment,
          declaration.version,
          target.projectId,
          target.branchId,
          database.endpointHost,
          database.databaseName,
        ],
      );
      if (active.rowCount !== 1) throw new Error("Compatibility requires the exact active runtime target");
      signal?.throwIfAborted();
      await recordRuntimeCompatibility(client, {
        namespace,
        metadataNamespace,
        deployment: declaration.deployment,
        version: declaration.version,
        sourceSchema,
        inspection,
      });
      return {
        target,
        namespace,
        deployment: declaration.deployment,
        version: declaration.version,
        sourceSchema,
        schema: declaration.schema,
        migrationHashes: declaration.migrationHashes,
      };
    },
    provider,
  );
}
