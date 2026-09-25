import { createClient, createServerClient } from "../loom/_generated/api";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryClient } from "@tanstack/react-query";
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: false }, mutations: { retry: false } },
  });
}
export function connect(url: string, getToken: () => Promise<string | null>) {
  const connection = createClient({ url, getToken });
  return { ...connection, rpc: createTanstackQueryUtils(connection.client) };
}
export type Connection = ReturnType<typeof connect>;
export type Notes = Awaited<ReturnType<Connection["client"]["examples"]["notes"]>>;

export function connectServer(url: string, getToken: () => Promise<string | null>) {
  const connection = createServerClient({ url, getToken });
  return { ...connection, rpc: createTanstackQueryUtils(connection.client) };
}
