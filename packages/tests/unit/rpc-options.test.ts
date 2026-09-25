import { describe, expect, it } from "vite-plus/test";
import { createORPCClient } from "@orpc/client";
import type { Client, ClientLink } from "@orpc/client";
import { createTanstackQueryUtils, OPERATION_CONTEXT_SYMBOL } from "@orpc/tanstack-query";
import { MutationObserver, QueryClient, QueryObserver, skipToken } from "@tanstack/react-query";
import type { RpcCallContext } from "@loom/core/client";

type TestClient = {
  read: Client<RpcCallContext, { id: string }, { title: string }, Error>;
  live: Client<RpcCallContext, undefined, AsyncIteratorObject<{ title: string }, void, void>, Error>;
  write: Client<RpcCallContext, { title: string }, string, Error>;
};
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 20));

describe("native oRPC options", () => {
  it("preserves option overrides, selection, prefetching, skipToken and operation context", async () => {
    const operations: string[] = [];
    const link: ClientLink<RpcCallContext> = {
      async call(_path, _input, options) {
        operations.push(options.context[OPERATION_CONTEXT_SYMBOL]?.type ?? "call");
        return { title: "native" };
      },
    };
    const client = createORPCClient<TestClient>(link);
    const rpc = createTanstackQueryUtils(client);
    const cache = new QueryClient();
    try {
      const options = rpc.read.queryOptions({ input: { id: "one" }, staleTime: Infinity, queryKey: ["custom"] });
      expect(options.queryKey).toEqual(["custom"]);
      await cache.prefetchQuery(options);
      expect(await cache.fetchQuery(options)).toEqual({ title: "native" });
      const observer = new QueryObserver(cache, { ...options, select: (row) => row.title.length });
      expect(observer.getCurrentResult().data).toBe(6);
      const disabled = new QueryObserver(cache, rpc.read.queryOptions({ input: skipToken }));
      const stop = disabled.subscribe(() => {});
      await tick();
      expect(operations).toEqual(["query"]);
      stop();
      await client.read({ id: "raw" });
      expect(operations).toEqual(["query", "call"]);
      expect(
        await cache.fetchQuery(
          rpc.read.queryOptions({ input: { id: "override" }, queryFn: async () => ({ title: "replacement" }) }),
        ),
      ).toEqual({ title: "replacement" });
      expect(operations).toHaveLength(2);
    } finally {
      cache.clear();
    }
  });

  it("shares a stream across observers and cancels it when observers leave", async () => {
    let calls = 0;
    let closed = 0;
    const client = createORPCClient<TestClient>({
      async call(_path, _input, options) {
        expect(options.context[OPERATION_CONTEXT_SYMBOL]?.type).toBe("live");
        calls++;
        return (async function* () {
          try {
            yield { title: "current" };
            await new Promise<void>((resolve) => {
              if (options.signal?.aborted) resolve();
              else options.signal?.addEventListener("abort", () => resolve(), { once: true });
            });
          } finally {
            closed++;
          }
        })();
      },
    });
    const rpc = createTanstackQueryUtils(client);
    const cache = new QueryClient();
    const one = new QueryObserver(cache, rpc.live.liveOptions({ retry: false }));
    const two = new QueryObserver(cache, rpc.live.liveOptions({ retry: false }));
    const stopOne = one.subscribe(() => {});
    const stopTwo = two.subscribe(() => {});
    try {
      await tick();
      expect(calls).toBe(1);
      expect(one.getCurrentResult().data).toEqual({ title: "current" });
      expect(two.getCurrentResult().data).toEqual(one.getCurrentResult().data);
      stopOne();
      await tick();
      expect(closed).toBe(0);
      stopTwo();
      await tick();
      expect(closed).toBe(1);
    } finally {
      stopOne();
      stopTwo();
      cache.clear();
    }
  });

  it("keeps native mutation callbacks and defaults to no retry", async () => {
    let calls = 0;
    const client = createORPCClient<TestClient>({
      async call(_path, _input, options) {
        expect(options.context[OPERATION_CONTEXT_SYMBOL]?.type).toBe("mutation");
        calls++;
        throw new Error("uncertain write");
      },
    });
    const rpc = createTanstackQueryUtils(client);
    const cache = new QueryClient();
    const events: string[] = [];
    const mutation = new MutationObserver(
      cache,
      rpc.write.mutationOptions({
        onMutate: (input) => {
          events.push(input.title);
          return { prior: "before" };
        },
        onError: (error, _input, previous) => {
          events.push(error.message, previous?.prior ?? "missing");
        },
        onSettled: () => {
          events.push("settled");
        },
      }),
    );
    try {
      await expect(mutation.mutate({ title: "attempt" })).rejects.toThrow("uncertain write");
      expect(calls).toBe(1);
      expect(events).toEqual(["attempt", "uncertain write", "before", "settled"]);
    } finally {
      cache.clear();
    }
  });

  it("isolates identities through distinct native QueryClient instances", async () => {
    const client = createORPCClient<TestClient>({ call: async () => ({ title: "Alice private data" }) });
    const options = createTanstackQueryUtils(client).read.queryOptions({ input: { id: "one" } });
    const alice = new QueryClient();
    const bob = new QueryClient();
    try {
      await alice.fetchQuery(options);
      expect(bob.getQueryData(options.queryKey)).toBeUndefined();
      alice.clear();
      expect(alice.getQueryData(options.queryKey)).toBeUndefined();
    } finally {
      alice.clear();
      bob.clear();
    }
  });
});
