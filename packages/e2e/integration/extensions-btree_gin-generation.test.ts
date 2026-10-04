import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { extensionProofTest } from "../fixtures/extension-proof";
import { btreeGinGenerationProofCase } from "../fixtures/btree_gin-proof-cases";
import { btreeGinGeneratedSchema, writeBtreeGinRpc } from "../fixtures/btree_gin-generated-project";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { runBtreeGinGeneratedRuntime } from "../fixtures/btree-gin-generated-runtime";

extensionProofTest(
  btreeGinGenerationProofCase,
  async () => {
    for (const placement of ["extensions", "generated_btree_gin"]) {
      const root = await mkdtemp(join(tmpdir(), "loom-btree_gin-generation-"));
      try {
        await initializeProject(root, "btreeginproof");
        await mkdir(join(root, "node_modules"));
        for (const name of ["kello", "valibot", "drizzle-orm", "effect", "@orpc/server", "pg"]) {
          await mkdir(join(root, "node_modules", name, ".."), { recursive: true });
          await symlink(
            await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
            join(root, "node_modules", name),
          );
        }
        const selection = placement === "extensions" ? { version: "1.3" } : { version: "1.3", schema: placement };
        await writeFile(
          join(root, "kello.config.ts"),
          `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { btree_gin: ${JSON.stringify(selection)} } } });`,
        );
        await writeFile(
          join(root, "kello/app.config.ts"),
          'import { defineApplication } from "kello/server"; export default defineApplication({ rpc: ({ os }) => ({ os }) });',
        );
        await writeFile(join(root, "kello/schema.ts"), btreeGinGeneratedSchema(placement));
        await writeFile(
          join(root, "kello/functions/tasks.ts"),
          `import { os } from "../_generated/rpc";
export default os.tasks.router({ list: os.tasks.list.handler(async ({ context: { db, tables, extensions } }) =>
  (await db.select({ label: tables.entries.label, cmp: extensions.btree_gin.ginNumericCmp("1", "2") }).from(tables.entries).limit(100)).map(row => row.label ?? ""),
) });`,
        );
        await writeBtreeGinRpc(root);
        await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        const first = await loadProject(root);
        const generated = await generateProject(root);
        const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
        assert.deepEqual(Object.keys(disk.extensions), ["btree_gin"]);
        assert.equal(Object.keys(disk.extensions.btree_gin.indexes).length, 29);
        assert.deepEqual(Object.keys(disk.extensions.btree_gin.sql.functions).sort(), [
          "gin_enum_cmp",
          "gin_numeric_cmp",
        ]);
        assert.deepEqual(disk.extensions.btree_gin.indexes.int4().input, {
          schema: "pg_catalog",
          type: "int4",
          dimensions: 0,
        });
        assert.equal(disk.extensions.btree_gin.schema, placement);
        const schema = (await import(pathToFileURL(join(root, "kello/schema.ts")).href)).default;
        const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
        assert.equal(server.extensions, disk.extensions);
        const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
        assert.match(source, /kello\/extensions\/btree-gin/);
        assert.doesNotMatch(source, /btree_gist|\/schema|\.\/server|kello\.config/);
        assert.deepEqual(
          schema.metadata.extensionRequirements.map((member: { member: string }) => member.member),
          ["opclass:$extension:btree_gin.int4_ops/gin", "opclass:$extension:btree_gin.text_ops/gin"],
        );
        assert.equal((await generateProject(root)).version, generated.version);
        const child = Bun.spawn(
          [
            fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
            "-p",
            join(root, "tsconfig.json"),
          ],
          { stdout: "pipe", stderr: "pipe" },
        );
        const output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
        assert.equal(await child.exited, 0, output);
        assert(first);
        await withExtensionDatabase((url) => runBtreeGinGeneratedRuntime(root, generated.version, placement, url));
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  },
  360000,
);
