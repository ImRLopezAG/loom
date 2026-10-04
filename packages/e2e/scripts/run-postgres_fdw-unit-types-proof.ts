import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const gate = process.argv[2];
assert(gate === "unit" || gate === "types", "Usage: bun packages/e2e/scripts/run-postgres_fdw-unit-types-proof.ts unit|types");
const command =
  gate === "unit"
    ? ["./node_modules/.bin/vp", "test", "run", "unit/extensions-postgres_fdw.test.ts", "--reporter=default"]
    : ["./packages/tests/node_modules/.bin/tsc", "-p", "packages/tests/tsconfig.json", "--pretty", "false", "--noEmit", "--incremental", "false"];
const child = spawnSync(command[0]!, command.slice(1), {
  cwd: gate === "unit" ? `${root}packages/tests` : root,
  encoding: "utf8",
  env: { ...process.env, CI: "1" },
  maxBuffer: 64 * 1024 * 1024,
});
if (child.stdout) process.stdout.write(child.stdout);
if (child.stderr) process.stderr.write(child.stderr);
if (gate === "unit") assert.equal(child.status, 0, "postgres_fdw unit proof failed");
else {
  const output = `${child.stdout ?? ""}\n${child.stderr ?? ""}`;
  const family = output
    .split(/\r?\n/)
    .filter((line) => /extensions-postgres_fdw|postgres_fdw/.test(line) && /error TS/.test(line));
  assert.equal(family.length, 0, `postgres_fdw types proof failed\n${family.join("\n")}`);
}
console.log(`Observed postgres_fdw ${gate} gate locally; generation and consumer are family-owned tests.`);
