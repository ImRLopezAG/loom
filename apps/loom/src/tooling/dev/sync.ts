import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/pg-core/async";
import * as v from "valibot";
import { loadProject } from "../project/load";
import { prepareProject, assertGeneratedVersion } from "../codegen/generate";
import { bootstrapSession } from "../migrations/bootstrap";
import { databaseIdentifier, quoteIdentifier } from "../migrations/connection";
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
  const { namespace, metadataNamespace, migrations } = project.config.database;
  return withDevelopmentConnection(
    { ...options, config: project.config },
    async (client, target) => {
      await assertGeneratedVersion(options.root, options.sourceVersion);
      options.signal?.throwIfAborted();
      await bootstrapSession(client, metadataNamespace, runtimeRole);
      const db = drizzle({ client });
      return db.transaction(async (tx) => {
        const history = await readDevelopmentHistory(client, metadataNamespace, namespace, target);
        const last = history.at(-1);
        const beforeCatalog = await catalogFingerprint(client, namespace);
        if (last && last.after_catalog_hash !== beforeCatalog)
          throw new Error("Live development database drift detected");
        if (!last) {
          const release = await inspectHistory(
            client,
            { namespace, metadataNamespace },
            await readMigrations(options.root, migrations),
          );
          if (release.issues.length)
            throw new Error("Cannot start development sync from untracked database state or drift");
        }
        const before = await inspectSnapshot(tx, namespace);
        const plan = await planMigration(before, project.schema, [], last?.artifact_hash ?? null);
        await assertGeneratedVersion(options.root, options.sourceVersion);
        options.signal?.throwIfAborted();
        if (!plan.safety.automatic || !plan.safety.transactional) throw new DevelopmentReviewRequired(plan);
        if (last?.source_version === options.sourceVersion && !plan.statements.length)
          return {
            target,
            sourceVersion: options.sourceVersion,
            applied: false,
            artifactHash: last.artifact_hash,
            catalogHash: beforeCatalog,
          };
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
        await protectApplication(
          client,
          namespace,
          runtimeRole,
          project.schema.metadata.entities.map((entity) => entity.sqlName),
          metadataNamespace,
        );
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
        return { target, sourceVersion: options.sourceVersion, applied: true, artifactHash: plan.hash, catalogHash };
      });
    },
    provider,
  );
}
