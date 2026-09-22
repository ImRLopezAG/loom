import { expect, test, vi } from "vite-plus/test";
import { createRealtimeConnection } from "@loom/core/client";
import type { LiveSocket, ServerMessage } from "@loom/core/client";

class Socket implements LiveSocket {
  readyState = 1;
  bufferedAmount = 0;
  onmessage: LiveSocket["onmessage"] = null;
  onclose: LiveSocket["onclose"] = null;
  onerror: LiveSocket["onerror"] = null;
  sent: string[] = [];
  closed = false;
  send(data: string) {
    this.sent.push(data);
  }
  close() {
    this.closed = true;
  }
  message(value: ServerMessage | { protocol: number; type: "ping" }) {
    this.onmessage?.(new MessageEvent("message", { data: JSON.stringify(value) }));
  }
}

test("realtime reconnect obtains fresh tickets and ignores events from superseded sockets", async () => {
  vi.useFakeTimers();
  const sockets: Socket[] = [];
  const received: string[] = [];
  let tickets = 0;
  const connection = createRealtimeConnection({
    url: "https://api.example.test/backend",
    identityKey: "alice",
    client: { ticket: async () => ({ ticket: String(++tickets).repeat(43), expiresAt: Date.now() / 1000 + 30 }) },
    socket: (url, protocols) => {
      expect(url).toBe("wss://api.example.test/backend/api/loom/socket");
      expect(protocols).toEqual(["loom.v1", `loom.ticket.${String(tickets).repeat(43)}`]);
      const socket = new Socket();
      sockets.push(socket);
      return socket;
    },
    onMessage: (message) => received.push(message.type),
  });
  try {
    await vi.advanceTimersByTimeAsync(0);
    const first = sockets[0];
    expect(first).toBeDefined();
    first?.message({ protocol: 1, type: "ready" });
    first?.message({ protocol: 1, type: "ping" });
    expect(first?.sent).toEqual([JSON.stringify({ protocol: 1, type: "pong" })]);
    const late = first?.onmessage;
    first?.onclose?.(new CloseEvent("close", { code: 1012 }));
    await vi.advanceTimersByTimeAsync(1000);
    expect(tickets).toBe(2);
    late?.(new MessageEvent("message", { data: JSON.stringify({ protocol: 1, type: "ready" }) }));
    expect(received).toEqual(["ready"]);
    connection.setIdentity(null);
    sockets[1]?.message({ protocol: 1, type: "ready" });
    await vi.advanceTimersByTimeAsync(60000);
    expect(tickets).toBe(2);
    expect(sockets[1]?.closed).toBe(true);
  } finally {
    connection.stop();
    vi.useRealTimers();
  }
});

test("identity change during ticket acquisition cannot open an obsolete connection", async () => {
  let resolveTicket: ((ticket: { ticket: string; expiresAt: number }) => void) | undefined;
  let opened = 0;
  const connection = createRealtimeConnection({
    url: "https://api.example.test",
    identityKey: "alice",
    client: {
      ticket: () =>
        new Promise((resolve) => {
          resolveTicket = resolve;
        }),
    },
    socket: () => {
      opened++;
      return new Socket();
    },
    onMessage: () => {},
  });
  await Promise.resolve();
  connection.setIdentity(null);
  resolveTicket?.({ ticket: "a".repeat(43), expiresAt: Date.now() / 1000 + 30 });
  await Promise.resolve();
  await Promise.resolve();
  expect(opened).toBe(0);
  connection.stop();
});

test("realtime stops on protocol failures and bounds stalled connections and buffers", async () => {
  vi.useFakeTimers();
  const sockets: Socket[] = [];
  const errors: string[] = [];
  const connection = createRealtimeConnection({
    url: "https://api.example.test",
    identityKey: "alice",
    client: { ticket: async () => ({ ticket: "a".repeat(43), expiresAt: Date.now() / 1000 + 30 }) },
    socket: () => {
      const socket = new Socket();
      sockets.push(socket);
      return socket;
    },
    onMessage: () => {},
    onState: (_state, error) => {
      if (error) errors.push(error.code);
    },
  });
  try {
    await vi.advanceTimersByTimeAsync(0);
    await vi.advanceTimersByTimeAsync(30500);
    expect(sockets).toHaveLength(2);
    expect(errors).toContain("CONNECTION_TIMEOUT");
    sockets[1]?.message({ protocol: 1, type: "ready" });
    const active = sockets[1];
    if (!active) throw new Error("Missing socket");
    active.bufferedAmount = 65536;
    expect(connection.send({ type: "unsubscribe", id: "one" })).toBe(false);
    expect(errors).toContain("RESYNC_REQUIRED");
    await vi.advanceTimersByTimeAsync(1000);
    sockets[2]?.message({ protocol: 2, type: "ready" });
    expect(errors).toContain("PROTOCOL_MISMATCH");
    await vi.advanceTimersByTimeAsync(120000);
    expect(sockets).toHaveLength(3);
  } finally {
    connection.stop();
    vi.useRealTimers();
  }
});

test("transport handles reentrant identity changes during ready and abort callbacks", async () => {
  const sockets: Socket[] = [];
  const messages: string[] = [];
  const identities: string[] = [];
  const connection = createRealtimeConnection({
    url: "https://api.example.test",
    identityKey: "alice",
    client: {
      ticket: async ({ identityKey, signal }) => {
        identities.push(identityKey);
        signal?.addEventListener("abort", () => connection.setIdentity(null), { once: true });
        return { ticket: "a".repeat(43), expiresAt: Date.now() / 1000 + 30 };
      },
    },
    socket: () => {
      const socket = new Socket();
      sockets.push(socket);
      return socket;
    },
    onMessage: (message) => messages.push(message.type),
    onState: (state) => {
      if (state === "ready") connection.setIdentity("bob");
    },
  });
  await Promise.resolve();
  await Promise.resolve();
  sockets[0]?.message({ protocol: 1, type: "ready" });
  await Promise.resolve();
  await Promise.resolve();
  expect(messages).toEqual([]);
  expect(identities).toEqual(["alice"]);
  expect(sockets[0]?.closed).toBe(true);
  connection.stop();
});
