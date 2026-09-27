import type { MigrationStatus } from "../../migrations/status";

/** Bootstrap may upgrade old framework metadata, but cannot repair application history or a completed metadata stage. */
export function releaseHistoryNeedsRecovery(
  status: Pick<MigrationStatus, "initialized" | "consistent" | "issues">,
  metadataAcknowledged: boolean,
): boolean {
  return (
    status.issues.some((issue) => issue !== "FRAMEWORK_HISTORY_DIVERGED") ||
    (metadataAcknowledged && (!status.initialized || !status.consistent))
  );
}
