import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as v from "valibot";
import { resolveProjectPath } from "../config/paths";
import { snapshotValidator } from "./snapshot";
import { snapshotHash } from "./adapter";
import { classifyMigration } from "./classifier";
import { migrationHash, extensionMigrationSafety } from "./planner";
import type { MigrationPlan } from "./planner";
import { customSafety, customStatements } from "./custom";
import {
  extensionPlanValidator,
  validateExtensionPlan,
  renderExtensionOperation,
  extensionStateHash,
} from "./extensions";
import { requiredApiValidator, validateRequiredApi, requiredApiHash } from "./required-api";

const hash = v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/));
const names = v.pipe(v.string(), v.minLength(1));
const renameHint = v.variant("kind", [
  v.strictObject({
    type: v.literal("rename"),
    kind: v.literal("table"),
    from: v.tuple([names, names]),
    to: v.tuple([names, names]),
  }),
  v.strictObject({
    type: v.literal("rename"),
    kind: v.literal("column"),
    from: v.tuple([names, names, names]),
    to: v.tuple([names, names, names]),
  }),
]);
export const renameHintsValidator = v.array(renameHint);
const planEntries = {
  parent: v.nullable(hash),
  kind: v.picklist(["generated", "custom"]),
  before: hash,
  after: hash,
  baseline: snapshotValidator,
  snapshot: snapshotValidator,
  statements: v.array(v.pipe(v.string(), v.minLength(1))),
  renames: renameHintsValidator,
  safety: v.strictObject({
    automatic: v.boolean(),
    transactional: v.boolean(),
    issues: v.array(
      v.strictObject({
        entity: v.string(),
        reason: v.picklist([
          "deletion",
          "backfill-required",
          "constraint-validation",
          "type-change",
          "review-required",
          "nontransactional",
        ]),
      }),
    ),
  }),
  hash,
};
export const planValidator = v.variant("format", [
  v.strictObject({ format: v.literal(2), ...planEntries }),
  v.strictObject({
    format: v.literal(3),
    ...planEntries,
    extensionScope: v.picklist(["application", "component"]),
    extensions: extensionPlanValidator,
    requiredApi: v.optional(requiredApiValidator),
  }),
]);
export interface MigrationArtifact {
  readonly name: string;
  readonly directory: string;
  readonly plan: MigrationPlan;
}

/** Hashes detect accidental edits; review and source control establish artifact trust. */
export async function validateMigration(plan: MigrationPlan): Promise<void> {
  v.parse(planValidator, plan);
  if (plan.format === 3 && plan.requiredApi !== undefined)
    validateRequiredApi(plan.requiredApi, plan.extensions, plan.snapshot);
  if (
    snapshotHash(plan.baseline) !== plan.before ||
    snapshotHash(plan.snapshot) !== plan.after ||
    migrationHash(plan) !== plan.hash
  ) {
    throw new Error("Migration artifact hash mismatch");
  }
  const mode = plan.safety.transactional ? "transactional" : "nontransactional";
  let safety =
    plan.kind === "custom"
      ? await customSafety(plan.baseline, plan.snapshot, mode)
      : await classifyMigration(plan.baseline, plan.snapshot);
  if (plan.format === 3) {
    validateExtensionPlan(plan.extensions);
    if (plan.extensionScope === "component" && plan.extensions.operations.length)
      throw new Error("Component migrations cannot mutate shared extensions");
    safety = extensionMigrationSafety(safety, plan.extensions);
  }
  if (JSON.stringify(safety) !== JSON.stringify(plan.safety))
    throw new Error("Migration safety classification mismatch");
  if (plan.kind === "custom") {
    if (plan.renames.length) throw new Error("Custom migration cannot carry generated rename hints");
    for (const statement of plan.statements) {
      if ((await customStatements(statement, mode)).length !== 1)
        throw new Error("Custom migration steps must contain one SQL statement each");
    }
  }
  if (
    plan.baseline.id !== plan.before ||
    plan.snapshot.id !== plan.after ||
    plan.snapshot.prevIds.length !== 1 ||
    plan.snapshot.prevIds[0] !== plan.baseline.id
  ) {
    throw new Error("Migration snapshot lineage mismatch");
  }
}
function sqlArtifact(plan: MigrationPlan): string {
  const extensions =
    plan.format === 3
      ? plan.extensions.operations.map(
          (operation) =>
            renderExtensionOperation(operation) ??
            `-- Adopt ${operation.after.name} version ${JSON.stringify(operation.after.version)} in ${operation.after.schema}`,
        )
      : [];
  return [...extensions, ...plan.statements].join("\n--> statement-breakpoint\n") + "\n";
}

