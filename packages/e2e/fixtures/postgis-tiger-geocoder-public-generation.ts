import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, realpath, rm, symlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  checkPostgisTigerGeocoderDiskBindings,
  writePostgisTigerGeocoderOrphanProject,
  writePostgisTigerGeocoderProject,
  writePostgisTigerGeocoderWrongSchemaProject,
  type PostgisTigerGeocoderSelection,
} from "./postgis-tiger-geocoder-generated-project.ts";
import { runPostgisTigerGeocoderGeneratedRpc } from "./postgis-tiger-geocoder-generated-rpc.ts";
import { startPostgisTigerGeocoderOwnedPg } from "./postgis-tiger-geocoder-owned-pg.ts";

const testsModules = fileURLToPath(new URL("../../tests/node_modules", import.meta.url));
const repoTsc = fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url));

async function publicTooling() {
  try {
    return await import("kello/tooling");
  } catch (cause) {
    throw new Error(
      "Await parent fresh build signal: public kello/tooling is not compiled. Source-import generation is not this gate.",
      { cause },
    );
  }
}

async function projectFixture(name: string, nodeModules: string): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), `loom-tiger-${name}-`));
  try {
    const { initializeProject } = await publicTooling();
    await initializeProject(root, `tiger-${name}`);
    await rm(join(root, "kello/functions/tasks.ts")).catch(() => {});
    await rm(join(root, "kello/contracts/tasks.ts")).catch(() => {});
    await rm(join(root, "node_modules"), { recursive: true, force: true });
    await mkdir(join(root, "node_modules"));
    for (const pkg of ["kello", "valibot", "drizzle-orm", "effect"])
      await symlink(await realpath(join(nodeModules, pkg)), join(root, "node_modules", pkg));
    return root;
  } catch (cause) {
    await rm(root, { recursive: true, force: true });
    throw cause;
  }
}

async function checkFixtureTypes(root: string, tsc: readonly string[]): Promise<void> {
  const child = Bun.spawn([...tsc, "-p", join(root, "tsconfig.json")], { cwd: root, stdout: "pipe", stderr: "pipe" });
  const output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
  assert.equal(await child.exited, 0, output);
}

export type PostgisTigerGeocoderGeneratedProject = {
  root: string;
  selection: PostgisTigerGeocoderSelection;
  version: string;
  postgisSchema?: string;
};

/** Public initializeProject/loadProject/generateProject. No source emitter or internal-member acceptance. */
export async function generatePostgisTigerGeocoderProjects(
  workspace: string,
  nodeModules: string,
  tsc: readonly string[],
): Promise<PostgisTigerGeocoderGeneratedProject[]> {
  const { loadProject, generateProject } = await publicTooling();
  await mkdir(workspace, { recursive: true });
  const results: PostgisTigerGeocoderGeneratedProject[] = [];
  for (const selection of ["empty", "future", "selected", "default", "custom"] as const) {
    const root = join(workspace, selection);
    const { initializeProject } = await publicTooling();
    await initializeProject(root, `tiger-${selection}`);
    await rm(join(root, "kello/functions/tasks.ts")).catch(() => {});
    await rm(join(root, "kello/contracts/tasks.ts")).catch(() => {});
    await rm(join(root, "node_modules"), { recursive: true, force: true });
    await symlink(nodeModules, join(root, "node_modules"));
    const postgisSchema = await writePostgisTigerGeocoderProject(root, selection);
    await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
    if (postgisSchema)
      await assert.rejects(readFile(join(root, "kello/components/tiger/_generated/extensions.ts")), { code: "ENOENT" });
    const first = await loadProject(root);
    if (selection === "empty") assert.equal(first.config.database.extensions, undefined);
    if (selection === "future") {
      assert.deepEqual(first.config.database.extensions?.postgis_tiger_geocoder, {
        version: "future",
        schema: "extensions",
      });
    }
    if (postgisSchema) {
      assert.deepEqual(Object.keys(first.config.database.extensions ?? {}).sort(), ["postgis", "postgis_tiger_geocoder"]);
      assert.deepEqual(first.config.database.extensions?.postgis_tiger_geocoder, {
        version: "3.6.4",
        schema: "tiger",
      });
      assert.deepEqual(first.config.database.extensions?.postgis, { version: "3.6.4", schema: postgisSchema });
      assert.equal(first.componentScopes.length, 1);
      assert.deepEqual(Object.keys(first.componentScopes[0]!.boundExtensions ?? {}).sort(), ["postgis", "postgis_tiger_geocoder"]);
    }
    const generated = await generateProject(root);
    await checkPostgisTigerGeocoderDiskBindings(root, selection);
    await checkFixtureTypes(root, tsc);
    assert.equal((await generateProject(root)).version, generated.version);
    results.push({ root, selection, version: generated.version, ...(postgisSchema ? { postgisSchema } : {}) });
  }
  await assertPostgisTigerGeocoderConfigRejections(workspace, nodeModules);
  return results;
}

