import type pg from "pg";
import type { NeonApi } from "@neon/config-runtime";
import * as v from "valibot";
import type { LoomConfig } from "../config/define-config";
import { configValidator } from "../config/define-config";
import { databaseIdentifier, withMigrationConnection } from "../migrations/connection";
import { createDevelopmentProvider, inspectDevelopmentTarget } from "./target";
import type { DevelopmentProvider, DevelopmentTarget } from "./target";

export type DevelopmentDatabaseProvider = DevelopmentProvider & Pick<NeonApi, "getConnectionUri">;
export interface DevelopmentConnectionOptions {
  readonly config: LoomConfig;
  readonly databaseName: string;
  readonly migrationRole: string;
  readonly signal?: AbortSignal;
}

function validateConnection(uri: string, target: DevelopmentTarget, databaseName: string, roleName: string): void {
  try {
    const address = new URL(uri);
    if (
      !["postgres:", "postgresql:"].includes(address.protocol) ||
      decodeURIComponent(address.username) !== roleName ||
      decodeURIComponent(address.pathname.slice(1)) !== databaseName ||
      address.hostname.split(".")[0] !== target.endpointId ||
      address.hostname.includes("-pooler.")
    )
      throw new Error("Connection refused");
    // pg also accepts identity overrides in the query string. Refuse ambiguous connection identities.
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
    throw new Error("Provider connection does not match the development target");
  }
}

/** Resolves credentials from the verified target and owns its dedicated, locked database session. */
export async function withDevelopmentConnection<T>(
  options: DevelopmentConnectionOptions,
  operation: (client: pg.Client, target: DevelopmentTarget) => Promise<T>,
  provider?: DevelopmentDatabaseProvider,
): Promise<T> {
  const config = v.parse(configValidator, options.config);
  const databaseName = v.parse(databaseIdentifier, options.databaseName);
  const roleName = v.parse(databaseIdentifier, options.migrationRole);
  const namespace = v.parse(databaseIdentifier, config.database.namespace);
  if (namespace === "public") throw new Error("Development sync requires an isolated application namespace");
  const api = provider ?? createDevelopmentProvider();
  options.signal?.throwIfAborted();
  const target = await inspectDevelopmentTarget(config, api);
  const credentials = await api
    .getConnectionUri(target.projectId, {
      branchId: target.branchId,
      endpointId: target.endpointId,
      databaseName,
      roleName,
      pooled: false,
    })
    .catch(() => {
      throw new Error("Could not resolve development connection");
    });
  validateConnection(credentials.uri, target, databaseName, roleName);
  options.signal?.throwIfAborted();
  return withMigrationConnection(credentials.uri, async (client) => {
    await client.query("SELECT pg_advisory_lock(hashtextextended($1, 0))", [`loom:migrations:${namespace}`]);
    options.signal?.throwIfAborted();
    const current = await inspectDevelopmentTarget(config, api);
    if (
      current.projectId !== target.projectId ||
      current.branchId !== target.branchId ||
      current.branchName !== target.branchName ||
      current.endpointId !== target.endpointId
    )
      throw new Error("Development target changed while waiting for the migration lock");
    options.signal?.throwIfAborted();
    return operation(client, current);
  });
}
