import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { projectRuntimeGraph } from "../../../apps/loom/src/tooling/project/runtime-graph";
import { extensionProofTest } from "../fixtures/extension-proof";
import { pgHintPlanGenerationProofCase } from "../fixtures/pg_hint_plan-proof-cases";
import { pgHintPlanDigest } from "../fixtures/pg_hint_plan";
import { writePgHintPlanProjectFiles } from "../fixtures/pg_hint_plan-generated-project";

extensionProofTest(
  pgHintPlanGenerationProofCase,
  async () => {
    const root = await mkdtemp(join(tmpdir(), "loom-pg_hint_plan-generation-"));
    try {
      await initializeProject(root, "hintplanproof");
      await mkdir(join(root, "node_modules"));
      for (const name of ["kello", "valibot", "drizzle-orm", "effect"])
        await symlink(
          await realpath(fileURLToPath(new URL(`../../tests/node_modules/${name}`, import.meta.url))),
          join(root, "node_modules", name),
        );
      await writePgHintPlanProjectFiles(root);
      const generatedFile = join(root, "kello/_generated/extensions.ts");
      const childFile = join(root, "kello/components/planner/_generated/extensions.ts");
      await assert.rejects(readFile(generatedFile), { code: "ENOENT" });
      await assert.rejects(readFile(childFile), { code: "ENOENT" });
      const virtual = await loadProject(root);
      const scope = projectRuntimeGraph(virtual).scopes.find((entry) => entry.name === "planner");
      assert(scope && "extensions" in scope && scope.extensions);
      assert.deepEqual(Object.keys(scope.extensions), ["pg_hint_plan"]);
      const generated = await generateProject(root);
      const source = await readFile(generatedFile, "utf8");
      assert.match(source, /kello\/extensions\/pg-hint-plan/);
      assert.match(source, /createPgHintPlan_1_8_0/);
      assert(source.includes(pgHintPlanDigest));
      assert.doesNotMatch(source, /\.\/server|\.\.\/schema|kello\.config|tooling\/extensions/);
      const disk = await import(pathToFileURL(generatedFile).href);
      const child = await import(pathToFileURL(childFile).href);
      const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
      assert.equal(server.extensions, disk.extensions);
      assert.deepEqual(Object.keys(disk.extensions), ["pg_hint_plan", "pg_trgm"]);
      assert.deepEqual(Object.keys(child.extensions), ["pg_hint_plan"]);
      assert.equal(disk.extensions.pg_hint_plan.schema, "hint_plan");
      assert.equal(child.extensions.pg_hint_plan.version, "1.8.0");
      assert.deepEqual(disk.extensions.pg_hint_plan.sql, { functions: {}, operators: {} });
      assert.deepEqual(disk.extensions.pg_hint_plan.upsertHint, {
        member: 'table:"$extension:pg_hint_plan".hints',
        authority: "operator",
      });
      const schema = (await import(pathToFileURL(join(root, "kello/schema.ts")).href)).default;
      assert.deepEqual(schema.metadata.extensionRequirements, []);
      const compiler = Bun.spawn(
        [fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)), "-p", join(root, "tsconfig.json")],
        { stdout: "pipe", stderr: "pipe" },
      );
      const [stdout, stderr, code] = await Promise.all([
        new Response(compiler.stdout).text(),
        new Response(compiler.stderr).text(),
        compiler.exited,
      ]);
      assert.equal(code, 0, stdout + stderr);
      assert.equal((await generateProject(root)).version, generated.version);
      // The fixed control-file schema is enforced at generation, not silently relocated.
      await writeFile(
        join(root, "kello.config.ts"),
        'import { defineConfig } from "kello/tooling"; export default defineConfig({ database: { extensions: { pg_hint_plan: { version: "1.8.0" } } } });',
      );
      await assert.rejects(loadProject(root), /fixed installation schema hint_plan/);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  },
  120000,
);
