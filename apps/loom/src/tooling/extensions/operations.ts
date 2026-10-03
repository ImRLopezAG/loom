import { AsyncLocalStorage } from "node:async_hooks";
import type pg from "pg";
import * as v from "valibot";
import { assertMigrationConnection, withMigrationConnection } from "../migrations/connection";

export type ExtensionOperationCompletion = "not-started" | "rolled-back" | "committed" | "unknown";

/** An operator failure retains the exact first cause, including undefined, and every cleanup failure. */
export class ExtensionOperationError extends Error {
  constructor(
    cause: unknown,
    readonly completion: ExtensionOperationCompletion,
    readonly cleanupFailures: readonly { readonly cause: unknown }[] = [],
  ) {
    super(`Extension operation failed (${completion})`, { cause });
    this.name = "ExtensionOperationError";
  }
}

/** Trusted family construction only. Never forward this context into a user callback or public exports. */
export interface ExtensionOperationContext {
  readonly client: pg.Client;
  readonly run: <Result>(work: () => Promise<Result>) => Promise<Result>;
}

interface Owner {
  phase: "initializing" | "callback" | "draining" | "closed";
  revoked: boolean;
  failure?: { cause: unknown };
}
interface CompletionState {
  completion: ExtensionOperationCompletion;
}
const currentOwner = new AsyncLocalStorage<Owner>();
const backendValidator = v.strictObject({
  pid: v.pipe(v.number(), v.integer(), v.minValue(1)),
  started: v.pipe(v.string(), v.minLength(1)),
  database: v.pipe(v.string(), v.minLength(1)),
  application: v.literal("loom-migrations"),
  role: v.pipe(v.string(), v.minLength(1)),
});
type Backend = v.InferOutput<typeof backendValidator>;

async function terminateBackend(connectionString: string, backend: Backend): Promise<void> {
  await withMigrationConnection(connectionString, async (control) => {
    const identity = await control.query("SELECT current_database() AS database, current_user AS role");
    const observed = v.parse(v.strictObject({ database: v.string(), role: v.string() }), identity.rows[0]);
    if (observed.database !== backend.database || observed.role !== backend.role)
      throw new Error("Operator cancellation control connection changed database or role");
    // Same-role activity is visible. Match the entire actual backend identity, never a caller-supplied PID.
    const stopped = await control.query(
      "SELECT pg_catalog.pg_terminate_backend(pid, 5000) AS terminated FROM pg_catalog.pg_stat_activity WHERE pid=$1 AND backend_start=$2::timestamptz AND datname=$3 AND application_name=$4 AND usename=$5",
      [backend.pid, backend.started, backend.database, backend.application, backend.role],
    );
    const rows = v.parse(v.array(v.strictObject({ terminated: v.boolean() })), stopped.rows);
    if (rows.length > 1 || rows.some((row) => !row.terminated))
      throw new Error("Operator backend termination was not confirmed");
    const remaining = await control.query(
      "SELECT pid FROM pg_catalog.pg_stat_activity WHERE pid=$1 AND backend_start=$2::timestamptz AND datname=$3 AND application_name=$4 AND usename=$5",
      [backend.pid, backend.started, backend.database, backend.application, backend.role],
    );
    if (remaining.rows.length !== 0) throw new Error("Terminated operator backend remains present");
  });
}

/**
 * Internal transaction owner for closed, trusted family APIs. Credentials must select a direct operator
 * connection; URL acceptance does not establish provider identity or role privileges. Family construction
 * owns its extension lock and verification before callback admission, before any family/object locks.
 * Acquisition retains migration connection's bounded connect timeout; its startup queries are not promptly
 * abortable. An abort during acquisition is checked as soon as that connection reaches this callback.
 */
