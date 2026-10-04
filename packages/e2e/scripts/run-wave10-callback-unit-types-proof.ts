import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import {
  appendFileSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { collectExtensionProofCases, type ExtensionProofEvent } from "../fixtures/extension-proof";
import { wave10CallbackUnitCases, wave10CallbackTypesCases } from "../fixtures/wave10-callback-unit-types-cases";
import { wave10CallbackProofs, wave10AdapterFileName } from "../fixtures/wave10-callback-proof-cases";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofReceipt,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

// These receipts are individual gates, never family acceptance or member witnesses.
const root = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));
const gate = process.argv[2];
assert(gate === "unit" || gate === "types", "Usage: bun run-wave10-callback-unit-types-proof.ts unit|types");
const definitions = gate === "unit" ? wave10CallbackUnitCases : wave10CallbackTypesCases;
const runId = `wave10.callbacks.${gate}.${randomUUID()}`;
const directory = realpathSync(mkdtempSync(join(tmpdir(), `kello-wave10-callback-${gate}-`)));
const eventsFile = join(directory, "cases.jsonl");
writeFileSync(eventsFile, "", { flag: "wx", mode: 0o600 });
const paths = new Set<string>();
function sourcePath(path: string) {
  const physical = realpathSync(resolve(root, path));
  assert(physical.startsWith(root + sep), "Source escapes checkout");
  return relative(root, physical).split(sep).join("/");
}
function hashSources() {
  return [...paths].sort().map((file) => ({
    file,
    sha256: createHash("sha256")
      .update(readFileSync(join(root, sourcePath(file))))
      .digest("hex"),
  }));
}
function bindPackage(directory: string) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory() && entry.name !== "node_modules") bindPackage(path);
    else if (entry.isFile() && /\.(?:[cm]?js|json|node)$/.test(entry.name)) paths.add(sourcePath(path));
  }
}
function execute(command: string[], cwd = root) {
  const result = spawnSync(command[0]!, command.slice(1), {
    cwd,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    env: {
      ...process.env,
      CI: "1",
      NO_COLOR: "1",
      LOOM_EXTENSION_PROOF_RUN_ID: runId,
      LOOM_EXTENSION_PROOF_OUTPUT: eventsFile,
    },
  });
  if (result.error) throw result.error;
  return result;
}
function requireSuccess(result: ReturnType<typeof execute>, label: string) {
  writeFileSync(join(directory, `${label}.log`), result.stdout + result.stderr, { mode: 0o600 });
  assert.equal(result.status, 0, `${label} failed; see ${directory}`);
  assert.equal(result.signal, null);
}
const { build }: Pick<typeof import("../../../apps/loom/node_modules/esbuild/lib/main.js"), "build"> = createRequire(
  join(root, "apps/loom/package.json"),
)("esbuild");
const adapters = Object.values(wave10CallbackProofs).map((proof) => wave10AdapterFileName(proof.family.extension));
const graph = await build({
  absWorkingDir: root,
  entryPoints: [
    fileURLToPath(import.meta.url),
    ...(gate === "unit" ? definitions.map(({ file }) => file) : []),
    ...adapters.flatMap((name) => [
      `apps/loom/src/core/extensions/adapters/${name}.ts`,
      `apps/loom/src/tooling/extensions/annotations/${name}.ts`,
      `apps/loom/dist/core/extensions/adapters/${name}.js`,
    ]),
  ],
  bundle: true,
  write: false,
  metafile: true,
  platform: "node",
  format: "esm",
  packages: "external",
  target: "esnext",
  outdir: join(directory, "graph"),
});
for (const path of Object.keys(graph.metafile!.inputs)) paths.add(sourcePath(path));
for (const path of [
  "bun.lock",
  "apps/loom/package.json",
  "packages/tests/package.json",
  "packages/tests/vite.config.ts",
  "packages/tests/tsconfig.json",
  "packages/ts-config/base.json",
  "packages/ts-config/bun.json",
  "apps/loom/src/tooling/extensions/text-search-contracts/dict_int.json",
  ...adapters.map((name) => `apps/loom/src/tooling/extensions/manifests/${name.replaceAll("-", "_")}.json`),
  ...definitions.map(({ file }) => file),
])
  paths.add(sourcePath(path));
