import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateProject, initializeProject } from "kello/tooling";
import { extensionProofTest } from "../fixtures/extension-proof";
import { plpgsqlCheckGenerationProofCase } from "../fixtures/plpgsql_check-proof-cases";

// Requires the built workspace package: generation runs through `kello/tooling`, never source imports.
extensionProofTest(
  plpgsqlCheckGenerationProofCase,
  async () => {
    for (const placement of ["extensions", "check_plpgsql"]) {
      const root = await mkdtemp(join(tmpdir(), "loom-plpgsql_check-generation-"));
      try {
        await initializeProject(root, "plpgsqlcheckproof");
        await mkdir(join(root, "node_modules"));
        for (const name of ["kello", "valibot", "drizzle-orm", "effect", "pg", "@types/pg"]) {
          await mkdir(join(root, "node_modules", ...name.split("/").slice(0, -1)), { recursive: true });
          await symlink(
            await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
            join(root, "node_modules", name),
          );
        }
        const selection = placement === "extensions" ? { version: "2.8" } : { version: "2.8", schema: placement };
        await writeFile(
          join(root, "kello.config.ts"),
          `import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { plpgsql_check: ${JSON.stringify(selection)} } } });`,
        );
        await writeFile(
          join(root, "kello/app.config.ts"),
          'import { defineApplication } from "kello/server"; export default defineApplication({ rpc: ({ os }) => ({ os }) });',
        );
        await writeFile(
          join(root, "kello/operator.ts"),
          `import {
  withPlpgsqlCheck,
  type PlpgsqlCheckIssue,
  type PlpgsqlCheckSession,
} from "kello/tooling/extensions/plpgsql-check";
import { extensions } from "./_generated/extensions";
const descriptor = extensions.plpgsql_check;
const placement: ${JSON.stringify(placement)} = descriptor.schema;
const version: "2.8" = descriptor.version;
// @ts-expect-error Operator analysis is absent from generated application SQL.
descriptor.sql.functions.plpgsql_check_function_tb;
export const run = (url: string) =>
  withPlpgsqlCheck(url, descriptor, async (session: PlpgsqlCheckSession) => {
    const issues: readonly PlpgsqlCheckIssue[] = await session.checkTable({ signature: "public.f(integer)" });
    // @ts-expect-error Reset accepts only the regprocedure overload.
    await session.resetProfile({ name: "public.f" });
    return issues;
  });
void [placement, version];
`,
        );
        await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        const generated = await generateProject(root);
        const source = await readFile(join(root, "kello/_generated/extensions.ts"), "utf8");
        assert.match(source, /kello\/extensions\/plpgsql-check/);
        assert.match(source, /createPlpgsqlCheck_2_8/);
        assert.match(source, /ef00befd1f61c832689dc4d4b3ee3c21f03585eda686474bb5ec8efd8696e74a/);
        const disk = await import(pathToFileURL(join(root, "kello/_generated/extensions.ts")).href);
        assert.deepEqual(Object.keys(disk.extensions), ["plpgsql_check"]);
        assert.equal(disk.extensions.plpgsql_check.schema, placement);
        assert.equal(disk.extensions.plpgsql_check.version, "2.8");
        assert.equal(disk.extensions.plpgsql_check.apiSupport.status, "verified");
        assert.deepEqual(Object.keys(disk.extensions.plpgsql_check.sql.functions), []);
        const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
        assert.equal(server.extensions, disk.extensions);
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
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  },
  120000,
);
