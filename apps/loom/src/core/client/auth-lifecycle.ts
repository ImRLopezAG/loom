import type { LoomAuth } from "./cookie-session";
import type { VerifiedClientSession } from "./verified-session";

export interface SessionConnection {
  dispose(): void;
  verifySession(): Promise<VerifiedClientSession>;
}
export interface SessionClientOptions {
  readonly url: string;
  readonly cachePrefix: string;
  readonly getToken: () => Promise<string | null>;
}

/** One owner per mounted provider/request. No procedure is retried by this lifecycle. */
export function createAuthLifecycle<T extends SessionConnection>(options: {
  readonly url: string;
  readonly auth: LoomAuth;
  readonly createClient: (options: SessionClientOptions) => T;
  readonly onConnection: (connection: T | null) => void;
  readonly clearCache: (prefix: string) => void;
  readonly onError?: (error: Error) => void;
}) {
  let disposed = false;
  let revision = 0;
  let active: T | undefined;
  let key: string | undefined;
  let prefix = `loom:${crypto.randomUUID()}`;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let pending: Promise<void> | undefined;
  const stop = () => {
    clearTimeout(timer);
    active?.dispose();
    active = undefined;
    options.onConnection(null);
  };
  async function connect(generation: number) {
    try {
      const token = await options.auth.getToken();
      if (disposed || generation !== revision) return;
      if (!token) {
        options.clearCache(prefix);
        key = undefined;
        prefix = `loom:${crypto.randomUUID()}`;
        return;
      }
      // Pin the verified credential. A mutable SDK token getter must not switch
      // the identity of an already-created peer before its change event arrives.
      const getToken = async () => token;
      let connection = options.createClient({ url: options.url, getToken, cachePrefix: prefix });
      active = connection;
      const session = await connection.verifySession();
      if (disposed || generation !== revision) {
        connection.dispose();
        return;
      }
      if (key !== undefined && key !== session.key) {
        options.clearCache(prefix);
        prefix = `loom:${crypto.randomUUID()}`;
        connection.dispose();
        connection = options.createClient({ url: options.url, getToken, cachePrefix: prefix });
        active = connection;
      }
      key = session.key;
      options.onConnection(connection);
      timer = setTimeout(
        () => {
          void refresh();
        },
        Math.max(1000, Math.min(2_147_483_647, session.expiresAt * 1000 - Date.now() - 30_000)),
      );
    } catch (error) {
      if (disposed || generation !== revision) return;
      stop();
      options.clearCache(prefix);
      key = undefined;
      prefix = `loom:${crypto.randomUUID()}`;
      options.onError?.(error instanceof Error ? error : new Error("Authentication failed"));
    }
  }
  function refresh(): Promise<void> {
    if (disposed) return Promise.resolve();
    if (pending) return pending;
    stop();
    const generation = ++revision;
    const attempt = connect(generation);
    pending = attempt;
    void attempt.finally(() => {
      if (pending === attempt) pending = undefined;
    });
    return attempt;
  }
  const unsubscribe = options.auth.subscribe?.(() => {
    // Invalidate pending verification immediately, including A -> B -> A races.
    revision++;
    pending = undefined;
    stop();
    options.clearCache(prefix);
    key = undefined;
    prefix = `loom:${crypto.randomUUID()}`;
    void refresh();
  });
  return {
    refresh,
    dispose() {
      if (disposed) return;
      disposed = true;
      revision++;
      unsubscribe?.();
      stop();
      options.clearCache(prefix);
    },
  };
}
