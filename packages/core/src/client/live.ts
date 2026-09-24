import * as v from "valibot";
import { protocolVersion } from "./protocol";
import { canonical } from "../validation/canonical";
import { wire } from "../validation/encoding";
import type { JsonValue } from "../schema/fields";
import { createRealtimeConnection } from "./reconnect";
import type { RealtimeConnectionOptions, ServerMessage } from "./reconnect";
import { LoomClientError } from "./transport";
import type { WireValue } from "./transport";
import type { FunctionReference } from "./reference";

export type QuerySnapshot<T> =
  | { readonly status: "loading" | "signed-out" | "stopped" }
  | { readonly status: "success"; readonly value: T }
  | { readonly status: "error"; readonly error: LoomClientError };
export interface LiveQueryStore<T> {
  getSnapshot(this: void): QuerySnapshot<T>;
  subscribe(this: void, listener: () => void): () => void;
}
export interface LiveQueryClientOptions extends Pick<
  RealtimeConnectionOptions,
  "url" | "client" | "identityKey" | "socket"
> {
  readonly deployment: string;
  readonly maxSubscriptions?: number;
}
interface Entry {
  key: string;
  readonly definition: string;
  readonly name: string;
  readonly version: string;
  readonly args: JsonValue;
  readonly listeners: Set<{ notify(): void }>;
  snapshot: QuerySnapshot<JsonValue>;
  id: string | undefined;
  sequence: number;
}
const loading = Object.freeze({ status: "loading" } as const);
const signedOut = Object.freeze({ status: "signed-out" } as const);
const stoppedSnapshot = Object.freeze({ status: "stopped" } as const);
function freezeValue(value: JsonValue): JsonValue {
  if (Array.isArray(value)) {
    for (const item of value) freezeValue(item);
    Object.freeze(value);
  } else if (v.is(v.record(v.string(), v.unknown()), value)) {
    for (const item of Object.values(value)) freezeValue(item);
    Object.freeze(value);
  }
  return value;
}

