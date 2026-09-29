"use client";

export type { LoomProviderAuth } from "./provider";
export { createLoomReact } from "./provider";

// Optional re-exports of the native TanStack React bindings.
export {
  QueryClientProvider,
  useQuery,
  useMutation,
  useSuspenseQuery,
  useQueries,
  useQueryClient,
} from "@tanstack/react-query";
