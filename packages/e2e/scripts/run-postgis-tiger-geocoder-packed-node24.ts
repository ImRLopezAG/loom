import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256, sha256 } from "../fixtures/proof-artifact";

const [consumer, artifactPath, expectedArtifact, expectedLock] = process.argv.slice(2);
assert(
  consumer && artifactPath && expectedArtifact && expectedLock,
  "Usage: bun run-postgis-tiger-geocoder-packed-node24.ts <frozen-consumer> <tarball> <tarball-sha256> <lock-sha256>",
);
const node = process.env.LOOM_POSTGIS_TIGER_GEOCODER_NODE24 ?? "node";
const version = Bun.spawnSync([node, "-p", "process.versions.node"], { stdout: "pipe", stderr: "pipe" });
assert.equal(version.exitCode, 0, version.stderr.toString());
assert.equal(version.stdout.toString().trim().split(".")[0], "24");
const artifact = await readFile(artifactPath);
assert.equal(sha256(artifact), expectedArtifact);
assert.equal(await consumerLockfileSha256(consumer), expectedLock);
const filesCompared = await assertInstalledPackageMatchesTarball(consumer, artifact);
const root = await mkdtemp(join(tmpdir(), "loom-tiger-frozen-consumer-"));
const fixtures = fileURLToPath(new URL("../fixtures", import.meta.url));
try {
  await symlink(join(consumer, "node_modules"), join(root, "node_modules"));
  for (const name of ["generated-project", "public-generation", "generated-rpc", "owned-pg"])
    await writeFile(
      join(root, `postgis-tiger-geocoder-${name}.ts`),
      await readFile(join(fixtures, `postgis-tiger-geocoder-${name}.ts`)),
    );
  await writeFile(join(root, "package.json"), '{"type":"module","private":true}\n');
  await writeFile(
    join(root, "cold.ts"),
    `import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generatePostgisTigerGeocoderProjects } from "./postgis-tiger-geocoder-public-generation.ts";
const projects = await generatePostgisTigerGeocoderProjects(join(process.cwd(), "projects"), join(process.cwd(), "node_modules"), [${JSON.stringify(node)}, "node_modules/typescript/bin/tsc"]);
await writeFile("state.json", JSON.stringify(projects));`,
  );
  await writeFile(
    join(root, "native.ts"),
    `import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { runPostgisTigerGeocoderGeneratedRpc } from "./postgis-tiger-geocoder-generated-rpc.ts";
import { startPostgisTigerGeocoderOwnedPg } from "./postgis-tiger-geocoder-owned-pg.ts";
assert.equal(process.versions.node.split(".")[0], "24");
const projects = JSON.parse(await readFile("state.json", "utf8"));
const fixture = await startPostgisTigerGeocoderOwnedPg();
try {
  for (const project of projects) {
    const disk = await import(pathToFileURL(project.root + "/kello/_generated/extensions.ts").href);
    if (project.selection === "empty") assert.equal(disk.extensions, undefined);
    else if (project.selection === "future") {
      assert.equal(disk.extensions.postgis_tiger_geocoder.apiSupport.status, "unverified");
      assert.equal("normalizeAddress" in disk.extensions.postgis_tiger_geocoder, false);
    } else {
      assert.equal(disk.extensions.postgis_tiger_geocoder.schema, "tiger");
      if (project.postgisSchema === "public") {
        const url = await fixture.provision(project.postgisSchema);
        await runPostgisTigerGeocoderGeneratedRpc(project.root, project.version, url, project.postgisSchema, fixture.journal);
      }
    }
  }
  await (await import("node:fs/promises")).writeFile("native-receipt.json", JSON.stringify({ journal: fixture.journalFile }));
} finally {
  await fixture.stop();
  await fixture.proveAbsent();
}`,
  );
  const run = async (binary: string, file: string) => {
    const child = Bun.spawn([binary, file], { cwd: root, stdout: "pipe", stderr: "pipe", timeout: 300000 });
    const output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
    assert.equal(await child.exited, 0, output);
  };
  await run("bun", "cold.ts");
  await run(node, "native.ts");
  assert.equal(await consumerLockfileSha256(consumer), expectedLock);
  assert.equal(sha256(await readFile(artifactPath)), expectedArtifact);
  assert.equal(await assertInstalledPackageMatchesTarball(consumer, artifact), filesCompared);
  const native = JSON.parse(await readFile(join(root, "native-receipt.json"), "utf8"));
  await writeFile(
    join(tmpdir(), "loom-postgis-tiger-geocoder-packed-receipt.json"),
    JSON.stringify(
      {
        gate: "consumer",
        nodeMajor: 24,
        packedSha256: expectedArtifact,
        lockSha256: expectedLock,
        filesCompared,
        noInstall: true,
        noPack: true,
        publicInitializeLoadGenerate: true,
        firstLoadAndDisk: true,
        generatedConsumerTypes: true,
        coldCompiledRpcEffect: true,
        artifactLockInstalledBytesUnchanged: true,
        fixtureJournal: native.journal,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(`tiger frozen public generation + cold Node24 native RPC/Effect passed; artifact=${expectedArtifact}`);
} finally {
  await rm(root, { recursive: true, force: true });
}
