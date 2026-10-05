import type pg from "pg";
import type { NeonApi } from "@neon/config-runtime";
import * as v from "valibot";
import type { KelloConfig } from "../config/define-config";
import { configValidator } from "../config/define-config";
import {
  acquireExtensionLock,
  acquireMigrationLock,
  databaseIdentifier,
  withMigrationConnection,
} from "../migrations/connection";
import { createDevelopmentProvider, inspectDevelopmentTarget } from "./target";
import type { DevelopmentProvider, DevelopmentTarget } from "./target";
import { resolveDevelopmentCredentials } from "./credentials";
export { resolveDevelopmentCredentials } from "./credentials";
import { bindNeonExtensionProvider } from "../deploy/neon/extension-provider";
import { withTargetCloneGuard } from "../deploy/neon/extension-quarantine";

export type DevelopmentDatabaseProvider = DevelopmentProvider &
  Pick<NeonApi, "getConnectionUri"> &
  Partial<Pick<NeonApi, "listBranchBuckets" | "listBranchDatabases">>;
export interface DevelopmentConnectionOptions {
  readonly root?: string;
  readonly config: KelloConfig;
  readonly databaseName: string;
  readonly migrationRole: string;
  readonly signal?: AbortSignal;
}

export interface DevelopmentDatabaseIdentity {
  readonly endpointHost: string;
  readonly databaseName: string;
  readonly port: string;
}

/** Resolves credentials from the verified target and owns its dedicated, locked database session. */
export async function withDevelopmentConnection<T>(
  options: DevelopmentConnectionOptions,
  operation: (client: pg.Client, target: DevelopmentTarget, database: DevelopmentDatabaseIdentity) => Promise<T>,
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
  return withTargetCloneGuard(
    api,
    target,
    async () => {
      const credentials = await resolveDevelopmentCredentials(api, target, databaseName, roleName);
      options.signal?.throwIfAborted();
      return withMigrationConnection(credentials.connectionString, async (client) => {
        await acquireExtensionLock(client, options.signal);
        // Match release lock order: deployment first, then application migrations.
        await acquireMigrationLock(
          client,
          `loom:deployment:${config.database.metadataNamespace}`,
          false,
          options.signal,
        );
        await acquireMigrationLock(client, `loom:migrations:${namespace}`, false, options.signal);
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
        if (config.database.extensions?.pg_cron) await bindNeonExtensionProvider(client, api, current);
        return operation(client, current, credentials.database);
      });
    },
    options.root,
  );
}
