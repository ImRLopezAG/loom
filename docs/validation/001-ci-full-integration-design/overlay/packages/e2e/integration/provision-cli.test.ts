import { ciStage, ciHash } from "../../../apps/loom/src/tooling/dev/ci-trace";
import assert from "node:assert/strict";
import { test } from "bun:test";
import { mkdtemp, rm, writeFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

test("branch provisioning CLI rejects unrelated options and redacts invalid declarations", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-provision-cli-"));
  ciStage("provision.fixture.begin", { rootHash: ciHash(root) });
  let ciCaseIndex = 0;
  const cli = fileURLToPath(new URL("../../../apps/loom/src/cli.ts", import.meta.url));
  async function run(args: string[], code: number, error: string) {
    const caseIndex = ++ciCaseIndex;
    ciStage("provision.child.start", { caseIndex });
    const child = Bun.spawn([process.execPath, cli, ...args, "--cwd", root, "--json"], {
      stdout: "pipe",
      stderr: "pipe",
    });
    ciStage("provision.child.spawned", { caseIndex, childPid: child.pid });
    const [stdout, stderr, exit] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited.then((code) => { ciStage("provision.child.exit", { caseIndex, childPid: child.pid, childExit: code }); return code; }),
    ]).finally(() => ciStage("provision.child.await.end", { caseIndex, childPid: child.pid, childExit: child.exitCode }));
    assert.equal(exit, code);
    assert.equal(stdout, "");
    assert.ok(stderr.includes(`"code":"${error}"`));
    assert.ok(!stderr.includes("sensitive-fixture-value"));
  }
  try {
    await writeFile(join(root, "branch.json"), '{"apiKey":"sensitive-fixture-value"}');
    await run(["provision", "--branch", "branch.json"], 5, "PROVISIONING_FAILED");
    await run(["provision", "--branch", "branch.json", "--dry-run"], 5, "PROVISIONING_FAILED");
    await run(["provision"], 2, "USAGE");
    await run(["provision", "--branch", "branch.json", "--name", "ignored"], 2, "USAGE");
    await run(["provision", "--branch", "branch.json", "--release", "ignored"], 2, "USAGE");
    await run(["init", "--name", "unwanted", "--branch", "branch.json"], 2, "USAGE");
    await run(["provision", "preview", "--branch", "branch.json"], 2, "USAGE");
    await run(["provision", "", "ignored", "--branch", "branch.json"], 2, "USAGE");
    assert.deepEqual(await readdir(root), ["branch.json"]);
  } finally {
    ciStage("provision.cleanup.begin", { rootHash: ciHash(root) });
    await rm(root, { recursive: true, force: true });
    ciStage("provision.cleanup.end", { rootHash: ciHash(root) });
  }
});
