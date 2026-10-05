import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { withExtensionDatabase } from "./extension-database";
import {
  H3_CUSTOM_SCHEMA,
  checkH3DiskBindings,
  writeH3EmptyProject,
  writeH3FutureProject,
  writeH3SelectedProject,
} from "./h3-generated-project.ts";
import { provisionH3Placement, runH3GeneratedRpc } from "./h3-generated-rpc.ts";

const testsModules = fileURLToPath(new URL("../../tests/node_modules", import.meta.url));
const repoTsc = fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url));

async function projectFixture(name: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), `loom-h3-${name}-`));
  try {
    await initializeProject(root, name);
    await mkdir(join(root, "node_modules"));
    for (const pkg of ["kello", "valibot", "drizzle-orm", "effect"])
      await symlink(await realpath(join(testsModules, pkg)), join(root, "node_modules", pkg));
    return root;
  } catch (cause) {
    await rm(root, { recursive: true, force: true });
    throw cause;
  }
}

async function checkFixtureTypes(root: string): Promise<void> {
  const child = Bun.spawn([repoTsc, "-p", join(root, "tsconfig.json")], { stdout: "pipe", stderr: "pipe" });
  const output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
  assert.equal(await child.exited, 0, output);
}

/** Public kello/tooling first-load, disk, types, host/mounted selected/empty/future/custom, and native RPC/Effect. */
export async function runH3PublicGeneration(): Promise<{
  emptyVersion: string;
  futureVersion: string;
  selected: ReadonlyArray<{ placement: string; version: string }>;
}> {
  const emptyRoot = await projectFixture("empty");
  let emptyVersion: string;
  try {
    await writeH3EmptyProject(emptyRoot);
    await assert.rejects(readFile(join(emptyRoot, "kello/_generated/extensions.ts")), { code: "ENOENT" });
    const emptyFirst = await loadProject(emptyRoot);
    assert.equal(emptyFirst.config.database.extensions, undefined);
    const emptyGenerated = await generateProject(emptyRoot);
    const emptyDisk = await import(pathToFileURL(join(emptyRoot, "kello/_generated/extensions.ts")).href);
    assert.equal(emptyDisk.extensions, undefined);
    assert.equal((await generateProject(emptyRoot)).version, emptyGenerated.version);
    emptyVersion = emptyGenerated.version;
  } finally {
    await rm(emptyRoot, { recursive: true, force: true });
  }

  const futureRoot = await projectFixture("future");
  let futureVersion: string;
  try {
    await writeH3FutureProject(futureRoot);
    await assert.rejects(readFile(join(futureRoot, "kello/_generated/extensions.ts")), { code: "ENOENT" });
    const futureFirst = await loadProject(futureRoot);
    assert.deepEqual(futureFirst.config.database.extensions?.h3, { version: "future", schema: "extensions" });
    const futureGenerated = await generateProject(futureRoot);
    const futureSource = await readFile(join(futureRoot, "kello/_generated/extensions.ts"), "utf8");
    assert(!futureSource.includes("createH3_4_2_3"));
    assert(futureSource.includes('"status":"unverified"'));
    const futureDisk = await import(pathToFileURL(join(futureRoot, "kello/_generated/extensions.ts")).href);
    assert.equal(futureDisk.extensions.h3.apiSupport.status, "unverified");
    assert.equal("latLngToCell" in futureDisk.extensions.h3, false);
    assert.equal((await generateProject(futureRoot)).version, futureGenerated.version);
    futureVersion = futureGenerated.version;
  } finally {
    await rm(futureRoot, { recursive: true, force: true });
  }

  const selected: Array<{ placement: string; version: string }> = [];
  for (const schema of [undefined, H3_CUSTOM_SCHEMA]) {
    const root = await projectFixture("selected");
    try {
      const placement = await writeH3SelectedProject(root, schema);
      const component = join(root, "kello/components/geo");
      await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      await assert.rejects(readFile(join(component, "_generated/extensions.ts")), { code: "ENOENT" });
      const first = await loadProject(root);
      assert.deepEqual(first.config.database.extensions?.h3, { version: "4.2.3", schema: placement });
      assert.equal(first.componentScopes.length, 1);
      assert.deepEqual(Object.keys(first.componentScopes[0]!.boundExtensions ?? {}), ["h3"]);
      const generated = await generateProject(root);
      await checkH3DiskBindings(root, placement);
      const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
      assert.deepEqual(Object.keys(child.extensions), ["h3"]);
      assert.equal(child.extensions.h3.schema, placement);
      await checkFixtureTypes(root);
      assert.equal((await generateProject(root)).version, generated.version);
      const { runtimeOptions } = await import(
        pathToFileURL(join(root, ".loom/generations", generated.version, "runtime.js")).href
      );
      const options = runtimeOptions();
      const mounted = options.scopes.find((scope: { name: string }) => scope.name === "geo");
      assert(mounted);
      assert.deepEqual(Object.keys(mounted.extensions), ["h3"]);
      assert.equal(mounted.extensions.h3.schema, placement);
      await withExtensionDatabase(async (url) => {
        await provisionH3Placement(url, placement);
        await runH3GeneratedRpc(root, generated.version, url, placement);
      });
      selected.push({ placement, version: generated.version });
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  }

  return { emptyVersion, futureVersion, selected };
}
