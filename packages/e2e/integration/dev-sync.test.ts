import { initializeProject } from "@loom/tooling";
import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, realpath, symlink, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";
import pg from "pg";
import { prepareProject, generateRelease, planRelease, synchronizeDevelopment } from "@loom/tooling";
import type { DevelopmentDatabaseProvider } from "@loom/tooling";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "development sync applies additive edits, preserves release history, and refuses unsafe or stale updates",
  async () => {
    if (!connectionString) throw new Error("Missing test database");
    const root = await mkdtemp(join(tmpdir(), "loom-sync-"));
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const namespace = `app_${suffix}`;
    const metadata = `loom_${suffix}`;
    const runtimeRole = `runtime_${suffix}`;
    const url = new URL(connectionString);
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    let beforeConnection = async () => {};
    const api: DevelopmentDatabaseProvider = {
      getProject: async () => ({ id: "project", name: "tasks", regionId: "test", pgVersion: 18 }),
      listBranches: async () => [{ id: "br-developer", name: "developer", protected: false, isDefault: false }],
      listEndpoints: async () => [
        {
          id: url.hostname.split(".")[0]!,
          branchId: "br-developer",
          type: "read_write",
          autoscalingLimitMinCu: 0.25,
          autoscalingLimitMaxCu: 1,
          suspendTimeout: 300,
        },
      ],
      getConnectionUri: async () => {
        await beforeConnection();
        return { uri: connectionString };
      },
    };
    const options = {
      root,
      databaseName: decodeURIComponent(url.pathname.slice(1)),
      migrationRole: decodeURIComponent(url.username),
      runtimeRole,
    };
    try {
      await initializeProject(root, "tasks");
      await mkdir(join(root, "node_modules/@loom"), { recursive: true });
      for (const name of ["@loom/core", "@loom/tooling", "valibot", "drizzle-orm"])
        await symlink(
          await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
          join(root, "node_modules", name),
        );
      await writeFile(
        join(root, "loom.config.ts"),
        `import { defineConfig } from "@loom/tooling";
      export default defineConfig({project:"tasks",database:{namespace:"${namespace}",metadataNamespace:"${metadata}"},
      provider:{projectId:"project",targets:{development:{branchId:"br-developer"}}}});`,
      );
      const schemaFile = join(root, "loom/schema.ts");
      const initialSource = (await readFile(schemaFile, "utf8")).replace(
        'namespace: "app"',
        `namespace: "${namespace}"`,
      );
      await writeFile(schemaFile, initialSource);
      await generateRelease(root, "initial");
      const initial = await prepareProject(root);
      const first = await synchronizeDevelopment({ ...options, sourceVersion: initial.version }, api);
      expect(first.applied).toBe(true);
      await admin.query(`INSERT INTO "${namespace}".tasks (title) VALUES ('preserved')`);
      expect(
        (
          await admin.query(
            `SELECT revision::text FROM "${metadata}".table_revisions WHERE namespace = $1 AND table_name = 'tasks'`,
            [namespace],
          )
        ).rows,
      ).toEqual([{ revision: "2" }]);
      expect((await synchronizeDevelopment({ ...options, sourceVersion: initial.version }, api)).applied).toBe(false);
      const expandedSource = initialSource.replace(
        "title: s.text().notNull()",
        "title: s.text().notNull(), description: s.text()",
      );
      await writeFile(schemaFile, expandedSource);
      const expanded = await prepareProject(root);
      await synchronizeDevelopment({ ...options, sourceVersion: expanded.version }, api);
      expect((await admin.query(`SELECT title, description FROM "${namespace}".tasks`)).rows).toEqual([
        { title: "preserved", description: null },
      ]);
      expect((await planRelease(root)).statements.join("\n")).toContain('ADD COLUMN "description"');
      expect(
        (await admin.query(`SELECT count(*)::integer AS count FROM "${metadata}".development_history`)).rows[0]?.count,
      ).toBe(2);
      expect((await admin.query(`SELECT * FROM "${metadata}".migration_history`)).rows).toEqual([]);
      await writeFile(schemaFile, initialSource);
      const destructive = await prepareProject(root);
      await assert.rejects(synchronizeDevelopment({ ...options, sourceVersion: destructive.version }, api), /review/);
      expect((await admin.query(`SELECT description FROM "${namespace}".tasks`)).rows).toHaveLength(1);
      await writeFile(schemaFile, expandedSource);
      beforeConnection = async () => {
        await writeFile(schemaFile, initialSource);
      };
      await assert.rejects(synchronizeDevelopment({ ...options, sourceVersion: expanded.version }, api), /stale/);
      beforeConnection = async () => {};
      await writeFile(schemaFile, expandedSource);
      const extraSource = expandedSource.replace("description: s.text()", "description: s.text(), extra: s.text()");
      await writeFile(schemaFile, extraSource);
      const waiting = await prepareProject(root);
      await admin.query("BEGIN");
      await admin.query(`LOCK TABLE "${namespace}".tasks IN SHARE UPDATE EXCLUSIVE MODE`);
      const cancellation = new AbortController();
      const rolledBack = assert.rejects(
        synchronizeDevelopment({ ...options, sourceVersion: waiting.version, signal: cancellation.signal }, api),
        /stale|aborted/i,
      );
      let changed = false;
      try {
        const deadline = Date.now() + 3000;
        for (;;) {
          await admin.query("SELECT pg_stat_clear_snapshot()");
          const blocked = await admin.query(
            "SELECT 1 FROM pg_stat_activity WHERE pid <> pg_backend_pid() AND application_name = 'loom-migrations' AND wait_event_type = 'Lock' AND query LIKE $1",
            ['%ADD COLUMN "extra"%'],
          );
          if (blocked.rows.length) break;
          if (Date.now() >= deadline) throw new Error("Development DDL did not reach the held table lock");
          await setTimeout(10);
        }
        await writeFile(schemaFile, expandedSource);
        changed = true;
      } finally {
        if (!changed) cancellation.abort();
        await admin.query("COMMIT");
        await rolledBack;
      }
      expect(
        (
          await admin.query(
            "SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = 'tasks' AND column_name = 'extra'",
            [namespace],
          )
        ).rows,
      ).toEqual([]);
      expect(
        (await admin.query(`SELECT count(*)::integer AS count FROM "${metadata}".development_history`)).rows[0]?.count,
      ).toBe(2);
      await admin.query(`GRANT SELECT ON "${namespace}".tasks TO PUBLIC`);
      await assert.rejects(synchronizeDevelopment({ ...options, sourceVersion: expanded.version }, api), /drift/);
      expect(
        (await admin.query(`SELECT count(*)::integer AS count FROM "${metadata}".development_history`)).rows[0]?.count,
      ).toBe(2);
    } finally {
      await admin.query("ROLLBACK");
      await admin.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
      await admin.query(`DROP SCHEMA IF EXISTS "${metadata}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
      await rm(root, { recursive: true, force: true });
    }
  },
);
