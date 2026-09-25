import { expect, test } from "vite-plus/test";
import { createStorageClient, LoomClientError } from "@loom/core/client";

const upload = { bucket: "uploads", size: 1, contentType: "text/plain", sha256: "0".repeat(64) };
const saved = { id: "11111111-1111-4111-8111-111111111111", state: "pending", errorCode: null };
const success = () => Response.json({ protocol: 1, ok: true, requestId: "test", value: saved });

test("storage respects provider retry timing and preserves the intent request", async () => {
  for (const status of [429, 503]) {
    const bodies: string[] = [];
    const times: number[] = [];
    const retryAt = Math.ceil(Date.now() / 1000) * 1000 + 1000;
    const client = createStorageClient({
      url: "https://api.example.test",
      fetch: async (url, init) => {
        times.push(Date.now());
        bodies.push(await new Request(url, init).text());
        return bodies.length === 1
          ? new Response("provider response", {
              status,
              headers: { "retry-after": status === 429 ? "1" : new Date(retryAt).toUTCString() },
            })
          : success();
      },
    });
    expect(await client.create(upload)).toEqual(saved);
    expect(bodies).toHaveLength(2);
    expect(bodies[0]).toBe(bodies[1]);
    expect(times[1]).toBeGreaterThanOrEqual(status === 429 ? (times[0] ?? 0) + 1000 : retryAt);
  }
});

test("provider waits remain bounded by cancellation and the request deadline", async () => {
  for (const cancel of [false, true]) {
    let calls = 0;
    const controller = new AbortController();
    const client = createStorageClient({
      url: "https://api.example.test",
      timeoutMs: 50,
      fetch: async () => {
        calls++;
        if (cancel) setTimeout(() => controller.abort(), 10);
        return new Response("provider-secret", { status: 429, headers: { "retry-after": "999999999999999999999" } });
      },
    });
    await expect(client.create(upload, { signal: controller.signal })).rejects.toMatchObject({
      code: cancel ? "CANCELLED" : "TIMEOUT",
    });
    expect(calls).toBe(1);
  }
});

test("storage throttling retries are bounded and tolerate malformed timing", async () => {
  for (const retryAfter of ["nonsense", "-1", "1.5", "0"]) {
    let calls = 0;
    const client = createStorageClient({
      url: "https://api.example.test",
      maxAttempts: 2,
      fetch: async () => {
        calls++;
        return new Response("provider-secret", { status: 429, headers: { "retry-after": retryAfter } });
      },
    });
    await expect(client.create(upload)).rejects.toMatchObject({
      code: "RATE_LIMITED",
      message: "The server rate limit was reached",
    });
    expect(calls).toBe(2);
  }
});

test("storage retries a lost creation response with captured arguments and one idempotency key", async () => {
  const bodies: string[] = [];
  const args = { ...upload };
  const client = createStorageClient({
    url: "https://api.example.test/functions/backend",
    fetch: async (input, init) => {
      expect(String(input)).toBe("https://api.example.test/functions/backend/api/loom/storage");
      bodies.push(await new Request(input, init).text());
      if (bodies.length === 1) {
        args.size = 2;
        throw new TypeError("lost response containing secret");
      }
      return success();
    },
  });
  expect(await client.create(args)).toEqual(saved);
  expect(bodies).toHaveLength(2);
  expect(bodies[0]).toBe(bodies[1]);
  expect(JSON.parse(bodies[0] ?? "{}")).toMatchObject({ upload: { size: 1 }, requestKey: expect.any(String) });
});

