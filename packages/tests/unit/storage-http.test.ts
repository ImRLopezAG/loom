import { expect, test } from "vite-plus/test";
import { createStorageHttpApp } from "@loom/core/neon";
import { createStorageClient } from "@loom/core/client";

const id = "0199942e-a6ba-7000-8000-000000000001";
const upload = { bucket: "uploads", size: 1, contentType: "text/plain", sha256: "a".repeat(64) };
test("storage HTTP requires verified identity and refuses caller identity", async () => {
  let calls = 0;
  const status = { id, state: "pending" as const, errorCode: null };
  const app = createStorageHttpApp({
    origins: ["https://app.test"],
    verify: async () => ({
      identity: { issuer: "issuer", subject: "alice", tenantId: "one" },
      expiresAt: Date.now() / 1000 + 60,
    }),
    storage: {
      create: async (identity, received, key) => {
        calls++;
        expect(identity).toEqual({ issuer: "issuer", subject: "alice", tenantId: "one" });
        expect(received).toEqual(upload);
        expect(key).toBe("once");
        return status;
      },
      status: async () => status,
      finalize: async () => status,
      signUpload: async () => ({ key: "key", url: "https://objects.test/upload", method: "PUT", headers: {} }),
      signDownload: async () => ({ url: "https://objects.test/download", method: "GET" }),
    },
  });
  const body = { protocol: 1, operation: "create", upload, requestKey: "once" };
  const headers = { "content-type": "application/json", origin: "https://app.test" };
  expect((await app.request("/api/loom/storage", { method: "POST", headers, body: JSON.stringify(body) })).status).toBe(
    401,
  );
  const authenticated = { ...headers, authorization: "Bearer token" };
  for (const path of ["/api/loom/call", "/api/loom/ticket"]) {
    expect((await app.request(path, { method: "POST", headers: authenticated, body: "{}" })).status).toBe(404);
  }
  expect(
    (
      await app.request("/api/loom/storage", {
        method: "POST",
        headers: { ...authenticated, origin: "https://attacker.test" },
        body: JSON.stringify(body),
      })
    ).status,
  ).toBe(403);
  expect(
    (
      await app.request("/api/loom/storage", {
        method: "POST",
        headers: authenticated,
        body: JSON.stringify({ ...body, protocol: 99 }),
      })
    ).status,
  ).toBe(409);
  expect(
    (
      await app.request("/api/loom/storage", {
        method: "POST",
        headers: authenticated,
        body: JSON.stringify({ ...body, identity: { subject: "bob" } }),
      })
    ).status,
  ).toBe(400);
  expect(calls).toBe(0);
  expect(
    (await app.request("/api/loom/storage", { method: "POST", headers: authenticated, body: JSON.stringify(body) }))
      .status,
  ).toBe(200);
  expect(calls).toBe(1);
});

test("storage client captures upload metadata and one retry key across a lost response", async () => {
  const bodies: string[] = [];
  const input = { ...upload };
  const client = createStorageClient({
    url: "https://api.test",
    getAuth: async () => ({ token: "token", identityKey: "alice" }),
    fetch: async (url, init) => {
      expect(url).toBe("https://api.test/api/loom/storage");
      bodies.push(await new Request(url, init).text());
      if (bodies.length === 1) {
        input.size = 2;
        throw new Error("lost");
      }
      return Response.json({
        protocol: 1,
        ok: true,
        requestId: "test",
        value: { id, state: "pending", errorCode: null },
      });
    },
  });
  expect(await client.create(input, { idempotencyKey: "once" })).toEqual({
    id,
    state: "pending",
    errorCode: null,
  });
  expect(bodies).toHaveLength(2);
  expect(bodies[0]).toBe(bodies[1]);
  expect(JSON.parse(bodies[0] ?? "{}")).toMatchObject({ upload, requestKey: "once" });
});

test("storage client rejects inconsistent intent states and unsafe signed URLs", async () => {
  const response = { id, state: "ready", errorCode: "VERIFICATION_FAILED" };
  const client = createStorageClient({
    url: "https://api.test",
    fetch: async () => Response.json({ protocol: 1, ok: true, requestId: "test", value: response }),
  });
  await expect(client.status(id)).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  const invalidUrl = createStorageClient({
    url: "https://api.test",
    fetch: async () =>
      Response.json({ protocol: 1, ok: true, requestId: "test", value: { url: "javascript:alert(1)", method: "GET" } }),
  });
  await expect(invalidUrl.signDownload(id)).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
});

test("storage authentication respects the request deadline without invoking storage", async () => {
  let calls = 0;
  const status = { id, state: "pending" as const, errorCode: null };
  const app = createStorageHttpApp({
    origins: [],
    requestTimeoutMs: 10,
    verify: () => new Promise(() => {}),
    storage: {
      create: async () => {
        calls++;
        return status;
      },
      status: async () => status,
      finalize: async () => status,
      signUpload: async () => ({ key: "key", url: "https://objects.test/upload", method: "PUT", headers: {} }),
      signDownload: async () => ({ url: "https://objects.test/download", method: "GET" }),
    },
  });
  const response = await app.request("/api/loom/storage", {
    method: "POST",
    headers: { authorization: "Bearer token", "content-type": "application/json" },
    body: JSON.stringify({ protocol: 1, operation: "create", upload, requestKey: "once" }),
  });
  expect(response.status).toBe(504);
  expect(calls).toBe(0);
});
