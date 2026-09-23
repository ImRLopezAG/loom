import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { writeFileSync } from "node:fs";
import { mkdtemp, mkdir, readFile, realpath, symlink, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";
import pg from "pg";
import { initializeProject, prepareProject, synchronizeDevelopment, startDevelopmentRuntime } from "@loom/tooling";
import type { DevelopmentDatabaseProvider } from "@loom/tooling";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "development startup binds synchronized generations, runtime authority and durable activation",
  async () => {
    if (!connectionString) throw new Error("Missing test database");
    const root = await mkdtemp(join(tmpdir(), "loom-dev-runtime-"));
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const namespace = `app_${suffix}`;
    const metadataNamespace = `loom_${suffix}`;
    const runtimeRole = `runtime_${suffix}`;
    const address = new URL(connectionString);
    const runtimeAddress = new URL(address);
    runtimeAddress.username = runtimeRole;
    runtimeAddress.password = "development-test-only";
    const environment = [process.env.NEON_BRANCH, process.env.DATABASE_URL, process.env.LOOM_ACTIVATION_TOKEN];
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    let runtimeUri = runtimeAddress.href;
    const branch = { id: "br-development", name: "development", protected: false, isDefault: false };
    let runtimeCredentialsResolved = () => {};
    const provider: DevelopmentDatabaseProvider = {
      getProject: async () => ({ id: "project", name: "tasks", regionId: "test", pgVersion: 18 }),
      listBranches: async () => [branch],
      listEndpoints: async () => [
        {
          id: address.hostname.split(".")[0]!,
          branchId: "br-development",
          type: "read_write",
          autoscalingLimitMinCu: 0.25,
          autoscalingLimitMaxCu: 1,
          suspendTimeout: 300,
        },
      ],
      getConnectionUri: async (_project, request) => {
        if (request.roleName === runtimeRole) runtimeCredentialsResolved();
        return { uri: request.roleName === runtimeRole ? runtimeUri : connectionString };
      },
    };
    const options = {
      root,
      databaseName: decodeURIComponent(address.pathname.slice(1)),
      migrationRole: decodeURIComponent(address.username),
      runtimeRole,
      deployment: "local-development",
      activationToken: "e".repeat(64),
    };
    const runtimes: Awaited<ReturnType<typeof startDevelopmentRuntime>>["runtime"][] = [];
    async function expectConnections(expected: number) {
      const deadline = Date.now() + 2000;
      for (;;) {
        const result = await admin.query<{ count: number }>(
          "SELECT count(*)::integer AS count FROM pg_stat_activity WHERE usename = $1",
          [runtimeRole],
        );
        if (result.rows[0]?.count === expected) return;
        if (Date.now() > deadline) assert.fail(`Expected ${expected} runtime connections`);
        await setTimeout(10);
      }
    }
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
      export default defineConfig({project:"tasks",database:{namespace:"${namespace}",metadataNamespace:"${metadataNamespace}"},provider:{projectId:"project",targets:{development:{branchId:"br-development"}}}});`,
      );
      await writeFile(
        join(root, "backend/auth.ts"),
        'import { defineAuth } from "@loom/core/server"; export default defineAuth({allowAnonymous:true, authorize: () => {}});',
      );
      const schemaFile = join(root, "backend/schema.ts");
      const initialSource = (await readFile(schemaFile, "utf8")).replace(
        'namespace: "app"',
        `namespace: "${namespace}"`,
      );
      await writeFile(schemaFile, initialSource);
      const first = await prepareProject(root);
      await synchronizeDevelopment({ ...options, sourceVersion: first.version }, provider);
      await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD 'development-test-only'`);
      const startup = { ...options, sourceVersion: first.version };
      runtimeUri = connectionString;
      await assert.rejects(startDevelopmentRuntime(startup, provider), /connection.*target/i);
      runtimeUri = runtimeAddress.href;
      await admin.query(`ALTER ROLE "${runtimeRole}" CREATEDB`);
      await assert.rejects(startDevelopmentRuntime(startup, provider), /Runtime database preflight failed/);
      await admin.query(`ALTER ROLE "${runtimeRole}" NOCREATEDB`);
      runtimeCredentialsResolved = () => {
        branch.protected = true;
      };
      await assert.rejects(
        startDevelopmentRuntime(startup, provider).then(async (started) => {
          await started.runtime.stop();
          return started;
        }),
        /protected/,
      );
      branch.protected = false;
      runtimeCredentialsResolved = () => {};
      assert.equal(
        (await admin.query(`SELECT count(*) FROM "${metadataNamespace}".deployment_activations`)).rows[0].count,
        "0",
      );
      await expectConnections(0);
      const started = await startDevelopmentRuntime(startup, provider);
      runtimes.push(started.runtime);
      assert.equal(started.binding.branchId, "br-development");
      assert.equal(started.binding.version, first.version);
      assert.ok(!JSON.stringify(started.binding).includes(options.activationToken));
      const call = { name: "tasks:list", kind: "query" as const, version: first.version, args: {} };
      expect(await started.runtime.dispatcher.public(call, null)).toMatchObject({ ok: true, value: [] });
      await expectConnections(1);
      await assert.rejects(
        startDevelopmentRuntime({ ...startup, activationToken: "f".repeat(64) }, provider),
        /grant preparation failed/,
      );
      await expectConnections(1);
      await writeFile(
        schemaFile,
        initialSource.replace("title: s.text().notNull()", "title: s.text().notNull(), description: s.text()"),
      );
      const next = await prepareProject(root);
      await assert.rejects(
        startDevelopmentRuntime({ ...startup, sourceVersion: next.version }, provider),
        /not synchronized/,
      );
      await synchronizeDevelopment({ ...options, sourceVersion: next.version }, provider);
      const successor = await startDevelopmentRuntime({ ...startup, sourceVersion: next.version }, provider);
      runtimes.push(successor.runtime);
      await expectConnections(2);
      expect(await started.runtime.dispatcher.public(call, null)).toMatchObject({ ok: true, value: [] });
      expect(await successor.runtime.dispatcher.public({ ...call, version: next.version }, null)).toMatchObject({
        ok: true,
        value: [],
      });
      await assert.rejects(startDevelopmentRuntime(startup, provider), /stale/);
      assert.deepEqual(
        [process.env.NEON_BRANCH, process.env.DATABASE_URL, process.env.LOOM_ACTIVATION_TOKEN],
        environment,
      );
      await admin.query(
        `UPDATE "${metadataNamespace}".deployment_activations SET state = 'quarantined' WHERE version = $1`,
        [first.version],
      );
      await assert.rejects(started.runtime.dispatcher.public(call, null), /activation denied/i);
      expect(await successor.runtime.dispatcher.public({ ...call, version: next.version }, null)).toMatchObject({
        ok: true,
        value: [],
      });
      await started.runtime.stop();
      await expectConnections(1);
      await admin.query(
        `UPDATE "${metadataNamespace}".deployment_activations SET branch_id = 'br-foreign' WHERE version = $1`,
        [next.version],
      );
      await assert.rejects(
        startDevelopmentRuntime({ ...startup, sourceVersion: next.version }, provider),
        /grant preparation failed/,
      );
      await assert.rejects(
        successor.runtime.dispatcher.public({ ...call, version: next.version }, null),
        /activation denied/i,
      );
      await successor.runtime.stop();
      await expectConnections(0);
      await assert.rejects(
        startDevelopmentRuntime({ ...startup, sourceVersion: next.version, signal: AbortSignal.abort() }, provider),
      );
      await admin.query(
        `UPDATE "${metadataNamespace}".deployment_activations SET branch_id = 'br-development' WHERE version = $1`,
        [next.version],
      );
      await writeFile(
        join(root, "backend/storage.ts"),
        'import { defineStorage } from "@loom/core/server"; export default defineStorage({buckets:{uploads:{}}});',
      );
      const storageSource = await readFile(schemaFile, "utf8");
      const withStorage = await prepareProject(root);
      await synchronizeDevelopment({ ...options, sourceVersion: withStorage.version }, provider);
      let closed = 0;
      let onConnect = () => {
        writeFileSync(
          schemaFile,
          storageSource.replace("description: s.text()", "description: s.text(), another: s.text()"),
        );
      };
      const storageBackend = {
        projectId: "project",
        branchId: "br-development",
        connect() {
          onConnect();
          return {
            target: { projectId: "project", branchId: "br-development" },
            close() {
              closed++;
            },
            async remove() {
              throw new Error("Unexpected storage request");
            },
            async signUpload() {
              throw new Error("Unexpected storage request");
            },
            async sealUpload() {
              throw new Error("Unexpected storage request");
            },
            async signDownload() {
              throw new Error("Unexpected storage request");
            },
          };
        },
      };
      const storageStartup = { ...startup, sourceVersion: withStorage.version, storageBackend };
      await assert.rejects(startDevelopmentRuntime(storageStartup, provider), /stale/);
      assert.equal(closed, 1);
      await expectConnections(0);
      await writeFile(schemaFile, storageSource);
      const cancellation = new AbortController();
      onConnect = () => {
        cancellation.abort();
      };
      await assert.rejects(
        startDevelopmentRuntime({ ...storageStartup, signal: cancellation.signal }, provider),
        /aborted/i,
      );
      assert.equal(closed, 2);
      await expectConnections(0);
      onConnect = () => {
        throw new Error("Storage startup rejected");
      };
      await assert.rejects(startDevelopmentRuntime(storageStartup, provider), /Storage startup rejected/);
      await expectConnections(0);
      assert.deepEqual(
        (
          await admin.query(
            `SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND column_name IN ('description', 'another') ORDER BY column_name`,
            [namespace],
          )
        ).rows,
        [{ column_name: "description" }],
      );
    } finally {
      await Promise.all(runtimes.map((runtime) => runtime.stop()));
      await admin.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
      await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
      await rm(root, { recursive: true, force: true });
    }
  },
);
