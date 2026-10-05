import { withKelloServerSession } from "kello/client";
import { createServerClient } from "./kello/_generated/api";
import { taskSelection } from "./search-selection";

/** Call separately for each SSR request with its provider-owned credential. */
export function prefetchTasks(url: string, token: string | null, signal: AbortSignal) {
  return withKelloServerSession(
    createServerClient,
    { url, getToken: async () => token, signal },
    async ({ connection, queryClient, dehydrate }) => {
      const page = await queryClient.query(connection.rpc.search.list.queryOptions({ input: taskSelection }));
      return { page, hydration: dehydrate() };
    },
  );
}
