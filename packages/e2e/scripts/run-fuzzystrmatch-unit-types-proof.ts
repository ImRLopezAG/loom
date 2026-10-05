import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import {
  appendFileSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  realpathSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { extensionBindingsSource } from "../../../apps/loom/src/tooling/codegen/extensions";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofReceipt,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { collectExtensionProofCases, type ExtensionProofEvent } from "../fixtures/extension-proof";
import { fuzzystrmatchUnitProofCase, fuzzystrmatchTypesProofCase } from "../fixtures/fuzzystrmatch-proof-cases";
import { fuzzystrmatchGateProofSources } from "../fixtures/fuzzystrmatch-semantic-proof";
import roster from "./fuzzystrmatch-unit-types-proof-sources.json";

// This host retains actual run receipts in scratch; retention into repository evidence is a separate verified step.
const root = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));
const { build }: Pick<typeof import("../../../apps/loom/node_modules/esbuild/lib/main.js"), "build"> = createRequire(
  join(root, "apps/loom/package.json"),
)("esbuild");
const driver = "packages/e2e/scripts/run-fuzzystrmatch-unit-types-proof.ts";
assert.equal(realpathSync(join(root, driver)), realpathSync(fileURLToPath(import.meta.url)));
const gate = process.argv[2];
assert(
  gate === "unit" || gate === "types",
  "Usage: bun packages/e2e/scripts/run-fuzzystrmatch-unit-types-proof.ts unit|types",
);
const definition = gate === "unit" ? fuzzystrmatchUnitProofCase : fuzzystrmatchTypesProofCase;
const runId = `fuzzystrmatch.${gate}.${randomUUID()}`;
const directory = realpathSync(mkdtempSync(join(tmpdir(), `loom-fuzzystrmatch-${gate}-proof-`)));
const eventsFile = join(directory, "cases.jsonl");
const tests = [fuzzystrmatchUnitProofCase.file];

