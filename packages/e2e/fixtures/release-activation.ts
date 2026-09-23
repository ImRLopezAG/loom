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
import {
  initializeProject,
  generateRelease,
  generateCustomRelease,
  loadProject,
  deployNeonRelease,
  deployProjectRelease,
  planProjectRelease,
  inspectNeonFunctionHealth,
  retireNeonReleaseDatabase,
} from "@loom/tooling";

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
let legacyWorkerHealth = false;
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
    if (url.pathname === "/_loom/deployment/health" && role === "worker" && legacyWorkerHealth) {
      return Response.json(
        v.parse(
          v.object({
            format: v.literal(1),
            version: v.string(),
            artifactHash: v.string(),
            role: v.string(),
          }),
          await response.json(),
        ),
      );
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
  const { activationToken: _token, variables: _variables, ...declaration } = options;
  const release = {
    format: 1,
    ...declaration,
    activationTokenEnv: "LOOM_ACTIVATION_TOKEN",
    variables: { LOOM_DATABASE_URL: "LOOM_DATABASE_URL" },
  };
  const releaseFile = join(root, "release.json");
  await writeFile(releaseFile, JSON.stringify({ ...release, activationToken: options.activationToken }));
  await assert.rejects(deployProjectRelease(root, "release.json", provider), /Invalid release declaration/);
  await writeFile(releaseFile, JSON.stringify({ ...release, variables: { LOOM_DATABASE_URL: "UNSET_RELEASE_URL" } }));
  await assert.rejects(deployProjectRelease(root, "release.json", provider), /Missing release environment value/);
  await writeFile(releaseFile, JSON.stringify({ ...release, variables: { LOOM_DATABASE_URL: "NEON_API_KEY" } }));
  await assert.rejects(deployProjectRelease(root, "release.json", provider), /Reserved release environment source/);
  await writeFile(releaseFile, JSON.stringify({ ...release, variables: { DATABASE_URL: "LOOM_DATABASE_URL" } }));
  await assert.rejects(
    deployProjectRelease(root, "release.json", provider),
    /Reserved release environment destination/,
  );
  await writeFile(releaseFile, JSON.stringify({ ...release, version: "f".repeat(64) }));
  await assert.rejects(deployProjectRelease(root, "release.json", provider), /Release source version changed/);
  await writeFile(releaseFile, JSON.stringify({ ...release, activationTokenEnv: "UNSET_RELEASE_TOKEN" }));
  await assert.rejects(deployProjectRelease(root, "release.json", provider), /Missing release environment value/);
  await writeFile(releaseFile, JSON.stringify(release));
  await assert.rejects(deployProjectRelease(root, "../release.json", provider), /escape/);
  await assert.rejects(
    deployProjectRelease(root, "release.json", provider, AbortSignal.abort(new Error("Cancelled release"))),
    /Cancelled release/,
  );
  assert.equal(deploymentId, 0);
  const readOnlyProvider: NeonApi = {
    ...provider,
    deployBranchFunction: async () => {
      throw new Error("Dry run attempted function deployment");
    },
    createBranchBucket: async () => {
      throw new Error("Dry run attempted bucket creation");
    },
    createBranchTrigger: async () => {
      throw new Error("Dry run attempted trigger creation");
    },
    updateBranchTrigger: async () => {
      throw new Error("Dry run attempted trigger update");
    },
  };
  delete process.env.LOOM_ACTIVATION_TOKEN;
  delete process.env.LOOM_DATABASE_URL;
  const initialPlan = await planProjectRelease(root, "release.json", readOnlyProvider);
  assert.equal(initialPlan.dryRun, true);
  assert.deepEqual(initialPlan.blockers, []);
  assert.equal(initialPlan.metadata, "initialize");
  assert.deepEqual(
    initialPlan.migrations.pending.map((entry) => entry.hash),
    [migration.plan.hash],
  );
  assert.deepEqual(
    initialPlan.functions.map((entry) => entry.action),
    ["create", "create"],
  );
  assert.deepEqual(initialPlan.buckets, [{ name: "uploads", action: "create" }]);
  assert.deepEqual(
    initialPlan.triggers.map((entry) => entry.action),
    ["create", "create"],
  );
  assert.equal(
    (await admin.query("SELECT to_regnamespace($1) AS namespace", [metadataNamespace])).rows[0].namespace,
    null,
  );
  await assert.rejects(readFile(join(root, ".loom/releases", options.releaseKey, "release.json")), { code: "ENOENT" });
  assert.deepEqual([functions, triggers, buckets], [[], [], []]);
  buckets.push({ name: "uploads", accessLevel: "public_read" });
  assert.ok(
    (await planProjectRelease(root, "release.json", readOnlyProvider)).blockers.some(
      (entry) => entry.code === "PRIVATE_BUCKET_REQUIRED",
    ),
  );
  buckets.pop();
  triggers.push({
    triggerId: "conflict",
    name: "loom:worker:jobs",
    type: "schedule",
    functionSlug: "someoneelse",
    functionPath: "/",
    enabled: true,
    inherited: false,
    cron: "* * * * *",
    nextRunAt: null,
  });
  assert.ok(
    (await planProjectRelease(root, "release.json", readOnlyProvider)).blockers.some(
      (entry) => entry.code === "TRIGGER_CONFLICT",
    ),
  );
  assert.equal(triggers[0]?.enabled, true);
  triggers.pop();
  process.env.LOOM_ACTIVATION_TOKEN = options.activationToken;
  process.env.LOOM_DATABASE_URL = runtime.href;
  await assert.rejects(deployNeonRelease(root, options, provider), /health verification failed/i);
  assert.equal(deploymentId, 4);
  assert.equal(enableWrites, 0);
  assert.deepEqual((await admin.query(`SELECT state FROM "${metadataNamespace}".deployment_activations`)).rows, [
    { state: "quarantined" },
  ]);
  healthFailure = false;
  healthDrift = true;
  await assert.rejects(deployNeonRelease(root, options, provider), /inconsistent/i);
  assert.ok(
    (await planProjectRelease(root, "release.json", readOnlyProvider)).blockers.some(
      (entry) => entry.code === "DATABASE_INCONSISTENT",
    ),
  );
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
  const completed = await deployProjectRelease(root, "release.json", provider);
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
  const finalFunctions = completed.completed.find((stage) => stage.stage === "functions");
  assert.ok(finalFunctions);
  const drainHealth = await inspectNeonFunctionHealth(
    root,
    {
      config: project.config,
      environment: options.environment,
      artifactHash: finalFunctions.artifactHash,
      activationToken: options.activationToken,
    },
    provider,
  );
  assert.deepEqual(
    drainHealth.functions.map((fn) => fn.databaseDrainProtocol),
    [1, 1],
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
  assert.deepEqual(await deployProjectRelease(root, "release.json", provider), completed);
  assert.equal(deploymentId, 4);
  assert.equal(enableWrites, 3);
  const retainedDeclaration = {
    ...release,
    releaseKey: "f".repeat(64),
    retainedReleaseKey: release.releaseKey,
    quarantine: "preserve",
  };
  await writeFile(join(root, "rollback.json"), JSON.stringify(retainedDeclaration));
  const rollbackPlan = await planProjectRelease(root, "rollback.json", readOnlyProvider);
  assert.deepEqual(rollbackPlan.blockers, []);
  assert.deepEqual(rollbackPlan.disableTriggerIds, []);
  assert.deepEqual(rollbackPlan.functionPasses, { bootstrap: "skip", final: "verify" });
  await admin.query(`UPDATE "${metadataNamespace}".deployment_activations SET state='quarantined' WHERE version=$1`, [
    project.version,
  ]);
  assert.ok(
    (await planProjectRelease(root, "rollback.json", readOnlyProvider)).blockers.some(
      (entry) => entry.code === "RETAINED_RUNTIME_INACTIVE",
    ),
  );
  await admin.query(`UPDATE "${metadataNamespace}".deployment_activations SET state='active' WHERE version=$1`, [
    project.version,
  ]);

  healthFailure = true;
  await assert.rejects(deployProjectRelease(root, "rollback.json", provider), /health verification failed/i);
  assert.deepEqual(
    (await admin.query(`SELECT release_key FROM "${metadataNamespace}".release_ingress WHERE state='current'`)).rows,
    [{ release_key: release.releaseKey }],
  );
  healthFailure = false;
  const restored = await deployProjectRelease(root, "rollback.json", provider);
  assert.equal(restored.completed.at(-1)?.stage, "complete");
  assert.equal(deploymentId, 4);
  assert.equal(enableWrites, 3);
  assert.deepEqual(await client.call(reference, {}), ["deployed"]);
  assert.deepEqual(await deployProjectRelease(root, "rollback.json", provider), restored);
  await assert.rejects(deployProjectRelease(root, "release.json", provider), /superseded/);
  // Restore the fixture's original claim for the independent planner fault-injection cases below.
  await admin.query(`UPDATE "${metadataNamespace}".release_ingress SET state='retired'`);
  await admin.query(`UPDATE "${metadataNamespace}".release_ingress SET state='current' WHERE release_key=$1`, [
    release.releaseKey,
  ]);
  healthFailure = true;
  const beforePlan = await readFile(receiptPath, "utf8");
  const providerBeforePlan = JSON.stringify({ functions, triggers, buckets });
  const resumedPlan = await planProjectRelease(root, "release.json", readOnlyProvider);
  assert.deepEqual(resumedPlan.blockers, []);
  assert.deepEqual(resumedPlan.ingressHandoff, { retainedWorkers: [], disableTriggerIds: [] });
  await admin.query(`UPDATE "${metadataNamespace}".release_ingress SET state='retired'`);
  assert.ok(
    (await planProjectRelease(root, "release.json", readOnlyProvider)).blockers.some(
      (entry) => entry.code === "RELEASE_SUPERSEDED",
    ),
  );
  await assert.rejects(deployProjectRelease(root, "release.json", provider), /superseded/);
  await admin.query(`UPDATE "${metadataNamespace}".release_ingress SET state='current' WHERE release_key=$1`, [
    release.releaseKey,
  ]);

  assert.deepEqual(resumedPlan.migrations.pending, []);
  assert.deepEqual(
    resumedPlan.functions.map((entry) => entry.action),
    ["verify", "verify"],
  );
  assert.deepEqual(
    resumedPlan.triggers.map((entry) => entry.action),
    ["verify", "verify"],
  );
  assert.equal(resumedPlan.acknowledgedStages.at(-1), "complete");
  assert.equal(await readFile(receiptPath, "utf8"), beforePlan);
  assert.equal(JSON.stringify({ functions, triggers, buckets }), providerBeforePlan);
  assert.deepEqual((await admin.query(`SELECT state FROM "${metadataNamespace}".jobs`)).rows, [{ state: "pending" }]);
  assert.ok(!JSON.stringify(resumedPlan).includes(options.activationToken));
  assert.ok(!JSON.stringify(resumedPlan).includes("loom-test-only"));
  await writeFile(releaseFile, JSON.stringify({ ...release, deployment: "other" }));
  const ownershipBeforePlan = (
    await admin.query(`SELECT * FROM "${metadataNamespace}".function_ownership ORDER BY slug`)
  ).rows;
  assert.ok(
    (await planProjectRelease(root, "release.json", readOnlyProvider)).blockers.some(
      (entry) => entry.code === "FUNCTION_NAMES_RESERVED",
    ),
  );
  assert.deepEqual(
    (await admin.query(`SELECT * FROM "${metadataNamespace}".function_ownership ORDER BY slug`)).rows,
    ownershipBeforePlan,
  );

  assert.ok(
    (await planProjectRelease(root, "release.json", readOnlyProvider)).blockers.some(
      (entry) => entry.code === "RECEIPT_IDENTITY_CHANGED",
    ),
  );
  await writeFile(releaseFile, JSON.stringify(release));
  const savedFunction = functions[0];
  assert.ok(savedFunction);
  const activeId = savedFunction.activeDeploymentId;
  assert.ok(activeId);
  savedFunction.activeDeploymentId = 999;
  assert.ok(
    (await planProjectRelease(root, "release.json", readOnlyProvider)).blockers.some(
      (entry) => entry.code === "FUNCTION_IDENTITY_CHANGED",
    ),
  );
  savedFunction.activeDeploymentId = activeId;
  const savedTrigger = triggers[0];
  assert.ok(savedTrigger);
  const savedPath = savedTrigger.functionPath;
  savedTrigger.functionPath = "/changed";
  assert.ok(
    (await planProjectRelease(root, "release.json", readOnlyProvider)).blockers.some(
      (entry) => entry.code === "TRIGGER_CONFLICT",
    ),
  );
  savedTrigger.functionPath = savedPath;
  await writeFile(releaseFile, JSON.stringify({ ...release, releaseKey: "d".repeat(64) }));
  const clonePlan = await planProjectRelease(root, "release.json", readOnlyProvider);
  assert.ok(clonePlan.blockers.some((entry) => entry.code === "ACTIVE_BRANCH_QUARANTINE"));
  assert.deepEqual(clonePlan.quarantine.observed, { activeGrants: "1", pendingJobs: "1" });
  await admin.query(`UPDATE "${metadataNamespace}".deployment_activations SET project_id = 'copied-project'`);
  await writeFile(releaseFile, JSON.stringify({ ...release, releaseKey: "d".repeat(64), quarantine: "preserve" }));
  assert.ok(
    (await planProjectRelease(root, "release.json", readOnlyProvider)).blockers.some(
      (entry) => entry.code === "QUARANTINE_REQUIRED",
    ),
  );
  assert.deepEqual((await admin.query(`SELECT state FROM "${metadataNamespace}".jobs`)).rows, [{ state: "pending" }]);
  await admin.query(`UPDATE "${metadataNamespace}".deployment_activations SET project_id = 'project'`);
  await writeFile(releaseFile, JSON.stringify(release));
  await assert.rejects(deployNeonRelease(root, options, provider), /health verification failed/i);
  assert.equal(deploymentId, 4);
  assert.equal(enableWrites, 3);
  await writeFile(join(root, "backfill.sql"), `UPDATE "${namespace}".tasks SET title = 'planned-not-applied'`);
  const custom = await generateCustomRelease(root, "backfill", "backfill.sql", "transactional");
  const expanded = {
    ...release,
    releaseKey: "e".repeat(64),
    quarantine: "preserve",
    migrationHashes: [...release.migrationHashes, custom.plan.hash],
  };
  await writeFile(releaseFile, JSON.stringify(expanded));
  const unreviewed = await planProjectRelease(root, "release.json", readOnlyProvider);
  assert.ok(unreviewed.blockers.some((entry) => entry.code === "INCOMPATIBLE_RUNTIME"));
  const compatibilityBefore = (
    await admin.query(`SELECT * FROM "${metadataNamespace}".runtime_compatibility ORDER BY deployment,version`)
  ).rows;
  await admin.query(`UPDATE "${metadataNamespace}".jobs SET state='succeeded' WHERE state='pending'`);
  const compatiblePlan = await planProjectRelease(root, "release.json", readOnlyProvider);
  assert.ok(!compatiblePlan.blockers.some((entry) => entry.code === "INCOMPATIBLE_RUNTIME"));
  assert.deepEqual(
    (await admin.query(`SELECT * FROM "${metadataNamespace}".runtime_compatibility ORDER BY deployment,version`)).rows,
    compatibilityBefore,
  );
  await admin.query(`UPDATE "${metadataNamespace}".jobs SET state='pending' WHERE deduplication_key='keep'`);
  assert.ok(
    unreviewed.blockers.some((entry) => entry.code === "REVIEW_REQUIRED" && entry.resource === custom.plan.hash),
  );
  assert.equal(unreviewed.migrations.pending[0]?.reviewRequired, true);
  await writeFile(releaseFile, JSON.stringify({ ...expanded, reviewedHashes: [custom.plan.hash] }));
  assert.equal(
    (await planProjectRelease(root, "release.json", readOnlyProvider)).migrations.pending[0]?.reviewRequired,
    false,
  );
  await writeFile(join(root, "index.sql"), `CREATE INDEX CONCURRENTLY task_title ON "${namespace}".tasks(title)`);
  const concurrent = await generateCustomRelease(root, "index", "index.sql", "nontransactional");
  await writeFile(
    releaseFile,
    JSON.stringify({
      ...expanded,
      migrationHashes: [...expanded.migrationHashes, concurrent.plan.hash],
      reviewedHashes: [custom.plan.hash, concurrent.plan.hash],
    }),
  );
  assert.ok(
    (await planProjectRelease(root, "release.json", readOnlyProvider)).blockers.some(
      (entry) => entry.code === "NONTRANSACTIONAL_MIGRATION",
    ),
  );
  const retirement = {
    config: project.config,
    environment: options.environment,
    databaseName: options.databaseName,
    migrationRole,
    releaseKey: release.releaseKey,
    activationToken: options.activationToken,
  };
  await assert.rejects(
    retireNeonReleaseDatabase(root, { ...retirement, releaseKey: "8".repeat(64) }, provider),
    /completed release/i,
  );
  await assert.rejects(
    retireNeonReleaseDatabase(
      root,
      {
        ...retirement,
        config: { ...project.config, database: { ...project.config.database, namespace: "unrelated" } },
      },
      provider,
    ),
    /target differs/i,
  );
  healthFailure = false;
  await assert.rejects(retireNeonReleaseDatabase(root, retirement, provider), /ingress/i);
  await admin.query(`UPDATE "${metadataNamespace}".release_ingress SET state='retired'`);
  await assert.rejects(retireNeonReleaseDatabase(root, retirement, provider), /jobs/i);
  await admin.query(
    `UPDATE "${metadataNamespace}".jobs SET call=jsonb_build_object('version',$1::text),state='running',lease_owner='retirement-test',lease_expires_at=clock_timestamp()+interval '1 minute' WHERE state='pending'`,
    [project.version],
  );
  await assert.rejects(retireNeonReleaseDatabase(root, retirement, provider), /jobs/i);
  await admin.query(
    `UPDATE "${metadataNamespace}".jobs SET state='pending',lease_owner=NULL,lease_expires_at=NULL WHERE state='running'`,
  );
  await admin.query(`UPDATE "${metadataNamespace}".jobs SET state='succeeded' WHERE state='pending'`);
  await admin.query(
    `INSERT INTO "${metadataNamespace}".client_sessions(namespace,deployment,version,ticket_hash,expires_at)
    VALUES ($1,$2,$3,repeat('9',64),clock_timestamp()+interval '1 hour')`,
    [namespace, options.deployment, project.version],
  );
  await assert.rejects(retireNeonReleaseDatabase(root, retirement, provider), /sessions/i);
  await admin.query(
    `UPDATE "${metadataNamespace}".client_sessions SET expires_at=clock_timestamp()-interval '1 second'`,
  );
  await assert.rejects(
    retireNeonReleaseDatabase(root, { ...retirement, activationToken: "0".repeat(64) }, provider),
    /grant/i,
  );
  await assert.rejects(
    retireNeonReleaseDatabase(root, { ...retirement, signal: AbortSignal.abort() }, provider),
    /aborted/i,
  );
  legacyWorkerHealth = true;
  await assert.rejects(retireNeonReleaseDatabase(root, retirement, provider), /drain support/i);
  legacyWorkerHealth = false;
  healthFailure = true;
  await assert.rejects(retireNeonReleaseDatabase(root, retirement, provider), /health verification failed/i);
  healthFailure = false;
  await admin.query(
    `ALTER TABLE "${metadataNamespace}".deployment_activations ADD CONSTRAINT refuse_retirement CHECK (state<>'retired')`,
  );
  try {
    await assert.rejects(retireNeonReleaseDatabase(root, retirement, provider), /refuse_retirement/);
  } finally {
    await admin.query(`ALTER TABLE "${metadataNamespace}".deployment_activations DROP CONSTRAINT refuse_retirement`);
  }
  await admin.query("BEGIN");
  await admin.query(`LOCK TABLE "${metadataNamespace}".deployment_activations IN ACCESS SHARE MODE`);
  try {
    await assert.rejects(retireNeonReleaseDatabase(root, retirement, provider), /drain/i);
  } finally {
    await admin.query("ROLLBACK");
  }
  assert.deepEqual((await admin.query(`SELECT state FROM "${metadataNamespace}".deployment_activations`)).rows, [
    { state: "active" },
  ]);
  await admin.query("SELECT pg_advisory_lock(hashtextextended($1,0))", [`loom:migrations:${namespace}`]);
  try {
    await assert.rejects(
      retireNeonReleaseDatabase(root, { ...retirement, signal: AbortSignal.timeout(100) }, provider),
      /aborted|timeout/i,
    );
  } finally {
    await admin.query("SELECT pg_advisory_unlock(hashtextextended($1,0))", [`loom:migrations:${namespace}`]);
  }
  const retired = await retireNeonReleaseDatabase(root, retirement, provider);
  assert.equal(retired.state, "retired");
  healthFailure = true;
  assert.deepEqual(await retireNeonReleaseDatabase(root, retirement, provider), retired);
  assert.equal(await readFile(receiptPath, "utf8"), beforePlan);
  assert.equal(deploymentId, 4);
  assert.equal(enableWrites, 3);
  await assert.rejects(client.call(reference, {}));

  assert.ok(
    (await planProjectRelease(root, "release.json", readOnlyProvider)).blockers.some(
      (entry) => entry.code === "RUNTIME_RETIRED",
    ),
  );
  assert.deepEqual((await admin.query(`SELECT state FROM "${metadataNamespace}".deployment_activations`)).rows, [
    { state: "retired" },
  ]);
  assert.deepEqual((await admin.query(`SELECT title FROM "${namespace}".tasks`)).rows, [{ title: "deployed" }]);
  assert.equal((await admin.query("SELECT to_regclass($1) AS index", [`${namespace}.task_title`])).rows[0].index, null);
} finally {
  await Promise.all([...apps.values()].map((app) => app.stop()));
  await server.stop(true);
  await admin.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
  await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
  await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
  await admin.end();
}
