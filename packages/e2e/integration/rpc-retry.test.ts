import assert from "node:assert/strict";
import { test } from "bun:test";
import { createORPCClient } from "@orpc/client";
import type { RouterClient } from "@orpc/server";
import { MutationObserver } from "@tanstack/react-query";
import { createRpcTransport } from "@loom/core/client";
import { createProjectProcedures, defineSchema } from "@loom/core/server";
import { createRpcSocketSession } from "@loom/core/neon";
import { createRpcQuerySession, createRpcMutationMethod } from "@loom/core/query";
import type { ServerWebSocket } from "bun";

test("explicit native retries carry one intent through WebSocket headers after an uncertain write", async () => {
  const { procedure } = createProjectProcedures(defineSchema(() => ({})));
  const keys: string[] = [];
  const committed = new Map<string, number>();
  const router = {
    write: procedure.handler(({ context }) => {
      const key = context.idempotencyKey;
      assert.ok(key);
      keys.push(key);
      const prior = committed.get(key);
      if (prior !== undefined) return prior;
      committed.set(key, committed.size + 1);
      // Simulates a failure after an external write; the retry must keep its intent.
      throw new Error("Response unavailable after commit");
    }),
  };
  const sessions = new Map<ServerWebSocket<undefined>, ReturnType<typeof createRpcSocketSession>>();
  const server = Bun.serve<undefined>({
    hostname: "127.0.0.1",
    port: 0,
    fetch(request, server) {
      if (new URL(request.url).pathname === "/api/loom/ticket") {
        assert.equal(request.headers.get("authorization"), "Bearer fixture");
        return Response.json({ ticket: "t".repeat(43), expiresAt: Date.now() / 1000 + 60 });
      }
      if (server.upgrade(request, { headers: { "sec-websocket-protocol": "loom.orpc.2" } })) return;
      return new Response("Upgrade required", { status: 426 });
    },
    websocket: {
      open(socket) {
        sessions.set(
          socket,
          createRpcSocketSession({
            router,
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
            session: { identity: { issuer: "test", subject: "alice" }, expiresAt: Date.now() / 1000 + 60 },
            onDispose: () => {
              sessions.delete(socket);
            },
          }),
        );
      },
      message(socket, data) {
        sessions.get(socket)?.message(data);
      },
      close(socket) {
        void sessions.get(socket)?.dispose();
      },
    },
  });
  const transport = createRpcTransport({
    url: server.url.href,
    version: "a".repeat(64),
    getToken: async () => "fixture",
  });
  const session = createRpcQuerySession({
    link: transport.link,
    deployment: server.url.href,
    version: "a".repeat(64),
    identity: null,
  });
  const raw = createORPCClient<RouterClient<typeof router>>(session.link);
  const write = createRpcMutationMethod(raw.write, session, ["write"]);
  try {
    const observer = new MutationObserver(session.queryClient, write({ retry: 1, retryDelay: 1 }));
    assert.equal(await observer.mutate(undefined), 1);
    assert.equal(await observer.mutate(undefined), 2);
    assert.equal(keys.length, 4);
    assert.equal(keys[0], keys[1]);
    assert.equal(keys[2], keys[3]);
    assert.notEqual(keys[0], keys[2]);
    assert.equal(committed.size, 2);
    await assert.rejects(transport.link.call(["write"], undefined, { context: { idempotencyKey: "invalid" } }));
    assert.equal(keys.length, 4);
  } finally {
    session.dispose();
    transport.dispose();
    await Promise.all([...sessions.values()].map((value) => value.dispose()));
    await server.stop(true);
  }
});
