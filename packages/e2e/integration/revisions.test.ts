import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import pg from "pg";
import { bootstrapDatabase, installRevisionTracking } from "@loom/tooling";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "table revisions track committed SQL changes and serialize concurrent writers",
  async () => {
    if (!connectionString) throw new Error("Missing test database");
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const metadata = `loom_${suffix}`;
    const namespace = `app_${suffix}`;
    const role = `runtime_${suffix}`;
    const admin = new pg.Client({ connectionString });
    const writer = new pg.Client({ connectionString });
    const reader = new pg.Client({ connectionString });
    await Promise.all([admin.connect(), writer.connect(), reader.connect()]);
    const revision = async () =>
      (
        await reader.query<{ revision: string }>(
          `SELECT revision::text FROM "${metadata}".table_revisions WHERE namespace = $1 AND table_name = 'tasks'`,
          [namespace],
        )
      ).rows[0]?.revision;
    try {
      await bootstrapDatabase({ connectionString, metadataNamespace: metadata, runtimeRole: role });
      await admin.query(`CREATE SCHEMA "${namespace}"`);
      await admin.query(`CREATE TABLE "${namespace}".tasks (id integer PRIMARY KEY, title text)`);
      await admin.query("BEGIN");
      await installRevisionTracking(admin, namespace, metadata, ["tasks"]);
      await admin.query("COMMIT");
      expect(await revision()).toBe("1");
      await admin.query(`GRANT USAGE ON SCHEMA "${namespace}" TO "${role}"`);
      await admin.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON "${namespace}".tasks TO "${role}"`);
      await admin.query(`SET ROLE "${role}"`);
      await admin.query(`INSERT INTO "${namespace}".tasks VALUES (1, 'one'), (2, 'two')`);
      expect(await revision()).toBe("2");
      await admin.query(`UPDATE "${namespace}".tasks SET title = 'changed'`);
      expect(await revision()).toBe("3");
      await admin.query(`DELETE FROM "${namespace}".tasks WHERE id = 2`);
      expect(await revision()).toBe("4");
      await assert.rejects(admin.query(`UPDATE "${metadata}".table_revisions SET revision = 0`), /permission denied/);
      await assert.rejects(admin.query(`DELETE FROM "${metadata}".table_revisions`), /permission denied/);
      expect((await admin.query(`SELECT revision::text FROM "${metadata}".table_revisions`)).rows).toEqual([
        { revision: "4" },
      ]);
      await assert.rejects(admin.query(`SELECT "${metadata}".advance_table_revision()`), /permission denied/);
      await admin.query("RESET ROLE");
      await admin.query("BEGIN");
      await admin.query(`INSERT INTO "${namespace}".tasks VALUES (3, 'rollback')`);
      expect(await revision()).toBe("4");
      await admin.query("ROLLBACK");
      expect(await revision()).toBe("4");
      await admin.query("BEGIN");
      await admin.query(`INSERT INTO "${namespace}".tasks VALUES (4, 'first')`);
      const second = writer.query(`INSERT INTO "${namespace}".tasks VALUES (5, 'second')`);
      // The second writer has different domain rows but must wait on the same revision row.
      const pid = (
        await reader.query<{ pid: number }>(
          "SELECT pid FROM pg_stat_activity WHERE query = $1 AND wait_event_type = 'Lock'",
          [`INSERT INTO "${namespace}".tasks VALUES (5, 'second')`],
        )
      ).rows;
      // Check blocking with a bounded SQL wait rather than assuming scheduling order.
      let blocked = pid.length > 0;
      for (let attempt = 0; !blocked && attempt < 100; attempt++) {
        await reader.query("SELECT pg_sleep(0.01)");
        blocked =
          (
            await reader.query("SELECT 1 FROM pg_stat_activity WHERE query = $1 AND wait_event_type = 'Lock'", [
              `INSERT INTO "${namespace}".tasks VALUES (5, 'second')`,
            ])
          ).rows.length > 0;
      }
      expect(blocked).toBe(true);
      expect(await revision()).toBe("4");
      await admin.query("COMMIT");
      await second;
      expect(await revision()).toBe("6");
      await reader.query("BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
      expect(await revision()).toBe("6");
      await admin.query(`UPDATE "${namespace}".tasks SET title = 'new snapshot' WHERE id = 1`);
      expect(await revision()).toBe("6");
      expect((await reader.query(`SELECT title FROM "${namespace}".tasks WHERE id = 1`)).rows).toEqual([
        { title: "changed" },
      ]);
      await reader.query("COMMIT");
      expect(await revision()).toBe("7");
      await admin.query("BEGIN");
      await admin.query(`TRUNCATE "${namespace}".tasks`);
      await admin.query("ROLLBACK");
      expect(await revision()).toBe("7");
      await admin.query(`TRUNCATE "${namespace}".tasks`);
      expect(await revision()).toBe("8");
      await admin.query("BEGIN");
      await installRevisionTracking(admin, namespace, metadata, ["tasks"]);
      await admin.query("COMMIT");
      expect(await revision()).toBe("9");
      await admin.query(`DELETE FROM "${metadata}".table_revisions WHERE namespace = $1`, [namespace]);
      await assert.rejects(
        admin.query(`INSERT INTO "${namespace}".tasks VALUES (10, 'missing revision')`),
        /Missing Loom table revision/,
      );
      expect((await admin.query(`SELECT * FROM "${namespace}".tasks`)).rows).toEqual([]);
    } finally {
      await admin.query("ROLLBACK");
      await admin.query("RESET ROLE");
      await writer.end();
      await reader.end();
      await admin.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
      await admin.query(`DROP SCHEMA IF EXISTS "${metadata}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${role}"`);
      await admin.end();
    }
  },
);
