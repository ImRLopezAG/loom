import assert from "node:assert/strict";
import { test } from "bun:test";
import { createProjectProcedures, defineSchema } from "@loom/core/server";
import { RPCLink } from "@orpc/client/fetch";
import { RPCLink as WebSocketLink } from "@orpc/client/websocket";
import type { VerifiedSession } from "@loom/core/server";
import { startDevelopmentServer } from "@loom/tooling";
import type { DevelopmentServerRuntime } from "@loom/tooling";

test("development server serves HTTP and ticket-authenticated Bun sockets and drains shutdown", async () => {
  const origin = "http://localhost:4321";
  const version = "a".repeat(64);
  const ticket = "t".repeat(43);
  const tickets = new Map<string, VerifiedSession>([
    [
      ticket,
      {
        identity: { issuer: "fixture", subject: "alice" },
        expiresAt: Math.floor(Date.now() / 1000) + 60,
      },
    ],
  ]);
  let redemptions = 0;
  let stops = 0;
  const entered = Promise.withResolvers<void>();
  const finish = Promise.withResolvers<void>();
  let holdRequest = false;
  const { procedure } = createProjectProcedures(defineSchema(() => ({})));
  const router = {
    tasks: {
      list: procedure.handler(async ({ context }) => {
        if (holdRequest) {
          entered.resolve();
          await finish.promise;
        }
        return context.identity?.subject ?? "http";
      }),
    },
  };
  const runtime: DevelopmentServerRuntime = {
    auth: {
      origins: [origin],
      allowAnonymous: true,
      verify: async () => {
        throw new Error("secret verification failure");
      },
    },
    version,
    router,
    snapshots: router,
    tickets: {
      issue: async () => ({ ticket, expiresAt: Math.floor(Date.now() / 1000) + 60 }),
      redeem: async (value, requestedOrigin) => {
        redemptions++;
        assert.equal(requestedOrigin, origin);
        const session = tickets.get(value);
        tickets.delete(value);
        if (!session) throw new Error("secret invalid ticket");
        return session;
      },
    },
    realtime: { heartbeatMs: 1000, maxBufferedBytes: 1024 },
    stop: async () => {
      stops++;
    },
  };
  const server = await startDevelopmentServer(runtime, { port: 0, maxConnections: 1 });
  let socket: WebSocket | undefined;
  const http = new RPCLink({
    origin: server.url.origin,
    url: "/api/loom/rpc",
    headers: { origin, "x-loom-protocol": "loom-orpc-2", "x-loom-version": version },
  });
  async function refused(headers: Record<string, string>, status: number) {
    const response = await fetch(new URL("/api/loom/socket", server.url), { headers });
    assert.equal(response.status, status);
    assert.ok(!(await response.text()).includes("secret"));
  }
  try {
    assert.equal(await http.call(["tasks", "list"], undefined, { context: {} }), "http");
    let failedStartupStops = 0;
    await assert.rejects(
      startDevelopmentServer(
        {
          ...runtime,
          stop: async () => {
            failedStartupStops++;
          },
        },
        { port: Number(server.url.port) },
      ),
    );
    assert.equal(failedStartupStops, 1);
    await refused({}, 426);
    await refused({ upgrade: "websocket", origin: "https://evil.test" }, 403);
    await refused({ upgrade: "websocket", origin, "sec-websocket-protocol": "loom.v1" }, 400);
    await refused(
      {
        upgrade: "websocket",
        origin,
        "sec-websocket-protocol": `loom.orpc.2, loom.version.${"f".repeat(64)}, loom.ticket.${ticket}`,
      },
      409,
    );
    assert.equal(redemptions, 0);
    const wsUrl = new URL("/api/loom/socket", server.url);
    wsUrl.protocol = "ws:";
    // SAFETY: this Bun-only integration uses Bun's documented headers overload, hidden by lib.dom's constructor.
    const BunWebSocket = WebSocket as typeof WebSocket & (new (url: URL, options: Bun.WebSocketOptions) => WebSocket);
    socket = new BunWebSocket(wsUrl, {
      protocols: ["loom.orpc.2", `loom.version.${version}`, `loom.ticket.${ticket}`],
      headers: { origin },
    });
    const opened = Promise.withResolvers<void>();
    const closed = Promise.withResolvers<void>();
    socket.onopen = () => opened.resolve();
    socket.onerror = () => opened.reject(new Error("Socket failed"));
    socket.onclose = () => closed.resolve();
    await opened.promise;
    assert.equal(socket.protocol, "loom.orpc.2");
    const connected = socket;
    const link = new WebSocketLink({ connect: () => connected });
    assert.equal(await link.call(["tasks", "list"], undefined, { context: {} }), "alice");
    await refused(
      {
        upgrade: "websocket",
        origin,
        "sec-websocket-protocol": `loom.orpc.2, loom.version.${version}, loom.ticket.${ticket}`,
      },
      503,
    );
    assert.equal(redemptions, 1);
    socket.close();
    await closed.promise;
    await refused(
      {
        upgrade: "websocket",
        origin,
        "sec-websocket-protocol": `loom.orpc.2, loom.version.${version}, loom.ticket.${ticket}`,
      },
      401,
    );
    tickets.set(ticket, { identity: { issuer: "fixture", subject: "alice" }, expiresAt: 1 });
    await refused(
      {
        upgrade: "websocket",
        origin,
        "sec-websocket-protocol": `loom.orpc.2, loom.version.${version}, loom.ticket.${ticket}`,
      },
      401,
    );
    tickets.set(ticket, {
      identity: { issuer: "fixture", subject: "alice" },
      expiresAt: Math.floor(Date.now() / 1000) + 60,
    });
    socket = new BunWebSocket(wsUrl, {
      protocols: ["loom.orpc.2", `loom.version.${version}`, `loom.ticket.${ticket}`],
      headers: { origin },
    });
    const reopened = Promise.withResolvers<void>();
    const shutdownClosed = Promise.withResolvers<void>();
    socket.onopen = () => reopened.resolve();
    socket.onerror = () => reopened.reject(new Error("Socket failed"));
    socket.onclose = () => shutdownClosed.resolve();
    await reopened.promise;
    holdRequest = true;
    const pending = http.call(["tasks", "list"], undefined, { context: {} }).catch(() => null);
    await entered.promise;
    const stopping = server.stop();
    assert.equal(server.stop(), stopping);
    assert.equal(stops, 0);
    finish.resolve();
    await Promise.all([stopping, pending, shutdownClosed.promise]);
    await server.stop();
    assert.equal(stops, 1);
    const restarted = await startDevelopmentServer(
      { ...runtime, stop: async () => {} },
      { port: server.url.port ? Number(server.url.port) : 0 },
    );
    await restarted.stop();
    const redeemEntered = Promise.withResolvers<void>();
    const redeemFinished = Promise.withResolvers<VerifiedSession>();
    let delayedStopped = false;
    const delayed = await startDevelopmentServer(
      {
        ...runtime,
        tickets: {
          ...runtime.tickets,
          redeem: async () => {
            redeemEntered.resolve();
            return redeemFinished.promise;
          },
        },
        stop: async () => {
          await redeemFinished.promise;
          delayedStopped = true;
        },
      },
      { port: 0 },
    );
    let openedAfterStop = false;
    const delayedClosed = Promise.withResolvers<void>();
    const delayedUrl = new URL("/api/loom/socket", delayed.url);
    delayedUrl.protocol = "ws:";
    const late = new BunWebSocket(delayedUrl, {
      protocols: ["loom.orpc.2", `loom.version.${version}`, `loom.ticket.${ticket}`],
      headers: { origin },
    });
    late.onopen = () => {
      openedAfterStop = true;
    };
    late.onerror = () => {};
    late.onclose = () => delayedClosed.resolve();
    try {
      await redeemEntered.promise;
      const stop = delayed.stop();
      assert.equal(delayedStopped, false);
      redeemFinished.resolve({
        identity: { issuer: "fixture", subject: "alice" },
        expiresAt: Math.floor(Date.now() / 1000) + 60,
      });
      await Promise.all([stop, delayedClosed.promise]);
      assert.equal(delayedStopped, true);
      assert.equal(openedAfterStop, false);
    } finally {
      redeemFinished.resolve({ identity: { issuer: "fixture", subject: "alice" }, expiresAt: 1 });
      late.close();
      await delayed.stop();
    }
  } finally {
    finish.resolve();
    socket?.close();
    await server.stop();
  }
});