/** query() is side-effect free; only subscribed stores occupy capacity or open a connection. */
export function createLiveQueryClient(options: LiveQueryClientOptions) {
  const { deployment, url, client } = options;
  const socket = options.socket ?? ((address: string, protocols: string[]) => new WebSocket(address, protocols));
  const maximum = options.maxSubscriptions ?? 32;
  if (!deployment || deployment.length > 2048) throw new Error("Invalid live deployment identity");
  if (!Number.isInteger(maximum) || maximum < 1 || maximum > 1000) throw new Error("Invalid live subscription limit");
  let identity = options.identityKey;
  let stopped = false;
  const identityListeners = new Set<() => void>();
  let identityEpoch = 0;
  function notifyIdentity() {
    for (const listener of Array.from(identityListeners)) {
      try {
        listener();
      } catch {
        /* A failed consumer cannot prevent other caches from retiring. */
      }
    }
  }
  let ready = false;
  let revision = 0;
  let connectionGeneration = 0;
  let fallback: QuerySnapshot<JsonValue> = identity === null ? signedOut : loading;
  let connection: ReturnType<typeof createRealtimeConnection> | undefined;
  const entries = new Map<string, Entry>();
  const ids = new Map<string, Entry>();
  const keyFor = (definition: string) => canonical([deployment, identity, definition]);
  function notify(changed: readonly Entry[], epoch = revision) {
    for (const entry of changed) {
      if (epoch !== revision) return;
      const snapshot = entry.snapshot;
      const listeners = [...entry.listeners];
      for (const listener of listeners) {
        if (epoch !== revision || snapshot !== entry.snapshot || entries.get(entry.key) !== entry) break;
        if (!entry.listeners.has(listener)) continue;
        try {
          listener.notify();
        } catch {
          /* One observer cannot prevent others from receiving state. */
        }
      }
    }
  }
  function reset(snapshot: QuerySnapshot<JsonValue>, notifyNow = true) {
    revision++;
    ready = false;
    fallback = snapshot;
    ids.clear();
    const changed = [...entries.values()];
    for (const entry of changed) {
      entry.snapshot = snapshot;
      entry.id = undefined;
      entry.sequence = 0;
    }
    if (notifyNow) notify(changed);
    return changed;
  }
  function disconnect() {
    connectionGeneration++;
    const previous = connection;
    connection = undefined;
    ready = false;
    previous?.stop();
  }
  function subscribeEntry(entry: Entry) {
    if (!ready || entry.id || !connection || identity === null) return;
    const id = crypto.randomUUID();
    entry.id = id;
    entry.sequence = 0;
    ids.set(id, entry);
    connection.send({ type: "subscribe", id, name: entry.name, version: entry.version, args: entry.args });
  }
  function receive(message: ServerMessage) {
    if (message.type === "ready") {
      ready = true;
      const current = [...entries.values()];
      for (const entry of current) {
        if (!ready) break;
        if (entries.get(entry.key) === entry) subscribeEntry(entry);
      }
      return;
    }
    const entry = ids.get(message.id);
    if (!entry) return;
    if (message.type === "closed") {
      ids.delete(message.id);
      entry.id = undefined;
      if (entry.snapshot.status !== "error") {
        entry.snapshot = Object.freeze({
          status: "error",
          error: new LoomClientError("SUBSCRIPTION_CLOSED", "The live query closed"),
        });
        notify([entry]);
      }
      return;
    }
    if (message.sequence <= entry.sequence) return;
    if (message.sequence !== entry.sequence + 1) {
      ids.delete(message.id);
      entry.id = undefined;
      entry.snapshot = Object.freeze({
        status: "error",
        error: new LoomClientError("SEQUENCE_GAP", "The live query needs a fresh subscription"),
      });
      connection?.send({ type: "unsubscribe", id: message.id });
    } else {
      entry.sequence = message.sequence;
      entry.snapshot = message.ok
        ? Object.freeze({ status: "success", value: freezeValue(message.value) })
        : Object.freeze({
            status: "error",
            error: new LoomClientError(message.error.code, message.error.message, message.requestId),
          });
    }
    notify([entry]);
  }
  function ensureConnection() {
    if (connection || stopped || identity === null || entries.size === 0) return;
    const epoch = ++connectionGeneration;
    connection = createRealtimeConnection({
      url,
      client,
      identityKey: identity,
      socket,
      onMessage(message) {
        if (epoch === connectionGeneration) receive(message);
      },
      onState(state, error) {
        if (epoch !== connectionGeneration) return;
        if (state === "connecting" || state === "reconnecting") reset(loading);
        else if (state === "error")
          reset(
            Object.freeze({
              status: "error",
              error: error ?? new LoomClientError("TRANSPORT_ERROR", "The live connection failed"),
            }),
          );
      },
    });
  }
  return {
    getIdentity() {
      return identity;
    },
    subscribeIdentity(listener: () => void) {
      identityListeners.add(listener);
      return () => {
        identityListeners.delete(listener);
      };
    },
    query<Input, Output>(
      reference: FunctionReference<"query", "public", Input, Output>,
      args: NoInfer<Input>,
    ): LiveQueryStore<WireValue<Output>> {
      if (reference.kind !== "query" || reference.visibility !== "public" || !/^[a-f0-9]{64}$/.test(reference.version))
        throw new LoomClientError("INVALID_REFERENCE", "Live queries require a public generated query reference");
      const encoded = v.safeParse(wire, args);
      if (!encoded.success) throw new LoomClientError("INVALID_ARGUMENTS", "Arguments must use supported wire values");
      const captured = structuredClone(encoded.output);
      const { name, version } = reference;
      const frame = JSON.stringify({
        protocol: protocolVersion,
        type: "subscribe",
        id: "0".repeat(36),
        name,
        version,
        args: captured,
      });
      if (new TextEncoder().encode(frame).byteLength > 65536)
        throw new LoomClientError("PAYLOAD_TOO_LARGE", "Live query arguments exceed the message limit");
      const definition = canonical([name, version, captured]);
      return {
        getSnapshot() {
          // SAFETY: The key contains the generated name/version and canonical wire arguments; the server
          // validates that version and output contract. Snapshots are deeply frozen and never cross identities.
          return (entries.get(keyFor(definition))?.snapshot ?? fallback) as QuerySnapshot<WireValue<Output>>;
        },
        subscribe(listener) {
          if (stopped) return () => {};
          const key = keyFor(definition);
          let entry = entries.get(key);
          if (!entry) {
            if (entries.size >= maximum)
              throw new LoomClientError("SUBSCRIPTION_LIMIT", "Too many active live queries");
            entry = {
              key,
              definition,
              name,
              version,
              args: captured,
              listeners: new Set(),
              snapshot: fallback,
              id: undefined,
              sequence: 0,
            };
            entries.set(key, entry);
          }
          const observer = { notify: listener };
          entry.listeners.add(observer);
          try {
            ensureConnection();
            subscribeEntry(entry);
          } catch (cause) {
            entry.listeners.delete(observer);
            if (entry.listeners.size === 0) entries.delete(entry.key);
            throw cause;
          }
          const owned = entry;
          return () => {
            if (!owned.listeners.delete(observer) || owned.listeners.size > 0) return;
            entries.delete(owned.key);
            const id = owned.id;
            if (id) ids.delete(id);
            if (entries.size === 0) {
              disconnect();
              fallback = stopped ? stoppedSnapshot : identity === null ? signedOut : loading;
            } else if (id) connection?.send({ type: "unsubscribe", id });
          };
        },
      };
    },
    setIdentity(next: string | null) {
      if (stopped || next === identity) return;
      identity = next;
      const transition = ++identityEpoch;
      notifyIdentity();
      if (transition !== identityEpoch) return;
      // Rekey all entries before any abort or observer callback can read them.
      const current = [...entries.values()];
      entries.clear();
      for (const entry of current) {
        entry.key = keyFor(entry.definition);
        entries.set(entry.key, entry);
      }
      const changed = reset(next === null ? signedOut : loading, false);
      const epoch = revision;
      disconnect();
      if (epoch !== revision) return;
      notify(changed, epoch);
      if (epoch === revision) ensureConnection();
    },
    stop() {
      if (stopped) return;
      stopped = true;
      identityEpoch++;
      notifyIdentity();
      identityListeners.clear();
      const changed = reset(stoppedSnapshot, false);
      disconnect();
      notify(changed);
    },
  };
}
export type LiveQueryClient = ReturnType<typeof createLiveQueryClient>;
