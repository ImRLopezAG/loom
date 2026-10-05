import { projectMigrationScopes, reconcileComponentNamespaces } from "../migrations/component-scopes";
import { assertExternalAuthTables, writeAuthOwnership } from "../migrations/auth-scopes";
import { acquireMigrationLock, databaseIdentifier, quoteIdentifier } from "../migrations/connection";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/pg-core/async";
import * as v from "valibot";
import { loadProject } from "../project/load";
import { prepareProject, assertGeneratedVersion } from "../codegen/generate";
import { bootstrapSession } from "../migrations/bootstrap";
import { catalogFingerprint } from "../migrations/drift";
import { inspectSnapshot } from "../migrations/adapter";
import { planMigration } from "../migrations/planner";
import type { MigrationPlan } from "../migrations/planner";
import { readMigrations } from "../migrations/history";
import { inspectHistory } from "../migrations/state";
import { protectApplication } from "../migrations/application";
import { withDevelopmentConnection } from "./connection";
import type { DevelopmentDatabaseProvider } from "./connection";
import type { DevelopmentTarget } from "./target";
import { readDevelopmentHistory, developmentOrmTable } from "./history";
import {
  inspectExtensions,
  planExtensions,
  applyExtensionOperations,
  grantExtensionUsage,
  verifyExtensions,
} from "../migrations/extensions";
import type { ExtensionPlan } from "../migrations/extensions";
import { buildRequiredApi, requiredApiHash } from "../migrations/required-api";
import { validateRequiredApiForTarget, verifyRequiredApiOnTarget } from "../migrations/required-api-verification";
import { readRetainedApiSnapshot, verifyRetainedApiSnapshot } from "../migrations/retained-api";

export interface DevelopmentSyncOptions {
  readonly root: string;
  readonly sourceVersion: string;
  readonly databaseName: string;
  readonly migrationRole: string;
  readonly runtimeRole: string;
  readonly signal?: AbortSignal;
}
export interface DevelopmentSyncReceipt {
  readonly target: DevelopmentTarget;
  readonly sourceVersion: string;
  readonly applied: boolean;
  readonly artifactHash: string;
  readonly catalogHash: string;
  readonly extensions?: ExtensionPlan;
}
export class DevelopmentReviewRequired extends Error {
  constructor(readonly plan: MigrationPlan) {
    super("Development schema change requires migration review");
  }
}

