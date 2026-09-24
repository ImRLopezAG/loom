import { expect, test } from "bun:test";
import { connect } from "node:net";
import { setTimeout } from "node:timers/promises";
import { createSubscriptionPoller, createWebSocketSession } from "@loom/core/server";

// RFC 6455 client frames are masked. This fixture sends only a short subscription frame.
function frame(message: string) {
  const payload = Buffer.from(message);
  const mask = Buffer.from([1, 2, 3, 4]);
  const header = Buffer.alloc(8);
  header[0] = 0x81;
  header[1] = 0xfe;
  header.writeUInt16BE(payload.length, 2);
  mask.copy(header, 4);
  for (let index = 0; index < payload.length; index++) payload[index] = (payload[index] ?? 0) ^ (mask[index % 4] ?? 0);
  return Buffer.concat([header, payload]);
}

test("a real non-reading socket stays buffer-bounded and closes for deterministic resync", async () => {
  let revision = 0;
  let evaluations = 0;
  let peakBufferedBytes = 0;
  let sentBytes = 0;
  let disposed = 0;
  let closure: { code: number; reason: string } | undefined;
  const limit = 65536;
  const poller = createSubscriptionPoller({
    intervalMs: 60000,
    readRevisions: async () => ({ counter: String(revision) }),
    evaluate: async () => {
      evaluations++;
      return { ok: true, requestId: "slow", value: "x".repeat(32768), revisions: { counter: String(revision) } };
    },
  });
  interface Data {
    session?: ReturnType<typeof createWebSocketSession>;
  }
  const server = Bun.serve<Data>({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request, transport) {
      if (transport.upgrade(request, { data: {} })) return;
      return new Response(null, { status: 426 });
    },
    websocket: {
      open(socket) {
        socket.data.session = createWebSocketSession({
          poller,
          maxBufferedBytes: limit,
          session: { identity: { issuer: "test", subject: "slow" }, expiresAt: Math.floor(Date.now() / 1000) + 60 },
          onDispose: () => {
            disposed++;
          },
          socket: {
            get readyState() {
              return socket.readyState;
            },
            get bufferedAmount() {
              return socket.getBufferedAmount();
            },
            send(message) {
              sentBytes += Buffer.byteLength(message);
              socket.send(message);
              peakBufferedBytes = Math.max(peakBufferedBytes, socket.getBufferedAmount());
            },
            close(code, reason) {
              closure = { code, reason };
              socket.close(code, reason);
            },
          },
        });
      },
      message(socket, message) {
        socket.data.session?.message(message);
      },
      close(socket) {
        socket.data.session?.dispose();
      },
    },
  });
  const socket = connect({ host: "127.0.0.1", port: server.port ?? 0 });
  const handshake = Promise.withResolvers<string>();
  socket.once("error", handshake.reject);
  socket.once("data", (data) => {
    socket.pause();
    handshake.resolve(data.toString());
  });
  socket.write(
    `GET / HTTP/1.1\r\nHost: 127.0.0.1\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Version: 13\r\nSec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==\r\n\r\n`,
  );
  try {
    expect(await handshake.promise).toContain("101 Switching Protocols");
    socket.write(
      frame(
        JSON.stringify({
          protocol: 1,
          type: "subscribe",
          id: "slow",
          name: "counter:read",
          version: "a".repeat(64),
          args: null,
        }),
      ),
    );
    const deadline = Date.now() + 5000;
    while (!closure && Date.now() < deadline) {
      revision++;
      await poller.poll();
      await setTimeout(1);
    }
    expect(closure).toEqual({ code: 1013, reason: "RESYNC_REQUIRED" });
    expect(disposed).toBe(1);
    expect(peakBufferedBytes).toBeGreaterThan(0);
    expect(peakBufferedBytes).toBeLessThanOrEqual(limit + 14);
    expect(sentBytes).toBeGreaterThan(limit);
    const stoppedAt = evaluations;
    for (let index = 0; index < 10; index++) {
      revision++;
      await poller.poll();
    }
    expect(evaluations).toBe(stoppedAt);
    console.info(
      "loom.slow-client",
      JSON.stringify({
        transport: "Bun TCP/WebSocket",
        maxBufferedBytes: limit,
        peakBufferedBytes,
        sentBytes,
        evaluations,
        disposed,
        closure,
      }),
    );
  } finally {
    socket.destroy();
    await server.stop(true);
    await poller.stop();
  }
}, 10000);
