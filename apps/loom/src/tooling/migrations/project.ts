import { bootstrapSession } from "./bootstrap";
import { assertExternalAuthTables, writeAuthOwnership } from "./auth-scopes";
import { acquireExtensionLock, acquireMigrationLock, withMigrationConnection } from "./connection";
import { projectMigrationScopes, reconcileComponentNamespaces } from "./component-scopes";
import { readFile } from "node:fs/promises";
import * as v from "valibot";
import { loadProject } from "../project/load";
import { resolveProjectPath } from "../config/paths";
import { emptySnapshot, createSnapshot, snapshotHash } from "./adapter";
import type { RenameHint } from "./adapter";
import { readMigrations, writeMigration, renameHintsValidator, hasMigrationChanges } from "./history";
import { planMigration } from "./planner";
import type { MigrationPlan } from "./planner";
import type { MigrationArtifact } from "./history";
import { migrationStatusOnConnection } from "./status";
import type { MigrationStatus } from "./status";
import { applyMigrationsOnConnection } from "./runner";
import type { MigrationReceipt } from "./runner";
import { planCustomMigration } from "./custom";
import type { MigrationMode } from "./custom";
import { inspectExtensions, planExtensions, extensionStateHash } from "./extensions";
import type { ExtensionPlan, InstalledExtension } from "./extensions";

/** Generation compiles from the committed extension head, using this target's exact available-version metadata.
 * Pending artifacts may not be applied here; execution separately checks their actual preconditions. */
async function releaseExtensions(
  project: Awaited<ReturnType<typeof loadProject>>,
  history: readonly MigrationArtifact[],
): Promise<ExtensionPlan | undefined> {
  const head = history.at(-1)?.plan;
  if (!project.config.database.extensions && head?.format !== 3) return undefined;
  const connectionString = process.env[project.config.database.migrationUrlEnv];
  if (!connectionString) throw new MigrationCommandError("MISSING_CONNECTION");
  return withMigrationConnection(connectionString, async (client) => {
    await acquireExtensionLock(client);
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    try {
      const target = await inspectExtensions(client);
      const managed = head?.format === 3 ? head.extensions.after : [];
      const names = new Set<string>(managed.map((entry) => entry.name));
      const installed = managed.map((entry): InstalledExtension => {
        const actual = target.installed.find((candidate) => candidate.name === entry.name);
        const available = target.available.find(
          (candidate) => candidate.name === entry.name && candidate.version === entry.version,
        );
        return {
          ...entry,
          canAlter: actual?.canAlter ?? true,
          relocatable: available?.relocatable ?? actual?.relocatable ?? false,
        };
      });
      const schemas = [...target.schemas];
      for (const entry of managed)
        if (!schemas.some((schema) => schema.name === entry.schema))
          schemas.push({ name: entry.schema, owned: true, secure: true, canCreate: true, canUse: true });
      const plan = planExtensions(
        project.config.database.extensions,
        {
          ...target,
          installed: [...target.installed.filter((entry) => !names.has(entry.name)), ...installed],
          schemas,
        },
        managed,
      );
      await client.query("COMMIT");
      return plan;
    } catch (cause) {
      await client.query("ROLLBACK");
      throw cause;
    }
  });
}

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
  const extensions = await releaseExtensions(project, history);
  const plan = await planCustomMigration(
    baseline,
    project.schema,
    sql,
    mode,
    head?.plan.hash ?? null,
    extensions ? { scope: "application", extensions } : undefined,
  );
  return writeMigration(project.root, project.config.database.migrations, name, plan);
}

export async function readRenameHints(root: string, filename: string): Promise<readonly RenameHint[]> {
  return v.parse(renameHintsValidator, JSON.parse(await readFile(await resolveProjectPath(root, filename), "utf8")));
}

export async function planRelease(root: string, renames: readonly RenameHint[] = []): Promise<MigrationPlan> {
  const project = await loadProject(root);
  const history = await readMigrations(project.root, project.config.database.migrations);
  const baseline = history.at(-1)?.plan.snapshot ?? (await emptySnapshot(project.config.database.namespace));
  const extensions = await releaseExtensions(project, history);
  return planMigration(
    baseline,
    project.schema,
    renames,
    history.at(-1)?.plan.hash ?? null,
    extensions ? { scope: "application", extensions } : undefined,
  );
}

export async function generateRelease(
  root: string,
  name: string,
  renames: readonly RenameHint[] = [],
): Promise<
  MigrationArtifact & {
    readonly scopes: readonly {
      readonly mountPath: string;
      readonly namespace: string;
      readonly artifact: MigrationArtifact;
    }[];
  }