function validateExtensionLineage(previous: MigrationPlan | undefined, next: MigrationPlan): void {
  if (previous?.format !== 3 || previous.extensionScope !== "application") return;
  if (next.format !== 3 || next.extensionScope !== "application")
    throw new Error("Migration must preserve tracked extension state");
  const names = new Set(previous.extensions.after.map((entry) => entry.name));
  if (
    extensionStateHash(previous.extensions.after) !==
    extensionStateHash(next.extensions.before.filter((entry) => names.has(entry.name)))
  )
    throw new Error("Migration extension lineage mismatch");
  for (const entry of next.extensions.before.filter((entry) => !names.has(entry.name))) {
    if (
      !next.extensions.operations.some((operation) => operation.kind === "adopt" && operation.after.name === entry.name)
    )
      throw new Error("Untracked extension state requires reviewed adoption");
  }
}

export function hasMigrationChanges(plan: MigrationPlan, previous?: MigrationPlan): boolean {
  if (plan.statements.length && (plan.kind === "custom" || plan.before !== plan.after)) return true;
  if (
    requiredApiHash(plan.format === 3 ? plan.requiredApi : undefined) !==
    requiredApiHash(previous?.format === 3 ? previous.requiredApi : undefined)
  )
    return true;
  if (plan.format !== 3) return false;
  return (
    plan.extensions.operations.length > 0 ||
    extensionStateHash(plan.extensions.requirements) !==
      extensionStateHash(previous?.format === 3 ? previous.extensions.requirements : [])
  );
}

export async function readMigrations(root: string, configuredPath: string): Promise<readonly MigrationArtifact[]> {
  const directory = await resolveProjectPath(root, configuredPath);
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (cause) {
    if (cause instanceof Error && "code" in cause && cause.code === "ENOENT") return [];
    throw cause;
  }
  const artifacts: MigrationArtifact[] = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (entry.name === "components" && entry.isDirectory()) continue;
    const match = /^([a-f0-9]{64})_([a-z][a-z0-9_-]{0,62})$/.exec(entry.name);
    if (!match || !entry.isDirectory()) throw new Error("Unexpected migration artifact path");
    const path = await resolveProjectPath(root, join(configuredPath, entry.name));
    const plan = v.parse(
      planValidator,
      JSON.parse(await readFile(await resolveProjectPath(root, join(configuredPath, entry.name, "plan.json")), "utf8")),
    );
    await validateMigration(plan);
    if (plan.hash !== match[1]) throw new Error("Migration directory hash mismatch");
    if (
      (await readFile(await resolveProjectPath(root, join(configuredPath, entry.name, "migration.sql")), "utf8")) !==
      sqlArtifact(plan)
    ) {
      throw new Error("SQL artifact differs from its reviewed migration plan");
    }
    artifacts.push({ name: entry.name, directory: path, plan });
  }
  if (!artifacts.length) return [];
  const first = artifacts.filter((artifact) => artifact.plan.parent === null);
  if (first.length !== 1 || first[0]?.plan.baseline.ddl.length !== 0)
    throw new Error("Migration history requires one empty baseline");
  const pending = new Map<string | null, MigrationArtifact>();
  for (const artifact of artifacts) {
    if (pending.has(artifact.plan.parent)) throw new Error("Migration history has conflicting baselines");
    pending.set(artifact.plan.parent, artifact);
  }
  const ordered: MigrationArtifact[] = [];
  let next: MigrationArtifact | undefined = first[0];
  while (next) {
    ordered.push(next);
    pending.delete(next.plan.parent);
    const child = pending.get(next.plan.hash);
    if (child && child.plan.before !== next.plan.after) throw new Error("Migration schema lineage mismatch");
    if (child) validateExtensionLineage(next.plan, child.plan);
    next = child;
  }
  if (pending.size) throw new Error("Migration history is disconnected");
  return ordered;
}

export async function writeMigration(
  root: string,
  configuredPath: string,
  name: string,
  plan: MigrationPlan,
): Promise<MigrationArtifact> {
  if (!/^[a-z][a-z0-9_-]{0,62}$/.test(name)) throw new Error("Invalid migration name");
  await validateMigration(plan);
  const directory = await resolveProjectPath(root, configuredPath);
  await mkdir(directory, { recursive: true });
  const lock = join(directory, ".generation-lock");
  await mkdir(lock);
  const staging = join(directory, `.staging-${crypto.randomUUID()}`);
  try {
    const history = await readMigrations(root, configuredPath);
    const latest = history.at(-1);
    if (!hasMigrationChanges(plan, latest?.plan)) throw new Error("Migration has no structural or extension change");
    validateExtensionLineage(latest?.plan, plan);
    if (
      plan.parent !== (latest?.plan.hash ?? null) ||
      (latest ? latest.plan.after !== plan.before : plan.baseline.ddl.length !== 0)
    ) {
      throw new Error("Migration baseline is not the committed history head");
    }
    await mkdir(staging);
    await writeFile(join(staging, "plan.json"), JSON.stringify(plan, null, 2) + "\n", { flag: "wx" });
    await writeFile(join(staging, "migration.sql"), sqlArtifact(plan), { flag: "wx" });
    const artifactName = `${plan.hash}_${name}`;
    const target = join(directory, artifactName);
    await rename(staging, target);
    return { name: artifactName, directory: target, plan };
  } finally {
    await rm(staging, { recursive: true, force: true });
    await rm(lock, { recursive: true, force: true });
  }
}
