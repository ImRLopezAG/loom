import type { ClientLink } from "@orpc/client";
import { ORPCError, RPCSerializer } from "@orpc/client";
import { RPCLink } from "@orpc/client/websocket";
import * as v from "valibot";

export interface RpcTransportOptions {
  readonly url: string;
  readonly version: string;
  /** Return credentials only for this session's identity; return null after an identity change. */
  readonly getToken: () => Promise<string | null>;
}

const ticketSchema = v.strictObject({
  ticket: v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{43}$/)),
  expiresAt: v.pipe(v.number(), v.finite()),
});

/** Owns the authenticated native peer. Reconnection obtains a fresh single-use
 * ticket; it never retries a procedure that may already have committed. */
export function createRpcTransport(options: RpcTransportOptions) {
  const { version, getToken } = options;
  if (!/^[a-f0-9]{64}$/.test(version)) throw new Error("Invalid RPC version");
  const base = new URL(options.url);
  if (!["https:", "http:"].includes(base.protocol) || base.username || base.password || base.search || base.hash)
    throw new Error("Invalid RPC service URL");
  const endpoint = (path: string) => `${base.href.replace(/\/$/, "")}/api/loom/${path}`;
  const shutdown = new AbortController();
  const sockets = new Set<WebSocket>();
  let refusal: ORPCError<string, undefined> | undefined;
  const native = new RPCLink<Record<never, never>>({
    serializer: new RPCSerializer({ omitUndefinedProperties: false }),
    headers: () => ({ "idempotency-key": crypto.randomUUID() }),
    reconnect: { enabled: true, maxAttempt: 2 },
    connect: async () => {
      shutdown.signal.throwIfAborted();
      if (refusal) throw refusal;
      const token = await getToken();
      shutdown.signal.throwIfAborted();
      if (!token) throw new Error("Authentication required");
      const response = await fetch(endpoint("ticket"), {
        method: "POST",
        headers: {
          authorization: `Bearer ${token}`,
          "content-type": "application/json",
          "x-loom-protocol": "loom-orpc-2",
          "x-loom-version": version,
        },
        body: "{}",
        signal: AbortSignal.any([shutdown.signal, AbortSignal.timeout(10_000)]),
        credentials: "omit",
        redirect: "error",
      });
      if (!response.ok) {
        await response.body?.cancel();
        if (response.status === 409 || response.status === 401 || response.status === 403) {
          refusal = new ORPCError(
            response.status === 409 ? "RPC_VERSION_MISMATCH" : response.status === 401 ? "UNAUTHORIZED" : "FORBIDDEN",
          );
          throw refusal;
        }
        throw new Error(`RPC connection refused (${response.status})`);
      }
      const ticket = v.parse(ticketSchema, await response.json());
      shutdown.signal.throwIfAborted();
      if (ticket.expiresAt <= Date.now() / 1000) throw new Error("Expired RPC ticket");
      const socket = new WebSocket(endpoint("socket").replace(/^http/, "ws"), [
        "loom.orpc.2",
        `loom.version.${version}`,
        `loom.ticket.${ticket.ticket}`,
      ]);
      socket.binaryType = "arraybuffer";
      sockets.add(socket);
      const deadline = setTimeout(() => socket.close(), 10_000);
      socket.addEventListener("open", () => clearTimeout(deadline), { once: true });
      socket.addEventListener(
        "close",
        () => {
          clearTimeout(deadline);
          sockets.delete(socket);
        },
        { once: true },
      );
      return socket;
    },
  });
  const link: ClientLink<Record<never, never>> = {
    async call(path, input, callOptions) {
      shutdown.signal.throwIfAborted();
      if (refusal) throw refusal;
      try {
        return await native.call(path, input, {
          ...callOptions,
          signal: callOptions.signal ? AbortSignal.any([shutdown.signal, callOptions.signal]) : shutdown.signal,
        });
      } catch (cause) {
        shutdown.signal.throwIfAborted();
        throw refusal ?? cause;
      }
    },
  };
  return Object.freeze({
    link,
    dispose() {
      shutdown.abort();
      for (const socket of sockets) socket.close(1000, "SESSION_ENDED");
      sockets.clear();
    },
  });
}