test("storage refreshes authentication once and rejects identity changes", async () => {
  const refreshes: boolean[] = [];
  const client = createStorageClient({
    url: "https://api.example.test",
    getAuth: async ({ forceRefresh }) => {
      refreshes.push(forceRefresh);
      return { token: forceRefresh ? "fresh" : "old", identityKey: "alice" };
    },
    fetch: async (_input, init) =>
      new Headers(init?.headers).get("authorization") === "Bearer fresh"
        ? success()
        : Response.json(
            {
              protocol: 1,
              ok: false,
              requestId: "expired",
              error: { code: "UNAUTHENTICATED", message: "Authentication required" },
            },
            { status: 401 },
          ),
  });
  expect(await client.create(upload)).toEqual(saved);
  expect(refreshes).toEqual([false, true]);
  let calls = 0;
  const changing = createStorageClient({
    url: "https://api.example.test",
    getAuth: async ({ forceRefresh }) => ({ token: "token", identityKey: forceRefresh ? "bob" : "alice" }),
    fetch: async () => {
      calls++;
      return new Response(null, { status: 401 });
    },
  });
  await expect(changing.create(upload)).rejects.toMatchObject({ code: "AUTH_CHANGED" });
  expect(calls).toBe(1);
});

test("client rejects protocol mismatch, malformed responses and cancelled calls", async () => {
  for (const response of [
    { body: { protocol: 2, ok: true, requestId: "test", value: null }, code: "PROTOCOL_MISMATCH" },
    { body: { protocol: 1, ok: true, value: null }, code: "INVALID_RESPONSE" },
  ]) {
    const client = createStorageClient({
      url: "https://api.example.test",
      fetch: async () => Response.json(response.body),
    });
    await expect(client.create(upload)).rejects.toBeInstanceOf(LoomClientError);
    await expect(client.create(upload)).rejects.toMatchObject({ code: response.code });
  }
  const abort = new AbortController();
  abort.abort();
  const client = createStorageClient({
    url: "https://api.example.test",
    fetch: async () => {
      throw new Error("must not fetch");
    },
  });
  await expect(client.create(upload, { signal: abort.signal })).rejects.toMatchObject({
    code: "CANCELLED",
  });
});

test("client bounds actual response bytes and cancels stalled reads and retry waits", async () => {
  let attempts = 0;
  const oversized = createStorageClient({
    url: "https://api.example.test",
    maxResponseBytes: 1024,
    fetch: async () => {
      attempts++;
      return new Response("x".repeat(1025), { headers: { "content-length": "1" } });
    },
  });
  await expect(oversized.create(upload)).rejects.toMatchObject({ code: "RESPONSE_TOO_LARGE" });
  expect(attempts).toBe(1);
  let cancelled = false;
  const stalled = createStorageClient({
    url: "https://api.example.test",
    timeoutMs: 20,
    fetch: async () =>
      new Response(
        new ReadableStream({
          cancel() {
            cancelled = true;
          },
        }),
      ),
  });
  await expect(stalled.create(upload)).rejects.toMatchObject({ code: "TIMEOUT" });
  expect(cancelled).toBe(true);
  const controller = new AbortController();
  const retrying = createStorageClient({
    url: "https://api.example.test",
    fetch: async () => {
      attempts++;
      setTimeout(() => controller.abort(), 10);
      throw new Error("secret");
    },
  });
  await expect(retrying.create(upload, { signal: controller.signal })).rejects.toMatchObject({
    code: "CANCELLED",
  });
  expect(attempts).toBe(2);
});

test("client keeps server error codes and request IDs without retrying application failures", async () => {
  let calls = 0;
  const client = createStorageClient({
    url: "https://api.example.test",
    fetch: async () => {
      calls++;
      return Response.json(
        {
          protocol: 1,
          ok: false,
          requestId: "denied",
          error: { code: "FORBIDDEN", message: "Function access denied" },
        },
        { status: 403 },
      );
    },
  });
  await expect(client.create(upload)).rejects.toMatchObject({ code: "FORBIDDEN", requestId: "denied" });
  expect(calls).toBe(1);
  await expect(client.create({ ...upload, size: Number.NaN })).rejects.toMatchObject({ code: "INVALID_ARGUMENTS" });
  expect(calls).toBe(1);
});
