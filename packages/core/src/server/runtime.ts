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
  /** Called before connection without a database, then with the owned database at startup and every activation boundary. */
  readonly assertActive: (signal: AbortSignal, database?: ActivationDatabase) => Promise<void>;
}

/** Owns one generation's database and background capabilities. Never performs migrations. */
export async function createRuntime<Relations extends AnyRelations>(options: RuntimeOptions<Relations>) {
  const config = v.parse(runtimeConfigValidator, options.config ?? {});
  const auth = createAuthentication(config.auth, options.auth);
  const { metadataNamespace, deployment, version } = options;
  const functions = Object.freeze({ ...options.functions });
  const declarations = structuredClone(options.crons ?? {});
  const idempotency = { metadataNamespace, deployment };
  validateIdempotencyOptions(idempotency);
  const shutdown = new AbortController();
  const assertActive = options.assertActive;
  const connectionString = options.connectionString;
  let activationDatabase: ActivationDatabase | undefined;
  const pending = new Set<Promise<unknown>>();
  let stopped = false;
  let stopping: Promise<void> | undefined;
  async function activate(signal: AbortSignal): Promise<void> {
    signal.throwIfAborted();
    try {
      await assertActive(signal, activationDatabase);
    } catch {
      throw new Error("Runtime activation denied");
    }
    signal.throwIfAborted();
  }
  function own<T, Input>(
    input: Input,
    operation: (input: Input, signal: AbortSignal) => Promise<T>,
    signal?: AbortSignal,
  ): Promise<T> {
    if (stopped) return Promise.reject(new Error("Runtime stopped"));
    let captured: Input;
    try {
      captured = structuredClone(input);
    } catch (cause) {
      return Promise.reject(cause);
    }
    const current = signal ? AbortSignal.any([signal, shutdown.signal]) : shutdown.signal;
    const work = Promise.resolve()
      .then(() => {
        current.throwIfAborted();
        return operation(captured, current);
      })
      .finally(() => pending.delete(work));
    pending.add(work);
    return work;
  }
  const tables = options.schema.metadata.entities.map((entity) => entity.sqlName);
  const revisions =
    tables.length > 0
      ? createRevisionReader({ namespace: options.schema.metadata.namespace, metadataNamespace, tables })
      : async () => Object.freeze({});
  await activate(shutdown.signal);
  const connection = await connectDatabase({ ...options, connectionString });
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
    const raw = createDispatcher({
      connection,
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
        ),
      internal: (call, identity, signal, job) =>
        own(
          { call, identity, job },
          async ({ call, identity, job }, current) => {
            await activate(current);
            return raw.internal(call, identity, current, job);
          },
          signal,
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
    const connectionTickets = createConnectionTickets({ ...idempotency, db: connection.db });
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
            while (pending.size > 0) await Promise.allSettled(pending);
            await Promise.all([workerStopped, pollerStopped]);
          } finally {
            await connection.close();
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
    await connection.close();
    throw cause;
  }
}
