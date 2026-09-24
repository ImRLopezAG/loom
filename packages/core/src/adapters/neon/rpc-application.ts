import { createRpcHttpApp, createRpcOpenApiApp } from "./rpc-http";
import type { RpcHttpOptions } from "./rpc-http";
import { createNeonRpcSocket } from "./rpc-websocket";
import type { NeonRpcSocketOptions } from "./rpc-websocket";

export interface NeonRpcApplicationOptions extends RpcHttpOptions {
  readonly openapi?: boolean;
  readonly realtime?: Omit<NeonRpcSocketOptions, "router" | "version" | "origins">;
}

/** One public graph, with separate upgrade ingress and an awaited shutdown boundary. */
export async function createNeonRpcApplication(options: NeonRpcApplicationOptions) {
  const http = createRpcHttpApp(options);
  const openapi = options.openapi ? await createRpcOpenApiApp(options) : undefined;
  const realtime = options.realtime
    ? createNeonRpcSocket({
        ...options.realtime,
        router: options.router,
        version: options.version,
        origins: options.origins,
      })
    : undefined;
  const pending = new Set<Promise<Response>>();
  const shutdown = new AbortController();
  let stopping: Promise<void> | undefined;
  return {
    fetch(request: Request): Promise<Response> {
      if (shutdown.signal.aborted) return Promise.resolve(new Response("Application stopping", { status: 503 }));
      const path = new URL(request.url).pathname;
      const work = Promise.resolve()
        .then(() => {
          // The provider owns this request and its upgrade response; neither is cloned.
          if (path === "/api/loom/socket" && realtime) return realtime.fetch(request);
          const adapter = path.startsWith("/api/loom/openapi/") && openapi ? openapi : http;
          return adapter.fetch(new Request(request, { signal: AbortSignal.any([request.signal, shutdown.signal]) }));
        })
        .finally(() => pending.delete(work));
      pending.add(work);
      return work;
    },
    stop(): Promise<void> {
      if (stopping) return stopping;
      shutdown.abort();
      stopping = Promise.resolve().then(async () => {
        await realtime?.stop();
        while (pending.size) await Promise.allSettled(pending);
      });
      return stopping;
    },
  };
}
