import { expect, test } from "bun:test";
import { createStorageClient } from "@loom/core/client";

test("concurrent storage clients respect HTTP throttling while preserving upload intents", async () => {
  const status = { id: crypto.randomUUID(), state: "pending" as const, errorCode: null };
  const requests = new Map<string, number[]>();
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      const body = await request.text();
      const times = requests.get(body) ?? [];
      times.push(Date.now());
      requests.set(body, times);
      if (times.length === 1)
        return new Response("provider response", { status: 429, headers: { "retry-after": "1" } });
      return Response.json({ protocol: 1, ok: true, requestId: "throttling", value: status });
    },
  });
  try {
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, () =>
        createStorageClient({ url: server.url.href, maxAttempts: 2 }).create({
          bucket: "uploads",
          size: 10,
          contentType: "text/plain",
          sha256: "a".repeat(64),
        }),
      ),
    );
    expect(results).toEqual(Array.from({ length: 4 }, () => ({ status: "fulfilled", value: status })));
    expect(requests.size).toBe(4);
    for (const times of requests.values()) {
      expect(times).toHaveLength(2);
      expect((times[1] ?? 0) - (times[0] ?? 0)).toBeGreaterThanOrEqual(1000);
    }
  } finally {
    await server.stop(true);
  }
});
