import type pg from "pg";
import type { MigrationPlan } from "./planner";
import { inspectExtensions, verifyExtensions } from "./extensions";

/** An applied application artifact can advance shared state before a pending component checkpoint. */
export async function preparedComponentIssues<T extends string>(
  client: pg.Client,
  issues: readonly T[],
  pending: number,
  head: MigrationPlan | undefined,
): Promise<T[]> {
  if (
    !issues.some((issue) => issue === "EXTENSION_DRIFT") ||
    !pending ||
    head?.format !== 3 ||
    head.extensionScope !== "component"
  )
    return [...issues];
  verifyExtensions(await inspectExtensions(client), head.extensions.requirements);
  return issues.filter((issue) => issue !== "EXTENSION_DRIFT");
}
