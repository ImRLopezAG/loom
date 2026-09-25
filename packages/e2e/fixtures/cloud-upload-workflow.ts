import assert from "node:assert/strict";
import type { Page } from "playwright";

/** Browser bytes plus provider object-created and scheduled wake deliveries. */
export async function verifyCloudUploadWorkflow(page: Page) {
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
  for (const mode of ["uploads", "retry-demo", "failure-demo"] as const) {
    const row = page.getByRole("article", { name: mode, exact: true });
    await row
      .getByText(mode === "failure-demo" ? "Failed after 3 attempts" : "Completed", { exact: true })
      .waitFor({ timeout: mode === "uploads" ? 90_000 : 210_000 });
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
}
