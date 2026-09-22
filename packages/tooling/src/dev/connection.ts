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
  const credentials = await api.getConnectionUri(target.projectId, {
    branchId: target.branchId,
    endpointId: target.endpointId,
    databaseName,
    roleName,
    pooled: false,
  });
  const uri = new URL(credentials.uri);
  if (
    !["postgres:", "postgresql:"].includes(uri.protocol) ||
    decodeURIComponent(uri.username) !== roleName ||
    decodeURIComponent(uri.pathname.slice(1)) !== databaseName ||
    uri.hostname.includes("-pooler.")
  )
    throw new Error("Provider returned connection details inconsistent with the selected development database");
  // pg also accepts identity overrides in the query string. Refuse ambiguous connection identities.
  for (const name of [
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
    if (uri.searchParams.has(name)) throw new Error("Development connection contains an identity override");
  options.signal?.throwIfAborted();
  return withMigrationConnection(credentials.uri, async (client) => {
    await client.query("SELECT pg_advisory_lock(hashtextextended($1, 0))", [`loom:migrations:${namespace}`]);
    options.signal?.throwIfAborted();
    const current = await inspectDevelopmentTarget(config, api);
    if (
      current.projectId !== target.projectId ||
      current.branchId !== target.branchId ||
      current.endpointId !== target.endpointId
    )
      throw new Error("Development target changed while waiting for the migration lock");
    options.signal?.throwIfAborted();
    return operation(client, current);
  });
}
