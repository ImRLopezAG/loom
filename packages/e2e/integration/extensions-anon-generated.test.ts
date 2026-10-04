import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { test } from "bun:test";
import { runAnonGeneratedRpc, prepareAnonGeneratedRpc } from "../fixtures/anon-generated-rpc";
import {
  checkAnonDiskBindings,
  writeAnonEmptyProject,
  writeAnonFutureProject,
  writeAnonSelectedProject,
} from "../fixtures/anon-generated-project";

async function projectFixture(name: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), `loom-anon-${name}-`));
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

test("public anon virtual first-load, disk bindings, host/mounted selected/empty/future, generated RPC/Effect", async () => {
  const local = process.env.ANON_LOCAL_URL;
  const fixture = local && /@127\.0\.0\.1:\d+\//.test(local) ? local : undefined;
  for (const explicit of [false, true]) {
    const emptyRoot = await projectFixture("anonempty");
    try {
      await writeAnonEmptyProject(emptyRoot, explicit);
      await assert.rejects(readFile(join(emptyRoot, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      const emptyFirst = await loadProject(emptyRoot);
      assert.equal(Object.keys(emptyFirst.config.database.extensions ?? {}).length, 0);
      const emptyGenerated = await generateProject(emptyRoot);
      const emptyDisk = await import(pathToFileURL(join(emptyRoot, "kello/_generated/extensions.ts")).href);
      assert.equal(emptyDisk.extensions, undefined);
      assert.equal(emptyDisk.selection, undefined);
      const mounted = await import(
        pathToFileURL(join(emptyRoot, "kello/components/remote/_generated/extensions.ts")).href
      );
      assert.equal(mounted.extensions, undefined);
      await checkFixtureTypes(emptyRoot);
      if (fixture)
        await runAnonGeneratedRpc(
          emptyRoot,
          emptyGenerated.version,
          fixture,
          "extensions",
          await prepareAnonGeneratedRpc(fixture),
          { mode: "empty", child: "empty" },
        );
      assert.equal((await generateProject(emptyRoot)).version, emptyGenerated.version);
    } finally {
      await rm(emptyRoot, { recursive: true, force: true });
    }
  }

  const futureRoot = await projectFixture("anonfuture");
  try {
    await writeAnonFutureProject(futureRoot);
    await assert.rejects(readFile(join(futureRoot, "kello/_generated/extensions.ts")), { code: "ENOENT" });
    const futureFirst = await loadProject(futureRoot);
    assert.deepEqual(futureFirst.config.database.extensions?.anon, { version: "future", schema: "extensions" });
    const futureGenerated = await generateProject(futureRoot);
    const futureSource = await readFile(join(futureRoot, "kello/_generated/extensions.ts"), "utf8");
    assert(!futureSource.includes("createAnon_2_5_1"));
    assert(futureSource.includes('"status":"unverified"'));
    const futureDisk = await import(pathToFileURL(join(futureRoot, "kello/_generated/extensions.ts")).href);
    assert.equal(futureDisk.extensions.anon.apiSupport.status, "unverified");
    assert.equal("sql" in futureDisk.extensions.anon, false);
    const futureChild = await import(
      pathToFileURL(join(futureRoot, "kello/components/remote/_generated/extensions.ts")).href
    );
    assert.equal(futureChild.extensions.anon.apiSupport.status, "unverified");
    assert.equal("sql" in futureChild.extensions.anon, false);
    await checkFixtureTypes(futureRoot);
    if (fixture)
      await runAnonGeneratedRpc(
        futureRoot,
        futureGenerated.version,
        fixture,
        "extensions",
        await prepareAnonGeneratedRpc(fixture),
        { mode: "future", child: "future" },
      );
    assert.equal((await generateProject(futureRoot)).version, futureGenerated.version);
  } finally {
    await rm(futureRoot, { recursive: true, force: true });
  }

  for (const schema of [undefined, "anon_cache"]) {
    const root = await projectFixture("anonselected");
    try {
      const placement = await writeAnonSelectedProject(root, schema);
      const component = join(root, "kello/components/remote");
      await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      await assert.rejects(readFile(join(component, "_generated/extensions.ts")), { code: "ENOENT" });
      const first = await loadProject(root);
      assert.deepEqual(first.config.database.extensions?.anon, { version: "2.5.1", schema: placement });
      assert.equal(first.componentScopes.length, 1);
      assert.deepEqual(Object.keys(first.componentScopes[0]!.boundExtensions ?? {}), ["anon"]);
      const generated = await generateProject(root);
      await checkAnonDiskBindings(root, placement);
      const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
      assert.deepEqual(Object.keys(child.extensions), ["anon"]);
      assert.equal(child.extensions.anon.schema, placement);
      await checkFixtureTypes(root);
      assert.equal((await generateProject(root)).version, generated.version);
      const { runtimeOptions } = await import(
        pathToFileURL(join(root, ".loom/generations", generated.version, "runtime.js")).href
      );
      const options = runtimeOptions();
      const mounted = options.scopes.find((scope: { name: string }) => scope.name === "remote");
      assert(mounted);
      assert.deepEqual(Object.keys(mounted.extensions), ["anon"]);
      assert.equal(mounted.extensions.anon.schema, placement);
      const native = schema === undefined ? fixture : process.env.ANON_CUSTOM_LOCAL_URL;
      if (native && /@127\.0\.0\.1:\d+\//.test(native)) {
        const prepared = await prepareAnonGeneratedRpc(native);
        await runAnonGeneratedRpc(root, generated.version, native, placement, prepared);
      }
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }
  if (!fixture) console.warn("SKIPPED anon generated native RPC: ANON_LOCAL_URL is not a 127.0.0.1 fixture");
  if (!process.env.ANON_CUSTOM_LOCAL_URL)
    console.warn("SKIPPED anon custom-placement native RPC: ANON_CUSTOM_LOCAL_URL is missing");
}, 180000);
