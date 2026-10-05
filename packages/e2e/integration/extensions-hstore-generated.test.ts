import assert from "node:assert/strict";
import { copyFile, mkdir, mkdtemp, readFile, realpath, rm, symlink } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { extensionProofTest } from "../fixtures/extension-proof";
import { hstoreGenerationProofCase } from "../fixtures/hstore-proof-cases";
import { hstoreGeneratedModes } from "../fixtures/hstore-generated-project";
import { runHstoreGeneratedRuntime } from "../fixtures/hstore-generated-runtime";
import { withExtensionDatabase } from "../fixtures/extension-database";

extensionProofTest(
  hstoreGenerationProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-hstore-generated-"));
    const modules = await realpath(fileURLToPath(new URL("../../tests/node_modules", import.meta.url)));
    try {
      for (const mode of hstoreGeneratedModes) {
        const project = join(root, mode);
        await mkdir(project);
        await symlink(modules, join(project, "node_modules"));
        for (const name of ["hstore-generated-project.ts", "hstore-generated.ts"])
          await copyFile(new URL(`../fixtures/${name}`, import.meta.url), join(project, name));
        await copyFile(
          new URL("../fixtures/hstore-public-generation.mjs.fixture", import.meta.url),
          join(project, "generate.mjs"),
        );
        for (const command of [
          ["bun", "generate.mjs", mode],
          [
            fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
            "-p",
            join(project, "tsconfig.json"),
          ],
        ]) {
          const child = Bun.spawn(command, { cwd: project, stdout: "pipe", stderr: "pipe", timeout: 180000 });
          const [out, error, code] = await Promise.all([
            new Response(child.stdout).text(),
            new Response(child.stderr).text(),
            child.exited,
          ]);
          assert.equal(code, 0, out + error);
        }
        const generation = JSON.parse(await readFile(join(project, "generation.json"), "utf8"));
        await withExtensionDatabase((url) =>
          runHstoreGeneratedRuntime(project, generation.version, generation.schema, url, mode),
        );
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  720000,
);
