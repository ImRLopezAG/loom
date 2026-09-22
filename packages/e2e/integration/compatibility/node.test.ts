import { expect, test } from "bun:test";
import { fileURLToPath } from "node:url";

test("Node 24 imports compiled Loom and provider exports without Bun globals", async () => {
  const process = Bun.spawn([
    "node", "--input-type=module", "-e",
    `import assert from "node:assert/strict";
     assert.equal(Number(process.versions.node.split(".")[0]), 24);
     assert.equal("Bun" in globalThis, false);
     await import("./dist/server/index.js");
     await import("./dist/client/index.js");
     await import("./dist/react/index.js");
     await import("@neon/functions/hono");`,
  ], { cwd: fileURLToPath(new URL("../../../core/", import.meta.url)), stdout: "pipe", stderr: "pipe" });
  const stderr = await new Response(process.stderr).text();
  expect({ code: await process.exited, stderr }).toEqual({ code: 0, stderr: "" });
});
