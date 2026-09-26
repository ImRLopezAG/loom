import { readFile } from "node:fs/promises";
import * as v from "valibot";
import { loadProject } from "../project/load";
import { resolveProjectPath } from "../config/paths";
import { emptySnapshot, createSnapshot, snapshotHash } from "./adapter";
import type { RenameHint } from "./adapter";
import { readMigrations, writeMigration, renameHintsValidator } from "./history";
import { planMigration } from "./planner";
import type { MigrationPlan } from "./planner";
import type { MigrationArtifact } from "./history";
import { migrationStatus } from "./status";
import type { MigrationStatus } from "./status";
import { applyMigrations } from "./runner";
import type { MigrationReceipt } from "./runner";
import { planCustomMigration } from "./custom";
import type { MigrationMode } from "./custom";

export async function generateCustomRelease(
  root: string,
  name: string,
  filename: string,
  mode: MigrationMode,
): Promise<MigrationArtifact> {
  const project = await loadProject(root);
  const history = await readMigrations(project.root, project.config.database.migrations);
  const head = history.at(-1);
  const baseline = head?.plan.snapshot ?? (await emptySnapshot(project.config.database.namespace));
  const sql = await readFile(await resolveProjectPath(project.root, filename), "utf8");
  const plan = await planCustomMigration(baseline, project.schema, sql, mode, head?.plan.hash ?? null);
  return writeMigration(project.root, project.config.database.migrations, name, plan);
}

export async function readRenameHints(root: string, filename: string): Promise<readonly RenameHint[]> {
  return v.parse(renameHintsValidator, JSON.parse(await readFile(await resolveProjectPath(root, filename), "utf8")));
}

export async function planRelease(root: string, renames: readonly RenameHint[] = []): Promise<MigrationPlan> {
  const project = await loadProject(root);
  const history = await readMigrations(project.root, project.config.database.migrations);
  const baseline = history.at(-1)?.plan.snapshot ?? (await emptySnapshot(project.config.database.namespace));
  return planMigration(baseline, project.schema, renames, history.at(-1)?.plan.hash ?? null);
}

export async function generateRelease(
  root: string,
  name: string,
  renames: readonly RenameHint[] = [],
): Promise<MigrationArtifact> {
  const project = await loadProject(root);
  const history = await readMigrations(project.root, project.config.database.migrations);
  const baseline = history.at(-1)?.plan.snapshot ?? (await emptySnapshot(project.config.database.namespace));
  const plan = await planMigration(baseline, project.schema, renames, history.at(-1)?.plan.hash ?? null);
  // writeMigration rechecks the head under its filesystem lock before publishing.
  return writeMigration(project.root, project.config.database.migrations, name, plan);
}

export class MigrationCommandError extends Error {
  constructor(
    readonly code: "MISSING_CONNECTION" | "UNGENERATED_SCHEMA" | "INCONSISTENT_DATABASE" | "REVIEW_REQUIRED",
  ) {
    const messages = {
      MISSING_CONNECTION:
        "Set the migration URL environment variable named in loom.config.ts before inspecting or applying database migrations",
      UNGENERATED_SCHEMA: "Generate and review migrations for the current schema before application",
      INCONSISTENT_DATABASE:
        "Migration stopped because database history or catalog state differs; inspect loom migrations status",
      REVIEW_REQUIRED:
        "Review the pending artifact hashes shown by loom migrations status, then pass --reviewed-hash for each reviewed change",
    };
    super(messages[code]);
    this.name = "MigrationCommandError";
  }
}

async function projectDatabase(root: string) {
  const project = await loadProject(root);
  const connectionString = process.env[project.config.database.migrationUrlEnv];
  if (!connectionString) throw new MigrationCommandError("MISSING_CONNECTION");
  return {
    project,
    options: {
      root: project.root,
      migrations: project.config.database.migrations,
      namespace: project.config.database.namespace,
      metadataNamespace: project.config.database.metadataNamespace,
      connectionString,
    },
  };
}

export async function projectMigrationStatus(root: string): Promise<MigrationStatus> {
  const { options } = await projectDatabase(root);
  return migrationStatus(options);
}

export async function applyProjectMigrations(
  root: string,
  runtimeRole: string,
  reviewedHashes: readonly string[] = [],
  recoverNontransactional = false,
): Promise<MigrationReceipt> {
  const { project, options } = await projectDatabase(root);
  const history = await readMigrations(project.root, project.config.database.migrations);
  if (snapshotHash(await createSnapshot(project.schema)) !== history.at(-1)?.plan.after) {
    throw new MigrationCommandError("UNGENERATED_SCHEMA");
  }
  const status = await migrationStatus(options);
  if (
    status.issues.some(
      (issue) => !recoverNontransactional || (issue !== "LIVE_DRIFT" && issue !== "NONTRANSACTIONAL_IN_PROGRESS"),
    )
  )
    throw new MigrationCommandError("INCONSISTENT_DATABASE");
  const unreviewed = status.pending.filter(
    (artifact) => !artifact.safety.automatic && !reviewedHashes.includes(artifact.hash),
  );
  if (unreviewed.length) throw new MigrationCommandError("REVIEW_REQUIRED");
  return applyMigrations({
    ...options,
    runtimeRole,
    reviewedHashes: [...reviewedHashes],
    recoverNontransactional,
    sourceVersion: project.version,
  });
}
