import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import { RPCLink as WebSocketLink } from "@orpc/client/websocket";
import { createClient } from "@loom/core/client";
import type { RouterClient } from "@orpc/server";
import * as v from "valibot";
import { createProjectProcedures, defineSchema } from "@loom/core/server";
import { createRpcHttpApp, createRpcOpenApiApp, createRpcSocketSession, createNeonRpcSocket } from "@loom/core/neon";

const version = "a".repeat(64);
const origin = "https://app.example.test";
const headers = { "x-loom-protocol": "loom-orpc-2", "x-loom-version": version, origin, authorization: "Bearer valid" };
const { procedure } = createProjectProcedures(defineSchema(() => ({})));
const router = {
  values: procedure.handler(() => ({ absent: undefined, date: new Date("2026-09-24T00:00:00Z"), count: 9n })),
  echo: procedure
    .input(v.string())
    .handler(({ input, context }) => ({ input, subject: context.identity?.subject, requestId: context.requestId })),
  missing: procedure.errors({ NOT_FOUND: {} }).handler(({ errors }) => {
    throw errors.NOT_FOUND({ message: "Missing" });
  }),
};

test("historical calls receive a readable terminal upgrade refusal without dispatch", async () => {
  let authenticated = 0;
  let issued = 0;
  const app = createRpcHttpApp({
    router,
    version,
    origins: [origin],
    verify: async () => {
      authenticated++;
      throw new Error("Must not authenticate retired calls");
    },
    tickets: {
      issue: async () => {
        issued++;
        throw new Error("Must not issue legacy tickets");
      },
    },
  });
  let requests = 0;
  const legacy = createClient({
    url: "https://service.test",
    getAuth: async () => ({ token: "historical", identityKey: "alice" }),
    fetch: (url, init) => {
      requests++;
      const request = new Request(url, init);
      request.headers.set("origin", origin);
      return app.fetch(request);
    },
  });
  await assert.rejects(legacy.call({ name: "tasks:list", kind: "query", visibility: "public", version }, {}), {
    code: "VERSION_MISMATCH",
  });
  await assert.rejects(legacy.ticket({ identityKey: "alice" }), { code: "VERSION_MISMATCH" });
  assert.equal(requests, 2);
  assert.equal(authenticated, 0);
  assert.equal(issued, 0);
});

test("native HTTP authenticates before dispatch and protects protocol, origin and internal paths", async () => {
  let calls = 0;
  const app = createRpcHttpApp({
    router,
    version,
    origins: [origin],
    verify: async (token) => {
      calls++;
      if (token !== "valid") throw new Error("secret verifier detail");
      return { identity: { issuer: "test", subject: "alice" }, expiresAt: Math.floor(Date.now() / 1000) + 60 };
    },
  });
  const client = createORPCClient<RouterClient<typeof router>>(
    new RPCLink({
      origin: "https://service.example.test",
      url: "/api/loom/rpc",
      headers,
      fetch: (request, init) => app.fetch(new Request(request, init)),
    }),
  );
  const first = await client.echo("hello");
  expect(await client.values()).toStrictEqual({ absent: undefined, date: new Date("2026-09-24T00:00:00Z"), count: 9n });
  expect(first.subject).toBe("alice");
  expect((await client.echo("again")).requestId).not.toBe(first.requestId);
  await assert.rejects(client.missing(), { code: "NOT_FOUND", message: "Missing" });
  for (const [patch, status] of [
    [{ origin: "https://evil.example.test" }, 403],
    [{ authorization: "Bearer forged" }, 401],
    [{ "x-loom-version": "b".repeat(64) }, 409],
    [{ "x-loom-protocol": "loom-legacy-1" }, 409],
  ] as const) {
    const response = await app.fetch(
      new Request("https://service.example.test/api/loom/rpc/echo", {
        method: "POST",
        headers: { ...headers, ...patch, "content-type": "application/json" },
        body: JSON.stringify({ json: "hello" }),
      }),
    );
    expect(response.status).toBe(status);
    expect(await response.text()).not.toContain("secret verifier detail");
  }
  expect(
    (
      await app.fetch(
        new Request("https://service.example.test/api/loom/rpc/internal/admin", { method: "POST", headers }),
      )
    ).status,
  ).toBe(404);
  expect(calls).toBe(6);
});

