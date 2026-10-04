import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

type FixtureJournalValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | readonly FixtureJournalValue[]
  | { readonly [key: string]: FixtureJournalValue };

type CleanupStep = () => Promise<void>;
type Outcome<Result> = { readonly ok: true; readonly value: Result } | { readonly ok: false; readonly cause: unknown };

const cleanupStepTimeoutMs = 120_000;
const connectionOptions = { connectionTimeoutMillis: 15_000, query_timeout: 60_000 } as const;
const nameLabel = /^[a-z][a-z0-9_]{0,20}$/;

function asError(cause: unknown, message: string) {
  return cause instanceof Error ? cause : new Error(message, { cause });
}

async function bounded(step: CleanupStep, timeoutMs: number) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    await Promise.race([
      step(),
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => reject(new Error(`Owned fixture cleanup step exceeded ${timeoutMs}ms`)), timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

async function settle<Result>(outcome: Outcome<Result>, steps: readonly CleanupStep[], timeoutMs: number) {
  const errors: unknown[] = [];
  // Every step runs even when work or an earlier step failed, so absence proof stays independent of stop().
  for (const step of steps) {
    try {
      await bounded(step, timeoutMs);
    } catch (cause) {
      errors.push(cause);
    }
  }
  if (!outcome.ok) {
    if (errors.length) throw new AggregateError([outcome.cause, ...errors], "Work failed and owned fixture cleanup failed");
    throw outcome.cause;
  }
  if (errors.length) throw new AggregateError(errors, "Owned fixture cleanup failed");
  return outcome.value;
}

/** Runs work, then every bounded cleanup step; the primary failure stays first and is never masked. */
export async function withOwnedCleanup<Result>(
  work: () => Promise<Result>,
  steps: readonly CleanupStep[],
  timeoutMs = cleanupStepTimeoutMs,
): Promise<Result> {
  let outcome: Outcome<Result>;
  try {
    outcome = { ok: true, value: await work() };
  } catch (cause) {
    outcome = { ok: false, cause };
  }
  return settle(outcome, steps, timeoutMs);
}

/** Own UUID databases and registered roles on the supplied server; its container remains parent-owned. */
export async function startSharedOwnedPg(directory: string, prefix: string) {
  const suppliedUrl = process.env.LOOM_TEST_DATABASE_URL;
  assert(suppliedUrl, "Supply LOOM_TEST_DATABASE_URL from the parent-managed shared PostgreSQL fixture");
  assert(nameLabel.test(prefix), "Expected a bounded fixture database prefix");
  const address = new URL(suppliedUrl);
  assert(["postgres:", "postgresql:"].includes(address.protocol), "Expected a PostgreSQL fixture URL");
  const runId = randomUUID();
  await mkdir(directory, { recursive: true });
  const journalFile = join(directory, `${prefix}-${runId}.jsonl`);
  const databases: string[] = [];
  const roles: string[] = [];
  const connectionErrors: Error[] = [];
  // Ownership fields are written last so caller detail cannot relabel the run.
  const journal = (event: string, detail: Readonly<Record<string, FixtureJournalValue>> = {}) =>
    appendFile(
      journalFile,
      JSON.stringify({ ...detail, event, runId, fixture: "parent-managed-postgres" }) + "\n",
      { mode: 0o600 },
    );
  const client = (purpose: string) => {
    const connection = new pg.Client({
      connectionString: address.href,
      application_name: `kello-${purpose}-${runId}`,
      ...connectionOptions,
    });
    connection.on("error", (cause) => connectionErrors.push(cause));
    return connection;
  };
  const end = async (connection: pg.Client, errors: unknown[]) => {
    try {
      await connection.end();
    } catch (cause) {
      errors.push(asError(cause, "Fixture connection close failed"));
    }
  };
  const admin = client("admin");
  let closed = false;
  try {
    await admin.connect();
    const version = await admin.query<{ server_version_num: string }>("SHOW server_version_num");
    assert.equal(Math.floor(Number(version.rows[0]?.server_version_num) / 10000), 18);
    await journal("shared-fixture-connected");
  } catch (cause) {
    const errors: unknown[] = [];
    await end(admin, errors);
    if (errors.length) throw new AggregateError([cause, ...errors], "Shared fixture connection failed");
    throw cause;
  }

  const registerRole = async (label: string) => {
    assert(!closed, "The fixture role owner is closed");
    assert(nameLabel.test(label), "Expected a bounded fixture role label");
    const role = `${label}_${randomUUID().replaceAll("-", "")}`;
    // Registration precedes any CREATE so a partial creation is still owned and cleaned.
    roles.push(role);
    await journal("role-registered", { role });
    return role;
  };

  let outcome: Outcome<undefined> = { ok: true, value: undefined };
  const stop = async () => {
    if (closed) return;
    closed = true;
    const errors: unknown[] = [];
    const record = async (event: string, detail: Readonly<Record<string, FixtureJournalValue>>) => {
      try {
        await journal(event, detail);
      } catch (cause) {
        errors.push(asError(cause, "Fixture cleanup journal failed"));
      }
    };
    await end(admin, errors);
    // A fresh client keeps cleanup independent of an admin connection that may have failed mid-run.
    const cleanup = client("cleanup");
    try {
      await cleanup.connect();
      for (const database of databases) {
        await record("database-drop-attempted", { database });
        try {
          await cleanup.query(`DROP DATABASE IF EXISTS ${pg.escapeIdentifier(database)} WITH (FORCE)`);
          await record("database-dropped", { database });
        } catch (cause) {
          errors.push(asError(cause, "Fixture database cleanup failed"));
        }
      }
      for (const role of roles) {
        await record("role-drop-attempted", { role });
        try {
          await cleanup.query(`DROP ROLE IF EXISTS ${pg.escapeIdentifier(role)}`);
          await record("role-dropped", { role });
        } catch (cause) {
          errors.push(asError(cause, "Fixture role cleanup failed"));
        }
      }
    } catch (cause) {
      errors.push(asError(cause, "Fixture cleanup connection failed"));
    } finally {
      await end(cleanup, errors);
    }
    if (connectionErrors.length)
      await record("connection-errors-observed", { messages: connectionErrors.map((cause) => cause.message) });
    if (errors.length) throw new AggregateError(errors, "Owned fixture cleanup failed");
  };
  const proveAbsent = async () => {
    const independent = client("absence");
    const errors: unknown[] = [];
    try {
      await independent.connect();
      const remaining = await independent.query("SELECT datname FROM pg_database WHERE datname=ANY($1::text[])", [
        databases,
      ]);
      assert.equal(remaining.rowCount, 0, "Owned fixture databases remain on the shared server");
      const remainingRoles = await independent.query("SELECT rolname FROM pg_roles WHERE rolname=ANY($1::text[])", [
        roles,
      ]);
      assert.equal(remainingRoles.rowCount, 0, "Owned fixture roles remain on the shared server");
      await journal("independent-absence-proven", { databases: databases.length, roles: roles.length });
    } catch (cause) {
      errors.push(cause);
    } finally {
      await end(independent, errors);
    }
    if (errors.length === 1) throw errors[0];
    if (errors.length) throw new AggregateError(errors, "Owned fixture absence proof failed");
  };

  return {
    runId,
    journalFile,
    controlUrl: address.href,
    journal,
    registerRole,
    createRole: async (label: string) => {
      const role = await registerRole(label);
      await admin.query(`CREATE ROLE ${pg.escapeIdentifier(role)} NOLOGIN`);
      await journal("role-created", { role });
      return role;
    },
    createDatabase: async () => {
      assert(!closed, "The fixture database owner is closed");
      const database = `${prefix}_${randomUUID().replaceAll("-", "")}`;
      databases.push(database);
      await journal("database-attempted", { database });
      await admin.query(`CREATE DATABASE ${pg.escapeIdentifier(database)}`);
      await journal("database-created", { database });
      const url = new URL(address.href);
      url.pathname = `/${database}`;
      return { database, connectionString: url.href };
    },
    stop,
    proveAbsent,
    /** Record the primary failure from a caller's catch so close() can never mask it. */
    fail(cause: unknown) {
      outcome = { ok: false, cause };
    },
    /** Bounded stop plus an always-attempted independent absence proof, preserving any recorded failure. */
    close: () => settle(outcome, [stop, proveAbsent], cleanupStepTimeoutMs),
  };
}
