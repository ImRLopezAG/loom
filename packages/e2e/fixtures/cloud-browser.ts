import assert from "node:assert/strict";
import { chromium } from "playwright";

export async function verifyCloudTasksBrowser(url: string) {
  const browser = await chromium.launch({ headless: true });
  try {
    const first = await browser.newPage();
    const second = await browser.newPage();
    const errors: string[] = [];
    await second.addInitScript(() => {
      const NativeSocket = WebSocket;
      window.WebSocket = class extends NativeSocket {
        constructor(address: string | URL, protocols?: string | string[]) {
          super(address, protocols);
          const disconnect = () => this.close();
          window.addEventListener("loom-test-disconnect", disconnect);
          this.addEventListener("close", () => window.removeEventListener("loom-test-disconnect", disconnect));
        }
      };
    });
    for (const page of [first, second]) {
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(url);
      await page.getByRole("button", { name: "Continue as Alice" }).click();
    }
    await first.getByLabel("Project name").fill("Live Neon browser");
    await first.getByRole("button", { name: "Create project" }).click();
    await second.getByRole("button", { name: "Live Neon browser", exact: true }).click();
    await first.getByLabel("Task title").fill("Verify provider subscriptions");
    await first.getByRole("button", { name: "Add task" }).click();
    await second.getByRole("checkbox", { name: "Verify provider subscriptions" }).waitFor();
    await second.context().setOffline(true);
    await second.evaluate(() => window.dispatchEvent(new Event("loom-test-disconnect")));
    await first.getByRole("checkbox", { name: "Verify provider subscriptions" }).click();
    await first.waitForFunction(() => document.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked);
    await second.context().setOffline(false);
    await second.waitForFunction(() => document.querySelector<HTMLInputElement>('input[type="checkbox"]')?.checked);
    await second.getByRole("button", { name: "Sign out" }).click();
    await second.getByRole("button", { name: "Continue as Bob" }).click();
    await second.getByText("Create your first project").waitFor();
    assert.equal(await second.getByText("Live Neon browser").count(), 0);
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}
