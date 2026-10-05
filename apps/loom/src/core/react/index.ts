"use client";

export type { KelloProviderAuth } from "./provider";
export { createKelloReact } from "./provider";

// Optional re-exports of the native TanStack React bindings.
export {
  QueryClientProvider,
  useQuery,
  useMutation,
  useSuspenseQuery,
  useQueries,
  useQueryClient,
} from "@tanstack/react-query";
