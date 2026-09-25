import assert from "node:assert/strict";
import { expect, test } from "bun:test";
import { createRpcHttpTransport } from "@loom/core/client";
import { startIntegrationBackend } from "../fixtures/integration-examples";
const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "generated examples execute Zod, Valibot and Effect contracts through authenticated RPC",
  async () => {
    if (!connectionString) throw new Error("Test database required");
    const backend = await startIntegrationBackend(connectionString, []);
    const alice = await backend.token("alice");
    const transport = createRpcHttpTransport({
      url: backend.url,
      version: backend.version,
      getToken: async () => alice,
    });
    try {
      for (const variant of ["zod", "mixed", "effect", "effectSchema"]) {
        expect(await transport.link.call(["examples", variant], { name: "Loom" }, { context: {} })).toEqual({
          message: "Hello, Loom!",
          owner: "alice",
        });
        await assert.rejects(transport.link.call(["examples", variant], { name: 123 }, { context: {} }), {
          code: "BAD_REQUEST",
        });
      }
      expect(await transport.link.call(["examples", "zod"], { name: "  Loom  " }, { context: {} })).toEqual({
        message: "Hello, Loom!",
        owner: "alice",
      });
      await assert.rejects(transport.link.call(["examples", "effect"], { name: "reject" }, { context: {} }), {
        code: "REJECTED",
      });
      expect(await transport.link.call(["examples", "notes"], undefined, { context: {} })).toEqual([]);
      for (let index = 0; index < 51; index++) {
        await transport.link.call(["examples", "add"], { text: `Note ${index}` }, { context: {} });
      }
      const notes = await transport.link.call(["examples", "notes"], undefined, { context: {} });
      expect(notes).toHaveLength(50);
      expect(notes).toContainEqual(expect.objectContaining({ text: "Note 50" }));
      expect(notes).not.toContainEqual(expect.objectContaining({ text: "Note 0" }));
    } finally {
      transport.dispose();
      await backend.stop();
    }
  },
  30_000,
);
