import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { projectRuntimeGraph } from "../../../apps/loom/src/tooling/project/runtime-graph";
import { extensionProofTest } from "../fixtures/extension-proof";
import { hypopgGenerationProofCase } from "../fixtures/hypopg-proof-cases";
import { hypopgDigest } from "../fixtures/hypopg";
import { writeHypopgProjectFiles } from "../fixtures/hypopg-generated-project";

extensionProofTest(
  hypopgGenerationProofCase,
  async () => {
    for (const placement of ["extensions", "hypopg_tools"]) {
      const root = await mkdtemp(join(tmpdir(), "loom-hypopg-generation-"));
      try {
        await initializeProject(root, "hypopgproof");
        await mkdir(join(root, "node_modules"));
        for (const name of ["kello", "valibot", "drizzle-orm", "effect"])
          await symlink(
            await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
            join(root, "node_modules", name),
          );
        await writeHypopgProjectFiles(root, placement);
        const generatedFile = join(root, "kello/_generated/extensions.ts");
        const childFile = join(root, "kello/components/planner/_generated/extensions.ts");
        await assert.rejects(readFile(generatedFile), { code: "ENOENT" });
        await assert.rejects(readFile(childFile), { code: "ENOENT" });
        const virtual = await loadProject(root);
        const scope = projectRuntimeGraph(virtual).scopes.find((entry) => entry.name === "planner");
        assert(scope && "extensions" in scope && scope.extensions);
        assert.deepEqual(Object.keys(scope.extensions), ["hypopg"]);
        const generated = await generateProject(root);
        const source = await readFile(generatedFile, "utf8");
        assert.match(source, /kello\/extensions\/hypopg/);
        assert.match(source, /createHypopg_1_4_3/);
        assert(source.includes(hypopgDigest));
        assert.doesNotMatch(source, /\.\/server|\.\.\/schema|kello\.config|tooling\/extensions/);
        const disk = await import(pathToFileURL(generatedFile).href);
        const child = await import(pathToFileURL(childFile).href);
        const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
        assert.equal(server.extensions, disk.extensions);
        assert.deepEqual(Object.keys(disk.extensions), ["hypopg", "pg_trgm"]);
        assert.deepEqual(Object.keys(child.extensions), ["hypopg"]);
        assert.equal(disk.extensions.hypopg.schema, placement);
        assert.equal(child.extensions.hypopg.version, "1.4.3");
        assert.equal(Object.keys(disk.extensions.hypopg.sql.functions).length, 4);
        const schema = (await import(pathToFileURL(join(root, "kello/schema.ts")).href)).default;
        assert.deepEqual(
          schema.metadata.extensionRequirements.map((entry: { member: string }) => entry.member).sort(),
          [
            "type:$extension:hypopg._hypopg_hidden_indexes",
            "type:$extension:hypopg._hypopg_list_indexes",
            "type:$extension:hypopg.hypopg_hidden_indexes",
            "type:$extension:hypopg.hypopg_list_indexes",
          ].sort(),
        );
        const compiler = Bun.spawn(
          [
            fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
            "-p",
            join(root, "tsconfig.json"),
          ],
          { stdout: "pipe", stderr: "pipe" },
        );
        const [stdout, stderr, code] = await Promise.all([
          new Response(compiler.stdout).text(),
          new Response(compiler.stderr).text(),
          compiler.exited,
        ]);
        assert.equal(code, 0, stdout + stderr);
        assert.equal((await generateProject(root)).version, generated.version);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  },
  120000,
);
