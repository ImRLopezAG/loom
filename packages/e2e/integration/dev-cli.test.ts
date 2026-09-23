import assert from "node:assert/strict";
import { test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

test("development CLI validates declarations and keeps failed initial edits watchable until shutdown", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-dev-cli-"));
  const cli = fileURLToPath(new URL("../../../apps/loom/src/cli.ts", import.meta.url));
  const env = { ...process.env, LOOM_TEST_DEV_TOKEN: "a".repeat(64) };
  async function run(args: string[], expected: number, code: string) {
    const child = Bun.spawn([process.execPath, cli, ...args, "--cwd", root, "--json"], {
      stdout: "pipe",
      stderr: "pipe",
      env,
    });
    const [stdout, stderr, exit] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    assert.equal(exit, expected);
    assert.equal(stdout, "");
    assert.ok(stderr.includes(`"code":"${code}"`), stderr);
    assert.ok(!stderr.includes("sensitive-fixture-value"));
  }
  try {
    await writeFile(join(root, "loom.dev.json"), '{"activationToken":"sensitive-fixture-value"}');
    await run(["dev"], 5, "DEVELOPMENT_FAILED");
    for (const args of [
      ["dev", "extra"],
      ["dev", "--dry-run"],
      ["dev", "--name", "ignored"],
      ["doctor", "--development", "loom.dev.json"],
    ])
      await run(args, 2, "USAGE");
    const declaration = {
      format: 1,
      databaseName: "neondb",
      migrationRole: "owner",
      runtimeRole: "runtime",
      deployment: "local",
      activationTokenEnv: "LOOM_TEST_DEV_TOKEN",
      port: 0,
    };
    for (const invalid of [
      { ...declaration, format: 2 },
      { ...declaration, activationTokenEnv: "LOOM_MISSING_DEV_TEST_TOKEN" },
      { ...declaration, activationTokenEnv: "NEON_API_KEY" },
      { ...declaration, port: 65536 },
      { ...declaration, password: "sensitive-fixture-value" },
    ]) {
      await writeFile(join(root, "loom.dev.json"), JSON.stringify(invalid));
      await run(["dev"], 5, "DEVELOPMENT_FAILED");
    }
    await run(["dev", "--development", "../outside.json"], 5, "DEVELOPMENT_FAILED");
    await writeFile(join(root, "session.json"), JSON.stringify(declaration));
    await writeFile(join(root, "loom.config.ts"), 'throw new Error("sensitive-fixture-value"); export default {};');
    const child = Bun.spawn([process.execPath, cli, "dev", "--development", "session.json", "--cwd", root, "--json"], {
      stdout: "pipe",
      stderr: "pipe",
      env,
    });
    const output = new Response(child.stdout).text();
    const reader = child.stderr.getReader();
    let errors = "";
    const timeout = setTimeout(() => child.kill("SIGKILL"), 5000);
    try {
      while (!errors.includes("DEVELOPMENT_UPDATE_FAILED")) {
        const chunk = await reader.read();
        if (chunk.done) throw new Error(`Development exited before reporting an edit failure: ${errors}`);
        errors += new TextDecoder().decode(chunk.value);
      }
      child.kill("SIGTERM");
      assert.equal(await child.exited, 0);
      const stdout = await output;
      assert.ok(stdout.includes('"event":"watching"'));
      assert.ok(stdout.includes('"event":"stopped"'));
      assert.ok(!errors.includes("sensitive-fixture-value"));
      assert.ok(!stdout.includes(env.LOOM_TEST_DEV_TOKEN));
    } finally {
      clearTimeout(timeout);
      child.kill("SIGKILL");
      await child.exited;
      reader.releaseLock();
    }
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 15000);