function sourcePath(path: string) {
  const physical = realpathSync(path);
  assert(physical.startsWith(root + sep), `Proof source escapes checkout: ${path}`);
  return relative(root, physical).split(sep).join("/");
}
function runnerPackageSources(packageRoot: string): string[] {
  const files: string[] = [];
  function visit(directory: string) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name);
      if (entry.isDirectory() && entry.name !== "node_modules") visit(path);
      else if (
        entry.isFile() &&
        (/\.(?:[cm]?js|json|node)$/.test(entry.name) || directory === join(packageRoot, "bin"))
      )
        files.push(sourcePath(path));
    }
  }
  visit(packageRoot);
  return files;
}
function execute(command: string[], cwd = root, env: NodeJS.ProcessEnv = process.env) {
  const child = spawnSync(command[0]!, command.slice(1), { cwd, env, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (child.error) throw child.error;
  return child;
}
function requireSuccess(child: ReturnType<typeof execute>, label: string) {
  writeFileSync(join(directory, `${label}.log`), child.stdout + child.stderr, { mode: 0o600 });
  assert.equal(child.status, 0, `${label} failed; diagnostic retained in ${directory}`);
  assert.equal(child.signal, null, `${label} was terminated`);
}
const reviewed = gate === "unit" ? roster.unitSources : roster.typesSources;
assert.equal(roster.format, 1);
assert(reviewed.includes(driver));
// This matches the existing host's packages-external repository graph capture. Public JS
// entries are explicit roots, so the package export boundary is not hidden by externalization.
const graph = await build({
  absWorkingDir: root,
  entryPoints: [...(gate === "unit" ? tests : []), driver, "apps/loom/dist/core/extensions/adapters/fuzzystrmatch.js"],
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
if (process.env.LOOM_CAPTURE_ROSTER === "1") {
  console.log(JSON.stringify({ gate, reached: graphSources.sort() }));
  process.exit(0);
}
assert(
  graphSources.every((file) => reviewed.includes(file)),
  `Reviewed source roster omits repository imports: ${graphSources.filter((file) => !reviewed.includes(file)).join(", ")}`,
);
// Bind the generator and reviewed repository inputs before emitting the derived type probes.
// Compiler input discovery adds third-party declarations later without moving this boundary.
const repositorySourcesBefore = [...new Set([...reviewed, ...graphSources, ...fuzzystrmatchGateProofSources[gate]])]
  .sort()
  .map((file) => ({
    file,
    sha256: createHash("sha256")
      .update(readFileSync(join(root, file)))
      .digest("hex"),
  }));
let command: string[];
let runnerVersion: string;
let derived: { file: string; sha256: string }[] = [];
let compilerInputs: string[] = [];
const extraSources: string[] = [sourcePath(join(root, "apps/loom/node_modules/esbuild/lib/main.js"))];
const compiler = join(root, "packages/tests/node_modules/.bin/tsc");
if (gate === "types") {
  const compilerRoot = dirname(dirname(realpathSync(compiler)));
  extraSources.push(...runnerPackageSources(compilerRoot));
  // TypeScript 7's launcher delegates to a real platform binary. Bind that executable,
  // not merely the tiny launcher. Resolution mirrors the inspected installed getExePath.
  const platformPackage = createRequire(realpathSync(compiler)).resolve(
    `@typescript/typescript-${process.platform}-${process.arch}/package.json`,
  );
  extraSources.push(
    sourcePath(platformPackage),
    sourcePath(join(dirname(platformPackage), "lib", process.platform === "win32" ? "tsc.exe" : "tsc")),
  );
  // These are actual production-emitted files, not manually supplied expected bindings.
  // The temporary consumer uses the same physical published package/declaration installation.
  symlinkSync(join(root, "packages/tests/node_modules"), join(directory, "node_modules"), "dir");
  const selections = {
    standard: { fuzzystrmatch: { version: "1.2", schema: "extensions" } },
    custom: { fuzzystrmatch: { version: "1.2", schema: 'typed"fuzzy' } },
    absent: undefined,
    empty: {},
    future: { fuzzystrmatch: { version: "future", schema: "extensions" } },
  } as const;
  for (const [name, selection] of Object.entries(selections))
    writeFileSync(join(directory, `${name}.ts`), extensionBindingsSource(selection));
  writeFileSync(
    join(directory, "generated-contracts.test-d.ts"),
    `
import type { SQL } from "drizzle-orm";
type ArrayValues = readonly (string | null | ArrayValues)[];
type PostgreSqlArray = { readonly dimensions: readonly { readonly lowerBound: number; readonly length: number }[]; readonly values: ArrayValues };
import { extensions as standard } from "./standard";
import { extensions as custom } from "./custom";
import { extensions as absent } from "./absent";
import { extensions as empty } from "./empty";
import { extensions as future } from "./future";
const api = custom.fuzzystrmatch;
const placement: 'typed"fuzzy' = api.schema;
const defaultSchema: "extensions" = standard.fuzzystrmatch.schema;
const version: "1.2" = api.version;
const soundex: SQL<string | null> = api.soundex("Robert");
const alias: SQL<string | null> = api.sql.functions.text_soundex(null);
const score: SQL<number | null> = api.difference("Robert", "Rupert");
const codes: SQL<PostgreSqlArray | null> = api.daitchMokotoff("John");
const primary: SQL<string | null> = api.dmetaphone("Smith");
const alternate: SQL<string | null> = api.dmetaphoneAlt("Smith");
const metaphone: SQL<string | null> = api.metaphone("GUMBO", 4);
const distance: SQL<number | null> = api.levenshtein("a", "b");
const costs: SQL<number | null> = api.sql.functions.levenshtein("a", "b", 2, 3, 4);
const bounded: SQL<number | null> = api.levenshteinLessEqual("a", "b", 2);
const boundedCosts: SQL<number | null> = api.sql.functions.levenshtein_less_equal("a", "b", 2, 3, 4, 4);
const missing: undefined = absent;
const noSelection: undefined = empty;
// @ts-expect-error SQL NULL remains part of strict routine results.
const required: SQL<string> = soundex;
// @ts-expect-error Only captured two/five-argument distance overloads exist.
api.levenshtein("a", "b", 1);
// @ts-expect-error Only captured three/six-argument bounded overloads exist.
api.levenshteinLessEqual("a", "b", 1, 2);
// @ts-expect-error A text routine cannot bind a boolean value.
api.soundex(true);
// @ts-expect-error Costs are exact int4 numbers, not bigint.
api.metaphone("a", 1n);
// @ts-expect-error Fixed result decoders do not accept caller return casts.
api.soundex<number>("a");
// @ts-expect-error Unselected families remain absent.
void custom.unaccent;
// @ts-expect-error Future versions expose descriptors only.
void future.fuzzystrmatch.soundex;
void [placement, defaultSchema, version, soundex, alias, score, codes, primary, alternate, metaphone, distance, costs, bounded, boundedCosts, missing, noSelection, required];
`,
  );
  const config = join(directory, "tsconfig.json");
  writeFileSync(
    config,
    JSON.stringify(
      {
        extends: join(root, "packages/tests/tsconfig.json"),
        compilerOptions: { noEmit: true, incremental: false },
        include: [],
        files: [join(root, fuzzystrmatchTypesProofCase.file), join(directory, "generated-contracts.test-d.ts")],
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
  const discovery = execute([compiler, "-p", config, "--pretty", "false", "--listFilesOnly"]);
  requireSuccess(discovery, "compiler-input-discovery");
  compilerInputs = discovery.stdout
    .split(/\r?\n/)
    .filter((line) => isAbsolute(line.trim()))
    .map((line) => realpathSync(line.trim()))
    .sort();
  assert(
    compilerInputs.includes(realpathSync(join(root, definition.file))),
    "Registered type file was not a compiler input",
  );
  assert(
    compilerInputs.includes(realpathSync(join(directory, "generated-contracts.test-d.ts"))),
    "Generated probe was not a compiler input",
  );
  for (const path of compilerInputs) {
    if (path.startsWith(directory + sep)) continue;
    const file = sourcePath(path);
    // The compiler itself supplies the installed declaration closure. Repository files
    // require reviewed registration; lock-bound third-party inputs are byte-hashed too.
    assert(
      file.startsWith("node_modules/") || reviewed.includes(file),
      `Unreviewed compiler repository input: ${file}`,
    );
    extraSources.push(file);
  }
  derived = [
    "standard.ts",
    "custom.ts",
    "absent.ts",
    "empty.ts",
    "future.ts",
    "generated-contracts.test-d.ts",
    "tsconfig.json",
  ].map((file) => ({
    file,
    sha256: createHash("sha256")
      .update(readFileSync(join(directory, file)))
      .digest("hex"),
  }));
  extraSources.push(sourcePath(compiler));
} else {
  command = [
    join(root, "packages/tests/node_modules/.bin/vp"),
    "test",
    "run",
    ...tests.map((file) => relative(join(root, "packages/tests"), join(root, file))),
    "--reporter=default",
    "--reporter=json",
    `--outputFile.json=${join(directory, "vitest.json")}`,
  ];
  extraSources.push(sourcePath(command[0]!));
  const runnerRoot = dirname(dirname(realpathSync(command[0]!)));
  extraSources.push(...runnerPackageSources(runnerRoot));
  // vp test resolves its bundled Vitest first, matching vite-plus/test. Bind its real JS
  // implementation and manifest independently of the runner banner used in the receipt.
  const vitestPackage = createRequire(join(runnerRoot, "package.json")).resolve("vitest/package.json");
  extraSources.push(...runnerPackageSources(dirname(vitestPackage)));
  runnerVersion = ""; // Captured from the actual run banner, never a hard-coded package version.
}
const sourceFiles = [
  ...new Set([...reviewed, ...graphSources, ...fuzzystrmatchGateProofSources[gate], ...extraSources]),
].sort();
function hashSources() {
  return sourceFiles.map((file) => ({
    file,
    sha256: createHash("sha256")
      .update(readFileSync(join(root, sourcePath(join(root, file)))))
      .digest("hex"),
  }));
}
const sourcesBefore = hashSources();
for (const source of repositorySourcesBefore)
  assert.equal(
    sourcesBefore.find((entry) => entry.file === source.file)?.sha256,
    source.sha256,
    "Repository source changed during generation or compiler input discovery",
  );
writeFileSync(
  join(directory, "host-before.json"),
  JSON.stringify({ runId, command, sourcesBefore, derived, compilerInputs }, null, 2) + "\n",
  { mode: 0o600 },
);
function record(event: ExtensionProofEvent) {
  appendFileSync(eventsFile, JSON.stringify(event) + "\n", { mode: 0o600 });
}
// For type gates, the host owns the actual compiler invocation and its observed terminal.
// There is no executed declaration callback and no success event before compiler exit zero.
if (gate === "types") {
  record({ runId, kind: "registered", definition });
  record({ runId, kind: "started", caseId: definition.id });
}
const child = execute(command, gate === "unit" ? join(root, "packages/tests") : root, {
  ...process.env,
  CI: "1",
  NO_COLOR: "1",
  LOOM_EXTENSION_PROOF_RUN_ID: runId,
  LOOM_EXTENSION_PROOF_OUTPUT: eventsFile,
});
if (gate === "types")
  record({
    runId,
    kind: "terminal",
    caseId: definition.id,
    status: child.status === 0 && child.signal === null ? "passed" : "failed",
    witnessFailures: 0,
  });
requireSuccess(child, "runner");
if (gate === "unit") {
  const output = (child.stdout + child.stderr).replace(new RegExp(String.fromCharCode(27) + "\\[[0-9;]*m", "g"), "");
  runnerVersion = /\bRUN\s+v([^\s]+)/.exec(output)?.[1] ?? "";
  assert(runnerVersion, "Vitest did not identify its actual run version");
  const report = JSON.parse(readFileSync(join(directory, "vitest.json"), "utf8"));
  assert.equal(report.success, true);
  assert.equal(report.numFailedTests, 0);
  assert.equal(report.numPendingTests, 0);
  assert.equal(report.numTodoTests, 0);
  assert.equal(report.numPassedTests, report.numTotalTests);
  assert.equal(report.testResults.length, tests.length);
  for (const file of tests) {
    const suites = report.testResults.filter(
      (suite: { name: string }) => realpathSync(suite.name) === realpathSync(join(root, file)),
    );
    assert.equal(suites.length, 1, `Missing or duplicate actual test file: ${file}`);
    const suite = suites[0];
    assert.equal(suite.status, "passed");
    assert(suite.assertionResults.length > 0, "Empty unit suite cannot prove a gate");
    assert(
      suite.assertionResults.every((test: { status: string }) => test.status === "passed"),
      "Skipped, todo or failed unit case",
    );
  }
  const registered = report.testResults.flatMap(
    (suite: { name: string; assertionResults: { title: string; status: string }[] }) =>
      suite.assertionResults
        .filter((test) => test.title === definition.title)
        .map((test) => ({ file: realpathSync(suite.name), ...test })),
  );
  assert.equal(registered.length, 1, "Registered unit proof case was missing or duplicated");
  assert.equal(registered[0].file, realpathSync(join(root, definition.file)));
  assert.equal(registered[0].status, "passed");
} else {
  const actualInputs = child.stdout
    .split(/\r?\n/)
    .filter((line) => isAbsolute(line.trim()))
    .map((line) => realpathSync(line.trim()))
    .sort();
  assert.deepEqual(actualInputs, compilerInputs, "Compiler input closure changed during execution");
  for (const source of derived)
    assert.equal(
      createHash("sha256")
        .update(readFileSync(join(directory, source.file)))
        .digest("hex"),
      source.sha256,
      "Derived compiler input changed during execution",
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
  events: readFileSync(eventsFile, "utf8")
    .trim()
    .split("\n")
    .map((line) => JSON.parse(line)),
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
const receiptDigest = extensionProofReceiptDigest(receipt);
writeFileSync(join(directory, "host-receipt.json"), JSON.stringify(receipt, null, 2) + "\n", { mode: 0o600 });
const runnerArtifacts = [
  "runner.log",
  "cases.jsonl",
  ...(gate === "unit" ? ["vitest.json"] : ["compiler-version.log", "compiler-input-discovery.log"]),
].map((file) => ({
  file,
  sha256: createHash("sha256")
    .update(readFileSync(join(directory, file)))
    .digest("hex"),
}));
writeFileSync(
  join(directory, "host-summary.json"),
  JSON.stringify(
    {
      runId,
      gate,
      receiptDigest,
      sourceCount: sourcesBefore.length,
      repositoryGraph: graphSources,
      derived,
      compilerInputs,
      runnerArtifacts,
      hostDriverSha256: sourcesBefore.find((source) => source.file === driver)?.sha256,
      fullFamilyAcceptance: false,
    },
    null,
    2,
  ) + "\n",
  { mode: 0o600 },
);
console.log(
  `Observed fuzzystrmatch ${gate} gate receipt retained at ${directory}; full family acceptance remains pending.`,
);
