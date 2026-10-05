import assert from "node:assert/strict";
import { mkdtemp, mkdir, realpath, symlink, writeFile, readFile, rm, access } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { extensionProofTest } from "../fixtures/extension-proof";
import { intarrayGenerationProofCase, intarrayProofFamily } from "../fixtures/intarray-proof-cases";

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), "kello-generated-intarray-"));
  try {
    await initializeProject(root, "selectedintarray");
    await mkdir(join(root, "node_modules"));
    for (const name of ["kello", "valibot", "drizzle-orm", "effect"])
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
        join(root, "node_modules", name),
      );
    return root;
  } catch (cause) {
    await rm(root, { recursive: true, force: true });
    throw cause;
  }
}

extensionProofTest(
  intarrayGenerationProofCase,
  async () => {
    for (const placement of ["extensions", "generated_int"]) {
      const root = await fixture();
      try {
        const component = join(root, "kello/components/tagging");
        await mkdir(join(component, "contracts"), { recursive: true });
        await mkdir(join(component, "functions"));
        const selection = placement === "extensions" ? { version: "1.5" } : { version: "1.5", schema: placement };
        await writeFile(
          join(root, "kello.config.ts"),
          `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { intarray: ${JSON.stringify(selection)} } } });`,
        );
        await writeFile(
          join(root, "kello/schema.ts"),
          `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions";
const api = extensions.intarray;
if (api.version !== "1.5" || api.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong first-load selection");
api.sort([3, 1, 2]); api.indexes.gin();
export default defineSchema(s => ({ tasks: { title: s.text().notNull() } }), { namespace: "app" });`,
        );
        await writeFile(
          join(component, "setup.ts"),
          'import { defineComponent } from "./_generated/setup"; export default defineComponent({ name: "tagging", extensions: { intarray: { versions: ["1.5"] } }, rpc: ({ os }) => ({ os }) });',
        );
        await writeFile(
          join(component, "schema.ts"),
          `import { defineSchema } from "kello/server"; import { extensions } from "./_generated/extensions"; if (extensions.intarray.schema !== ${JSON.stringify(placement)}) throw new Error("Wrong component selection"); extensions.intarray.matches([1], "1"); export default defineSchema(() => ({}));`,
        );
        await writeFile(
          join(root, "kello/app.config.ts"),
          'import { defineApplication } from "kello/server"; import tagging from "./components/tagging/setup"; const app = defineApplication({ rpc: ({ os }) => ({ os }) }); app.use(tagging); export default app;',
        );
        await writeFile(
          join(root, "kello/functions/tasks.ts"),
          `import { os } from "../_generated/rpc";
import type { SQL } from "drizzle-orm"; import type { PostgreSqlArray } from "kello/extensions/intarray";
export default os.tasks.router({ list: os.tasks.list.handler(({ context }) => {
const version: "1.5" = context.extensions.intarray.version;
const schema: ${JSON.stringify(placement)} = context.extensions.intarray.schema;
const result: SQL<PostgreSqlArray<number> | null> = context.extensions.intarray.sort([3, 1]);
// @ts-expect-error Only selected extension keys exist.
void context.extensions.hstore;
// @ts-expect-error Scalar int4 is not int4[].
context.extensions.intarray.sort(1);
// @ts-expect-error PostgreSQL sort direction is ASC or DESC.
context.extensions.intarray.sort([1], "up");
void [schema, result]; return [version]; }) });`,
        );
        await assert.rejects(access(join(root, "kello/_generated/extensions.ts")));
        const first = await loadProject(root);
        assert.equal(first.config.database.extensions?.intarray?.schema, placement);
        // Loading consumed virtual bindings; it must not quietly substitute disk generation.
        await assert.rejects(access(join(root, "kello/_generated/extensions.ts")));
        const generated = await generateProject(root);
        const diskPath = join(root, "kello/_generated/extensions.ts");
        const source = await readFile(diskPath, "utf8");
        assert.match(source, /from "kello\/extensions\/intarray"/);
        assert(source.includes(intarrayProofFamily.manifestDigest));
        assert(!/kello\/tooling|manifests\//.test(source));
        const disk = await import(pathToFileURL(diskPath).href);
        const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
        assert.equal(server.extensions, disk.extensions);
        assert.deepEqual(Object.keys(disk.extensions), ["intarray"]);
        assert.equal(disk.extensions.intarray.version, "1.5");
        assert.equal(disk.extensions.intarray.schema, placement);
        assert.equal(Object.keys(disk.extensions.intarray.sql.overloads).length, 39);
        const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
        assert.deepEqual(Object.keys(child.extensions), ["intarray"]);
        assert.equal(child.extensions.intarray.schema, placement);
        const typecheck = Bun.spawn(
          [
            fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)),
            "-p",
            join(root, "tsconfig.json"),
          ],
          { stdout: "pipe", stderr: "pipe" },
        );
        const [stdout, stderr, code] = await Promise.all([
          new Response(typecheck.stdout).text(),
          new Response(typecheck.stderr).text(),
          typecheck.exited,
        ]);
        assert.equal(code, 0, stdout + stderr);
        assert.equal((await generateProject(root)).version, generated.version);
        assert.equal(await readFile(diskPath, "utf8"), source);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  },
  90000,
);
