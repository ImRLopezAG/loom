import { expect, test } from "vite-plus/test";
import { renderToString } from "react-dom/server";
import { createClient, createLiveQueryClient } from "@loom/core/client";
import { createLoomQueryClient, LoomProvider, useQuery } from "@loom/core/react";

import { createQueryMethod } from "@loom/core/query";

const reference = { name: "tasks:count", kind: "query", visibility: "public", version: "a".repeat(64) } as const;
function Consumer() {
  const result = useQuery(createQueryMethod(reference)({ input: null }));
  return <output>{result.status}</output>;
}
test("React server rendering stays deterministic and opens no authenticated connections", () => {
  let requests = 0;
  const client = createClient({
    url: "https://api.example.test",
    getAuth: async () => {
      requests++;
      return null;
    },
  });
  const live = createLiveQueryClient({
    url: "https://api.example.test",
    client,
    deployment: "test",
    identityKey: "alice",
  });
  const queryClient = createLoomQueryClient({ client, live });
  try {
    expect(
      renderToString(
        <LoomProvider client={client} live={live} queryClient={queryClient}>
          <Consumer />
        </LoomProvider>,
      ),
    ).toBe("<output>pending</output>");
    live.setIdentity(null);
    expect(
      renderToString(
        <LoomProvider client={client} live={live} queryClient={queryClient}>
          <Consumer />
        </LoomProvider>,
      ),
    ).toBe("<output>pending</output>");
    expect(requests).toBe(0);
  } finally {
    live.stop();
  }
});
test("React hooks report a missing provider", () => {
  expect(() => renderToString(<Consumer />)).toThrow("QueryClient");
});
