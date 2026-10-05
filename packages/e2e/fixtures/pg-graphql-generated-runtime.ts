import assert from "node:assert/strict";
import { copyFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { PgGraphqlGeneratedMode } from "./pg_graphql-generated-project";

/** Bun performs explicit preparation; a cold Node process executes the actual generated runtime. */
export async function runPgGraphqlGeneratedRuntime(
  root: string,
  version: string,
  schema: string,
  databaseUrl: string,
  mode: PgGraphqlGeneratedMode,
) {
  await writeFile(join(root, "generation.json"), JSON.stringify({ version, schema, mode }));
  for (const [fixture, target] of [
    ["pg-graphql-runtime-prepare.mjs.fixture", "prepare-runtime.mjs"],
    ["pg-graphql-generated-rpc.mjs.fixture", "generated-rpc.mjs"],
  ] as const)
    await copyFile(new URL(fixture, import.meta.url), join(root, target));
  for (const command of [
    ["bun", "prepare-runtime.mjs"],
    ["node", "generated-rpc.mjs"],
  ]) {
    const child = Bun.spawn(command, {
      cwd: root,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 180000,
      env: { ...process.env, LOOM_PACKED_PG_GRAPHQL_DATABASE_URL: databaseUrl },
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
}