async function assertPostgisTigerGeocoderConfigRejections(workspace: string, nodeModules: string): Promise<void> {
  const { loadProject, generateProject, initializeProject } = await publicTooling();
  const reject = async (name: string, write: (root: string) => Promise<void>, pattern: RegExp) => {
    const root = join(workspace, name);
    await initializeProject(root, `tiger-${name}`);
    await rm(join(root, "kello/functions/tasks.ts")).catch(() => {});
    await rm(join(root, "kello/contracts/tasks.ts")).catch(() => {});
    await rm(join(root, "node_modules"), { recursive: true, force: true });
    await symlink(nodeModules, join(root, "node_modules"));
    await write(root);
    await assert.rejects(async () => {
      await loadProject(root);
      await generateProject(root);
    }, pattern);
  };
  await reject("orphan", writePostgisTigerGeocoderOrphanProject, /requires an explicitly selected PostGIS 3\.6\.4 dependency/);
  await reject("wrong-schema", writePostgisTigerGeocoderWrongSchemaProject, /requires fixed installation schema tiger/);
}

/** Public first-load, disk, types, host/mounted selected/default/custom/empty/future, and native RPC/Effect. */
export async function runPostgisTigerGeocoderPublicGeneration(): Promise<{
  emptyVersion: string;
  futureVersion: string;
  selected: ReadonlyArray<{ selection: string; postgisSchema: string; version: string }>;
  orphanRejected: true;
  wrongSchemaRejected: true;
  fixtureJournal: string;
}> {
  const { loadProject, generateProject } = await publicTooling();
  const fixture = await startPostgisTigerGeocoderOwnedPg();
  const roots: string[] = [];
  try {
    const emptyRoot = await projectFixture("empty", testsModules);
    roots.push(emptyRoot);
    await writePostgisTigerGeocoderProject(emptyRoot, "empty");
    await assert.rejects(readFile(join(emptyRoot, "kello/_generated/extensions.ts")), { code: "ENOENT" });
    const emptyFirst = await loadProject(emptyRoot);
    assert.equal(emptyFirst.config.database.extensions, undefined);
    const emptyGenerated = await generateProject(emptyRoot);
    await checkPostgisTigerGeocoderDiskBindings(emptyRoot, "empty");
    assert.equal((await generateProject(emptyRoot)).version, emptyGenerated.version);

    const futureRoot = await projectFixture("future", testsModules);
    roots.push(futureRoot);
    await writePostgisTigerGeocoderProject(futureRoot, "future");
    const futureFirst = await loadProject(futureRoot);
    assert.deepEqual(futureFirst.config.database.extensions?.postgis_tiger_geocoder, {
      version: "future",
      schema: "extensions",
    });
    const futureGenerated = await generateProject(futureRoot);
    await checkPostgisTigerGeocoderDiskBindings(futureRoot, "future");
    const futureDisk = await import(pathToFileURL(join(futureRoot, "kello/_generated/extensions.ts")).href);
    assert.equal(futureDisk.extensions.postgis_tiger_geocoder.apiSupport.status, "unverified");
    assert.equal("normalizeAddress" in futureDisk.extensions.postgis_tiger_geocoder, false);
    assert.equal((await generateProject(futureRoot)).version, futureGenerated.version);

    const selected: Array<{ selection: string; postgisSchema: string; version: string }> = [];
    for (const selection of ["selected", "default", "custom"] as const) {
      const root = await projectFixture(selection, testsModules);
      roots.push(root);
      const postgisSchema = await writePostgisTigerGeocoderProject(root, selection);
      assert(postgisSchema);
      await assert.rejects(readFile(join(root, "kello/_generated/extensions.ts")), { code: "ENOENT" });
      const first = await loadProject(root);
      assert.deepEqual(first.config.database.extensions?.postgis_tiger_geocoder, { version: "3.6.4", schema: "tiger" });
      assert.equal(first.componentScopes.length, 1);
      assert.deepEqual(Object.keys(first.componentScopes[0]!.boundExtensions ?? {}).sort(), ["postgis", "postgis_tiger_geocoder"]);
      const generated = await generateProject(root);
      await checkPostgisTigerGeocoderDiskBindings(root, selection);
      await checkFixtureTypes(root, [repoTsc]);
      assert.equal((await generateProject(root)).version, generated.version);
      if (postgisSchema === "public") {
        const url = await fixture.provision(postgisSchema);
        await runPostgisTigerGeocoderGeneratedRpc(root, generated.version, url, postgisSchema, fixture.journal);
      } else {
        await fixture.journal("native-condition", {
          selection,
          postgisSchema,
          condition: "CREATE EXTENSION postgis_tiger_geocoder 3.6.4 requires public.geometry; generation/types still ran",
        });
      }
      selected.push({ selection, postgisSchema, version: generated.version });
    }

    const orphan = await projectFixture("orphan", testsModules);
    roots.push(orphan);
    await writePostgisTigerGeocoderOrphanProject(orphan);
    await assert.rejects(
      async () => {
        await loadProject(orphan);
        await generateProject(orphan);
      },
      /requires an explicitly selected PostGIS 3\.6\.4 dependency/,
    );

    const wrong = await projectFixture("wrong-schema", testsModules);
    roots.push(wrong);
    await writePostgisTigerGeocoderWrongSchemaProject(wrong);
    await assert.rejects(
      async () => {
        await loadProject(wrong);
        await generateProject(wrong);
      },
      /requires fixed installation schema tiger/,
    );

    return {
      emptyVersion: emptyGenerated.version,
      futureVersion: futureGenerated.version,
      selected,
      orphanRejected: true,
      wrongSchemaRejected: true,
      fixtureJournal: fixture.journalFile,
    };
  } finally {
    await fixture.stop();
    await fixture.proveAbsent();
    for (const root of roots) await rm(root, { recursive: true, force: true });
  }
}
