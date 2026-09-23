import * as v from "valibot";
import { createDevelopmentGeneration } from "./server-generation";
import type { DevelopmentServerRuntime, DevelopmentSocketData } from "./server-generation";
export type { DevelopmentServerRuntime } from "./server-generation";

export interface DevelopmentServerOptions {
  readonly port?: number;
  readonly maxConnections?: number;
}
const limits = v.strictObject({
  port: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(65535)), 3000),
  maxConnections: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(1000)), 100),
});

/** Owns each supplied runtime, including rejected candidates. Listens only on loopback. */
export async function startDevelopmentServer(runtime: DevelopmentServerRuntime, input: DevelopmentServerOptions = {}) {
  try {
    const options = v.parse(limits, input);
    let current = createDevelopmentGeneration(runtime, options.maxConnections);
    const owned = new WeakSet<DevelopmentServerRuntime>([runtime]);
    let stopped = false;
    let stopping: Promise<void> | undefined;
    let retirement: Promise<boolean> | undefined;
    let cleanupFailed = false;
    const discarding = new Set<Promise<void>>();
    function discard(candidate: DevelopmentServerRuntime): Promise<void> {
      const work = Promise.resolve()
        .then(() => candidate.stop())
        .catch(() => {
          cleanupFailed = true;
          throw new Error("Development runtime cleanup failed");
        })
        .finally(() => discarding.delete(work));
      discarding.add(work);
      return work;
    }
    const { serve } = await import("bun");
    const server = serve<DevelopmentSocketData>({
      hostname: "127.0.0.1",
      port: options.port,
      fetch(request, transport) {
        if (stopped) return new Response("Development server stopped", { status: 503 });
        return current.fetch(request, transport);
      },
      websocket: {
        // The shared session enforces each generation's lower limit; this is its absolute supported maximum.
        maxPayloadLength: 1_048_576,
        open(socket) {
          socket.data.open(socket);
        },
        message(socket, message) {
          socket.data.controller?.message(message);
        },
        close(socket) {
          socket.data.controller?.dispose();
          socket.data.release();
        },
      },
      error() {
        return new Response("Development request failed", { status: 500 });
      },
    });
    return {
      url: new URL(server.url),
      async replace(candidate: DevelopmentServerRuntime, signal?: AbortSignal): Promise<{ readonly retired: boolean }> {
        if (owned.has(candidate)) throw new Error("Development runtime is already owned");
        owned.add(candidate);
        let next: ReturnType<typeof createDevelopmentGeneration>;
        try {
          if (stopped) throw new Error("Development server is stopped");
          if (retirement || discarding.size > 0) throw new Error("Development replacement is in progress");
          if (cleanupFailed) throw new Error("Development retirement failed; restart the server");
          signal?.throwIfAborted();
          next = createDevelopmentGeneration(candidate, options.maxConnections);
          signal?.throwIfAborted();
        } catch (cause) {
          await discard(candidate);
          throw cause;
        }
        const previous = current;
        current = next;
        retirement = previous.stop().then(
          () => true,
          () => {
            cleanupFailed = true;
            return false;
          },
        );
        try {
          return { retired: await retirement };
        } finally {
          retirement = undefined;
        }
      },
      stop(): Promise<void> {
        if (stopping) return stopping;
        stopped = true;
        const transportStopped = server.stop(true);
        const activeStopped = current.stop();
        stopping = (async () => {
          const results = await Promise.allSettled([activeStopped, retirement, transportStopped]);
          while (discarding.size > 0) await Promise.allSettled(discarding);
          if (cleanupFailed || results.some((result) => result.status === "rejected"))
            throw new Error("Development runtime cleanup failed");
        })();
        return stopping;
      },
    };
  } catch (cause) {
    await runtime.stop();
    throw cause;
  }
}
