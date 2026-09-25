import { expect, test } from "vite-plus/test";
import { createStorageClient } from "@loom/core/client";

const id = "11111111-1111-4111-8111-111111111111";
const upload = { bucket: "uploads", size: 1, contentType: "text/plain", sha256: "0".repeat(64) };
const saved = { id, state: "pending", errorCode: null };
const success = () => Response.json({ protocol: 1, ok: true, requestId: "test", value: saved });

test("standalone storage preserves its intent key after a lost response", async () => {
  const bodies: string[] = [];
  const storage = createStorageClient({
    url: "https://api.example.test",
    fetch: async (url, init) => {
      expect(url).toBe("https://api.example.test/api/loom/storage");
      expect(init.redirect).toBe("error");
      expect(init.credentials).toBe("omit");
      bodies.push(await new Request(url, init).text());
      if (bodies.length === 1) throw new Error("lost response");
      return success();
    },
  });
  expect(await storage.create(upload)).toEqual(saved);
  expect(bodies).toHaveLength(2);
  expect(bodies[0]).toBe(bodies[1]);
  expect(JSON.parse(bodies[0] ?? "{}").requestKey).toMatch(/^[a-f0-9-]{36}$/);
});

test("storage refuses an identity change during token refresh before another request", async () => {
  let calls = 0;
  const storage = createStorageClient({
    url: "https://api.example.test",
    getAuth: async ({ forceRefresh }) => ({ token: "token", identityKey: forceRefresh ? "bob" : "alice" }),
    fetch: async () => {
      calls++;
      return new Response(null, { status: 401 });
    },
  });
  await expect(storage.status(id)).rejects.toMatchObject({ code: "AUTH_CHANGED" });
  expect(calls).toBe(1);
});

test("storage rejects malformed signed destinations and bounds streamed responses", async () => {
  const malformed = createStorageClient({
    url: "https://api.example.test",
    fetch: async () =>
      Response.json({
        protocol: 1,
        ok: true,
        requestId: "test",
        value: { method: "GET", url: "http://untrusted.example/file" },
      }),
  });
  await expect(malformed.signDownload(id)).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  const oversized = createStorageClient({
    url: "https://api.example.test",
    maxResponseBytes: 1024,
    fetch: async () => new Response("x".repeat(1025)),
  });
  await expect(oversized.status(id)).rejects.toMatchObject({ code: "RESPONSE_TOO_LARGE" });
});

test("storage provider retries obey cancellation without exposing diagnostics", async () => {
  let calls = 0;
  const storage = createStorageClient({
    url: "https://api.example.test",
    timeoutMs: 30,
    fetch: async () => {
      calls++;
      return new Response("provider-secret", { status: 429, headers: { "retry-after": "9999" } });
    },
  });
  await expect(storage.status(id)).rejects.toMatchObject({ code: "TIMEOUT", message: "The request timed out" });
  expect(calls).toBe(1);
});
