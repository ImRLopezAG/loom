import { expect, test } from "bun:test";
import { os } from "@orpc/server";
import type { RouterClient } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { RPCLink } from "@orpc/client/fetch";
import { createORPCClient, RPCSerializer } from "@orpc/client";
import { dehydrate, hydrate, QueryObserver } from "@tanstack/react-query";
import { createRpcQuerySession, createRpcLiveMethod } from "@loom/core/query";

test("SSR consumes one finite native snapshot and hydration attaches one live stream", async () => {
  let calls = 0;
  let closed = 0;
  const router = {
    read: os.handler(async function* ({ signal }) {
      calls++;
      try {
        yield { at: new Date("2026-09-24"), count: 1n };
        await new Promise<void>((resolve) => {
          if (signal?.aborted) resolve();
          else signal?.addEventListener("abort", () => resolve(), { once: true });
        });
      } finally {
        closed++;
      }
    }),
  };
  const serializer = new RPCSerializer({ omitUndefinedProperties: false });
  const handler = new RPCHandler(router, { serializer });
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      const result = await handler.handle(request);
      return result.response ?? new Response(null, { status: 404 });
    },
  });
  function session() {
    const binding = createRpcQuerySession({
      link: new RPCLink({ origin: server.url.origin, serializer }),
      identity: null,
      deployment: server.url.origin,
      version: "v1",
    });
    const raw = createORPCClient<RouterClient<typeof router>>(binding.link);
    return { ...binding, read: createRpcLiveMethod(raw.read, binding, ["read"]) };
  }
  const ssr = session();
  const browser = session();
  try {
    const value = await ssr.queryClient.fetchQuery(ssr.read.snapshot());
    expect(value).toEqual({ at: new Date("2026-09-24"), count: 1n });
    // Use the native serializer for hydration too; plain JSON loses bigint/Date.
    const serialized = JSON.stringify(serializer.serialize(dehydrate(ssr.queryClient)));
    // SAFETY: this fixture round-trips the state just produced by dehydrate above.
    const state = serializer.deserialize(JSON.parse(serialized)) as ReturnType<typeof dehydrate>;
    hydrate(browser.queryClient, state);
    ssr.dispose();
    for (let attempt = 0; attempt < 20 && closed !== 1; attempt++)
      await new Promise((resolve) => setTimeout(resolve, 10));
    expect(closed).toBe(1);
    expect(calls).toBe(1);
    const first = new QueryObserver(browser.queryClient, browser.read({ retry: false }));
    const second = new QueryObserver(browser.queryClient, browser.read({ retry: false }));
    expect(first.getCurrentResult().data).toEqual(value);
    const stopOne = first.subscribe(() => {});
    const stopTwo = second.subscribe(() => {});
    for (let attempt = 0; attempt < 20 && calls !== 2; attempt++)
      await new Promise((resolve) => setTimeout(resolve, 10));
    expect(calls).toBe(2);
    expect(second.getCurrentResult().data).toEqual(value);
    stopOne();
    stopTwo();
  } finally {
    ssr.dispose();
    browser.dispose();
    await server.stop(true);
  }
}, 5000);
