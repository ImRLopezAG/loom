import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import * as v from "valibot";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { extensionContractDigest } from "../../../apps/loom/src/core/extensions/registry";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofReceipt,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  rdkitOrdinaryProofCase,
  rdkitSchemaProofCase,
  rdkitGraphProofCase,
  rdkitToolingProofCase,
  rdkitProofFamily,
} from "../fixtures/rdkit-proof-cases";
const rdkitDatabaseProofCases = [
  rdkitOrdinaryProofCase,
  rdkitSchemaProofCase,
  rdkitGraphProofCase,
  rdkitToolingProofCase,
];
const rdkitProofSchema = 'Chem"日本';
const rdkitGateProofSources = {
  database: [
    "apps/loom/src/core/extensions/adapters/rdkit.ts",
    "apps/loom/src/core/extensions/adapters/rdkit-codecs.ts",
    "apps/loom/src/tooling/extensions/annotations/rdkit.ts",
    "apps/loom/src/tooling/extensions/manifests/rdkit.json",
    "apps/loom/src/tooling/extensions/operations/rdkit.ts",
    "packages/e2e/fixtures/rdkit-proof-cases.ts",
    "apps/loom/package.json",
    "bun.lock",
  ],
};
import { collectExtensionProofCases } from "../fixtures/extension-proof";
import { collectExtensionProofDatabaseObservations } from "../fixtures/extension-proof-database";

// This host records the rdkit database gate only. It cannot accept the family or replace the other four gates.
const root = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));
const driver = "packages/e2e/scripts/run-rdkit-database-proof.ts";
assert.equal(realpathSync(join(root, driver)), realpathSync(fileURLToPath(import.meta.url)));
const profile = process.argv[2];
assert(
  profile === "local" || profile === "neon",
  "Usage: bun packages/e2e/scripts/run-rdkit-database-proof.ts local|neon",
);
const connectionFile = process.env.LOOM_PROOF_DATABASE_CONNECTION_FILE;
assert(connectionFile, "Supply an owned fixture connection file");
const address = new URL(readFileSync(connectionFile, "utf8").trim());
assert(["postgres:", "postgresql:"].includes(address.protocol));
function hash(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}
let guardSource: { sha256: string; verifiedAt: string } | undefined;
if (profile === "neon") {
  const guardFile = process.env.LOOM_PROOF_NEON_GUARD_FILE;
  assert(guardFile, "Supply the host's fresh connected-Neon branch observation");
  const bytes = readFileSync(guardFile);
  const guard = JSON.parse(bytes.toString("utf8"));
  const age = Date.now() - Date.parse(guard.verifiedAt);
  assert(["connected-neon-api", "connected-neon-cli"].includes(guard.source) && age >= 0 && age < 600000);
  assert(guard.branch.primary === false && guard.branch.default === false && guard.branch.protected === false);
  assert(guard.branch.currentState === "ready" && Date.parse(guard.branch.expiresAt) > Date.now() + 120000);
  assert(guard.endpoint.branchId === guard.branch.id && guard.endpoint.projectId === guard.branch.projectId);
  assert(guard.endpoint.type === "read_write" && guard.endpoint.disabled === false);
  assert(address.hostname === guard.endpoint.host && address.hostname.split(".")[0] === guard.endpoint.id);
  guardSource = { sha256: hash(bytes), verifiedAt: guard.verifiedAt };
} else assert(address.hostname === "localhost" || address.hostname === "127.0.0.1");

const definitions = rdkitDatabaseProofCases;
assert.equal(definitions.length, 4, "RDKit registers exactly four native database cases");
const files = [...new Set(definitions.map(({ file }) => file))];
const runId = `rdkit.database.${randomUUID()}`;
const directory = realpathSync(mkdtempSync(join(tmpdir(), "loom-rdkit-database-proof-")));
const outputs = {
  cases: join(directory, "cases.jsonl"),
  observations: join(directory, "database.jsonl"),
  fixtures: join(directory, "fixtures.jsonl"),
  roles: join(directory, "roles.jsonl"),
};
for (const file of Object.values(outputs)) writeFileSync(file, "", { flag: "wx", mode: 0o600 });
const command = ["bun", "test", "--timeout", "180000", ...files];
const { build }: Pick<typeof import("../../../apps/loom/node_modules/esbuild/lib/main.js"), "build"> = createRequire(
  join(root, "apps/loom/package.json"),
)("esbuild");

