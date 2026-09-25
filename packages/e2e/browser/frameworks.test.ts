import assert from "node:assert/strict";
import { test, expect } from "bun:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startIntegrationBackend } from "../fixtures/integration-examples";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
function availablePort() {
  const server = Bun.serve({ hostname: "127.0.0.1", port: 0, fetch: () => new Response() });
  const port = server.port;
  void server.stop(true);
  assert(port);
  return port;
}
for (const framework of ["next", "start"] as const)
  test.skipIf(!connectionString)(
    `${framework} production SSR isolates users and hydrates native live queries`,
    async () => {
      assert(connectionString);
      const port = availablePort();
      const origin = `http://localhost:${port}`;
      const backend = await startIntegrationBackend(connectionString, [origin], framework);
      const root = fileURLToPath(new URL(`../../examples/${framework}/`, import.meta.url));
      const process = Bun.spawn(
        framework === "next"
          ? ["node", "node_modules/next/dist/bin/next", "start", "--port", String(port)]
          : ["node", ".output/server/index.mjs"],
        {
          cwd: root,
          env: { ...globalThis.process.env, LOOM_SERVICE_URL: backend.url, PORT: String(port), HOST: "127.0.0.1" },
          stdout: "pipe",
          stderr: "pipe",
        },
      );
      const output = new Response(process.stdout).text();
      const errors = new Response(process.stderr).text();
      let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
      try {
        let ready = false;
        for (let attempt = 0; attempt < 100; attempt++) {
          if (
            await fetch(origin).then(
              (r) => r.ok,
              () => false,
            )
          ) {
            ready = true;
            break;
          }
          if (process.exitCode !== null) throw new Error(`Server exited: ${await output} ${await errors}`);
          await Bun.sleep(100);
        }
        assert(ready, "Production server must start");
        const alice = await backend.token("alice");
        const bob = await backend.token("bob");
        expect(
          (
            await fetch(`${origin}/api/session`, {
              method: "POST",
              headers: { origin: "https://foreign.test" },
              body: alice,
            })
          ).status,
        ).toBe(403);
        expect((await fetch(`${origin}/api/session`)).status).toBe(403);
        expect(
          (
            await fetch(`${origin}/api/session`, {
              method: "POST",
              headers: { origin },
              body: "x".repeat(3801),
            })
          ).status,
        ).toBe(413);
        const login = await fetch(`${origin}/api/session`, { method: "POST", headers: { origin }, body: alice });
        expect(login.status).toBe(204);
        expect(login.headers.get("set-cookie")).toContain("HttpOnly");
        const sessionId = Array.from(
          new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(alice))),
          (byte) => byte.toString(16).padStart(2, "0"),
        ).join("");
        const sessionHeaders = { "x-loom-session": "1", "x-loom-session-id": sessionId };
        expect(
          (await fetch(`${origin}/api/session`, { headers: { ...sessionHeaders, cookie: `loom_session=${alice}` } }))
            .status,
        ).toBe(200);
        expect(
          (await fetch(`${origin}/api/session`, { headers: { ...sessionHeaders, cookie: `loom_session=${bob}` } }))
            .status,
        ).toBe(401);
        const [a, b] = await Promise.all(
          [alice, bob].map(async (token) => {
            const response = await fetch(origin, { headers: { cookie: `loom_session=${token}` } });
            expect(response.status).toBe(200);
            expect(response.headers.get("cache-control")).toContain("no-store");
            return response.text();
          }),
        );
        expect(a).toContain("alice");
        expect(a).not.toContain(bob);
        expect(a).not.toContain(alice);
        expect(b).toContain("bob");
        expect(b).not.toContain("Signed in as alice");
        browser = await chromium.launch({ headless: true });
        const aliceContext = await browser.newContext();
        const bobContext = await browser.newContext();
        await aliceContext.addCookies([{ name: "loom_session", value: alice, url: origin, httpOnly: true }]);
        await bobContext.addCookies([{ name: "loom_session", value: bob, url: origin, httpOnly: true }]);
        const first = await aliceContext.newPage();
        const second = await aliceContext.newPage();
        const other = await bobContext.newPage();
        const pageErrors: string[] = [];
        for (const page of [first, second, other]) {
          page.on("pageerror", (e) => pageErrors.push(e.message));
          await page.goto(origin);
          await page.getByText("Live updates connected", { exact: true }).waitFor();
        }
        await first.getByLabel("New note").fill("Shared across SSR and live");
        await first.getByRole("button", { name: "Add note" }).click();
        await second.getByText("Shared across SSR and live", { exact: true }).waitFor();
        expect(await other.getByText("Shared across SSR and live", { exact: true }).count()).toBe(0);
        const html = await (await fetch(origin, { headers: { cookie: `loom_session=${alice}` } })).text();
        expect(html).toContain("Shared across SSR and live");
        expect(html).not.toContain(alice);
        const bobHtml = await (await fetch(origin, { headers: { cookie: `loom_session=${bob}` } })).text();
        expect(bobHtml).not.toContain("Shared across SSR and live");
        await first.setViewportSize({ width: 390, height: 844 });
        expect(await first.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await first.screenshot({ path: `/tmp/loom-${framework}-mobile.png`, fullPage: true });
        await first.setViewportSize({ width: 1360, height: 900 });
        await first.screenshot({ path: `/tmp/loom-${framework}-desktop.png`, fullPage: true });
        await first.getByRole("button", { name: "Sign out" }).click();
        await first.getByRole("button", { name: "Connect", exact: true }).waitFor();
        await second.getByRole("button", { name: "Connect", exact: true }).waitFor();
        await second.getByLabel("Access token").fill(bob);
        await second.getByRole("button", { name: "Connect", exact: true }).click();
        await second.getByText("Signed in as bob", { exact: true }).waitFor();
        await second.getByText("Live updates connected", { exact: true }).waitFor();
        expect(await second.getByText("Shared across SSR and live", { exact: true }).count()).toBe(0);
        expect(pageErrors).toEqual([]);
      } finally {
        await browser?.close();
        process.kill();
        await process.exited;
        await Promise.all([output, errors]);
        await backend.stop();
      }
    },
    90_000,
  );
