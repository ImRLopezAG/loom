import { createPublicHttpApp } from "./http";
import type { PublicHttpOptions } from "./http";
import { createNeonRealtime } from "./websocket";
import type { NeonRealtimeOptions } from "./websocket";

export interface NeonApplicationOptions extends PublicHttpOptions {
  /** One generation's shared poller and ticket redemption capability. Must match the HTTP deployment. */
  readonly realtime?: Omit<NeonRealtimeOptions, "origins">;
}

/** Owns request/session shutdown. The caller closes its database only after stop() resolves. */
export function createNeonApplication(options: NeonApplicationOptions) {
  const pending = new Set<Promise<unknown>>();
  const shutdown = new AbortController();
  let stopped = false;
  let stopping: Promise<void> | undefined;
  function track<T>(operation: () => Promise<T>): Promise<T> {
    const work = Promise.resolve()
      .then(operation)
      .finally(() => pending.delete(work));
    pending.add(work);
    return work;
  }
  const dispatcher = options.dispatcher;
  const http = createPublicHttpApp({
    ...options,
    dispatcher: { public: (call, identity, signal) => track(() => dispatcher.public(call, identity, signal)) },
  });
  const realtime = options.realtime ? createNeonRealtime({ ...options.realtime, origins: options.origins }) : undefined;
  const poller = options.realtime?.poller;
  return {
    fetch(this: void, request: Request): Promise<Response> {
      if (stopped)
        return Promise.resolve(
          new Response("Application stopping", { status: 503, headers: { "cache-control": "no-store" } }),
        );
      // Preserve the provider's native upgrade Request and Response without cloning or response middleware.
      if (realtime && new URL(request.url).pathname === "/api/loom/socket")
        return track(async () => realtime.app.fetch(request));
      const signal = AbortSignal.any([request.signal, shutdown.signal]);
      return track(async () => http.fetch(new Request(request, { signal })));
    },
    stop(): Promise<void> {
      if (stopping) return stopping;
      let pollerStopped: Promise<void> | undefined;
      stopping = Promise.resolve().then(async () => {
        // Drain request and dispatcher ownership before callers release database resources.
        while (pending.size > 0) await Promise.allSettled(pending);
        await pollerStopped;
      });
      stopped = true;
      realtime?.stop();
      shutdown.abort();
      pollerStopped = poller?.stop();
      return stopping;
    },
  };
}
