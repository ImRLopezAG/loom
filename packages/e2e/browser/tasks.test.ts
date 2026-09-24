import assert from "node:assert/strict";
import { test } from "bun:test";
import { chromium } from "playwright";
import type { Browser } from "playwright";
import * as v from "valibot";
import { startLocalTasks } from "../fixtures/local-tasks";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "tasks app commits changes across clients and recovers after disconnect",
  async () => {
    assert(connectionString);
    const app = await startLocalTasks({ connectionString, port: 0 });
    let browser: Browser | undefined;
    try {
      const origin = new URL(app.url).origin;
      assert.equal(
        (
          await fetch(new URL("/session", app.url), {
            method: "POST",
            headers: { origin: "https://other.example", "content-type": "application/json" },
            body: JSON.stringify({ subject: "alice" }),
          })
        ).status,
        403,
      );
      const sessionResponse = await fetch(new URL("/session", app.url), {
        method: "POST",
        headers: { origin, "content-type": "application/json" },
        body: JSON.stringify({ subject: "alice" }),
      });
      const session = v.parse(v.object({ url: v.string() }), await sessionResponse.json());
      assert.equal(
        (
          await fetch(`${session.url}/api/loom/ticket`, {
            method: "POST",
            headers: { origin, "content-type": "application/json", authorization: "Bearer forged" },
            body: JSON.stringify({ protocol: 1 }),
          })
        ).status,
        401,
      );
      browser = await chromium.launch({ headless: true });
      const first = await browser.newPage();
      const second = await browser.newPage();
      await second.addInitScript(() => {
        const NativeSocket = WebSocket;
        window.WebSocket = class extends NativeSocket {
          constructor(url: string | URL, protocols?: string | string[]) {
            super(url, protocols);
            const disconnect = () => this.close();
            window.addEventListener("loom-test-disconnect", disconnect);
            this.addEventListener("close", () => window.removeEventListener("loom-test-disconnect", disconnect));
          }
        };
      });
      const pageErrors: string[] = [];
      for (const page of [first, second]) {
        page.on("pageerror", (error) => pageErrors.push(error.message));
        await page.goto(app.url);
        await page.getByRole("button", { name: "Continue as Alice" }).click();
      }
      await first.getByLabel("Project name").fill("Release checklist");
      await first.getByRole("button", { name: "Create project" }).click();
      await second.getByRole("button", { name: "Release checklist", exact: true }).click();
      await first.getByLabel("Task title").fill("Verify live updates");
      await first.getByRole("button", { name: "Add task" }).click();
      await second.getByRole("checkbox", { name: "Verify live updates" }).waitFor();
      await second.context().setOffline(true);
      await second.evaluate(() => window.dispatchEvent(new Event("loom-test-disconnect")));
      await first.getByRole("checkbox", { name: "Verify live updates" }).click();
      await first.waitForFunction(() => document.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked);
      await second.context().setOffline(false);
      await second.waitForFunction(() => document.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked);
      await second.getByRole("button", { name: "Sign out" }).click();
      await second.getByRole("button", { name: "Continue as Bob" }).click();
      await second.getByRole("navigation", { name: "Project selection" }).waitFor({ state: "attached" });
      await second.getByText("Create your first project").waitFor();
      assert.equal(await second.getByText("Release checklist").count(), 0);
      await first.setViewportSize({ width: 390, height: 844 });
      assert(await first.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await first.screenshot({ path: "/tmp/loom-tasks-mobile.png", fullPage: true });
      await first.setViewportSize({ width: 1360, height: 900 });
      await first.screenshot({ path: "/tmp/loom-tasks-desktop.png", fullPage: true });
      assert.deepEqual(pageErrors, []);
    } finally {
      try {
        await browser?.close();
      } finally {
        await app.stop();
      }
    }
  },
  60_000,
);
