import assert from "node:assert/strict";
import { copyFile, mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { extensionProofTest } from "../fixtures/extension-proof";
import { neonUtilsGenerationProofCase } from "../fixtures/neon_utils-proof-cases";
import { checkNeonUtilsDiskBindings, writeNeonUtilsProject } from "../fixtures/neon_utils-generated-project";
import { withExtensionDatabase } from "../fixtures/extension-database";

extensionProofTest(
  neonUtilsGenerationProofCase,
  async () => {
    for (const schema of [undefined, "cpu_custom"]) {
      const root = await mkdtemp(join(tmpdir(), "loom-neon_utils-generation-"));
      try {
        await initializeProject(root, "cpuproject");
        await mkdir(join(root, "node_modules"));
        for (const name of ["kello", "valibot", "drizzle-orm", "effect", "@orpc/server", "pg"]) {
          await mkdir(dirname(join(root, "node_modules", name)), { recursive: true });
          await symlink(
            await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
            join(root, "node_modules", name),
          );
        }
        await writeNeonUtilsProject(root, schema);
        await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        await loadProject(root);
        const generated = await generateProject(root);
        await checkNeonUtilsDiskBindings(root, schema ?? "extensions");
        assert.equal((await generateProject(root)).version, generated.version);
        const child = Bun.spawn(
          [
            fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
            "-p",
            join(root, "tsconfig.json"),
          ],
          { stdout: "pipe", stderr: "pipe" },
        );
        const [stdout, stderr, code] = await Promise.all([
          new Response(child.stdout).text(),
          new Response(child.stderr).text(),
          child.exited,
        ]);
        assert.equal(code, 0, stdout + stderr);
        await writeFile(
          join(root, "generation.json"),
          JSON.stringify({ version: generated.version, schema: schema ?? "extensions" }),
        );
        await copyFile(
          fileURLToPath(new URL("../fixtures/neon_utils-generated-rpc.mjs.fixture", import.meta.url)),
          join(root, "generated-rpc.mjs"),
        );
        await copyFile(
          new URL("../fixtures/generated-runtime-prepare.mjs.fixture", import.meta.url),
          join(root, "prepare-runtime.mjs"),
        );
        await withExtensionDatabase(async (url) => {
          const prepare = Bun.spawn(["bun", "prepare-runtime.mjs", "neon_utils"], {
            cwd: root,
            stdout: "pipe",
            stderr: "pipe",
            env: { ...process.env, LOOM_GENERATED_RUNTIME_DATABASE_URL: url },
          });
          const output = (await new Response(prepare.stdout).text()) + (await new Response(prepare.stderr).text());
          assert.equal(await prepare.exited, 0, output.replaceAll(url, "[REDACTED]"));
          const cold = Bun.spawn(["node", "generated-rpc.mjs"], {
            cwd: root,
            stdout: "pipe",
            stderr: "pipe",
            env: { ...process.env, LOOM_NEON_UTILS_CONSUMER_DATABASE_URL: url },
          });
          const coldOutput = (await new Response(cold.stdout).text()) + (await new Response(cold.stderr).text());
          assert.equal(await cold.exited, 0, coldOutput);
        });
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  },
  180000,
);