test("native socket sessions preserve identity and errors and drain cancellation", async () => {
  const sessions = new Map<object, ReturnType<typeof createRpcSocketSession>>();
  let disposed = 0;
  let aborted = 0;
  const socketRouter = {
    ...router,
    wait: procedure.handler(async ({ context }) => {
      await new Promise<void>((resolve) =>
        context.signal.addEventListener(
          "abort",
          () => {
            aborted++;
            resolve();
          },
          { once: true },
        ),
      );
      return "cancelled";
    }),
  };
  const server = Bun.serve({
    port: 0,
    fetch(request, server) {
      if (server.upgrade(request)) return;
      return new Response("Upgrade required", { status: 426 });
    },
    websocket: {
      open(socket) {
        const session = createRpcSocketSession({
          router: socketRouter,
          socket: {
            get readyState() {
              return socket.readyState;
            },
            get bufferedAmount() {
              return socket.getBufferedAmount();
            },
            send: (data) => {
              socket.send(data);
            },
            close: (code, reason) => socket.close(code, reason),
          },
          session: { identity: { issuer: "test", subject: "alice" }, expiresAt: Math.floor(Date.now() / 1000) + 60 },
          heartbeatMs: 10,
          onDispose: () => {
            disposed++;
          },
        });
        sessions.set(socket, session);
      },
      message(socket, data) {
        sessions.get(socket)?.message(data);
      },
      close(socket) {
        void sessions.get(socket)?.dispose();
      },
    },
  });
  const ws = new WebSocket(`ws://127.0.0.1:${server.port}`);
  const client = createORPCClient<RouterClient<typeof socketRouter>>(
    new WebSocketLink({ connect: () => ws, headers: { identity: "forged", authorization: "Bearer forged" } }),
  );
  try {
    expect((await client.echo("hello")).subject).toBe("alice");
    expect(await client.values()).toStrictEqual({
      absent: undefined,
      date: new Date("2026-09-24T00:00:00Z"),
      count: 9n,
    });
    await assert.rejects(client.missing(), { code: "NOT_FOUND", message: "Missing" });
    const cancel = new AbortController();
    const pending = assert.rejects(client.wait(undefined, { signal: cancel.signal }));
    await Bun.sleep(30);
    cancel.abort();
    await pending;
    expect((await client.echo("after heartbeat and cancellation")).input).toBe("after heartbeat and cancellation");
  } finally {
    ws.close();
    await Promise.all([...sessions.values()].map((session) => session.dispose()));
    await server.stop(true);
  }
  expect(aborted).toBe(1);
  expect(disposed).toBe(1);
}, 10000);

test("HTTP bounds authentication waits and validates ticket bodies", async () => {
  const stalled = createRpcHttpApp({
    router,
    version,
    origins: [origin],
    requestTimeoutMs: 5,
    verify: () => new Promise(() => {}),
  });
  expect(
    (await stalled.fetch(new Request("https://service.test/api/loom/rpc/echo", { method: "POST", headers }))).status,
  ).toBe(504);
  let issued = 0;
  const app = createRpcHttpApp({
    router,
    version,
    origins: [origin],
    verify: async () => ({ identity: { issuer: "test", subject: "alice" }, expiresAt: Date.now() / 1000 + 60 }),
    tickets: {
      issue: async () => {
        issued++;
        return { ticket: "a".repeat(43), expiresAt: Date.now() / 1000 + 30 };
      },
    },
  });
  for (const [body, status] of [
    ["{ }", 200],
    ["null", 400],
    ["[]", 400],
    ["{", 400],
    ['{"identity":"forged"}', 400],
  ] as const) {
    expect(
      (await app.fetch(new Request("https://service.test/api/loom/ticket", { method: "POST", headers, body }))).status,
    ).toBe(status);
  }
  expect(issued).toBe(1);
});

