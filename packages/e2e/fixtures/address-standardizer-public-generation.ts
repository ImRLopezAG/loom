import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { generateProject, initializeProject, loadProject } from "kello/tooling";
import { runAddressStandardizerGeneratedRpc } from "./address-standardizer-generated-rpc.ts";
import {
  ADDRESS_STANDARDIZER_CUSTOM_SCHEMA,
  checkAddressStandardizerDiskBindings,
  writeAddressStandardizerEmptyProject,
  writeAddressStandardizerFutureProject,
  writeAddressStandardizerSelectedProject,
} from "./address-standardizer-generated-project.ts";
import { startAddressStandardizerOwnedPg } from "./address-standardizer-owned-pg.ts";

const testsModules = fileURLToPath(new URL("../../tests/node_modules", import.meta.url));
const repoTsc = fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url));

async function projectFixture(name: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), `loom-address-standardizer-${name}-`));
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
export async function runAddressStandardizerPublicGeneration(): Promise<{
  emptyVersion: string;
  futureVersion: string;
  selected: ReadonlyArray<{ placement: string; version: string }>;
  fixtureJournal: string;
}> {
  const emptyRoot = await projectFixture("empty");
  let emptyVersion: string;
  try {
    await writeAddressStandardizerEmptyProject(emptyRoot);
    await assert.rejects(readFile(join(emptyRoot, "kello/_generated/extensions.ts")), { code: "ENOENT" });
    const emptyFirst = await loadProject(emptyRoot);
    assert.equal(emptyFirst.config.database.extensions, undefined);
    const emptyGenerated = await generateProject(emptyRoot);
    const emptyDisk = await import(pathToFileURL(join(emptyRoot, "kello/_generated/extensions.ts")).href);
    assert.equal(emptyDisk.extensions, undefined);
    assert.equal(emptyDisk.selection, undefined);
    assert.equal((await generateProject(emptyRoot)).version, emptyGenerated.version);
    emptyVersion = emptyGenerated.version;
  } finally {
    await rm(emptyRoot, { recursive: true, force: true });
  }

  const futureRoot = await projectFixture("future");
  let futureVersion: string;
  try {
    await writeAddressStandardizerFutureProject(futureRoot);
    await assert.rejects(readFile(join(futureRoot, "kello/_generated/extensions.ts")), { code: "ENOENT" });
    const futureFirst = await loadProject(futureRoot);
    assert.deepEqual(futureFirst.config.database.extensions?.address_standardizer, {
      version: "future",
      schema: "extensions",
    });
    const futureGenerated = await generateProject(futureRoot);
    const futureSource = await readFile(join(futureRoot, "kello/_generated/extensions.ts"), "utf8");
    assert(!futureSource.includes("createAddressStandardizer_3_6_4"));
    assert(futureSource.includes('"status":"unverified"'));
    const futureDisk = await import(pathToFileURL(join(futureRoot, "kello/_generated/extensions.ts")).href);
    assert.equal(futureDisk.extensions.address_standardizer.apiSupport.status, "unverified");
    assert.equal("standardizeAddress" in futureDisk.extensions.address_standardizer, false);
    assert.equal((await generateProject(futureRoot)).version, futureGenerated.version);
    futureVersion = futureGenerated.version;
  } finally {
    await rm(futureRoot, { recursive: true, force: true });
  }

  const fixture = await startAddressStandardizerOwnedPg();
  const selected: Array<{ placement: string; version: string }> = [];
  try {
    for (const schema of [undefined, ADDRESS_STANDARDIZER_CUSTOM_SCHEMA]) {
      const root = await projectFixture("selected");
      try {
        const placement = await writeAddressStandardizerSelectedProject(root, schema);
        const component = join(root, "kello/components/standardizer");
        await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
        await assert.rejects(readFile(join(component, "_generated/extensions.ts")), { code: "ENOENT" });
        const first = await loadProject(root);
        assert.deepEqual(first.config.database.extensions?.address_standardizer, {
          version: "3.6.4",
          schema: placement,
        });
        assert.equal(first.componentScopes.length, 1);
        assert.deepEqual(Object.keys(first.componentScopes[0]!.boundExtensions ?? {}), ["address_standardizer"]);
        const generated = await generateProject(root);
        await checkAddressStandardizerDiskBindings(root, placement);
        const child = await import(pathToFileURL(join(component, "_generated/extensions.ts")).href);
        assert.deepEqual(Object.keys(child.extensions), ["address_standardizer"]);
        assert.equal(child.extensions.address_standardizer.schema, placement);
        await checkFixtureTypes(root);
        assert.equal((await generateProject(root)).version, generated.version);
        const { runtimeOptions } = await import(
          pathToFileURL(join(root, ".loom/generations", generated.version, "runtime.js")).href
        );
        const options = runtimeOptions();
        const mounted = options.scopes.find((scope: { name: string }) => scope.name === "standardizer");
        assert(mounted);
        assert.deepEqual(Object.keys(mounted.extensions), ["address_standardizer"]);
        assert.equal(mounted.extensions.address_standardizer.schema, placement);
        const url = await fixture.provision(placement);
        await runAddressStandardizerGeneratedRpc(root, generated.version, url, placement);
        selected.push({ placement, version: generated.version });
      } finally {
        await rm(root, { recursive: true, force: true });
      }
    }
  } finally {
    await fixture.stop();
    await fixture.proveAbsent();
  }

  return { emptyVersion, futureVersion, selected, fixtureJournal: fixture.journalFile };
}
