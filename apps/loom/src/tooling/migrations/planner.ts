import { createHash } from "node:crypto";
import * as v from "valibot";
import type { SchemaDefinition } from "loom/server";
import { createSnapshot, migrationStatements, snapshotHash } from "./adapter";
import type { MigrationSnapshot, RenameHint, NativeMigrationSchema } from "./adapter";
import { classifyMigration } from "./classifier";
import type { MigrationSafety } from "./classifier";
import { snapshotValidator } from "./snapshot";
import { validateExtensionPlan, canonicalExtensionState } from "./extensions";
import type { ExtensionPlan } from "./extensions";
import { validateRequiredApi } from "./required-api";
import type { RequiredApi } from "./required-api";

interface MigrationPlanBase {
  readonly parent: string | null;
  readonly kind: "generated" | "custom";
  readonly before: string;
  readonly after: string;
  readonly baseline: MigrationSnapshot;
  readonly snapshot: MigrationSnapshot;
  readonly statements: readonly string[];
  readonly renames: readonly RenameHint[];
  readonly safety: MigrationSafety;
  readonly hash: string;
}
export interface LegacyMigrationPlan extends MigrationPlanBase {
  readonly format: 2;
}
export interface ExtensionMigrationPlan extends MigrationPlanBase {
  readonly format: 3;
  readonly extensionScope: "application" | "component";
  readonly extensions: ExtensionPlan;
  readonly requiredApi?: RequiredApi | undefined;
}
export type MigrationPlan = LegacyMigrationPlan | ExtensionMigrationPlan;
export interface ExtensionMigrationContext {
  readonly scope: "application" | "component";
  readonly extensions: ExtensionPlan;
  readonly requiredApi?: RequiredApi | undefined;
}

export function extensionMigrationSafety(safety: MigrationSafety, extensions: ExtensionPlan): MigrationSafety {
  if (!safety.transactional && extensions.operations.length)
    throw new Error("Tracked extension operations require a transactional migration");
  return {
    ...safety,
    automatic: safety.automatic && extensions.automatic,
    issues: [
      ...safety.issues,
      ...extensions.operations
        .filter((operation) => operation.kind !== "install")
        .map((operation) => ({
          entity: `extension:${operation.after.name}:${operation.kind}`,
          reason: "review-required" as const,
        })),
    ],
  };
}

export function bindMigrationExtensions(plan: LegacyMigrationPlan, context?: ExtensionMigrationContext): MigrationPlan {
  if (!context) return plan;
  const extensions = validateExtensionPlan(context.extensions);
  const requiredApi =
    context.requiredApi === undefined ? undefined : validateRequiredApi(context.requiredApi, extensions, plan.snapshot);
  if (context.scope === "component" && extensions.operations.length)
    throw new Error("Component migrations cannot mutate shared extensions");
  if (
    !extensions.before.length &&
    !extensions.after.length &&
    !extensions.requirements.length &&
    !extensions.operations.length &&
    requiredApi === undefined
  )
    return plan;
  const content = {
    ...plan,
    format: 3 as const,
    extensionScope: context.scope,
    extensions,
    ...(requiredApi !== undefined && { requiredApi }),
    safety: extensionMigrationSafety(plan.safety, extensions),
  };
  return { ...content, hash: migrationHash(content) };
}
export async function planMigration(
  before: MigrationSnapshot,
  schema: SchemaDefinition | NativeMigrationSchema,
  renames: readonly RenameHint[] = [],
  parent: string | null = null,
  extensions?: ExtensionMigrationContext,
): Promise<MigrationPlan> {
  const after = await createSnapshot(schema, before);
  const statements = await migrationStatements(before, after, renames);
  const content = {
    format: 2,
    parent,
    kind: "generated",
    before: snapshotHash(before),
    after: snapshotHash(after),
    baseline: before,
    snapshot: after,
    statements,
    renames,
    safety: await classifyMigration(before, after),
  } as const;
  return bindMigrationExtensions({ ...content, hash: migrationHash(content) }, extensions);
}

type MigrationHashInput = Omit<LegacyMigrationPlan, "hash"> | Omit<ExtensionMigrationPlan, "hash">;
export function migrationHash(plan: MigrationHashInput): string {
  // Keep the legacy property order and values byte-for-byte compatible with format 2.
  const content = {
    format: plan.format,
    parent: plan.parent,
    kind: plan.kind,
    before: plan.before,
    after: plan.after,
    baseline: v.parse(snapshotValidator, plan.baseline),
    snapshot: v.parse(snapshotValidator, plan.snapshot),
    statements: plan.statements,
    renames: plan.renames.map((hint) => ({ type: hint.type, kind: hint.kind, from: hint.from, to: hint.to })),
    safety: {
      automatic: plan.safety.automatic,
      transactional: plan.safety.transactional,
      issues: plan.safety.issues.map((issue) => ({ entity: issue.entity, reason: issue.reason })),
    },
  };
  const payload =
    plan.format === 2
      ? content
      : {
          ...content,
          extensionScope: plan.extensionScope,
          extensions: {
            before: canonicalExtensionState(plan.extensions.before),
            after: canonicalExtensionState(plan.extensions.after),
            requirements: canonicalExtensionState(plan.extensions.requirements),
            operations: plan.extensions.operations.map((operation) => ({
              kind: operation.kind,
              before: operation.before === null ? null : canonicalExtensionState([operation.before])[0],
              after: canonicalExtensionState([operation.after])[0],
            })),
            automatic: plan.extensions.automatic,
          },
          ...(plan.requiredApi !== undefined && {
            requiredApi: validateRequiredApi(plan.requiredApi, plan.extensions, plan.snapshot),
          }),
        };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}
