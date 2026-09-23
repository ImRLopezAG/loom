import { createNeonApplication } from "@loom/core/neon";
import type { PublicHttpOptions, NeonRealtimeOptions } from "@loom/core/neon";
import { createWebSocketSession } from "@loom/core/server";
import type { VerifiedSession } from "@loom/core/server";
import type { Server, ServerWebSocket } from "bun";

export interface DevelopmentServerRuntime {
  readonly auth: Pick<PublicHttpOptions, "verify" | "origins" | "allowAnonymous">;
  readonly dispatcher: PublicHttpOptions["dispatcher"];
  readonly tickets: NonNullable<PublicHttpOptions["tickets"]> & NeonRealtimeOptions["tickets"];
  readonly realtime: Omit<NeonRealtimeOptions, "origins" | "tickets" | "maxConnections">;
  readonly storage?: { readonly intents: NonNullable<PublicHttpOptions["storage"]> } | undefined;
  stop(): Promise<void>;
}
export interface DevelopmentSocketData {
  readonly session: VerifiedSession;
  readonly release: () => void;
  readonly claim: () => boolean;
  readonly open: (socket: ServerWebSocket<DevelopmentSocketData>) => void;
  controller: ReturnType<typeof createWebSocketSession> | undefined;
}
export function createDevelopmentGeneration(runtime: DevelopmentServerRuntime, maxConnections: number) {
  const application = createNeonApplication({
    ...runtime.auth,
    dispatcher: runtime.dispatcher,
    tickets: runtime.tickets,
    storage: runtime.storage?.intents,
  });
  const origins = new Set(runtime.auth.origins);
  const reservations = new Set<() => void>();
  const sessions = new Set<ReturnType<typeof createWebSocketSession>>();
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
      if (new URL(request.url).pathname !== "/api/loom/socket") return application.fetch(request);
      if (reservations.size >= maxConnections) return refuse(503);
      if (request.method !== "GET") return refuse(405);
      if (request.headers.get("upgrade")?.toLowerCase() !== "websocket") return refuse(426);
      const origin = request.headers.get("origin");
      if (!origin || !origins.has(origin)) return refuse(403);
      const header = request.headers.get("sec-websocket-protocol") ?? "";
      if (header.length > 256) return refuse(400);
      const offered = header.split(",").map((value) => value.trim());
      const credential = offered.find((value) => /^loom\.ticket\.[A-Za-z0-9_-]{43}$/.test(value));
      if (offered.length !== 2 || !offered.includes("loom.v1") || !credential) return refuse(400);
      let released = false;
      let deadline: ReturnType<typeof setTimeout> | undefined;
      let controller: ReturnType<typeof createWebSocketSession> | undefined;
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
          headers: { "sec-websocket-protocol": "loom.v1" },
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
        const controller = createWebSocketSession({
          ...runtime.realtime,
          session: socket.data.session,
          socket: {
            get readyState() {
              return socket.readyState;
            },
            get bufferedAmount() {
              return socket.getBufferedAmount();
            },
            send(message) {
              socket.send(message);
            },
            close(code, reason) {
              socket.close(code, reason);
            },
          },
          onDispose: socket.data.release,
        });
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
      for (const session of sessions) session.stop();
      for (const release of reservations) release();
      stopping = (async () => {
        try {
          await application.stop();
        } finally {
          await runtime.stop();
        }
      })();
      return stopping;
    },
  };
  return generation;
}