test("OpenAPI uses the same authenticated procedure and rejects incomplete output contracts", async () => {
  const options = {
    version,
    origins: [origin],
    verify: async () => ({ identity: { issuer: "test", subject: "alice" }, expiresAt: Date.now() / 1000 + 60 }),
  };
  await assert.rejects(createRpcOpenApiApp({ ...options, router }), /explicit output schema required/);
  const rest = createProjectProcedures(defineSchema(() => ({}))).procedure;
  const app = await createRpcOpenApiApp({
    ...options,
    router: {
      who: rest
        .output(v.object({ subject: v.string() }))
        .handler(({ context }) => ({ subject: context.identity?.subject ?? "anonymous" })),
    },
  });
  const response = await app.fetch(
    new Request("https://service.test/api/loom/openapi/who", { method: "POST", headers }),
  );
  expect(response.status).toBe(200);
  expect(await response.json()).toEqual({ subject: "alice" });
  expect(app.document.paths?.["/who"]).toBeDefined();
  expect(
    (
      await app.fetch(
        new Request("https://service.test/api/loom/openapi/who", {
          method: "POST",
          headers: { ...headers, authorization: "invalid" },
        }),
      )
    ).status,
  ).toBe(401);
});

test("Neon bridge retains the exact upgrade response and reserves capacity before redemption", async () => {
  const bridgeKey = Symbol.for("neon.websocket.bridge");
  const previous = Object.getOwnPropertyDescriptor(globalThis, bridgeKey);
  const response = new Response("provider upgrade marker");
  const socket = new EventTarget();
  let closed = 0;
  Object.defineProperties(socket, {
    readyState: { value: 0 },
    bufferedAmount: { value: 0 },
    close: {
      value: (code: number) => {
        if (code !== 1000 && (code < 3000 || code > 4999))
          throw new DOMException("Invalid close code", "InvalidAccessError");
        expect(code).toBe(4001);
        closed++;
      },
    },
    send: { value: () => {} },
  });
  let upgrades = 0;
  Object.defineProperty(globalThis, bridgeKey, {
    configurable: true,
    value: {
      upgrade: (_request: Request, options: { protocol: string }) => {
        expect(options.protocol).toBe("loom.orpc.2");
        upgrades++;
        return { socket, response };
      },
    },
  });
  const redemption = Promise.withResolvers<{ identity: { issuer: string; subject: string }; expiresAt: number }>();
  let redeemed = 0;
  const app = createNeonRpcSocket({
    router,
    version,
    origins: [origin],
    maxConnections: 1,
    tickets: {
      redeem: () => {
        redeemed++;
        return redemption.promise;
      },
    },
  });
  const request = (patch: Record<string, string> = {}) =>
    new Request("https://service.test/api/loom/socket", {
      headers: {
        origin,
        upgrade: "websocket",
        "sec-websocket-protocol": `loom.orpc.2, loom.version.${version}, loom.ticket.${"a".repeat(43)}`,
        ...patch,
      },
    });
  try {
    expect((await app.fetch(request({ upgrade: "" }))).status).toBe(426);
    expect((await app.fetch(request({ origin: "https://evil.test" }))).status).toBe(403);
    expect(
      (
        await app.fetch(
          request({
            "sec-websocket-protocol": `loom.orpc.2, loom.version.${"b".repeat(64)}, loom.ticket.${"a".repeat(43)}`,
          }),
        )
      ).status,
    ).toBe(409);
    const pending = app.fetch(request());
    expect((await app.fetch(request())).status).toBe(503);
    redemption.resolve({ identity: { issuer: "test", subject: "alice" }, expiresAt: Date.now() / 1000 + 60 });
    expect(await pending).toBe(response);
    expect(upgrades).toBe(1);
    expect(redeemed).toBe(1);
    await app.stop();
    expect(closed).toBe(1);
    expect((await app.fetch(request())).status).toBe(503);
  } finally {
    await app.stop();
    if (previous) Object.defineProperty(globalThis, bridgeKey, previous);
    else Reflect.deleteProperty(globalThis, bridgeKey);
  }
});

