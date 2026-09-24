import { QueryClient } from "@tanstack/react-query";
import type { QueryClientConfig } from "@tanstack/react-query";
import type { LoomClient } from "../client/transport";
import { LoomClientError } from "../client/transport";
import type { LiveQueryClient } from "../client/live";

interface Runtime {
  readonly client: LoomClient;
  readonly live: LiveQueryClient;
  readonly identity: string | null;
  readonly signal: AbortSignal;
}
const runtimes = new WeakMap<QueryClient, Runtime>();
export function runtimeFor(queryClient: QueryClient): Runtime {
  const runtime = runtimes.get(queryClient);
  if (!runtime) throw new LoomClientError("MISSING_PROVIDER", "Use a Loom QueryClient for generated options");
  if (runtime.signal.aborted || runtime.identity !== runtime.live.getIdentity())
    throw new LoomClientError("AUTH_CHANGED", "The identity changed; create a new Loom QueryClient");
  return runtime;
}
export interface LoomQueryClientOptions extends QueryClientConfig {
  readonly client: LoomClient;
  readonly live: LiveQueryClient;
}
/** One client per deployment and identity (and per SSR request). Dispose when its session ends. */
export function createLoomQueryClient({ client, live, ...config }: LoomQueryClientOptions) {
  const queryClient = new QueryClient(config);
  const controller = new AbortController();
  runtimes.set(queryClient, { client, live, identity: live.getIdentity(), signal: controller.signal });
  function dispose() {
    unsubscribe();
    controller.abort();
    // Clear observed data before removing cache entries, including disabled observers.
    for (const query of queryClient.getQueryCache().getAll()) {
      void query.cancel({ silent: true });
      query.setState({ data: undefined, error: null, status: "pending", fetchStatus: "idle" });
    }
    queryClient.clear();
  }
  const unsubscribe = live.subscribeIdentity(dispose);
  return Object.assign(queryClient, { dispose });
}
