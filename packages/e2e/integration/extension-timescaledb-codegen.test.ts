import assert from "node:assert/strict";
import { mkdtemp, readFile, realpath, rm, symlink } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { extensionProofTest } from "../fixtures/extension-proof";
import { timescaledbGenerationProofCase } from "../fixtures/timescaledb-proof-cases";
import { timescaledbDigest } from "../fixtures/timescaledb";
import { writeTimescaledbProjectFiles } from "../fixtures/timescaledb-generated-project";

extensionProofTest(
  timescaledbGenerationProofCase,
  async () => {
    const prepared = process.env.LOOM_TIMESCALEDB_CONSUMER_ROOT;
    assert(prepared, "Parent must supply the frozen TimescaleDB public consumer root");
    const consumer = await realpath(prepared);
    const { generateProject, initializeProject, loadProject, projectRuntimeGraph }: typeof import("kello/tooling") =
      await import(pathToFileURL(Bun.resolveSync("kello/tooling", consumer)).href);
    for (const placement of ["extensions", "ts_tools"]) {
      const root = await mkdtemp(join(consumer, "timescaledb-generation-"));
      try {
        await initializeProject(root, "timescaledbproof");
        await symlink(join(consumer, "node_modules"), join(root, "node_modules"));
        await writeTimescaledbProjectFiles(root, placement);
        const generatedFile = join(root, "kello/_generated/extensions.ts");
        const childFile = join(root, "kello/components/series/_generated/extensions.ts");
        await assert.rejects(readFile(generatedFile), { code: "ENOENT" });
        await assert.rejects(readFile(childFile), { code: "ENOENT" });
        const virtual = await loadProject(root);
        const scope = projectRuntimeGraph(virtual).scopes.find((entry) => entry.name === "series");
        assert(scope && "extensions" in scope && scope.extensions);
        assert.deepEqual(Object.keys(scope.extensions), ["timescaledb"]);
        const generated = await generateProject(root);
        const source = await readFile(generatedFile, "utf8");
        assert.match(source, /kello\/extensions\/timescaledb/);
        assert.match(source, /createTimescaledb_2_24_0/);
        assert(source.includes(timescaledbDigest));
        assert.doesNotMatch(source, /\.\/server|\.\.\/schema|kello\.config|tooling\/extensions/);
        const disk = await import(pathToFileURL(generatedFile).href);
        const child = await import(pathToFileURL(childFile).href);
        const server = await import(pathToFileURL(join(root, "kello/_generated/server.ts")).href);
        assert.equal(server.extensions, disk.extensions);
        assert.deepEqual(Object.keys(disk.extensions), ["pg_trgm", "timescaledb"]);
        assert.deepEqual(Object.keys(child.extensions), ["timescaledb"]);
        assert.equal(disk.extensions.timescaledb.schema, placement);
        assert.equal(child.extensions.timescaledb.version, "2.24.0");
        assert.equal(Object.keys(disk.extensions.timescaledb.sql.functions).length, 24);
        assert.equal(Object.keys(disk.extensions.timescaledb.timeBucket).length, 20);
        const schema = (await import(pathToFileURL(join(root, "kello/schema.ts")).href)).default;
        assert.equal(schema.metadata.extensionRequirements, undefined);
        const compiler = Bun.spawn([join(consumer, "node_modules/.bin/tsc"), "-p", join(root, "tsconfig.json")], {
          stdout: "pipe",
          stderr: "pipe",
        });
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
