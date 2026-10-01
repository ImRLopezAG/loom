import assert from "node:assert/strict";
import { test, expect } from "bun:test";
import { fileURLToPath } from "node:url";
import { join, resolve, sep } from "node:path";
import { chromium } from "playwright";
import { startIntegrationBackend } from "../fixtures/integration-examples";
import { startTestNeonAuth } from "../fixtures/neon-auth";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "component CSR uses native options, isolates users and pauses live reads",
  async () => {
    assert(connectionString);
    const root = fileURLToPath(new URL("../../examples/components/", import.meta.url));
    const directory = join(root, ".loom/component-acceptance");
    const frontend = Bun.serve({
      hostname: "localhost",
      port: 0,
      async fetch(request) {
        const path = resolve(directory, `.${new URL(request.url).pathname}`);
        if (!path.startsWith(`${directory}${sep}`) && path !== directory) return new Response(null, { status: 404 });
        const file = Bun.file(path === directory ? join(directory, "index.html") : path);
        return (await file.exists()) ? new Response(file) : new Response(null, { status: 404 });
      },
    });
    const origin = frontend.url.origin;
    let backend: Awaited<ReturnType<typeof startIntegrationBackend>> | undefined;
    let auth: Awaited<ReturnType<typeof startTestNeonAuth>> | undefined;
    let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
    try {
      backend = await startIntegrationBackend(connectionString, [origin], "components");
      auth = await startTestNeonAuth({ token: backend.token, origins: [origin], backendUrl: backend.url });
      const build = Bun.spawn(["bun", "x", "vp", "build", "--outDir", directory], {
        cwd: root,
        env: { ...process.env, VITE_NEON_AUTH_URL: auth.baseUrl, VITE_LOOM_URL: auth.origin },
        stdout: "pipe",
        stderr: "pipe",
      });
      const logs = Promise.all([new Response(build.stdout).text(), new Response(build.stderr).text()]);
      if ((await build.exited) !== 0) throw new Error((await logs).join("\n"));
      await logs;
      browser = await chromium.launch({ headless: true });
      const alice = await browser.newContext({ ignoreHTTPSErrors: true });
      const bob = await browser.newContext({ ignoreHTTPSErrors: true });
      const first = await alice.newPage();
      const second = await alice.newPage();
      const other = await bob.newPage();
      const errors: string[] = [];
      for (const page of [first, second, other]) {
        page.on("pageerror", (error) => errors.push(error.message));
      }
      for (const [page, user] of [
        [first, "alice"],
        [other, "bob"],
      ] as const) {
        await page.goto(origin);
        await page.getByLabel("Email").fill(`${user}@example.test`);
        await page.getByLabel("Password").fill("fixture-password");
        await page.getByRole("button", { name: "Sign in", exact: true }).click();
        await page
          .getByText("Live updates active.", { exact: true })
          .waitFor()
          .catch(async (cause: unknown) => {
            throw new Error(
              `Component sign-in/live failed: ${await page.locator("body").innerText()}; ${errors.join("; ")}`,
              { cause },
            );
          });
      }
      await second.goto(origin);
      await second.getByText("Live updates active.", { exact: true }).waitFor();
      await first.getByLabel("New entry").fill("Only Alice can read this entry");
      await first.getByRole("button", { name: "Save entry" }).click();
      await second.getByText("Only Alice can read this entry", { exact: true }).waitFor();
      expect(await other.getByText("Only Alice can read this entry", { exact: true }).count()).toBe(0);
      await second.getByRole("button", { name: "Pause live updates" }).click();
      await second.getByText("Live updates paused.", { exact: true }).waitFor();
      expect(await second.getByText("Only Alice can read this entry", { exact: true }).count()).toBe(1);
      await first.getByLabel("New entry").fill("Arrived while paused");
      await first.getByRole("button", { name: "Save entry" }).click();
      await first.getByText("Arrived while paused", { exact: true }).waitFor();
      expect(await second.getByText("Arrived while paused", { exact: true }).count()).toBe(0);
      await second.getByRole("button", { name: "Resume live updates" }).click();
      await second.getByText("Arrived while paused", { exact: true }).waitFor();
      // Bypass the HTML length guard to exercise the server contract through the real transport.
      await first.getByLabel("New entry").evaluate((element) => {
        if (!(element instanceof HTMLTextAreaElement)) throw new Error("Expected entry textarea");
        element.value = "x".repeat(201);
      });
      await first.getByRole("button", { name: "Save entry" }).click();
      await first.getByRole("alert").waitFor();
      expect(await first.getByLabel("New entry").inputValue()).toBe("x".repeat(201));
      await first.setViewportSize({ width: 390, height: 844 });
      expect(await first.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await first.screenshot({ path: "/tmp/loom-components-mobile.png", fullPage: true });
      expect(errors).toEqual([]);
    } finally {
      await browser?.close();
      try {
        await auth?.stop();
      } finally {
        try {
          await backend?.stop();
        } finally {
          await frontend.stop(true);
        }
      }
    }
  },
  120_000,
);
