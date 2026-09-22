import { readFile } from "node:fs/promises";
import * as v from "valibot";
import { loadProject } from "../project/load.js";
import { resolveProjectPath } from "../config/paths.js";
import { emptySnapshot } from "./adapter.js";
import type { RenameHint } from "./adapter.js";
import { readMigrations, writeMigration, renameHintsValidator } from "./history.js";
import { planMigration } from "./planner.js";
import type { MigrationPlan } from "./planner.js";
import type { MigrationArtifact } from "./history.js";

export async function readRenameHints(root: string, filename: string): Promise<readonly RenameHint[]> {
  return v.parse(renameHintsValidator, JSON.parse(await readFile(await resolveProjectPath(root, filename), "utf8")));
}

export async function planRelease(root: string, renames: readonly RenameHint[] = []): Promise<MigrationPlan> {
  const project = await loadProject(root);
  const history = await readMigrations(project.root, project.config.database.migrations);
  const baseline = history.at(-1)?.plan.snapshot ?? await emptySnapshot(project.config.database.namespace);
  return planMigration(baseline, project.schema, renames);
}

export async function generateRelease(root: string, name: string, renames: readonly RenameHint[] = []): Promise<MigrationArtifact> {
  const project = await loadProject(root);
  const history = await readMigrations(project.root, project.config.database.migrations);
  const baseline = history.at(-1)?.plan.snapshot ?? await emptySnapshot(project.config.database.namespace);
  const plan = await planMigration(baseline, project.schema, renames);
  // writeMigration rechecks the head under its filesystem lock before publishing.
  return writeMigration(project.root, project.config.database.migrations, name, plan);
}
