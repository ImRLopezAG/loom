import assert from "node:assert/strict";
import { test } from "bun:test";
import { setTimeout } from "node:timers/promises";
import { createProjectProcedures, defineSchema } from "@loom/core/server";
import { RPCLink } from "@orpc/client/fetch";
import { RPCLink as WebSocketLink } from "@orpc/client/websocket";
import { startDevelopmentServer } from "@loom/tooling";
import type { DevelopmentServerRuntime } from "@loom/tooling";

function fixture(value: string, beforeStop = async () => {}) {
  const entered = Promise.withResolvers<void>();
  const finish = Promise.withResolvers<void>();
  let hold = false;
  let stops = 0;
  const { procedure } = createProjectProcedures(defineSchema(() => ({})));
  const router = {
    tasks: {
      list: procedure.handler(async () => {
        if (hold) {
          entered.resolve();
          await finish.promise;
        }
        return value;
      }),
    },
  };
  const runtime: DevelopmentServerRuntime = {
    auth: {
      origins: ["http://localhost:4321"],
      allowAnonymous: true,
      verify: async () => {
        throw new Error("No token");
      },
    },
    version: "a".repeat(64),
    router,
    snapshots: router,
    tickets: {
      issue: async () => ({ ticket: "t".repeat(43), expiresAt: Math.floor(Date.now() / 1000) + 60 }),
      redeem: async () => ({
        identity: { issuer: "fixture", subject: "alice" },
        expiresAt: Math.floor(Date.now() / 1000) + 60,
      }),
    },
    realtime: { heartbeatMs: 1000, maxBufferedBytes: 1024 },
    stop: async () => {
      stops++;
      await beforeStop();
    },
  };
  return {
    runtime,
    entered,
    finish,
    stops: () => stops,
    hold: () => {
      hold = true;
    },
  };
}
async function read(url: URL) {
  const link = new RPCLink({
    origin: url.origin,
    url: "/api/loom/rpc",
    headers: { "x-loom-protocol": "loom-orpc-2", "x-loom-version": "a".repeat(64) },
  });
  return { value: await link.call(["tasks", "list"], undefined, { context: {} }) };
}

test("development publication commits only validated candidates and preserves installation after publication cleanup fails", async () => {
  const first = fixture("first");
  const server = await startDevelopmentServer(first.runtime, { port: 0 });
  try {
    const rejected = fixture("rejected");
    await assert.rejects(
      server.replace(rejected.runtime, undefined, async () => {
        throw new Error("Publication refused");
      }),
      /Publication refused/,
    );
    assert.equal(rejected.stops(), 1);
    assert.equal((await read(server.url)).value, "first");
    const second = fixture("second");
    const entered = Promise.withResolvers<void>();
    const publish = Promise.withResolvers<void>();
    const cancellation = new AbortController();
    const replacement = server.replace(second.runtime, cancellation.signal, async (install) => {
      entered.resolve();
      await publish.promise;
      install();
      cancellation.abort();
      throw new Error("Publication cleanup failed");
    });
    const failed = assert.rejects(replacement, /Publication cleanup failed/);
    await entered.promise;
    assert.equal((await read(server.url)).value, "first");
    const concurrent = fixture("concurrent");
    await assert.rejects(server.replace(concurrent.runtime), /replacement/);
    assert.equal(concurrent.stops(), 1);
    publish.resolve();
    await failed;
    assert.equal((await read(server.url)).value, "second");
    assert.equal(first.stops(), 1);
    assert.equal(second.stops(), 0);
    const disposing = Promise.withResolvers<void>();
    const dispose = Promise.withResolvers<void>();
    const incomplete = fixture("incomplete", async () => {
      disposing.resolve();
      await dispose.promise;
    });
    let lateInstall = () => {};
    const incompleteFailure = assert.rejects(
      server.replace(incomplete.runtime, undefined, async (install) => {
        lateInstall = install;
      }),
      /did not install/,
    );
    await disposing.promise;
    try {
      lateInstall();
    } finally {
      dispose.resolve();
    }
    await incompleteFailure;
    assert.equal(incomplete.stops(), 1);
    assert.equal((await read(server.url)).value, "second");
  } finally {
    await server.stop();
  }
});

test("shutdown drains publication and closes a candidate committed during shutdown", async () => {
  const first = fixture("first");
  const second = fixture("second");
  const server = await startDevelopmentServer(first.runtime, { port: 0 });
  const entered = Promise.withResolvers<void>();
  const publish = Promise.withResolvers<void>();
  const replacement = server.replace(second.runtime, undefined, async (install) => {
    entered.resolve();
    await publish.promise;
    install();
  });
  await entered.promise;
  let stopped = false;
  const stopping = server.stop().then(() => {
    stopped = true;
  });
  try {
    await setTimeout(10);
    assert.equal(stopped, false);
  } finally {
    publish.resolve();
    await Promise.all([replacement, stopping]);
  }
  assert.equal(first.stops(), 1);
  assert.equal(second.stops(), 1);
});

