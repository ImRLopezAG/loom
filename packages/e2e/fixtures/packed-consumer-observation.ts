import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { assertInstalledPackageMatchesTarball, consumerLockfileSha256, sha256 } from "./proof-artifact";

// Call only after the consumer's actual frozen reinstall, type, bundle and native runtime checks pass.
export async function recordPackedConsumerObservation(root: string) {
  const output = process.env.LOOM_EXTENSION_PROOF_PACKED_OUTPUT;
  if (!output) return;
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  const retained = process.env.LOOM_EXTENSION_PROOF_ARTIFACT;
  assert(runId && retained, "Packed proof requires host-owned run and artifact paths");
  const bytes = await readFile(join(root, "kello.tgz"));
  assert.equal(sha256(await readFile(retained)), sha256(bytes));
  assert((await assertInstalledPackageMatchesTarball(root, bytes)) > 1);
  const lockfileSha256 = await consumerLockfileSha256(root);
  const node = spawnSync("node", ["--version"], { encoding: "utf8" });
  assert.equal(node.status, 0);
  assert.match(node.stdout.trim(), /^v24\.\d+\.\d+$/);
  await writeFile(join(output, "consumer-lock.json"), JSON.stringify({ lockfileSha256 }) + "\n", {
    flag: "wx",
    mode: 0o600,
  });
  await writeFile(
    join(output, "consumer.json"),
    JSON.stringify({
      runId,
      nodeVersion: node.stdout.trim(),
      installation: "isolated",
      frozenReinstallPassed: true,
      declarationsPassed: true,
      runtimePassed: true,
      selectedBundleChecksPassed: true,
      tarballSha256: sha256(bytes),
    }) + "\n",
    { flag: "wx", mode: 0o600 },
  );
}
