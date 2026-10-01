import assert from "node:assert/strict";
import { test } from "bun:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

test("packed extension configuration exposes canonical typed names and normalized placements", async () => {
  const root = await mkdtemp(join(tmpdir(), "loom-packed-extensions-"));
  const source = fileURLToPath(new URL("../../../apps/loom/", import.meta.url));
  const manifest = await Bun.file(join(source, "package.json")).json();
  async function run(command: string[], cwd = root) {
    const child = Bun.spawn(command, { cwd, stdout: "pipe", stderr: "pipe", timeout: 120000 });
    const [stdout, stderr, code] = await Promise.all([
      new Response(child.stdout).text(),
      new Response(child.stderr).text(),
      child.exited,
    ]);
    assert.equal(code, 0, `${command.join(" ")}\n${stdout}\n${stderr}`);
  }
  try {
    await run(["bun", "pm", "pack", "--filename", join(root, "loom.tgz"), "--ignore-scripts"], source);
    await writeFile(
      join(root, "package.json"),
      JSON.stringify({
        private: true,
        type: "module",
        dependencies: { loom: "file:./loom.tgz" },
        devDependencies: { typescript: manifest.devDependencies.typescript },
      }),
    );
    await run(["bun", "install", "--ignore-scripts", "--linker", "isolated"]);
    await writeFile(
      join(root, "probe.ts"),
      `
import { defineConfig, neonExtensionNames, neonExtensionCatalogue } from "loom/tooling";
import type { LoomExtensionsInput, LoomExtensions, NeonExtensionName } from "loom/tooling";
const name: NeonExtensionName = "uuid-ossp";
const extensions: LoomExtensionsInput = { vector: { version: "0.8.6" }, [name]: { version: "1.1", schema: "custom_extensions" } };
const normalized: LoomExtensions | undefined = defineConfig({ database: { extensions } }).database.extensions;
if (normalized?.vector?.schema !== "extensions" || normalized["uuid-ossp"]?.schema !== "custom_extensions") throw new Error("Incorrect placement");
if (neonExtensionCatalogue.postgresVersion !== 18 || !neonExtensionNames.includes("vector")) throw new Error("Incorrect catalogue");
// @ts-expect-error Canonical SQL names only.
const alias: LoomExtensionsInput = { pgvector: { version: "0.8.6" } };
// @ts-expect-error Exact version required.
const incomplete: LoomExtensionsInput = { vector: {} };
// @ts-expect-error Unavailable new installation.
const blocked: LoomExtensionsInput = { pg_ivm: { version: "1.12" } };
void [alias, incomplete, blocked];
`,
    );
    await writeFile(
      join(root, "tsconfig.json"),
      JSON.stringify({
        compilerOptions: {
          target: "ES2023",
          module: "Preserve",
          moduleResolution: "Bundler",
          strict: true,
          noEmit: true,
          skipLibCheck: true,
          types: [],
        },
        include: ["probe.ts"],
      }),
    );
    await run([join(root, "node_modules/.bin/tsc"), "-p", "tsconfig.json"]);
    await run(["bun", "probe.ts"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
}, 120000);
