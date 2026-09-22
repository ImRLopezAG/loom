import { expect, test } from "vite-plus/test";
import * as v from "valibot";
import { createClient, createQueryCache } from "@loom/core/client";
import type { FunctionReference } from "@loom/core/client";

const reference: FunctionReference<"query", "public", { a: number; b: number }, { owner: string }> = {
  name: "tasks:read",
  kind: "query",
  visibility: "public",
  version: "a".repeat(64),
};
const response = (owner: string) => Response.json({ protocol: 1, ok: true, requestId: "test", value: { owner } });

test("query cache deduplicates canonical arguments and separates versions and identities", async () => {
  let identity = "alice";
  let requests = 0;
  const client = createClient({
    url: "https://api.example.test",
    getAuth: async () => ({ token: "token", identityKey: identity }),
    fetch: async () => {
      requests++;
      return response(identity);
    },
  });
  const cache = createQueryCache({ client, deployment: "preview-one", identityKey: identity });
  const results = await Promise.all([cache.read(reference, { a: 1, b: 2 }), cache.read(reference, { b: 2, a: 1 })]);
  expect(requests).toBe(1);
  results[0]!.owner = "changed";
  expect(await cache.read(reference, { a: 1, b: 2 })).toEqual({ owner: "alice" });
  await cache.read({ ...reference, version: "b".repeat(64) }, { a: 1, b: 2 });
  expect(requests).toBe(2);
  identity = "bob";
  cache.setIdentity(identity);
  expect(await cache.read(reference, { a: 1, b: 2 })).toEqual({ owner: "bob" });
  expect(requests).toBe(3);
  cache.setIdentity(null);
  await expect(cache.read(reference, { a: 1, b: 2 })).rejects.toMatchObject({ code: "AUTH_CHANGED" });
  expect(requests).toBe(3);
});

test("sign-out aborts in-flight queries and refuses late results even when the transport ignores cancellation", async () => {
  const pending = Promise.withResolvers<Response>();
  const started = Promise.withResolvers<AbortSignal | null | undefined>();
  const client = createClient({
    url: "https://api.example.test",
    getAuth: async () => ({ token: "token", identityKey: "alice" }),
    fetch: async (_url, init) => {
      started.resolve(init.signal);
      return pending.promise;
    },
  });
  const cache = createQueryCache({ client, deployment: "preview-one", identityKey: "alice" });
  const read = cache.read(reference, { a: 1, b: 2 });
  const signal = await started.promise;
  cache.setIdentity(null);
  expect(signal?.aborted).toBe(true);
  pending.resolve(response("alice"));
  await expect(read).rejects.toMatchObject({ code: "AUTH_CHANGED" });
});

test("query cache evicts old entries and retries failures without retaining errors", async () => {
  let requests = 0;
  const client = createClient({
    url: "https://api.example.test",
    fetch: async () => {
      requests++;
      return requests === 1
        ? Response.json(
            { protocol: 1, ok: false, requestId: "test", error: { code: "FORBIDDEN", message: "Denied" } },
            { status: 403 },
          )
        : response("anonymous");
    },
  });
  const cache = createQueryCache({ client, deployment: "one", identityKey: null, maxEntries: 1 });
  await expect(cache.read(reference, { a: 1, b: 2 })).rejects.toMatchObject({ code: "FORBIDDEN" });
  await cache.read(reference, { a: 1, b: 2 });
  await cache.read(reference, { a: 2, b: 2 });
  await cache.read(reference, { a: 1, b: 2 });
  expect(requests).toBe(4);
  cache.clear();
  await cache.read(reference, { a: 1, b: 2 });
  expect(requests).toBe(5);
});

test("clear permits an abort listener to start a fresh read without reusing the cancelled entry", async () => {
  const started = Promise.withResolvers<void>();
  const pending = Promise.withResolvers<Response>();
  const replacement = Promise.withResolvers<{ owner: string }>();
  let requests = 0;
  const client = createClient({
    url: "https://api.example.test",
    fetch: async (_url, init) => {
      requests++;
      if (requests !== 1) return response("fresh");
      init.signal?.addEventListener(
        "abort",
        () => {
          cache.read(reference, { a: 1, b: 2 }).then(replacement.resolve, replacement.reject);
        },
        { once: true },
      );
      started.resolve();
      return pending.promise;
    },
  });
  const cache = createQueryCache({ client, deployment: "one", identityKey: null });
  const read = cache.read(reference, { a: 1, b: 2 });
  await started.promise;
  cache.clear();
  pending.resolve(response("stale"));
  const outcomes = await Promise.allSettled([read, replacement.promise]);
  expect(outcomes[0]).toMatchObject({ status: "rejected", reason: { code: "CANCELLED" } });
  expect(outcomes[1]).toEqual({ status: "fulfilled", value: { owner: "fresh" } });
  expect(requests).toBe(2);
});

test("cache captures contracts before deferred authentication and registers requests before auth callbacks", async () => {
  let invalidate = false;
  let requests = 0;
  const names: string[] = [];
  const client = createClient({
    url: "https://api.example.test",
    getAuth: async () => {
      if (invalidate) {
        invalidate = false;
        cache.clear();
      }
      return null;
    },
    fetch: async (_url, init) => {
      requests++;
      names.push(v.parse(v.string(), init.body));
      return response("anonymous");
    },
  });
  const cache = createQueryCache({ client, deployment: "one", identityKey: null });
  const mutable = { ...reference };
  const args = { a: 1, b: 2 };
  const captured = cache.read(mutable, args);
  mutable.name = "tasks:other";
  args.a = 9;
  await captured;
  expect(names[0]).toContain('"name":"tasks:read"');
  expect(names[0]).toContain('"a":1');
  invalidate = true;
  await expect(cache.read(reference, { a: 2, b: 2 })).rejects.toMatchObject({ code: "CANCELLED" });
  expect(requests).toBe(1);
  await cache.read(reference, { a: 2, b: 2 });
  expect(requests).toBe(2);
});
