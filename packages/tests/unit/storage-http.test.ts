import { expect, test } from "vite-plus/test";
import { createPublicHttpApp } from "@loom/core/neon";
import { createClient } from "@loom/core/client";

const id = "0199942e-a6ba-7000-8000-000000000001";
const upload = { bucket: "uploads", size: 1, contentType: "text/plain", sha256: "a".repeat(64) };
test("storage HTTP requires verified identity and refuses caller identity even when functions allow anonymous access", async () => {
  let calls = 0;
  const status = { id, state: "pending" as const, errorCode: null };
  const app = createPublicHttpApp({
    origins: ["https://app.test"],
    allowAnonymous: true,
    dispatcher: { public: async () => ({ ok: true, requestId: "test", value: null }) },
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
  const client = createClient({
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
  expect(await client.storage.create(input, { idempotencyKey: "once" })).toEqual({
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
  const client = createClient({
    url: "https://api.test",
    fetch: async () => Response.json({ protocol: 1, ok: true, requestId: "test", value: response }),
  });
  await expect(client.storage.status(id)).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  const invalidUrl = createClient({
    url: "https://api.test",
    fetch: async () =>
      Response.json({ protocol: 1, ok: true, requestId: "test", value: { url: "javascript:alert(1)", method: "GET" } }),
  });
  await expect(invalidUrl.storage.signDownload(id)).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
});
