import {
  createNeonApplication,
  createRpcHttpApp,
  createRpcOpenApiApp,
  createStorageHttpApp,
  createRpcSocketSession,
} from "@loom/core/neon";
import type { PublicHttpOptions, NeonRealtimeOptions } from "@loom/core/neon";
import { createWebSocketSession } from "@loom/core/server";
import type { VerifiedSession, createRpcRuntime } from "@loom/core/server";
import type { Server, ServerWebSocket } from "bun";

interface LegacyDevelopmentServerRuntime {
  readonly auth: Pick<PublicHttpOptions, "verify" | "origins" | "allowAnonymous">;
  readonly dispatcher: PublicHttpOptions["dispatcher"];
  readonly tickets: NonNullable<PublicHttpOptions["tickets"]> & NeonRealtimeOptions["tickets"];
  readonly realtime: Omit<NeonRealtimeOptions, "origins" | "tickets" | "maxConnections">;
  readonly storage?: { readonly intents: NonNullable<PublicHttpOptions["storage"]> } | undefined;
  stop(): Promise<void>;
}
type NativeDevelopmentServerRuntime = Awaited<ReturnType<typeof createRpcRuntime>>;
export type DevelopmentServerRuntime = LegacyDevelopmentServerRuntime | NativeDevelopmentServerRuntime;
type Controller = ReturnType<typeof createWebSocketSession> | ReturnType<typeof createRpcSocketSession>;
export interface DevelopmentSocketData {
  readonly session: VerifiedSession;
  readonly release: () => void;
  readonly claim: () => boolean;
  readonly open: (socket: ServerWebSocket<DevelopmentSocketData>) => void;
  controller: Controller | undefined;
}
export function createDevelopmentGeneration(runtime: DevelopmentServerRuntime, maxConnections: number) {
  const native = "router" in runtime;
  const rpc = native
    ? createRpcHttpApp({ ...runtime.auth, router: runtime.router, version: runtime.version, tickets: runtime.tickets })
    : undefined;
  const storage =
    native && runtime.storage ? createStorageHttpApp({ ...runtime.auth, storage: runtime.storage.intents }) : undefined;
  // Runtime construction already validated this finite public contract. Lazily
  // assemble its adapter under an owned request so rejection is always observed.
  let openapi: ReturnType<typeof createRpcOpenApiApp> | undefined;
  const legacy = !native
    ? createNeonApplication({
        ...runtime.auth,
        dispatcher: runtime.dispatcher,
        tickets: runtime.tickets,
        storage: runtime.storage?.intents,
      })
    : undefined;
  const pending = new Set<Promise<Response>>();
  function http(request: Request): Promise<Response> {
    if (native && runtime.openapi && new URL(request.url).pathname.startsWith("/api/loom/openapi/")) {
      openapi ??= createRpcOpenApiApp({ ...runtime.auth, router: runtime.snapshots, version: runtime.version });
      const work = openapi
        .then((app) => app.fetch(new Request(request, { signal: AbortSignal.any([request.signal, shutdown.signal]) })))
        .finally(() => pending.delete(work));
      pending.add(work);
      return work;
    }
    const app = legacy ?? (new URL(request.url).pathname === "/api/loom/storage" ? storage : rpc);
    if (!app) return Promise.resolve(new Response("Not found", { status: 404 }));
    const work = Promise.resolve(
      app.fetch(new Request(request, { signal: AbortSignal.any([request.signal, shutdown.signal]) })),
    ).finally(() => pending.delete(work));
    pending.add(work);
    return work;
  }
  const origins = new Set(runtime.auth.origins);
  const reservations = new Set<() => void>();
  const sessions = new Set<Controller>();
  const shutdown = new AbortController();
  let stopped = false;
  let stopping: Promise<void> | undefined;
  const generation = {
    async fetch(request: Request, transport: Server<DevelopmentSocketData>) {
      const refuse = (status: number) =>
        new Response("WebSocket connection refused", {
          status,
          headers: { "cache-control": "no-store" },
        });
      if (stopped) return refuse(503);
      if (new URL(request.url).pathname !== "/api/loom/socket") return http(request);
      if (reservations.size >= maxConnections) return refuse(503);
      if (request.method !== "GET") return refuse(405);
      if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") return refuse(426);
      const origin = request.headers.get("origin");
      if (!origin || !origins.has(origin)) return refuse(403);
      const header = request.headers.get("sec-websocket-protocol") ?? "";
      if (header.length > 256) return refuse(400);
      const offered = header.split(",").map((value) => value.trim());
      const credential = offered.find((value) => /^loom\.ticket\.[A-Za-z0-9_-]{43}$/.test(value));
      const protocol = native ? "loom.orpc.2" : "loom.v1";
      if (offered.length !== (native ? 3 : 2) || !offered.includes(protocol) || !credential) return refuse(400);
      if (native && !offered.includes(`loom.version.${runtime.version}`)) return refuse(409);
      let released = false;
      let deadline: ReturnType<typeof setTimeout> | undefined;
      let controller: Controller | undefined;
      const release = () => {
        if (released) return;
        released = true;
        reservations.delete(release);
        if (deadline) clearTimeout(deadline);
        if (controller) sessions.delete(controller);
      };
      reservations.add(release);
      let cancel = () => {};
      try {
        const timeout = new Promise<never>((_resolve, reject) => {
          deadline = setTimeout(() => reject(new Error("Handshake expired")), 5000);
          cancel = () => reject(new Error("Server stopped"));
          shutdown.signal.addEventListener("abort", cancel, { once: true });
        });
        const session = await Promise.race([runtime.tickets.redeem(credential.slice(12), origin), timeout]);
        if (deadline) clearTimeout(deadline);
        if (stopped || session.expiresAt <= Date.now() / 1000) {
          release();
          return refuse(401);
        }
        deadline = setTimeout(release, 5000);
        const upgraded = transport.upgrade(request, {
          headers: { "sec-websocket-protocol": protocol },
          data: {
            session,
            release,
            open: generation.open,
            claim() {
              if (released || stopped) return false;
              if (deadline) clearTimeout(deadline);
              return true;
            },
            get controller() {
              return controller;
            },
            set controller(value) {
              controller = value;
            },
          },
        });
        if (upgraded) return;
        release();
        return refuse(400);
      } catch {
        release();
        return refuse(stopped ? 503 : 401);
      } finally {
        shutdown.signal.removeEventListener("abort", cancel);
      }
    },
    open(this: void, socket: ServerWebSocket<DevelopmentSocketData>) {
      if (!socket.data.claim()) {
        socket.close(1013, "RESYNC_REQUIRED");
        socket.data.release();
        return;
      }
      try {
        const common = {
          session: socket.data.session,
          socket: {
            get readyState() {
              return socket.readyState;
            },
            get bufferedAmount() {
              return socket.getBufferedAmount();
            },
            send(message: string | Uint8Array<ArrayBuffer>) {
              socket.send(message);
            },
            close(code: number, reason: string) {
              socket.close(code, reason);
            },
          },
          onDispose: socket.data.release,
        };
        const controller = native
          ? createRpcSocketSession({
              ...common,
              router: runtime.router,
              heartbeatMs: runtime.realtime.heartbeatMs,
              maxBufferedBytes: runtime.realtime.maxBufferedBytes,
            })
          : createWebSocketSession({ ...common, ...runtime.realtime });
        socket.data.controller = controller;
        if (socket.data.claim()) sessions.add(controller);
      } catch {
        socket.close(1011, "CONNECTION_FAILED");
        socket.data.release();
      }
    },
    stop(): Promise<void> {
      if (stopping) return stopping;
      stopped = true;
      shutdown.abort();
      const closed = [...sessions].map((session) => {
        if ("stop" in session) session.stop();
        else session.close(1001, "SERVICE_STOPPED");
        return Promise.resolve(session.dispose());
      });
      for (const release of reservations) release();
      stopping = (async () => {
        try {
          await Promise.allSettled(closed);
          await legacy?.stop();
          while (pending.size) await Promise.allSettled(pending);
        } finally {
          await runtime.stop();
        }
      })();
      return stopping;
    },
  };
  return generation;
}
