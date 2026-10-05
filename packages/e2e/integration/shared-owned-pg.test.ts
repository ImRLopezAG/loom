import { test } from "bun:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { startSharedOwnedPg, withOwnedCleanup } from "../fixtures/shared-owned-pg";

const nativeTest = test.skipIf(!process.env.LOOM_TEST_DATABASE_URL);

test("cleanup failure never masks the primary failure and absence is still attempted", async () => {
  const primary = new Error("work failed");
  const stopFailure = new Error("stop failed");
  const calls: string[] = [];
  const failure = await withOwnedCleanup(
    () => Promise.reject(primary),
    [
      async () => {
        calls.push("stop");
        throw stopFailure;
      },
      async () => {
        calls.push("absence");
      },
    ],
  ).catch((cause: unknown) => cause);
  assert(failure instanceof AggregateError);
  assert.deepEqual(failure.errors, [primary, stopFailure]);
  assert.deepEqual(calls, ["stop", "absence"]);
});

test("successful cleanup rethrows the primary failure unchanged", async () => {
  const primary = new Error("work failed");
  await assert.rejects(
    withOwnedCleanup(() => Promise.reject(primary), [async () => undefined]),
    (cause) => cause === primary,
  );
});

test("cleanup failures after successful work are all reported", async () => {
  const stopFailure = new Error("stop failed");
  const absenceFailure = new Error("absence failed");
  const failure = await withOwnedCleanup(async () => "result", [
    () => Promise.reject(stopFailure),
    () => Promise.reject(absenceFailure),
  ]).catch((cause: unknown) => cause);
  assert(failure instanceof AggregateError);
  assert.deepEqual(failure.errors, [stopFailure, absenceFailure]);
  assert.equal(await withOwnedCleanup(async () => "result", [async () => undefined]), "result");
});

test("a hung cleanup step is bounded and later steps still run", async () => {
  const calls: string[] = [];
  const failure = await withOwnedCleanup(
    async () => undefined,
    [
      () => new Promise<void>(() => undefined),
      async () => {
        calls.push("absence");
      },
    ],
    20,
  ).catch((cause: unknown) => cause);
  assert(failure instanceof AggregateError);
  assert.match(String((failure.errors[0] as Error).message), /exceeded 20ms/);
  assert.deepEqual(calls, ["absence"]);
});

nativeTest("database owners clean up independently while the shared server remains available", async () => {
  const directory = await mkdtemp(join(tmpdir(), "kello-shared-owner-"));
  const first = await startSharedOwnedPg(directory, "loom_owner_a");
  const second = await startSharedOwnedPg(directory, "loom_owner_b");
  try {
    await first.createDatabase();
    const active = await second.createDatabase();
    await first.stop();
    await first.proveAbsent();
    const client = new pg.Client({ connectionString: active.connectionString });
    try {
      await client.connect();
      const result = await client.query<{ database: string }>("SELECT current_database() AS database");
      assert.equal(result.rows[0]?.database, active.database);
    } finally {
      await client.end();
    }
  } finally {
    await first.stop();
    await second.stop();
    await second.proveAbsent();
    await rm(directory, { recursive: true, force: true });
  }
});

nativeTest("a broken cleanup journal still drops every owned database", async () => {
  const directory = await mkdtemp(join(tmpdir(), "kello-shared-journal-"));
  const owner = await startSharedOwnedPg(directory, "loom_journal");
  const observer = new pg.Client({ connectionString: owner.controlUrl });
  try {
    const first = await owner.createDatabase();
    const second = await owner.createDatabase();
    await rm(owner.journalFile);
    await mkdir(owner.journalFile);
    await assert.rejects(owner.stop(), AggregateError);
    await observer.connect();
    const result = await observer.query("SELECT datname FROM pg_database WHERE datname=ANY($1::text[])", [
      [first.database, second.database],
    ]);
    assert.equal(result.rowCount, 0);
  } finally {
    await owner.stop();
    await observer.end();
    await rm(directory, { recursive: true, force: true });
  }
});

nativeTest("close preserves the primary failure and drops exactly registered roles and owned databases", async () => {
  const directory = await mkdtemp(join(tmpdir(), "kello-shared-roles-"));
  const owner = await startSharedOwnedPg(directory, "loom_roles");
  const observer = new pg.Client({ connectionString: owner.controlUrl });
  const primary = new Error("work failed");
  try {
    const database = await owner.createDatabase();
    const created = await owner.createRole("loom_role");
    const registered = await owner.registerRole("loom_bootstrap");
    await observer.connect();
    await observer.query(`CREATE ROLE ${pg.escapeIdentifier(registered)} NOLOGIN`);
    const unowned = `loom_unowned_${crypto.randomUUID().replaceAll("-", "")}`;
    await observer.query(`CREATE ROLE ${pg.escapeIdentifier(unowned)} NOLOGIN`);
    try {
      owner.fail(primary);
      await assert.rejects(owner.close(), (cause) => cause === primary);
      const roles = await observer.query<{ rolname: string }>(
        "SELECT rolname FROM pg_roles WHERE rolname=ANY($1::text[]) ORDER BY rolname",
        [[created, registered, unowned]],
      );
      assert.deepEqual(
        roles.rows.map((row) => row.rolname),
        [unowned],
      );
      const databases = await observer.query("SELECT 1 FROM pg_database WHERE datname=$1", [database.database]);
      assert.equal(databases.rowCount, 0);
    } finally {
      await observer.query(`DROP ROLE IF EXISTS ${pg.escapeIdentifier(unowned)}`);
    }
  } finally {
    await owner.stop();
    await observer.end();
    await rm(directory, { recursive: true, force: true });
  }
});

nativeTest("a terminated admin connection does not prevent cleanup or absence proof", async () => {
  const directory = await mkdtemp(join(tmpdir(), "kello-shared-terminated-"));
  const owner = await startSharedOwnedPg(directory, "loom_terminated");
  const observer = new pg.Client({ connectionString: owner.controlUrl });
  try {
    await owner.createDatabase();
    await observer.connect();
    const terminated = await observer.query<{ terminated: boolean }>(
      "SELECT pg_terminate_backend(pid) AS terminated FROM pg_stat_activity WHERE application_name=$1",
      [`kello-admin-${owner.runId}`],
    );
    assert.deepEqual(terminated.rows, [{ terminated: true }]);
    await owner.close();
  } finally {
    await owner.stop();
    await observer.end();
    await rm(directory, { recursive: true, force: true });
  }
});