> {
  const project = await loadProject(root);
  const applicationHistory = await readMigrations(project.root, project.config.database.migrations);
  const extensions = await releaseExtensions(project, applicationHistory);
  const generated: { mountPath: string; namespace: string; artifact: MigrationArtifact }[] = [];
  for (const scope of projectMigrationScopes(project)) {
    const history = await readMigrations(project.root, scope.migrations);
    const baseline = history.at(-1)?.plan.snapshot ?? (await emptySnapshot(scope.namespace));
    const plan = await planMigration(
      baseline,
      scope.schema,
      scope.mountPath ? [] : renames,
      history.at(-1)?.plan.hash ?? null,
      extensions
        ? {
            scope: scope.mountPath ? "component" : "application",
            extensions: scope.mountPath
              ? { ...extensions, before: extensions.after, operations: [], automatic: true }
              : extensions,
          }
        : undefined,
    );
    await writeAuthOwnership(project, scope.mountPath, scope.migrations, plan.snapshot);
    if (!hasMigrationChanges(plan, history.at(-1)?.plan)) continue;
    const artifact = await writeMigration(project.root, scope.migrations, name, plan);
    generated.push({ mountPath: scope.mountPath, namespace: scope.namespace, artifact });
  }
  const primary = generated.find((scope) => scope.mountPath === "") ?? generated[0];
  if (!primary) throw new Error("Migration has no structural change");
  return { ...primary.artifact, scopes: generated };
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

export async function projectMigrationStatus(
  root: string,
): Promise<
  MigrationStatus & { readonly components: readonly { readonly mountPath: string; readonly status: MigrationStatus }[] }
> {
  const { project, options } = await projectDatabase(root);
  return withMigrationConnection(options.connectionString, async (client) => {
    await acquireExtensionLock(client);
    let application: MigrationStatus | undefined;
    const components: { mountPath: string; status: MigrationStatus }[] = [];
    for (const scope of projectMigrationScopes(project)) {
      const status = await migrationStatusOnConnection(client, {
        root: project.root,
        namespace: scope.namespace,
        migrations: scope.migrations,
        metadataNamespace: options.metadataNamespace,
      });
      if (scope.mountPath) components.push({ mountPath: scope.mountPath, status });
      else application = status;
    }
    if (!application) throw new Error("Application migration scope missing");
    return {
      ...application,
      components,
      consistent: application.consistent && components.every((entry) => entry.status.consistent),
      issues: [...new Set([...application.issues, ...components.flatMap((entry) => entry.status.issues)])],
    };
  });
}

export async function applyProjectMigrations(
  root: string,
  runtimeRole: string,
  reviewedHashes: readonly string[] = [],
  recoverNontransactional = false,
): Promise<MigrationReceipt & { readonly components: readonly MigrationReceipt[] }> {
  const { project, options } = await projectDatabase(root);
  const scopes = projectMigrationScopes(project);
  const applicationArtifacts = await readMigrations(project.root, project.config.database.migrations);
  const applicationHead = applicationArtifacts.at(-1)?.plan;
  const required = applicationHead?.format === 3 ? applicationHead.extensions.requirements : [];
  const declaration = Object.fromEntries(
    required.map((entry) => [entry.name, { version: entry.version, schema: entry.schema }]),
  );
  if (JSON.stringify(declaration) !== JSON.stringify(project.config.database.extensions ?? {}))
    throw new MigrationCommandError("UNGENERATED_SCHEMA");
  for (const scope of scopes) {
    const history = await readMigrations(project.root, scope.migrations);
    if (snapshotHash(await createSnapshot(scope.schema, history.at(-1)?.plan.snapshot)) !== history.at(-1)?.plan.after)
      throw new MigrationCommandError("UNGENERATED_SCHEMA");
    const head = history.at(-1)?.plan;
    if (
      extensionStateHash(head?.format === 3 ? head.extensions.requirements : []) !== extensionStateHash(required) ||
      (head?.format === 3 && head.extensionScope !== (scope.mountPath ? "component" : "application"))
    )
      throw new MigrationCommandError("UNGENERATED_SCHEMA");
  }
  return withMigrationConnection(options.connectionString, async (client) => {
    await acquireExtensionLock(client);
    await acquireMigrationLock(client, "loom:component-ownership");
    await assertExternalAuthTables(client, project);
    for (const scope of scopes) await acquireMigrationLock(client, `loom:migrations:${scope.namespace}`);
    await bootstrapSession(client, options.metadataNamespace, runtimeRole);
    for (const scope of scopes) {
      const status = await migrationStatusOnConnection(client, {
        root: project.root,
        migrations: scope.migrations,
        namespace: scope.namespace,
        metadataNamespace: options.metadataNamespace,
      });
      if (
        status.issues.some(
          (issue) => !recoverNontransactional || (issue !== "LIVE_DRIFT" && issue !== "NONTRANSACTIONAL_IN_PROGRESS"),
        )
      )
        throw new MigrationCommandError("INCONSISTENT_DATABASE");
      if (status.pending.some((artifact) => !artifact.safety.automatic && !reviewedHashes.includes(artifact.hash)))
        throw new MigrationCommandError("REVIEW_REQUIRED");
    }
    await reconcileComponentNamespaces(client, options.metadataNamespace, scopes);
    let application: MigrationReceipt | undefined;
    const components: MigrationReceipt[] = [];
    for (const scope of [...scopes].sort(
      (left, right) => Number(Boolean(left.mountPath)) - Number(Boolean(right.mountPath)),
    )) {
      const receipt = await applyMigrationsOnConnection(client, {
        root: project.root,
        migrations: scope.migrations,
        namespace: scope.namespace,
        metadataNamespace: options.metadataNamespace,
        runtimeRole,
        reviewedHashes: [...reviewedHashes],
        recoverNontransactional,
        sourceVersion: project.version,
      });
      if (!scope.mountPath) application = receipt;
      else components.push(receipt);
    }
    if (!application) throw new Error("Application migration scope missing");
    return { ...application, components };
  });
}
