import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const gate = process.argv[2];
assert(
  gate === "unit" || gate === "types" || gate === "local-types" || gate === "local-static",
  "Usage: bun packages/e2e/scripts/run-neon_utils-local-proof.ts unit|types|local-types|local-static",
);
if (gate === "unit") {
  const child = spawnSync("bun", ["run", "--cwd", "packages/tests", "test", "unit/extensions-neon_utils.test.ts"], {
    cwd: root,
    encoding: "utf8",
  });
  process.stdout.write(child.stdout);
  process.stderr.write(child.stderr);
  assert.equal(child.error, undefined);
  process.exitCode = child.status ?? 1;
} else {
  const file = root + "packages/tests/types/extensions-neon_utils.test-d.ts";
  const scratch = await mkdtemp(join(tmpdir(), "loom-neon_utils-types-"));
  try {
    let entry = file;
    if (gate === "types") {
      entry = join(scratch, "probe.ts");
      await symlink(root + "packages/tests/node_modules", join(scratch, "node_modules"));
      await writeFile(entry, await readFile(root + "packages/e2e/fixtures/neon_utils-public-types.ts.fixture", "utf8"));
    }
    if (gate === "local-types") {
      console.log(
        "Source-only type characterization; this is not the public types, generation or packed-consumer gate.",
      );
    }
    await writeFile(
      join(scratch, "tsconfig.json"),
      JSON.stringify({
        extends: root + "packages/ts-config/bun.json",
        compilerOptions: {
          resolveJsonModule: true,
          typeRoots: [root + "packages/e2e/node_modules/@types", root + "apps/loom/node_modules/@types"],
        },
        files:
          gate === "local-static"
            ? [
                "apps/loom/src/core/extensions/adapters/neon_utils.ts",
                "apps/loom/src/tooling/extensions/annotations/neon_utils.ts",
                "packages/tests/unit/extensions-neon_utils.test.ts",
                "packages/e2e/fixtures/neon_utils-generated-project.ts",
                "packages/e2e/fixtures/neon_utils-proof-cases.ts",
                "packages/e2e/fixtures/neon_utils-semantic-proof.ts",
                "packages/e2e/integration/extensions-neon_utils.test.ts",
                "packages/e2e/integration/extensions-neon_utils-generated.test.ts",
                "packages/e2e/integration/packed-neon_utils.test.ts",
                "packages/e2e/scripts/run-neon_utils-local-proof.ts",
              ].map((path) => root + path)
            : [entry],
      }),
    );
    const child = spawnSync(root + "node_modules/.bin/tsc", ["-p", join(scratch, "tsconfig.json")], {
      cwd: root,
      encoding: "utf8",
    });
    process.stdout.write(child.stdout);
    process.stderr.write(child.stderr);
    assert.equal(child.error, undefined);
    process.exitCode = child.status ?? 1;
    if (child.status === 0)
      console.log(
        gate === "local-types"
          ? "Local source type characterization passed."
          : gate === "local-static"
            ? "Focused family static check passed; canonical parent receipts remain required."
            : "Focused public type check passed; canonical parent receipt remains required.",
      );
  } finally {
    await rm(scratch, { recursive: true, force: true });
  }
}
