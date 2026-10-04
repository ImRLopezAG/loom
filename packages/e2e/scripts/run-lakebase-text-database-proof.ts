import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
assert(
  process.env.LOOM_LAKEBASE_TEXT_DATABASE_URL,
  "Parent-owned Neon PG18 lakebase_text 0.1.3 URL required; this script does not claim a local pass",
);
const child = spawnSync(
  "bun",
  ["run", "--cwd", "packages/e2e", "test", "integration/extensions-lakebase-text.test.ts"],
  { cwd: root, encoding: "utf8", env: process.env },
);
process.stdout.write(child.stdout);
process.stderr.write(child.stderr);
assert.equal(child.error, undefined);
process.exitCode = child.status ?? 1;
