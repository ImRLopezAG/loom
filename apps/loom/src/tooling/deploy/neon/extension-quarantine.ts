import type pg from "pg";
import type { NeonApi } from "@neon/config-runtime/v1";
import { acquireExtensionLock, assertExtensionLock, withMigrationConnection } from "../../migrations/connection";
import { ExtensionError } from "../../migrations/extensions";
import { resolveDevelopmentCredentials } from "../../dev/credentials";

/** Retain source table locks until the provider has finished copying the branch. */
export async function withCloneSourceGuard<T>(source: pg.Client, create: () => Promise<T>): Promise<T> {
  assertExtensionLock(source);
  await source.query("BEGIN");
  try {
    await assertExtensionBackgroundIdle(source);
    return await create();
  } finally {
    await source.query("ROLLBACK");
  }
}

/** Caller owns a transaction so the schedule lock remains effective through its operation. */
export async function assertExtensionBackgroundIdle(source: pg.Client): Promise<void> {
  const extensions = await source.query<{ extname: string }>(
    "SELECT extname FROM pg_extension WHERE extname IN ('pg_cron', 'timescaledb') ORDER BY extname",
  );
  // Background worker prevention for TimescaleDB is not part of Neon's endpoint contract.
  if (extensions.rows.some((entry) => entry.extname === "timescaledb"))
    throw new ExtensionError(
      "PREREQUISITE",
      "Cloning TimescaleDB requires provider-established prevention of inherited background execution before compute startup",
    );
  if (extensions.rows.some((entry) => entry.extname === "pg_cron")) {
    await source.query("LOCK TABLE cron.job IN SHARE MODE");
    const jobs = await source.query("SELECT 1 FROM cron.job WHERE active LIMIT 1");
    if (jobs.rowCount)
      throw new ExtensionError(
        "PREREQUISITE",
        "Disable inherited cron schedules on the source before cloning; SQL quarantine after clone startup cannot prevent execution",
      );
  }
}

/** Inspect ancestors before resolving a clone connection, which can wake its compute. */
export async function withTargetCloneGuard<T>(
  api: Pick<NeonApi, "listBranches" | "listEndpoints" | "getConnectionUri"> &
    Partial<Pick<NeonApi, "listBranchDatabases">>,
  target: { readonly projectId: string; readonly branchId: string },
  databaseName: string,
  roleName: string,
  operation: () => Promise<T>,
): Promise<T> {
  const branches = await api.listBranches(target.projectId);
  const endpoints = await api.listEndpoints(target.projectId);
  async function guard(branchId: string, visited: readonly string[], next: () => Promise<T>): Promise<T> {
    if (visited.includes(branchId)) throw new Error("Cyclic branch ancestry");
    const matches = branches.filter((entry) => entry.id === branchId);
    const branch = matches[0];
    if (!branch || matches.length !== 1) throw new Error("Clone source identity is ambiguous");
    if (!branch.parentId) return next();
    const parent = branches.find((entry) => entry.id === branch.parentId);
    const writable = endpoints.filter((entry) => entry.branchId === parent?.id && entry.type === "read_write");
    const endpoint = writable[0];
    if (!parent || !endpoint || writable.length !== 1)
      throw new ExtensionError(
        "PREREQUISITE",
        "Inspect the clone source using a unique read-write endpoint before waking the target",
      );
    const source = {
      projectId: target.projectId,
      branchId: parent.id,
      branchName: parent.name,
      endpointId: endpoint.id,
      postgresVersion: 18 as const,
    };
    return guard(parent.id, [...visited, branchId], async () => {
      const databases = api.listBranchDatabases
        ? await api.listBranchDatabases(target.projectId, parent.id)
        : [{ name: databaseName, ownerName: roleName, branchId: parent.id }];
      if (!databases.length || databases.some((entry) => entry.branchId !== parent.id))
        throw new Error("Clone source databases are ambiguous");
      async function inspect(index: number): Promise<T> {
        const database = databases[index];
        if (!database) return next();
        const credentials = await resolveDevelopmentCredentials(api, source, database.name, database.ownerName);
        return withMigrationConnection(credentials.connectionString, async (client) => {
          const identity = await client.query<{ id: string }>("SELECT current_setting('neon.branch_id', true) AS id");
          if (identity.rows[0]?.id !== source.branchId) throw new Error("Clone source database identity differs");
          await acquireExtensionLock(client);
          return withCloneSourceGuard(client, () => inspect(index + 1));
        });
      }
      return inspect(0);
    });
  }
  return guard(target.branchId, [], operation);
}
