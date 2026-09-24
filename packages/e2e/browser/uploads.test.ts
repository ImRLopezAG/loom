import assert from "node:assert/strict";
import { test } from "bun:test";
import { chromium } from "playwright";
import type { Browser } from "playwright";
import pg from "pg";
import { startLocalUploads } from "../fixtures/local-jobs-storage";

const connectionString = process.env.LOOM_TEST_DATABASE_URL;
test.skipIf(!connectionString)(
  "upload app verifies files, displays retries and failures, and isolates users",
  async () => {
    assert(connectionString);
    const app = await startLocalUploads({ connectionString, port: 0 });
    let browser: Browser | undefined;
    try {
      browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(app.url);
      await page.getByRole("button", { name: "Continue as Alice" }).click();
      await page.getByText("No uploads yet").waitFor();
      for (const [mode, label] of [
        ["uploads", "Completed"],
        ["retry-demo", "Completed"],
        ["failure-demo", "Failed after 3 attempts"],
      ]) {
        assert(mode && label);
        await page.getByLabel("Processing mode").selectOption(mode);
        await page
          .getByLabel("Choose a file")
          .setInputFiles({ name: `${mode}.txt`, mimeType: "text/plain", buffer: Buffer.from(`Example ${mode}`) });
        await page.getByRole("button", { name: "Upload file", exact: true }).click();
        const row = page.getByRole("article", { name: mode });
        if (mode !== "uploads") await row.getByText("Waiting to retry", { exact: true }).waitFor();
        await row.getByText(label, { exact: true }).waitFor();
        if (mode === "retry-demo") await row.getByText("2 attempts", { exact: true }).waitFor();
        if (mode === "uploads") {
          const downloading = page.waitForEvent("download");
          await row.getByRole("button", { name: "Download" }).click();
          const download = await downloading;
          const path = await download.path();
          assert(path);
          assert.equal(await Bun.file(path).text(), "Example uploads");
        }
      }
      await page.setViewportSize({ width: 390, height: 844 });
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: "/tmp/loom-uploads-mobile.png", fullPage: true });
      await page.setViewportSize({ width: 1360, height: 900 });
      await page.screenshot({ path: "/tmp/loom-uploads-desktop.png", fullPage: true });
      await page.getByRole("button", { name: "Sign out" }).click();
      await page.getByRole("button", { name: "Continue as Bob" }).click();
      await page.getByText("No uploads yet").waitFor();
      assert.equal(await page.getByRole("article").count(), 0);
      assert.deepEqual(errors, []);
    } finally {
      try {
        await browser?.close();
      } finally {
        await app.stop();
        const admin = new pg.Client({ connectionString });
        await admin.connect();
        try {
          assert.equal(
            (await admin.query("SELECT datname FROM pg_database WHERE datname = $1", [app.database])).rows.length,
            0,
          );
          assert.equal(
            (await admin.query("SELECT rolname FROM pg_roles WHERE rolname = $1", [`${app.database}_runtime`])).rows
              .length,
            0,
          );
        } finally {
          await admin.end();
        }
      }
    }
  },
  60000,
);
