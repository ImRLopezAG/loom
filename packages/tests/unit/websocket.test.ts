import { expect, test, vi } from "vite-plus/test";
import { createNeonRpcSocket, createRpcSocketSession } from "@loom/core/neon";
const version = "a".repeat(64);

function socket() {
  const messages: (string | Uint8Array<ArrayBuffer>)[] = [];
  const closed: [number, string][] = [];
  return {
    messages,
    closed,
    readyState: 1,
    bufferedAmount: 0,
    send: (message: string | Uint8Array<ArrayBuffer>) => {
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
test("native heartbeat, buffer, frame and rate limits bound socket resources", async () => {
  vi.useFakeTimers();
  const connections: ReturnType<typeof createRpcSocketSession>[] = [];
  const connect = (
    ws: ReturnType<typeof socket>,
    options: Partial<Parameters<typeof createRpcSocketSession>[0]> = {},
  ) => {
    const connection = createRpcSocketSession({ router: {}, socket: ws, session: session(), ...options });
    connections.push(connection);
    return connection;
  };
  try {
    const ws = socket();
    connect(ws, { heartbeatMs: 10 });
    await vi.advanceTimersByTimeAsync(10);
    expect(ws.messages).toEqual([" "]);
    expect(ws.closed).toEqual([]);
    ws.bufferedAmount = 2_000_000;
    await vi.advanceTimersByTimeAsync(10);
    expect(ws.closed).toEqual([[1013, "RESYNC_REQUIRED"]]);
    const oversized = socket();
    connect(oversized, { maxMessageBytes: 8 }).message("a".repeat(9));
    expect(oversized.closed).toEqual([[1009, "CAPACITY_EXCEEDED"]]);
    const flooded = socket();
    const limited = connect(flooded, { maxMessagesPerSecond: 1 });
    limited.message(JSON.stringify({ kind: "cancel", id: "absent" }));
    await Promise.resolve();
    expect(flooded.closed).toEqual([]);
    limited.message(JSON.stringify({ kind: "cancel", id: "absent" }));
    expect(flooded.closed).toEqual([[1009, "CAPACITY_EXCEEDED"]]);
    const disposed = socket();
    const stopped = connect(disposed, { heartbeatMs: 10 });
    await stopped.dispose();
    await vi.advanceTimersByTimeAsync(20);
    expect(disposed.messages).toEqual([]);
    expect(disposed.closed).toEqual([]);
  } finally {
    await Promise.all(connections.map((connection) => connection.dispose()));
    vi.useRealTimers();
  }
});

test("Neon handshake rejects missing origins and credentials before attempting the native upgrade", async () => {
  let redeemed = 0;
  const service = createNeonRpcSocket({
    router: {},
    version,
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
    "sec-websocket-protocol": `loom.orpc.2, loom.version.${version}, loom.ticket.${"a".repeat(43)}`,
  };
  try {
    expect((await service.fetch(new Request("https://api.example.test/api/loom/socket"))).status).toBe(426);
    expect(
      (
        await service.fetch(
          new Request("https://api.example.test/api/loom/socket", {
            headers: { ...headers, origin: "https://evil.example.test" },
          }),
        )
      ).status,
    ).toBe(403);
    expect(
      (
        await service.fetch(
          new Request("https://api.example.test/api/loom/socket", {
            headers: { ...headers, "sec-websocket-protocol": "loom.orpc.2" },
          }),
        )
      ).status,
    ).toBe(400);
    expect(redeemed).toBe(0);
    const unavailable = await service.fetch(new Request("https://api.example.test/api/loom/socket", { headers }));
    expect(unavailable.status).toBe(401); // The real native adapter rejects execution outside Neon.
    expect(await unavailable.text()).not.toContain("a".repeat(43));
    expect(redeemed).toBe(1);
    await service.stop();
    expect((await service.fetch(new Request("https://api.example.test/api/loom/socket", { headers }))).status).toBe(
      503,
    );
    expect(redeemed).toBe(1);
  } finally {
    await service.stop();
  }
});

test("Neon handshake counts pending redemption against capacity and releases failed upgrades", async () => {
  const pending = Promise.withResolvers<ReturnType<typeof session>>();
  const started = Promise.withResolvers<void>();
  let attempts = 0;
  const service = createNeonRpcSocket({
    router: {},
    version,
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
    "sec-websocket-protocol": `loom.orpc.2, loom.version.${version}, loom.ticket.${"a".repeat(43)}`,
  };
  try {
    const first = service.fetch(new Request("https://api.example.test/api/loom/socket", { headers }));
    await started.promise;
    expect((await service.fetch(new Request("https://api.example.test/api/loom/socket", { headers }))).status).toBe(
      503,
    );
    expect(attempts).toBe(1);
    pending.resolve(session());
    expect((await first).status).toBe(401);
    expect((await service.fetch(new Request("https://api.example.test/api/loom/socket", { headers }))).status).toBe(
      401,
    );
    expect(attempts).toBe(2);
  } finally {
    pending.resolve(session());
    await service.stop();
  }
});
