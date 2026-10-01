import { useInfiniteQuery, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { createLoomReact } from "loom/react";
import { createClient } from "./loom/_generated/api";
import { taskSelection } from "./search-selection";

export const { LoomProviderWithAuth, useLoom } = createLoomReact(createClient);

export function FiniteTasks() {
  const { rpc } = useLoom();
  const result = useQuery(rpc.search.list.queryOptions({ input: taskSelection }));
  if (result.isPending) return <p>Loading tasks…</p>;
  if (result.error) return <p role="alert">Could not load tasks.</p>;
  return <p>{result.data.rows.map((task) => task.title).join(", ")}</p>;
}

export function SuspenseTasks() {
  const { rpc } = useLoom();
  const { data } = useSuspenseQuery(rpc.search.list.queryOptions({ input: taskSelection }));
  return <p>{data.rows.map((task) => task.title).join(", ")}</p>;
}

export function MoreTasks() {
  const { rpc } = useLoom();
  const result = useInfiniteQuery(
    rpc.search.list.infiniteOptions({
      input: (cursor: string | null) => ({ ...taskSelection, cursor }),
      initialPageParam: null,
      getNextPageParam: (page) => page.nextCursor,
    }),
  );
  return (
    <>
      <p>{result.data?.pages.flatMap((page) => page.rows.map((task) => task.title)).join(", ")}</p>
      <button disabled={!result.hasNextPage || result.isFetchingNextPage} onClick={() => void result.fetchNextPage()}>
        Load more
      </button>
    </>
  );
}

export function LiveTasks() {
  const { rpc } = useLoom();
  const [loadedPages, setLoadedPages] = useState(1);
  const result = useQuery(rpc.search.watch.liveOptions({ input: { ...taskSelection, loadedPages }, retry: false }));
  return (
    <>
      <p>{result.data?.pages.flatMap((page) => page.map((task) => task.title)).join(", ")}</p>
      <button disabled={!result.data?.nextCursor} onClick={() => setLoadedPages((pages) => pages + 1)}>
        Expand window
      </button>
    </>
  );
}

/** Suspends until the first window arrives; later commits replace that window. */
export function SuspenseLiveTasks() {
  const { rpc } = useLoom();
  const { data } = useSuspenseQuery(rpc.search.watch.liveOptions({ input: taskSelection, retry: false }));
  return <p>{data.pages.flatMap((page) => page.map((task) => task.title)).join(", ")}</p>;
}
