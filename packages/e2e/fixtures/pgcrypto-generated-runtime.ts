import assert from "node:assert/strict";
import { copyFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { withExtensionDatabase } from "./extension-database";
import {
  pgcryptoGeneratedPassphrase,
  pgcryptoGeneratedPlacement,
  pgcryptoGeneratedPlaintext,
  type PgcryptoGeneratedMode,
} from "./pgcrypto-generated-project";

/** Bun prepares the journaled principal; a cold Node 24 process executes the actual generated runtime. */
export async function runPgcryptoGeneratedRuntime(
  root: string,
  version: string,
  mode: PgcryptoGeneratedMode,
): Promise<void> {
  await writeFile(
    join(root, "generation.json"),
    JSON.stringify({
      version,
      mode,
      schema: pgcryptoGeneratedPlacement,
      passphrase: pgcryptoGeneratedPassphrase,
      plaintext: pgcryptoGeneratedPlaintext,
    }),
  );
  for (const [fixture, target] of [
    ["pgcrypto-runtime-prepare.mjs.fixture", "prepare-runtime.mjs"],
    ["pgcrypto-generated-rpc.mjs.fixture", "generated-rpc.mjs"],
  ] as const)
    await copyFile(new URL(fixture, import.meta.url), join(root, target));
  await withExtensionDatabase(async (databaseUrl) => {
    for (const command of [
      ["bun", "prepare-runtime.mjs"],
      ["node", "generated-rpc.mjs"],
    ]) {
      const child = Bun.spawn(command, {
        cwd: root,
        stdout: "pipe",
        stderr: "pipe",
        timeout: 180000,
        env: { ...process.env, LOOM_PGCRYPTO_GENERATED_DATABASE_URL: databaseUrl },
      });
      const [stdout, stderr, code] = await Promise.all([
        new Response(child.stdout).text(),
        new Response(child.stderr).text(),
        child.exited,
      ]);
      let diagnostic = stdout + stderr;
      const address = new URL(databaseUrl);
      for (const value of [databaseUrl, address.password, decodeURIComponent(address.password)])
        if (value) diagnostic = diagnostic.replaceAll(value, "[REDACTED]");
      assert.equal(
        code,
        0,
        `${mode} ${command[1]}\n${diagnostic.replace(/postgres(?:ql)?:\/\/\S+/g, "[REDACTED_URL]")}`,
      );
    }
  });
}
