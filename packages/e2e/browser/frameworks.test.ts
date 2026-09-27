import assert from "node:assert/strict";
import { test, expect } from "bun:test";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { startIntegrationBackend } from "../fixtures/integration-examples";
import { startTestNeonAuth } from "../fixtures/neon-auth";

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
      const auth = await startTestNeonAuth({ token: backend.token, origins: [origin], backendUrl: backend.url }).catch(
        async (cause: unknown) => {
          await backend.stop();
          throw cause;
        },
      );
      const root = fileURLToPath(new URL(`../../examples/${framework}/`, import.meta.url));
      let process: Bun.Subprocess<"ignore", "pipe", "pipe"> | undefined;
      let output: Promise<string> | undefined;
      let errors: Promise<string> | undefined;
      let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;
      try {
        process = Bun.spawn(
          framework === "next"
            ? ["node", "node_modules/next/dist/bin/next", "start", "--port", String(port)]
            : ["node", ".output/server/index.mjs"],
          {
            cwd: root,
            env: {
              ...globalThis.process.env,
              LOOM_SERVICE_URL: auth.origin,
              NEON_AUTH_BASE_URL: auth.baseUrl,
              NEON_AUTH_COOKIE_SECRET: "local-fixture-cookie-secret-at-least-32-characters",
              NODE_EXTRA_CA_CERTS: auth.caFile,
              PORT: String(port),
              HOST: "127.0.0.1",
            },
            stdin: "ignore",
            stdout: "pipe",
            stderr: "pipe",
          },
        );
        output = new Response(process.stdout).text();
        errors = new Response(process.stderr).text();
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
        // Exercise the official SDK proxy, with opaque upstream session cookies.
        const login = async (user: string) => {
          const response = await fetch(`${origin}/api/auth/sign-in/email`, {
            method: "POST",
            headers: { origin, "content-type": "application/json" },
            body: JSON.stringify({ email: `${user}@example.test`, password: "fixture-password" }),
          });
          expect(response.status).toBe(200);
          const cookies = response.headers.getSetCookie();
          expect(cookies.some((cookie) => cookie.includes("HttpOnly"))).toBe(true);
          const header = cookies.map((cookie) => cookie.split(";")[0]).join("; ");
          expect(header).not.toContain(await backend.token(user));
          return header;
        };
        const [aliceCookie, bobCookie] = await Promise.all([login("alice"), login("bob")]);
        const [a, b] = await Promise.all(
          [aliceCookie, bobCookie].map(async (cookie) => {
            const response = await fetch(origin, { headers: { cookie } });
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
        const aliceContext = await browser.newContext({ ignoreHTTPSErrors: true });
        const bobContext = await browser.newContext({ ignoreHTTPSErrors: true });
        for (const [context, user] of [
          [aliceContext, "alice"],
          [bobContext, "bob"],
        ] as const) {
          const page = await context.newPage();
          await page.goto(origin);
          await page.getByLabel("Email", { exact: true }).fill(`${user}@example.test`);
          await page.getByLabel("Password", { exact: true }).fill("fixture-password");
          await page.getByRole("button", { name: "Sign in", exact: true }).click();
          await page
            .getByText("Live updates connected", { exact: true })
            .waitFor()
            .catch(async (cause: unknown) => {
              throw new Error(`SSR hydration failed: ${await page.locator("body").innerText()}`, { cause });
            });
          await page.close();
        }
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
        const html = await (await fetch(origin, { headers: { cookie: aliceCookie } })).text();
        expect(html).toContain("Shared across SSR and live");
        expect(html).not.toContain(alice);
        const bobHtml = await (await fetch(origin, { headers: { cookie: bobCookie } })).text();
        expect(bobHtml).not.toContain("Shared across SSR and live");
        await first.setViewportSize({ width: 390, height: 844 });
        expect(await first.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
        await first.screenshot({ path: `/tmp/loom-${framework}-mobile.png`, fullPage: true });
        await first.setViewportSize({ width: 1360, height: 900 });
        await first.screenshot({ path: `/tmp/loom-${framework}-desktop.png`, fullPage: true });
        await first.getByRole("button", { name: "Sign out" }).click();
        await first.getByRole("button", { name: "Sign in", exact: true }).waitFor();
        await second.reload();
        await second.getByRole("button", { name: "Sign in", exact: true }).waitFor();
        await second.getByLabel("Email", { exact: true }).fill("bob@example.test");
        await second.getByLabel("Password", { exact: true }).fill("fixture-password");
        await second.getByRole("button", { name: "Sign in", exact: true }).click();
        await second.getByText("Signed in as bob", { exact: true }).waitFor();
        await second.getByText("Live updates connected", { exact: true }).waitFor();
        expect(await second.getByText("Shared across SSR and live", { exact: true }).count()).toBe(0);
        expect(pageErrors).toEqual([]);
      } finally {
        try {
          await browser?.close();
        } finally {
          process?.kill();
          await process?.exited;
          await Promise.all([output, errors]);
          try {
            await auth.stop();
          } finally {
            await backend.stop();
          }
        }
      }
    },
    90_000,
  );
