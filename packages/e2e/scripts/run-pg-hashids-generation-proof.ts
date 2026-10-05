import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { mkdtempSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import { extensionProofSourcesDigest } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { pgHashidsIsolatedBindingsSource } from "../fixtures/pg-hashids-isolated-codegen";
import { pgHashidsGateProofSources } from "../fixtures/pg-hashids-semantic-proof";

const root = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));
const directory = realpathSync(mkdtempSync(join(tmpdir(), "loom-pg-hashids-generation-")));
const adapter = "apps/loom/src/core/extensions/adapters/pg-hashids.ts";
const sources = [...new Set([...pgHashidsGateProofSources.generation, adapter])].sort();
function hashSources() {
  return sources.map((file) => ({
    file,
    sha256: createHash("sha256")
      .update(readFileSync(join(root, file)))
      .digest("hex"),
  }));
}
const sourcesBefore = hashSources();
const shared = extensionBindingsSource({
  pg_hashids: { version: "1.2.1", schema: 'custom"hash' },
});
assert.match(shared, /"pg_hashids"/);
assert.match(shared, /1\.2\.1/);
assert.match(shared, /SQL contract captured; typed API adapter acceptance pending/);
assert.doesNotMatch(
  shared,
  /createPgHashids_1_2_1/,
  "Shared codegen must stay unwired until parent accepts the native safety report",
);
writeFileSync(join(directory, "shared-observed.ts"), shared);
const isolated = pgHashidsIsolatedBindingsSource(
  relative(directory, join(root, adapter)).split(sep).join("/"),
  'custom"hash',
);
writeFileSync(join(directory, "isolated.ts"), isolated);
assert.match(isolated, /createPgHashids_1_2_1/);
symlinkSync(join(root, "packages/tests/node_modules"), join(directory, "node_modules"), "dir");
const compiler = join(root, "packages/tests/node_modules/.bin/tsc");
const config = join(directory, "tsconfig.json");
writeFileSync(
  config,
  JSON.stringify(
    {
      extends: join(root, "packages/tests/tsconfig.json"),
      compilerOptions: {
        noEmit: true,
        incremental: false,
        typeRoots: [join(root, "packages/tests/node_modules/@types")],
      },
      include: [],
      files: [join(directory, "isolated.ts")],
    },
    null,
    2,
  ) + "\n",
);
const child = spawnSync(compiler, ["-p", config, "--pretty", "false", "--noEmit", "--listFiles"], {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
writeFileSync(join(directory, "compiler.log"), child.stdout + child.stderr, { mode: 0o600 });
assert.equal(child.status, 0, `Isolated family codegen failed; diagnostic retained in ${directory}`);
assert(
  child.stdout
    .split(/\r?\n/)
    .filter((line) => isAbsolute(line.trim()))
    .map((line) => realpathSync(line.trim()))
    .includes(realpathSync(join(directory, "isolated.ts"))),
);
const sourcesAfter = hashSources();
assert.equal(
  extensionProofSourcesDigest(sourcesBefore),
  extensionProofSourcesDigest(sourcesAfter),
  "Proof sources changed during isolated generation",
);
writeFileSync(
  join(directory, "host-receipt.json"),
  JSON.stringify(
    {
      gate: "generation",
      sharedCallable: false,
      isolatedCallable: true,
      sourcesBefore,
      sourcesAfter,
      hostDriver: relative(root, fileURLToPath(import.meta.url)).split(sep).join("/"),
      hostDriverDirectory: dirname(resolve(root, "packages/e2e/scripts/run-pg-hashids-generation-proof.ts")),
    },
    null,
    2,
  ) + "\n",
  { mode: 0o600 },
);
console.log(
  `Isolated pg_hashids family codegen typechecked at ${directory}; shared generation remains descriptor-only and is not a generation gate pass.`,
);
