import * as v from "valibot";
import { json } from "../validation/encoding";
import type { JsonValue } from "../schema/fields";
import { LoomClientError } from "./transport";
import type { LoomClient } from "./transport";
import { protocolVersion } from "./protocol";

export interface LiveSocket {
  readonly readyState: number;
  readonly bufferedAmount: number;
  onmessage: OmitThisParameter<NonNullable<WebSocket["onmessage"]>> | null;
  onclose: OmitThisParameter<NonNullable<WebSocket["onclose"]>> | null;
  onerror: OmitThisParameter<NonNullable<WebSocket["onerror"]>> | null;
  send(data: string): void;
  close(code: number, reason: string): void;
}
const identifier = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,64}$/));
const resultFields = {
  protocol: v.number(),
  type: v.literal("result"),
  id: identifier,
  sequence: v.pipe(v.number(), v.safeInteger(), v.minValue(1)),
  requestId: v.string(),
};
const serverMessage = v.union([
  v.strictObject({ protocol: v.number(), type: v.literal("ready") }),
  v.strictObject({ protocol: v.number(), type: v.literal("ping") }),
  v.strictObject({ ...resultFields, ok: v.literal(true), value: json }),
  v.strictObject({
    ...resultFields,
    ok: v.literal(false),
    error: v.strictObject({ code: v.string(), message: v.string() }),
  }),
  v.strictObject({
    protocol: v.number(),
    type: v.literal("closed"),
    id: identifier,
    reason: v.picklist(["UNSUBSCRIBED", "QUERY_ERROR"]),
  }),
]);
export type ServerMessage = Exclude<v.InferOutput<typeof serverMessage>, { type: "ping" }>;
export type ClientMessage =
  | {
      readonly type: "subscribe";
      readonly id: string;
      readonly name: string;
      readonly version: string;
      readonly args: JsonValue;
    }
  | { readonly type: "unsubscribe"; readonly id: string };
export type ConnectionState = "connecting" | "ready" | "reconnecting" | "signed-out" | "error" | "stopped";
export interface RealtimeConnectionOptions {
  readonly url: string;
  readonly client: Pick<LoomClient, "ticket">;
  readonly identityKey: string | null;
  readonly socket?: (url: string, protocols: string[]) => LiveSocket;
  readonly onMessage: (message: ServerMessage) => void;
  readonly onState?: (state: ConnectionState, error?: LoomClientError) => void;
}

