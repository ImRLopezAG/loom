import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256, sha256 } from "../fixtures/proof-artifact";

const consumer = process.env.ADDRESS_STANDARDIZER_FROZEN_CONSUMER_ROOT;
const artifactPath = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
const expectedLock = process.env.ADDRESS_STANDARDIZER_CONSUMER_LOCK_SHA256;
const expectedArtifact = process.env.ADDRESS_STANDARDIZER_ARTIFACT_SHA256;
assert(
  consumer && artifactPath && expectedLock && expectedArtifact,
  "Parent-prepared consumer root, artifact, lock and artifact hashes are required",
);
const fixtures = fileURLToPath(new URL("../fixtures", import.meta.url));
const node = process.env.ADDRESS_STANDARDIZER_NODE24 ?? "node";

const version = Bun.spawnSync([node, "-e", "process.stdout.write(process.versions.node)"], { stdout: "pipe" });
assert.equal(version.exitCode, 0, version.stderr.toString());
assert.equal(
  version.stdout.toString().split(".")[0],
  "24",
  `Isolated packed fixture requires Node 24, not ${version.stdout.toString()}`,
);

const artifact = await readFile(artifactPath);
assert.equal(sha256(artifact), expectedArtifact, "Frozen artifact digest changed");
const lockBefore = await consumerLockfileSha256(consumer);
assert.equal(lockBefore, expectedLock, "Frozen lock digest changed");
assert((await assertInstalledPackageMatchesTarball(consumer, artifact)) > 1);

