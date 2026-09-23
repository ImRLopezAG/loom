import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { mkdtemp, mkdir, readFile, readlink, realpath, symlink, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";
import pg from "pg";
import { initializeProject, startDevelopment, startProjectDevelopment, prepareProject } from "@loom/tooling";
import type { DevelopmentDatabaseProvider } from "@loom/tooling";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
async function until(check: () => boolean | Promise<boolean>, timeoutMs = 5000) {
  const deadline = Date.now() + timeoutMs;
  while (!(await check())) {
    if (Date.now() >= deadline) throw new Error("Development state did not settle");
    await setTimeout(10);
  }
}
test.skipIf(!connectionString)(
  "development saves synchronize schema, references and serving runtime with failed-edit recovery",
  async () => {
    if (!connectionString) throw new Error("Missing test database");
    const root = await mkdtemp(join(tmpdir(), "loom-dev-"));
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const namespace = `app_${suffix}`;
    const metadataNamespace = `loom_${suffix}`;
    const runtimeRole = `runtime_${suffix}`;
    const address = new URL(connectionString);
    const runtimeAddress = new URL(address);
    runtimeAddress.username = runtimeRole;
    runtimeAddress.password = "development-test-only";
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    const branch = { id: "br-development", name: "development", protected: false, isDefault: false };
    let beforeCredentials = async () => {};
    let runtimeConnection = runtimeAddress.href;
    const provider: DevelopmentDatabaseProvider = {
      getProject: async () => ({ id: "project", name: "tasks", regionId: "test", pgVersion: 18 }),
      listBranches: async () => [branch],
      listEndpoints: async () => [
        {
          id: address.hostname.split(".")[0]!,
          branchId: branch.id,
          type: "read_write",
          autoscalingLimitMinCu: 0.25,
          autoscalingLimitMaxCu: 1,
          suspendTimeout: 300,
        },
      ],
      getConnectionUri: async (_project, request) => {
        await beforeCredentials();
        return { uri: request.roleName === runtimeRole ? runtimeConnection : connectionString };
      },
    };
    const options = {
      root,
      databaseName: decodeURIComponent(address.pathname.slice(1)),
      migrationRole: decodeURIComponent(address.username),
      runtimeRole,
      deployment: "local",
      activationToken: "a".repeat(64),
      port: 0,
      debounceMs: 20,
      jobPollMs: 100,
    };
    const tokenEnv = `LOOM_DEV_TEST_${suffix.toUpperCase()}`;
    process.env[tokenEnv] = options.activationToken;
    let development: Awaited<ReturnType<typeof startDevelopment>> | undefined;
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
        `import { defineConfig } from "@loom/tooling"; export default defineConfig({project:"tasks", database:{namespace:"${namespace}",metadataNamespace:"${metadataNamespace}"},provider:{projectId:"project",targets:{development:{branchId:"br-development"}}}});`,
      );
      await writeFile(
        join(root, "backend/auth.ts"),
        'import { defineAuth } from "@loom/core/server"; export default defineAuth({allowAnonymous:true, authorize: () => {}});',
      );
      const source = join(root, "backend/schema.ts");
      await writeFile(
        join(root, "backend/functions/jobs.ts"),
        `
import { mutation, internalMutation } from "@loom/core/server";
import * as v from "valibot";
import { internal } from "../_generated/internal";
export const complete = internalMutation({ args: v.object({}), returns: v.string(), handler: () => "ran" });
export const enqueue = mutation({ args: v.object({}), returns: v.string(), handler: (ctx) => ctx.scheduler.runAfter(0, internal["jobs:complete"], {}) });
`,
      );
      const initial = (await readFile(source, "utf8")).replace('namespace: "app"', `namespace: "${namespace}"`);
      await writeFile(
        join(root, "backend/crons.ts"),
        `
import { cron } from "@loom/core/server";
import { internal } from "./_generated/internal";
export default { minute: cron("* * * * *", internal["jobs:complete"], {}) };
`,
      );
      await writeFile(source, initial);
      await admin.query(`CREATE ROLE "${runtimeRole}" LOGIN NOINHERIT PASSWORD 'development-test-only'`);
      await writeFile(source, "export default {");
      const { root: _root, activationToken: _token, ...declaration } = options;
      await writeFile(
        join(root, "loom.dev.json"),
        JSON.stringify({ format: 1, ...declaration, activationTokenEnv: tokenEnv }),
      );
      development = await startProjectDevelopment(root, "loom.dev.json", provider);
      const running = development;
      await running.flush();
      assert.ok(running.failure);
      expect(running.active).toBeNull();
      expect(running.url).toBeNull();
      await writeFile(source, initial);
      await until(() => running.active !== null);
      await running.settled();
      assert.equal(running.failure, null);
      assert.ok(running.active);
      assert.ok(running.url);
      const url = running.url;
      const first = running.active.version;
      async function query(version: string) {
        const result = await fetch(new URL("/api/loom/call", url), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ protocol: 1, name: "tasks:list", kind: "query", version, args: {} }),
        });
        return result.json();
      }
      assert.deepEqual((await query(first)).value, []);
      async function scheduleJob(version: string, endpoint: URL) {
        const response = await fetch(new URL("/api/loom/call", endpoint), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            protocol: 1,
            name: "jobs:enqueue",
            kind: "mutation",
            version,
            args: {},
            idempotencyKey: crypto.randomUUID(),
          }),
        });
        const result = await response.json();
        assert.equal(result.ok, true);
        await until(
          async () =>
            (await admin.query(`SELECT state FROM "${metadataNamespace}".jobs WHERE id = $1`, [result.value])).rows[0]
              ?.state === "succeeded",
        );
        assert.equal(
          (await admin.query(`SELECT result FROM "${metadataNamespace}".jobs WHERE id = $1`, [result.value])).rows[0]
            ?.result,
          "ran",
        );
      }
      await scheduleJob(first, url);
      await until(
        async () =>
          (
            await admin.query(
              `SELECT 1 FROM "${metadataNamespace}".jobs WHERE deduplication_key LIKE 'cron:%' AND state = 'succeeded' AND call->>'version' = $1`,
              [first],
            )
          ).rows.length === 1,
        65_000,
      );
      assert.equal(running.cronFailure, null);
      await admin.query(
        `UPDATE "${metadataNamespace}".deployment_activations SET state = 'quarantined' WHERE version = $1`,
        [first],
      );
      await until(() => running.workerFailure !== null);
      assert.equal(running.workerFailure?.message, "Development job worker failed");
      await admin.query(
        `UPDATE "${metadataNamespace}".deployment_activations SET state = 'active' WHERE version = $1`,
        [first],
      );
      await until(() => running.workerFailure === null);
      let expanded = initial.replace("title: s.text().notNull()", "title: s.text().notNull(), description: s.text()");
      await writeFile(source, expanded);
      await until(() => running.active?.version !== first);
      await running.settled();
      assert.equal(running.failure, null);
      let second = running.active.version;
      assert.equal(running.url?.href, url.href);
      assert.equal(await readlink(join(root, "backend/_generated/current")), second);
      assert.deepEqual((await query(second)).value, []);
      await scheduleJob(second, url);
      assert.equal((await query(first)).error.code, "VERSION_MISMATCH");
      const invalidCredentials = new URL(runtimeAddress);
      invalidCredentials.password = "wrong-development-test-password";
      runtimeConnection = invalidCredentials.href;
      expanded = expanded.replace("description: s.text()", "description: s.text(), ready: s.text()");
      await writeFile(source, expanded);
      await until(() => running.failure !== null);
      assert.equal(running.active.version, second);
      assert.equal(await readlink(join(root, "backend/_generated/current")), second);
      assert.equal(
        (
          await admin.query(
            "SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND column_name = 'ready'",
            [namespace],
          )
        ).rows.length,
        1,
      );
      assert.deepEqual((await query(second)).value, []);
      runtimeConnection = runtimeAddress.href;
      await writeFile(source, expanded);
      await until(() => running.active?.version !== second);
      await running.settled();
      assert.equal(running.failure, null);
      second = running.active.version;
      await admin.query(`INSERT INTO "${namespace}".tasks (title, description) VALUES ('preserved', 'nullable edit')`);
      await writeFile(source, "export default {");
      await until(() => running.failure !== null);
      assert.equal(running.active.version, second);
      assert.equal(await readlink(join(root, "backend/_generated/current")), second);
      assert.deepEqual((await query(second)).value, ["preserved"]);
      await writeFile(source, expanded);
      await until(() => running.failure === null);
      await writeFile(source, initial);
      await until(() => running.failure !== null);
      assert.equal(running.active.version, second);
      assert.equal(
        (await admin.query(`SELECT description FROM "${namespace}".tasks`)).rows[0].description,
        "nullable edit",
      );
      const entered = Promise.withResolvers<void>();
      const resume = Promise.withResolvers<void>();
      beforeCredentials = async () => {
        entered.resolve();
        await resume.promise;
      };
      await writeFile(source, expanded.replace("description: s.text()", "description: s.text(), obsolete: s.text()"));
      await entered.promise;
      const latest = expanded.replace("description: s.text()", "description: s.text(), latest: s.text()");
      try {
        await writeFile(
          source,
          expanded.replace("description: s.text()", "description: s.text(), intermediate: s.text()"),
        );
        await writeFile(source, latest);
      } finally {
        beforeCredentials = async () => {};
        resume.resolve();
      }
      const expected = await prepareProject(root);
      await until(() => running.active?.version === expected.version);
      await running.settled();
      assert.equal(running.failure, null);
      assert.equal(await readlink(join(root, "backend/_generated/current")), expected.version);
      assert.deepEqual(
        (
          await admin.query(
            "SELECT column_name FROM information_schema.columns WHERE table_schema = $1 AND column_name IN ('obsolete','intermediate','latest') ORDER BY column_name",
            [namespace],
          )
        ).rows,
        [{ column_name: "latest" }],
      );
      assert.deepEqual((await query(expected.version)).value, ["preserved"]);
      branch.protected = true;
      await writeFile(source, latest.replace("latest: s.text()", "latest: s.text(), forbidden: s.text()"));
      await until(() => running.failure !== null);
      assert.equal(running.active.version, expected.version);
      branch.protected = false;
      const stoppingEntered = Promise.withResolvers<void>();
      const stoppingResume = Promise.withResolvers<void>();
      beforeCredentials = async () => {
        stoppingEntered.resolve();
        await stoppingResume.promise;
      };
      await writeFile(source, latest.replace("latest: s.text()", "latest: s.text(), stopping: s.text()"));
      await stoppingEntered.promise;
      let stopped = false;
      const stopping = running.stop().then(() => {
        stopped = true;
      });
      try {
        await setTimeout(10);
        assert.equal(stopped, false);
      } finally {
        beforeCredentials = async () => {};
        stoppingResume.resolve();
        await stopping;
      }
      await assert.rejects(fetch(url));
      await until(
        async () =>
          (await admin.query("SELECT 1 FROM pg_stat_activity WHERE usename = $1", [runtimeRole])).rows.length === 0,
      );
      branch.protected = false;
      await writeFile(source, latest);
      development = await startDevelopment(options, provider);
      await development.flush();
      assert.equal(development.failure, null);
      assert.equal(development.active?.version, expected.version);
      await development.stop();
      const providerServer = Bun.serve({
        hostname: "127.0.0.1",
        port: 0,
        fetch(request) {
          assert.equal(request.headers.get("authorization"), "Bearer development-fixture-key");
          assert.equal(request.method, "GET");
          const url = new URL(request.url);
          switch (url.pathname) {
            case "/projects/project":
              return Response.json({ project: { id: "project", name: "tasks", pg_version: 18, region_id: "test" } });
            case "/projects/project/branches":
              return Response.json({
                branches: [{ id: branch.id, name: branch.name, protected: false, default: false }],
              });
            case "/projects/project/endpoints":
              return Response.json({
                endpoints: [
                  {
                    id: address.hostname.split(".")[0],
                    branch_id: branch.id,
                    type: "read_write",
                    autoscaling_limit_min_cu: 0.25,
                    autoscaling_limit_max_cu: 1,
                    suspend_timeout_seconds: 300,
                  },
                ],
              });
            case "/projects/project/connection_uri":
              return Response.json({
                uri: url.searchParams.get("role_name") === runtimeRole ? runtimeConnection : connectionString,
              });
            default:
              throw new Error("Unexpected development provider request");
          }
        },
      });
      const preload = join(root, ".loom/local-transport.mjs");
      await writeFile(
        preload,
        `
const originalFetch = globalThis.fetch;
globalThis.fetch = (input, init) => {
  const request = new Request(input, init);
  const url = new URL(request.url);
  if (url.origin !== "https://console.neon.tech" || !url.pathname.startsWith("/api/v2/"))
    throw new Error("Unexpected test transport target");
  return originalFetch(new Request(new URL(url.pathname.slice("/api/v2".length) + url.search, ${JSON.stringify(providerServer.url.origin)}), request));
};
`,
      );
      const cli = fileURLToPath(new URL("../../../apps/loom/src/cli.ts", import.meta.url));
      const child = Bun.spawn([process.execPath, "--preload", preload, cli, "dev", "--cwd", root, "--json"], {
        stdout: "pipe",
        stderr: "pipe",
        env: { ...process.env, NEON_API_KEY: "development-fixture-key" },
      });
      let stdout = "";
      let stderr = "";
      const output = (async () => {
        for await (const chunk of child.stdout) stdout += new TextDecoder().decode(chunk);
      })();
      const errors = (async () => {
        for await (const chunk of child.stderr) stderr += new TextDecoder().decode(chunk);
      })();
      try {
        await until(() => stdout.includes('"event":"ready"'));
        const ready = stdout
          .split("\n")
          .filter(Boolean)
          .map((line) => JSON.parse(line))
          .find((event) => event.event === "ready");
        assert.equal(ready.version, expected.version);
        const served = await fetch(new URL("/api/loom/call", ready.url), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ protocol: 1, name: "tasks:list", kind: "query", version: expected.version, args: {} }),
        });
        assert.equal((await served.json()).value.length, 1);
        await scheduleJob(expected.version, new URL(ready.url));
        await writeFile(source, "export default {");
        await until(() => stderr.includes("DEVELOPMENT_UPDATE_FAILED"));
        await writeFile(source, latest);
        await until(() => stdout.split('"event":"ready"').length === 3);
        child.kill("SIGINT");
        assert.equal(await child.exited, 0);
        await Promise.all([output, errors]);
        assert.ok(stdout.includes('"event":"stopped"'));
        assert.ok(!`${stdout}${stderr}`.includes(options.activationToken));
        assert.ok(!`${stdout}${stderr}`.includes("development-fixture-key"));
        await assert.rejects(fetch(ready.url));
      } finally {
        child.kill("SIGKILL");
        await child.exited;
        await Promise.all([output, errors]);
        await providerServer.stop(true);
      }
    } finally {
      delete process.env[tokenEnv];
      await development?.stop();
      await admin.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
      await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
      await rm(root, { recursive: true, force: true });
    }
  },
  90_000,
);
