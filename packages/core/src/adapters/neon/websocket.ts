import { Hono } from "hono";
import { upgradeWebSocket } from "@neon/functions/hono";
import { originPolicy } from "../../server/auth/policy";
import type { createConnectionTickets } from "../../server/auth/tickets";
import { createWebSocketSession } from "../../server/realtime/websocket";
import type { WebSocketSessionOptions } from "../../server/realtime/websocket";

export interface NeonRealtimeOptions extends Omit<WebSocketSessionOptions, "socket" | "session" | "onDispose"> {
  readonly tickets: Pick<ReturnType<typeof createConnectionTickets>, "redeem">;
  readonly origins: readonly string[];
  readonly maxConnections?: number;
}

/** Mount outside response-rewriting middleware; the native upgrade Response must remain unchanged. */
export function createNeonRealtime(options: NeonRealtimeOptions) {
  const allowed = originPolicy(options.origins);
  const maximum = options.maxConnections ?? 100;
  if (!Number.isInteger(maximum) || maximum < 1 || maximum > 1000)
    throw new Error("Invalid WebSocket connection limit");
  const sessions = new Set<ReturnType<typeof createWebSocketSession>>();
  let connections = 0;
  let stopped = false;
  const app = new Hono();
  app.get("/api/loom/socket", async (context) => {
    const refuse = (status: 400 | 401 | 403 | 426 | 503) =>
      context.text("WebSocket connection refused", status, { "cache-control": "no-store" });
    if (stopped || connections >= maximum) return refuse(503);
    if (context.req.header("upgrade")?.toLowerCase() !== "websocket") return refuse(426);
    const origin = context.req.header("origin");
    if (!origin || !allowed(origin)) return refuse(403);
    const header = context.req.header("sec-websocket-protocol") ?? "";
    if (header.length > 256) return refuse(400);
    const offered = header.split(",").map((value) => value.trim());
    const credential = offered.find((value) => /^loom\.ticket\.[A-Za-z0-9_-]{43}$/.test(value));
    if (offered.length !== 2 || !offered.includes("loom.v1") || !credential) return refuse(400);
    connections++;
    let released = false;
    let controller: ReturnType<typeof createWebSocketSession> | undefined;
    let authenticated = false;
    let deadline: ReturnType<typeof setTimeout> | undefined;
    function release() {
      if (released) return;
      released = true;
      connections--;
      if (deadline) clearTimeout(deadline);
      if (controller) sessions.delete(controller);
    }
    try {
      const timeout = new Promise<never>((_resolve, reject) => {
        deadline = setTimeout(() => reject(new Error("Handshake expired")), 5000);
      });
      const session = await Promise.race([
        options.tickets.redeem(credential.slice("loom.ticket.".length), origin),
        timeout,
      ]);
      authenticated = true;
      if (deadline) clearTimeout(deadline);
      if (stopped || session.expiresAt <= Date.now() / 1000) {
        release();
        return refuse(401);
      }
      // A returned upgrade that never opens must not reserve capacity indefinitely.
      deadline = setTimeout(release, 5000);
      return await upgradeWebSocket(
        context,
        {
          onOpen(_event, ws) {
            if (released || stopped || !ws.raw) {
              ws.close(1013, "RESYNC_REQUIRED");
              release();
              return;
            }
            if (deadline) clearTimeout(deadline);
            try {
              controller = createWebSocketSession({ ...options, socket: ws.raw, session, onDispose: release });
              if (!released) sessions.add(controller);
            } catch {
              ws.close(1011, "CONNECTION_FAILED");
              release();
            }
          },
          onMessage(event) {
            controller?.message(event.data);
          },
          onClose() {
            controller?.dispose();
            release();
          },
          onError(_event, ws) {
            controller?.dispose();
            release();
            ws.close(1011, "CONNECTION_FAILED");
          },
        },
        { protocol: "loom.v1" },
      );
    } catch {
      release();
      return refuse(authenticated ? 503 : 401);
    }
  });
  return {
    app,
    stop() {
      stopped = true;
      const active = [...sessions];
      for (const session of active) session.stop();
    },
  };
}
