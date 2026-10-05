import { expect } from "bun:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import { isnGeneratedSelection } from "../fixtures/isn-generated-project";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/isn.json";
import { extensionProofTest } from "../fixtures/extension-proof";
import { isnGenerationProofCase } from "../fixtures/isn-proof-cases";

extensionProofTest(
  isnGenerationProofCase,
  async () => {
    const source = extensionBindingsSource(isnGeneratedSelection);
    expect(source).toContain('import { createIsn_1_3 } from "kello/extensions/isn";');
    expect(source).toContain('"isn": createIsn_1_3(descriptors["isn"])');
    expect(source).toContain(manifest.digest);
    for (const forbidden of ["kello/extensions/seg", "kello/extensions/cube", "./schema", "./server"])
      expect(source).not.toContain(forbidden);
    const unsupported = extensionBindingsSource({ isn: { version: "0.0.0", schema: "extensions" } });
    expect(unsupported).not.toContain("createIsn_1_3");
    expect(unsupported).toContain('"status":"unverified"');
    for (const placement of ["extensions", "isn_custom"]) {
      const root = await mkdtemp(join(tmpdir(), "loom-isn-generation-"));
      try {
        await initializeProject(root, "isnproof");
        await rm(join(root, "kello/functions/tasks.ts"));
        await rm(join(root, "kello/contracts/tasks.ts"));
        await mkdir(join(root, "node_modules"));
        for (const name of ["kello", "valibot", "drizzle-orm", "effect"])
          await symlink(
            await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
            join(root, "node_modules", name),
          );
        await writeFile(
          join(root, "kello.config.ts"),
          `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { isn: { version: "1.3", schema: ${JSON.stringify(placement)} } } } });`,
        );
        await writeFile(
          join(root, "kello/app.config.ts"),
          'import { defineApplication } from "kello/server"; export default defineApplication({ rpc: ({ os }) => ({ os }) });',
        );
        await writeFile(
          join(root, "kello/schema.ts"),
          `import { defineSchema, defineTable } from "kello/server";
import { extensions } from "./_generated/extensions";
const api = extensions.isn;
if (api.schema !== ${JSON.stringify(placement)} || Object.keys(api.sql.overloads).length !== 395) throw new Error("Wrong first-load ISN binding");
export default defineSchema(() => ({ books: defineTable({ isbn: api.isbn.field().notNull(), editions: api.isbn.arrayField() }, { indexes: [{ fields: ["isbn"], extension: api.isbn.indexes.btree() }] }) }), { namespace: "app" });`,
        );
        await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        const first = await loadProject(root);
        assert(first);
        const generated = await generateProject(root);
        const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
        assert.deepEqual(Object.keys(disk.extensions), ["isn"]);
        assert.equal(disk.extensions.isn.schema, placement);
        assert.equal(disk.extensions.isn.apiSupport.digest, manifest.digest);
        assert.equal(Object.keys(disk.extensions.isn.sql.overloads).length, 395);
        assert.equal(Object.keys(disk.extensions.isn.sql.casts).length, 20);
        assert.equal((await generateProject(root)).version, generated.version);
        await writeFile(
          join(root, "kello/isn-types.ts"),
          await readFile(fileURLToPath(new URL("../fixtures/isn-consumer.ts.fixture", import.meta.url)), "utf8"),
        );
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
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  },
  120000,
);
