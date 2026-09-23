import { expect, test } from "bun:test";
import { createClient } from "@loom/core/client";

test("concurrent clients respect HTTP throttling before retrying identical mutations", async () => {
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
      return Response.json({ protocol: 1, ok: true, requestId: "throttling", value: null });
    },
  });
  try {
    const results = await Promise.allSettled(
      Array.from({ length: 4 }, (_, index) =>
        createClient({ url: server.url.href, maxAttempts: 2 }).call(
          { name: "counter:write", kind: "mutation", visibility: "public", version: "a".repeat(64) },
          { index },
        ),
      ),
    );
    expect(results).toEqual(Array.from({ length: 4 }, () => ({ status: "fulfilled", value: null })));
    expect(requests.size).toBe(4);
    for (const times of requests.values()) {
      expect(times).toHaveLength(2);
      expect((times[1] ?? 0) - (times[0] ?? 0)).toBeGreaterThanOrEqual(1000);
    }
  } finally {
    await server.stop(true);
  }
});
