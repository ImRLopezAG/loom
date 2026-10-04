import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdir, readFile, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256, sha256 } from "../fixtures/proof-artifact";

const {
  H3_POSTGIS_FROZEN_ROOT: consumer,
  LOOM_EXTENSION_PROOF_ARTIFACT: artifactPath,
  H3_POSTGIS_LOCK_SHA256: expectedLock,
  H3_POSTGIS_ARTIFACT_SHA256: expectedArtifact,
} = process.env;
assert(
  consumer && artifactPath && expectedLock && expectedArtifact,
  "Exact parent-prepared artifact and frozen consumer are required",
);
const artifact = await readFile(artifactPath);
assert.equal(sha256(artifact), expectedArtifact);
assert.equal(await consumerLockfileSha256(consumer), expectedLock);
const installedFiles = await assertInstalledPackageMatchesTarball(consumer, artifact);
const root = join(consumer, `h3-postgis-${randomUUID()}`);
await mkdir(root);
await symlink(join(consumer, "node_modules"), join(root, "node_modules"));
const fixtures = fileURLToPath(new URL("../fixtures", import.meta.url));
for (const name of [
  "h3-postgis-generated-project.ts",
  "h3-postgis-owned-pg.ts",
  "h3-postgis-public-preparation.ts",
  "h3-postgis-cold-runtime.ts",
  "h3-postgis-packed-members.ts",
  "h3-postgis-native-members.ts",
])
  await writeFile(join(root, name), await readFile(join(fixtures, name)));
await writeFile(
  join(root, "h3-postgis-members.json"),
  await readFile(
    fileURLToPath(new URL("../../../apps/loom/src/tooling/extensions/manifests/h3_postgis.json", import.meta.url)),
  ),
);
await writeFile(join(root, "package.json"), '{"private":true,"type":"module"}\n');
const node = process.env.H3_POSTGIS_NODE24 ?? "node";
const version = Bun.spawnSync([node, "-p", "process.versions.node"], { stdout: "pipe", stderr: "pipe" });
assert.equal(version.exitCode, 0, version.stderr.toString());
assert.equal(version.stdout.toString().trim().split(".")[0], "24");
const child = Bun.spawn(["bun", "h3-postgis-public-preparation.ts"], {
  cwd: root,
  env: { ...process.env, H3_POSTGIS_NODE24: node },
  stdout: "pipe",
  stderr: "pipe",
});
const output = (await Promise.all([new Response(child.stdout).text(), new Response(child.stderr).text()])).join("");
await writeFile(join(root, "public-generation.log"), output);
assert.equal(await child.exited, 0, `Retained ${root}\n${output}`);
assert.equal(await consumerLockfileSha256(consumer), expectedLock);
assert.equal(sha256(await readFile(artifactPath)), expectedArtifact);
assert.equal(await assertInstalledPackageMatchesTarball(consumer, artifact), installedFiles);
await writeFile(
  join(root, "packed-result.json"),
  JSON.stringify(
    {
      root,
      artifactPath,
      artifactSha256: expectedArtifact,
      lockSha256: expectedLock,
      installedFiles,
      noInstall: true,
      noBuild: true,
      noPack: true,
      tooling: "Bun",
      runtime: version.stdout.toString().trim(),
      fiveConfigurations: true,
      nativeRpcEffect: true,
      packageBytesUnchanged: true,
      standalone_shipping_skipped: true,
      fullFamilyAcceptance: false,
    },
    null,
    2,
  ),
);
console.log(`h3_postgis prepared frozen PASS; retained ${root}`);
