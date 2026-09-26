import { AsyncLocalStorage } from "node:async_hooks";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { RevisionReader, TableRevisions } from "../realtime/revisions";

interface Capture {
  revisions?: TableRevisions;
}
const captures = new AsyncLocalStorage<Capture>();

/** Called only by the outer transaction, after authorization and output validation. */
export async function captureSnapshotRevisions(db: NodePgDatabase, read: RevisionReader | undefined) {
  const capture = captures.getStore();
  if (!capture) return;
  if (!read) throw new Error("Live evaluation requires a revision reader");
  capture.revisions = await read(db);
}

export async function evaluateSnapshot<T>(evaluate: () => Promise<T>) {
  const capture: Capture = {};
  const value = await captures.run(capture, evaluate);
  if (!capture.revisions) throw new Error("Live evaluation requires a database-read transaction");
  return { value, revisions: capture.revisions };
}
