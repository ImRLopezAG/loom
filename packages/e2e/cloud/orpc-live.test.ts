import assert from "node:assert/strict";
import { test } from "bun:test";
import { cp, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";
import pg from "pg";
import * as v from "valibot";
import { chromium } from "playwright";
import { createNeonApiFromOptions } from "@neon/config-runtime/v1";
import {
  applyMigrations,
  defineConfig,
  deployProjectRelease,
  generateProject,
  inspectDeploymentTarget,
} from "@loom/tooling";
import { createCloudIssuer } from "../fixtures/cloud-issuer";
import { deployLiveServices } from "../fixtures/cloud-live-services";
import type { LiveObservation } from "../fixtures/cloud-live-browser";

const metricSchema = v.object({
  instance: v.string(),
  subscriptions: v.number(),
  evaluating: v.number(),
  queued: v.number(),
  peakEvaluating: v.number(),
  peakQueued: v.number(),
  listener: v.string(),
  reconnects: v.number(),
  heapUsed: v.number(),
  pool: v.object({ total: v.number(), idle: v.number(), waiting: v.number() }),
});
const observationSchema = v.object({ index: v.number(), sequence: v.number() });

test.skipIf(process.env.LOOM_CLOUD_LIVE !== "1")(
  "two Neon Functions observe SQL commits and recover listeners",
  async () => {
    const projectId = process.env.LOOM_CLOUD_PROJECT_ID;
    const branchId = process.env.LOOM_CLOUD_BRANCH_ID;
    const connectionString = process.env.LOOM_MIGRATION_DATABASE_URL;
    const apiKey = process.env.NEON_API_KEY;
    const runtimeRole = process.env.LOOM_CLOUD_RUNTIME_ROLE;
    assert(projectId && branchId && connectionString && apiKey && runtimeRole);
    assert.match(runtimeRole, /^runtime_[a-f0-9]{32}$/);
    const mode = v.parse(v.picklist(["notify", "polling"]), process.env.LOOM_CLOUD_LIVE_MODE ?? "notify");
    const seconds = v.parse(
      v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(600)),
      Number(process.env.LOOM_CLOUD_LIVE_SECONDS ?? "600"),
    );
    const provider = createNeonApiFromOptions("Loom native live acceptance", { apiKey });
    const target = await inspectDeploymentTarget(
      defineConfig({ project: "tasks", provider: { projectId, targets: { preview: { branchId } } } }),
      "preview",
    );
    assert.match(target.branchName, /^loom-acceptance-/);
    const root = await mkdtemp(join(tmpdir(), "loom-cloud-live-"));
    const admin = new pg.Client({ connectionString, connectionTimeoutMillis: 15000 });
    const frontend = Bun.serve({
      hostname: "127.0.0.1",
      port: 0,
      fetch(request) {
        if (new URL(request.url).pathname === "/live.js") return new Response(Bun.file(join(root, "live.js")));
        return new Response('<!doctype html><script type="module" src="/live.js"></script>', {
          headers: { "content-type": "text/html" },
        });
      },
    });
    const browser = await chromium.launch({ headless: true });
    let stage = "prepare";
    type BrowserStatus = ReturnType<Window["loomLive"]["status"]> | { unavailable: true };
    interface Diagnostics {
      browser?: BrowserStatus;
      initial?: v.InferOutput<typeof metricSchema>[];
    }
    const diagnostics: Diagnostics = {};
    let browserStatus = async (): Promise<BrowserStatus> => ({ unavailable: true });
    try {
      const source = fileURLToPath(new URL("../../examples/tasks/", import.meta.url));
      await cp(source, root, {
        recursive: true,
        filter: (path) => !["node_modules", "dist", "_generated", ".loom", ".turbo"].includes(basename(path)),
      });
      await symlink(join(source, "node_modules"), join(root, "node_modules"));
      stage = "issuer";
      const issuer = await createCloudIssuer(root, projectId, branchId);
      const address = new URL(connectionString);
      await writeFile(
        join(root, "loom.config.ts"),
        `import { defineConfig } from "@loom/tooling"; export default defineConfig(${JSON.stringify({
          project: "tasks",
          provider: { projectId, targets: { preview: { branchId } } },
          realtime: { mode, pollIntervalMs: 1000, maxSubscriptions: 100 },
          auth: {
            origins: [frontend.url.origin],
            audience: "loom-acceptance",
            issuers: [{ issuer: issuer.issuer, jwksUrl: issuer.jwksUrl }],
          },
          deployment: {
            environment: "preview",
            deployment: "preview",
            databaseName: decodeURIComponent(address.pathname.slice(1)),
            migrationRole: decodeURIComponent(address.username),
            runtimeRole,
            quarantine: "preserve",
          },
        })});`,
      );
      await cp(
        fileURLToPath(new URL("../fixtures/cloud-live-metrics.ts", import.meta.url)),
        join(root, "loom/acceptance-metrics.ts"),
      );
      await writeFile(
        join(root, "loom/functions/acceptance.ts"),
        `import { procedure } from "../_generated/server"; import { clientMode } from "@loom/core/server"; import { readMetrics } from "../acceptance-metrics"; export const metrics = procedure.meta(clientMode("finite")).handler(() => readMetrics());`,
      );
      const generated = await generateProject(root);
      await applyMigrations({ connectionString, root, runtimeRole, namespace: "app", migrations: "loom/migrations" });
      await admin.connect();
      const password = crypto.randomUUID();
      await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD '${password}'`);
      address.username = runtimeRole;
      address.password = password;
      process.env.LOOM_DATABASE_URL = address.href;
      process.env.LOOM_DIRECT_DATABASE_URL = address.href;
      process.env.LOOM_ACTIVATION_TOKEN = crypto.randomUUID().replaceAll("-", "").repeat(2);
      stage = "deploy";
      const release = await deployProjectRelease(root, "loom.config.ts", provider, AbortSignal.timeout(240000));
      const functions = release.completed.find((entry) => entry.stage === "functions");
      assert(functions);
      const services = await deployLiveServices({
        root,
        artifactHash: functions.artifactHash,
        projectId,
        branchId,
        provider,
        environment: {
          LOOM_DATABASE_URL: address.href,
          LOOM_DIRECT_DATABASE_URL: address.href,
          LOOM_ACTIVATION_TOKEN: process.env.LOOM_ACTIVATION_TOKEN,
        },
      });
      assert.equal(new Set(services.map((service) => service.functionId)).size, 2);
      stage = "seed";
      const projects = await admin.query<{ _id: string }>(
        `INSERT INTO app.projects(name,owner_issuer,owner_id) SELECT 'live-'||i,$1,'live-load' FROM generate_series(1,100) i RETURNING _id`,
        [issuer.issuer],
      );
      const ids = projects.rows.map((row) => row._id);
      await admin.query(`INSERT INTO app.tasks(project_id,title) SELECT unnest($1::uuid[]),'0'`, [ids]);
      const build = await Bun.build({
        entrypoints: [fileURLToPath(new URL("../fixtures/cloud-live-browser.ts", import.meta.url))],
        target: "browser",
        minify: true,
      });
      assert(build.success);
      assert(build.outputs[0]);
      await Bun.write(join(root, "live.js"), build.outputs[0]);
      const page = await browser.newPage();
      browserStatus = () => page.evaluate(() => window.loomLive.status());
      async function metrics() {
        return v.parse(v.array(metricSchema), await page.evaluate(() => window.loomLive.metrics()));
      }
      const arrivals = new Map<number, number>();
      const commits = new Map<number, { started: number; acknowledged: number }>();
      await page.exposeFunction("loomObserved", (value: LiveObservation) => {
        const observation = v.parse(observationSchema, value);
        if (observation.sequence > 0 && !arrivals.has(observation.sequence))
          arrivals.set(observation.sequence, performance.now());
      });
      await page.goto(frontend.url.href);
      await page.waitForFunction(() => !!window.loomLive);
      const token = await issuer.token("live-load", "loom-acceptance", "30m");
      await page.evaluate((setup) => window.loomLive.start(setup), {
        services: services.map((service) => ({ url: service.url, version: generated.version, token })),
        projects: ids,
      });
      stage = "subscribe";
      await page.waitForFunction(() => window.loomLive.status().ready === 100, undefined, { timeout: 60000 });
      diagnostics.browser = await page.evaluate(() => window.loomLive.status());
      assert.equal((await page.evaluate(() => window.loomLive.status())).errors, 0);
      stage = "instance metrics";
      const initial = await metrics();
      diagnostics.initial = initial;
      assert.equal(new Set(initial.map((sample) => sample.instance)).size, 2);
      assert(initial.every((sample) => sample.subscriptions === 50));
      const listeners = () =>
        admin.query<{ pid: number }>(
          `SELECT pid FROM pg_stat_activity WHERE usename=$1 AND state='idle' AND query LIKE 'LISTEN "loom_revision_%'`,
          [runtimeRole],
        );
      if (mode === "notify") {
        stage = "listener recovery";
        const before = await listeners();
        assert.equal(before.rows.length, 2, "One listener per active runtime");
        for (const { pid } of before.rows) await admin.query("SELECT pg_terminate_backend($1)", [pid]);
        const deadline = performance.now() + 30000;
        for (;;) {
          const current = await metrics();
          if (current.every((sample) => sample.listener === "connected" && sample.reconnects >= 2)) break;
          assert(performance.now() < deadline, "Listeners did not reconnect");
          await setTimeout(250);
        }
        assert.equal((await listeners()).rows.length, 2);
      }
      stage = "load";
      const samples = [];
      const start = performance.now();
      for (let sequence = 1; sequence <= seconds * 10; sequence++) {
        const due = start + (sequence - 1) * 100;
        if (performance.now() < due) await setTimeout(due - performance.now());
        const started = performance.now();
        await admin.query("UPDATE app.tasks SET title=$1 WHERE project_id=$2", [
          String(sequence),
          ids[(sequence - 1) % ids.length],
        ]);
        commits.set(sequence, { started, acknowledged: performance.now() });
        if (sequence % 100 === 0) samples.push({ elapsedMs: performance.now() - start, services: await metrics() });
      }
      const deadline = performance.now() + 30000;
      while (arrivals.size < commits.size && performance.now() < deadline) await setTimeout(100);
      assert.equal(arrivals.size, commits.size, "Every distinct-project write must become visible");
      const timings = [...commits].map(([sequence, commit]) => {
        const observed = arrivals.get(sequence);
        assert(observed !== undefined);
        return {
          lowerMs: Math.max(0, observed - commit.acknowledged),
          upperMs: Math.max(0, observed - commit.started),
        };
      });
      stage = "cleanup counters";
      await page.evaluate(() => window.loomLive.stopSubscriptions());
      const cleanupDeadline = performance.now() + 30000;
      let final = await metrics();
      while (
        final.some(
          (sample) => sample.subscriptions || sample.evaluating || sample.queued || sample.listener !== "idle",
        ) &&
        performance.now() < cleanupDeadline
      ) {
        await setTimeout(250);
        final = await metrics();
      }
      assert(
        final.every(
          (sample) =>
            sample.subscriptions === 0 && sample.evaluating === 0 && sample.queued === 0 && sample.listener === "idle",
        ),
      );
      assert(final.every((sample) => sample.peakEvaluating <= 4 && sample.peakQueued <= 50));
      assert.equal((await listeners()).rows.length, 0);
      assert.equal((await page.evaluate(() => window.loomLive.status())).errors, 0);
      const budget = await admin.query<{ maximum: string; connections: string }>(
        "SELECT current_setting('max_connections') AS maximum,(SELECT count(*)::text FROM pg_stat_activity) AS connections",
      );
      if (process.env.LOOM_CLOUD_RECEIPT)
        await writeFile(
          process.env.LOOM_CLOUD_RECEIPT,
          JSON.stringify(
            {
              projectId,
              branchId,
              region: process.env.LOOM_CLOUD_REGION,
              version: generated.version,
              mode,
              seconds,
              subscriptions: 100,
              services,
              initial,
              samples,
              final,
              timings,
              budget: budget.rows[0],
              fullWorkload: seconds === 600,
              passed: true,
              completedAt: new Date().toISOString(),
            },
            null,
            2,
          ),
        );
    } catch (cause) {
      diagnostics.browser = await browserStatus().catch(() => ({ unavailable: true }));
      if (process.env.LOOM_CLOUD_RECEIPT)
        await writeFile(
          process.env.LOOM_CLOUD_RECEIPT,
          JSON.stringify(
            {
              projectId,
              branchId,
              stage,
              diagnostics,
              passed: false,
              error:
                cause instanceof assert.AssertionError
                  ? cause.message
                  : cause instanceof Error
                    ? cause.name
                    : "UnknownError",
            },
            null,
            2,
          ),
        );
      throw new Error(
        `Hosted native live acceptance failed during ${stage}; provider resources remain on the owned branch for diagnosis`,
      );
    } finally {
      await browser.close();
      await frontend.stop(true);
      await admin.end();
      await rm(root, { recursive: true, force: true });
    }
  },
  1000000,
);
