import { expect, test } from "bun:test";
import { setTimeout } from "node:timers/promises";
import WebSocket from "ws";
import { os } from "@orpc/server";
import type { RouterClient } from "@orpc/server";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/websocket";
import type { WebSocketLike } from "@orpc/client/websocket";
import type { ProcedureContext } from "@loom/core/server";
import { createRpcSocketSession } from "@loom/core/neon";

test("a real non-reading native socket stays buffer-bounded and cancels its stream", async () => {
  let evaluations = 0;
  let peakBufferedBytes = 0;
  let sentBytes = 0;
  let disposed = 0;
  let finished = false;
  let closure: { code: number; reason: string } | undefined;
  const limit = 65536;
  const router = {
    stream: os.$context<ProcedureContext>().handler(async function* ({ context }) {
      try {
        while (!context.signal.aborted) {
          evaluations++;
          yield "x".repeat(32768);
          await setTimeout(1);
        }
      } finally {
        finished = true;
      }
    }),
  };
  interface Data {
    session?: ReturnType<typeof createRpcSocketSession>;
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
        socket.data.session = createRpcSocketSession({
          router,
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
      async close(socket) {
        await socket.data.session?.dispose();
      },
    },
  });
  const socket = new WebSocket(`ws://127.0.0.1:${server.port}`);
  // SAFETY: ws implements the WHATWG event surface used by oRPC; its listener option types are narrower.
  const peer = socket as WebSocketLike;
  const client = createORPCClient<RouterClient<typeof router>>(new RPCLink({ connect: () => peer }));
  try {
    const stream = await client.stream();
    expect((await stream.next()).value).toHaveLength(32768);
    socket.pause();
    const deadline = Date.now() + 5000;
    while ((!closure || !finished || disposed === 0) && Date.now() < deadline) await setTimeout(5);
    expect(closure).toEqual({ code: 1013, reason: "RESYNC_REQUIRED" });
    expect(disposed).toBe(1);
    expect(finished).toBe(true);
    expect(peakBufferedBytes).toBeGreaterThan(0);
    expect(peakBufferedBytes).toBeLessThanOrEqual(limit + 14);
    expect(sentBytes).toBeGreaterThan(limit);
    const stoppedAt = evaluations;
    await setTimeout(30);
    expect(evaluations).toBe(stoppedAt);
    console.info(
      "loom.slow-client",
      JSON.stringify({
        transport: "native oRPC / Bun TCP",
        maxBufferedBytes: limit,
        peakBufferedBytes,
        sentBytes,
        evaluations,
        disposed,
        closure,
      }),
    );
  } finally {
    socket.terminate();
    await server.stop(true);
  }
}, 10000);
