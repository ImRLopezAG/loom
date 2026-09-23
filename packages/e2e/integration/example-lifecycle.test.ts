import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";
import { applyMigrations, loadProject } from "@loom/tooling";
import { connectDatabase, createDispatcher } from "@loom/core/server";
import type { InvocationIdentity, JsonValue } from "@loom/core/server";
import pg from "pg";
import * as v from "valibot";

test("tasks example loads its schema, relations, authorization and registered functions", async () => {
  const root = fileURLToPath(new URL("../../examples/tasks/", import.meta.url));
  const project = await loadProject(root);
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
