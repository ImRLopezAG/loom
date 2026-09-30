import { useState } from "react";
import { createRoot } from "react-dom/client";
import { createORPCClient } from "@orpc/client";
import type { Client } from "@orpc/client";
import { QueryClient, QueryClientProvider, useQuery, keepPreviousData } from "@tanstack/react-query";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createRpcTransport, createSearchQueryPlugin, createSearchDataGuard } from "loom/client";

type Selection = {
  columns: { title?: true; done?: true };
  loadedPages: number;
  limit: number;
  where?: { title: { eq: string } };
};
type Window = {
  pages: { title?: string; done?: boolean }[][];
  nextCursor: string | null;
  previousCursor: string | null;
};
type Router = { watch: Client<Record<never, never>, Selection, AsyncIteratorObject<Window, void>, Error> };
const metadata = document.getElementById("search-policy");
if (!metadata?.textContent) throw new Error("Missing generated policy");
const publicNode = JSON.parse(metadata.textContent);
function session(subject: string) {
  const transport = createRpcTransport({
    url: location.origin,
    version: "a".repeat(64),
    getToken: async () => subject,
  });
  const client = createORPCClient<Router>(transport.link);
  const rpc = createTanstackQueryUtils(client, {
    path: [subject],
    plugins: [createSearchQueryPlugin([createSearchDataGuard([subject, "watch"], publicNode)])],
  });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        placeholderData: keepPreviousData,
        initialData: { pages: [[{ title: "wrong default" }]], nextCursor: null, previousCursor: null },
      },
    },
  });
  return { subject, transport, rpc, queryClient };
}
function Search({ rpc }: { rpc: ReturnType<typeof session>["rpc"] }) {
  const [done, setDone] = useState(false);
  const [loadedPages, setLoadedPages] = useState(1);
  const [filtered, setFiltered] = useState(false);
  const input: Selection = {
    columns: done ? { done: true } : { title: true },
    limit: 2,
    loadedPages,
  };
  if (filtered) input.where = { title: { eq: "filtered" } };
  const result = useQuery(rpc.watch.liveOptions({ input, retry: false, placeholderData: keepPreviousData }));
  return (
    <>
      <button onClick={() => setLoadedPages((pages) => pages + 1)}>Load more</button>
      <button onClick={() => setDone(true)}>Done projection</button>
      <button onClick={() => setFiltered(true)}>Filter</button>
      <output data-testid="state">{result.isPlaceholderData ? "placeholder" : result.status}</output>
      <output data-testid="window">{result.data ? JSON.stringify(result.data) : "loading"}</output>
    </>
  );
}
function App() {
  const [current, setCurrent] = useState(() => session("alice"));
  const [active, setActive] = useState(true);
  const dispose = () => {
    current.queryClient.clear();
    current.transport.dispose();
  };
  return (
    <>
      <button
        onClick={() => {
          dispose();
          setCurrent(session("bob"));
        }}
      >
        Switch identity
      </button>
      <button
        onClick={() => {
          dispose();
          setActive(false);
        }}
      >
        Sign out
      </button>
      {active ? (
        <QueryClientProvider key={current.subject} client={current.queryClient}>
          <Search rpc={current.rpc} />
        </QueryClientProvider>
      ) : (
        <p>Signed out</p>
      )}
    </>
  );
}
const root = document.getElementById("root");
if (!root) throw new Error("Missing root");
createRoot(root).render(<App />);
