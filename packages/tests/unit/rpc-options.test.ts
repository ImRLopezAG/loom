import { describe, expect, it } from "vite-plus/test";
import { createORPCClient } from "@orpc/client";
import type { Client, ClientLink } from "@orpc/client";
import { MutationObserver, QueryClient, QueryObserver, skipToken } from "@tanstack/react-query";
import {
  createRpcQuerySession,
  createRpcQueryMethod,
  createRpcLiveMethod,
  createRpcMutationMethod,
} from "@loom/core/query";

type TestClient = {
  read: Client<Record<never, never>, { id: string }, { title: string }, Error>;
  live: Client<Record<never, never>, { id: string }, AsyncIteratorObject<{ title: string }, void, void>, Error>;
  write: Client<Record<never, never>, { title: string }, string, Error>;
};
function setup(link: ClientLink<Record<never, never>>, subject = "one") {
  const session = createRpcQuerySession({
    link,
    deployment: "https://example.test",
    version: "v1",
    identity: { issuer: "test", subject },
  });
  const raw = createORPCClient<TestClient>(session.link);
  return {
    ...session,
    raw,
    api: {
      read: createRpcQueryMethod(raw.read, session, ["read"]),
      live: createRpcLiveMethod(raw.live, session, ["live"]),
      write: createRpcMutationMethod(raw.write, session, ["write"]),
    },
  };
}
const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 20));

describe("native callable options", () => {
  it("refuses a different QueryClient and keeps upstream empty-stream failures", async () => {
    let calls = 0;
    const session = setup({
      call: async () => {
        calls++;
        return (async function* () {})();
      },
    });
    const other = new QueryClient();
    try {
      await expect(other.fetchQuery(session.api.read({ input: { id: "a" }, retry: false }))).rejects.toThrow(
        "different Loom QueryClient",
      );
      expect(calls).toBe(0);
      await expect(
        session.queryClient.fetchQuery(session.api.live({ input: { id: "a" }, retry: false })),
      ).rejects.toThrow("did not yield");
    } finally {
      other.clear();
      session.dispose();
    }
  });
  it("passes caller options to native observers and supports fetch, prefetch, raw calls and skipToken", async () => {
    let calls = 0;
    const session = setup({
      call: async () => {
        calls++;
        return { title: "server" };
      },
    });
    try {
      const options = session.api.read({
        input: { id: "a" },
        enabled: false,
        staleTime: 60_000,
        retry: false,
        initialData: { title: "initial" },
        select: (value) => value.title,
      });
      const observer = new QueryObserver(session.queryClient, options);
      const unsubscribe = observer.subscribe(() => {});
      expect(observer.getCurrentResult().data).toBe("initial");
      expect(calls).toBe(0);
      await observer.refetch();
      expect(observer.getCurrentResult().data).toBe("server");
      expect(await session.queryClient.fetchQuery(session.api.read({ input: { id: "b" } }))).toEqual({
        title: "server",
      });
      await session.queryClient.prefetchQuery(session.api.read({ input: { id: "c" } }));
      expect(await session.api.read.call({ id: "d" })).toEqual({ title: "server" });
      const skipped = new QueryObserver(session.queryClient, session.api.read({ input: skipToken }));
      const stopSkipped = skipped.subscribe(() => {});
      await tick();
      expect(calls).toBe(4);
      stopSkipped();
      unsubscribe();
    } finally {
      session.dispose();
    }
  });

  it("protects identity, tenant, version and live/finite prefixes even with a custom key", () => {
    const a = setup({ call: async () => null });
    const b = setup({ call: async () => null }, "two");
    try {
      const finite = a.api.read({ input: { id: "a" }, queryKey: ["custom"] }).queryKey;
      const live = a.api.live({ input: { id: "a" }, queryKey: ["custom"] }).queryKey;
      expect(finite).not.toEqual(live);
      expect(finite).not.toEqual(b.api.read({ input: { id: "a" }, queryKey: ["custom"] }).queryKey);
      expect(finite.at(-1)).toEqual(["custom"]);
      // SAFETY: deliberately bypass types to verify JavaScript callers cannot replace transport.
      expect(() => a.api.read({ input: { id: "a" }, queryFn: () => null } as never)).toThrow("native options");
    } finally {
      a.dispose();
      b.dispose();
    }
  });

  it("shares one upstream live stream across observers and clears observed data at disposal", async () => {
    let calls = 0;
    let stopped = 0;
    const session = setup({
      call: async (_path, _input, { signal }) => {
        calls++;
        return (async function* () {
          try {
            yield { title: "private" };
            await new Promise<void>((resolve) => signal?.addEventListener("abort", () => resolve(), { once: true }));
          } finally {
            stopped++;
          }
        })();
      },
    });
    const options = session.api.live({ input: { id: "a" }, retry: false });
    const first = new QueryObserver(session.queryClient, options);
    const second = new QueryObserver(session.queryClient, options);
    const stopA = first.subscribe(() => {});
    const stopB = second.subscribe(() => {});
    await tick();
    expect(calls).toBe(1);
    expect(first.getCurrentResult().data).toEqual({ title: "private" });
    expect(second.getCurrentResult().data).toEqual({ title: "private" });
    session.dispose();
    await tick();
    expect(stopped).toBe(1);
    expect(first.getCurrentResult().data).toBeUndefined();
    expect(session.queryClient.getQueryCache().getAll()).toHaveLength(0);
    expect(() => session.api.read({ input: { id: "a" } })).toThrow();
    stopA();
    stopB();
  });

  it("preserves mutation callbacks and disables retries unless explicitly supplied", async () => {
    const order: string[] = [];
    const session = setup({ call: async () => "saved" });
    try {
      const options = session.api.write({
        onMutate: (input) => {
          order.push(input.title);
          return { previous: "old" };
        },
        onSuccess: (output, _input, context) => {
          order.push(output, context.previous);
        },
        onSettled: () => {
          order.push("settled");
        },
      });
      expect(options.retry).toBe(false);
      const mutation = new MutationObserver(session.queryClient, options);
      await mutation.mutate({ title: "new" });
      expect(order).toEqual(["new", "saved", "old", "settled"]);
      expect(session.api.write({ retry: 2 }).retry).toBe(2);
    } finally {
      session.dispose();
    }
  });
});
