import assert from "node:assert/strict";
import { test, expect } from "bun:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

test("provider preserves cache on unmount and hides revoked identity content until refreshed", async () => {
  const bundle = await Bun.build({
    entrypoints: [fileURLToPath(new URL("../fixtures/provider-lifecycle.tsx", import.meta.url))],
    target: "browser",
    define: { "process.env.NODE_ENV": '"production"' },
  });
  assert(bundle.success);
  const output = bundle.outputs[0];
  assert(output);
  const server = Bun.serve({
    port: 0,
    hostname: "127.0.0.1",
    fetch: (request) =>
      new URL(request.url).pathname === "/app.js"
        ? new Response(output)
        : new Response('<div id="root"></div><script type="module" src="/app.js"></script>', {
            headers: { "content-type": "text/html" },
          }),
  });
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    await page.goto(server.url.toString());
    await page.getByText("connection 1", { exact: true }).waitFor();
    await page.getByRole("button", { name: "rerender" }).click();
    expect(await page.locator("output").textContent()).toBe("connection 1");
    await page.getByRole("button", { name: "toggle" }).click();
    expect(await page.getByText("cache preserved", { exact: true }).count()).toBe(1);
    await page.getByRole("button", { name: "toggle" }).click();
    await page.getByText("connection 2", { exact: true }).waitFor();
    await page.getByRole("button", { name: "invalidate" }).click();
    await page.getByText("changes 1", { exact: true }).waitFor();
    expect(await page.locator("output").count()).toBe(0);
    expect(await page.getByText("private Alice snapshot").count()).toBe(0);
    expect(await page.getByText("cache undefined", { exact: true }).count()).toBe(1);
    await page.getByRole("button", { name: "new identity" }).click();
    await page.getByText("connection 3", { exact: true }).waitFor();
  } finally {
    await browser.close();
    await server.stop(true);
  }
});
