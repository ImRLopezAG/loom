import assert from "node:assert/strict";
import { copyFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { HstoreGeneratedMode } from "./hstore-generated-project";

/** Preparation is explicit; the second process is cold Node24 running actual generated handlers. */
export async function runHstoreGeneratedRuntime(
  root: string,
  version: string,
  schema: string,
  databaseUrl: string,
  mode: HstoreGeneratedMode,
): Promise<void> {
  await writeFile(join(root, "generation.json"), JSON.stringify({ version, schema, mode }));
  for (const [fixture, target] of [
    ["hstore-runtime-prepare.mjs.fixture", "prepare-runtime.mjs"],
    ["hstore-generated-rpc.mjs.fixture", "generated-rpc.mjs"],
    ["hstore-runtime-cleanup.mjs.fixture", "cleanup-runtime.mjs"],
  ] as const)
    await copyFile(new URL(fixture, import.meta.url), join(root, target));
  async function execute(command: string[]): Promise<void> {
    const child = Bun.spawn(command, {
      cwd: root,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 180000,
      env: { ...process.env, LOOM_PACKED_HSTORE_DATABASE_URL: databaseUrl },
    });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    let diagnostic = stdout + stderr;
    const address = new URL(databaseUrl);
    for (const value of [
      databaseUrl,
      address.username,
      decodeURIComponent(address.username),
      address.password,
      decodeURIComponent(address.password),
    ])
      if (value) diagnostic = diagnostic.replaceAll(value, "[REDACTED]");
    assert.equal(code, 0, diagnostic.replace(/postgres(?:ql)?:\/\/\S+/g, "[REDACTED_URL]"));
  }
  try {
    await execute(["bun", "prepare-runtime.mjs"]);
    await execute(["node", "generated-rpc.mjs"]);
  } finally {
    await execute(["bun", "cleanup-runtime.mjs"]);
  }
}
