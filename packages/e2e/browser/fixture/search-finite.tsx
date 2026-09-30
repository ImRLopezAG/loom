import { Suspense, useState } from "react";
import { createRoot } from "react-dom/client";
import { createORPCClient } from "@orpc/client";
import type { Client } from "@orpc/client";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import {
  QueryClient,
  QueryClientProvider,
  useQuery,
  useInfiniteQuery,
  useSuspenseQuery,
  keepPreviousData,
} from "@tanstack/react-query";
import { createRpcHttpTransport, createSearchDataGuard, createSearchQueryPlugin } from "loom/client";
type Input = {
  columns: { title?: true; done?: true };
  limit: number;
  cursor?: string | null;
  direction?: "forward" | "backward";
};
type Page = { rows: { title?: string; done?: boolean }[]; nextCursor: string | null; previousCursor: string | null };
type Router = { list: Client<Record<never, never>, Input, Page, Error> };
const metadata = document.getElementById("search-policy");
if (!metadata?.textContent) throw new Error("Missing policy");
const transport = createRpcHttpTransport({
  url: location.origin,
  version: "a".repeat(64),
  getToken: async () => "alice",
});
const rpc = createTanstackQueryUtils(createORPCClient<Router>(transport.link), {
  path: ["alice"],
  plugins: [createSearchQueryPlugin([createSearchDataGuard(["alice", "list"], JSON.parse(metadata.textContent))])],
});
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      placeholderData: keepPreviousData,
      initialData: { rows: [{ title: "wrong inherited default" }], nextCursor: null, previousCursor: null },
    },
  },
});
function Finite() {
  const [done, setDone] = useState(false);
  const result = useQuery(
    rpc.list.queryOptions({ input: { columns: done ? { done: true } : { title: true }, limit: 2 } }),
  );
  return (
    <>
      <button onClick={() => setDone(true)}>Done projection</button>
      <output data-testid="finite">{result.data ? JSON.stringify(result.data.rows) : "loading"}</output>
    </>
  );
}
function Pages() {
  const result = useInfiniteQuery(
    rpc.list.infiniteOptions({
      input: (page: { cursor: string | null; direction: "forward" | "backward" }) => ({
        columns: { title: true },
        limit: 2,
        ...page,
      }),
      initialPageParam: { cursor: "1", direction: "forward" as const },
      getNextPageParam: (page) =>
        page.nextCursor === null ? undefined : { cursor: page.nextCursor, direction: "forward" as const },
      getPreviousPageParam: (page) =>
        page.previousCursor === null ? undefined : { cursor: page.previousCursor, direction: "backward" as const },
      retry: 1,
      retryDelay: 10,
    }),
  );
  return (
    <>
      <output data-testid="pages">
        {result.data ? JSON.stringify(result.data.pages.flatMap((page) => page.rows)) : "loading"}
      </output>
      <button
        disabled={!result.hasPreviousPage || result.isFetchingPreviousPage}
        onClick={() => void result.fetchPreviousPage()}
      >
        Load previous
      </button>
      <button disabled={!result.hasNextPage || result.isFetchingNextPage} onClick={() => void result.fetchNextPage()}>
        Load next
      </button>
    </>
  );
}
function SuspenseResult() {
  const result = useSuspenseQuery(
    rpc.list.queryOptions({ input: { columns: { title: true }, limit: 1, cursor: "0" } }),
  );
  return <output data-testid="suspense">{result.data.rows[0]?.title}</output>;
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(
  <QueryClientProvider client={queryClient}>
    <Finite />
    <Pages />
    <Suspense fallback={<p>Suspense loading</p>}>
      <SuspenseResult />
    </Suspense>
  </QueryClientProvider>,
);
