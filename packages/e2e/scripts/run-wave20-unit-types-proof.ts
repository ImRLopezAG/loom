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
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofReceipt,
  type ExtensionProofCase,
  type ExtensionProofFamily,
  type ExtensionMemberProof,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

import * as username from "../fixtures/insert-username-proof-cases";
import * as refint from "../fixtures/refint-proof-cases";
import * as tcn from "../fixtures/tcn-proof-cases";
import * as lo from "../fixtures/lo-proof-cases";
import * as prewarm from "../fixtures/pg_prewarm-proof-cases";
import * as statistics from "../fixtures/pg_stat_statements-proof-cases";
import * as jwt from "../fixtures/pgjwt-proof-cases";
import * as sessionJwt from "../fixtures/pg_session_jwt-proof-cases";
import * as earth from "../fixtures/earthdistance-proof-cases";
import * as seg from "../fixtures/seg-proof-cases";
import { insertUsernameAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/insert-username";
import { refintAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/refint";
import { tcnAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/tcn";

// Shared source roster for the ten selected families. Importing this host never executes a proof run.
export const wave20Root = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));
export interface Wave20Proof {
  family: ExtensionProofFamily;
  adapter: string;
  schema: string;
  definitionFile: string;
  databaseFixtures: number;
  databaseRoles: number;
  unitCases: ExtensionProofCase[];
  typesCases: ExtensionProofCase[];
  databaseCases: ExtensionProofCase[];
  members: ExtensionMemberProof[];
}
function triggerMembers(
  annotations: readonly { id: string; disposition: "schema"; reason: string; evidence: readonly string[] }[],
  definitions: ExtensionProofCase[],
): ExtensionMemberProof[] {
  return annotations.map((annotation) => ({
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases: definitions.flatMap((definition) =>
      definition.claims
        .filter((claim) => claim.member === annotation.id)
        .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
    ),
    transfers: [],
  }));
}
export const wave20Proofs: Wave20Proof[] = [
  {
    family: sessionJwt.pgSessionJwtProofFamily,
    adapter: "pg_session_jwt",
    schema: "jwt_install",
    definitionFile: "packages/e2e/fixtures/pg_session_jwt-proof-cases.ts",
    databaseFixtures: sessionJwt.pgSessionJwtDatabaseFixtureCount,
    databaseRoles: sessionJwt.pgSessionJwtDatabaseRoleCount,
    unitCases: [...sessionJwt.pgSessionJwtUnitProofCases],
    typesCases: [sessionJwt.pgSessionJwtTypesProofCase],
    databaseCases: [...sessionJwt.pgSessionJwtDatabaseProofCases],
    members: sessionJwt.pgSessionJwtMemberProofs,
  },
  {
    family: username.insertUsernameProofFamily,
    adapter: "insert-username",
    schema: 'trig"ext',
    definitionFile: "packages/e2e/fixtures/insert-username-proof-cases.ts",
    databaseFixtures: username.insertUsernameDatabaseFixtureCount,
    databaseRoles: username.insertUsernameDatabaseRoleCount,
    unitCases: [username.insertUsernameUnitCase],
    typesCases: [username.insertUsernameTypesCase],
    databaseCases: [username.insertUsernameDatabaseCase],
    members: triggerMembers(insertUsernameAnnotations, [username.insertUsernameDatabaseCase]),
  },
  {
    family: refint.refintProofFamily,
    adapter: "refint",
    schema: 'trig"ext',
    definitionFile: "packages/e2e/fixtures/refint-proof-cases.ts",
    databaseFixtures: refint.refintDatabaseFixtureCount,
    databaseRoles: refint.refintDatabaseRoleCount,
    unitCases: [refint.refintUnitCase],
    typesCases: [refint.refintTypesCase],
    databaseCases: [refint.refintDatabaseCase],
    members: triggerMembers(refintAnnotations, [refint.refintDatabaseCase]),
  },
  {
    family: tcn.tcnProofFamily,
    adapter: "tcn",
    schema: 'trig"ext',
    definitionFile: "packages/e2e/fixtures/tcn-proof-cases.ts",
    databaseFixtures: tcn.tcnDatabaseFixtureCount,
    databaseRoles: 0,
    unitCases: [tcn.tcnUnitCase, ...tcn.tcnSessionUnitCases],
    typesCases: [tcn.tcnTypesCase],
    databaseCases: [tcn.tcnDatabaseCase],
    members: triggerMembers(tcnAnnotations, [tcn.tcnDatabaseCase]),
  },
  {
    family: lo.loProofFamily,
    adapter: "lo",
    schema: 'lo "objects"',
    definitionFile: "packages/e2e/fixtures/lo-proof-cases.ts",
    databaseFixtures: lo.loDatabaseFixtureCount,
    databaseRoles: lo.loDatabaseRoleCount,
    unitCases: [...lo.loUnitProofCases],
    typesCases: [lo.loTypesProofCase],
    databaseCases: [...lo.loDatabaseProofCases],
    members: lo.loMemberProofs,
  },
  {
    family: prewarm.pgPrewarmProofFamily,
    adapter: "pg_prewarm",
    schema: 'warm "cache"',
    definitionFile: "packages/e2e/fixtures/pg_prewarm-proof-cases.ts",
    databaseFixtures: prewarm.pgPrewarmDatabaseFixtureCount,
    databaseRoles: prewarm.pgPrewarmDatabaseRoleCount,
    unitCases: [...prewarm.pgPrewarmUnitProofCases],
    typesCases: [prewarm.pgPrewarmTypesProofCase],
    databaseCases: [...prewarm.pgPrewarmDatabaseProofCases],
    members: prewarm.pgPrewarmMemberProofs,
  },
  {
    family: statistics.pgStatStatementsProofFamily,
    adapter: "pg_stat_statements",
    schema: 'stats "shared"',
    definitionFile: "packages/e2e/fixtures/pg_stat_statements-proof-cases.ts",
    databaseFixtures: statistics.pgStatStatementsDatabaseFixtureCount,
    databaseRoles: statistics.pgStatStatementsDatabaseRoleCount,
    unitCases: [...statistics.pgStatStatementsUnitProofCases],
    typesCases: [statistics.pgStatStatementsTypesProofCase],
    databaseCases: [...statistics.pgStatStatementsDatabaseProofCases],
    members: statistics.pgStatStatementsMemberProofs,
  },
  {
    family: jwt.pgJwtProofFamily,
    adapter: "pgjwt",
    schema: "Jwt 日本",
    definitionFile: "packages/e2e/fixtures/pgjwt-proof-cases.ts",
    databaseFixtures: jwt.pgJwtDatabaseFixtureCount,
    databaseRoles: 0,
    unitCases: [...jwt.pgJwtUnitProofCases],
    typesCases: [jwt.pgJwtTypesProofCase],
    databaseCases: [jwt.pgJwtRoutineProofCase, jwt.pgJwtTimeProofCase],
    members: jwt.pgJwtMemberProofs,
  },
  {
    family: earth.earthdistanceProofFamily,
    adapter: "earthdistance",
    schema: "Earth日本",
    definitionFile: "packages/e2e/fixtures/earthdistance-proof-cases.ts",
    databaseFixtures: earth.earthdistanceDatabaseFixtureCount,
    databaseRoles: earth.earthdistanceDatabaseRoleCount,
    unitCases: [...earth.earthdistanceUnitProofCases],
    typesCases: [earth.earthdistanceTypesProofCase],
    databaseCases: [...earth.earthdistanceDatabaseProofCases],
    members: earth.earthdistanceMemberProofs,
  },
  {
    family: seg.segProofFamily,
    adapter: "seg",
    schema: 'Seg"日本',
    definitionFile: "packages/e2e/fixtures/seg-proof-cases.ts",
    databaseFixtures: seg.segDatabaseFixtureCount,
    databaseRoles: seg.segDatabaseRoleCount,
    unitCases: [...seg.segUnitProofCases],
    typesCases: [seg.segTypesProofCase],
    databaseCases: [...seg.segDatabaseProofCases],
    members: seg.segMemberProofs,
  },
];
export const wave20UnitCases = wave20Proofs.flatMap((proof) => proof.unitCases);
export const wave20TypesCases = wave20Proofs.flatMap((proof) => proof.typesCases);
export const wave20DatabaseCases = wave20Proofs.flatMap((proof) => proof.databaseCases);
export function verifyWave20Roster(): void {
  extensionProofCasesDigest([...wave20UnitCases, ...wave20TypesCases, ...wave20DatabaseCases]);
  assert.equal(wave20Proofs.length, 10);
  assert.equal(new Set(wave20Proofs.map((proof) => proof.family.extension)).size, 10);
  for (const proof of wave20Proofs) {
    const manifest = JSON.parse(
      readFileSync(
        join(wave20Root, `apps/loom/src/tooling/extensions/manifests/${proof.family.extension}.json`),
        "utf8",
      ),
    );
    assert.equal(proof.family.manifestDigest, manifest.digest, "Family definition has a stale capture");
    assert.equal(proof.family.version, manifest.contract.version);
    assert.equal(proof.family.extension, manifest.contract.extension);
    assert.equal(proof.family.postgresMajor, manifest.contract.postgresMajor);
    assert.equal(proof.family.provider, manifest.contract.provider);
    assert.deepEqual(
      proof.members.map((member) => member.id).sort(),
      manifest.contract.members.map((member: { id: string }) => member.id).sort(),
      "Every captured member needs a proof disposition",
    );
    for (const definition of [...proof.unitCases, ...proof.typesCases, ...proof.databaseCases]) {
      assert.deepEqual(definition.families, [proof.family]);
      for (const claim of definition.claims) assert.deepEqual(claim.family, proof.family);
    }
  }
}
async function main(): Promise<void> {
  verifyWave20Roster();
  // These receipts are individual gates, never family acceptance or member witnesses.
  const root = wave20Root;
  const gate = process.argv[2];
  assert(gate === "unit" || gate === "types", "Usage: bun run-wave20-unit-types-proof.ts unit|types");
  const definitions = gate === "unit" ? wave20UnitCases : wave20TypesCases;
  const runId = `wave20.${gate}.${randomUUID()}`;
  const directory = realpathSync(mkdtempSync(join(tmpdir(), `kello-wave20-${gate}-`)));
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
  const adapters = wave20Proofs.map((proof) => proof.adapter);
  const graph = await build({
    absWorkingDir: root,
    entryPoints: [
      fileURLToPath(import.meta.url),
      ...(gate === "unit" ? [...new Set(definitions.map(({ file }) => file))] : []),
      ...wave20Proofs.map((proof) => proof.definitionFile),
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
    ...wave20Proofs.map((proof) => proof.definitionFile),
    ...wave20Proofs.map((proof) => `apps/loom/src/tooling/extensions/manifests/${proof.family.extension}.json`),
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
          files: [...new Set(definitions.map(({ file }) => join(root, file)))],
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
      ...new Set(definitions.map(({ file }) => relative(join(root, "packages/tests"), join(root, file)))),
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
    runnerVersion =
      /\bRUN\s+v([^\s]+)/.exec((result.stdout + result.stderr).replace(/\u001b\[[0-9;]*m/g, ""))?.[1] ?? "";
    assert(runnerVersion);
    const report = JSON.parse(readFileSync(join(directory, "vitest.json"), "utf8"));
    assert.equal(report.success, true);
    assert.equal(report.numFailedTests + report.numPendingTests + report.numTodoTests, 0);
    assert.equal(report.numPassedTests, report.numTotalTests);
    assert.equal(
      report.testResults.length,
      new Set(definitions.map(({ file }) => realpathSync(join(root, file)))).size,
    );
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
      assert.equal(
        suite.assertionResults.filter((test: { title: string }) => test.title === definition.title).length,
        1,
      );
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
}

if (import.meta.main) await main();
