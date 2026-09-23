import assert from "node:assert/strict";
import { test } from "bun:test";
import { cp, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import * as v from "valibot";
import {
  applyMigrations,
  defineConfig,
  deployNeonRelease,
  inspectDeploymentTarget,
  loadProject,
  readMigrations,
  readNeonFunctionReceipt,
} from "@loom/tooling";

const identifier = v.pipe(v.string(), v.regex(/^[a-zA-Z0-9_-]+$/));
test.skipIf(process.env.LOOM_CLOUD_FUNCTIONS !== "1")(
  "tasks example deploys real Neon service and worker functions with authenticated ingress",
  async () => {
    const projectId = v.parse(identifier, process.env.LOOM_CLOUD_PROJECT_ID);
    const branchId = v.parse(identifier, process.env.LOOM_CLOUD_BRANCH_ID);
    assert(process.env.NEON_API_KEY, "Functions acceptance requires an API key");
    const config = defineConfig({
      project: "tasks",
      provider: { projectId, targets: { preview: { branchId, protected: false } } },
    });
    const target = await inspectDeploymentTarget(config, "preview");
    assert.match(target.branchName, /^loom-acceptance-/);
    const child = Bun.spawn(
      ["bunx", "neon@6.0.0", "connection-string", branchId, "--project-id", projectId, "--ssl", "verify-full"],
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
    let stage = "copy example";
    try {
      const source = fileURLToPath(new URL("../../examples/tasks/", import.meta.url));
      await cp(source, root, {
        recursive: true,
        filter: (path) => !["node_modules", "dist", "_generated", ".loom", ".turbo"].includes(basename(path)),
      });
      await symlink(join(source, "node_modules"), join(root, "node_modules"));
      await writeFile(
        join(root, "loom.config.ts"),
        `import { defineConfig } from "@loom/tooling"; export default defineConfig(${JSON.stringify(config)});`,
      );
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
      const receipt = await deployNeonRelease(root, {
        releaseKey: crypto.randomUUID().replaceAll("-", "").repeat(2),
        activationToken: crypto.randomUUID().replaceAll("-", "").repeat(2),
        deployment: "preview",
        version: project.version,
        environment: "preview",
        databaseName: decodeURIComponent(address.pathname.slice(1)),
        migrationRole: decodeURIComponent(address.username),
        runtimeRole,
        quarantine: "clone",
        reviewedHashes: [],
        migrationHashes: migrations.map((entry) => entry.plan.hash),
        schema: { minimum: head.plan.after, maximum: head.plan.after, target: head.plan.after },
        slugs: { service: "loomtasks", worker: "loomworker" },
        variables: { LOOM_DATABASE_URL: runtime.href },
        signal: AbortSignal.timeout(240000),
      });
      assert.equal(receipt.completed.at(-1)?.stage, "complete");
      const functions = receipt.completed.find((entry) => entry.stage === "functions");
      assert(functions);
      const deployed = await readNeonFunctionReceipt(root, functions.artifactHash);
      const url = deployed.functions[0].invocationUrl;
      assert(url);
      stage = "verify public authentication boundary";
      const response = await fetch(new URL("/api/loom/call", url), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ protocol: 1, name: "projects:list", kind: "query", version: project.version, args: {} }),
        signal: AbortSignal.timeout(30000),
      });
      assert.equal(response.status, 401);
      await response.body?.cancel();
    } catch (cause) {
      const frames =
        cause instanceof Error
          ? cause.stack
              ?.split("\n")
              .filter((line) => /^\s+at .*:\d+:\d+\)?$/.test(line))
              .slice(0, 5)
              .join("\n")
          : undefined;
      throw new Error(
        `Cloud Functions acceptance failed during ${stage}; provider diagnostics withheld\n${frames ?? ""}`,
      );
    } finally {
      await admin.end();
      await rm(root, { recursive: true, force: true });
    }
  },
  300000,
);
