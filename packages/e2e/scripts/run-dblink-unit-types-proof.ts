import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const gate = process.argv[2];
assert(
  gate === "unit" || gate === "types",
  "Usage: bun packages/e2e/scripts/run-dblink-unit-types-proof.ts unit|types",
);
const command =
  gate === "unit"
    ? ["./node_modules/.bin/vp", "test", "run", "unit/extensions-dblink.test.ts", "--reporter=default"]
    : [
        "./packages/tests/node_modules/.bin/tsc",
        "-p",
        "packages/tests/types/dblink.tsconfig.json",
        "--pretty",
        "false",
        "--noEmit",
        "--incremental",
        "false",
      ];
const child = spawnSync(command[0]!, command.slice(1), {
  cwd: gate === "unit" ? `${root}packages/tests` : root,
  encoding: "utf8",
  env: { ...process.env, CI: "1" },
  maxBuffer: 64 * 1024 * 1024,
});
if (child.stdout) process.stdout.write(child.stdout);
if (child.stderr) process.stderr.write(child.stderr);
assert.equal(child.signal, null, `dblink ${gate} proof was interrupted`);
assert.equal(child.status, 0, `dblink ${gate} proof failed`);
console.log(`Observed dblink ${gate} gate locally; generation and consumer remain pending parent shared integration.`);