export async function withExtensionOperation<Session, Result>(
  connectionString: string,
  initialize: (context: ExtensionOperationContext) => Session | Promise<Session>,
  operation: (session: Session) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result }> {
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("Expected a PostgreSQL operator URL");
  if (url.hostname.endsWith(".neon.tech") && url.hostname.split(".")[0]?.endsWith("-pooler"))
    throw new Error("Extension operator operations require direct credentials, not a Neon pooler URL");
  signal?.throwIfAborted();
  const state: CompletionState = { completion: "not-started" };
  let primary: { cause: unknown } | undefined;
  let reported: ExtensionOperationError | undefined;
  const cleanupFailures: { cause: unknown }[] = [];
  try {
    return await withMigrationConnection(connectionString, async (client) => {
      signal?.throwIfAborted();
      const owner: Owner = { phase: "initializing", revoked: false };
      const pending = new Set<Promise<void>>();
      let tail = Promise.resolve();
      let begun = false;
      let terminated = false;
      let termination: Promise<void> | undefined;
      const backendReady = Promise.withResolvers<Backend | undefined>();
      void backendReady.promise.catch(() => undefined);
      const stopped = Promise.withResolvers<void>();

      const latch = (cause: unknown) => {
        owner.failure ??= { cause };
      };
      function assertExecution() {
        if (owner.revoked) {
          if (owner.failure) throw owner.failure.cause;
          throw new Error("Extension operation is inactive");
        }
        if (owner.failure) throw owner.failure.cause;
        signal?.throwIfAborted();
        assertMigrationConnection(client);
      }
      function run<Value>(work: () => Promise<Value>): Promise<Value> {
        // Public admission closes at callback settlement, even while accepted pipelines are draining.
        if (owner.phase !== "callback" || owner.revoked || currentOwner.getStore() !== owner) {
          const refused = Promise.reject(new Error("Extension operation is inactive or belongs to a different owner"));
          void refused.catch(() => undefined);
          return refused;
        }
        if (owner.failure) {
          const refused = Promise.reject(owner.failure.cause);
          void refused.catch(() => undefined);
          return refused;
        }
        const result = tail.then(() =>
          currentOwner.run(owner, async () => {
            try {
              assertExecution();
              return await work();
            } catch (cause) {
              latch(cause);
              throw cause;
            }
          }),
        );
        const tracked = result
          .then(
            () => undefined,
            (cause) => {
              latch(cause);
            },
          )
          .finally(() => {
            pending.delete(tracked);
          });
        pending.add(tracked);
        tail = tracked;
        return result;
      }
      function stop(cause: unknown) {
        latch(cause);
        owner.revoked = true;
        owner.phase = "closed";
        if (!termination) {
          termination = backendReady.promise
            .then(async (backend) => {
              if (!backend) return;
              await terminateBackend(connectionString, backend);
              terminated = true;
              if (state.completion !== "committed" && state.completion !== "unknown")
                state.completion = begun ? "rolled-back" : "not-started";
            })
            .catch((cause) => {
              cleanupFailures.push({ cause });
            });
        }
        stopped.resolve();
      }
      const abort = () => {
        stop(signal?.reason);
      };
      const connectionError = (cause: Error) => {
        stop(cause);
      };
      client.on("error", connectionError);
      signal?.addEventListener("abort", abort, { once: true });
      if (signal?.aborted) abort();

      const task = currentOwner.run(owner, async () => {
        try {
          assertExecution();
          const identity = await client.query(
            "SELECT pid, backend_start::text AS started, datname AS database, application_name AS application, usename AS role FROM pg_catalog.pg_stat_activity WHERE pid=pg_catalog.pg_backend_pid() AND usename=current_user",
          );
          backendReady.resolve(v.parse(backendValidator, identity.rows[0]));
          assertExecution();
          const begin = await client.query("BEGIN");
          if (begin.command !== "BEGIN") throw new Error("Operator BEGIN did not begin a transaction");
          begun = true;
          assertExecution();
          const session = await initialize({ client, run });
          assertExecution();
          owner.phase = "callback";
          const callback = Promise.resolve()
            .then(() => operation(session))
            .then(
              (value) => {
                if (!owner.revoked) owner.phase = "draining";
                return value;
              },
              (cause) => {
                if (!owner.revoked) owner.phase = "draining";
                latch(cause);
                throw cause;
              },
            );
          let value: Result;
          try {
            value = await callback;
          } catch (cause) {
            while (pending.size && !owner.revoked) await Promise.all(pending);
            throw cause;
          }
          while (pending.size && !owner.revoked) await Promise.all(pending);
          assertExecution();
          // Once dispatched, a lost reply or cancellation cannot establish rollback.
          state.completion = "unknown";
          const commit = await client.query("COMMIT");
          if (commit.command === "COMMIT") state.completion = "committed";
          else if (commit.command === "ROLLBACK") {
            state.completion = "rolled-back";
            begun = false;
          } else throw new Error(`Unexpected operator transaction command: ${commit.command}`);
          if (state.completion !== "committed") throw new Error("Operator COMMIT completed as ROLLBACK");
          return { completion: state.completion, value };
        } catch (cause) {
          backendReady.resolve(undefined);
          latch(cause);
          throw cause;
        }
      });
      // Own both outcomes before racing. Cancellation is inside the dedicated-connection callback,
      // so its finalizer can close even when the losing application callback never resumes.
      const interrupted = stopped.promise.then(async () => {
        await termination;
        throw owner.failure?.cause;
      });
      void task.catch(() => undefined);
      void interrupted.catch(() => undefined);
      try {
        const result = await Promise.race([task, interrupted]);
        await termination;
        if (cleanupFailures.length) throw owner.failure?.cause;
        return result;
      } catch (cause) {
        latch(cause);
        primary = owner.failure;
        owner.revoked = true;
        owner.phase = "closed";
        await termination;
        // A dispatched COMMIT is never followed by a claimed rollback. Closing/termination is the
        // final isolation boundary; only the native COMMIT reply can confirm its durable result.
        if (termination && !terminated && begun && state.completion !== "committed") state.completion = "unknown";
        if (begun && !termination && state.completion !== "committed" && state.completion !== "unknown") {
          try {
            const rollback = await client.query("ROLLBACK");
            if (rollback.command !== "ROLLBACK") throw new Error("Operator ROLLBACK was not confirmed");
            state.completion = "rolled-back";
          } catch (cause) {
            cleanupFailures.push({ cause });
            state.completion = "unknown";
          }
        }
        reported = new ExtensionOperationError(primary?.cause, state.completion, cleanupFailures);
        throw reported;
      } finally {
        owner.revoked = true;
        owner.phase = "closed";
        signal?.removeEventListener("abort", abort);
        client.removeListener("error", connectionError);
      }
    });
  } catch (cause) {
    if (cause === reported) throw cause;
    // withMigrationConnection owns exactly one end(). Its finalizer may fail after commit or replace
    // an earlier callback rejection; retain that close failure beside the original first cause.
    if (reported || state.completion === "committed") cleanupFailures.push({ cause });
    throw new ExtensionOperationError(primary ? primary.cause : cause, state.completion, cleanupFailures);
  }
}
