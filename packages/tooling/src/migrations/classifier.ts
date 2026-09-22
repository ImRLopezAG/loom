import type { MigrationSnapshot } from "./adapter.js";

type Entity = MigrationSnapshot["ddl"][number];
export type MigrationRisk = "deletion" | "backfill-required" | "constraint-validation" | "type-change" | "review-required" | "nontransactional";
export interface MigrationIssue { readonly entity: string; readonly reason: MigrationRisk }
export interface MigrationSafety { readonly automatic: boolean; readonly transactional: boolean; readonly issues: readonly MigrationIssue[] }
function key(entity: Entity): string {
  return JSON.stringify([entity.entityType, "schema" in entity ? entity.schema : null, "table" in entity ? entity.table : null, entity.name]);
}
function tableKey(schema: string, table: string): string { return JSON.stringify([schema, table]); }

/** Classifies Drizzle structure; SQL generation remains exclusively Drizzle's responsibility. */
export function classifyMigration(before: MigrationSnapshot, after: MigrationSnapshot): MigrationSafety {
  const oldEntities = new Map(before.ddl.map((entity) => [key(entity), entity]));
  const newEntities = new Map(after.ddl.map((entity) => [key(entity), entity]));
  const oldTables = new Set(before.ddl.filter((entity) => entity.entityType === "tables").map((entity) => tableKey(entity.schema, entity.name)));
  const issues: MigrationIssue[] = [];
  for (const identity of oldEntities.keys()) {
    if (!newEntities.has(identity)) issues.push({ entity: identity, reason: "deletion" });
  }
  for (const [identity, entity] of newEntities) {
    const old = oldEntities.get(identity);
    if (old && JSON.stringify(old) === JSON.stringify(entity)) continue;
    const existingTable = "table" in entity && oldTables.has(tableKey(entity.schema, entity.table));
    if (entity.entityType === "indexes" && entity.concurrently) {
      issues.push({ entity: identity, reason: "nontransactional" });
    }
    if (old) {
      if (entity.entityType === "columns" && old.entityType === "columns") {
        if (entity.type !== old.type || entity.typeSchema !== old.typeSchema || entity.dimensions !== old.dimensions) {
          issues.push({ entity: identity, reason: "type-change" });
        } else if (entity.notNull && !old.notNull) {
          issues.push({ entity: identity, reason: "backfill-required" });
        } else {
          issues.push({ entity: identity, reason: "review-required" });
        }
      } else issues.push({ entity: identity, reason: "review-required" });
      continue;
    }
    if (entity.entityType === "schemas" || entity.entityType === "tables") continue;
    if (entity.entityType === "columns") {
      if (existingTable && entity.notNull && entity.default === null) issues.push({ entity: identity, reason: "backfill-required" });
      if (entity.generated || entity.identity) issues.push({ entity: identity, reason: "review-required" });
      continue;
    }
    if (["checks", "fks", "pks", "uniques"].includes(entity.entityType)) {
      if (existingTable) issues.push({ entity: identity, reason: "constraint-validation" });
      continue;
    }
    if (entity.entityType === "indexes") {
      if (existingTable && entity.isUnique) issues.push({ entity: identity, reason: "constraint-validation" });
      continue;
    }
    issues.push({ entity: identity, reason: "review-required" });
  }
  return { automatic: issues.length === 0, transactional: !issues.some((issue) => issue.reason === "nontransactional"), issues };
}
