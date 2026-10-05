import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  copyFileSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runPgHashidsConsumerProject } from "../fixtures/pg-hashids-consumer-project";

const root = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));
const gate = process.argv[2];
assert(
  gate === "generation" || gate === "consumer",
  "Usage: bun run-pg-hashids-composition-proof.ts generation <parent-built-package-root> | consumer <parent-frozen-tarball>",
);
const artifact = process.argv[3];
assert(
  artifact,
  "Parent must supply a fresh built package or frozen tarball; this driver never builds, packs or installs",
);
const artifactPath = realpathSync(artifact);
const directory = mkdtempSync(join(tmpdir(), `loom-pg-hashids-real-${gate}-`));
console.log(`pg_hashids ${gate} evidence directory: ${directory}`);
const sha256 = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
// Record the actual compiled package, including declarations; never claim a source import is distribution evidence.
const inputs: string[] = [
  "apps/loom/package.json",
  "bun.lock",
  "apps/loom/src/core/extensions/adapters/pg-hashids.ts",
  "packages/e2e/fixtures/pg-hashids-consumer-project.ts",
  "packages/e2e/scripts/run-pg-hashids-composition-proof.ts",
];
const artifactFiles: string[] = [];
function addFiles(directory: string) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) addFiles(file);
    else if (entry.isFile()) artifactFiles.push(file);
  }
}
if (gate === "generation") {
  artifactFiles.push(join(artifactPath, "package.json"));
  addFiles(join(artifactPath, "dist"));
  addFiles(join(artifactPath, "bin"));
} else artifactFiles.push(artifactPath);
function sources() {
  return [
    ...inputs.map((file) => ({ file, sha256: sha256(readFileSync(join(root, file))) })),
    ...artifactFiles.map((file) => ({ file, sha256: sha256(readFileSync(file)) })),
  ];
}
const before = sources();
writeFileSync(join(directory, "sources-before.json"), JSON.stringify(before, null, 2));
let consumerPackage = artifactPath;
let tarballSha256: string | null = null;
if (gate === "consumer") {
  const tarball = join(directory, "kello.tgz");
  copyFileSync(artifactPath, tarball);
  tarballSha256 = sha256(readFileSync(tarball));
  const extracted = spawnSync("tar", ["-xzf", tarball, "-C", directory], { encoding: "utf8" });
  assert.equal(extracted.status, 0, extracted.stderr);
  consumerPackage = join(directory, "package");
  const manifest = JSON.parse(readFileSync(join(consumerPackage, "package.json"), "utf8"));
  assert.equal(manifest.name, "kello");
  // A prepared dependency tree is explicit evidence, not a deterministic clean install receipt.
  mkdirSync(join(consumerPackage, "node_modules"));
  for (const name of Object.keys({ ...manifest.dependencies, ...manifest.peerDependencies })) {
    let dependency: string;
    try {
      dependency = realpathSync(join(root, "apps/loom/node_modules", name));
    } catch (cause) {
      if (manifest.peerDependenciesMeta?.[name]?.optional) continue;
      throw cause;
    }
    const destination = join(consumerPackage, "node_modules", name);
    mkdirSync(join(destination, ".."), { recursive: true });
    symlinkSync(dependency, destination, "dir");
  }
}
try {
  const observation = runPgHashidsConsumerProject(root, directory, consumerPackage);
  const after = sources();
  assert.deepEqual(
    after,
    before,
    "The shared compiled package changed during this run; parent must rerun against stable dist",
  );
  writeFileSync(
    join(directory, "prepared-observation.json"),
    JSON.stringify(
      {
        gate,
        parentSuppliedArtifact: artifactPath,
        ...observation,
        tarballSha256,
        sourcesBefore: before,
        sourcesAfter: after,
        canonicalReceipt: false,
        cleanInstallVerified: false,
        nativeAcceptanceVerified: false,
      },
      null,
      2,
    ),
  );
  console.log(
    `Observed real ${gate} with prepared dependencies; parent owns canonical receipts and fresh-build provenance. ${directory}`,
  );
} catch (cause) {
  writeFileSync(
    join(directory, "pending.json"),
    JSON.stringify(
      {
        gate,
        tarballSha256,
        canonicalReceipt: false,
        error: String(cause),
        sourcesAfter: sources(),
      },
      null,
      2,
    ),
  );
  throw cause;
}
