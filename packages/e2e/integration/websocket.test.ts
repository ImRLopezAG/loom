import { expect, test } from "bun:test";
import { createRealtimeConnection } from "@loom/core/client";
import * as v from "valibot";
import { createSubscriptionPoller, createWebSocketSession } from "@loom/core/server";

test("WebSocket session protocol delivers a result over a real socket and rejects duplicate subscriptions", async () => {
  const poller = createSubscriptionPoller({
    intervalMs: 10,
    readRevisions: async () => ({ tasks: "1" }),
    evaluate: async (_call, identity) => ({
      ok: true,
      requestId: "network",
      value: identity.subject,
      revisions: { tasks: "1" },
    }),
  });
  interface SocketData {
    controller?: ReturnType<typeof createWebSocketSession>;
  }
  let latestSession: ReturnType<typeof createWebSocketSession> | undefined;
  const server = Bun.serve<SocketData>({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request, runtime) {
      if (runtime.upgrade(request, { data: {} })) return;
      return new Response("Upgrade required", { status: 426 });
    },
    websocket: {
      open(socket) {
        socket.data.controller = createWebSocketSession({
          poller,
          session: { identity: { issuer: "test", subject: "alice" }, expiresAt: Math.floor(Date.now() / 1000) + 60 },
          socket: {
            get readyState() {
              return socket.readyState;
            },
            get bufferedAmount() {
              return socket.getBufferedAmount();
            },
            send(message) {
              socket.send(message);
            },
            close(code, reason) {
              socket.close(code, reason);
            },
          },
        });
        latestSession = socket.data.controller;
      },
      message(socket, message) {
        socket.data.controller?.message(message);
      },
      close(socket) {
        socket.data.controller?.dispose();
      },
    },
  });
  const address = new URL(server.url);
  address.protocol = "ws:";
  const client = new WebSocket(address);
  const ready = Promise.withResolvers<void>();
  const result = Promise.withResolvers<string>();
  const closed = Promise.withResolvers<CloseEvent>();
  client.onmessage = (event) => {
    const data = v.parse(v.string(), event.data);
    const envelope = v.parse(v.object({ type: v.string() }), JSON.parse(data));
    if (envelope.type === "ready") ready.resolve();
    if (envelope.type === "result") result.resolve(data);
    if (envelope.type === "ping") client.send(JSON.stringify({ protocol: 1, type: "pong" }));
  };
  client.onclose = closed.resolve;
  client.onerror = () => {
    ready.reject(new Error("Socket failed"));
    result.reject(new Error("Socket failed"));
  };
  try {
    await ready.promise;
    const message = JSON.stringify({
      protocol: 1,
      type: "subscribe",
      id: "one",
      name: "tasks:read",
      version: "a".repeat(64),
      args: null,
    });
    client.send(message);
    expect(JSON.parse(await result.promise)).toEqual({
      protocol: 1,
      type: "result",
      id: "one",
      sequence: 1,
      ok: true,
      requestId: "network",
      value: "alice",
    });
    client.send(message);
    expect((await closed.promise).code).toBe(1008);
    const resumed = Promise.withResolvers<void>();
    let tickets = 0;
    const values: string[] = [];
    const connection = createRealtimeConnection({
      url: server.url.href,
      identityKey: "alice",
      // This fixture supplies a trusted test session; durable ticket authority is exercised in http.test.ts.
      client: { ticket: async () => ({ ticket: String(++tickets).repeat(43), expiresAt: Date.now() / 1000 + 30 }) },
      onMessage(message) {
        if (message.type === "ready")
          connection.send({
            type: "subscribe",
            id: "one",
            name: "tasks:read",
            version: "a".repeat(64),
            args: null,
          });
        if (message.type === "result" && message.ok) {
          values.push(v.parse(v.string(), message.value));
          if (values.length === 1) latestSession?.stop();
          else resumed.resolve();
        }
      },
    });
    const timeout = setTimeout(() => resumed.reject(new Error("Reconnect did not complete")), 3000);
    try {
      await resumed.promise;
      expect(values).toEqual(["alice", "alice"]);
      expect(tickets).toBe(2);
    } finally {
      clearTimeout(timeout);
      connection.stop();
    }
  } finally {
    client.close();
    await server.stop(true);
    await poller.stop();
  }
});
