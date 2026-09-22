import { expect, test, vi } from "vite-plus/test";
import { createSubscriptionPoller, createWebSocketSession } from "@loom/core/server";

function socket() {
  const messages: string[] = [];
  const closed: [number, string][] = [];
  return {
    messages,
    closed,
    readyState: 1,
    bufferedAmount: 0,
    send: (message: string) => {
      messages.push(message);
    },
    close: (code: number, reason: string) => {
      closed.push([code, reason]);
    },
  };
}
const session = () => ({
  identity: { issuer: "test", subject: "alice" },
  expiresAt: Math.floor(Date.now() / 1000) + 60,
});
const subscribe = {
  protocol: 1,
  type: "subscribe",
  id: "one",
  name: "tasks:read",
  version: "a".repeat(64),
  args: null,
};

test("WebSocket protocol validates messages, delivers ordered results and bounds buffers", async () => {
  let revision = "1";
  const poller = createSubscriptionPoller({
    intervalMs: 60_000,
    readRevisions: async () => ({ tasks: revision }),
    evaluate: async () => ({ ok: true, requestId: "one", value: revision, revisions: { tasks: revision } }),
  });
  const ws = socket();
  const connection = createWebSocketSession({ socket: ws, session: session(), poller });
  try {
    connection.message(JSON.stringify(subscribe));
    await poller.poll();
    expect(ws.messages.map((value) => JSON.parse(value))).toContainEqual({
      protocol: 1,
      type: "result",
      id: "one",
      sequence: 1,
      ok: true,
      requestId: "one",
      value: "1",
    });
    expect(ws.messages.join(" ")).not.toContain("revisions");
    connection.message(JSON.stringify({ protocol: 1, type: "unsubscribe", id: "one" }));
    revision = "2";
    await poller.poll();
    expect(ws.messages.filter((value) => value.includes('"result"'))).toHaveLength(1);
    ws.bufferedAmount = 2_000_000;
    connection.message(JSON.stringify({ ...subscribe, id: "two" }));
    await poller.poll();
    expect(ws.closed).toEqual([[1013, "RESYNC_REQUIRED"]]);
  } finally {
    connection.dispose();
    await poller.stop();
  }
});

test("WebSocket sessions reject forged envelopes and expire without active subscriptions", async () => {
  vi.useFakeTimers();
  try {
    const poller = createSubscriptionPoller({
      readRevisions: async () => ({}),
      evaluate: async () => {
        throw new Error("unexpected");
      },
    });
    for (const { data, code, reason } of [
      { data: new Uint8Array([1]), code: 1003, reason: "TEXT_REQUIRED" },
      { data: "not json", code: 1008, reason: "INVALID_MESSAGE" },
      { data: JSON.stringify({ ...subscribe, identity: "bob" }), code: 1008, reason: "INVALID_MESSAGE" },
      { data: JSON.stringify({ ...subscribe, protocol: 2 }), code: 4406, reason: "PROTOCOL_MISMATCH" },
    ]) {
      const ws = socket();
      const connection = createWebSocketSession({ socket: ws, session: session(), poller });
      connection.message(data);
      expect(ws.closed).toEqual([[code, reason]]);
      connection.dispose();
    }
    const ws = socket();
    createWebSocketSession({
      socket: ws,
      session: { ...session(), expiresAt: Math.floor(Date.now() / 1000) + 1 },
      poller,
    });
    await vi.advanceTimersByTimeAsync(1000);
    expect(ws.closed).toEqual([[4401, "AUTH_EXPIRED"]]);
    await poller.stop();
  } finally {
    vi.useRealTimers();
  }
});

