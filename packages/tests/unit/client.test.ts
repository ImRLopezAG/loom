import { expect, test } from "vite-plus/test";
import { createClient, LoomClientError } from "@loom/core/client";
import type { FunctionReference } from "@loom/core/client";

const mutation: FunctionReference<"mutation", "public", { value: number }, { value: bigint }> = {
  name: "counter:write",
  kind: "mutation",
  visibility: "public",
  version: "a".repeat(64),
};
const success = () => Response.json({ protocol: 1, ok: true, requestId: "test", value: { value: "1" } });

test("client retries a lost mutation response with captured arguments and one idempotency key", async () => {
  const bodies: string[] = [];
  const args = { value: 1 };
  const client = createClient({
    url: "https://api.example.test/functions/backend",
    fetch: async (input, init) => {
      expect(String(input)).toBe("https://api.example.test/functions/backend/api/loom/call");
      bodies.push(await new Request(input, init).text());
      if (bodies.length === 1) {
        args.value = 2;
        throw new TypeError("lost response containing secret");
      }
      return success();
    },
  });
  expect(await client.call(mutation, args)).toEqual({ value: "1" });
  expect(bodies).toHaveLength(2);
  expect(bodies[0]).toBe(bodies[1]);
  expect(JSON.parse(bodies[0] ?? "{}")).toMatchObject({ args: { value: 1 }, idempotencyKey: expect.any(String) });
});

test("client refreshes authentication once, rejects identity changes and never retries actions after transport failure", async () => {
  const refreshes: boolean[] = [];
  const client = createClient({
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
  expect(await client.call(mutation, { value: 1 })).toEqual({ value: "1" });
  expect(refreshes).toEqual([false, true]);
  let calls = 0;
  const changing = createClient({
    url: "https://api.example.test",
    getAuth: async ({ forceRefresh }) => ({ token: "token", identityKey: forceRefresh ? "bob" : "alice" }),
    fetch: async () => {
      calls++;
      return new Response(null, { status: 401 });
    },
  });
  await expect(changing.call(mutation, { value: 1 })).rejects.toMatchObject({ code: "AUTH_CHANGED" });
  expect(calls).toBe(1);
  const failing = createClient({
    url: "https://api.example.test",
    fetch: async () => {
      calls++;
      throw new Error("secret");
    },
  });
  await expect(failing.call({ ...mutation, kind: "action" }, { value: 1 })).rejects.toMatchObject({
    code: "TRANSPORT_ERROR",
  });
  expect(calls).toBe(2);
});

test("client rejects protocol mismatch, malformed responses and cancelled calls", async () => {
  for (const response of [
    { body: { protocol: 2, ok: true, requestId: "test", value: null }, code: "PROTOCOL_MISMATCH" },
    { body: { protocol: 1, ok: true, value: null }, code: "INVALID_RESPONSE" },
  ]) {
    const client = createClient({ url: "https://api.example.test", fetch: async () => Response.json(response.body) });
    await expect(client.call(mutation, { value: 1 })).rejects.toBeInstanceOf(LoomClientError);
    await expect(client.call(mutation, { value: 1 })).rejects.toMatchObject({ code: response.code });
  }
  const abort = new AbortController();
  abort.abort();
  const client = createClient({
    url: "https://api.example.test",
    fetch: async () => {
      throw new Error("must not fetch");
    },
  });
  await expect(client.call(mutation, { value: 1 }, { signal: abort.signal })).rejects.toMatchObject({
    code: "CANCELLED",
  });
});

test("client bounds actual response bytes and cancels stalled reads and retry waits", async () => {
  let attempts = 0;
  const oversized = createClient({
    url: "https://api.example.test",
    maxResponseBytes: 1024,
    fetch: async () => {
      attempts++;
      return new Response("x".repeat(1025), { headers: { "content-length": "1" } });
    },
  });
  await expect(oversized.call(mutation, { value: 1 })).rejects.toMatchObject({ code: "RESPONSE_TOO_LARGE" });
  expect(attempts).toBe(1);
  let cancelled = false;
  const stalled = createClient({
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
  await expect(stalled.call(mutation, { value: 1 })).rejects.toMatchObject({ code: "TIMEOUT" });
  expect(cancelled).toBe(true);
  const controller = new AbortController();
  const retrying = createClient({
    url: "https://api.example.test",
    fetch: async () => {
      attempts++;
      setTimeout(() => controller.abort(), 10);
      throw new Error("secret");
    },
  });
  await expect(retrying.call(mutation, { value: 1 }, { signal: controller.signal })).rejects.toMatchObject({
    code: "CANCELLED",
  });
  expect(attempts).toBe(2);
});

test("client keeps server error codes and request IDs without retrying application failures", async () => {
  let calls = 0;
  const client = createClient({
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
  await expect(client.call(mutation, { value: 1 })).rejects.toMatchObject({ code: "FORBIDDEN", requestId: "denied" });
  expect(calls).toBe(1);
  await expect(client.call(mutation, { value: Number.NaN })).rejects.toMatchObject({ code: "INVALID_ARGUMENTS" });
  expect(calls).toBe(1);
});

test("client obtains fresh origin-bound connection tickets with identity checks and token refresh", async () => {
  const refreshes: boolean[] = [];
  let issued = 0;
  const client = createClient({
    url: "https://api.example.test/functions/backend",
    getAuth: async ({ forceRefresh }) => {
      refreshes.push(forceRefresh);
      return { token: forceRefresh ? "fresh" : "old", identityKey: "alice" };
    },
    fetch: async (url, init) => {
      expect(url).toBe("https://api.example.test/functions/backend/api/loom/ticket");
      expect(JSON.parse(await new Request(url, init).text())).toEqual({ protocol: 1 });
      expect(init.credentials).toBe("omit");
      if (new Headers(init.headers).get("authorization") !== "Bearer fresh") return new Response(null, { status: 401 });
      issued++;
      return Response.json({
        protocol: 1,
        ok: true,
        requestId: "ticket",
        value: {
          ticket: String(issued).repeat(43),
          expiresAt: Date.now() / 1000 + 30,
        },
      });
    },
  });
  expect((await client.ticket({ identityKey: "alice" })).ticket).toBe("1".repeat(43));
  expect((await client.ticket({ identityKey: "alice" })).ticket).toBe("2".repeat(43));
  expect(refreshes).toEqual([false, true, false, true]);
  await expect(client.ticket({ identityKey: "bob" })).rejects.toMatchObject({ code: "AUTH_CHANGED" });
  expect(issued).toBe(2);
});

test("client rejects malformed and expired tickets without exposing them", async () => {
  for (const value of [
    { ticket: "secret", expiresAt: Date.now() / 1000 + 30 },
    { ticket: "a".repeat(43), expiresAt: 1 },
    { ticket: "a".repeat(43), expiresAt: "future" },
  ]) {
    const client = createClient({
      url: "https://api.example.test",
      getAuth: async () => ({ token: "token", identityKey: "alice" }),
      fetch: async () => Response.json({ protocol: 1, ok: true, requestId: "ticket", value }),
    });
    await expect(client.ticket({ identityKey: "alice" })).rejects.toMatchObject({ code: "INVALID_TICKET" });
  }
});
