import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { extensionProofSourcesDigest } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { pgHashidsGateProofSources } from "../fixtures/pg-hashids-semantic-proof";

const root = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));
const directory = realpathSync(mkdtempSync(join(tmpdir(), "loom-pg-hashids-packed-")));
const tarball = join(directory, "kello.tgz");
const sources = [...new Set([...pgHashidsGateProofSources.consumer, "apps/loom/package.json"])].sort();
function hashSources() {
  return sources.map((file) => ({
    file,
    sha256: createHash("sha256")
      .update(readFileSync(join(root, file)))
      .digest("hex"),
  }));
}
const sourcesBefore = hashSources();
const pack = spawnSync(
  "bun",
  ["pm", "pack", "--filename", tarball, "--ignore-scripts"],
  { cwd: join(root, "apps/loom"), encoding: "utf8", maxBuffer: 64 * 1024 * 1024 },
);
writeFileSync(join(directory, "pack.log"), pack.stdout + pack.stderr, { mode: 0o600 });
assert.equal(pack.status, 0, `bun pm pack failed; diagnostic retained in ${directory}`);
const packedBytes = readFileSync(tarball);
const packedSha256 = createHash("sha256").update(packedBytes).digest("hex");
const listed = spawnSync("tar", ["-tzf", tarball], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
assert.equal(listed.status, 0, listed.stderr);
writeFileSync(join(directory, "tarball-listing.txt"), listed.stdout, { mode: 0o600 });
assert.match(listed.stdout, /^package\/package\.json$/m);
assert.doesNotMatch(listed.stdout, /pg-hashids/);
const extracted = spawnSync("tar", ["-xOf", tarball, "package/package.json"], { encoding: "utf8" });
assert.equal(extracted.status, 0, extracted.stderr);
const manifest = JSON.parse(extracted.stdout) as { exports?: Record<string, unknown> };
assert.equal(manifest.exports?.["./extensions/pg-hashids"], undefined);
const sourcesAfter = hashSources();
assert.equal(
  extensionProofSourcesDigest(sourcesBefore),
  extensionProofSourcesDigest(sourcesAfter),
  "Proof sources changed during isolated pack",
);
writeFileSync(
  join(directory, "host-receipt.json"),
  JSON.stringify(
    {
      gate: "consumer",
      packedSha256,
      exportPresent: false,
      sourcesBefore,
      sourcesAfter,
      hostDriver: relative(root, fileURLToPath(import.meta.url)).split(sep).join("/"),
    },
    null,
    2,
  ) + "\n",
  { mode: 0o600 },
);
console.log(
  `Isolated pg_hashids tarball authored at ${directory} sha256=${packedSha256}; kello/extensions/pg-hashids is absent. This is not a packed-consumer gate pass.`,
);