export async function synchronizeDevelopment(
  options: DevelopmentSyncOptions,
  provider?: DevelopmentDatabaseProvider,
): Promise<DevelopmentSyncReceipt> {
  const runtimeRole = v.parse(databaseIdentifier, options.runtimeRole);
  const candidate = await prepareProject(options.root);
  if (candidate.version !== options.sourceVersion) throw new Error("Development candidate is stale");
  const project = await loadProject(options.root);
  if (project.version !== candidate.version) throw new Error("Development candidate is stale");
  const { metadataNamespace } = project.config.database;
  const scopes = projectMigrationScopes(project);
  const applicationScope = scopes.find((scope) => scope.mountPath === "");
  if (!applicationScope) throw new Error("Missing application migration scope");
  const requiredApis = new Map(
    scopes.map((scope) => {
      const requiredApi = buildRequiredApi(
        scope.extensions,
        "metadata" in scope.schema ? scope.schema.metadata : undefined,
      );
      if (requiredApi) validateRequiredApiForTarget(requiredApi);
      return [scope.namespace, requiredApi] as const;
    }),
  );
  return withDevelopmentConnection(
    { ...options, config: project.config },
    async (client, target) => {
      await assertGeneratedVersion(options.root, options.sourceVersion);
      options.signal?.throwIfAborted();
      await acquireMigrationLock(client, "loom:component-ownership");
      for (const scope of scopes) await acquireMigrationLock(client, `loom:migrations:${scope.namespace}`);
      await assertExternalAuthTables(client, project);
      const saved = new Map<
        string,
        {
          history: Awaited<ReturnType<typeof readDevelopmentHistory>>;
          artifacts: Awaited<ReturnType<typeof readMigrations>>;
          release: Awaited<ReturnType<typeof inspectHistory>>;
          head: MigrationPlan | undefined;
        }
      >();
      for (const scope of scopes) {
        const history = await readDevelopmentHistory(client, metadataNamespace, scope.namespace, target);
        const artifacts = await readMigrations(options.root, scope.migrations);
        const release = await inspectHistory(client, { namespace: scope.namespace, metadataNamespace }, artifacts);
        if (release.framework.state === "diverged") throw new Error("Framework migration history is inconsistent");
        if (
          !history.length &&
          release.issues.some((issue) => issue === "HISTORY_DIVERGED" || issue === "ORM_HISTORY_DIVERGED")
        )
          throw new Error("Cannot start development sync from inconsistent release or ORM history");
        const head = history.at(-1)?.artifact ?? artifacts[release.applied.length - 1]?.plan;
        if (head?.format === 3 && head.requiredApi) validateRequiredApiForTarget(head.requiredApi);
        saved.set(scope.namespace, { history, artifacts, release, head });
      }
      const observedApplication = saved.get(applicationScope.namespace);
      if (!observedApplication) throw new Error("Missing application development baseline");
      let retainedApi = await readRetainedApiSnapshot(client, metadataNamespace, observedApplication.release.framework);
      await verifyRetainedApiSnapshot(client, retainedApi);
      for (const { head } of saved.values())
        if (head?.format === 3 && head.requiredApi)
          await verifyRequiredApiOnTarget(client, head.requiredApi, runtimeRole);
      await bootstrapSession(client, metadataNamespace, runtimeRole);
      // A genuine old prefix is upgraded by bootstrap; never read feature columns until it is current.
      const currentApplication = await inspectHistory(
        client,
        { namespace: applicationScope.namespace, metadataNamespace },
        observedApplication.artifacts,
      );
      if (currentApplication.framework.state !== "current")
        throw new Error("Framework metadata is not current after bootstrap");
      if (!retainedApi) {
        retainedApi = await readRetainedApiSnapshot(client, metadataNamespace, currentApplication.framework);
        await verifyRetainedApiSnapshot(client, retainedApi);
      }
      await reconcileComponentNamespaces(client, metadataNamespace, scopes);
      const db = drizzle({ client });
      return db.transaction(async (tx) => {
        const baselines = new Map<
          string,
          { history: Awaited<ReturnType<typeof readDevelopmentHistory>>; catalog: string }
        >();
        let managed: ExtensionPlan["after"] = [];
        for (const scope of scopes) {
          const observed = saved.get(scope.namespace);
          if (!observed) throw new Error("Missing saved development baseline");
          const { history, artifacts } = observed;
          const last = history.at(-1);
          const catalog = await catalogFingerprint(client, scope.namespace);
          if (last && last.after_catalog_hash !== catalog) throw new Error("Live development database drift detected");
          if (!last) {
            const release = await inspectHistory(client, { namespace: scope.namespace, metadataNamespace }, artifacts);
            if (release.issues.length)
              throw new Error("Cannot start development sync from untracked database state or drift");
            const applied = artifacts[release.applied.length - 1]?.plan;
            if (!scope.mountPath && applied?.format === 3) managed = applied.extensions.after;
          } else if (!scope.mountPath && last.artifact.format === 3) managed = last.artifact.extensions.after;
          baselines.set(scope.namespace, { history, catalog });
        }
        const extensions =
          project.config.database.extensions || managed.length
            ? planExtensions(project.config.database.extensions, await inspectExtensions(client), managed)
            : undefined;
        if (extensions && !extensions.automatic) {
          const before = await inspectSnapshot(tx, applicationScope.namespace);
          throw new DevelopmentReviewRequired(
            await planMigration(
              before,
              applicationScope.schema,
              [],
              baselines.get(applicationScope.namespace)?.history.at(-1)?.artifact_hash ?? null,
              { scope: "application", extensions, requiredApi: requiredApis.get(applicationScope.namespace) },
            ),
          );
        }
        if (extensions) {
          await applyExtensionOperations(client, extensions);
          await grantExtensionUsage(client, extensions.requirements, runtimeRole);
        }
        // Every candidate scope passes before the first scope can execute application DDL or protection.
        for (const scope of scopes) {
          const requiredApi = requiredApis.get(scope.namespace);
          if (requiredApi) {
            if (!extensions) throw new Error("Required development API lacks shared installation context");
            await verifyRequiredApiOnTarget(client, requiredApi, runtimeRole);
          }
        }
        const receipts: DevelopmentSyncReceipt[] = [];
        for (const scope of scopes) {
          const { namespace, migrations, schema } = scope;
          const baseline = baselines.get(namespace);
          if (!baseline) throw new Error("Missing development baseline");
          const { history, catalog: beforeCatalog } = baseline;
          const last = history.at(-1);
          const before = await inspectSnapshot(tx, namespace);
          const plan = await planMigration(
            before,
            schema,
            [],
            last?.artifact_hash ?? null,
            extensions
              ? {
                  scope: scope.mountPath ? "component" : "application",
                  requiredApi: requiredApis.get(namespace),
                  extensions: scope.mountPath
                    ? { ...extensions, before: extensions.after, operations: [], automatic: true }
                    : extensions,
                }
              : undefined,
          );
          await writeAuthOwnership(project, scope.mountPath, scope.migrations, plan.snapshot);
          await assertGeneratedVersion(options.root, options.sourceVersion);
          options.signal?.throwIfAborted();
          if (!plan.safety.automatic || !plan.safety.transactional) throw new DevelopmentReviewRequired(plan);
          if (
            last?.source_version === options.sourceVersion &&
            !plan.statements.length &&
            (plan.format !== 3 || !plan.extensions.operations.length) &&
            requiredApiHash(plan.format === 3 ? plan.requiredApi : undefined) ===
              requiredApiHash(last.artifact.format === 3 ? last.artifact.requiredApi : undefined)
          ) {
            receipts.push({
              target,
              sourceVersion: options.sourceVersion,
              applied: false,
              artifactHash: last.artifact_hash,
              catalogHash: beforeCatalog,
            });
            continue;
          }
          const ordinal = history.length + 1;
          await migrate(
            [
              {
                sql: [...plan.statements],
                folderMillis: ordinal,
                hash: plan.hash,
                bps: true,
                name: `development_${ordinal}`,
              },
            ],
            tx,
            {
              migrationsFolder: migrations,
              migrationsSchema: metadataNamespace,
              migrationsTable: developmentOrmTable(namespace),
            },
          );
          await protectApplication(client, namespace, runtimeRole, scope.entityTables, metadataNamespace);
          await verifyRetainedApiSnapshot(client, retainedApi);
          const catalogHash = await catalogFingerprint(client, namespace);
          await client.query(
            `INSERT INTO ${quoteIdentifier(metadataNamespace)}.development_history
        (namespace, ordinal, source_version, project_id, branch_id, endpoint_id, artifact_hash, artifact, before_catalog_hash, after_catalog_hash)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
            [
              namespace,
              ordinal,
              options.sourceVersion,
              target.projectId,
              target.branchId,
              target.endpointId,
              plan.hash,
              JSON.stringify(plan),
              beforeCatalog,
              catalogHash,
            ],
          );
          await assertGeneratedVersion(options.root, options.sourceVersion);
          options.signal?.throwIfAborted();
          receipts.push({
            target,
            sourceVersion: options.sourceVersion,
            applied: true,
            artifactHash: plan.hash,
            catalogHash,
          });
        }
        const application = receipts[scopes.findIndex((scope) => scope.mountPath === "")];
        if (!application) throw new Error("Missing application development receipt");
        const receipt = { ...application, applied: receipts.some((receipt) => receipt.applied) };
        // This final original-snapshot guard also runs when every scope takes its no-op path.
        await verifyRetainedApiSnapshot(client, retainedApi);
        if (!extensions) return receipt;
        verifyExtensions(await inspectExtensions(client), extensions.after);
        return { ...receipt, extensions };
      });
    },
    provider,
  );
}