test("development replacement preserves the listener, refuses stale candidates and drains old generations", async () => {
  const first = fixture("first");
  const second = fixture("second");
  const server = await startDevelopmentServer(first.runtime, { port: 0 });
  let socket: WebSocket | undefined;
  try {
    assert.equal((await read(server.url)).value, "first");
    const invalid = fixture("invalid");
    await assert.rejects(
      server.replace({ ...invalid.runtime, auth: { ...invalid.runtime.auth, origins: ["invalid"] } }),
    );
    assert.equal(invalid.stops(), 1);
    assert.equal((await read(server.url)).value, "first");
    const url = new URL("/api/loom/socket", server.url);
    url.protocol = "ws:";
    // SAFETY: this Bun-only integration uses the documented headers overload hidden by lib.dom.
    const BunWebSocket = WebSocket as typeof WebSocket & (new (url: URL, options: Bun.WebSocketOptions) => WebSocket);
    socket = new BunWebSocket(url, {
      protocols: ["loom.orpc.2", `loom.version.${"a".repeat(64)}`, `loom.ticket.${"t".repeat(43)}`],
      headers: { origin: "http://localhost:4321" },
    });
    const opened = Promise.withResolvers<void>();
    const closed = Promise.withResolvers<void>();
    socket.onopen = () => opened.resolve();
    socket.onerror = () => opened.reject(new Error("Socket failed"));
    socket.onclose = () => closed.resolve();
    await opened.promise;
    first.hold();
    const pending = read(server.url).catch(() => null);
    await first.entered.promise;
    const replaced = server.replace(second.runtime);
    assert.equal((await read(server.url)).value, "second");
    await closed.promise;
    assert.equal(first.stops(), 0);
    const concurrent = fixture("concurrent");
    await assert.rejects(server.replace(concurrent.runtime), /replacement/);
    assert.equal(concurrent.stops(), 1);
    first.finish.resolve();
    assert.equal((await replaced).retired, true);
    await pending;
    assert.equal(first.stops(), 1);
    socket = new BunWebSocket(url, {
      protocols: ["loom.orpc.2", `loom.version.${"a".repeat(64)}`, `loom.ticket.${"t".repeat(43)}`],
      headers: { origin: "http://localhost:4321" },
    });
    const reopened = Promise.withResolvers<void>();
    socket.onopen = () => reopened.resolve();
    socket.onerror = () => reopened.reject(new Error("Socket failed"));
    await reopened.promise;
    const connected = socket;
    const link = new WebSocketLink({ connect: () => connected });
    assert.equal(await link.call(["tasks", "list"], undefined, { context: {} }), "second");
    const stale = fixture("stale");
    await assert.rejects(server.replace(stale.runtime, AbortSignal.abort(new Error("Stale"))), /Stale/);
    assert.equal(stale.stops(), 1);
    await assert.rejects(server.replace(second.runtime), /owned/);
    assert.equal(second.stops(), 0);
    assert.equal((await read(server.url)).value, "second");
    await server.stop();
    assert.equal(second.stops(), 1);
    const late = fixture("late");
    await assert.rejects(server.replace(late.runtime), /stopped/);
    assert.equal(late.stops(), 1);
  } finally {
    first.finish.resolve();
    socket?.close();
    await server.stop();
  }
});

test("a failed retirement reports installed state and refuses another replacement", async () => {
  const first = fixture("first", async () => {
    throw new Error("secret cleanup failure");
  });
  const second = fixture("second");
  const server = await startDevelopmentServer(first.runtime, { port: 0 });
  try {
    assert.deepEqual(await server.replace(second.runtime), { retired: false });
    assert.equal((await read(server.url)).value, "second");
    const third = fixture("third");
    await assert.rejects(server.replace(third.runtime), /retirement/);
    assert.equal(third.stops(), 1);
    await assert.rejects(server.stop(), new Error("Development runtime cleanup failed"));
    assert.equal(first.stops(), 1);
    assert.equal(second.stops(), 1);
  } finally {
    await server.stop().catch(() => {});
  }
});

test("server shutdown drains rejected candidates and surfaces cleanup failure", async () => {
  const first = fixture("first");
  const entered = Promise.withResolvers<void>();
  const finish = Promise.withResolvers<void>();
  const rejected = fixture("rejected", async () => {
    entered.resolve();
    await finish.promise;
  });
  const server = await startDevelopmentServer(first.runtime, { port: 0 });
  const discarded = assert.rejects(server.replace(rejected.runtime, AbortSignal.abort(new Error("Stale"))), /Stale/);
  let completed = false;
  try {
    await entered.promise;
    const stopped = server.stop().then(() => {
      completed = true;
    });
    await setTimeout(10);
    assert.equal(completed, false);
    finish.resolve();
    await Promise.all([stopped, discarded]);
    assert.equal(rejected.stops(), 1);
  } finally {
    finish.resolve();
    await discarded;
    await server.stop();
  }
  const active = fixture("active");
  const failing = fixture("failing", async () => {
    throw new Error("secret cleanup failure");
  });
  const failedServer = await startDevelopmentServer(active.runtime, { port: 0 });
  try {
    await assert.rejects(
      failedServer.replace(failing.runtime, AbortSignal.abort()),
      new Error("Development runtime cleanup failed"),
    );
    assert.equal((await read(failedServer.url)).value, "active");
    await assert.rejects(failedServer.stop(), new Error("Development runtime cleanup failed"));
  } finally {
    await failedServer.stop().catch(() => {});
  }
});

test("shutdown during replacement drains both runtime generations", async () => {
  const first = fixture("first");
  const second = fixture("second");
  const server = await startDevelopmentServer(first.runtime, { port: 0 });
  first.hold();
  const pending = read(server.url).catch(() => null);
  try {
    await first.entered.promise;
    const retiring = server.replace(second.runtime);
    let completed = false;
    const stopped = server.stop().then(() => {
      completed = true;
    });
    await setTimeout(10);
    assert.equal(completed, false);
    first.finish.resolve();
    await Promise.all([retiring, stopped, pending]);
    assert.equal(first.stops(), 1);
    assert.equal(second.stops(), 1);
  } finally {
    first.finish.resolve();
    await pending;
    await server.stop();
  }
});
