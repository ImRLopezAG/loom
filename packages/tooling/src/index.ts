export { defineConfig } from "./config/define-config";
export type { LoomConfig, LoomConfigInput } from "./config/define-config";
export { resolveProjectPath } from "./config/paths";
export { discoverFunctions } from "./codegen/discovery";
export { initializeProject } from "./project/initialize";
export { loadProject } from "./project/load";
export { generateProject, assertGeneratedVersion } from "./codegen/generate";
export { createSnapshot, emptySnapshot, snapshotHash } from "./migrations/adapter";
export type { MigrationSnapshot, RenameHint } from "./migrations/adapter";
export { classifyMigration } from "./migrations/classifier";
export { planMigration } from "./migrations/planner";
export type { MigrationPlan } from "./migrations/planner";
export { planCustomMigration } from "./migrations/custom";
export type { MigrationMode } from "./migrations/custom";
export { readMigrations, writeMigration, validateMigration } from "./migrations/history";
export type { MigrationArtifact } from "./migrations/history";
export {
  planRelease,
  generateRelease,
  generateCustomRelease,
  readRenameHints,
  projectMigrationStatus,
  applyProjectMigrations,
  MigrationCommandError,
} from "./migrations/project";
export { bootstrapDatabase } from "./migrations/bootstrap";
export type { BootstrapOptions } from "./migrations/bootstrap";
export { applyMigrations } from "./migrations/runner";
export type { ApplyMigrationsOptions, MigrationReceipt } from "./migrations/runner";
export { migrationStatus } from "./migrations/status";
export type { MigrationStatus, MigrationStatusOptions } from "./migrations/status";
