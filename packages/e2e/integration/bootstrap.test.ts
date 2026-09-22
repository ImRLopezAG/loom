import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { bootstrapDatabase } from "@loom/tooling";
import pg from "pg";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "bootstrap is versioned, concurrent-safe and isolates the runtime role from metadata and DDL",
  async () => {
    if (!connectionString) throw new Error("Missing test database");
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const metadataNamespace = `loom_meta_${suffix}`;
    const runtimeRole = `loom_runtime_${suffix}`;
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    try {
      await Promise.all([
        bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole }),
        bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole }),
      ]);
      expect(
        (await admin.query(`SELECT version FROM "${metadataNamespace}".framework_migrations ORDER BY version`)).rows,
      ).toEqual([
        { version: 1 },
        { version: 2 },
        { version: 3 },
        { version: 4 },
        { version: 5 },
        { version: 6 },
        { version: 7 },
      ]);
      const sixthVersion = (
        await admin.query(
          `SELECT version, hash FROM "${metadataNamespace}".framework_migrations WHERE version < 7 ORDER BY version`,
        )
      ).rows;
      await admin.query(`DROP TABLE "${metadataNamespace}".job_replays`);
      await admin.query(`DELETE FROM "${metadataNamespace}".framework_migrations WHERE version = 7`);
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      expect(
        (
          await admin.query(
            `SELECT version, hash FROM "${metadataNamespace}".framework_migrations WHERE version < 7 ORDER BY version`,
          )
        ).rows,
      ).toEqual(sixthVersion);
      const fifthVersion = (
        await admin.query(
          `SELECT version, hash FROM "${metadataNamespace}".framework_migrations WHERE version < 6 ORDER BY version`,
        )
      ).rows;
      await admin.query(`DROP TABLE "${metadataNamespace}".job_replays`);
      await admin.query(`DROP TABLE "${metadataNamespace}".jobs`);
      await admin.query(`DELETE FROM "${metadataNamespace}".framework_migrations WHERE version >= 6`);
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      expect(
        (
          await admin.query(
            `SELECT version, hash FROM "${metadataNamespace}".framework_migrations WHERE version < 6 ORDER BY version`,
          )
        ).rows,
      ).toEqual(fifthVersion);
      const fourthVersion = (
        await admin.query(
          `SELECT version, hash FROM "${metadataNamespace}".framework_migrations WHERE version < 5 ORDER BY version`,
        )
      ).rows;
      await admin.query(`DROP TABLE "${metadataNamespace}".job_replays`);
      await admin.query(`DROP TABLE "${metadataNamespace}".jobs`);
      await admin.query(`DROP FUNCTION "${metadataNamespace}".advance_table_revision()`);
      await admin.query(`DROP TABLE "${metadataNamespace}".table_revisions`);
      await admin.query(`DELETE FROM "${metadataNamespace}".framework_migrations WHERE version >= 5`);
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      expect(
        (
          await admin.query(
            `SELECT version, hash FROM "${metadataNamespace}".framework_migrations WHERE version < 5 ORDER BY version`,
          )
        ).rows,
      ).toEqual(fourthVersion);
      const thirdVersion = (
        await admin.query(
          `SELECT version, hash FROM "${metadataNamespace}".framework_migrations WHERE version < 4 ORDER BY version`,
        )
      ).rows;
      await admin.query(`DROP TABLE "${metadataNamespace}".connection_tickets`);
      await admin.query(`DROP TABLE "${metadataNamespace}".job_replays`);
      await admin.query(`DROP TABLE "${metadataNamespace}".jobs`);
      await admin.query(`DROP FUNCTION "${metadataNamespace}".advance_table_revision()`);
      await admin.query(`DROP TABLE "${metadataNamespace}".table_revisions`);
      await admin.query(`DELETE FROM "${metadataNamespace}".framework_migrations WHERE version >= 4`);
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      expect(
        (
          await admin.query(
            `SELECT version, hash FROM "${metadataNamespace}".framework_migrations WHERE version < 4 ORDER BY version`,
          )
        ).rows,
      ).toEqual(thirdVersion);
      const previousVersions = (
        await admin.query(
          `SELECT version, hash FROM "${metadataNamespace}".framework_migrations WHERE version < 3 ORDER BY version`,
        )
      ).rows;
      await admin.query(`DROP TABLE "${metadataNamespace}".mutation_results`);
      await admin.query(`DROP TABLE "${metadataNamespace}".connection_tickets`);
      await admin.query(`DROP TABLE "${metadataNamespace}".job_replays`);
      await admin.query(`DROP TABLE "${metadataNamespace}".jobs`);
      await admin.query(`DROP FUNCTION "${metadataNamespace}".advance_table_revision()`);
      await admin.query(`DROP TABLE "${metadataNamespace}".table_revisions`);
      await admin.query(`DELETE FROM "${metadataNamespace}".framework_migrations WHERE version >= 3`);
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      expect(
        (
          await admin.query(
            `SELECT version, hash FROM "${metadataNamespace}".framework_migrations WHERE version < 3 ORDER BY version`,
          )
        ).rows,
      ).toEqual(previousVersions);
      const original = (
        await admin.query(`SELECT hash FROM "${metadataNamespace}".framework_migrations WHERE version = 1`)
      ).rows;
      await admin.query(`DROP TABLE "${metadataNamespace}".development_history`);
      await admin.query(`DROP TABLE "${metadataNamespace}".mutation_results`);
      await admin.query(`DROP TABLE "${metadataNamespace}".connection_tickets`);
      await admin.query(`DROP TABLE "${metadataNamespace}".job_replays`);
      await admin.query(`DROP TABLE "${metadataNamespace}".jobs`);
      await admin.query(`DROP FUNCTION "${metadataNamespace}".advance_table_revision()`);
      await admin.query(`DROP TABLE "${metadataNamespace}".table_revisions`);
      await admin.query(`DELETE FROM "${metadataNamespace}".framework_migrations WHERE version >= 2`);
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      expect(
        (await admin.query(`SELECT hash FROM "${metadataNamespace}".framework_migrations WHERE version = 1`)).rows,
      ).toEqual(original);
      expect((await admin.query(`SELECT * FROM "${metadataNamespace}".development_history`)).rows).toEqual([]);
      await admin.query(`SET ROLE "${runtimeRole}"`);
      expect((await admin.query(`SELECT * FROM "${metadataNamespace}".connection_tickets`)).rows).toEqual([]);
      await assert.rejects(
        admin.query(`UPDATE "${metadataNamespace}".connection_tickets SET identity = '{}'::jsonb`),
        /permission denied/,
      );
      expect((await admin.query(`SELECT * FROM "${metadataNamespace}".mutation_results`)).rows).toEqual([]);
      await assert.rejects(admin.query(`DELETE FROM "${metadataNamespace}".mutation_results`), /permission denied/);
      await assert.rejects(admin.query(`SELECT * FROM "${metadataNamespace}".migration_history`), /permission denied/);
      await assert.rejects(
        admin.query(`SELECT * FROM "${metadataNamespace}".development_history`),
        /permission denied/,
      );
      await assert.rejects(
        admin.query(`CREATE TABLE "${metadataNamespace}".unauthorized (id integer)`),
        /permission denied/,
      );
      await admin.query("RESET ROLE");
      await admin.query(`GRANT pg_read_all_data TO "${runtimeRole}"`);
      await assert.rejects(bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole }), /Runtime role/);
      await admin.query(`REVOKE pg_read_all_data FROM "${runtimeRole}"`);
      await admin.query(`UPDATE "${metadataNamespace}".framework_migrations SET hash = repeat('0', 64)`);
      await assert.rejects(
        bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole }),
        /Framework migration hash/,
      );
    } finally {
      await admin.query("RESET ROLE");
      await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
    }
  },
);