/** Owns transport only. Consumers must clear identity-scoped results on setIdentity and resubscribe on ready. */
export function createRealtimeConnection(options: RealtimeConnectionOptions) {
  const base = new URL(options.url);
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(base.hostname);
  if (
    (base.protocol !== "https:" && !(base.protocol === "http:" && local)) ||
    base.username ||
    base.password ||
    base.search ||
    base.hash
  )
    throw new Error(
      "Realtime URL must use HTTPS, except for local development, without credentials, query or fragment",
    );
  base.protocol = base.protocol === "https:" ? "wss:" : "ws:";
  const url = `${base.href.replace(/\/$/, "")}/api/loom/socket`;
  const { client, onMessage, onState } = options;
  const open: (url: string, protocols: string[]) => LiveSocket =
    options.socket ?? ((address, protocols) => new WebSocket(address, protocols));
  const encoder = new TextEncoder();
  let identity = options.identityKey;
  let generation = 0;
  let stopped = false;
  let ready = false;
  let failures = 0;
  let connectedAt = 0;
  let socket: LiveSocket | undefined;
  let controller: AbortController | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  let watchdog: ReturnType<typeof setTimeout> | undefined;
  function state(value: ConnectionState, error?: LoomClientError) {
    try {
      onState?.(value, error);
    } catch {
      /* Observer failures cannot break transport cleanup. */
    }
  }
  function detach() {
    const epoch = ++generation;
    ready = false;
    clearTimeout(retry);
    clearTimeout(watchdog);
    const previous = socket;
    socket = undefined;
    const pending = controller;
    controller = undefined;
    if (previous) {
      previous.onmessage = null;
      previous.onclose = null;
      previous.onerror = null;
      try {
        previous.close(1000, "CLIENT_RESET");
      } catch {
        /* Already disconnected. */
      }
    }
    pending?.abort();
    return epoch;
  }
  function fail(error: LoomClientError, terminal = false) {
    const epoch = detach();
    if (epoch !== generation || stopped || identity === null) return;
    if (terminal) {
      state("error", error);
      return;
    }
    // Equal jitter keeps repeated isolate restarts from synchronizing all clients.
    const ceiling = Math.min(500 * 2 ** Math.min(failures++, 6), 30000);
    retry = setTimeout(
      () => {
        if (epoch === generation) void connect();
      },
      ceiling * (0.5 + Math.random() * 0.5),
    );
    state("reconnecting", error);
  }
  function armWatchdog(epoch: number, milliseconds: number) {
    clearTimeout(watchdog);
    watchdog = setTimeout(() => {
      if (epoch === generation)
        fail(new LoomClientError("CONNECTION_TIMEOUT", "The live connection stopped responding"));
    }, milliseconds);
  }
  function send(value: JsonValue): boolean {
    const active = socket;
    if (!active || active.readyState !== 1) return false;
    const text = JSON.stringify(value);
    if (encoder.encode(text).byteLength + active.bufferedAmount > 65536) {
      fail(new LoomClientError("RESYNC_REQUIRED", "The live connection buffer is full"));
      return false;
    }
    try {
      active.send(text);
      return true;
    } catch {
      fail(new LoomClientError("TRANSPORT_ERROR", "The live message could not be sent"));
      return false;
    }
  }
  async function connect() {
    if (stopped || identity === null) return;
    const epoch = detach();
    if (epoch !== generation || stopped || identity === null) return;
    const expectedIdentity = identity;
    controller = new AbortController();
    const signal = controller.signal;
    armWatchdog(epoch, 30000);
    state("connecting");
    if (epoch !== generation) return;
    try {
      const ticket = await client.ticket({ identityKey: expectedIdentity, signal });
      if (epoch !== generation || signal.aborted) return;
      const active = open(url, ["loom.v1", `loom.ticket.${ticket.ticket}`]);
      if (epoch !== generation) {
        active.close(1000, "CLIENT_RESET");
        return;
      }
      socket = active;
      active.onclose = ({ code }) => {
        if (epoch !== generation) return;
        if (ready && Date.now() - connectedAt >= 30000) failures = 0;
        fail(
          new LoomClientError(code === 4406 ? "PROTOCOL_MISMATCH" : "CONNECTION_CLOSED", "The live connection closed"),
          [1003, 1008, 1009, 4406].includes(code),
        );
      };
      active.onerror = () => {
        if (epoch === generation) fail(new LoomClientError("TRANSPORT_ERROR", "The live connection failed"));
      };
      active.onmessage = ({ data }) => {
        if (epoch !== generation) return;
        let message: v.InferOutput<typeof serverMessage>;
        try {
          if (!v.is(v.string(), data) || encoder.encode(data).byteLength > 1048576) throw new Error("Invalid frame");
          message = v.parse(serverMessage, JSON.parse(data));
        } catch {
          fail(new LoomClientError("INVALID_RESPONSE", "The live server returned an invalid message"), true);
          return;
        }
        if (message.protocol !== protocolVersion) {
          fail(
            new LoomClientError("PROTOCOL_MISMATCH", "Client and server protocol versions differ; update the client"),
            true,
          );
          return;
        }
        if ((!ready && message.type !== "ready") || (ready && message.type === "ready")) {
          fail(new LoomClientError("INVALID_RESPONSE", "The live server sent a message out of order"), true);
          return;
        }
        armWatchdog(epoch, 60000);
        if (message.type === "ping") {
          send({ protocol: protocolVersion, type: "pong" });
          return;
        }
        if (message.type === "ready") {
          ready = true;
          connectedAt = Date.now();
          state("ready");
        }
        if (epoch !== generation) return;
        try {
          onMessage(message);
        } catch {
          /* Subscribers own their observer failures. */
        }
      };
    } catch (cause) {
      if (epoch !== generation) return;
      const error =
        cause instanceof LoomClientError ? cause : new LoomClientError("TRANSPORT_ERROR", "The live connection failed");
      fail(
        error,
        [
          "AUTH_CHANGED",
          "UNAUTHENTICATED",
          "FORBIDDEN",
          "ORIGIN_DENIED",
          "PROTOCOL_MISMATCH",
          "INVALID_TICKET",
        ].includes(error.code),
      );
    }
  }
  void Promise.resolve().then(() => {
    if (!stopped && generation === 0) return identity === null ? state("signed-out") : connect();
  });
  return {
    send(message: ClientMessage): boolean {
      return ready && send({ ...message, protocol: protocolVersion });
    },
    setIdentity(next: string | null) {
      if (stopped || identity === next) return;
      identity = next;
      failures = 0;
      const epoch = detach();
      if (epoch !== generation || stopped) return;
      if (next === null) state("signed-out");
      else void connect();
    },
    stop() {
      if (stopped) return;
      stopped = true;
      detach();
      state("stopped");
    },
  };
}
