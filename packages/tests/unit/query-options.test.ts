import { expect, test } from "vite-plus/test";
import * as v from "valibot";
import type { ServerMessage } from "@loom/core/client";
import { MutationObserver, QueryObserver } from "@tanstack/react-query";
import { createClient, createLiveQueryClient } from "@loom/core/client";
import { createLoomQueryClient, createQueryMethod, createMutationMethod } from "@loom/core/query";

const reference = { name: "tasks:list", kind: "query", visibility: "public", version: "a".repeat(64) } as const;
test("direct methods accept native options and execute finite queries", async () => {
  const client = createClient({
    url: "https://api.example.test",
    fetch: async () => Response.json({ protocol: 1, ok: true, requestId: "test", value: ["task"] }),
  });
  const live = createLiveQueryClient({
    client,
    url: "https://api.example.test",
    deployment: "test",
    identityKey: null,
  });
  const queryClient = createLoomQueryClient({ client, live });
  const list = createQueryMethod<null, string[]>(reference);
  try {
    const options = list({ input: null, live: false, staleTime: 1234, select: (rows) => rows.length });
    expect(options.staleTime).toBe(1234);
    expect(await queryClient.fetchQuery(options)).toEqual(["task"]);
    const observer = new QueryObserver(queryClient, options);
    expect(observer.getCurrentResult().data).toBe(1);
    expect(queryClient.getQueryData(options.queryKey)).toEqual(["task"]);
    live.setIdentity("other");
    expect(queryClient.getQueryData(options.queryKey)).toBeUndefined();
    await expect(queryClient.fetchQuery(options)).rejects.toThrow("identity");
  } finally {
    queryClient.dispose();
    live.stop();
  }
});

test("mutation retries reuse a key only within one mutate execution", async () => {
  const keys: string[] = [];
  const client = createClient({
    url: "https://api.example.test",
    maxAttempts: 1,
    fetch: async (_url, init) => {
      keys.push(JSON.parse(v.parse(v.string(), init.body)).idempotencyKey);
      return keys.length % 2 === 1
        ? Response.json({ protocol: 1, ok: false, requestId: "test", error: { code: "TRY_AGAIN", message: "retry" } })
        : Response.json({ protocol: 1, ok: true, requestId: "test", value: "saved" });
    },
  });
  const live = createLiveQueryClient({
    client,
    url: "https://api.example.test",
    deployment: "test",
    identityKey: null,
  });
  const queryClient = createLoomQueryClient({ client, live });
  const save = createMutationMethod<{ title: string }, string>({ ...reference, kind: "mutation" });
  try {
    const observer = new MutationObserver(queryClient, save({ retry: 1, retryDelay: 0 }));
    expect(await observer.mutate({ title: "one" })).toBe("saved");
    expect(await observer.mutate({ title: "one" })).toBe("saved");
    expect(keys[0]).toBe(keys[1]);
    expect(keys[2]).toBe(keys[3]);
    expect(keys[0]).not.toBe(keys[2]);
  } finally {
    queryClient.dispose();
    live.stop();
  }
});

test("live options share a stream, replace snapshots and release the final observer", async () => {
  let publish: ((event: MessageEvent<string>) => void) | null = null;
  const sent: string[] = [];
  let closed = 0;
  const client = createClient({ url: "https://api.example.test" });
  const live = createLiveQueryClient({
    client: { ticket: async () => ({ ticket: "a".repeat(43), expiresAt: Date.now() / 1000 + 30 }) },
    url: "https://api.example.test",
    deployment: "test",
    identityKey: "alice",
    socket: () => ({
      readyState: 1,
      bufferedAmount: 0,
      onclose: null,
      onerror: null,
      get onmessage() {
        return publish;
      },
      set onmessage(value) {
        publish = value;
      },
      send: (value) => {
        sent.push(value);
      },
      close: () => {
        closed++;
      },
    }),
  });
  const queryClient = createLoomQueryClient({ client, live });
  const list = createQueryMethod<null, string[]>(reference);
  const options = list({ input: null });
  const first = new QueryObserver(queryClient, options);
  const second = new QueryObserver(queryClient, options);
  const stopFirst = first.subscribe(() => {});
  const stopSecond = second.subscribe(() => {});
  try {
    await expect.poll(() => publish).not.toBeNull();
    const send = (value: ServerMessage) => {
      publish?.(new MessageEvent("message", { data: JSON.stringify(value) }));
    };
    send({ protocol: 1, type: "ready" });
    expect(sent).toHaveLength(1);
    const id = JSON.parse(sent[0] ?? "{}").id;
    send({ protocol: 1, type: "result", id, sequence: 1, ok: true, requestId: "test", value: ["one"] });
    await expect.poll(() => first.getCurrentResult().data).toEqual(["one"]);
    send({ protocol: 1, type: "result", id, sequence: 2, ok: true, requestId: "test", value: ["two"] });
    await expect.poll(() => second.getCurrentResult().data).toEqual(["two"]);
    expect(first.getCurrentResult().data).toEqual(["two"]);
    stopFirst();
    expect(closed).toBe(0);
    stopSecond();
    await expect.poll(() => closed).toBe(1);
    const third = new QueryObserver(queryClient, options);
    const stopThird = third.subscribe(() => {});
    try {
      await expect.poll(() => publish).not.toBeNull();
      send({ protocol: 1, type: "ready" });
      await expect.poll(() => sent.length).toBe(2);
      live.setIdentity("bob");
      expect(third.getCurrentResult().data).toBeUndefined();
      expect(queryClient.getQueryData(options.queryKey)).toBeUndefined();
    } finally {
      stopThird();
    }
  } finally {
    stopFirst();
    stopSecond();
    queryClient.dispose();
    live.stop();
  }
});

test("disabled queries stay idle, and a late mutation cannot succeed after an identity switch", async () => {
  let release: (() => void) | undefined;
  let started = false;
  let succeeded = false;
  const client = createClient({
    url: "https://api.example.test",
    fetch: async () => {
      started = true;
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return Response.json({ protocol: 1, ok: true, requestId: "test", value: "alice-private" });
    },
  });
  const live = createLiveQueryClient({
    client,
    url: "https://api.example.test",
    deployment: "test",
    identityKey: null,
  });
  const queryClient = createLoomQueryClient({ client, live });
  const list = createQueryMethod<null, string>(reference);
  const observer = new QueryObserver(queryClient, list({ input: null, enabled: false }));
  const unsubscribe = observer.subscribe(() => {});
  try {
    expect(observer.getCurrentResult().fetchStatus).toBe("idle");
    expect(started).toBe(false);
    const save = createMutationMethod<null, string>({ ...reference, kind: "mutation" });
    const mutation = new MutationObserver(
      queryClient,
      save({
        onSuccess: () => {
          succeeded = true;
        },
      }),
    );
    const pending = mutation.mutate(null);
    const rejected = expect(pending).rejects.toThrow("cancelled");
    await expect.poll(() => started).toBe(true);
    live.setIdentity("bob");
    release?.();
    await rejected;
    expect(succeeded).toBe(false);
    expect(queryClient.getMutationCache().getAll()).toHaveLength(0);
  } finally {
    release?.();
    unsubscribe();
    queryClient.dispose();
    live.stop();
  }
});
