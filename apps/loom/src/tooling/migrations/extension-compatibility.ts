import type pg from "pg";
import { assertExtensionLock, quoteIdentifier } from "./connection";
import { ExtensionError } from "./extensions";
import type { MigrationArtifact } from "./history";

/** Structural schema ranges do not establish behavior across extension version or placement changes. */
export async function assertRetainedExtensionCompatibility(
  client: pg.Client,
  metadataNamespace: string,
  pending: readonly MigrationArtifact[],
): Promise<void> {
  const changing = pending.filter(
    ({ plan }) =>
      plan.format === 3 && plan.extensions.operations.some((entry) => entry.kind === "update" || entry.kind === "move"),
  );
  if (!changing.length) return;
  assertExtensionLock(client);
  const metadata = quoteIdentifier(metadataNamespace);
  const retained = await client.query<{ deployment: string; version: string | null }>(
    `SELECT DISTINCT deployment,version FROM (
      SELECT deployment,version FROM ${metadata}.deployment_activations WHERE state='active'
      UNION ALL SELECT deployment,COALESCE(claim_version,call->>'version') FROM ${metadata}.jobs WHERE state IN ('pending','running')
      UNION ALL SELECT deployment,version FROM ${metadata}.client_sessions WHERE expires_at>clock_timestamp()
    ) dependencies ORDER BY deployment,version`,
  );
  if (retained.rowCount)
    throw new ExtensionError(
      "RETAINED_COMPATIBILITY",
      `Retire retained runtimes and drain their jobs and client sessions before changing shared extensions; schema ranges do not prove extension compatibility. Changing artifacts: ${changing.map(({ plan }) => plan.hash).join(", ")}. Retained releases: ${retained.rows.map((entry) => `${entry.deployment}:${entry.version ?? "unknown"}`).join(", ")}`,
    );
}