test("socket sessions reject malformed binary frames, enforce byte bounds and expire idle credentials", async () => {
  for (const scenario of ["binary", "oversized", "expiry"] as const) {
    const closed = Promise.withResolvers<{ code: number; reason: string }>();
    let disposed = 0;
    const session = createRpcSocketSession({
      router,
      maxMessageBytes: 16,
      session: {
        identity: { issuer: "test", subject: "alice" },
        expiresAt: Date.now() / 1000 + (scenario === "expiry" ? 0.02 : 60),
      },
      socket: {
        readyState: 1,
        bufferedAmount: 0,
        send: () => {},
        close: (code, reason) => closed.resolve({ code, reason }),
      },
      onDispose: () => {
        disposed++;
      },
    });
    try {
      if (scenario === "binary") session.message(new Uint8Array([255, 0, 255]).buffer);
      if (scenario === "oversized") session.message("x".repeat(17));
      const result = await closed.promise;
      expect(result.code).toBe(scenario === "oversized" ? 1009 : 1008);
      if (scenario === "expiry") expect(result.reason).toBe("SESSION_EXPIRED");
    } finally {
      await session.dispose();
    }
    expect(disposed).toBe(1);
  }
}, 1000);

test("shutdown refuses admission immediately but drains a pending ticket transaction", async () => {
  const redemption = Promise.withResolvers<{ identity: { issuer: string; subject: string }; expiresAt: number }>();
  const app = createNeonRpcSocket({
    router,
    version,
    origins: [origin],
    tickets: { redeem: () => redemption.promise },
  });
  const pending = app.fetch(
    new Request("https://service.test/api/loom/socket", {
      headers: {
        origin,
        upgrade: "websocket",
        "sec-websocket-protocol": `loom.orpc.2, loom.version.${version}, loom.ticket.${"a".repeat(43)}`,
      },
    }),
  );
  let stopped = false;
  const stopping = app.stop().then(() => {
    stopped = true;
  });
  expect((await pending).status).toBe(401);
  expect(stopped).toBe(false);
  redemption.resolve({ identity: { issuer: "test", subject: "alice" }, expiresAt: Date.now() / 1000 + 60 });
  await stopping;
  expect(stopped).toBe(true);
});

test("Neon WHATWG sockets retain capacity reasons in application close codes", async () => {
  const bridgeKey = Symbol.for("neon.websocket.bridge");
  const previous = Object.getOwnPropertyDescriptor(globalThis, bridgeKey);
  const socket = new EventTarget();
  const closures: { code: number; reason: string }[] = [];
  Object.defineProperties(socket, {
    readyState: { value: 1 },
    bufferedAmount: { value: 0 },
    send: { value: () => {} },
    close: {
      value: (code: number, reason: string) => {
        if (code !== 1000 && (code < 3000 || code > 4999))
          throw new DOMException("Invalid close code", "InvalidAccessError");
        closures.push({ code, reason });
      },
    },
  });
  Object.defineProperty(globalThis, bridgeKey, {
    configurable: true,
    value: { upgrade: () => ({ socket, response: new Response("upgrade marker") }) },
  });
  const app = createNeonRpcSocket({
    router,
    version,
    origins: [origin],
    maxMessageBytes: 16,
    tickets: {
      redeem: async () => ({ identity: { issuer: "test", subject: "alice" }, expiresAt: Date.now() / 1000 + 60 }),
    },
  });
  try {
    await app.fetch(
      new Request("https://service.test/api/loom/socket", {
        headers: {
          origin,
          upgrade: "websocket",
          "sec-websocket-protocol": `loom.orpc.2, loom.version.${version}, loom.ticket.${"a".repeat(43)}`,
        },
      }),
    );
    socket.dispatchEvent(new Event("open"));
    socket.dispatchEvent(new MessageEvent("message", { data: "x".repeat(17) }));
    expect(closures[0]).toEqual({ code: 4009, reason: "CAPACITY_EXCEEDED" });
    await app.stop();
  } finally {
    await app.stop();
    if (previous) Object.defineProperty(globalThis, bridgeKey, previous);
    else Reflect.deleteProperty(globalThis, bridgeKey);
  }
});
