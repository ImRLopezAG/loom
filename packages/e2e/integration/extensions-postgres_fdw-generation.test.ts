import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { extensionProofTest } from "../fixtures/extension-proof";
import { postgresFdwGenerationProofCase } from "../fixtures/postgres_fdw-proof-cases";
import { withExtensionDatabase } from "../fixtures/extension-database";
import { runPostgresFdwGeneratedRuntime } from "../fixtures/postgres_fdw-generated-runtime";
import {
  checkPostgresFdwDiskBindings,
  writePostgresFdwEmptyProject,
  writePostgresFdwFutureProject,
  writePostgresFdwSelectedProject,
} from "../fixtures/postgres_fdw-generated-project";

async function projectFixture(name: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), `loom-postgres_fdw-${name}-`));
  try {
    await initializeProject(root, name);
    await mkdir(join(root, "node_modules"));
    for (const pkg of ["kello", "valibot", "drizzle-orm", "effect", "@orpc/server", "pg"]) {
      await mkdir(join(root, "node_modules", pkg, ".."), { recursive: true });
      await symlink(
        await realpath(fileURLToPath(new URL(`../../tests/node_modules/${pkg}`, import.meta.url))),
        join(root, "node_modules", pkg),
      );
    }
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
  postgresFdwGenerationProofCase,
  async () => {
    const emptyRoot = await projectFixture("fdwempty");
    try {
      await writePostgresFdwEmptyProject(emptyRoot);
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

    const futureRoot = await projectFixture("fdwfuture");
    try {
      await writePostgresFdwFutureProject(futureRoot);
      await assert.rejects(readFile(join(futureRoot, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      const futureFirst = await loadProject(futureRoot);
      assert.deepEqual(futureFirst.config.database.extensions?.postgres_fdw, {
        version: "future",
        schema: "extensions",
      });
      const futureGenerated = await generateProject(futureRoot);
      const futureSource = await readFile(join(futureRoot, "kello/_generated/extensions.ts"), "utf8");
      assert(!futureSource.includes("createPostgresFdw_1_2"));
      assert(futureSource.includes('"status":"unverified"'));
      const futureDisk = await import(pathToFileURL(join(futureRoot, "kello/_generated/extensions.ts")).href);
      assert.equal(futureDisk.extensions.postgres_fdw.apiSupport.status, "unverified");
      assert.equal("connections" in futureDisk.extensions.postgres_fdw, false);
      assert.equal((await generateProject(futureRoot)).version, futureGenerated.version);
    } finally {
      await rm(futureRoot, { recursive: true, force: true });
    }

    for (const schema of [undefined, "fdw_cache"]) {
      const root = await projectFixture("fdwselected");
      try {
        const placement = await writePostgresFdwSelectedProject(root, schema);
        const component = join(root, "kello/components/remote");
        await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        await assert.rejects(readFile(join(component, "_generated/extensions.ts")), { code: "ENOENT" });
        const first = await loadProject(root);
        assert.deepEqual(first.config.database.extensions?.postgres_fdw, { version: "1.2", schema: placement });
        assert.equal(first.componentScopes.length, 1);
        assert.deepEqual(Object.keys(first.componentScopes[0]!.boundExtensions ?? {}), ["postgres_fdw"]);
        const generated = await generateProject(root);
        await checkPostgresFdwDiskBindings(root, placement);
        const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
        assert.deepEqual(Object.keys(child.extensions), ["postgres_fdw"]);
        assert.equal(child.extensions.postgres_fdw.schema, placement);
        await checkFixtureTypes(root);
        assert.equal((await generateProject(root)).version, generated.version);
        const { runtimeOptions } = await import(
          pathToFileURL(join(root, ".loom/generations", generated.version, "runtime.js")).href
        );
        const options = runtimeOptions();
        const mounted = options.scopes.find((scope: { name: string }) => scope.name === "remote");
        assert(mounted);
        assert.deepEqual(Object.keys(mounted.extensions), ["postgres_fdw"]);
        assert.equal(mounted.extensions.postgres_fdw.schema, placement);
        await withExtensionDatabase((url) => runPostgresFdwGeneratedRuntime(root, generated.version, placement, url));
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  },
  180000,
);