paths.add(sourcePath(join(root, "apps/loom/node_modules/esbuild/lib/main.js")));
const repositoryBefore = hashSources();
let command: string[];
let runnerVersion = "";
let compilerInputs: string[] = [];
let compilerConfig: { file: string; sha256: string } | undefined;
if (gate === "types") {
  const compiler = join(root, "packages/tests/node_modules/.bin/tsc");
  const compilerRoot = dirname(dirname(realpathSync(compiler)));
  bindPackage(compilerRoot);
  const nativePackage = createRequire(realpathSync(compiler)).resolve(
    `@typescript/typescript-${process.platform}-${process.arch}/package.json`,
  );
  paths.add(sourcePath(nativePackage));
  paths.add(sourcePath(join(dirname(nativePackage), "lib", process.platform === "win32" ? "tsc.exe" : "tsc")));
  const config = join(directory, "tsconfig.json");
  symlinkSync(join(root, "packages/tests/node_modules"), join(directory, "node_modules"), "dir");
  writeFileSync(
    config,
    JSON.stringify(
      {
        extends: join(root, "packages/tests/tsconfig.json"),
        compilerOptions: { noEmit: true, incremental: false },
        include: [],
        files: definitions.map(({ file }) => join(root, file)),
      },
      null,
      2,
    ) + "\n",
  );
  compilerConfig = { file: config, sha256: createHash("sha256").update(readFileSync(config)).digest("hex") };
  const version = execute([compiler, "--version"]);
  requireSuccess(version, "compiler-version");
  runnerVersion = /^Version\s+(\S+)/m.exec(version.stdout)?.[1] ?? "";
  assert(runnerVersion);
  const discovery = execute([compiler, "-p", config, "--pretty", "false", "--listFilesOnly"]);
  requireSuccess(discovery, "compiler-input-discovery");
  compilerInputs = discovery.stdout
    .split(/\r?\n/)
    .filter((line) => isAbsolute(line.trim()))
    .map((line) => realpathSync(line.trim()))
    .sort();
  for (const definition of definitions) assert(compilerInputs.includes(realpathSync(join(root, definition.file))));
  for (const file of compilerInputs) paths.add(sourcePath(file));
  command = [compiler, "-p", config, "--pretty", "false", "--noEmit", "--listFiles"];
} else {
  const runner = join(root, "packages/tests/node_modules/.bin/vp");
  const runnerRoot = dirname(dirname(realpathSync(runner)));
  bindPackage(runnerRoot);
  paths.add(sourcePath(runner));
  bindPackage(dirname(createRequire(join(runnerRoot, "package.json")).resolve("vitest/package.json")));
  command = [
    runner,
    "test",
    "run",
    ...definitions.map(({ file }) => relative(join(root, "packages/tests"), join(root, file))),
    "--reporter=default",
    "--reporter=json",
    `--outputFile.json=${join(directory, "vitest.json")}`,
  ];
}
const before = hashSources();
for (const source of repositoryBefore)
  assert.equal(
    before.find((entry) => entry.file === source.file)?.sha256,
    source.sha256,
    "Source changed during compiler discovery",
  );
function record(event: ExtensionProofEvent) {
  appendFileSync(eventsFile, JSON.stringify(event) + "\n", { mode: 0o600 });
}
if (gate === "types")
  for (const definition of definitions) {
    record({ runId, kind: "registered", definition });
    record({ runId, kind: "started", caseId: definition.id });
  }
const result = execute(command, gate === "unit" ? join(root, "packages/tests") : root);
if (gate === "types")
  for (const definition of definitions)
    record({
      runId,
      kind: "terminal",
      caseId: definition.id,
      status: result.status === 0 && result.signal === null ? "passed" : "failed",
      witnessFailures: 0,
    });
requireSuccess(result, "runner");
if (gate === "unit") {
  runnerVersion = /\bRUN\s+v([^\s]+)/.exec((result.stdout + result.stderr).replace(/\u001b\[[0-9;]*m/g, ""))?.[1] ?? "";
  assert(runnerVersion);
  const report = JSON.parse(readFileSync(join(directory, "vitest.json"), "utf8"));
  assert.equal(report.success, true);
  assert.equal(report.numFailedTests + report.numPendingTests + report.numTodoTests, 0);
  assert.equal(report.numPassedTests, report.numTotalTests);
  assert.equal(report.testResults.length, definitions.length);
  for (const definition of definitions) {
    const suites = report.testResults.filter(
      (suite: { name: string }) => realpathSync(suite.name) === realpathSync(join(root, definition.file)),
    );
    assert.equal(suites.length, 1);
    const suite = suites[0];
    assert.equal(suite.status, "passed");
    assert(
      suite.assertionResults.length > 0 &&
        suite.assertionResults.every((test: { status: string }) => test.status === "passed"),
    );
    assert.equal(suite.assertionResults.filter((test: { title: string }) => test.title === definition.title).length, 1);
  }
} else {
  const actual = result.stdout
    .split(/\r?\n/)
    .filter((line) => isAbsolute(line.trim()))
    .map((line) => realpathSync(line.trim()))
    .sort();
  assert.deepEqual(actual, compilerInputs, "Compiler input closure changed");
  assert(compilerConfig);
  assert.equal(
    createHash("sha256").update(readFileSync(compilerConfig.file)).digest("hex"),
    compilerConfig.sha256,
    "Compiler configuration changed",
  );
}
const after = hashSources();
assert.equal(extensionProofSourcesDigest(before), extensionProofSourcesDigest(after), "Sources changed during proof");
const cases = collectExtensionProofCases({
  runId,
  expected: definitions,
  exitCode: result.status,
  events: readFileSync(eventsFile, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line)),
});
const receipt: ExtensionProofReceipt = {
  format: 2,
  runId,
  gate,
  finalizedBy: "host",
  runner: { name: gate === "unit" ? "vitest" : "tsc", version: runnerVersion },
  command,
  exitCode: 0,
  sourcesBefore: before,
  sourcesAfter: after,
  definitionsDigest: extensionProofCasesDigest(definitions),
  cases,
  totals: { passed: cases.length, failed: 0, skipped: 0, todo: 0, incomplete: 0 },
};
const receiptDigest = extensionProofReceiptDigest(receipt);
writeFileSync(join(directory, "host-receipt.json"), JSON.stringify(receipt, null, 2) + "\n", { mode: 0o600 });
writeFileSync(
  join(directory, "host-summary.json"),
  JSON.stringify(
    {
      runId,
      gate,
      receiptDigest,
      sourceCount: before.length,
      compilerInputs,
      compilerConfig,
      fullFamilyAcceptance: false,
    },
    null,
    2,
  ) + "\n",
  { mode: 0o600 },
);
console.log(
  JSON.stringify({
    directory,
    gate,
    receiptDigest,
    cases: cases.length,
    sourceCount: before.length,
    fullFamilyAcceptance: false,
  }),
);
