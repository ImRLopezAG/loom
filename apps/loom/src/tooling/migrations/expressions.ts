import { parse } from "libpg-query";
import type { MigrationSnapshot } from "./adapter";

async function expressionIdentity(expression: string): Promise<string> {
  const tree = await parse(`SELECT ${expression}`);
  // PostgreSQL's parser preserves identifiers, literal values and casts. Only source offsets vary.
  return JSON.stringify(tree, <Value>(key: string, value: Value) =>
    ["location", "stmt_location", "stmt_len", "list_start", "list_end"].includes(key) ? undefined : value,
  );
}

/** Align only parser-identical CHECK expressions before invoking Drizzle's diff. */
export async function alignCheckExpressions(
  before: MigrationSnapshot,
  after: MigrationSnapshot,
): Promise<MigrationSnapshot> {
  const checks = after.ddl.filter((entity) => entity.entityType === "checks");
  const ddl = await Promise.all(
    before.ddl.map(async (entity) => {
      if (entity.entityType !== "checks") return entity;
      const target = checks.find(
        (check) => check.schema === entity.schema && check.table === entity.table && check.name === entity.name,
      );
      if (!target || target.value === entity.value) return entity;
      return (await expressionIdentity(entity.value)) === (await expressionIdentity(target.value))
        ? { ...entity, value: target.value }
        : entity;
    }),
  );
  return { ...before, ddl };
}
