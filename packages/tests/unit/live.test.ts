import { expect, test } from "vite-plus/test";
import { createLiveQueryClient } from "@loom/core/client";
import type { FunctionReference, LiveSocket, ServerMessage } from "@loom/core/client";

class Socket implements LiveSocket {
  readyState = 1;
  bufferedAmount = 0;
  onmessage: LiveSocket["onmessage"] = null;
  onclose: LiveSocket["onclose"] = null;
  onerror: LiveSocket["onerror"] = null;
  sent: string[] = [];
  send(data: string) {
    this.sent.push(data);
  }
  closed = false;
  close() {
    this.closed = true;
  }
  message(value: ServerMessage) {
    this.onmessage?.(new MessageEvent("message", { data: JSON.stringify(value) }));
  }
}
const reference: FunctionReference<"query", "public", { filter: string }, { count: number }> = {
  kind: "query",
  visibility: "public",
  name: "tasks:count",
  version: "a".repeat(64),
};

test("live stores share subscriptions, reject old sequences and release the last observer", async () => {
  const socket = new Socket();
  const client = createLiveQueryClient({
    url: "https://api.example.test",
    deployment: "test",
    identityKey: "alice",
    client: { ticket: async () => ({ ticket: "a".repeat(43), expiresAt: Date.now() / 1000 + 30 }) },
    socket: () => socket,
  });
  const first = client.query(reference, { filter: "open" });
  const second = client.query(reference, { filter: "open" });
  let changes = 0;
  const stopFirst = first.subscribe(() => changes++);
  const stopSecond = second.subscribe(() => changes++);
  try {
    await Promise.resolve();
    await Promise.resolve();
    socket.message({ protocol: 1, type: "ready" });
    expect(socket.sent).toHaveLength(1);
    const sent = JSON.parse(socket.sent[0] ?? "{}");
    socket.message({
      protocol: 1,
      type: "result",
      id: sent.id,
      sequence: 1,
      ok: true,
      requestId: "test",
      value: { count: 2 },
    });
    expect(first.getSnapshot()).toEqual({ status: "success", value: { count: 2 } });
    expect(second.getSnapshot()).toBe(first.getSnapshot());
    const notified = changes;
    socket.message({
      protocol: 1,
      type: "result",
      id: sent.id,
      sequence: 1,
      ok: true,
      requestId: "test",
      value: { count: 1 },
    });
    expect(changes).toBe(notified);
    expect(Object.isFrozen(first.getSnapshot())).toBe(true);
    stopFirst();
    expect(socket.sent).toHaveLength(1);
    stopSecond();
    expect(socket.closed).toBe(true);
  } finally {
    stopFirst();
    stopSecond();
    client.stop();
  }
});

test("identity transition clears all live results before notifying observers and ignores late frames", async () => {
  const sockets: Socket[] = [];
  const client = createLiveQueryClient({
    url: "https://api.example.test",
    deployment: "test",
    identityKey: "alice",
    client: { ticket: async () => ({ ticket: "a".repeat(43), expiresAt: Date.now() / 1000 + 30 }) },
    socket: () => {
      const socket = new Socket();
      sockets.push(socket);
      return socket;
    },
  });
  const first = client.query(reference, { filter: "one" });
  const second = client.query(reference, { filter: "two" });
  const snapshots: string[] = [];
  const stopFirst = first.subscribe(() => snapshots.push(second.getSnapshot().status));
  const stopSecond = second.subscribe(() => {});
  try {
    await Promise.resolve();
    await Promise.resolve();
    const socket = sockets[0];
    if (!socket) throw new Error("Missing socket");
    socket.message({ protocol: 1, type: "ready" });
    for (const sent of socket.sent)
      socket.message({
        protocol: 1,
        type: "result",
        id: JSON.parse(sent).id,
        sequence: 1,
        ok: true,
        requestId: "test",
        value: { count: 4 },
      });
    const late = socket.onmessage;
    client.setIdentity(null);
    expect(first.getSnapshot()).toEqual({ status: "signed-out" });
    expect(second.getSnapshot()).toEqual({ status: "signed-out" });
    expect(snapshots.at(-1)).toBe("signed-out");
    late?.(new MessageEvent("message", { data: socket.sent[0] ?? "" }));
    expect(first.getSnapshot()).toEqual({ status: "signed-out" });
    client.setIdentity("bob");
    expect(first.getSnapshot()).toEqual({ status: "loading" });
  } finally {
    stopFirst();
    stopSecond();
    client.stop();
  }
});

