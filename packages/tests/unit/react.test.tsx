import { expect, test } from "vite-plus/test";
import { renderToString } from "react-dom/server";
import { createORPCClient } from "@orpc/client";
import type { Client } from "@orpc/client";
import { QueryClientProvider, useQuery } from "@loom/core/react";
import { createRpcQuerySession, createRpcLiveMethod } from "@loom/core/query";

test("native React server rendering opens no authenticated connections", () => {
  let requests = 0;
  const session = createRpcQuerySession({
    link: {
      call: async () => {
        requests++;
        throw new Error("Unexpected request during render");
      },
    },
    deployment: "https://api.example.test",
    version: "a".repeat(64),
    identity: { issuer: "test", subject: "alice" },
  });
  const raw = createORPCClient<{
    read: Client<Record<never, never>, undefined, AsyncIteratorObject<number, void, void>, Error>;
  }>(session.link);
  const read = createRpcLiveMethod(raw.read, session, ["read"]);
  function Consumer() {
    return <output>{useQuery(read()).status}</output>;
  }
  try {
    expect(
      renderToString(
        <QueryClientProvider client={session.queryClient}>
          <Consumer />
        </QueryClientProvider>,
      ),
    ).toBe("<output>pending</output>");
    expect(requests).toBe(0);
    expect(() => renderToString(<Consumer />)).toThrow("QueryClient");
  } finally {
    session.dispose();
  }
});
