import { Layer } from "effect";
import { createEffectRuntime } from "./effect/runtime";
import type { InvocationIdentity } from "./auth/context";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { lockRuntimeActivation } from "./activation";
import type { AnyRelations } from "drizzle-orm";
import * as v from "valibot";
import { connectDatabase } from "./database/connection";
import type { DatabaseOptions } from "./database/connection";
import { createAuthentication } from "./auth/definition";
import type { AuthDefinition } from "./auth/definition";
import { createConnectionTickets } from "./auth/tickets";
import { createDispatcher } from "./dispatch";
import type { RuntimeFunction, EvaluationResponse } from "./dispatch";
import { createJobQueue } from "./jobs/queue";
import { createJobWorker } from "./jobs/worker";
import { createCronDispatcher } from "./jobs/crons";
import type { CronDeclarations } from "./jobs/crons";
import { createRevisionReader } from "./realtime/revisions";
import { createSubscriptionPoller } from "./realtime/subscriptions";
import { runtimeConfigValidator } from "./config";
import type { RuntimeConfigInput } from "./config";
import { validateIdempotencyOptions } from "./idempotency";
import { defineStorage, isStorageDefinition } from "./storage/definition";
import type { StorageDefinition } from "./storage/definition";
import type { ObjectStorageBackend } from "./storage/contracts";
import { createStorageCleanup } from "./storage/cleanup";
import { createStorageIntents } from "./storage/intents";
import { createStorageEventDispatcher } from "./storage/events";

export interface RuntimeStorageBackend {
  readonly projectId: string;
  readonly branchId: string;
  /** Creates a new backend owned by this runtime; called only after activation succeeds. */
  readonly connect: () => ObjectStorageBackend & { close(): void | Promise<void> };
}

export interface ActivationDatabase {
  readonly deployment: string;
  readonly version: string;
  readonly metadataNamespace: string;
  readonly db: Awaited<ReturnType<typeof connectDatabase>>["db"];
  readonly connectionString: string;
}

export interface RuntimeOptions<Relations extends AnyRelations> extends DatabaseOptions<Relations> {
  readonly version: string;
  readonly deployment: string;
  readonly metadataNamespace: string;
  readonly functions: Readonly<Record<string, RuntimeFunction>>;
  readonly config?: RuntimeConfigInput;
  readonly auth?: AuthDefinition;
  readonly crons?: CronDeclarations;
  readonly storage?: StorageDefinition;
  readonly storageBackend?: RuntimeStorageBackend;
  /** Called before connection without a database, then with the owned database at startup and every activation boundary. */
  readonly assertActive: (signal: AbortSignal, database?: ActivationDatabase) => Promise<void>;
  readonly assertIngress?: (signal: AbortSignal, database: ActivationDatabase) => Promise<void>;
}

/** Owns one generation's database and background capabilities. Never performs migrations. */
export async function createRuntime<Relations extends AnyRelations>(options: RuntimeOptions<Relations>) {
  const config = v.parse(runtimeConfigValidator, options.config ?? {});
  const auth = createAuthentication(config.auth, options.auth);
  const { metadataNamespace, deployment, version } = options;
  const functions = Object.freeze({ ...options.functions });
  const storageDefinition = options.storage ?? defineStorage();
  if (!isStorageDefinition(storageDefinition)) throw new Error("Expected defineStorage's result");
  const storageBackend = options.storageBackend ? Object.freeze({ ...options.storageBackend }) : undefined;
  const buckets = Object.keys(storageDefinition.buckets);
  if (buckets.length > 0 && !storageBackend) throw new Error("Storage backend required for declared buckets");
  if (storageBackend && buckets.length === 0) throw new Error("Storage backend requires declared buckets");
  const handlers = Object.fromEntries(
    Object.entries(storageDefinition.buckets).flatMap(([bucket, definition]) => {
      const handler = definition.onObjectCreated;
      if (!handler) return [];
      const target = functions[handler.call.name];
      if (
        !target ||
        target.visibility !== "internal" ||
        target.kind !== handler.call.kind ||
        handler.call.version !== version
      )
        throw new Error(`Storage handler does not reference a current internal function: ${bucket}`);
      if (handler.maxAttempts > config.jobs.maxAttempts)
        throw new Error(`Storage handler exceeds the configured attempt limit: ${bucket}`);
      return [[bucket, handler]];
    }),
  );
  const declarations = structuredClone(options.crons ?? {});
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
    const queue = createJobQueue({
      ...idempotency,
      db: connection.db,
      version,
      functions,
      maxAttempts: config.jobs.maxAttempts,
      retryDelaySeconds: config.jobs.retryBaseMs / 1000,
    });
    let storage:
      | {
          readonly intents: ReturnType<typeof createStorageIntents>;
          readonly cleanup: ReturnType<typeof createStorageCleanup>;
          readonly events: ReturnType<typeof createStorageEventDispatcher>;
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
      const events = createStorageEventDispatcher({
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
    const raw = createDispatcher({
      connection: { ...connection, transaction },
      version,
      functions,
      authorize: auth.authorize,
      idempotency,
      scheduler: queue,
      revisions,
    });
    const dispatcher = Object.freeze<typeof raw>({
      public: (call, identity, signal) =>
        own(
          { call, identity },
          async ({ call, identity }, current) => {
            await activate(current);
            return raw.public(call, identity, current);
          },
          signal,
          identity,
        ),
      internal: (call, identity, signal, job) =>
        own(
          { call, identity, job },
          async ({ call, identity, job }, current) => {
            await activate(current);
            return raw.internal(call, identity, current, job);
          },
          signal,
          identity,
        ),
      evaluate: (call, identity, signal) =>
        own(
          { call, identity },
          async ({ call, identity }, current): Promise<EvaluationResponse> => {
            await activate(current);
            const response = await raw.evaluate(call, identity, current);
            if (response.ok && Buffer.byteLength(JSON.stringify(response)) > config.realtime.maxResultBytes)
              return {
                ok: false,
                requestId: response.requestId,
                error: { code: "INTERNAL", message: "Query result exceeds configured limit" },
              };
            return response;
          },
          signal,
          identity,
        ),
    });
    const worker = Object.freeze(
      createJobWorker({
        queue,
        dispatcher,
        assertActive: activate,
        leaseSeconds: config.jobs.leaseMs / 1000,
      }),
    );
    const cronDispatcher = createCronDispatcher({
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
    const poller = Object.freeze(
      createSubscriptionPoller({
        readRevisions: () =>
          own(undefined, async (_input, signal) => {
            await activate(signal);
            return revisions(connection.db);
          }),
        evaluate: dispatcher.evaluate,
        intervalMs: config.realtime.pollIntervalMs,
        maxSubscriptions: config.realtime.maxSubscriptions,
      }),
    );
    return Object.freeze({
      auth,
      dispatcher,
      worker,
      crons,
      tickets,
      storage,
      realtime: Object.freeze({
        poller,
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
        pollerStopped = poller.stop();
        return stopping;
      },
    });
  } catch (cause) {
    await close();
    throw cause;
  }
}
