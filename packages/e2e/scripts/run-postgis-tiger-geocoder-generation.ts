import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const nodeModules = process.env.LOOM_POSTGIS_TIGER_GEOCODER_PUBLIC_MODULES;
assert(nodeModules, "Await parent public-build signal; supply LOOM_POSTGIS_TIGER_GEOCODER_PUBLIC_MODULES");
const tsc = fileURLToPath(new URL("../../../node_modules/.bin/tsc", import.meta.url));
const root = await mkdtemp(join(tmpdir(), "loom-tiger-public-generation-"));
const fixtures = fileURLToPath(new URL("../fixtures", import.meta.url));
try {
  await symlink(nodeModules, join(root, "node_modules"));
  for (const name of ["generated-project", "public-generation", "generated-rpc", "owned-pg"])
    await writeFile(
      join(root, `postgis-tiger-geocoder-${name}.ts`),
      await readFile(join(fixtures, `postgis-tiger-geocoder-${name}.ts`)),
    );
  await writeFile(join(root, "package.json"), '{"type":"module","private":true}\n');
  const {
    generatePostgisTigerGeocoderProjects,
  }: Pick<
    typeof import("../fixtures/postgis-tiger-geocoder-public-generation"),
    "generatePostgisTigerGeocoderProjects"
  > = await import(pathToFileURL(join(root, "postgis-tiger-geocoder-public-generation.ts")).href);
  const projects = await generatePostgisTigerGeocoderProjects(join(root, "projects"), nodeModules, [tsc]);
  const { startPostgisTigerGeocoderOwnedPg } = await import(
    pathToFileURL(join(root, "postgis-tiger-geocoder-owned-pg.ts")).href
  );
  const { runPostgisTigerGeocoderGeneratedRpc } = await import(
    pathToFileURL(join(root, "postgis-tiger-geocoder-generated-rpc.ts")).href
  );
  const fixture = await startPostgisTigerGeocoderOwnedPg();
  try {
    for (const project of projects) {
      if (project.postgisSchema !== "public") continue;
      const url = await fixture.provision(project.postgisSchema);
      await runPostgisTigerGeocoderGeneratedRpc(
        project.root,
        project.version,
        url,
        project.postgisSchema,
        fixture.journal,
      );
    }
  } finally {
    await fixture.stop();
    await fixture.proveAbsent();
  }
  await writeFile(
    join(tmpdir(), "loom-postgis-tiger-geocoder-generation-receipt.json"),
    JSON.stringify(
      {
        gate: "generation",
        publicTooling: true,
        firstLoad: true,
        disk: true,
        consumerTypes: true,
        emptyFutureSelectedDefaultCustom: true,
        hostMountedRpcEffect: true,
        orphanRejected: true,
        fixtureJournal: fixture.journalFile,
        projects: projects.map((project) => ({
          selection: project.selection,
          version: project.version,
          postgisSchema: project.postgisSchema ?? null,
        })),
        sourceImportIsNotThisGate: true,
        packedConsumerGate: "pending-parent-frozen-artifact",
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(`tiger public generation and native host/mounted RPC/Effect passed; journal=${fixture.journalFile}`);
} finally {
  await rm(root, { recursive: true, force: true });
}
