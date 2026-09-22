import { expect, test } from "vite-plus/test";
import { createPublicHttpApp } from "@loom/core/neon";
import type { PublicHttpOptions } from "@loom/core/neon";
import { originPolicy } from "../../core/src/server/auth/policy";

test("origin policy matches exact canonical origins and permits originless server calls", () => {
  const allows = originPolicy(["https://app.example.test", "http://localhost:3000"]);
  expect(allows(null)).toBe(true);
  expect(allows("https://app.example.test")).toBe(true);
  for (const origin of [
    "null",
    "https://app.example.test.evil",
    "https://app.example.test/path",
    "http://localhost:3001",
  ])
    expect(allows(origin)).toBe(false);
  for (const origin of ["https://user:secret@app.example.test", "https://app.example.test/", "http://app.example.test"])
    expect(() => originPolicy([origin])).toThrow();
});

test("HTTP guards bound body reads, reject forged envelopes, and cancel stalled streams", async () => {
  let calls = 0;
  let cancelled = false;
  const options: PublicHttpOptions = {
    dispatcher: {
      public: async () => {
        calls++;
        return { ok: true, requestId: "test", value: null };
      },
    },
    verify: async () => ({
      identity: { issuer: "test", subject: "alice" },
      expiresAt: Math.floor(Date.now() / 1000) + 60,
    }),
    origins: ["https://app.example.test"],
    maxRequestBytes: 1024,
  };
  const app = createPublicHttpApp(options);
  const payload = { protocol: 1, name: "tasks:read", kind: "query", version: "a".repeat(64), args: null };
  const headers = {
    "content-type": "application/json",
    authorization: "Bearer token",
    origin: "https://app.example.test",
  };
  const post = (body: string, extra: Readonly<Record<string, string>> = {}) =>
    app.request("/api/loom/call", { method: "POST", headers: { ...headers, ...extra }, body });
  expect((await post(JSON.stringify(payload))).status).toBe(200);
  expect((await post(JSON.stringify({ ...payload, identity: { subject: "other" } }))).status).toBe(400);
  expect((await post("{")).status).toBe(400);
  expect((await post(JSON.stringify({ ...payload, protocol: 2 }))).status).toBe(409);
  expect((await post("x".repeat(1025), { "content-length": "1" })).status).toBe(413);
  expect((await post(JSON.stringify(payload), { authorization: "Basic token" })).status).toBe(401);
  expect(
    (await post(JSON.stringify(payload), { origin: "https://attacker.test" })).headers.has(
      "access-control-allow-origin",
    ),
  ).toBe(false);
  expect(calls).toBe(1);
  const verified = Promise.withResolvers<void>();
  const expiring = createPublicHttpApp({
    ...options,
    verify: async () => {
      verified.resolve();
      return { identity: { issuer: "test", subject: "alice" }, expiresAt: Date.now() / 1000 + 0.02 };
    },
  });
  const delayed = new ReadableStream<Uint8Array>({
    async start(controller) {
      await verified.promise;
      await new Promise((resolve) => setTimeout(resolve, 40));
      controller.enqueue(new TextEncoder().encode(JSON.stringify(payload)));
      controller.close();
    },
  });
  expect(
    (
      await expiring.request(
        new Request("https://api.example.test/api/loom/call", {
          method: "POST",
          headers,
          body: delayed,
          duplex: "half",
        }),
      )
    ).status,
  ).toBe(401);
  expect(calls).toBe(1);
  const preflight = await app.request("/api/loom/call", {
    method: "OPTIONS",
    headers: {
      origin: headers.origin,
      "access-control-request-method": "POST",
      "access-control-request-headers": "authorization, content-type",
    },
  });
  expect(preflight.status).toBe(204);
  expect(preflight.headers.get("access-control-allow-origin")).toBe(headers.origin);
  expect(preflight.headers.has("access-control-allow-credentials")).toBe(false);
  const timeoutApp = createPublicHttpApp({ ...options, requestTimeoutMs: 20 });
  const stream = new ReadableStream<Uint8Array>({
    cancel() {
      cancelled = true;
    },
  });
  const request = new Request("https://api.example.test/api/loom/call", {
    method: "POST",
    headers,
    body: stream,
    duplex: "half",
  });
  const response = await timeoutApp.request(request);
  expect(response.status).toBe(504);
  expect(cancelled).toBe(true);
  expect(calls).toBe(1);
});
