import { expect, test } from "vite-plus/test";
import { renderToString } from "react-dom/server";
import { createORPCClient } from "@orpc/client";
import type { Client } from "@orpc/client";
import { createLoomReact, QueryClientProvider, useQuery } from "@loom/core/react";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryClient } from "@tanstack/react-query";

test("Loom provider renders its SSR fallback without creating a client or resolving credentials", () => {
  const { LoomProvider, useLoom } = createLoomReact<{ dispose(): void }>(() => {
    throw new Error("Unexpected client construction during SSR");
  });
  function Consumer() {
    useLoom();
    return <span>connected</span>;
  }
  expect(
    renderToString(
      <LoomProvider
        url="https://example.test"
        onSessionChange={() => {
          throw new Error("Unexpected session change during SSR");
        }}
        auth={{
          sessionKey: "owner",
          getToken: async () => {
            throw new Error("Unexpected credential read");
          },
        }}
        fallback={<span>snapshot</span>}
      >
        <Consumer />
      </LoomProvider>,
    ),
  ).toBe("<span>snapshot</span>");
  expect(() => renderToString(<Consumer />)).toThrow("LoomProvider");
});

test("native React server rendering opens no authenticated connections", () => {
  let requests = 0;
  const queryClient = new QueryClient();
  const link = {
    call: async () => {
      requests++;
      throw new Error("Unexpected request during render");
    },
  };
  const raw = createORPCClient<{
    read: Client<Record<never, never>, undefined, AsyncIteratorObject<number, void, void>, Error>;
  }>(link);
  const rpc = createTanstackQueryUtils(raw);
  function Consumer() {
    return <output>{useQuery(rpc.read.liveOptions()).status}</output>;
  }
  try {
    expect(
      renderToString(
        <QueryClientProvider client={queryClient}>
          <Consumer />
        </QueryClientProvider>,
      ),
    ).toBe("<output>pending</output>");
    expect(requests).toBe(0);
    expect(() => renderToString(<Consumer />)).toThrow("QueryClient");
  } finally {
    queryClient.clear();
  }
});
