import { createHash } from "node:crypto";
import * as v from "valibot";
import type { SchemaDefinition } from "@loom/core/server";
import { createSnapshot, migrationStatements, snapshotHash } from "./adapter.js";
import type { MigrationSnapshot, RenameHint } from "./adapter.js";
import { classifyMigration } from "./classifier.js";
import type { MigrationSafety } from "./classifier.js";
import { snapshotValidator } from "./snapshot.js";

export interface MigrationPlan {
  readonly format: 1;
  readonly before: string;
  readonly after: string;
  readonly baseline: MigrationSnapshot;
  readonly snapshot: MigrationSnapshot;
  readonly statements: readonly string[];
  readonly renames: readonly RenameHint[];
  readonly safety: MigrationSafety;
  readonly hash: string;
}
export async function planMigration(before: MigrationSnapshot, schema: SchemaDefinition, renames: readonly RenameHint[] = []): Promise<MigrationPlan> {
  const after = await createSnapshot(schema, before);
  const statements = await migrationStatements(before, after, renames);
  const content = { format: 1, before: snapshotHash(before), after: snapshotHash(after), baseline: before, snapshot: after,
    statements, renames, safety: classifyMigration(before, after) } as const;
  return { ...content, hash: migrationHash(content) };
}

export function migrationHash(plan: Omit<MigrationPlan, "hash">): string {
  return createHash("sha256").update(JSON.stringify({ format: plan.format, before: plan.before, after: plan.after,
    baseline: v.parse(snapshotValidator, plan.baseline), snapshot: v.parse(snapshotValidator, plan.snapshot),
    statements: plan.statements, renames: plan.renames.map((hint) => ({ type: hint.type, kind: hint.kind, from: hint.from, to: hint.to })),
    safety: { automatic: plan.safety.automatic, transactional: plan.safety.transactional,
      issues: plan.safety.issues.map((issue) => ({ entity: issue.entity, reason: issue.reason })) } })).digest("hex");
}
