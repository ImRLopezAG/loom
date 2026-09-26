import { expect, test } from "vite-plus/test";
import { createAuthLifecycle } from "../../../apps/loom/src/core/client/auth-lifecycle";
import type { VerifiedClientSession } from "loom/client";

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test("auth refresh is single-flight, preserves same-principal cache, and ignores old verification", async () => {
  let token = "alice";
  let notify: (() => void) | undefined;
  let reads = 0;
  const cleared: string[] = [];
  const peers: {
    token: string;
    prefix: string;
    disposed: boolean;
    verify: ReturnType<typeof deferred<VerifiedClientSession>>;
  }[] = [];
  let visible: (typeof peers)[number] | null = null;
  const lifecycle = createAuthLifecycle({
    url: "https://service.test",
    auth: {
      getToken: async () => {
        reads++;
        return token;
      },
      subscribe(fn) {
        notify = fn;
        return () => {
          notify = undefined;
        };
      },
    },
    createClient(options) {
      const peer = {
        token,
        prefix: options.cachePrefix,
        disposed: false,
        verify: deferred<VerifiedClientSession>(),
        dispose() {
          this.disposed = true;
        },
        verifySession() {
          return this.verify.promise;
        },
      };
      peers.push(peer);
      return peer;
    },
    onConnection(connection) {
      visible = connection;
    },
    clearCache(prefix) {
      cleared.push(prefix);
    },
  });
  const verified = (key: string) => ({ key, expiresAt: Date.now() / 1000 + 3600 });
  try {
    const first = lifecycle.refresh();
    expect(lifecycle.refresh()).toBe(first);
    await Promise.resolve();
    peers[0]!.verify.resolve(verified("alice"));
    await first;
    expect(reads).toBe(1);
    expect(visible).toBe(peers[0]);
    const refreshed = lifecycle.refresh();
    await Promise.resolve();
    peers[1]!.verify.resolve(verified("alice"));
    await refreshed;
    expect(peers[1]!.prefix).toBe(peers[0]!.prefix);
    expect(cleared).toEqual([]);
    token = "bob";
    notify!();
    await Promise.resolve();
    const bob = peers[2]!;
    token = "alice";
    notify!();
    await Promise.resolve();
    const aliceAgain = peers[3]!;
    bob.verify.resolve(verified("bob"));
    aliceAgain.verify.resolve(verified("alice"));
    await lifecycle.refresh();
    expect(visible).toBe(aliceAgain);
    expect(bob.disposed).toBe(true);
    expect(aliceAgain.prefix).not.toBe(peers[0]!.prefix);
    expect(cleared).toContain(peers[0]!.prefix);
  } finally {
    lifecycle.dispose();
  }
  expect(visible).toBe(null);
  expect(notify).toBeUndefined();
});

test("logout and verification failure clear only the owned epoch and dispose the peer", async () => {
  let token: string | null = "expired";
  const cleared: string[] = [];
  let disposed = 0;
  let errors = 0;
  const lifecycle = createAuthLifecycle({
    url: "https://service.test",
    auth: { getToken: async () => token },
    createClient() {
      return {
        dispose() {
          disposed++;
        },
        async verifySession(): Promise<VerifiedClientSession> {
          throw new Error("expired");
        },
      };
    },
    onConnection(connection) {
      expect(connection).toBe(null);
    },
    clearCache(prefix) {
      cleared.push(prefix);
    },
    onError() {
      errors++;
    },
  });
  await lifecycle.refresh();
  token = null;
  await lifecycle.refresh();
  lifecycle.dispose();
  expect(errors).toBe(1);
  expect(disposed).toBe(1);
  expect(new Set(cleared).size).toBe(3);
});
