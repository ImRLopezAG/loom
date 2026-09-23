import assert from "node:assert/strict";
import { mkdir, realpath, symlink, writeFile, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { unzipSync } from "fflate";
import pg from "pg";
import * as v from "valibot";
import { createRealNeonApi } from "@neon/config-runtime/v1";
import type { NeonApi } from "@neon/config-runtime/v1";
import type { NeonEntrypointApplication } from "@loom/core/neon";
import { createClient } from "@loom/core/client";
import type { FunctionReference } from "@loom/core/client";
import { initializeProject, generateRelease, loadProject, deployNeonRelease } from "@loom/tooling";

const [root, certificate, key] = process.argv.slice(2);
const connectionString = process.env.LOOM_TEST_DATABASE_URL;
if (!root || !certificate || !key || !connectionString) throw new Error("Missing fixture inputs");
const suffix = crypto.randomUUID().replaceAll("-", "");
const namespace = `app_${suffix}`;
const metadataNamespace = `loom_${suffix}`;
const runtimeRole = `runtime_${suffix}`;
const admin = new pg.Client({ connectionString });
await admin.connect();
const runtime = new URL(connectionString);
const migrationRole = decodeURIComponent(runtime.username);
runtime.username = runtimeRole;
runtime.password = "loom-test-only";
const apps = new Map<string, NeonEntrypointApplication>();
const functions: Awaited<ReturnType<NeonApi["listBranchFunctions"]>> = [];
const triggers: Awaited<ReturnType<NeonApi["listBranchTriggers"]>> = [];
const buckets: Awaited<ReturnType<NeonApi["listBranchBuckets"]>> = [];
let healthFailure = true;
let healthDrift = false;
let healthTriggerDrift = false;
let healthRoleDrift = false;
let triggerFailure = true;
let deploymentId = 0;
let enableWrites = 0;
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  tls: { cert: await readFile(certificate), key: await readFile(key) },
  async fetch(request) {
    const url = new URL(request.url);
    const role = url.pathname.split("/")[1] ?? "";
    const app = apps.get(role);
    if (!app) return new Response("Not found", { status: 404 });
    url.pathname = url.pathname.slice(role.length + 1);
    if (url.pathname === "/_loom/deployment/health" && healthFailure)
      return new Response("Unavailable", { status: 503 });
    const response = await app.fetch(new Request(url, request));
    if (url.pathname === "/_loom/deployment/health" && role === "worker" && healthDrift) {
      healthDrift = false;
      await admin.query(`ALTER TABLE "${namespace}".tasks ADD COLUMN external_change text`);
    }
    if (url.pathname === "/_loom/deployment/health" && role === "worker" && healthTriggerDrift) {
      healthTriggerDrift = false;
      const trigger = triggers.find((entry) => entry.type === "schedule");
      assert.ok(trigger);
      trigger.cron = "0 * * * *";
    }
    if (url.pathname === "/_loom/deployment/health" && role === "worker" && healthRoleDrift) {
      healthRoleDrift = false;
      await admin.query(`ALTER ROLE "${runtimeRole}" BYPASSRLS`);
    }
    return response;
  },
});
const provider: NeonApi = {
  ...createRealNeonApi({ apiKey: "fixture", baseUrl: "http://127.0.0.1:1" }),
  getProject: async () => ({ id: "project", name: "test", regionId: "aws-us-east-2", pgVersion: 18 }),
  listBranches: async () => [{ id: "br-preview", name: "preview", protected: false, isDefault: false }],
  listEndpoints: async () => [
    {
      id: runtime.hostname.split(".")[0] ?? "",
      branchId: "br-preview",
      type: "read_write",
      autoscalingLimitMinCu: 0.25,
      autoscalingLimitMaxCu: 1,
      suspendTimeout: 300,
    },
  ],
  getConnectionUri: async () => ({ uri: connectionString }),
  listBranchFunctions: async () => structuredClone(functions),
  listBranchBuckets: async () => structuredClone(buckets),
  createBranchBucket: async (_project, _branch, input) => {
    const bucket = { name: input.name, accessLevel: input.accessLevel ?? "private" };
    buckets.push(bucket);
    return bucket;
  },
  listBranchTriggers: async () => structuredClone(triggers),
  createBranchTrigger: async (_project, _branch, input) => {
    if (input.type !== "schedule" && input.type !== "storage_object_created") throw new Error("Unexpected trigger");
    const trigger = {
      ...input,
      functionPath: input.functionPath ?? "/",
      enabled: input.enabled ?? true,
      triggerId: crypto.randomUUID(),
      inherited: false,
      nextRunAt: null,
    };
    triggers.push(trigger);
    return trigger;
  },
  updateBranchTrigger: async (_project, _branch, id, input) => {
    const trigger = triggers.find((entry) => entry.triggerId === id);
    assert.ok(trigger);
    assert.equal(input.enabled, true);
    assert.deepEqual((await admin.query(`SELECT state FROM "${metadataNamespace}".deployment_activations`)).rows, [
      { state: "active" },
    ]);
    enableWrites++;
    if (enableWrites === 2 && triggerFailure) throw new Error("Interrupted trigger enablement");
    trigger.enabled = true;
    return trigger;
  },
  deployBranchFunction: async (_project, _branch, slug, input) => {
    assert.deepEqual((await admin.query(`SELECT state FROM "${metadataNamespace}".deployment_activations`)).rows, [
      { state: "quarantined" },
    ]);
    const id = ++deploymentId;
    const directory = join(root, "packed", String(id));
    for (const [filename, contents] of Object.entries(unzipSync(input.bundle))) {
      const destination = join(directory, filename);
      await mkdir(dirname(destination), { recursive: true });
      await writeFile(destination, contents);
    }
    const loaded = v.parse(
      v.object({
        default: v.custom<NeonEntrypointApplication>((value) =>
          v.is(v.object({ fetch: v.function(), stop: v.function() }), value),
        ),
      }),
      await import(pathToFileURL(join(directory, "index.mjs")).href),
    );
    await apps.get(slug)?.stop();
    apps.set(slug, loaded.default);
    const deployment = { id, status: "completed" as const };
    const fn = {
      id: `fn-${slug}`,
      name: slug,
      slug,
      invocationUrl: new URL(slug, server.url).href,
      activeDeploymentId: id,
      currentDeployment: deployment,
    };
    const index = functions.findIndex((entry) => entry.slug === slug);
    if (index === -1) functions.push(fn);
    else functions[index] = fn;
    return deployment;
  },
};
try {
  await admin.query(`CREATE ROLE "${runtimeRole}" LOGIN PASSWORD 'loom-test-only' NOINHERIT`);
  await initializeProject(root, "release");
  await writeFile(
    join(root, "backend/auth.ts"),
    'import { defineAuth } from "@loom/core/server"; export default defineAuth({ allowAnonymous: true, authorize: ({ name }) => { if (name !== "tasks:list") throw new Error("Denied"); } });',
  );
  await mkdir(join(root, "node_modules/@loom"), { recursive: true });
  for (const name of ["@loom/core", "@loom/tooling", "valibot", "drizzle-orm"])
    await symlink(
      await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
      join(root, "node_modules", name),
    );
  await writeFile(
    join(root, "loom.config.ts"),
    `import { defineConfig } from "@loom/tooling"; export default defineConfig(${JSON.stringify({ project: "release", database: { namespace, metadataNamespace }, provider: { projectId: "project", targets: { preview: { branchId: "br-preview" } } } })});`,
  );
  await writeFile(
    join(root, "backend/storage.ts"),
    'import { defineStorage } from "@loom/core/server"; export default defineStorage({ buckets: { uploads: {} } });',
  );
  const schemaFile = join(root, "backend/schema.ts");
  await writeFile(
    schemaFile,
    (await readFile(schemaFile, "utf8")).replace('namespace: "app"', `namespace: "${namespace}"`),
  );
  const migration = await generateRelease(root, "initial");
  const project = await loadProject(root);
  const options = {
    releaseKey: "a".repeat(64),
    deployment: "preview",
    version: project.version,
    activationToken: "c".repeat(64),
    environment: "preview" as const,
    databaseName: decodeURIComponent(runtime.pathname.slice(1)),
    migrationRole,
    runtimeRole,
    quarantine: "clone" as const,
    reviewedHashes: [],
    migrationHashes: [migration.plan.hash],
    schema: { minimum: migration.plan.after, maximum: migration.plan.after, target: migration.plan.after },
    slugs: { service: "service", worker: "worker" },
    variables: { LOOM_DATABASE_URL: runtime.href },
  };
  Object.assign(process.env, {
    LOOM_DATABASE_URL: runtime.href,
    DATABASE_URL: runtime.href,
    NEON_BRANCH: "preview",
    LOOM_ACTIVATION_TOKEN: options.activationToken,
    AWS_ACCESS_KEY_ID: "fixture",
    AWS_SECRET_ACCESS_KEY: "fixture",
    AWS_ENDPOINT_URL_S3: "https://br-preview.storage.c-1.us-east-2.aws.neon.tech",
    AWS_REGION: "us-east-2",
  });
  await assert.rejects(deployNeonRelease(root, options, provider), /health verification failed/i);
  assert.equal(deploymentId, 4);
  assert.equal(enableWrites, 0);
  assert.deepEqual((await admin.query(`SELECT state FROM "${metadataNamespace}".deployment_activations`)).rows, [
    { state: "quarantined" },
  ]);
  healthFailure = false;
  healthDrift = true;
  await assert.rejects(deployNeonRelease(root, options, provider), /inconsistent/i);
  assert.equal(enableWrites, 0);
  assert.deepEqual((await admin.query(`SELECT state FROM "${metadataNamespace}".deployment_activations`)).rows, [
    { state: "quarantined" },
  ]);
  await admin.query(`ALTER TABLE "${namespace}".tasks DROP COLUMN external_change`);
  healthRoleDrift = true;
  await assert.rejects(deployNeonRelease(root, options, provider), /Runtime database preflight failed/);
  assert.equal(enableWrites, 0);
  await admin.query(`ALTER ROLE "${runtimeRole}" NOBYPASSRLS`);
  healthTriggerDrift = true;
  await assert.rejects(deployNeonRelease(root, options, provider), /Trigger activation incomplete/);
  assert.equal(enableWrites, 0);
  assert.deepEqual((await admin.query(`SELECT state FROM "${metadataNamespace}".deployment_activations`)).rows, [
    { state: "quarantined" },
  ]);
  const schedule = triggers.find((entry) => entry.type === "schedule");
  assert.ok(schedule);
  schedule.cron = "* * * * *";
  await assert.rejects(deployNeonRelease(root, options, provider), /Trigger activation incomplete/);
  assert.equal(triggers.filter((entry) => entry.enabled).length, 1);
  const receiptPath = join(root, ".loom/releases", options.releaseKey, "release.json");
  const saved = v.parse(
    v.looseObject({ completed: v.array(v.looseObject({ stage: v.string() })) }),
    JSON.parse(await readFile(receiptPath, "utf8")),
  );
  assert.equal(saved.completed.at(-1)?.stage, "activated");
  saved.completed = saved.completed.slice(0, -1);
  await writeFile(receiptPath, JSON.stringify(saved));
  await admin.query(
    `INSERT INTO "${metadataNamespace}".jobs (id, deployment, deduplication_key, fingerprint, call, identity, due_at, max_attempts, retry_delay_seconds) VALUES (uuidv7(), 'preview', 'keep', repeat('a', 64), '{}', '{}', now(), 1, 0)`,
  );
  triggerFailure = false;
  const completed = await deployNeonRelease(root, options, provider);
  assert.deepEqual(
    completed.completed.map((stage) => stage.stage),
    [
      "metadata",
      "quarantine",
      "migrations",
      "prepared",
      "bootstrap",
      "triggers",
      "functions",
      "health",
      "activated",
      "complete",
    ],
  );
  assert.equal(deploymentId, 4);
  assert.equal(enableWrites, 3);
  assert.ok(triggers.every((entry) => entry.enabled));
  assert.deepEqual((await admin.query(`SELECT state FROM "${metadataNamespace}".jobs`)).rows, [{ state: "pending" }]);
  await admin.query(`INSERT INTO "${namespace}".tasks (title) VALUES ('deployed')`);
  const client = createClient({ url: new URL("service", server.url).href });
  const reference: FunctionReference<"query", "public", Record<string, never>, string[]> = {
    name: "tasks:list",
    kind: "query",
    visibility: "public",
    version: project.version,
  };
  assert.deepEqual(await client.call(reference, {}), ["deployed"]);
  assert.deepEqual(await deployNeonRelease(root, options, provider), completed);
  assert.equal(deploymentId, 4);
  assert.equal(enableWrites, 3);
  healthFailure = true;
  await assert.rejects(deployNeonRelease(root, options, provider), /health verification failed/i);
  assert.equal(deploymentId, 4);
  assert.equal(enableWrites, 3);
} finally {
  await Promise.all([...apps.values()].map((app) => app.stop()));
  await server.stop(true);
  await admin.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
  await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
  await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
  await admin.end();
}
