import { AsyncLocalStorage } from "node:async_hooks";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { RevisionReader, TableRevisions } from "../realtime/revisions";
import { withExtensionSqlExecution } from "../../extensions/sql";

interface Capture {
  revisions?: TableRevisions;
  failure?: Error;
  readonly dependencies: Set<string>;
}
const captures = new AsyncLocalStorage<Capture>();

/** Called only by the outer transaction, after authorization and output validation. */
export async function captureSnapshotRevisions(db: NodePgDatabase, read: RevisionReader | undefined) {
  const capture = captures.getStore();
  if (!capture) return;
  if (!read) throw new Error("Live evaluation requires a revision reader");
  const revisions = await read(db);
  capture.revisions = Object.freeze({ ...capture.revisions, ...revisions });
}

export async function evaluateSnapshot<T>(evaluate: () => Promise<T>) {
  const capture: Capture = { dependencies: new Set() };
  const value = await captures.run(capture, () =>
    withExtensionSqlExecution(
      {
        check(contract, relations) {
          if (contract.observability !== "tables") {
            capture.failure ??= new Error(
              `Automatic live query cannot observe ${contract.observability} extension dependency: ${contract.member}`,
            );
            throw capture.failure;
          }
          for (const table of contract.dependencies) capture.dependencies.add(table);
          for (const table of relations ?? []) capture.dependencies.add(table);
        },
      },
      evaluate,
    ),
  );
  if (capture.failure) throw capture.failure;
  if (!capture.revisions) throw new Error("Live evaluation requires a database-read transaction");
  for (const table of capture.dependencies)
    if (!Object.hasOwn(capture.revisions, table))
      throw new Error(`Automatic live query has an unknown table dependency: ${table}`);
  return { value, revisions: capture.revisions };
}
