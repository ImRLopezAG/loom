import { withLoomServerSession } from "loom/client";
import { createServerClient } from "./loom/_generated/api";
import { taskSelection } from "./search-selection";

/** Call separately for each SSR request with its provider-owned credential. */
export function prefetchTasks(url: string, token: string | null, signal: AbortSignal) {
  return withLoomServerSession(
    createServerClient,
    { url, getToken: async () => token, signal },
    async ({ connection, queryClient, dehydrate }) => {
      const page = await queryClient.query(connection.rpc.search.list.queryOptions({ input: taskSelection }));
      return { page, hydration: dehydrate() };
    },
  );
}