function sourcePath(path: string) {
  const physical = realpathSync(resolve(root, path));
  assert(physical.startsWith(root + sep), "Proof source escapes checkout");
  return relative(root, physical).split(sep).join("/");
}
// The actual import graph of this host and the native case, plus the registered gate sources and runner identity.
async function sources() {
  const graph = await build({
    absWorkingDir: root,
    entryPoints: [fileURLToPath(import.meta.url), ...files],
    bundle: true,
    write: false,
    metafile: true,
    platform: "node",
    format: "esm",
    packages: "external",
    target: "esnext",
    external: ["bun:test"],
    outdir: join(directory, "graph"),
  });
  const paths = new Set(Object.keys(graph.metafile!.inputs).map(sourcePath));
  for (const file of rdkitGateProofSources.database) paths.add(sourcePath(file));
  paths.add(sourcePath("apps/loom/node_modules/esbuild/lib/main.js"));
  paths.add(driver);
  return [...paths].sort().map((file) => ({ file, sha256: hash(readFileSync(join(root, file))) }));
}
function readLines(file: string) {
  return readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
function bunVersion() {
  const result = spawnSync("bun", ["--version"], { encoding: "utf8" });
  assert.equal(result.status, 0);
  return result.stdout.trim();
}

const admin = new pg.Client({ connectionString: address.href });
try {
  await admin.connect();
  const server = (
    await admin.query("SELECT current_setting('server_version_num') AS number, current_database() AS database")
  ).rows[0];
  assert.equal(Math.floor(Number(server.number) / 10000), 18);
  const available = await admin.query(
    "SELECT version FROM pg_catalog.pg_available_extension_versions WHERE name='rdkit' AND version=$1",
    [rdkitProofFamily.version],
  );
  assert.equal(available.rowCount, 1, "Target does not offer the exact selected rdkit version");
  const before = await sources();
  const version = bunVersion();
  const started = new Date().toISOString();
  const result = spawnSync(command[0]!, command.slice(1), {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
    env: {
      ...process.env,
      CI: "1",
      LOOM_TEST_DATABASE_URL: address.href,
      LOOM_EXTENSION_PROOF_RUN_ID: runId,
      LOOM_EXTENSION_PROOF_OUTPUT: outputs.cases,
      LOOM_EXTENSION_PROOF_DATABASE_OUTPUT: outputs.observations,
      LOOM_EXTENSION_PROOF_FIXTURE_OUTPUT: outputs.fixtures,
      LOOM_EXTENSION_PROOF_ROLE_OUTPUT: outputs.roles,
      LOOM_EXTENSION_PROOF_PROVIDER: profile === "neon" ? "neon" : "postgres",
    },
  });
  let diagnostic = result.stdout + result.stderr;
  for (const secret of [address.href, address.password, decodeURIComponent(address.password)])
    if (secret) diagnostic = diagnostic.replaceAll(secret, "[REDACTED]");
  writeFileSync(join(directory, "native.log"), diagnostic.replace(/postgres(?:ql)?:\/\/\S+/g, "[REDACTED_URL]"), {
    mode: 0o600,
  });
  // Cleanup is read back independently, even when the child failed; a failed run never becomes a receipt.
  const fixtures = readLines(outputs.fixtures);
  const attempted = [
    ...new Set<string>(fixtures.filter((event) => event.kind === "attempted").map((event) => event.name)),
  ];
  const roles = readLines(outputs.roles);
  const cleanup = {
    databases: (
      await admin.query("SELECT datname FROM pg_catalog.pg_database WHERE datname=ANY($1::text[])", [attempted])
    ).rows,
    roles: (
      await admin.query("SELECT rolname FROM pg_catalog.pg_roles WHERE rolname=ANY($1::text[])", [
        roles.map((role) => role.name),
      ])
    ).rows,
  };
  writeFileSync(join(directory, "independent-cleanup.json"), JSON.stringify(cleanup, null, 2) + "\n", { mode: 0o600 });
  assert.deepEqual(cleanup, { databases: [], roles: [] }, "Owned native fixtures or roles remain");
  if (result.error) throw result.error;
  assert.equal(result.signal, null, `Native runner was interrupted; see ${directory}`);
  assert.equal(result.status, 0, `Native runner failed; see ${directory}`);
  // Each exact case owns a separate database; this native suite creates no roles.
  assert.equal(attempted.length, 4, "RDKit owns exactly four database fixtures");
  for (const name of attempted) {
    assert(/^loom_rdkit_[a-f0-9]{32}$/.test(name));
    const owned = fixtures.filter((event) => event.name === name);
    assert(owned.every((event) => event.runId === runId && event.sha256 === hash(Buffer.from(name))));
    assert.deepEqual(
      owned.map((event) => event.kind),
      ["attempted", "created", "dropped"],
    );
  }
  assert.equal(roles.length, 0, "RDKit native proof creates no roles");
  const after = await sources();
  assert.equal(extensionProofSourcesDigest(before), extensionProofSourcesDigest(after), "Sources changed during proof");
  assert.equal(bunVersion(), version, "Runner changed during proof");
  const cases = collectExtensionProofCases({
    runId,
    expected: definitions,
    events: readLines(outputs.cases),
    exitCode: result.status,
  });
  const observations = collectExtensionProofDatabaseObservations({
    runId,
    expectedCaseIds: definitions.map(({ id }) => id),
    observations: readLines(outputs.observations),
  });
  // A local contract has a different provider identity and cannot satisfy the Neon gate; its captured shape must
  // still equal the reviewed pinned SQL contract.
  const reviewed = v.parse(
    extensionManifestValidator,
    JSON.parse(readFileSync(join(root, "apps/loom/src/tooling/extensions/manifests/rdkit.json"), "utf8")),
  );
  assert.equal(reviewed.digest, rdkitProofFamily.manifestDigest);
  const observedEnvironments = observations.map((observation) => {
    const installation = observation.manifest;
    assert.equal(
      installation.digest,
      profile === "neon"
        ? rdkitProofFamily.manifestDigest
        : extensionContractDigest({ ...reviewed.contract, provider: "postgres" }),
      "Installed rdkit contract differs from the pinned manifest",
    );
    assert.equal(installation.contract.extension, "rdkit");
    assert.equal(installation.contract.version, rdkitProofFamily.version);
    assert.equal(installation.contract.postgresMajor, 18);
    assert.equal(installation.contract.provider, profile === "neon" ? "neon" : "postgres");
    assert.equal(installation.provenance.installationSchema, rdkitProofSchema);
    assert(attempted.some((name) => hash(Buffer.from(name)) === observation.databaseFingerprint));
    const witnesses = cases.find(({ id }) => id === observation.caseId)!.witnesses;
    assert.equal(
      witnesses.length,
      definitions.find((definition) => definition.id === observation.caseId)!.claims.length,
    );
    assert(witnesses.every((witness) => witness.schema === installation.provenance.installationSchema));
    return {
      ...rdkitProofFamily,
      manifestDigest: installation.digest,
      provider: installation.contract.provider,
      schema: installation.provenance.installationSchema,
    };
  });
  const environment = observedEnvironments[0];
  assert(environment, "Missing exact native RDKit environment");
  for (const observed of observedEnvironments)
    assert.deepEqual(observed, environment, "Native RDKit cases observed different family environments");
  const observed = [environment];
  const receipt: ExtensionProofReceipt = {
    format: 2,
    runId,
    gate: "database",
    finalizedBy: "host",
    runner: { name: "bun", version },
    command,
    exitCode: 0,
    sourcesBefore: before,
    sourcesAfter: after,
    definitionsDigest: extensionProofCasesDigest(definitions),
    cases,
    totals: { passed: definitions.length, failed: 0, skipped: 0, todo: 0, incomplete: 0 },
    database: {
      provider: profile === "neon" ? "neon" : "postgres",
      postgresMajor: 18,
      serverVersion: String(server.number),
      targetFingerprint: hash(Buffer.from(JSON.stringify([address.hostname, address.port, server.database]))),
      observed,
      fixtureCleanupCompleted: true,
    },
  };
  const receiptDigest = extensionProofReceiptDigest(receipt);
  writeFileSync(join(directory, "host-receipt.json"), JSON.stringify(receipt, null, 2) + "\n", { mode: 0o600 });
  writeFileSync(
    join(directory, "host-summary.json"),
    JSON.stringify(
      {
        runId,
        profile,
        receiptDigest,
        started,
        completed: new Date().toISOString(),
        sourceCount: before.length,
        hostDriverSha256: before.find((source) => source.file === driver)?.sha256,
        guardSource,
        databaseFixtures: attempted.length,
        databaseRoles: roles.length,
        fullFamilyAcceptance: false,
      },
      null,
      2,
    ) + "\n",
    { mode: 0o600 },
  );
  console.log(
    JSON.stringify({ directory, runId, profile, receiptDigest, cases: cases.length, fullFamilyAcceptance: false }),
  );
} finally {
  await admin.end();
}
