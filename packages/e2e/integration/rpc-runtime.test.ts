import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { RPCLink as WebSocketLink } from "@orpc/client/websocket";
import type { RouterClient } from "@orpc/server";
import { defineRelations, sql } from "drizzle-orm";
import pg from "pg";
import * as v from "valibot";
import { bootstrapDatabase, startDevelopmentServer } from "@loom/tooling";
import { createRpcHttpApp, createNeonRpcService, createNeonRpcWorker } from "@loom/core/neon";
import type { RpcRuntimeOptions } from "@loom/core/server";
import {
  createRpcRuntime,
  defineRpcAuth,
  defineSchema,
  createProjectProcedures,
  createDatabaseMiddleware,
  clientMode,
  procedureCron,
} from "@loom/core/server";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "assembled native runtime owns HTTP calls, internal jobs, activation and shutdown",
  async () => {
    if (!connectionString) throw new Error("Missing database URL");
    const suffix = crypto.randomUUID().replaceAll("-", "");
    const metadataNamespace = `loom_rpc_runtime_${suffix}`;
    const runtimeRole = `loom_runtime_${suffix}`;
    const admin = new pg.Client({ connectionString });
    await admin.connect();
    try {
      await bootstrapDatabase({ connectionString, metadataNamespace, runtimeRole });
      await admin.query(`ALTER ROLE "${runtimeRole}" LOGIN PASSWORD 'loom-test-only'`);
      await admin.query(`CREATE TABLE "${metadataNamespace}".counter (value integer NOT NULL)`);
      await admin.query(`INSERT INTO "${metadataNamespace}".counter VALUES (0)`);
      await admin.query(`GRANT SELECT, UPDATE ON "${metadataNamespace}".counter TO "${runtimeRole}"`);
      const address = new URL(connectionString);
      address.username = runtimeRole;
      address.password = "loom-test-only";
      const schema = defineSchema(() => ({}));
      const relations = defineRelations(schema.tables);
      const { procedure } = createProjectProcedures(schema);
      const table = sql`${sql.identifier(metadataNamespace)}.${sql.identifier("counter")}`;
      const increment = procedure
        .use(createDatabaseMiddleware(relations, "write", schema))
        .input(v.number())
        .output(v.number())
        .handler(async ({ context, input }) => {
          const result = await context.db.execute<{ value: number }>(
            sql`UPDATE ${table} SET value = value + ${input} RETURNING value`,
          );
          return result.rows[0]!.value;
        });
      const enqueue = procedure
        .use(createDatabaseMiddleware(relations, "write", schema))
        .handler(({ context }) => context.scheduler.runAfter(0, increment, 4));
      const read = procedure
        .use(createDatabaseMiddleware(relations, "read", schema))
        .meta(clientMode("finite"))
        .output(v.number())
        .handler(
          async ({ context }) =>
            (await context.db.execute<{ value: number }>(sql`SELECT value FROM ${table}`)).rows[0]!.value,
        );
      const oversized = procedure
        .use(createDatabaseMiddleware(relations, "write", schema))
        .handler(async ({ context }) => {
          await context.db.execute(sql`UPDATE ${table} SET value = value + 100`);
          return "x".repeat(2048);
        });
      let active = true;
      const authorized: string[] = [];
      const version = "c".repeat(64);
      const runtimeOptions = {
        schema,
        relations,
        connectionString: address.href,
        metadataNamespace,
        deployment: "assembled",
        config: { auth: { origins: ["https://loom.test"] }, realtime: { maxResultBytes: 1024 } },
        version,
        procedures: [
          { path: ["enqueue"], visibility: "public", procedure: enqueue },
          { path: ["oversized"], visibility: "public", procedure: oversized },
          { path: ["read"], visibility: "public", procedure: read },
          { path: ["toString", "read"], visibility: "public", procedure: read },
          { path: ["increment"], visibility: "internal", procedure: increment },
        ],
        crons: { increment: procedureCron("* * * * *", increment, 2) },
        auth: defineRpcAuth({
          allowAnonymous: true,
          authorize: async (context) => {
            assert.ok(context.db);
            assert.ok(context.databasePolicy);
            authorized.push(context.path.join("."));
          },
        }),
        assertActive: async () => {
          if (!active) throw new Error("retired");
        },
      } satisfies RpcRuntimeOptions<typeof relations>;
      const runtime = await createRpcRuntime(runtimeOptions);
      try {
        let app = createRpcHttpApp({ ...runtime.auth, router: runtime.router, version });
        const client = createORPCClient<
          RouterClient<{ enqueue: typeof enqueue; read: typeof read; oversized: typeof oversized }>
        >(
          new RPCLink({
            origin: "https://loom.test",
            url: "/api/loom/rpc",
            headers: { "x-loom-protocol": "loom-orpc-2", "x-loom-version": version, "idempotency-key": "enqueue" },
            fetch: (url, init) => app.fetch(new Request(url, init)),
          }),
        );
        const id = await client.enqueue();
        expect(id).toMatch(/^[a-f0-9-]{36}$/);
        expect(await runtime.worker.run()).toMatchObject({ claimed: 1, completed: 1 });
        expect(await client.read()).toBe(4);
        expect(authorized).toEqual(["enqueue", "increment", "read"]);
        await assert.rejects(client.oversized());
        expect(await client.read()).toBe(4);
        expect("increment" in runtime.router).toBe(false);
        expect(Object.getPrototypeOf(runtime.router["toString"])).toBeNull();
        expect(Object.getPrototypeOf(runtime.router)).toBeNull();
        await runtime.crons.dispatch("increment", new Date(0));
        expect(await runtime.worker.run()).toMatchObject({ completed: 1 });
        expect(await client.read()).toBe(6);
        active = false;
        await assert.rejects(client.read());
        active = true;
        await runtime.stop();
        await assert.rejects(client.read());
        const service = await createNeonRpcService(runtimeOptions);
        try {
          app = service;
          expect(await client.read()).toBe(6);
          expect((await service.fetch(new Request("https://loom.test/api/loom/triggers"))).status).toBe(404);
        } finally {
          await service.stop();
        }
        const developmentRuntime = await createRpcRuntime(runtimeOptions);
        const development = await startDevelopmentServer(developmentRuntime, { port: 0 });
        let socket: WebSocket | undefined;
        try {
          const local = createORPCClient<RouterClient<{ read: typeof read }>>(
            new RPCLink({
              origin: development.url.origin,
              url: "/api/loom/rpc",
              headers: { "x-loom-protocol": "loom-orpc-2", "x-loom-version": version },
            }),
          );
          expect(await local.read()).toBe(6);
          const ticket = await developmentRuntime.tickets.issue(
            {
              identity: { issuer: "https://issuer.test", subject: "reader" },
              expiresAt: Math.floor(Date.now() / 1000) + 60,
            },
            "https://loom.test",
          );
          const socketUrl = new URL("/api/loom/socket", development.url);
          socketUrl.protocol = "ws:";
          // SAFETY: this Bun-only test uses Bun's headers overload, absent from lib.dom.
          const BunWebSocket = WebSocket as typeof WebSocket &
            (new (url: URL, options: Bun.WebSocketOptions) => WebSocket);
          socket = new BunWebSocket(socketUrl, {
            protocols: ["loom.orpc.2", `loom.version.${version}`, `loom.ticket.${ticket.ticket}`],
            headers: { origin: "https://loom.test" },
          });
          const opened = Promise.withResolvers<void>();
          socket.onopen = () => opened.resolve();
          socket.onerror = () => opened.reject(new Error("Development socket failed"));
          await opened.promise;
          const connected = socket;
          const websocket = createORPCClient<RouterClient<{ read: typeof read }>>(
            new WebSocketLink({ connect: () => connected }),
          );
          expect(await websocket.read()).toBe(6);
        } finally {
          socket?.close();
          await development.stop();
        }
        const worker = await createNeonRpcWorker({
          ...runtimeOptions,
          bindings: { timer: { kind: "cron", name: "increment", cron: "increment" } },
        });
        try {
          expect((await worker.fetch(new Request("https://loom.test/api/loom/rpc/read"))).status).toBe(404);
          const request = () =>
            new Request("https://loom.test/api/loom/triggers", {
              method: "POST",
              headers: { "content-type": "application/json", "x-neon-trigger-invocation-id": "native-entry" },
              body: JSON.stringify({
                version: 1,
                invocation_id: "native-entry",
                trigger: { type: "schedule", id: "timer", name: "increment" },
                data: { scheduled_at: "2026-01-01T00:00:00Z" },
              }),
            });
          expect((await worker.fetch(request())).status).toBe(200);
          expect((await worker.fetch(request())).status).toBe(200);
          expect((await admin.query(`SELECT value FROM "${metadataNamespace}".counter`)).rows).toEqual([{ value: 8 }]);
        } finally {
          await worker.stop();
        }
      } finally {
        await runtime.stop();
      }
    } finally {
      await admin.query(`DROP SCHEMA IF EXISTS "${metadataNamespace}" CASCADE`);
      await admin.query(`DROP ROLE IF EXISTS "${runtimeRole}"`);
      await admin.end();
    }
  },
);
