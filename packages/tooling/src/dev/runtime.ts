import { createHash } from "node:crypto";
import * as v from "valibot";
import { createRuntime } from "@loom/core/server";
import type { RuntimeStorageBackend } from "@loom/core/server";
import { createDevelopmentActivationVerifier } from "@loom/core/neon";
import { loadProject } from "../project/load";
import { assertGeneratedVersion } from "../codegen/generate";
import { databaseIdentifier } from "../migrations/connection";
import { catalogFingerprint } from "../migrations/drift";
import { inspectRuntimeDatabase } from "../deploy/neon/runtime-database";
import { prepareGrant, activateGrant } from "../deploy/neon/activation";
import { withDevelopmentConnection, resolveDevelopmentCredentials } from "./connection";
import type { DevelopmentDatabaseProvider } from "./connection";
import { createDevelopmentProvider, inspectDevelopmentTarget } from "./target";
import { readDevelopmentHistory } from "./history";
import type { DevelopmentSyncOptions } from "./sync";

export interface DevelopmentRuntimeOptions extends DevelopmentSyncOptions {
  readonly deployment: string;
  /** Keep this secret stable across generations and restarts; only its hash is stored in the database. */
  readonly activationToken: string;
  readonly storageBackend?: RuntimeStorageBackend;
}
const hash = v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/));
export const developmentRuntimeOptions = v.strictObject({
  root: v.pipe(v.string(), v.minLength(1)),
  sourceVersion: hash,
  databaseName: databaseIdentifier,
  migrationRole: databaseIdentifier,
  runtimeRole: databaseIdentifier,
  deployment: v.pipe(v.string(), v.minLength(1), v.maxLength(256)),
  activationToken: hash,
});

/** Starts one synchronized candidate. The caller owns runtime.stop(); no listener, watcher or schema rollback is started. */
export async function startDevelopmentRuntime(
  input: DevelopmentRuntimeOptions,
  provider?: DevelopmentDatabaseProvider,
) {
  const { signal, storageBackend, ...values } = input;
  const parsed = v.safeParse(developmentRuntimeOptions, values);
  if (!parsed.success) throw new Error("Invalid development runtime options");
  const options = parsed.output;
  const cancellation: Partial<Record<"signal", AbortSignal>> = {};
  if (signal) cancellation.signal = signal;
  const storage: Partial<Record<"storageBackend", RuntimeStorageBackend>> = {};
  if (storageBackend) storage.storageBackend = Object.freeze({ ...storageBackend });
  signal?.throwIfAborted();
  const project = await loadProject(options.root);
  if (project.version !== options.sourceVersion) throw new Error("Development candidate is stale");
  const api = provider ?? createDevelopmentProvider();
  let runtime: Awaited<ReturnType<typeof createRuntime>> | undefined;
  try {
    const result = await withDevelopmentConnection(
      {
        config: project.config,
        databaseName: options.databaseName,
        migrationRole: options.migrationRole,
        ...cancellation,
      },
      async (client, target, database) => {
        const { namespace, metadataNamespace } = project.config.database;
        const owner = await client.query<{ owned: boolean }>(
          "SELECT nspowner = (SELECT oid FROM pg_roles WHERE rolname = current_user) AS owned FROM pg_namespace WHERE nspname = $1",
          [metadataNamespace],
        );
        if (owner.rows[0]?.owned !== true) throw new Error("Activation requires the metadata owner");
        const history = await readDevelopmentHistory(client, metadataNamespace, namespace, target);
        const latest = history.at(-1);
        if (!latest || latest.source_version !== options.sourceVersion)
          throw new Error("Development candidate is not synchronized");
        if (latest.after_catalog_hash !== (await catalogFingerprint(client, namespace)))
          throw new Error("Live development database drift detected");
        if (
          storage.storageBackend &&
          (storage.storageBackend.projectId !== target.projectId || storage.storageBackend.branchId !== target.branchId)
        )
          throw new Error("Development storage belongs to a different target");
        const credentials = await resolveDevelopmentCredentials(api, target, options.databaseName, options.runtimeRole);
        if (credentials.database.endpointHost !== database.endpointHost || credentials.database.port !== database.port)
          throw new Error("Runtime connection does not match the development database");
        await inspectRuntimeDatabase({
          connectionString: credentials.connectionString,
          runtimeRole: options.runtimeRole,
          namespace,
          metadataNamespace,
          database: { endpointHost: database.endpointHost, databaseName: database.databaseName },
          ...cancellation,
        });
        const current = await inspectDevelopmentTarget(project.config, api);
        if (
          (["projectId", "branchId", "branchName", "endpointId"] as const).some((key) => current[key] !== target[key])
        )
          throw new Error("Development target changed before activation");
        const binding = Object.freeze({
          metadataNamespace,
          deployment: options.deployment,
          version: options.sourceVersion,
          projectId: target.projectId,
          branchId: target.branchId,
          branchName: target.branchName,
          endpointHost: database.endpointHost,
          databaseName: database.databaseName,
        });
        const assertActive = createDevelopmentActivationVerifier(binding, {
          connectionString: credentials.connectionString,
          activationToken: options.activationToken,
        });
        await assertGeneratedVersion(options.root, options.sourceVersion);
        signal?.throwIfAborted();
        const tokenHash = createHash("sha256").update(options.activationToken).digest("hex");
        await prepareGrant(client, binding, tokenHash, signal);
        await activateGrant(client, binding, tokenHash, signal);
        signal?.throwIfAborted();
        runtime = await createRuntime({
          schema: project.schema,
          relations: project.relations,
          connectionString: credentials.connectionString,
          version: project.version,
          deployment: options.deployment,
          metadataNamespace,
          functions: Object.fromEntries(project.functions.map((entry) => [entry.name, entry.definition])),
          config: project.config,
          auth: project.auth,
          crons: project.crons,
          storage: project.storage,
          ...storage,
          assertActive,
        });
        await assertGeneratedVersion(options.root, options.sourceVersion);
        signal?.throwIfAborted();
        const cronSchedules = Object.freeze(
          Object.fromEntries(Object.entries(project.crons).map(([name, definition]) => [name, definition.schedule])),
        );
        return Object.freeze({ runtime, binding, target, cronSchedules });
      },
      api,
    );
    signal?.throwIfAborted();
    return result;
  } catch (cause) {
    await runtime?.stop();
    throw cause;
  }
}
