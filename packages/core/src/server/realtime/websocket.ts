import * as v from "valibot";
import { protocolVersion } from "../../client/protocol";
import { json } from "../../validation/encoding";
import type { VerifiedSession } from "../auth/verify";
import type { createSubscriptionPoller } from "./subscriptions";
import type { JsonValue } from "../../schema/fields";

export interface RealtimeSocket {
  readonly readyState: number;
  readonly bufferedAmount: number;
  send(message: string): void;
  close(code: number, reason: string): void;
}
export interface WebSocketSessionOptions {
  readonly socket: RealtimeSocket;
  readonly session: VerifiedSession;
  readonly poller: ReturnType<typeof createSubscriptionPoller>;
  readonly maxMessageBytes?: number;
  readonly maxBufferedBytes?: number;
  readonly maxSubscriptions?: number;
  readonly maxMessagesPerSecond?: number;
  readonly heartbeatMs?: number;
  readonly onDispose?: () => void;
}
const id = v.pipe(v.string(), v.regex(/^[A-Za-z0-9_-]{1,64}$/));
const incoming = v.variant("type", [
  v.strictObject({
    protocol: v.number(),
    type: v.literal("subscribe"),
    id,
    name: v.pipe(v.string(), v.minLength(1), v.maxLength(512)),
    version: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
    args: json,
  }),
  v.strictObject({ protocol: v.number(), type: v.literal("unsubscribe"), id }),
  v.strictObject({ protocol: v.number(), type: v.literal("pong") }),
]);
const limit = (maximum: number) => v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(maximum));
const limitsSchema = v.object({
  message: limit(1_048_576),
  buffer: limit(10_485_760),
  subscriptions: limit(1000),
  rate: limit(1000),
  heartbeat: limit(30_000),
});

/** Call after a successful authenticated upgrade. Owns timers and subscriptions until disposal. */
export function createWebSocketSession(options: WebSocketSessionOptions) {
  const { socket, poller, onDispose } = options;
  const session = structuredClone(options.session);
  const limits = v.parse(limitsSchema, {
    message: options.maxMessageBytes ?? 65_536,
    buffer: options.maxBufferedBytes ?? 1_048_576,
    subscriptions: options.maxSubscriptions ?? 32,
    rate: options.maxMessagesPerSecond ?? 100,
    heartbeat: options.heartbeatMs ?? 25_000,
  });
  const encoder = new TextEncoder();
  const subscriptions = new Map<string, { unsubscribe(): void }>();
  let closed = false;
  let awaitingPong = false;
  let window = Date.now();
  let received = 0;
  let expiry: ReturnType<typeof setTimeout> | undefined;
  let heartbeat: ReturnType<typeof setInterval> | undefined;
  function dispose() {
    if (closed) return;
    closed = true;
    if (expiry) clearTimeout(expiry);
    if (heartbeat) clearInterval(heartbeat);
    const previous = [...subscriptions.values()];
    subscriptions.clear();
    for (const subscription of previous) subscription.unsubscribe();
    try {
      onDispose?.();
    } catch {
      /* Cleanup hooks must not prevent socket closure. */
    }
  }
  function close(code: number, reason: string) {
    if (closed) return;
    dispose();
    try {
      socket.close(code, reason);
    } catch {
      /* The transport may already be disconnected. */
    }
  }
  function send(value: JsonValue): boolean {
    if (closed || socket.readyState !== 1) return false;
    const message = JSON.stringify(value);
    if (encoder.encode(message).byteLength + socket.bufferedAmount > limits.buffer) return false;
    try {
      socket.send(message);
      return true;
    } catch {
      return false;
    }
  }
  function checkExpiry() {
    const remaining = session.expiresAt * 1000 - Date.now();
    if (!Number.isSafeInteger(session.expiresAt) || remaining <= 0) {
      close(4401, "AUTH_EXPIRED");
      return;
    }
    expiry = setTimeout(checkExpiry, Math.min(remaining, 2_147_483_647));
  }
  checkExpiry();
  if (!closed) {
    heartbeat = setInterval(() => {
      if (awaitingPong) {
        close(1001, "HEARTBEAT_TIMEOUT");
        return;
      }
      awaitingPong = true;
      if (!send({ protocol: protocolVersion, type: "ping" })) close(1013, "RESYNC_REQUIRED");
    }, limits.heartbeat);
    if (!send({ protocol: protocolVersion, type: "ready" })) close(1013, "RESYNC_REQUIRED");
  }
  return {
    dispose,
    stop: () => close(1012, "RESTART"),
    message(data: string | Blob | ArrayBufferLike | ArrayBufferView) {
      if (closed) return;
      if (session.expiresAt * 1000 <= Date.now()) {
        close(4401, "AUTH_EXPIRED");
        return;
      }
      if (Date.now() - window >= 1000) {
        window = Date.now();
        received = 0;
      }
      if (++received > limits.rate) {
        close(1013, "RATE_LIMIT");
        return;
      }
      if (!v.is(v.string(), data)) {
        close(1003, "TEXT_REQUIRED");
        return;
      }
      if (encoder.encode(data).byteLength > limits.message) {
        close(1009, "MESSAGE_TOO_LARGE");
        return;
      }
      try {
        const message = v.parse(incoming, JSON.parse(data));
        if (message.protocol !== protocolVersion) {
          close(4406, "PROTOCOL_MISMATCH");
          return;
        }
        if (message.type === "pong") {
          awaitingPong = false;
          return;
        }
        if (message.type === "unsubscribe") {
          const subscription = subscriptions.get(message.id);
          subscriptions.delete(message.id);
          subscription?.unsubscribe();
          return;
        }
        if (subscriptions.has(message.id)) {
          close(1008, "DUPLICATE_SUBSCRIPTION");
          return;
        }
        if (subscriptions.size >= limits.subscriptions) {
          close(1013, "SUBSCRIPTION_LIMIT");
          return;
        }
        const subscription = poller.subscribe(
          { name: message.name, version: message.version, kind: "query", args: message.args },
          session,
          {
            publish(update) {
              const response = update.response;
              const result = response.ok
                ? { ok: true, requestId: response.requestId, value: response.value }
                : response;
              return send({
                protocol: protocolVersion,
                type: "result",
                id: message.id,
                sequence: update.sequence,
                ...result,
              });
            },
            close(reason) {
              subscriptions.delete(message.id);
              if (closed) return;
              if (reason === "AUTH_EXPIRED") {
                close(4401, reason);
                return;
              }
              if (reason === "RESYNC_REQUIRED" || reason === "STOPPED") {
                close(1013, "RESYNC_REQUIRED");
                return;
              }
              if (!send({ protocol: protocolVersion, type: "closed", id: message.id, reason }))
                close(1013, "RESYNC_REQUIRED");
            },
          },
        );
        subscriptions.set(message.id, subscription);
      } catch {
        close(1008, "INVALID_MESSAGE");
      }
    },
  };
}
