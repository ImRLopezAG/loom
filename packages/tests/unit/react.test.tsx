import { expect, test } from "vite-plus/test";
import { renderToString } from "react-dom/server";
import { createORPCClient } from "@orpc/client";
import type { Client } from "@orpc/client";
import { QueryClientProvider, useQuery } from "@loom/core/react";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryClient } from "@tanstack/react-query";

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
