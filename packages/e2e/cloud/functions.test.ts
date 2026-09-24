import assert from "node:assert/strict";
import { test } from "bun:test";
import { cp, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import * as v from "valibot";
import { createClient, LoomClientError } from "@loom/core/client";
import { createCloudIssuer } from "../fixtures/cloud-issuer";
import { startCloudFrontend } from "../fixtures/cloud-frontend";
import { verifyCloudTasksBrowser } from "../fixtures/cloud-browser";
import { verifyCloudCapacity } from "../fixtures/cloud-capacity";
import { verifyCloudUploads } from "../fixtures/cloud-uploads";
import { cloudLogDiagnostics } from "../fixtures/cloud-diagnostics";
import {
  applyMigrations,
  defineConfig,
  deployProjectRelease,
  inspectDeploymentTarget,
  loadProject,
  NeonFunctionHealthError,
  readMigrations,
  readNeonFunctionReceipt,
} from "@loom/tooling";

const identifier = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9_-]+$/));
test.skipIf(process.env.LOOM_CLOUD_FUNCTIONS !== "1")(
  "selected example deploys real Neon functions with authenticated application acceptance",
  async () => {
    const projectId = v.parse(identifier, process.env.LOOM_CLOUD_PROJECT_ID);
    const branchId = v.parse(identifier, process.env.LOOM_CLOUD_BRANCH_ID);
    assert(process.env.NEON_API_KEY, "Functions acceptance requires an API key");
    const example = v.parse(v.picklist(["tasks", "jobs-storage"]), process.env.LOOM_CLOUD_EXAMPLE ?? "tasks");
    const config = defineConfig({
      project: example === "tasks" ? "tasks" : "upload-catalog",
      database: { namespace: "app" },
      provider: { projectId, targets: { preview: { branchId, protected: false } } },
    });
    const target = await inspectDeploymentTarget(config, "preview");
    assert.match(target.branchName, /^loom-acceptance-/);
    const child = Bun.spawn(
      [
        "npx",
        "--yes",
        "neon@6.0.0",
        "connection-string",
        branchId,
        "--project-id",
        projectId,
        "--role-name",
        "neondb_owner",
        "--ssl",
        "verify-full",
      ],
      { stdout: "pipe", stderr: "pipe", timeout: 30000 },
    );
    const [output, _diagnostics, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    assert.equal(code, 0, "Cloud connection discovery failed");
    const address = new URL(output.trim());
    assert.equal(address.protocol, "postgresql:");
    assert(address.hostname.endsWith(".neon.tech"));
    assert.equal(address.searchParams.get("sslmode"), "verify-full");
    const root = await mkdtemp(join(tmpdir(), "loom-cloud-functions-"));
    const admin = new pg.Client({ connectionString: address.href, connectionTimeoutMillis: 15000 });
    const runtimeRole = `runtime_${crypto.randomUUID().replaceAll("-", "")}`;
    let frontend: ReturnType<typeof startCloudFrontend> | undefined;
    let stage = "copy example";
    try {
      const source = fileURLToPath(new URL(`../../examples/${example}/`, import.meta.url));
      await cp(source, root, {
        recursive: true,
        filter: (path) => !["node_modules", "dist", "_generated", ".loom", ".turbo"].includes(basename(path)),
      });
      await symlink(join(source, "node_modules"), join(root, "node_modules"));
      stage = "deploy test public signing key";
      const issuer = await createCloudIssuer(root, projectId, branchId);
      frontend = startCloudFrontend(root, issuer.token);
      await writeFile(
        join(root, "loom.config.ts"),
        `import { defineConfig } from "@loom/tooling"; export default defineConfig(${JSON.stringify({ ...config, deployment: { environment: "preview", deployment: "preview", databaseName: decodeURIComponent(address.pathname.slice(1)), migrationRole: decodeURIComponent(address.username), runtimeRole, quarantine: "clone", slugs: { service: "loomservice", worker: "loomworker" } }, auth: { issuers: [{ issuer: issuer.issuer, jwksUrl: issuer.jwksUrl }], audience: "loom-acceptance", origins: [frontend.url.origin] } })});`,
      );
      stage = "build copied frontend";
      const build = Bun.spawn(["bun", "run", "build"], {
        cwd: root,
        env: { ...process.env, VITE_LOOM_ACCEPTANCE: "1" },
        stdout: "pipe",
        stderr: "pipe",
        timeout: 60000,
      });
      const [_buildOutput, _buildDiagnostics, buildCode] = await Promise.all([
        new Response(build.stdout).text(),
        new Response(build.stderr).text(),
        build.exited,
      ]);
      assert.equal(buildCode, 0, "Copied frontend build failed");
      const project = await loadProject(root);
      const migrations = await readMigrations(root, project.config.database.migrations);
      const head = migrations.at(-1);
      assert(head);
      stage = "apply committed migration";
      await applyMigrations({
        connectionString: address.href,
        root,
        runtimeRole,
        migrations: project.config.database.migrations,
        namespace: project.config.database.namespace,
      });
      await admin.connect();
      const password = crypto.randomUUID();
      await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD '${password}'`);
      const runtime = new URL(address);
      runtime.username = runtimeRole;
      runtime.password = password;
      stage = "deploy release";
      process.env.LOOM_DATABASE_URL = runtime.href;
      process.env.LOOM_ACTIVATION_TOKEN = crypto.randomUUID().replaceAll("-", "").repeat(2);
      const receipt = await deployProjectRelease(root, "loom.config.ts", undefined, AbortSignal.timeout(240000));
      assert.equal(receipt.completed.at(-1)?.stage, "complete");
      const functions = receipt.completed.find((entry) => entry.stage === "functions");
      assert(functions);
      const deployed = await readNeonFunctionReceipt(root, functions.artifactHash);
      const url = deployed.functions[0].invocationUrl;
      assert(url);
      frontend.bind(url);
      if (example === "jobs-storage") {
        stage = "authorized uploads, storage events and durable processing";
        await verifyCloudUploads(frontend.url.href, url, project.version, issuer.token);
        return;
      }
      stage = "verify public authentication boundary";
      const response = await fetch(new URL("/api/loom/call", url), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ protocol: 1, name: "projects:list", kind: "query", version: project.version, args: {} }),
        signal: AbortSignal.timeout(30000),
      });
      assert.equal(response.status, 401);
      await response.body?.cancel();
      stage = "authorized operations and ownership isolation";
      async function clientFor(subject: string, audience?: string, expiresIn?: string) {
        const token = await issuer.token(subject, audience, expiresIn);
        return createClient({ url: url!, maxAttempts: 1, getAuth: async () => ({ token, identityKey: subject }) });
      }
      const alice = await clientFor("alice");
      const bob = await clientFor("bob");
      const reference = { visibility: "public" as const, version: project.version };
      const projects = { ...reference, name: "projects:list", kind: "query" as const };
      const created = v.parse(
        v.object({ _id: v.string(), name: v.string() }),
        await alice.call({ ...reference, name: "projects:create", kind: "mutation" }, { name: "Neon acceptance" }),
      );
      const taskReference = { ...reference, name: "tasks:create", kind: "mutation" as const };
      const input = { projectId: created._id, title: "Run on real Neon" };
      const task = v.parse(
        v.object({ _id: v.string(), done: v.boolean() }),
        await alice.call(taskReference, input, { idempotencyKey: "cloud-task-create" }),
      );
      const replay = v.parse(
        v.object({ _id: v.string() }),
        await alice.call(taskReference, input, { idempotencyKey: "cloud-task-create" }),
      );
      assert.equal(replay._id, task._id);
      const change = { ...reference, name: "tasks:setDone", kind: "mutation" as const };
      await alice.call(change, { id: task._id, done: true });
      const tasks = v.parse(
        v.array(v.object({ _id: v.string(), done: v.boolean() })),
        await alice.call({ ...reference, name: "tasks:list", kind: "query" }, { projectId: created._id }),
      );
      assert.deepEqual(tasks, [{ _id: task._id, done: true }]);
      assert.deepEqual(await bob.call(projects, {}), []);
      await assert.rejects(
        bob.call(change, { id: task._id, done: false }),
        (error) => error instanceof LoomClientError && error.code === "FORBIDDEN",
      );
      for (const invalid of [await clientFor("alice", "wrong-audience"), await clientFor("alice", undefined, "-1m")])
        await assert.rejects(
          invalid.call(projects, {}),
          (error) => error instanceof LoomClientError && error.code === "UNAUTHENTICATED",
        );
      stage = "browser subscriptions and reconnect";
      await verifyCloudTasksBrowser(frontend.url.href);
      if (process.env.LOOM_CLOUD_CAPACITY === "1") {
        stage = "bounded cloud capacity workload";
        await verifyCloudCapacity({
          frontendUrl: frontend.url.href,
          apiUrl: url,
          version: project.version,
          projectId: created._id,
          token: await issuer.token("alice"),
          database: admin,
          runtimeRole,
        });
      }
    } catch (cause) {
      let storage = "";
      if (stage === "authorized uploads, storage events and durable processing") {
        try {
          const counts = await admin.query<{
            intents: number;
            ready: number;
            receipts: number;
            wakes: number;
            jobs: number;
            completed: number;
            failed: number;
            files: number;
          }>(`
            SELECT (SELECT count(*)::int FROM loom_meta.storage_intents) AS intents,
              (SELECT count(*)::int FROM loom_meta.storage_intents WHERE state='ready') AS ready,
              (SELECT count(*)::int FROM loom_meta.storage_receipts) AS receipts,
              (SELECT count(*)::int FROM loom_meta.trigger_receipts) AS wakes,
              (SELECT count(*)::int FROM loom_meta.jobs) AS jobs,
              (SELECT count(*)::int FROM loom_meta.jobs WHERE state='succeeded') AS completed,
              (SELECT count(*)::int FROM loom_meta.jobs WHERE state='failed') AS failed,
              (SELECT count(*)::int FROM app.files) AS files
          `);
          storage = `; storage counts=${JSON.stringify(counts.rows[0])}`;
          const buckets = await admin.query(`SELECT upload->>'bucket' AS bucket, state, count(*)::int AS count
            FROM loom_meta.storage_intents WHERE upload->>'bucket' IN ('uploads','retry-demo','failure-demo')
            GROUP BY upload->>'bucket', state`);
          storage += `; intent states=${JSON.stringify(buckets.rows)}`;
        } catch {
          storage = "; storage counts unavailable";
        }
        storage += `; function logs=${await cloudLogDiagnostics(projectId, branchId)}`;
      }
      const health =
        cause instanceof NeonFunctionHealthError
          ? `; health stage=${cause.stage}, aborted=${cause.aborted}, status=${cause.status ?? "none"}, mismatch=${cause.identityMismatch ?? "none"}`
          : "";
      const frames =
        cause instanceof Error
          ? cause.stack
              ?.split("\n")
              .filter((line) => /^\s+at .*:\d+:\d+\)?$/.test(line))
              .slice(0, 5)
              .join("\n")
          : undefined;
      throw new Error(
        `Cloud Functions acceptance failed during ${stage}${health}${storage}; provider diagnostics withheld\n${frames ?? ""}`,
      );
    } finally {
      try {
        await frontend?.stop();
      } finally {
        try {
          await admin.end();
        } finally {
          await rm(root, { recursive: true, force: true });
        }
      }
    }
  },
  360000,
);
