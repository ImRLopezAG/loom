import assert from "node:assert/strict";
import { mkdtemp, readFile, realpath, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256, sha256 } from "../fixtures/proof-artifact";

// Four exact parent-owned inputs, no implicit stale artifact or consumer fallback.
const [consumer, artifactPath, expectedArtifact, expectedLock] = process.argv.slice(2);
assert(
  consumer && artifactPath && expectedArtifact && expectedLock,
  "Usage: bun run-address-standardizer-data-us-packed-node24.ts <frozen-consumer> <tarball> <tarball-sha256> <lock-sha256>",
);
const consumerRoot = await realpath(consumer);
const node = process.env.DATA_US_NODE24 ?? "node";
const version = Bun.spawnSync([node, "-p", "process.versions.node"], { stdout: "pipe", stderr: "pipe" });
assert.equal(version.exitCode, 0, version.stderr.toString());
assert.equal(version.stdout.toString().trim().split(".")[0], "24");
const artifact = await readFile(artifactPath);
assert.equal(sha256(artifact), expectedArtifact);
assert.equal(await consumerLockfileSha256(consumer), expectedLock);
const filesCompared = await assertInstalledPackageMatchesTarball(consumer, artifact);
const root = await mkdtemp(join(tmpdir(), "loom-data-us-frozen-consumer-"));
const fixtures = fileURLToPath(new URL("../fixtures", import.meta.url));
try {
  await symlink(join(consumerRoot, "node_modules"), join(root, "node_modules"));
  await writeFile(join(root, "shared-owned-pg.ts"), await readFile(join(fixtures, "shared-owned-pg.ts")));
  for (const name of ["generated-project", "public-generation", "generated-rpc", "owned-pg", "preparation"])
    await writeFile(
      join(root, `address-standardizer-data-us-${name}.ts`),
      await readFile(join(fixtures, `address-standardizer-data-us-${name}.ts`)),
    );
  await writeFile(join(root, "package.json"), '{"type":"module","private":true}\n');
  await writeFile(
    join(root, "cold.ts"),
    `import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generateDataUsProjects } from "./address-standardizer-data-us-public-generation.ts";
const projects = await generateDataUsProjects(join(process.cwd(), "projects"), join(process.cwd(), "node_modules"), [${JSON.stringify(node)}, "node_modules/typescript/bin/tsc"]);
await writeFile("state.json", JSON.stringify(projects));`,
  );
  await writeFile(
    join(root, "native.ts"),
    `import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { runDataUsGeneratedRpc } from "./address-standardizer-data-us-generated-rpc.ts";
assert.equal(process.versions.node.split(".")[0], "24");
const projects = JSON.parse(await readFile("state.json", "utf8"));
const { appendFile } = await import("node:fs/promises");
const journal = async (event, detail = {}) => appendFile("node-runtime-events.jsonl", JSON.stringify({ event, ...detail }) + "\\n");
for (const project of projects) {
    const disk = await import(pathToFileURL(project.root + "/kello/_generated/extensions.ts").href);
    if (project.selection === "omitted" || project.selection === "empty") assert.equal(disk.extensions, undefined);
    else if (project.selection === "future") {
      assert.equal(disk.extensions.address_standardizer_data_us.apiSupport.status, "unverified");
      assert.equal("tables" in disk.extensions.address_standardizer_data_us, false);
    } else {
      assert.equal(disk.extensions.address_standardizer_data_us.schema, project.placement);
      await runDataUsGeneratedRpc(project.root, project.version, project.prepared, project.placement, journal);
    }
}`,
  );
  const run = async (binary: string, file: string) => {
    const child = Bun.spawn([binary, file], { cwd: root, stdout: "pipe", stderr: "pipe", timeout: 240000 });
    const output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
    assert.equal(await child.exited, 0, output);
  };
  await run("bun", "cold.ts");
  const { startDataUsOwnedPg } = await import(
    pathToFileURL(join(root, "address-standardizer-data-us-owned-pg.ts")).href
  );
  const { prepareDataUsRuntime } = await import(
    pathToFileURL(join(root, "address-standardizer-data-us-preparation.ts")).href
  );
  const fixture = await startDataUsOwnedPg();
  try {
    const projects = JSON.parse(await readFile(join(root, "state.json"), "utf8"));
    for (const project of projects) {
      if (project.placement) {
        const url = await fixture.provision(project.placement);
        project.prepared = await prepareDataUsRuntime(url, project.placement, fixture.journal);
      }
    }
    await writeFile(join(root, "state.json"), JSON.stringify(projects));
    // Tooling and DDL finished under Bun. Node imports only disk bindings and compiled runtime.
    await run(node, "native.ts");
    await fixture.journal("cold-node24-proven", {
      events: await readFile(join(root, "node-runtime-events.jsonl"), "utf8"),
      administrativeRpcCredentials: false,
    });
  } catch (cause) {
    fixture.fail(cause);
    // close() rethrows this cause, or aggregates it first with cleanup failures.
    throw cause;
  } finally {
    await fixture.close();
  }
  assert.equal(await consumerLockfileSha256(consumer), expectedLock);
  assert.equal(sha256(await readFile(artifactPath)), expectedArtifact);
  assert.equal(await assertInstalledPackageMatchesTarball(consumer, artifact), filesCompared);
  await writeFile(
    join(tmpdir(), "loom-address-standardizer-data-us-packed-receipt.json"),
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
        bunOnlyGenerationAndPreparation: true,
        administrativeRpcCredentials: false,
        allTypedSeedRows: 8383,
        artifactLockInstalledBytesUnchanged: true,
        fixtureJournal: fixture.journalFile,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(`data-US frozen public generation + cold Node24 native RPC/Effect passed; artifact=${expectedArtifact}`);
} finally {
  await rm(root, { recursive: true, force: true });
}