const root = await mkdtemp(join(tmpdir(), "loom-address-standardizer-packed-"));
try {
  await symlink(join(consumer, "node_modules"), join(root, "node_modules"));
  for (const name of [
    "address-standardizer-generated-project.ts",
    "address-standardizer-generated-rpc.ts",
    "address-standardizer-owned-pg.ts",
    "shared-owned-pg.ts",
  ])
    await writeFile(join(root, name), await readFile(join(fixtures, name)));
  await writeFile(join(root, "package.json"), '{"private":true,"type":"module"}\n');
  await writeFile(
    join(root, "cold.ts"),
    `
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { initializeProject, loadProject, generateProject } from "kello/tooling";
import {
  ADDRESS_STANDARDIZER_CUSTOM_SCHEMA,
  checkAddressStandardizerDiskBindings,
  writeAddressStandardizerEmptyProject,
  writeAddressStandardizerFutureProject,
  writeAddressStandardizerSelectedProject,
} from "./address-standardizer-generated-project.ts";
const generated = {};
for (const selection of ["empty", "future", "selected", "custom"]) {
  const project = join(process.cwd(), selection);
  await initializeProject(project, "addrstd" + selection);
  await (await import("node:fs/promises")).symlink(join(process.cwd(), "node_modules"), join(project, "node_modules"));
  if (selection === "empty") await writeAddressStandardizerEmptyProject(project);
  if (selection === "future") await writeAddressStandardizerFutureProject(project);
  if (selection === "selected") await writeAddressStandardizerSelectedProject(project);
  if (selection === "custom") await writeAddressStandardizerSelectedProject(project, ADDRESS_STANDARDIZER_CUSTOM_SCHEMA);
  await assert.rejects(readFile(join(project, "kello/_generated/extensions.ts")), { code: "ENOENT" });
  await loadProject(project);
  const result = await generateProject(project);
  const disk = await import(pathToFileURL(join(project, "kello/_generated/extensions.ts")).href);
  if (selection === "empty") assert.equal(disk.extensions, undefined);
  if (selection === "future") {
    assert.equal(disk.extensions.address_standardizer.apiSupport.status, "unverified");
    assert.equal("standardizeAddress" in disk.extensions.address_standardizer, false);
  }
  if (selection === "selected") await checkAddressStandardizerDiskBindings(project, "extensions");
  if (selection === "custom") await checkAddressStandardizerDiskBindings(project, ADDRESS_STANDARDIZER_CUSTOM_SCHEMA);
  const checked = spawnSync(process.execPath, ["node_modules/typescript/bin/tsc", "-p", join(project, "tsconfig.json")], { encoding: "utf8" });
  assert.equal(checked.status, 0, checked.stdout + checked.stderr);
  assert.equal((await generateProject(project)).version, result.version);
  generated[selection] = { project, version: result.version };
}
await writeFile("runtime-state.json", JSON.stringify(generated));
console.log("prepared frozen address_standardizer empty/future/selected/custom generateProject through installed kello PASS");
`,
  );
  await writeFile(
    join(root, "native.ts"),
    `
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { ADDRESS_STANDARDIZER_CUSTOM_SCHEMA } from "./address-standardizer-generated-project.ts";
import { runAddressStandardizerGeneratedRpc } from "./address-standardizer-generated-rpc.ts";
import { startAddressStandardizerOwnedPg } from "./address-standardizer-owned-pg.ts";
assert.equal(process.versions.node.split(".")[0], "24");
const state = JSON.parse(await readFile("runtime-state.json", "utf8"));
for (const selection of ["empty", "future", "selected", "custom"]) {
  const disk = await import(pathToFileURL(state[selection].project + "/kello/_generated/extensions.ts").href);
  if (selection === "empty") assert.equal(disk.extensions, undefined);
  if (selection === "future") {
    assert.equal(disk.extensions.address_standardizer.apiSupport.status, "unverified");
    assert.equal("standardizeAddress" in disk.extensions.address_standardizer, false);
  }
  if (selection === "selected") assert.equal(disk.extensions.address_standardizer.version, "3.6.4");
  if (selection === "custom") assert.equal(disk.extensions.address_standardizer.schema, ADDRESS_STANDARDIZER_CUSTOM_SCHEMA);
}
const fixture = await startAddressStandardizerOwnedPg();
try {
  const selectedUrl = await fixture.provision("extensions");
  await runAddressStandardizerGeneratedRpc(state.selected.project, state.selected.version, selectedUrl, "extensions");
  const customUrl = await fixture.provision(ADDRESS_STANDARDIZER_CUSTOM_SCHEMA);
  await runAddressStandardizerGeneratedRpc(state.custom.project, state.custom.version, customUrl, ADDRESS_STANDARDIZER_CUSTOM_SCHEMA);
} catch (cause) {
  fixture.fail(cause);
  // close() rethrows this cause, or aggregates it first with cleanup failures.
  throw cause;
} finally {
  await fixture.close();
}
console.log("cold Node24 generated native host/component RPC/Effect PASS");
`,
  );
  const run = async (binary: string, file: string) => {
    const child = Bun.spawn([binary, file], {
      cwd: root,
      env: process.env,
      stdout: "pipe",
      stderr: "pipe",
      timeout: 240000,
    });
    const output = (await new Response(child.stdout).text()) + (await new Response(child.stderr).text());
    assert.equal(await child.exited, 0, output);
    return output;
  };
  await run("bun", "cold.ts");
  await run(node, "native.ts");
  assert.equal(await consumerLockfileSha256(consumer), lockBefore);
  assert.equal(sha256(await readFile(artifactPath)), expectedArtifact);
  assert((await assertInstalledPackageMatchesTarball(consumer, await readFile(artifactPath))) > 1);
  await writeFile(
    join(tmpdir(), "loom-address-standardizer-packed-receipt.json"),
    JSON.stringify(
      {
        gate: "consumer",
        nodeMajor: 24,
        packedSha256: expectedArtifact,
        lockSha256: expectedLock,
        installed: true,
        noInstall: true,
        noPack: true,
        generateProjectThroughInstalledKello: true,
        compiledRpcEffect: true,
        artifactUnchanged: true,
        lockUnchanged: true,
        installedBytesUnchanged: true,
        hostDriver: "packages/e2e/scripts/run-address-standardizer-packed-node24.ts",
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(
    `address_standardizer no-install Node 24 prepared frozen packed generateProject + RPC/Effect passed; artifact/lock/installed bytes unchanged sha256=${expectedArtifact}`,
  );
} finally {
  await rm(root, { recursive: true, force: true });
}
