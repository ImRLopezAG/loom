import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

assert(
  process.env.LOOM_TEST_DATABASE_URL,
  "Supply LOOM_TEST_DATABASE_URL for a disposable local PostgreSQL 18 with exact postgres_fdw 1.2",
);
const child = spawnSync(
  "bun",
  ["test", "--timeout", "180000", "packages/e2e/integration/extensions-postgres_fdw.test.ts"],
  {
    cwd: new URL("../../../", import.meta.url).pathname,
    encoding: "utf8",
    env: { ...process.env, CI: "1" },
    maxBuffer: 64 * 1024 * 1024,
  },
);
process.stdout.write(child.stdout);
process.stderr.write(child.stderr);
assert.equal(child.status, 0, "postgres_fdw native oracle failed");
