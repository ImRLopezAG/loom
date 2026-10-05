import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { test } from "bun:test";
import { preparePgPartmanGeneratedRpc, runPgPartmanGeneratedRpc } from "../fixtures/pg_partman-generated-rpc";
import {
  checkPgPartmanDiskBindings,
  writePgPartmanEmptyProject,
  writePgPartmanFutureProject,
  writePgPartmanSelectedProject,
} from "../fixtures/pg_partman-generated-project";

async function projectFixture(name: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), `loom-pg_partman-${name}-`));
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

test("public pg_partman virtual first-load, disk bindings, all eight fields and generated RPC/Effect", async () => {
  const emptyRoot = await projectFixture("partmanempty");
  try {
    await writePgPartmanEmptyProject(emptyRoot);
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

  const futureRoot = await projectFixture("partmanfuture");
  try {
    await writePgPartmanFutureProject(futureRoot);
    await assert.rejects(readFile(join(futureRoot, "kello/_generated/extensions.ts")), { code: "ENOENT" });
    const futureFirst = await loadProject(futureRoot);
    assert.deepEqual(futureFirst.config.database.extensions?.pg_partman, { version: "future", schema: "extensions" });
    const futureGenerated = await generateProject(futureRoot);
    const futureSource = await readFile(join(futureRoot, "kello/_generated/extensions.ts"), "utf8");
    assert(!futureSource.includes("createPgPartman_5_1_0"));
    assert(futureSource.includes('"status":"unverified"'));
    const futureDisk = await import(pathToFileURL(join(futureRoot, "kello/_generated/extensions.ts")).href);
    assert.equal(futureDisk.extensions.pg_partman.apiSupport.status, "unverified");
    assert.equal("check_name_length" in futureDisk.extensions.pg_partman, false);
    assert.equal((await generateProject(futureRoot)).version, futureGenerated.version);
  } finally {
    await rm(futureRoot, { recursive: true, force: true });
  }

  for (const schema of [undefined, "partman_cache"]) {
    const root = await projectFixture("partmanselected");
    try {
      const placement = await writePgPartmanSelectedProject(root, schema);
      const component = join(root, "kello/components/remote");
      await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      await assert.rejects(readFile(join(component, "_generated/extensions.ts")), { code: "ENOENT" });
      const first = await loadProject(root);
      assert.deepEqual(first.config.database.extensions?.pg_partman, { version: "5.1.0", schema: placement });
      assert.equal(first.componentScopes.length, 1);
      assert.deepEqual(Object.keys(first.componentScopes[0]!.boundExtensions ?? {}), ["pg_partman"]);
      const generated = await generateProject(root);
      await checkPgPartmanDiskBindings(root, placement);
      const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
      assert.deepEqual(Object.keys(child.extensions), ["pg_partman"]);
      assert.equal(child.extensions.pg_partman.schema, placement);
      await checkFixtureTypes(root);
      assert.equal((await generateProject(root)).version, generated.version);
      const { runtimeOptions } = await import(
        pathToFileURL(join(root, ".loom/generations", generated.version, "runtime.js")).href
      );
      const options = runtimeOptions();
      const mounted = options.scopes.find((scope: { name: string }) => scope.name === "remote");
      assert(mounted);
      assert.deepEqual(Object.keys(mounted.extensions), ["pg_partman"]);
      assert.equal(mounted.extensions.pg_partman.schema, placement);
      if (schema === undefined) {
        assert(process.env.PG_PARTMAN_LOCAL_URL, "Generated RPC proof requires PG_PARTMAN_LOCAL_URL");
        await runPgPartmanGeneratedRpc(
          root,
          generated.version,
          process.env.PG_PARTMAN_LOCAL_URL,
          placement,
          await preparePgPartmanGeneratedRpc(process.env.PG_PARTMAN_LOCAL_URL),
        );
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
}, 180000);
