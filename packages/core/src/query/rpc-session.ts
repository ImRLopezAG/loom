import type { ClientContext, ClientLink } from "@orpc/client";
import { QueryClient } from "@tanstack/react-query";
import type { QueryClientConfig, QueryKey } from "@tanstack/react-query";
import { createLivePause } from "./live-pause";

export interface RpcQuerySessionOptions<C extends ClientContext> {
  readonly link: ClientLink<C>;
  /** Deployment URL and generation. Neither credentials nor bearer tokens belong here. */
  readonly deployment: string;
  readonly version: string;
  readonly identity: { readonly issuer: string; readonly subject: string; readonly tenantId?: string } | null;
  readonly queryClientConfig?: QueryClientConfig;
}

/** Own one session per authenticated identity, or per server-rendered request.
 * Dispose it before replacing credentials, including a change to anonymous access. */
export interface RpcQuerySession<C extends ClientContext> {
  readonly queryClient: QueryClient;
  readonly link: ClientLink<C>;
  readonly signal: AbortSignal;
  readonly live: ReturnType<typeof createLivePause>;
  key(mode: "finite" | "live" | "mutation", inner: QueryKey): QueryKey;
  dispose(): void;
}

export function createRpcQuerySession<C extends ClientContext>(options: RpcQuerySessionOptions<C>): RpcQuerySession<C> {
  const controller = new AbortController();
  const queryClient = new QueryClient(options.queryClientConfig);
  const live = createLivePause(queryClient, controller.signal);
  const scope = Object.freeze([
    "loom-orpc-2",
    options.deployment,
    options.version,
    options.identity
      ? Object.freeze([options.identity.issuer, options.identity.subject, options.identity.tenantId ?? null])
      : null,
  ]);
  const link: ClientLink<C> = {
    async call(path, input, callOptions) {
      controller.signal.throwIfAborted();
      const signal = callOptions.signal ? AbortSignal.any([controller.signal, callOptions.signal]) : controller.signal;
      const result = await options.link.call(path, input, { ...callOptions, signal });
      signal.throwIfAborted();
      return result;
    },
  };
  return Object.freeze({
    queryClient,
    link,
    signal: controller.signal,
    live,
    key(mode: "finite" | "live" | "mutation", inner: QueryKey): QueryKey {
      controller.signal.throwIfAborted();
      return [scope, mode, inner];
    },
    dispose() {
      if (controller.signal.aborted) return;
      controller.abort();
      // Clear observers as well as cache entries, including disabled observers.
      for (const query of queryClient.getQueryCache().getAll()) {
        void query.cancel({ silent: true });
        query.setState({ data: undefined, error: null, status: "pending", fetchStatus: "idle" });
      }
      queryClient.clear();
    },
  });
}

export type RpcQueryBinding = Pick<ReturnType<typeof createRpcQuerySession>, "key" | "signal" | "queryClient" | "live">;
