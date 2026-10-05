import type pg from "pg";
import { withMigrationConnection } from "../migrations/connection";

export interface TcnPayload {
  /** Native tcn does not include the schema; equal table names in different schemas are ambiguous. */
  readonly table: string;
  readonly operation: "insert" | "update" | "delete";
  /** PostgreSQL output-function text, not inferred application field values. UPDATE carries OLD keys. */
  readonly keys: readonly { readonly column: string; readonly value: string }[];
}
export interface TcnNotification extends TcnPayload {
  readonly channel: string;
  readonly processId: number;
}
export interface TcnNotificationSession {
  readonly channel: string;
  readonly authority: "dedicated-session";
  readonly observability: "session";
  readonly automaticLive: false;
  /** Wait for the next delivery during this callback's lifetime. No automatic replay or table snapshot. */
  next(): Promise<TcnNotification>;
}
export class TcnNotificationError extends Error {
  constructor(
    cause: unknown,
    readonly cleanupFailures: readonly { readonly cause: unknown }[],
  ) {
    super("TCN notification session failed", { cause });
    this.name = "TcnNotificationError";
  }
}
function channelIdentifier(value: string): string {
  if (!value || value.includes("\0") || new TextEncoder().encode(value).length > 63)
    throw new Error("Invalid PostgreSQL notification channel");
  return `"${value.replaceAll('"', '""')}"`;
}

/** Decode exactly tcn's quoted payload grammar. Values remain text, independent of driver OID parsers. */
export function decodeTcnPayload(payload: string): TcnPayload {
  let offset = 0;
  function quoted(quote: string): string {
    if (payload[offset++] !== quote) throw new Error("Invalid tcn notification payload");
    let value = "";
    while (offset < payload.length) {
      const char = payload[offset++]!;
      if (char !== quote) {
        value += char;
        continue;
      }
      if (payload[offset] === quote) {
        value += quote;
        offset++;
        continue;
      }
      return value;
    }
    throw new Error("Invalid tcn notification payload");
  }
  function consume(value: string): void {
    if (payload.slice(offset, offset + value.length) !== value) throw new Error("Invalid tcn notification payload");
    offset += value.length;
  }
  const table = quoted('"');
  consume(",");
  const event = payload[offset++];
  const operation = event === "I" ? "insert" : event === "U" ? "update" : event === "D" ? "delete" : undefined;
  if (!operation) throw new Error("Invalid tcn notification operation");
  const keys: { readonly column: string; readonly value: string }[] = [];
  while (offset < payload.length) {
    consume(",");
    const column = quoted('"');
    consume("=");
    keys.push(Object.freeze({ column, value: quoted("'") }));
  }
  if (!table || !keys.length || keys.some((key) => !key.column)) throw new Error("Invalid tcn notification payload");
  return Object.freeze({ table, operation, keys: Object.freeze(keys) });
}

/**
 * Explicit operator LISTEN scope on a direct dedicated PostgreSQL 18 connection. LISTEN is committed
 * before callback admission, and UNLISTEN/session close run after success, failure or cancellation.
 * This delivers transient database notifications, never invocation-backed automatic live subscriptions.
 */
export async function withTcnNotifications<Result>(
  connectionString: string,
  options: { readonly channel?: string; readonly signal?: AbortSignal },
  operation: (session: TcnNotificationSession) => Promise<Result>,
): Promise<{ readonly completion: "closed"; readonly value: Result }> {
  const channel = options.channel ?? "tcn";
  const quotedChannel = channelIdentifier(channel);
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("Expected a PostgreSQL operator URL");
  if (url.hostname.endsWith(".neon.tech") && url.hostname.split(".")[0]?.endsWith("-pooler"))
    throw new Error("TCN notifications require a direct dedicated session, not a Neon pooler URL");
  options.signal?.throwIfAborted();
  let failure: { cause: unknown } | undefined;
  const cleanupFailures: { cause: unknown }[] = [];
  let callbackClosed = false;
  try {
    const value = await withMigrationConnection(connectionString, async (client) => {
      let active = true;
      let listening = false;
      let connectionFailed = false;
      const queue: TcnNotification[] = [];
      const waiters: ReturnType<typeof Promise.withResolvers<TcnNotification>>[] = [];
      const stopped = Promise.withResolvers<never>();
      void stopped.promise.catch(() => undefined);
      function stop(cause: unknown) {
        failure ??= { cause };
        active = false;
        for (const waiter of waiters.splice(0)) waiter.reject(failure.cause);
        stopped.reject(failure.cause);
      }
      const abort = () => stop(options.signal?.reason);
      const error = (cause: Error) => {
        connectionFailed = true;
        stop(cause);
      };
      const notification = (message: pg.Notification) => {
        if (!active || message.channel !== channel) return;
        try {
          if (message.payload === undefined) throw new Error("Missing tcn notification payload");
          const decoded = Object.freeze({
            ...decodeTcnPayload(message.payload),
            channel,
            processId: message.processId,
          });
          const waiter = waiters.shift();
          if (waiter) waiter.resolve(decoded);
          else queue.push(decoded);
        } catch (cause) {
          stop(cause);
        }
      };
      client.on("notification", notification);
      client.on("error", error);
      options.signal?.addEventListener("abort", abort, { once: true });
      try {
        if (options.signal?.aborted) abort();
        options.signal?.throwIfAborted();
        await client.query(`LISTEN ${quotedChannel}`);
        listening = true;
        if (failure) throw failure.cause;
        const session: TcnNotificationSession = Object.freeze({
          channel,
          authority: "dedicated-session",
          observability: "session",
          automaticLive: false,
          next() {
            if (!active) {
              const refused = Promise.reject(
                failure ? failure.cause : new Error("TCN notification session is inactive"),
              );
              void refused.catch(() => undefined);
              return refused;
            }
            const queued = queue.shift();
            if (queued) return Promise.resolve(queued);
            const waiter = Promise.withResolvers<TcnNotification>();
            void waiter.promise.catch(() => undefined);
            waiters.push(waiter);
            return waiter.promise;
          },
        });
        const callback = Promise.resolve().then(() => operation(session));
        void callback.catch(() => undefined);
        return await Promise.race([callback, stopped.promise]);
      } catch (cause) {
        failure ??= { cause };
        throw failure.cause;
      } finally {
        active = false;
        for (const waiter of waiters.splice(0)) waiter.reject(new Error("TCN notification session is inactive"));
        queue.length = 0;
        if (listening && !connectionFailed) {
          try {
            await client.query(`UNLISTEN ${quotedChannel}`);
          } catch (cause) {
            cleanupFailures.push({ cause });
          }
        }
        client.removeListener("notification", notification);
        client.removeListener("error", error);
        options.signal?.removeEventListener("abort", abort);
        callbackClosed = true;
      }
    });
    if (failure || cleanupFailures.length)
      throw new TcnNotificationError(failure ? failure.cause : cleanupFailures[0]?.cause, cleanupFailures);
    return { completion: "closed", value };
  } catch (cause) {
    if (cause instanceof TcnNotificationError) throw cause;
    if (callbackClosed && failure && cause !== failure.cause) cleanupFailures.push({ cause });
    else if (callbackClosed && !failure) cleanupFailures.push({ cause });
    failure ??= { cause };
    throw new TcnNotificationError(failure.cause, cleanupFailures);
  }
}
