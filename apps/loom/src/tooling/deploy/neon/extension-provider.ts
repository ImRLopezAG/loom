import type { NeonApi } from "@neon/config-runtime/v1";
import type pg from "pg";
import { bindExtensionProvider } from "../../migrations/connection";
import type { KelloConfig } from "../../config/define-config";
import { createKelloNeonApi } from "../../neon/api";
import { ExtensionError } from "../../migrations/extensions";

/** Bind only current endpoint metadata, rather than a caller-supplied configuration claim. */
export async function bindNeonExtensionProvider(
  client: pg.Client,
  api: Pick<NeonApi, "listEndpoints">,
  target: { readonly projectId: string; readonly branchId: string; readonly endpointId: string },
): Promise<void> {
  const matches = (await api.listEndpoints(target.projectId)).filter(
    (entry) => entry.id === target.endpointId && entry.branchId === target.branchId && entry.type === "read_write",
  );
  const endpoint = matches[0];
  if (!endpoint || matches.length !== 1) throw new Error("Extension endpoint identity changed");
  // Neon: 0 selects the plan default. Only -1 explicitly disables scale-to-zero.
  bindExtensionProvider(client, { activeCompute: endpoint.suspendTimeout === -1 });
}

/** Environment-based migration commands must bind cron prerequisites to the actual linked Neon endpoint. */
export async function bindMigrationExtensionProvider(
  client: pg.Client,
  config: KelloConfig,
  uri: string,
): Promise<void> {
  if (!config.database.extensions?.pg_cron) return;
  const projectId = config.provider?.projectId ?? config.projectId;
  const branches = config.provider
    ? Object.values(config.provider.targets).map((target) => target?.branchId)
    : [config.branchId];
  const branch = (await client.query<{ id: string | null }>("SELECT current_setting('neon.branch_id', true) AS id"))
    .rows[0]?.id;
  const endpointId = new URL(uri).hostname.split(".")[0];
  if (!projectId || !branch || !branches.includes(branch) || !endpointId)
    throw new ExtensionError(
      "PREREQUISITE",
      "pg_cron migration inspection requires a linked Neon endpoint matching the migration connection",
    );
  await bindNeonExtensionProvider(client, createKelloNeonApi(), { projectId, branchId: branch, endpointId });
}
