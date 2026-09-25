import assert from "node:assert/strict";
import { createRpcHttpApp } from "@loom/core/neon";
import { createProjectProcedures, defineSchema } from "@loom/core/server";

const version = "a".repeat(64);
const { procedure } = createProjectProcedures(defineSchema(() => ({})));
const app = createRpcHttpApp({
  router: {
    empty: procedure.handler(({ input }) => {
      assert.equal(input, undefined);
      return "no input";
    }),
  },
  version,
  origins: [],
  verify: async () => ({
    identity: { issuer: "test", subject: "alice" },
    expiresAt: Date.now() / 1000 + 60,
  }),
});

for (const length of [undefined, "0"]) {
  const headers = new Headers({
    authorization: "Bearer test",
    "x-loom-protocol": "loom-orpc-2",
    "x-loom-version": version,
  });
  if (length !== undefined) headers.set("content-length", length);
  const init: RequestInit & { duplex: "half" } = {
    method: "POST",
    headers,
    body: new ReadableStream<Uint8Array>({ start: (controller) => controller.close() }),
    duplex: "half",
  };
  const response = await app.fetch(new Request("https://service.test/api/loom/rpc/empty", init));
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { json: "no input" });
}
