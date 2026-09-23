import * as v from "valibot";
import { configValidator } from "../../config/define-config";
import { quoteIdentifier } from "../../migrations/connection";
import { withDeploymentConnection } from "./connection";
import type { DeploymentConnectionOptions, DeploymentDatabaseProvider } from "./connection";

/** Database stage only. Provider triggers must be disabled separately before branch activation. */
export async function quarantinePreviewDatabase(
  options: DeploymentConnectionOptions & { readonly environment: "preview" },
  provider?: DeploymentDatabaseProvider,
) {
  if (options.environment !== "preview") throw new Error("Quarantine requires an explicit preview target");
  const config = v.parse(configValidator, options.config);
  const namespace = config.database.metadataNamespace;
  const schema = quoteIdentifier(namespace);
  return withDeploymentConnection(
    { ...options, config },
    async (client, target) => {
      const owner = await client.query<{ owned: boolean }>(
        "SELECT nspowner = (SELECT oid FROM pg_roles WHERE rolname = current_user) AS owned FROM pg_namespace WHERE nspname = $1",
        [namespace],
      );
      if (owner.rows[0]?.owned !== true) throw new Error("Quarantine requires the metadata owner");
      await client.query("BEGIN");
      try {
        const grants = await client.query(
          `UPDATE ${schema}.deployment_activations SET state = 'quarantined', updated_at = clock_timestamp() WHERE state = 'active'`,
        );
        const jobs = await client.query(`UPDATE ${schema}.jobs
        SET state = 'cancelled', cancel_requested = TRUE, lease_owner = NULL, lease_expires_at = NULL,
          fencing_token = fencing_token + 1, error_code = 'CANCELLED'
        WHERE state IN ('pending', 'running')`);
        options.signal?.throwIfAborted();
        await client.query("COMMIT");
        return Object.freeze({
          projectId: target.projectId,
          branchId: target.branchId,
          endpointId: target.endpointId,
          revokedGrants: grants.rowCount ?? 0,
          cancelledJobs: jobs.rowCount ?? 0,
        });
      } catch {
        await client.query("ROLLBACK").catch(() => {});
        throw new Error("Preview quarantine transaction failed");
      }
    },
    provider,
  );
}
