import type { NeonApi } from "@neon/config-runtime/v1";
import type pg from "pg";
import { bindExtensionProvider } from "../../migrations/connection";

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
