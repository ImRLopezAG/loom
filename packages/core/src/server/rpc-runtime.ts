import { Layer } from "effect";
import { createEffectRuntime } from "./effect/runtime";
import type { InvocationIdentity } from "./auth/context";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { lockRuntimeActivation } from "./activation";
import type { AnyRelations } from "drizzle-orm";
import * as v from "valibot";
import { connectDatabase } from "./database/connection";
import type { DatabaseOptions } from "./database/connection";
import { createRpcAuthentication } from "./auth/rpc-definition";
import type { RpcAuthDefinition } from "./auth/rpc-definition";
import { createConnectionTickets } from "./auth/tickets";
import type { JobMigration } from "./jobs/rpc-migrations";
import { createRpcJobQueue } from "./jobs/rpc-queue";
import { createRpcJobWorker } from "./jobs/rpc-worker";
import { createRpcCronDispatcher } from "./jobs/rpc-crons";
import { createTransactionalRpcScheduler } from "./jobs/rpc-service";
import { createRevisionReader } from "./realtime/revisions";
import { createRevisionCoordinator } from "./realtime/coordinator";
import { listenForRevisions } from "./realtime/notifications";
import { bindRuntimeGraph } from "./rpc/runtime-graph";
import type { RuntimeProcedureEntry } from "./rpc/runtime-graph";
import { generateRpcOpenAPI } from "./rpc/openapi";
import { runtimeConfigValidator } from "./config";
import type { RuntimeConfigInput } from "./config";
import { validateIdempotencyOptions } from "./idempotency";
import { defineProcedureStorage, isProcedureStorage, compileProcedureCapabilities } from "./rpc/capabilities";
import type { ProcedureCron, ProcedureStorageDefinition } from "./rpc/capabilities";
import { createStorageCleanup } from "./storage/cleanup";
import { createStorageIntents } from "./storage/intents";
import { createRpcStorageEventDispatcher } from "./storage/rpc-events";

import type { RuntimeStorageBackend, ActivationDatabase } from "./runtime-contracts";

export interface RpcRuntimeOptions<Relations extends AnyRelations> extends DatabaseOptions<Relations> {
  readonly version: string;
  readonly deployment: string;
  readonly metadataNamespace: string;
  readonly procedures: readonly RuntimeProcedureEntry[];
  readonly jobMigrations?: readonly JobMigration[];
  readonly directConnectionString?: string;
  readonly config?: RuntimeConfigInput;
  readonly auth?: RpcAuthDefinition;
  readonly crons?: Readonly<Record<string, ProcedureCron>>;
  readonly storage?: ProcedureStorageDefinition;
  readonly storageBackend?: RuntimeStorageBackend;
  /** Called before connection without a database, then with the owned database at startup and every activation boundary. */
  readonly assertActive: (signal: AbortSignal, database?: ActivationDatabase) => Promise<void>;
  readonly assertIngress?: (signal: AbortSignal, database: ActivationDatabase) => Promise<void>;
}

