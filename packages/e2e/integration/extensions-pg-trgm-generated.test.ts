import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/pg_trgm.json";
import { extensionProofTest } from "../fixtures/extension-proof";
import { withExtensionDatabase } from "../fixtures/extension-database";
import {
  checkPgTrgmDiskBindings,
  pgTrgmGeneratedModes,
  writePgTrgmProject,
} from "../fixtures/pg-trgm-generated-project";
import { runPgTrgmGeneratedRuntime } from "../fixtures/pg-trgm-generated-runtime";
import { pgTrgmGenerationProofCase, pgTrgmQueryMembers } from "../fixtures/pg-trgm-proof-cases";

async function typecheck(root: string) {
  const compiler = Bun.spawn(
    [fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)), "-p", join(root, "tsconfig.json")],
    { stdout: "pipe", stderr: "pipe" },
  );
  const [out, error, code] = await Promise.all([
    new Response(compiler.stdout).text(),
    new Response(compiler.stderr).text(),
    compiler.exited,
  ]);
  assert.equal(code, 0, out + error);
}

extensionProofTest(
  pgTrgmGenerationProofCase,
  async () => {
    const source = extensionBindingsSource({ pg_trgm: { version: "1.6", schema: "extensions" } });
    assert(source.includes('import { createPgTrgm_1_6 } from "kello/extensions/pg-trgm";'));
    assert(source.includes(manifest.digest));
    assert(!source.includes("kello/tooling"));
    const custom = extensionBindingsSource({ pg_trgm: { version: "1.6", schema: "text_search" } });
    assert(custom.includes('"schema":"text_search"'));
    const future = extensionBindingsSource({ pg_trgm: { version: "9.9", schema: "extensions" } });
    assert(!future.includes("createPgTrgm_1_6"));
    assert(future.includes('"status":"unverified"'));

    for (const mode of pgTrgmGeneratedModes) {
      const root = await mkdtemp(join(tmpdir(), `loom-pg-trgm-generation-${mode}-`));
      try {
        await initializeProject(root, "pgtrgmproof");
        await mkdir(join(root, "node_modules"));
        for (const name of ["kello", "valibot", "drizzle-orm", "effect", "pg", "@orpc/server"]) {
          await mkdir(join(root, "node_modules", name, ".."), { recursive: true });
          await symlink(
            await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
            join(root, "node_modules", name),
          );
        }
        await writePgTrgmProject(root, mode);
        await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        const first = await loadProject(root);
        assert(first);
        const generated = await generateProject(root);
        await checkPgTrgmDiskBindings(root, mode, pgTrgmQueryMembers);
        await typecheck(root);
        assert.equal((await generateProject(root)).version, generated.version);
        await withExtensionDatabase((url) =>
          runPgTrgmGeneratedRuntime(root, mode, generated.version, pgTrgmQueryMembers, url),
        );
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  },
  600000,
);
