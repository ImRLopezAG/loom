import assert from "node:assert/strict";
import { test } from "bun:test";
import { mkdtemp, rm, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

test("deployment CLI rejects ambiguous flags and redacts invalid release contents", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-deploy-cli-"));
  const cli = fileURLToPath(new URL("../../../apps/loom/src/cli.ts", import.meta.url));
  async function run(args: string[], code: number, error: string) {
    const child = Bun.spawn([process.execPath, cli, ...args, "--cwd", root, "--json"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    const [stdout, stderr, exit] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    assert.equal(exit, code);
    assert.equal(stdout, "");
    assert.ok(stderr.includes(`"code":"${error}"`));
    assert.ok(!stderr.includes("sensitive-fixture-value"));
  }
  try {
    await writeFile(join(root, "release.json"), '{"activationToken":"sensitive-fixture-value"}');
    await run(["deploy"], 2, "USAGE");
    await run(["deploy", "--release", "release.json", "--name", "ignored"], 2, "USAGE");
    await run(["init", "--name", "unwanted", "--release", "release.json"], 2, "USAGE");
    await run(["deploy", "preview", "--release", "release.json"], 2, "USAGE");
    await run(["deploy", "", "ignored", "--release", "release.json"], 2, "USAGE");
    await run(["deploy", "--release", "release.json", "--dry-run"], 5, "DEPLOYMENT_FAILED");
    await run(["migrations", "apply", "--runtime-role", "runtime", "--dry-run"], 2, "USAGE");
    await run(["deploy", "--release", "release.json"], 5, "DEPLOYMENT_FAILED");
    assert.deepEqual(await readdir(root), ["release.json"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