test.skipIf(!connectionString)(
  "bootstrap refuses privileged runtime roles and rolls back its metadata creation",
  async () => {
    if (!connectionString) throw new Error("Missing test database");
    const metadataNamespace = `loom_meta_${crypto.randomUUID().replaceAll("-", "")}`;
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    try {
      await assert.rejects(
        bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole: "postgres" }),
        /Runtime role/,
      );
      expect(
        (await admin.query("SELECT nspname FROM pg_namespace WHERE nspname = $1", [metadataNamespace])).rows,
      ).toEqual([]);
    } finally {
      await admin.end();
    }
  },
);

test.skipIf(!connectionString)(
  "catalog drift evidence ignores data changes and detects DDL, policies and grants",
  async () => {
    const { catalogFingerprint } = await import("../../tooling/src/migrations/drift");
    const namespace = `loom_drift_${crypto.randomUUID().replaceAll("-", "")}`;
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    try {
      await admin.query("SET search_path = pg_catalog");
      await admin.query(`CREATE SCHEMA "${namespace}"`);
      await admin.query(`CREATE TABLE "${namespace}".tasks (id integer PRIMARY KEY, title text)`);
      const original = await catalogFingerprint(admin, namespace);
      await admin.query(`INSERT INTO "${namespace}".tasks VALUES (1, 'initial')`);
      await admin.query(`UPDATE "${namespace}".tasks SET title = 'changed'`);
      expect(await catalogFingerprint(admin, namespace)).toBe(original);
      await admin.query(`ALTER TABLE "${namespace}".tasks ADD COLUMN extra text`);
      expect(await catalogFingerprint(admin, namespace)).not.toBe(original);
      await admin.query(`ALTER TABLE "${namespace}".tasks DROP COLUMN extra`);
      expect(await catalogFingerprint(admin, namespace)).toBe(original);
      await admin.query(`CREATE POLICY example ON "${namespace}".tasks USING (id > 0)`);
      expect(await catalogFingerprint(admin, namespace)).not.toBe(original);
      await admin.query(`DROP POLICY example ON "${namespace}".tasks`);
      await admin.query(`GRANT SELECT ON "${namespace}".tasks TO PUBLIC`);
      expect(await catalogFingerprint(admin, namespace)).not.toBe(original);
    } finally {
      await admin.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
      await admin.end();
    }
  },
);
