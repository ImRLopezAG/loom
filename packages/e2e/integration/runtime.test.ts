import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";
import { expect, test } from "bun:test";
import pg from "pg";
import { defineRelations } from "drizzle-orm";
import * as v from "valibot";
import {
  createRuntime,
  defineAuth,
  defineSchema,
  query,
  mutation,
  internalMutation,
  action,
  FunctionAccessDenied,
  cron,
} from "@loom/core/server";
import { bootstrapDatabase, defineConfig, installRevisionTracking } from "@loom/tooling";
import { createNeonService, createNeonWorker } from "@loom/core/neon";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "assembled runtime owns scheduling, authorization, live queries and shutdown",
  async () => {
    if (!connectionString) throw new Error("Missing test database");
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const namespace = `app_${suffix}`;
    const metadataNamespace = `loom_${suffix}`;
    const runtimeRole = `runtime_${suffix}`;
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    async function expectConnectionsClosed() {
      // pg-pool resolves end() after initiating client termination; PostgreSQL observes it asynchronously.
      const deadline = Date.now() + 2000;
      let count: number | undefined;
      do {
        const result = await admin.query<{ count: number }>(
          "SELECT count(*)::integer AS count FROM pg_stat_activity WHERE usename = $1",
          [runtimeRole],
        );
        count = result.rows[0]?.count;
        if (count === 0) break;
        await setTimeout(10);
      } while (Date.now() < deadline);
      expect(count).toBe(0);
    }

    try {
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      await admin.query(`CREATE SCHEMA "${namespace}"`);
      await admin.query(
        `CREATE TABLE "${namespace}".tasks (_id uuid PRIMARY KEY DEFAULT uuidv7(), "_createdAt" bigint NOT NULL DEFAULT floor(extract(epoch FROM clock_timestamp()) * 1000), title text NOT NULL)`,
      );
      await admin.query("BEGIN");
      await installRevisionTracking(admin, namespace, metadataNamespace, ["tasks"]);
      await admin.query("COMMIT");
      await admin.query(`GRANT USAGE ON SCHEMA "${namespace}" TO "${runtimeRole}"`);
      await admin.query(`GRANT SELECT, INSERT ON "${namespace}".tasks TO "${runtimeRole}"`);
      await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD 'loom-test-only'`);
      const address = new URL(connectionString);
      address.username = runtimeRole;
      address.password = "loom-test-only";
      const schema = defineSchema((s) => ({ tasks: { title: s.text().notNull() } }), { namespace });
      const version = "a".repeat(64);
      const reference = { name: "tasks:insert", kind: "mutation" as const, visibility: "internal" as const, version };
      const identity = { issuer: "https://identity.example.test", subject: "alice" };
      const started = Promise.withResolvers<void>();
      const jobStarted = Promise.withResolvers<void>();
      const jobResume = Promise.withResolvers<void>();
      let active = true;
      const options = {
        schema,
        relations: defineRelations(schema.tables),
        connectionString: address.href,
        version,
        metadataNamespace,
        deployment: "runtime-test",
        config: defineConfig({
          project: "tasks",
          jobs: { maxAttempts: 2, retryBaseMs: 7000, leaseMs: 5000 },
          realtime: { maxSubscriptions: 1, maxResultBytes: 1024, heartbeatMs: 1000 },
        }),
        auth: defineAuth({
          authorize: ({ identity }) => {
            if (identity?.subject !== "alice") throw new FunctionAccessDenied();
          },
        }),
        assertActive: async () => {
          if (!active) throw new Error("unactivated branch");
        },
        functions: {
          "tasks:schedule": mutation({
            args: v.null(),
            returns: v.string(),
            handler: (ctx) => ctx.scheduler.runAfter(0, reference, { title: "scheduled" }, { maxAttempts: 2 }),
          }),
          "tasks:insert": internalMutation({
            args: v.object({ title: v.string() }),
            returns: v.null(),
            handler: async (ctx, args) => {
              jobStarted.resolve();
              await jobResume.promise;
              await ctx.db.insert(schema.tables.tasks).values(args);
              return null;
            },
          }),
          "tasks:list": query({
            args: v.null(),
            returns: v.array(v.string()),
            handler: async (ctx) =>
              (await ctx.db.select({ title: schema.tables.tasks.title }).from(schema.tables.tasks)).map(
                (row) => row.title,
              ),
          }),
          "tasks:large": query({ args: v.null(), returns: v.string(), handler: () => "x".repeat(2000) }),
          "tasks:wait": action({
            args: v.null(),
            returns: v.null(),
            handler: async (ctx) => {
              started.resolve();
              await new Promise<void>((_resolve, reject) =>
                ctx.signal.addEventListener("abort", () => reject(ctx.signal.reason), { once: true }),
              );
              return null;
            },
          }),
        },
      };
      active = false;
      await assert.rejects(
        createRuntime({ ...options, connectionString: "postgres://localhost:1/unreachable" }),
        /activation/i,
      );
      active = true;
      await assert.rejects(
        createRuntime({ ...options, crons: { "invalid name": cron("* * * * *", reference, { title: "invalid" }) } }),
      );
      await expectConnectionsClosed();
      const runtime = await createRuntime(options);
      try {
        const call = {
          name: "tasks:schedule",
          kind: "mutation" as const,
          version,
          args: null,
          idempotencyKey: "schedule-once",
        };
        expect(await runtime.dispatcher.public(call, null)).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
        const scheduled = await runtime.dispatcher.public(call, identity);
        assert.ok(scheduled.ok);
        expect(await runtime.dispatcher.public(call, identity)).toMatchObject({ ok: true, value: scheduled.value });
        const saved = await admin.query(
          `SELECT max_attempts, retry_delay_seconds FROM "${metadataNamespace}".jobs WHERE id = $1`,
          [scheduled.value],
        );
        expect(saved.rows[0]).toMatchObject({ max_attempts: 2, retry_delay_seconds: 7 });
        const work = runtime.worker.run();
        await jobStarted.promise;
        try {
          const lease = await admin.query(
            `SELECT extract(epoch FROM lease_expires_at - clock_timestamp())::float8 AS seconds FROM "${metadataNamespace}".jobs WHERE id = $1`,
            [scheduled.value],
          );
          expect(lease.rows[0]?.seconds).toBeLessThanOrEqual(5);
        } finally {
          jobResume.resolve();
          expect(await work).toMatchObject({ claimed: 1, completed: 1 });
        }
        const read = { name: "tasks:list", kind: "query" as const, version, args: null };
        expect(await runtime.dispatcher.public(read, identity)).toMatchObject({ ok: true, value: ["scheduled"] });
        const changingIdentity = { ...identity };
        const captured = runtime.dispatcher.public(read, changingIdentity);
        changingIdentity.subject = "bob";
        expect(await captured).toMatchObject({ ok: true, value: ["scheduled"] });
        const evaluation = await runtime.dispatcher.evaluate(read, identity);
        assert.ok(evaluation.ok);
        expect(evaluation.revisions.tasks).toBeDefined();
        assert.ok(runtime.realtime);
        expect(runtime.realtime).toMatchObject({ heartbeatMs: 1000, maxSubscriptions: 1, maxBufferedBytes: 1024 });
        const session = { identity, expiresAt: Math.floor(Date.now() / 1000) + 60 };
        const sink = { publish: () => true, close: () => {} };
        const subscription = runtime.realtime.poller.subscribe(read, session, sink);
        expect(() => runtime.realtime?.poller.subscribe(read, session, sink)).toThrow("Subscription limit");
        subscription.unsubscribe();
        expect(await runtime.dispatcher.evaluate({ ...read, name: "tasks:large" }, identity)).toMatchObject({
          ok: false,
        });
        const ticket = await runtime.tickets.issue(session, "https://app.example.test");
        expect(await runtime.tickets.redeem(ticket.ticket, "https://app.example.test")).toMatchObject({ identity });
        active = false;
        await assert.rejects(runtime.dispatcher.public(read, identity), /activation/i);
        await assert.rejects(runtime.worker.run(), /ACTIVATION_DENIED/);
        active = true;
        const pending = runtime.dispatcher.public(
          { name: "tasks:wait", kind: "action", version, args: null },
          identity,
        );
        await started.promise;
        const stop = runtime.stop();
        expect(runtime.stop()).toBe(stop);
        await stop;
        expect(await pending).toMatchObject({ ok: false, error: { code: "CANCELLED" } });
        await assert.rejects(runtime.dispatcher.public(read, identity), /stopped/);
        await assert.rejects(runtime.tickets.issue(session, "https://app.example.test"), /stopped/);
        await assert.rejects(runtime.worker.run(), /stopped/);
        await expectConnectionsClosed();
      } finally {
        jobResume.resolve();
        await runtime.stop();
      }
      const entryOptions = { ...options, auth: defineAuth({ allowAnonymous: true, authorize: () => {} }) };
      await assert.rejects(createNeonWorker({ ...entryOptions, bindings: { "": { kind: "wake", name: "worker" } } }));
      await expectConnectionsClosed();
      const service = await createNeonService(entryOptions);
      const worker = await createNeonWorker({
        ...entryOptions,
        bindings: { "worker-wake": { kind: "wake", name: "worker" } },
      });
      const apiServer = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: service.fetch });
      const workerServer = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: worker.fetch });
      try {
        const invoke = (base: URL, name: string, kind: "query" | "mutation", idempotencyKey?: string) =>
          fetch(new URL("/api/loom/call", base), {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ protocol: 1, version, name, kind, args: null, idempotencyKey }),
          });
        expect((await invoke(apiServer.url, "tasks:schedule", "mutation", "service-once")).status).toBe(200);
        expect((await invoke(workerServer.url, "tasks:list", "query")).status).toBe(404);
        expect((await invoke(apiServer.url, "tasks:insert", "mutation", "private")).status).toBe(404);
        const delivery = {
          method: "POST",
          headers: { "content-type": "application/json", "x-neon-trigger-invocation-id": "entry-wake" },
          body: JSON.stringify({
            version: 1,
            invocation_id: "entry-wake",
            trigger: { type: "schedule", id: "worker-wake", name: "worker" },
            data: { scheduled_at: "2026-01-01T00:00:00Z" },
          }),
        };
        expect((await fetch(new URL("/api/loom/triggers", apiServer.url), delivery)).status).toBe(404);
        const ran = await fetch(new URL("/api/loom/triggers", workerServer.url), delivery);
        expect(ran.status).toBe(200);
        expect(await ran.json()).toMatchObject({ completed: 1 });
        expect(await (await invoke(apiServer.url, "tasks:list", "query")).json()).toMatchObject({
          ok: true,
          value: ["scheduled", "scheduled"],
        });
        const stopping = service.stop();
        expect(service.stop()).toBe(stopping);
        await stopping;
        expect((await invoke(apiServer.url, "tasks:list", "query")).status).toBe(503);
        const reading = Promise.withResolvers<void>();
        const body = new ReadableStream<Uint8Array>(
          {
            pull() {
              reading.resolve();
            },
          },
          { highWaterMark: 0 },
        );
        const pending = worker.fetch(
          new Request(new URL("/api/loom/triggers", workerServer.url), {
            method: "POST",
            headers: delivery.headers,
            body,
          }),
        );
        await reading.promise;
        const workerStopping = worker.stop();
        expect(worker.stop()).toBe(workerStopping);
        expect((await pending).status).toBe(499);
        await workerStopping;
        expect((await worker.fetch(new Request(workerServer.url))).status).toBe(503);
      } finally {
        await Promise.all([service.stop(), worker.stop()]);
        await Promise.all([apiServer.stop(true), workerServer.stop(true)]);
      }
      await expectConnectionsClosed();
    } finally {
      await admin.query(`DROP SCHEMA IF EXISTS "${namespace}" CASCADE`);
      await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
    }
  },
);