test("live capacity counts unique active queries and preserves server errors", async () => {
  const socket = new Socket();
  let opened = 0;
  const client = createLiveQueryClient({
    url: "https://api.example.test",
    deployment: "test",
    identityKey: "alice",
    maxSubscriptions: 1,
    client: { ticket: async () => ({ ticket: "a".repeat(43), expiresAt: Date.now() / 1000 + 30 }) },
    socket: () => {
      opened++;
      return socket;
    },
  });
  const first = client.query(reference, { filter: "one" });
  const second = client.query(reference, { filter: "two" });
  await Promise.resolve();
  expect(opened).toBe(0);
  expect(() => client.query(reference, { filter: "x".repeat(65536) })).toThrow("message limit");
  const unsubscribe = first.subscribe(() => {});
  try {
    expect(() => second.subscribe(() => {})).toThrow("Too many active live queries");
    await Promise.resolve();
    await Promise.resolve();
    socket.message({ protocol: 1, type: "ready" });
    const { id } = JSON.parse(socket.sent[0] ?? "{}");
    socket.message({
      protocol: 1,
      type: "result",
      id,
      sequence: 1,
      ok: false,
      requestId: "denied",
      error: { code: "FORBIDDEN", message: "Denied" },
    });
    socket.message({ protocol: 1, type: "closed", id, reason: "QUERY_ERROR" });
    expect(first.getSnapshot()).toMatchObject({ status: "error", error: { code: "FORBIDDEN", requestId: "denied" } });
    unsubscribe();
    const stopSecond = second.subscribe(() => {});
    expect(second.getSnapshot()).toEqual({ status: "loading" });
    stopSecond();
  } finally {
    unsubscribe();
    client.stop();
  }
});

test("reentrant live observers cannot restore results after sign-out", async () => {
  const socket = new Socket();
  const client = createLiveQueryClient({
    url: "https://api.example.test",
    deployment: "test",
    identityKey: "alice",
    client: { ticket: async () => ({ ticket: "a".repeat(43), expiresAt: Date.now() / 1000 + 30 }) },
    socket: () => socket,
  });
  const store = client.query(reference, { filter: "one" });
  const first = store.subscribe(() => {
    if (store.getSnapshot().status === "success") client.setIdentity(null);
  });
  const observed: string[] = [];
  const second = store.subscribe(() => observed.push(store.getSnapshot().status));
  try {
    await Promise.resolve();
    await Promise.resolve();
    socket.message({ protocol: 1, type: "ready" });
    const { id } = JSON.parse(socket.sent[0] ?? "{}");
    socket.message({ protocol: 1, type: "result", id, sequence: 1, ok: true, requestId: "test", value: { count: 1 } });
    expect(observed).not.toContain("success");
    expect(observed.at(-1)).toBe("signed-out");
  } finally {
    first();
    second();
    client.stop();
  }
});

test("live definitions capture arguments and sequence gaps terminate only the affected subscription", async () => {
  const socket = new Socket();
  const client = createLiveQueryClient({
    url: "https://api.example.test",
    deployment: "test",
    identityKey: "alice",
    client: { ticket: async () => ({ ticket: "a".repeat(43), expiresAt: Date.now() / 1000 + 30 }) },
    socket: () => socket,
  });
  const args = { filter: "one" };
  const store = client.query(reference, args);
  args.filter = "changed";
  const observer = () => {};
  const first = store.subscribe(observer);
  const second = store.subscribe(observer);
  try {
    await Promise.resolve();
    await Promise.resolve();
    socket.message({ protocol: 1, type: "ready" });
    const sent = JSON.parse(socket.sent[0] ?? "{}");
    expect(sent.args).toEqual({ filter: "one" });
    first();
    expect(socket.closed).toBe(false);
    socket.message({
      protocol: 1,
      type: "result",
      id: sent.id,
      sequence: 2,
      ok: true,
      requestId: "test",
      value: { count: 9 },
    });
    expect(store.getSnapshot()).toMatchObject({ status: "error", error: { code: "SEQUENCE_GAP" } });
    expect(JSON.parse(socket.sent[1] ?? "{}")).toEqual({ protocol: 1, type: "unsubscribe", id: sent.id });
    socket.message({
      protocol: 1,
      type: "result",
      id: sent.id,
      sequence: 1,
      ok: true,
      requestId: "late",
      value: { count: 1 },
    });
    expect(store.getSnapshot()).toMatchObject({ status: "error", error: { code: "SEQUENCE_GAP" } });
  } finally {
    first();
    second();
    client.stop();
  }
});
