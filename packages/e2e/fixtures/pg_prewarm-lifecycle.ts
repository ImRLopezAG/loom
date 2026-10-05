import { setTimeout } from "node:timers/promises";
import type pg from "pg";

/** Same native blocker/observer pattern as extensions-operations.test.ts; no supplied driver results. */
export async function prewarmWaitFor<Value>(read: () => Promise<Value | undefined>, message: string): Promise<Value> {
  const deadline = performance.now() + 4000;
  for (;;) {
    const value = await read();
    if (value !== undefined) return value;
    if (performance.now() >= deadline) throw new Error(message);
    await setTimeout(10);
  }
}

export async function prewarmBounded<Value>(pending: Promise<Value>): Promise<Value> {
  const timer = new AbortController();
  try {
    return await Promise.race([
      pending,
      setTimeout(8000, undefined, { signal: timer.signal }).then(() => {
        throw new Error("Prewarm owner did not settle");
      }),
    ]);
  } finally {
    timer.abort();
  }
}

export async function prewarmBackend(observer: pg.Client): Promise<number> {
  return prewarmWaitFor(async () => {
    await observer.query("SELECT pg_catalog.pg_stat_clear_snapshot()");
    const rows = (
      await observer.query<{ pid: number }>(
        "SELECT pid FROM pg_catalog.pg_stat_activity WHERE datname=current_database() AND application_name='loom-migrations' AND usename=current_user",
      )
    ).rows;
    if (rows.length > 1) throw new Error("Prewarm fixture has more than one owned backend");
    return rows[0]?.pid;
  }, "Prewarm owner backend was not observed");
}

export async function prewarmBlocked(observer: pg.Client, pid: number): Promise<void> {
  await prewarmWaitFor(async () => {
    await observer.query("SELECT pg_catalog.pg_stat_clear_snapshot()");
    const rows = (
      await observer.query<{ blocked: boolean }>(
        "SELECT pg_backend_pid()=ANY(pg_catalog.pg_blocking_pids($1)) AS blocked",
        [pid],
      )
    ).rows;
    return rows[0]?.blocked ? true : undefined;
  }, "Prewarm statement did not reach the observer's native relation lock");
}

export async function prewarmBackendDisposed(observer: pg.Client, pid: number): Promise<boolean> {
  await observer.query("SELECT pg_catalog.pg_stat_clear_snapshot()");
  const activity = await observer.query("SELECT pid FROM pg_catalog.pg_stat_activity WHERE pid=$1", [pid]);
  const locks = await observer.query("SELECT pid FROM pg_catalog.pg_locks WHERE pid=$1", [pid]);
  return activity.rows.length === 0 && locks.rows.length === 0;
}
