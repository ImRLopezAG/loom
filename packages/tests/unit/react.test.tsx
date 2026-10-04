import { expect, test } from "vite-plus/test";
import { renderToString } from "react-dom/server";
import { createORPCClient } from "@orpc/client";
import type { Client } from "@orpc/client";
import { createKelloReact, QueryClientProvider, useQuery } from "kello/react";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryClient } from "@tanstack/react-query";

test("Kello provider renders its SSR fallback without creating a client or resolving credentials", () => {
  const { KelloProvider, useKello } = createKelloReact<{
    dispose(): void;
    verifySession(): Promise<{ key: string; expiresAt: number }>;
  }>(() => {
    throw new Error("Unexpected client construction during SSR");
  });
  function Consumer() {
    useKello();
    return <span>connected</span>;
  }
  expect(
    renderToString(
      <KelloProvider
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
      </KelloProvider>,
    ),
  ).toBe("<span>snapshot</span>");
  expect(() => renderToString(<Consumer />)).toThrow("KelloProvider");
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

test("external provider hook owns sign-in state and never fetches a token during SSR", () => {
  const { KelloProviderWithAuth } = createKelloReact(() => {
    throw new Error("Unexpected connection during SSR");
  });
  const useAuth = () => ({
    isLoading: false,
    isAuthenticated: true,
    fetchAccessToken: async (_options: { forceRefreshToken: boolean }) => {
      throw new Error("Unexpected token fetch during SSR");
    },
  });
  expect(
    renderToString(
      <KelloProviderWithAuth url="https://example.test" useAuth={useAuth} fallback={<span>Loading</span>}>
        <span>Private</span>
      </KelloProviderWithAuth>,
    ),
  ).toBe("<span>Loading</span>");
});
