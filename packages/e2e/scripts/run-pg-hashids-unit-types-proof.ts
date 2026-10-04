import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, realpathSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofReceipt,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { collectExtensionProofCases } from "../fixtures/extension-proof";
import { pgHashidsGateProofSources } from "../fixtures/pg-hashids-semantic-proof";
import { pgHashidsTypesProofCase, pgHashidsUnitProofCase } from "../fixtures/pg-hashids-proof-cases";

const root = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));
const { build }: Pick<typeof import("../../../apps/loom/node_modules/esbuild/lib/main.js"), "build"> = createRequire(
  join(root, "apps/loom/package.json"),
)("esbuild");
const driver = "packages/e2e/scripts/run-pg-hashids-unit-types-proof.ts";
assert.equal(realpathSync(join(root, driver)), realpathSync(fileURLToPath(import.meta.url)));
const gate = process.argv[2];
assert(gate === "unit" || gate === "types", "Usage: bun packages/e2e/scripts/run-pg-hashids-unit-types-proof.ts unit|types");
const definition = gate === "unit" ? pgHashidsUnitProofCase : pgHashidsTypesProofCase;
const runId = `pg-hashids.${gate}.${randomUUID()}`;
const directory = realpathSync(mkdtempSync(join(tmpdir(), `loom-pg-hashids-${gate}-proof-`)));

function sourcePath(path: string) {
  const physical = realpathSync(resolve(root, path));
  assert(physical.startsWith(root + sep), `Proof source escapes checkout: ${path}`);
  return relative(root, physical).split(sep).join("/");
}
function execute(command: string[], cwd = root) {
  const child = spawnSync(command[0]!, command.slice(1), { cwd, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (child.error) throw child.error;
  return child;
}
function requireSuccess(child: ReturnType<typeof execute>, label: string) {
  writeFileSync(join(directory, `${label}.log`), child.stdout + child.stderr, { mode: 0o600 });
  assert.equal(child.status, 0, `${label} failed; diagnostic retained in ${directory}`);
  assert.equal(child.signal, null, `${label} was terminated`);
}

const graph = await build({
  absWorkingDir: root,
  entryPoints: [driver, definition.file],
  bundle: true,
  write: false,
  metafile: true,
  platform: "node",
  format: "esm",
  packages: "external",
  target: "esnext",
  external: ["bun:test"],
  outdir: join(directory, "unused-graph-output"),
});
const graphSources = Object.keys(graph.metafile!.inputs).map((file) => sourcePath(resolve(root, file)));
const sourceFiles = [...new Set([...graphSources, ...pgHashidsGateProofSources[gate], driver])].sort();
function hashSources() {
  return sourceFiles.map((file) => ({
    file,
    sha256: createHash("sha256")
      .update(readFileSync(join(root, file)))
      .digest("hex"),
  }));
}
const sourcesBefore = hashSources();
let command: string[];
let runnerVersion = "";
if (gate === "types") {
  const compiler = join(root, "packages/tests/node_modules/.bin/tsc");
  const config = join(directory, "tsconfig.json");
  symlinkSync(join(root, "packages/tests/node_modules"), join(directory, "node_modules"), "dir");
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
        files: [join(root, definition.file)],
      },
      null,
      2,
    ) + "\n",
  );
  command = [compiler, "-p", config, "--pretty", "false", "--noEmit", "--listFiles"];
  const version = execute([compiler, "--version"]);
  requireSuccess(version, "compiler-version");
  runnerVersion = /^Version\s+(\S+)/m.exec(version.stdout)?.[1] ?? "";
  assert(runnerVersion, "Compiler did not identify its actual version");
} else {
  command = [
    join(root, "packages/tests/node_modules/.bin/vp"),
    "test",
    "run",
    relative(join(root, "packages/tests"), join(root, definition.file)),
    "--reporter=default",
    "--reporter=json",
    `--outputFile.json=${join(directory, "vitest.json")}`,
  ];
}
writeFileSync(join(directory, "host-before.json"), JSON.stringify({ runId, command, sourcesBefore }, null, 2) + "\n", {
  mode: 0o600,
});
const child = execute(command, gate === "unit" ? join(root, "packages/tests") : root);
requireSuccess(child, "runner");
if (gate === "unit") {
  const output = (child.stdout + child.stderr).replace(new RegExp(String.fromCharCode(27) + "\\[[0-9;]*m", "g"), "");
  runnerVersion = /\bRUN\s+v([^\s]+)/.exec(output)?.[1] ?? "";
  assert(runnerVersion, "Vitest did not identify its actual run version");
  const report = JSON.parse(readFileSync(join(directory, "vitest.json"), "utf8"));
  assert.equal(report.success, true);
  assert.equal(report.numFailedTests, 0);
  assert(report.numPassedTests > 0);
  const registered = report.testResults.flatMap(
    (suite: { name: string; assertionResults: { title: string; status: string }[] }) =>
      suite.assertionResults
        .filter((test) => test.title === definition.title)
        .map((test) => ({ file: realpathSync(suite.name), ...test })),
  );
  assert.equal(registered.length, 1, "Registered unit proof case was missing or duplicated");
  assert.equal(registered[0].status, "passed");
} else {
  const listed = child.stdout
    .split(/\r?\n/)
    .filter((line) => isAbsolute(line.trim()))
    .map((line) => realpathSync(line.trim()));
  assert(
    listed.includes(realpathSync(join(root, definition.file))),
    "Registered type file was not a compiler input",
  );
}
const sourcesAfter = hashSources();
assert.equal(
  extensionProofSourcesDigest(sourcesBefore),
  extensionProofSourcesDigest(sourcesAfter),
  "Proof sources changed during execution",
);
const cases = collectExtensionProofCases({
  runId,
  expected: [definition],
  exitCode: child.status,
  events: [
    { runId, kind: "registered", definition },
    { runId, kind: "started", caseId: definition.id },
    { runId, kind: "terminal", caseId: definition.id, status: "passed", witnessFailures: 0 },
  ],
});
const receipt: ExtensionProofReceipt = {
  format: 2,
  runId,
  finalizedBy: "host",
  runner: { name: gate === "unit" ? "vitest" : "tsc", version: runnerVersion },
  command,
  gate,
  exitCode: child.status!,
  sourcesBefore,
  sourcesAfter,
  definitionsDigest: extensionProofCasesDigest([definition]),
  cases,
  totals: { passed: cases.length, failed: 0, skipped: 0, todo: 0, incomplete: 0 },
};
writeFileSync(join(directory, "host-receipt.json"), JSON.stringify(receipt, null, 2) + "\n", { mode: 0o600 });
console.log(
  `Observed pg_hashids ${gate} gate receipt retained at ${directory}; generation/consumer/database remain pending. receiptDigest=${extensionProofReceiptDigest(receipt)}`,
);
