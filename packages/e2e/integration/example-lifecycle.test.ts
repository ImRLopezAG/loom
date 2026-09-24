import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import {
  applyMigrations,
  generateRelease,
  loadProject,
  planRelease,
  prepareProject,
  synchronizeDevelopment,
} from "@loom/tooling";
import type { DevelopmentDatabaseProvider } from "@loom/tooling";
import { cp, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { connectDatabase, createDispatcher } from "@loom/core/server";
import type { InvocationIdentity, JsonValue } from "@loom/core/server";
import pg from "pg";
import * as v from "valibot";

test("tasks example loads its schema, relations, authorization and registered functions", async () => {
  const root = fileURLToPath(new URL("../../examples/tasks/", import.meta.url));
  const project = await loadProject(root);
  if (project.protocol !== "loom-legacy-1") throw new Error("Expected legacy fixture");
  assert.equal(project.config.database.namespace, "app");
  assert.deepEqual(project.schema.metadata.entities.map((entry) => entry.name).sort(), ["projects", "tasks"]);
  assert.deepEqual(
    project.functions.map((entry) => entry.name),
    ["projects:create", "projects:list", "tasks:create", "tasks:list", "tasks:setDone"],
  );
});

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "tasks example replays committed migrations and enforces ownership on PostgreSQL",
  async () => {
    if (!connectionString) throw new Error("Missing test database");
    const project = await loadProject(fileURLToPath(new URL("../../examples/tasks/", import.meta.url)));
    if (project.protocol !== "loom-legacy-1") throw new Error("Expected legacy fixture");
    const database = `loom_example_${crypto.randomUUID().replaceAll("-", "")}`;
    const runtimeRole = `${database}_runtime`;
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    try {
      await admin.query(`CREATE DATABASE "${database}"`);
      const address = new URL(connectionString);
      address.pathname = `/${database}`;
      const options = {
        connectionString: address.href,
        root: project.root,
        migrations: project.config.database.migrations,
        namespace: "app",
        metadataNamespace: project.config.database.metadataNamespace,
        runtimeRole,
      };
      const applied = await applyMigrations(options);
      assert.equal(applied.applied.length, 1, "example must include its initial migration");
      assert.deepEqual((await applyMigrations(options)).applied, []);
      await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD 'loom-test-only'`);
      address.username = runtimeRole;
      address.password = "loom-test-only";
      const connection = await connectDatabase({
        schema: project.schema,
        relations: project.relations,
        connectionString: address.href,
        maxConnections: 1,
      });
      try {
        const dispatcher = createDispatcher({
          connection,
          version: project.version,
          functions: Object.fromEntries(project.functions.map((entry) => [entry.name, entry.definition])),
          authorize: project.auth.authorize,
          idempotency: { deployment: "tasks-example", metadataNamespace: options.metadataNamespace },
        });
        const alice = { issuer: "example", subject: "alice" };
        const bob = { issuer: "example", subject: "bob" };
        const call = (
          name: string,
          kind: "query" | "mutation",
          args: JsonValue,
          identity: InvocationIdentity | null = alice,
        ) =>
          dispatcher.public(
            { name, kind, args, version: project.version, idempotencyKey: crypto.randomUUID() },
            identity,
          );
        expect(await call("projects:list", "query", {}, null)).toMatchObject({
          ok: false,
          error: { code: "FORBIDDEN" },
        });
        expect(await call("projects:create", "mutation", { name: "Forged", ownerId: "bob" })).toMatchObject({
          ok: false,
          error: { code: "INVALID_ARGUMENTS" },
        });
        const created = await call("projects:create", "mutation", { name: "  Launch  " });
        assert(created.ok);
        const ownerProject = v.parse(v.strictObject({ _id: v.string(), name: v.literal("Launch") }), created.value);
        const taskResult = await call("tasks:create", "mutation", {
          projectId: ownerProject._id,
          title: "  Ship example  ",
        });
        assert(taskResult.ok);
        const task = v.parse(
          v.strictObject({
            _id: v.string(),
            projectId: v.literal(ownerProject._id),
            title: v.literal("Ship example"),
            done: v.literal(false),
          }),
          taskResult.value,
        );
        expect(await call("tasks:setDone", "mutation", { id: task._id, done: true })).toMatchObject({
          ok: true,
          value: { ...task, done: true },
        });
        for (const stranger of [bob, { ...alice, issuer: "other" }]) {
          expect(await call("projects:list", "query", {}, stranger)).toMatchObject({ ok: true, value: [] });
          expect(await call("tasks:list", "query", { projectId: ownerProject._id }, stranger)).toMatchObject({
            ok: true,
            value: [],
          });
          expect(
            await call("tasks:create", "mutation", { projectId: ownerProject._id, title: "Intrusion" }, stranger),
          ).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
          expect(await call("tasks:setDone", "mutation", { id: task._id, done: false }, stranger)).toMatchObject({
            ok: false,
            error: { code: "FORBIDDEN" },
          });
        }
        expect(
          await call("tasks:create", "mutation", { projectId: crypto.randomUUID(), title: "Missing project" }),
        ).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
        expect(await call("tasks:list", "query", { projectId: ownerProject._id })).toMatchObject({
          ok: true,
          value: [{ ...task, done: true }],
        });
        assert.equal(task._id[14], "7", "task ids use PostgreSQL UUIDv7");
        const persisted = await connection.pool.query<{ created: string }>(
          'SELECT "_createdAt"::text AS created FROM app.tasks WHERE "_id" = $1',
          [task._id],
        );
        const createdAt = Number(persisted.rows[0]?.created);
        assert(Number.isSafeInteger(createdAt) && Math.abs(Date.now() - createdAt) < 60_000);
        await assert.rejects(
          connection.pool.query("INSERT INTO app.tasks (project_id, title) VALUES ($1, $2)", [
            crypto.randomUUID(),
            "Invalid reference",
          ]),
          /foreign key/,
        );
        const bobCreated = await call("projects:create", "mutation", { name: "Bob's project" }, bob);
        assert(bobCreated.ok);
        expect(await call("projects:list", "query", {}, bob)).toMatchObject({ ok: true, value: [bobCreated.value] });
        expect(await call("projects:list", "query", {})).toMatchObject({ ok: true, value: [ownerProject] });
        await assert.rejects(connection.pool.query("ALTER TABLE app.tasks ADD COLUMN forbidden text"), /owner/);
      } finally {
        await connection.close();
      }
    } finally {
      await admin.query(`DROP DATABASE IF EXISTS "${database}" WITH (FORCE)`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
    }
  },
  60_000,
);

test.skipIf(!connectionString)(
  "tasks schema evolution preserves development data and replays into a fresh database",
  async () => {
    if (!connectionString) throw new Error("Missing test database");
    const root = await mkdtemp(join(tmpdir(), "loom-tasks-evolution-"));
    const source = fileURLToPath(new URL("../../examples/tasks/", import.meta.url));
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const developmentDatabase = `loom_evolve_${suffix}`;
    const releaseDatabase = `loom_replay_${suffix}`;
    const runtimeRole = `loom_evolve_role_${suffix}`;
    const releaseRole = `loom_replay_role_${suffix}`;
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    const address = new URL(connectionString);
    address.pathname = `/${developmentDatabase}`;
    const development = new pg.Client({ connectionString: address.href });
    const releaseAddress = new URL(connectionString);
    releaseAddress.pathname = `/${releaseDatabase}`;
    const release = new pg.Client({ connectionString: releaseAddress.href });
    try {
      await cp(join(source, "loom"), join(root, "loom"), {
        recursive: true,
        filter: (path) => !path.includes("_generated"),
      });
      await cp(join(source, "loom/migrations"), join(root, "loom/migrations"), { recursive: true });
      await mkdir(join(root, "node_modules/@loom"), { recursive: true });
      for (const name of ["@loom/core", "@loom/tooling", "valibot", "drizzle-orm"])
        await symlink(await realpath(join(source, "node_modules", name)), join(root, "node_modules", name));
      await writeFile(
        join(root, "loom.config.ts"),
        `import { defineConfig } from "@loom/tooling";
      export default defineConfig({ project: "tasks", database: { namespace: "app" },
        provider: { projectId: "local-example", targets: { development: { branchId: "br-local-development" } } } });`,
      );
      await admin.query(`CREATE DATABASE "${developmentDatabase}"`);
      await admin.query(`CREATE DATABASE "${releaseDatabase}"`);
      await development.connect();
      await release.connect();
      const project = await loadProject(root);
      if (project.protocol !== "loom-legacy-1") throw new Error("Expected legacy fixture");
      const migrationOptions = {
        root,
        migrations: project.config.database.migrations,
        namespace: "app",
        metadataNamespace: project.config.database.metadataNamespace,
      };
      const initial = await applyMigrations({ ...migrationOptions, connectionString: address.href, runtimeRole });
      assert.equal(initial.applied.length, 1);
      const inserted = await development.query<{ _id: string }>(
        "INSERT INTO app.projects (name, owner_id, owner_issuer) VALUES ('Release checklist', 'alice', 'example') RETURNING _id",
      );
      const projectId = inserted.rows[0]?._id;
      assert(projectId);
      await development.query("INSERT INTO app.tasks (project_id, title) VALUES ($1, 'Preserve this task')", [
        projectId,
      ]);
      // Only provider discovery is a local fixture; synchronization, DDL and release replay use actual PostgreSQL.
      const provider: DevelopmentDatabaseProvider = {
        getProject: async () => ({ id: "local-example", name: "tasks", regionId: "local", pgVersion: 18 }),
        listBranches: async () => [
          { id: "br-local-development", name: "development", protected: false, isDefault: false },
        ],
        listEndpoints: async () => [
          {
            id: address.hostname.split(".")[0]!,
            branchId: "br-local-development",
            type: "read_write",
            autoscalingLimitMinCu: 0.25,
            autoscalingLimitMaxCu: 1,
            suspendTimeout: 300,
          },
        ],
        getConnectionUri: async () => ({ uri: address.href }),
      };
      const sync = {
        root,
        databaseName: developmentDatabase,
        migrationRole: decodeURIComponent(address.username),
        runtimeRole,
      };
      const baseline = await prepareProject(root);
      await synchronizeDevelopment({ ...sync, sourceVersion: baseline.version }, provider);
      const schemaPath = join(root, "loom/schema.ts");
      const schema = await readFile(schemaPath, "utf8");
      const expanded = schema.replace("done: s.boolean()", "description: s.text(), done: s.boolean()");
      assert.notEqual(expanded, schema);
      await writeFile(schemaPath, expanded);
      const beforeSync = await planRelease(root);
      assert(beforeSync.statements.some((statement) => statement.includes('ADD COLUMN "description"')));
      const candidate = await prepareProject(root);
      assert((await synchronizeDevelopment({ ...sync, sourceVersion: candidate.version }, provider)).applied);
      assert.deepEqual((await development.query("SELECT title, description FROM app.tasks")).rows, [
        { title: "Preserve this task", description: null },
      ]);
      const afterSync = await planRelease(root);
      assert.equal(afterSync.hash, beforeSync.hash, "development DDL must not replace the committed release baseline");
      const artifact = await generateRelease(root, "task_description");
      assert.equal(artifact.plan.hash, beforeSync.hash);
      const replay = await applyMigrations({
        ...migrationOptions,
        connectionString: releaseAddress.href,
        runtimeRole: releaseRole,
      });
      assert.deepEqual(replay.applied, [...initial.applied, artifact.plan.hash]);
      assert.deepEqual(
        (
          await applyMigrations({
            ...migrationOptions,
            connectionString: releaseAddress.href,
            runtimeRole: releaseRole,
          })
        ).applied,
        [],
      );
      const columns =
        "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'app' AND table_name = 'tasks' ORDER BY ordinal_position";
      assert.deepEqual((await release.query(columns)).rows, (await development.query(columns)).rows);
      assert.equal((await release.query("SELECT * FROM app.tasks")).rowCount, 0);
      assert.deepEqual(
        (
          await development.query(
            `SELECT hash FROM "${project.config.database.metadataNamespace}".migration_history ORDER BY ordinal`,
          )
        ).rows.map((row) => row.hash),
        initial.applied,
      );
    } finally {
      await development.end();
      await release.end();
      await admin.query(`DROP DATABASE IF EXISTS "${developmentDatabase}" WITH (FORCE)`);
      await admin.query(`DROP DATABASE IF EXISTS "${releaseDatabase}" WITH (FORCE)`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.query(`DROP ROLE IF EXISTS "${releaseRole}"`);
      await admin.end();
      await rm(root, { recursive: true, force: true });
    }
  },
  60_000,
);

test("upload catalog loads independent configuration, storage handlers and registered jobs", async () => {
  const root = fileURLToPath(new URL("../../examples/jobs-storage/", import.meta.url));
  const project = await prepareProject(root);
  const loaded = await loadProject(root);
  assert.equal(project.version, loaded.version);
  assert.deepEqual(
    loaded.schema.metadata.entities.map((entry) => entry.name),
    ["files"],
  );
  assert.deepEqual(Object.keys(loaded.storage.buckets).sort(), ["failure-demo", "retry-demo", "uploads"]);
  assert.deepEqual(
    loaded.functions.map((entry) => entry.name),
    ["files:created", "files:list", "files:process", "files:status"],
  );
});