/** Owns one generation's database and background capabilities. Never performs migrations. */
export async function createRpcRuntime<Relations extends AnyRelations>(options: RpcRuntimeOptions<Relations>) {
  const config = v.parse(runtimeConfigValidator, options.config ?? {});
  const auth = createRpcAuthentication(config.auth, options.auth);
  const { metadataNamespace, deployment, version } = options;
  const procedures = options.procedures.map((entry) =>
    Object.freeze({ ...entry, path: Object.freeze([...entry.path]) }),
  );
  const jobMigrations = Object.freeze([...(options.jobMigrations ?? [])]);
  const internal = procedures.filter((entry) => entry.visibility === "internal");
  const storageDefinition = options.storage ?? defineProcedureStorage();
  if (!isProcedureStorage(storageDefinition)) throw new Error("Expected defineProcedureStorage's result");
  const storageBackend = options.storageBackend ? Object.freeze({ ...options.storageBackend }) : undefined;
  const buckets = Object.keys(storageDefinition.buckets);
  if (buckets.length > 0 && !storageBackend) throw new Error("Storage backend required for declared buckets");
  if (storageBackend && buckets.length === 0) throw new Error("Storage backend requires declared buckets");
  const { handlers, crons: declarations } = compileProcedureCapabilities({
    version,
    internal,
    crons: options.crons ?? {},
    storage: storageDefinition,
    maxAttempts: config.jobs.maxAttempts,
  });
  const directConnectionString = options.directConnectionString;
  if (config.realtime.mode === "notify" && !directConnectionString)
    throw new Error("Notify mode requires a direct runtime database URL");
  if (config.realtime.mode === "notify" && directConnectionString) {
    const direct = URL.parse(directConnectionString);
    const pooled = URL.parse(options.connectionString);
    if (
      !direct ||
      !pooled ||
      ["host", "hostaddr", "port", "user", "password", "database", "dbname", "options", "connectionString"].some(
        (key) => direct.searchParams.has(key) || pooled.searchParams.has(key),
      ) ||
      direct.hostname.includes("-pooler") ||
      direct.hostname !== pooled.hostname.replace("-pooler", "") ||
      (direct.port || "5432") !== (pooled.port || "5432") ||
      direct.pathname !== pooled.pathname ||
      direct.username !== pooled.username ||
      !["postgres:", "postgresql:"].includes(direct.protocol)
    )
      throw new Error("Direct runtime URL must match the runtime database and role");
  }
  const idempotency = { metadataNamespace, deployment };
  validateIdempotencyOptions(idempotency);
  const shutdown = new AbortController();
  const assertActive = options.assertActive;
  const assertIngress = options.assertIngress;
  async function ingress(signal: AbortSignal, db: NodePgDatabase): Promise<void> {
    if (!activationDatabase) throw new Error("Runtime ingress denied");
    if (assertIngress) await assertIngress(signal, { ...activationDatabase, db });
    else await activate(signal, db);
  }
  const connectionString = options.connectionString;
  let activationDatabase: ActivationDatabase | undefined;
  const effects = createEffectRuntime(Layer.empty);
  let stopped = false;
  let stopping: Promise<void> | undefined;
  async function activate(signal: AbortSignal, db?: NodePgDatabase): Promise<void> {
    signal.throwIfAborted();
    try {
      await assertActive(signal, db && activationDatabase ? { ...activationDatabase, db } : activationDatabase);
    } catch {
      throw new Error("Runtime activation denied");
    }
    signal.throwIfAborted();
  }
  function own<T, Input>(
    input: Input,
    operation: (input: Input, signal: AbortSignal) => Promise<T>,
    signal?: AbortSignal,
    identity: InvocationIdentity | null = null,
  ): Promise<T> {
    if (stopped) return Promise.reject(new Error("Runtime stopped"));
    let captured: Input;
    try {
      captured = structuredClone(input);
    } catch (cause) {
      return Promise.reject(cause);
    }
    const current = signal ? AbortSignal.any([signal, shutdown.signal]) : shutdown.signal;
    return effects.promise(
      { identity, requestId: crypto.randomUUID() },
      ({ signal }) => operation(captured, signal),
      current,
    );
  }
  const tables = options.schema.metadata.entities.map((entity) => entity.sqlName);
  const revisions =
    tables.length > 0
      ? createRevisionReader({ namespace: options.schema.metadata.namespace, metadataNamespace, tables })
      : async () => Object.freeze({});
  await activate(shutdown.signal);
  const connection = await connectDatabase({ ...options, connectionString });
  let objectStorage: ReturnType<RuntimeStorageBackend["connect"]> | undefined;
  async function close(): Promise<void> {
    try {
      try {
        await effects.stop();
      } finally {
        await objectStorage?.close();
      }
    } finally {
      await connection.close();
    }
  }
  try {
    activationDatabase = Object.freeze({ db: connection.db, connectionString, deployment, version, metadataNamespace });
    await activate(shutdown.signal);
    const queue = createRpcJobQueue({
      ...idempotency,
      db: connection.db,
      version,
      internal,
      migrations: jobMigrations,
      maxAttempts: config.jobs.maxAttempts,
      retryDelaySeconds: config.jobs.retryBaseMs / 1000,
    });
    let storage:
      | {
          readonly intents: ReturnType<typeof createStorageIntents>;
          readonly cleanup: ReturnType<typeof createStorageCleanup>;
          readonly events: ReturnType<typeof createRpcStorageEventDispatcher>;
        }
      | undefined;
    if (storageBackend) {
      objectStorage = storageBackend.connect();
      const target = { projectId: storageBackend.projectId, branchId: storageBackend.branchId };
      const storageOptions = {
        ...idempotency,
        ...target,
        db: connection.db,
        buckets,
        storage: objectStorage,
        assertActive: activate,
        authorize: storageDefinition.authorize,
      };
      const intents = createStorageIntents(storageOptions);
      const cleanup = createStorageCleanup(storageOptions);
      const events = createRpcStorageEventDispatcher({
        version,
        ...idempotency,
        ...target,
        db: connection.db,
        intents,
        queue,
        handlers,
        assertActive: activate,
        assertIngress: ingress,
      });
      storage = Object.freeze({
        cleanup: Object.freeze<typeof cleanup>({
          run: (limit, signal) => own(limit, (input, current) => cleanup.run(input, current), signal),
        }),
        intents: Object.freeze<typeof intents>({
          create: (identity, upload, requestKey, signal) =>
            own(
              { identity, upload, requestKey },
              (input, current) => intents.create(input.identity, input.upload, input.requestKey, current),
              signal,
            ),
          status: (identity, id, signal) =>
            own({ identity, id }, (input, current) => intents.status(input.identity, input.id, current), signal),
          signUpload: (identity, id, signal) =>
            own({ identity, id }, (input, current) => intents.signUpload(input.identity, input.id, current), signal),
          finalize: (identity, id, signal) =>
            own({ identity, id }, (input, current) => intents.finalize(input.identity, input.id, current), signal),
          signDownload: (identity, id, signal) =>
            own({ identity, id }, (input, current) => intents.signDownload(input.identity, input.id, current), signal),
        }),
        events: Object.freeze<typeof events>({
          receive: (delivery, signal) => own(delivery, (input, current) => events.receive(input, current), signal),
          reconcile: (limit, signal) => own(limit, (input, current) => events.reconcile(input, current), signal),
        }),
      });
    }
    const transaction: typeof connection.transaction = (operation, config) =>
      connection.transaction(async (tx) => {
        // LOCK precedes the first SELECT so repeatable-read admission observes any completed retirement.
        await lockRuntimeActivation(tx, metadataNamespace);
        await activate(shutdown.signal, tx);
        return operation(tx);
      }, config);
    const scheduler = createTransactionalRpcScheduler({ version, internal, queue });
    const coordinatorOptions = {
      readRevisions: () =>
        own(undefined, async (_input, signal) => {
          await activate(signal);
          return revisions(connection.db);
        }),
      intervalMs: config.realtime.pollIntervalMs,
      maxSubscriptions: config.realtime.maxSubscriptions,
    };
    const coordinator = createRevisionCoordinator(
      config.realtime.mode === "notify" && directConnectionString
        ? {
            ...coordinatorOptions,
            wakeups: (wake) =>
              listenForRevisions(
                {
                  connectionString: directConnectionString,
                  runtimeRole: decodeURIComponent(new URL(connectionString).username),
                  namespace: options.schema.metadata.namespace,
                  metadataNamespace,
                },
                wake,
              ),
          }
        : coordinatorOptions,
    );
    const graph = bindRuntimeGraph({
      storage: storage?.intents,
      entries: procedures,
      effects,
      coordinator,
      activate,
      authorize: auth.authorize,
      database: {
        connection: { ...connection, transaction },
        replay: idempotency,
        revisions,
        scheduler,
        maxResultBytes: config.realtime.maxResultBytes,
        authorize: auth.authorize,
      },
    });
    // Reject incomplete public contracts before a candidate can be activated.
    if (config.openapi) await generateRpcOpenAPI(graph.snapshots);
    const worker = Object.freeze(
      createRpcJobWorker({
        queue,
        internal: graph.internal,
        assertActive: activate,
        leaseSeconds: config.jobs.leaseMs / 1000,
      }),
    );
    const cronDispatcher = createRpcCronDispatcher({
      ...idempotency,
      db: connection.db,
      queue,
      crons: declarations,
      assertIngress: ingress,
      assertActive: activate,
    });
    const crons = Object.freeze<typeof cronDispatcher>({
      dispatch: (name, at, signal, delivery) =>
        own(
          { name, at, delivery },
          ({ name, at, delivery }, current) => cronDispatcher.dispatch(name, at, current, delivery),
          signal,
        ),
      recordWake: (delivery, at, signal) =>
        own({ delivery, at }, ({ delivery, at }, current) => cronDispatcher.recordWake(delivery, at, current), signal),
    });
    const connectionTickets = createConnectionTickets({
      ...idempotency,
      db: connection.db,
      namespace: options.schema.metadata.namespace,
      version,
      assertActive: (db) => activate(shutdown.signal, db),
    });
    const tickets = Object.freeze<typeof connectionTickets>({
      issue: (...args) =>
        own(args, async (args, signal) => {
          await activate(signal);
          return connectionTickets.issue(...args);
        }),
      redeem: (...args) =>
        own(args, async (args, signal) => {
          await activate(signal);
          return connectionTickets.redeem(...args);
        }),
    });
    return Object.freeze({
      auth,
      version,
      router: graph.router,
      snapshots: graph.snapshots,
      openapi: config.openapi,
      worker,
      crons,
      tickets,
      storage,
      realtime: Object.freeze({
        coordinator,
        heartbeatMs: config.realtime.heartbeatMs,
        maxSubscriptions: config.realtime.maxSubscriptions,
        maxBufferedBytes: config.realtime.maxResultBytes,
      }),
      stop(): Promise<void> {
        if (stopping) return stopping;
        let workerStopped: Promise<void> | undefined;
        let pollerStopped: Promise<void> | undefined;
        stopping = Promise.resolve().then(async () => {
          try {
            await effects.stop();
            await Promise.all([workerStopped, pollerStopped]);
          } finally {
            await close();
          }
        });
        stopped = true;
        shutdown.abort();
        workerStopped = worker.stop();
        pollerStopped = coordinator.stop();
        return stopping;
      },
    });
  } catch (cause) {
    await close();
    throw cause;
  }
}
