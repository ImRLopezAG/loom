import assert from "node:assert/strict";
import { chromium } from "playwright";
import { createClient, LoomClientError } from "@loom/core/client";
import * as v from "valibot";

/** Uses actual browser uploads and provider triggers; never invokes the worker manually. */
export async function verifyCloudUploads(
  frontend: string,
  backend: string,
  version: string,
  tokenFor: (subject: string) => Promise<string>,
) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage().catch(async (cause: unknown) => {
    await browser.close();
    throw cause;
  });
  try {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(frontend);
    await page.getByRole("button", { name: "Continue as Alice" }).click();
    await page.getByText("No uploads yet").waitFor();
    for (const mode of ["uploads", "retry-demo", "failure-demo"] as const) {
      await page.getByLabel("Processing mode").selectOption(mode);
      await page.getByLabel("Choose a file").setInputFiles({
        name: `${mode}.txt`,
        mimeType: "text/plain",
        buffer: Buffer.from(`Neon ${mode}`),
      });
      await page.getByRole("button", { name: "Upload file", exact: true }).click();
      await page.getByText(`${mode}.txt uploaded. Waiting for verification and processing.`, { exact: true }).waitFor();
    }
    // Provider wake triggers run once per minute; three attempts can span three wake deliveries.
    for (const mode of ["uploads", "retry-demo", "failure-demo"] as const) {
      const row = page.getByRole("article", { name: mode, exact: true });
      await row
        .getByText(mode === "failure-demo" ? "Failed after 3 attempts" : "Completed", { exact: true })
        .waitFor({ timeout: mode === "uploads" ? 90000 : 210000 });
      await row
        .getByText(mode === "uploads" ? "1 attempt" : mode === "retry-demo" ? "2 attempts" : "3 attempts", {
          exact: true,
        })
        .waitFor();
      if (mode === "uploads") {
        const downloading = page.waitForEvent("download");
        await row.getByRole("button", { name: "Download" }).click();
        const path = await (await downloading).path();
        assert(path);
        assert.equal(await Bun.file(path).text(), "Neon uploads");
      }
    }
    const aliceToken = await tokenFor("alice");
    const bobToken = await tokenFor("bob");
    const alice = createClient({
      url: backend,
      maxAttempts: 1,
      getAuth: async () => ({ token: aliceToken, identityKey: "alice" }),
    });
    const bob = createClient({
      url: backend,
      maxAttempts: 1,
      getAuth: async () => ({ token: bobToken, identityKey: "bob" }),
    });
    const list = { name: "files:list", kind: "query" as const, visibility: "public" as const, version };
    const files = v.parse(v.array(v.object({ intentId: v.string() })), await alice.call(list, {}));
    assert.equal(files.length, 3);
    for (const file of files) {
      for (const operation of [
        () => bob.storage.signUpload(file.intentId),
        () => bob.storage.signDownload(file.intentId),
      ])
        await assert.rejects(operation, (error) => error instanceof LoomClientError && error.code === "FORBIDDEN");
    }
    assert.deepEqual(await bob.call(list, {}), []);
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.getByRole("button", { name: "Continue as Bob" }).click();
    await page.getByText("No uploads yet").waitFor();
    assert.equal(await page.getByRole("article").count(), 0);
    assert.deepEqual(errors, []);
  } catch (cause) {
    await page.screenshot({ path: "/tmp/loom-cloud-uploads-failure.png", fullPage: true }).catch(() => {});
    throw cause;
  } finally {
    await browser.close();
  }
}
