import assert from "node:assert/strict";
import { mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// Parent supplies the ready public build's node_modules. This driver never packs, installs or builds it.
const suppliedModules = process.env.DATA_US_PUBLIC_MODULES;
assert(suppliedModules, "Await parent public-build signal; supply DATA_US_PUBLIC_MODULES");
const nodeModules = await realpath(suppliedModules);
const tsc = fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url));
const root = await mkdtemp(join(tmpdir(), "loom-data-us-public-generation-"));
const fixtures = fileURLToPath(new URL("../fixtures", import.meta.url));
try {
  await symlink(nodeModules, join(root, "node_modules"));
  await writeFile(join(root, "shared-owned-pg.ts"), await readFile(join(fixtures, "shared-owned-pg.ts")));
  for (const name of ["generated-project", "public-generation", "generated-rpc", "owned-pg", "preparation"])
    await writeFile(
      join(root, `address-standardizer-data-us-${name}.ts`),
      await readFile(join(fixtures, `address-standardizer-data-us-${name}.ts`)),
    );
  await writeFile(join(root, "package.json"), '{"type":"module","private":true}\n');
  const { generateDataUsProjects } = await import(
    pathToFileURL(join(root, "address-standardizer-data-us-public-generation.ts")).href
  );
  const projects = await generateDataUsProjects(join(root, "projects"), nodeModules, [tsc]);
  const { startDataUsOwnedPg } = await import(
    pathToFileURL(join(root, "address-standardizer-data-us-owned-pg.ts")).href
  );
  const { runDataUsGeneratedRpc } = await import(
    pathToFileURL(join(root, "address-standardizer-data-us-generated-rpc.ts")).href
  );
  const { prepareDataUsRuntime } = await import(
    pathToFileURL(join(root, "address-standardizer-data-us-preparation.ts")).href
  );
  const fixture = await startDataUsOwnedPg();
  try {
    for (const project of projects)
      if (project.placement) {
        const url = await fixture.provision(project.placement);
        const prepared = await prepareDataUsRuntime(url, project.placement, fixture.journal);
        await runDataUsGeneratedRpc(project.root, project.version, prepared, project.placement, fixture.journal);
      }
  } catch (cause) {
    fixture.fail(cause);
    // close() rethrows this cause, or aggregates it first with cleanup failures.
    throw cause;
  } finally {
    await fixture.close();
  }
  await writeFile(
    join(tmpdir(), "loom-address-standardizer-data-us-generation-receipt.json"),
    JSON.stringify(
      {
        gate: "generation",
        publicTooling: true,
        firstLoad: true,
        disk: true,
        consumerTypes: true,
        omittedEmptyFutureSelectedCustom: true,
        hostMountedRpcEffect: true,
        administrativeRpcCredentials: false,
        allTypedSeedRows: 8383,
        fixtureJournal: fixture.journalFile,
        projects,
        sourceImportIsNotThisGate: true,
        packedConsumerGate: "pending-parent-frozen-artifact",
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(`data-US public generation and native host/mounted RPC/Effect passed; journal=${fixture.journalFile}`);
} finally {
  await rm(root, { recursive: true, force: true });
}
