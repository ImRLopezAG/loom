import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { extensionProofTest } from "../fixtures/extension-proof";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { ip4rGenerationProofCase } from "../fixtures/ip4r-composition-proof-cases";
import { checkIp4rDisk, writeIp4rProject } from "../fixtures/ip4r-generated-project";
import { runIp4rGeneratedRuntime } from "../fixtures/ip4r-generated-runtime";

extensionProofTest(
  ip4rGenerationProofCase,
  async () => {
    for (const mode of ["omitted", "empty", "future", "selected", "custom"] as const) {
      const root = await mkdtemp(join(tmpdir(), "loom-ip4r-generation-"));
      try {
        await initializeProject(root, "ip4rproof");
        await mkdir(join(root, "node_modules"));
        for (const name of ["kello", "valibot", "drizzle-orm", "effect", "@orpc/server", "pg"]) {
          await mkdir(join(root, "node_modules", name, ".."), { recursive: true });
          await symlink(
            await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
            join(root, "node_modules", name),
          );
        }
        const selection = await writeIp4rProject(root, mode);
        await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        await loadProject(root);
        const generated = await generateProject(root);
        if (selection.selected) await checkIp4rDisk(root, selection.schema);
        else {
          const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
          if (mode === "future") {
            assert.equal(disk.extensions.ip4r.apiSupport.status, "unverified");
            assert.equal("sql" in disk.extensions.ip4r, false);
          } else assert.equal(disk.extensions, undefined);
        }
        const compiler = Bun.spawn(
          [
            fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
            "-p",
            join(root, "tsconfig.json"),
          ],
          { stdout: "pipe", stderr: "pipe" },
        );
        const [out, error, code] = await Promise.all([
          new Response(compiler.stdout).text(),
          new Response(compiler.stderr).text(),
          compiler.exited,
        ]);
        assert.equal(code, 0, out + error);
        assert.equal((await generateProject(root)).version, generated.version);
        if (selection.selected)
          await withExtensionDatabase(async (url) =>
            runIp4rGeneratedRuntime(root, generated.version, selection.schema, url),
          );
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  },
  360000,
);
