import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { extensionProofTest } from "../fixtures/extension-proof";
import { dblinkGenerationProofCase } from "../fixtures/dblink-proof-cases";
import {
  checkDblinkDiskBindings,
  writeDblinkEmptyProject,
  writeDblinkFutureProject,
  writeDblinkSelectedProject,
} from "../fixtures/dblink-generated-project";

async function projectFixture(name: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), `loom-dblink-${name}-`));
  try {
    await initializeProject(root, name);
    await mkdir(join(root, "node_modules"));
    for (const pkg of ["kello", "valibot", "drizzle-orm", "effect"])
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${pkg}`, import.meta.url))),
        join(root, "node_modules", pkg),
      );
    return root;
  } catch (cause) {
    await rm(root, { recursive: true, force: true });
    throw cause;
  }
}

async function checkFixtureTypes(root: string): Promise<void> {
  const child = Bun.spawn(
    [fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url)), "-p", join(root, "tsconfig.json")],
    { stdout: "pipe", stderr: "pipe" },
  );
  const output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
  assert.equal(await child.exited, 0, output);
}

extensionProofTest(
  dblinkGenerationProofCase,
  async () => {
    const emptyRoot = await projectFixture("dblinkempty");
    try {
      await writeDblinkEmptyProject(emptyRoot);
      await assert.rejects(readFile(join(emptyRoot, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      const emptyFirst = await loadProject(emptyRoot);
      assert.equal(emptyFirst.config.database.extensions, undefined);
      const emptyGenerated = await generateProject(emptyRoot);
      const emptyDisk = await import(pathToFileURL(join(emptyRoot, "kello/_generated/extensions.ts")).href);
      assert.equal(emptyDisk.extensions, undefined);
      assert.equal(emptyDisk.selection, undefined);
      assert.equal((await generateProject(emptyRoot)).version, emptyGenerated.version);
    } finally {
      await rm(emptyRoot, { recursive: true, force: true });
    }

    const futureRoot = await projectFixture("dblinkfuture");
    try {
      await writeDblinkFutureProject(futureRoot);
      await assert.rejects(readFile(join(futureRoot, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      const futureFirst = await loadProject(futureRoot);
      assert.deepEqual(futureFirst.config.database.extensions?.dblink, { version: "future", schema: "extensions" });
      const futureGenerated = await generateProject(futureRoot);
      const futureSource = await readFile(join(futureRoot, "kello/_generated/extensions.ts"), "utf8");
      assert(!futureSource.includes("createDblink_1_2"));
      assert(futureSource.includes('"status":"unverified"'));
      const futureDisk = await import(pathToFileURL(join(futureRoot, "kello/_generated/extensions.ts")).href);
      assert.equal(futureDisk.extensions.dblink.apiSupport.status, "unverified");
      assert.equal("connections" in futureDisk.extensions.dblink, false);
      assert.equal((await generateProject(futureRoot)).version, futureGenerated.version);
    } finally {
      await rm(futureRoot, { recursive: true, force: true });
    }

    for (const schema of [undefined, "dblink_cache"]) {
      const root = await projectFixture("dblinkselected");
      try {
        const placement = await writeDblinkSelectedProject(root, schema);
        const component = join(root, "kello/components/remote");
        await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        await assert.rejects(readFile(join(component, "_generated/extensions.ts")), { code: "ENOENT" });
        const first = await loadProject(root);
        assert.deepEqual(first.config.database.extensions?.dblink, { version: "1.2", schema: placement });
        assert.equal(first.componentScopes.length, 1);
        assert.deepEqual(Object.keys(first.componentScopes[0]!.boundExtensions ?? {}), ["dblink"]);
        const generated = await generateProject(root);
        await checkDblinkDiskBindings(root, placement);
        const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
        assert.deepEqual(Object.keys(child.extensions), ["dblink"]);
        assert.equal(child.extensions.dblink.schema, placement);
        await checkFixtureTypes(root);
        assert.equal((await generateProject(root)).version, generated.version);
        const { runtimeOptions } = await import(
          pathToFileURL(join(root, ".loom/generations", generated.version, "runtime.js")).href
        );
        const options = runtimeOptions();
        const mounted = options.scopes.find((scope: { name: string }) => scope.name === "remote");
        assert(mounted);
        assert.deepEqual(Object.keys(mounted.extensions), ["dblink"]);
        assert.equal(mounted.extensions.dblink.schema, placement);
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  },
  180000,
);