test("Neon handshake rejects missing origins and credentials before attempting the native upgrade", async () => {
  const { createNeonRealtime } = await import("@loom/core/neon");
  const poller = createSubscriptionPoller({
    readRevisions: async () => ({}),
    evaluate: async () => {
      throw new Error("unexpected");
    },
  });
  let redeemed = 0;
  const service = createNeonRealtime({
    poller,
    origins: ["https://app.example.test"],
    tickets: {
      redeem: async (ticket, origin) => {
        redeemed++;
        expect(ticket).toBe("a".repeat(43));
        expect(origin).toBe("https://app.example.test");
        return session();
      },
    },
  });
  const headers = {
    upgrade: "websocket",
    origin: "https://app.example.test",
    "sec-websocket-protocol": `loom.v1, loom.ticket.${"a".repeat(43)}`,
  };
  try {
    expect((await service.app.request("/api/loom/socket")).status).toBe(426);
    expect(
      (await service.app.request("/api/loom/socket", { headers: { ...headers, origin: "https://evil.example.test" } }))
        .status,
    ).toBe(403);
    expect(
      (await service.app.request("/api/loom/socket", { headers: { ...headers, "sec-websocket-protocol": "loom.v1" } }))
        .status,
    ).toBe(400);
    expect(redeemed).toBe(0);
    const unavailable = await service.app.request("/api/loom/socket", { headers });
    expect(unavailable.status).toBe(503); // The real native adapter rejects execution outside Neon.
    expect(await unavailable.text()).not.toContain("a".repeat(43));
    expect(redeemed).toBe(1);
    service.stop();
    expect((await service.app.request("/api/loom/socket", { headers })).status).toBe(503);
    expect(redeemed).toBe(1);
  } finally {
    service.stop();
    await poller.stop();
  }
});

test("WebSocket heartbeat, frame and rate limits close bounded sessions", async () => {
  vi.useFakeTimers();
  const poller = createSubscriptionPoller({
    readRevisions: async () => ({}),
    evaluate: async () => {
      throw new Error("unexpected");
    },
  });
  const ws = socket();
  const connection = createWebSocketSession({ socket: ws, session: session(), poller, heartbeatMs: 10 });
  try {
    await vi.advanceTimersByTimeAsync(10);
    expect(ws.messages.at(-1)).toBe('{"protocol":1,"type":"ping"}');
    connection.message('{"protocol":1,"type":"pong"}');
    await vi.advanceTimersByTimeAsync(10);
    expect(ws.closed).toEqual([]);
    await vi.advanceTimersByTimeAsync(10);
    expect(ws.closed).toEqual([[1001, "HEARTBEAT_TIMEOUT"]]);
    const oversized = socket();
    createWebSocketSession({ socket: oversized, session: session(), poller, maxMessageBytes: 8 }).message(
      "a".repeat(9),
    );
    expect(oversized.closed).toEqual([[1009, "MESSAGE_TOO_LARGE"]]);
    const flooded = socket();
    const limited = createWebSocketSession({ socket: flooded, session: session(), poller, maxMessagesPerSecond: 1 });
    limited.message('{"protocol":1,"type":"pong"}');
    limited.message('{"protocol":1,"type":"pong"}');
    expect(flooded.closed).toEqual([[1013, "RATE_LIMIT"]]);
  } finally {
    connection.dispose();
    await poller.stop();
    vi.useRealTimers();
  }
});

test("Neon handshake counts pending redemption against capacity and releases failed upgrades", async () => {
  const { createNeonRealtime } = await import("@loom/core/neon");
  const pending = Promise.withResolvers<ReturnType<typeof session>>();
  const started = Promise.withResolvers<void>();
  let attempts = 0;
  const poller = createSubscriptionPoller({
    readRevisions: async () => ({}),
    evaluate: async () => {
      throw new Error("unexpected");
    },
  });
  const service = createNeonRealtime({
    poller,
    maxConnections: 1,
    origins: ["https://app.example.test"],
    tickets: {
      redeem: async () => {
        attempts++;
        started.resolve();
        return pending.promise;
      },
    },
  });
  const headers = {
    upgrade: "websocket",
    origin: "https://app.example.test",
    "sec-websocket-protocol": `loom.v1, loom.ticket.${"a".repeat(43)}`,
  };
  try {
    const first = service.app.request("/api/loom/socket", { headers });
    await started.promise;
    expect((await service.app.request("/api/loom/socket", { headers })).status).toBe(503);
    expect(attempts).toBe(1);
    pending.resolve(session());
    expect((await first).status).toBe(503);
    expect((await service.app.request("/api/loom/socket", { headers })).status).toBe(503);
    expect(attempts).toBe(2);
  } finally {
    pending.resolve(session());
    service.stop();
    await poller.stop();
  }
});
