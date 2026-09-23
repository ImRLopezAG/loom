import assert from "node:assert/strict";
import { test } from "bun:test";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type Browser } from "playwright";

test("documentation routes, search and mobile navigation work without hydration errors", async () => {
  const root = fileURLToPath(new URL("../../../apps/docs/dist", import.meta.url));
  assert.equal(await Bun.file(resolve(root, "quickstart/index.html")).exists(), true, "Build the quickstart route");
  const server = Bun.serve({
    hostname: "127.0.0.1",
    port: 0,
    async fetch(request) {
      const path = new URL(request.url).pathname;
      const target = resolve(root, `.${path}`);
      if (target !== root && !target.startsWith(root + sep)) return new Response(null, { status: 400 });
      for (const candidate of [resolve(target, "index.html"), target]) {
        const file = Bun.file(candidate);
        if (await file.exists()) return new Response(file);
      }
      return new Response(Bun.file(resolve(root, "404.html")), { status: 404 });
    },
  });
  let browser: Browser | undefined;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    page.setDefaultTimeout(5000);
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text());
    });
    await page.goto(new URL("/quickstart", server.url).href);
    await page.getByRole("heading", { name: "Quickstart", exact: true }).waitFor();
    await page
      .getByRole("button", { name: /search/i })
      .first()
      .click();
    await page.getByRole("textbox", { name: "Search documentation" }).fill("defineSchema");
    await page.getByRole("dialog").getByRole("button", { name: "Schemas", exact: true }).click();
    await page.waitForURL("**/authoring/schemas*");
    await page.getByRole("heading", { name: "Schemas", exact: true }).waitFor();
    assert.match(await page.locator("pre").innerText(), /ownerIssuer/);
    assert.ok(await page.locator('a[href="/authoring/schemas"][data-active="true"]').count());
    // A marker on the window survives Astro navigation, but not a full document reload.
    await page.evaluate(() => Reflect.set(window, "loomNavigationMarker", "same-document"));
    await page.getByRole("link", { name: "Quickstart", exact: true }).first().click();
    await page.waitForURL("**/quickstart");
    assert.equal(await page.evaluate(() => Reflect.has(window, "loomNavigationMarker")), true);
    await page.getByRole("heading", { name: "Quickstart", exact: true }).waitFor();
    assert.ok(await page.locator('a[href="/quickstart"][data-active="true"]').count());
    await page.locator('a[href="#prepare-the-workspace"]').first().click();
    await page.waitForURL("**/quickstart#prepare-the-workspace");
    assert.equal(await page.locator("#prepare-the-workspace").count(), 1);
    await page.keyboard.press("ControlOrMeta+k");
    await page.getByRole("textbox", { name: "Search documentation" }).fill("defineSchema");
    await page.getByRole("dialog").getByRole("button", { name: "Schemas", exact: true }).waitFor();
    await page.keyboard.press("Enter");
    await page.waitForURL("**/authoring/schemas*");
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.getByRole("button", { name: "Open Sidebar", exact: true }).click();
    await page.getByRole("link", { name: "Quickstart", exact: true }).filter({ visible: true }).click();
    await page.waitForURL("**/quickstart");
    await page.getByRole("heading", { name: "Quickstart", exact: true }).waitFor();
    await page.getByRole("button", { name: "Open Sidebar", exact: true }).waitFor();
    assert.deepEqual(errors, []);
    const missing = await page.goto(new URL("/missing-page", server.url).href);
    assert.equal(missing?.status(), 404);
    await page.getByRole("heading", { name: "Page not found" }).waitFor();
  } finally {
    try {
      await browser?.close();
    } finally {
      await server.stop(true);
    }
  }
}, 30000);
