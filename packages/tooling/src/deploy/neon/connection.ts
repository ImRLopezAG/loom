import type pg from "pg";
import { createNeonApiFromOptions } from "@neon/config-runtime/v1";
import type { NeonApi } from "@neon/config-runtime/v1";
import * as v from "valibot";
import { configValidator } from "../../config/define-config";
import type { LoomConfig } from "../../config/define-config";
import { databaseIdentifier, withMigrationConnection } from "../../migrations/connection";
import { inspectDeploymentTarget } from "./target";
import type { DeploymentEnvironment, DeploymentProvider, DeploymentTarget } from "./target";

export type DeploymentDatabaseProvider = DeploymentProvider & Pick<NeonApi, "getConnectionUri">;
export interface DeploymentConnectionOptions {
  readonly config: LoomConfig;
  readonly environment: DeploymentEnvironment;
  readonly databaseName: string;
  readonly migrationRole: string;
  readonly signal?: AbortSignal;
}

function validateConnection(uri: string, target: DeploymentTarget, databaseName: string, roleName: string): void {
  try {
    const address = new URL(uri);
    if (
      !(
        ["postgres:", "postgresql:"].includes(address.protocol) &&
        decodeURIComponent(address.username) === roleName &&
        decodeURIComponent(address.pathname.slice(1)) === databaseName &&
        address.hostname.split(".")[0] === target.endpointId &&
        !address.hostname.includes("-pooler.")
      )
    )
      throw new Error("Connection refused");
    for (const key of [
      "host",
      "hostaddr",
      "port",
      "user",
      "password",
      "database",
      "dbname",
      "options",
      "connectionString",
    ])
      if (address.searchParams.has(key)) throw new Error("Connection refused");
  } catch {
    throw new Error("Provider connection does not match the deployment target");
  }
}

/** Owns a dedicated deployment lock and rechecks provider identity after acquiring it. Never returns credentials. */
export async function withDeploymentConnection<T>(
  options: DeploymentConnectionOptions,
  operation: (client: pg.Client, target: DeploymentTarget) => Promise<T>,
  provider?: DeploymentDatabaseProvider,
): Promise<T> {
  const config = v.parse(configValidator, options.config);
  const databaseName = v.parse(databaseIdentifier, options.databaseName);
  const roleName = v.parse(databaseIdentifier, options.migrationRole);
  const environment = v.parse(v.picklist(["preview", "production"]), options.environment);
  const apiKey = process.env.NEON_API_KEY;
  const api = provider ?? createNeonApiFromOptions("loom deployment connection", apiKey ? { apiKey } : undefined);
  options.signal?.throwIfAborted();
  const target = await inspectDeploymentTarget(config, environment, api);
  const credentials = await api
    .getConnectionUri(target.projectId, {
      branchId: target.branchId,
      endpointId: target.endpointId,
      databaseName,
      roleName,
      pooled: false,
    })
    .catch(() => {
      throw new Error("Could not resolve deployment connection");
    });
  validateConnection(credentials.uri, target, databaseName, roleName);
  options.signal?.throwIfAborted();
  return withMigrationConnection(credentials.uri, async (client) => {
    await client.query("SELECT pg_advisory_lock(hashtextextended($1, 0))", [
      `loom:deployment:${config.database.metadataNamespace}`,
    ]);
    options.signal?.throwIfAborted();
    const current = await inspectDeploymentTarget(config, environment, api);
    if (
      (["projectId", "branchId", "branchName", "endpointId", "protected"] as const).some(
        (key) => current[key] !== target[key],
      )
    )
      throw new Error("Deployment target changed while acquiring the lock");
    options.signal?.throwIfAborted();
    return operation(client, current);
  });
}
