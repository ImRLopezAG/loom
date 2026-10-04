import assert from "node:assert/strict";
import { copyFile, mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { extensionProofTest } from "../fixtures/extension-proof";
import { lakebaseTokenizerGenerationProofCase } from "../fixtures/lakebase-tokenizer-proof-cases";
import {
  checkLakebaseTokenizerGeneratedProject,
  writeLakebaseTokenizerDescriptorProject,
  writeLakebaseTokenizerProject,
  type LakebaseTokenizerGenerationSelection,
} from "../fixtures/lakebase-tokenizer-generated-project";
import { withExtensionDatabase } from "../fixtures/extension-database";

extensionProofTest(
  lakebaseTokenizerGenerationProofCase,
  async () => {
    const cases: ReadonlyArray<{
      selection: LakebaseTokenizerGenerationSelection;
      schema?: string;
      explicitEmpty?: boolean;
    }> = [
      { selection: "empty" },
      { selection: "empty", explicitEmpty: true },
      { selection: "future" },
      { selection: "selected" },
      { selection: "selected", schema: "tokenizer_custom" },
    ];
    for (const { selection, schema, explicitEmpty } of cases) {
      const root = await mkdtemp(join(tmpdir(), "loom-tokenizer-generation-"));
      try {
        await initializeProject(root, "tokenizerproject");
        await mkdir(join(root, "node_modules"));
        for (const name of ["kello", "valibot", "drizzle-orm", "effect", "@orpc/server", "pg"]) {
          await mkdir(dirname(join(root, "node_modules", name)), { recursive: true });
          await symlink(
            await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
            join(root, "node_modules", name),
          );
        }
        if (selection === "selected") await writeLakebaseTokenizerProject(root, schema);
        else await writeLakebaseTokenizerDescriptorProject(root, selection, explicitEmpty);
        await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        await assert.rejects(readFile(join(root, "kello/components/tokenizer/_generated/extensions.ts")), {
          code: "ENOENT",
        });
        const first = await loadProject(root);
        assert.equal(first.componentScopes.length, 2);
        assert.equal(
          first.componentScopes.find((scope) => scope.mountPath === "unselected")!.boundExtensions,
          undefined,
        );
        assert.deepEqual(
          Object.keys(first.componentScopes.find((scope) => scope.mountPath === "tokenizer")!.boundExtensions ?? {}),
          selection === "empty" ? [] : ["lakebase_tokenizer"],
        );
        if (selection === "empty") assert.equal(first.config.database.extensions, undefined);
        else
          assert.deepEqual(first.config.database.extensions?.lakebase_tokenizer, {
            version: selection === "future" ? "future" : "0.1.1",
            schema: schema ?? "extensions",
          });
        const generated = await generateProject(root);
        await checkLakebaseTokenizerGeneratedProject(root, selection, schema ?? "extensions", generated.version);
        assert.equal((await generateProject(root)).version, generated.version);
        const child = Bun.spawn(
          [
            fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
            "--noEmit",
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
          JSON.stringify({ version: generated.version, schema: schema ?? "extensions", selection }),
        );
        await copyFile(
          fileURLToPath(new URL("../fixtures/lakebase-tokenizer-generated-rpc.mjs.fixture", import.meta.url)),
          join(root, "generated-rpc.mjs"),
        );
        await copyFile(
          fileURLToPath(new URL("../fixtures/lakebase-tokenizer-generated-setup.mjs.fixture", import.meta.url)),
          join(root, "generated-setup.mjs"),
        );
        await withExtensionDatabase(async (url) => {
          async function run(command: string[]): Promise<void> {
            const child = Bun.spawn(command, {
              cwd: root,
              stdout: "pipe",
              stderr: "pipe",
              env: {
                ...process.env,
                LOOM_LAKEBASE_TOKENIZER_CONSUMER_DATABASE_URL: url,
                LOOM_LAKEBASE_TOKENIZER_PARENT_DATABASE: new URL(url).pathname.slice(1),
              },
            });
            const [stdout, stderr, code] = await Promise.all([
              new Response(child.stdout).text(),
              new Response(child.stderr).text(),
              child.exited,
            ]);
            assert.equal(code, 0, stdout + stderr);
          }
          try {
            await run(["bun", "generated-setup.mjs"]);
            await run([process.env.LOOM_LAKEBASE_TOKENIZER_NODE24 ?? "node", "generated-rpc.mjs"]);
          } finally {
            await run(["bun", "generated-setup.mjs", "cleanup"]);
          }
        });
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  },
  240000,
);
