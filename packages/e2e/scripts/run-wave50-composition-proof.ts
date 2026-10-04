import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import * as v from "valibot";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofReceipt,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { wave50Proofs } from "./run-wave50-unit-types-proof";
import { collectExtensionProofCases, type ExtensionProofEvent } from "../fixtures/extension-proof";
import { verifyPackedBuildSources } from "../fixtures/proof-artifact";

// One selected family generation or consumer gate. Only the Neon profile finalizes a receipt; the local profile is a
// characterization run that retains its observations but never writes host-receipt.json.
const root = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));
const driver = "packages/e2e/scripts/run-wave50-composition-proof.ts";
assert.equal(realpathSync(join(root, driver)), realpathSync(fileURLToPath(import.meta.url)));
const [extension, gate, profile] = process.argv.slice(2);
assert(
  (gate === "generation" || gate === "consumer") && (profile === "local" || profile === "neon"),
  "Usage: bun packages/e2e/scripts/run-wave50-composition-proof.ts <extension> generation|consumer local|neon",
);
const proof = wave50Proofs.find((item) => item.extension === extension);
assert(proof, "Choose a registered wave50 family");
const definitions = proof.cases.filter((item) => item.gate === gate);
assert.equal(definitions.length, 1);
const definition = definitions[0]!;
const generationFixtures = new Map([["postgres_fdw", 2]]);
const consumerFixtures = new Map([["postgres_fdw", 3]]);
const generationRoles = new Map([["postgres_fdw", 2]]);
const consumerRoles = new Map([["postgres_fdw", 2]]);
const directory = realpathSync(mkdtempSync(join(tmpdir(), `kello-wave50-${extension}-${gate}-proof-`)));
const runId = `wave50.${extension}.${gate}.${randomUUID()}`;
const eventsFile = join(directory, "cases.jsonl");
const fixturesFile = join(directory, "fixtures.jsonl");
const rolesFile = join(directory, "roles.jsonl");
const tarball = join(directory, "kello.tgz");
for (const file of [eventsFile, fixturesFile, rolesFile]) writeFileSync(file, "", { flag: "wx", mode: 0o600 });
function hash(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}
function sourcePath(file: string) {
  const physical = realpathSync(resolve(root, file));
  assert(physical.startsWith(root + sep), "Source escapes checkout");
  return relative(root, physical).split(sep).join("/");
}
const packageFiles: string[] = [];
function bindPackage(path: string) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) bindPackage(file);
    else if (entry.isFile()) packageFiles.push(sourcePath(file));
  }
}
// Both gates consume the complete current package: generation through the linked workspace install, consumer
// through its packed tarball. Bind every source, dist and bin byte before execution.
for (const path of ["apps/loom/src", "apps/loom/dist", "apps/loom/bin"]) bindPackage(join(root, path));
const { build }: Pick<typeof import("../../../apps/loom/node_modules/esbuild/lib/main.js"), "build"> = createRequire(
  join(root, "apps/loom/package.json"),
)("esbuild");
const graph = await build({
  absWorkingDir: root,
  entryPoints: [fileURLToPath(import.meta.url), definition.file],
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
const paths = [
  ...new Set([
    ...packageFiles,
    ...Object.keys(graph.metafile!.inputs).map(sourcePath),
    ...proof.sources[gate].map(sourcePath),
    sourcePath("apps/loom/node_modules/esbuild/lib/main.js"),
    driver,
    "bun.lock",
    "apps/loom/package.json",
    "packages/e2e/package.json",
    "packages/tests/tsconfig.json",
    "packages/ts-config/base.json",
    "packages/ts-config/bun.json",
  ]),
].sort();
function sources() {
  return paths.map((file) => ({ file, sha256: hash(readFileSync(join(root, file))) }));
}
function lines(file: string) {
  return readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
const before = sources();
const connectionFile = process.env.LOOM_PROOF_DATABASE_CONNECTION_FILE;
assert(connectionFile, "Supply an owned fixture connection file");
const address = new URL(readFileSync(connectionFile, "utf8").trim());
assert(["postgres:", "postgresql:"].includes(address.protocol));
let guardSha256: string | undefined;
if (profile === "neon") {
  const guardFile = process.env.LOOM_PROOF_NEON_GUARD_FILE;
  assert(guardFile, "Supply the host's fresh connected-Neon branch observation");
  const bytes = readFileSync(guardFile);
  const guard = JSON.parse(bytes.toString("utf8"));
  const age = Date.now() - Date.parse(guard.verifiedAt);
  assert(["connected-neon-api", "connected-neon-cli"].includes(guard.source) && age >= 0 && age < 600000);
  assert(guard.branch.primary === false && guard.branch.default === false && guard.branch.protected === false);
  assert(guard.branch.currentState === "ready" && Date.parse(guard.branch.expiresAt) > Date.now() + 120000);
  assert(guard.endpoint.type === "read_write" && guard.endpoint.disabled === false);
  assert(guard.endpoint.branchId === guard.branch.id && guard.endpoint.projectId === guard.branch.projectId);
  assert(address.hostname === guard.endpoint.host && address.hostname.split(".")[0] === guard.endpoint.id);
  guardSha256 = hash(bytes);
} else assert(address.hostname === "localhost" || address.hostname === "127.0.0.1");
// The generation file registers several families' cases; the exact anchored title runs only selected family's.
const escapedTitle = definition.title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const command = ["bun", "test", "--timeout", "360000", definition.file, "-t", `^${escapedTitle}$`];
const version = spawnSync("bun", ["--version"], { encoding: "utf8" });
assert.equal(version.status, 0);
const env: NodeJS.ProcessEnv = {
  ...process.env,
  CI: "1",
  LOOM_TEST_DATABASE_URL: address.href,
  LOOM_EXTENSION_PROOF_RUN_ID: runId,
  LOOM_EXTENSION_PROOF_OUTPUT: eventsFile,
  LOOM_EXTENSION_PROOF_FIXTURE_OUTPUT: fixturesFile,
  LOOM_EXTENSION_PROOF_ROLE_OUTPUT: rolesFile,
  LOOM_EXTENSION_PROOF_PACKED_OUTPUT: directory,
};
const archive = process.env.LOOM_PROOF_CONSUMER_ARCHIVE;
if (gate === "consumer") {
  assert(archive, "Supply the parent-built archive");
  env.LOOM_EXTENSION_PROOF_ARTIFACT = tarball;
  env.LOOM_HYPOPG_TARBALL = archive;
  env.LOOM_NEON_UTILS_TARBALL = archive;
}
const result = spawnSync(command[0]!, command.slice(1), {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
  env,
});
let log = result.stdout + result.stderr;
for (const secret of [address.href, address.password, decodeURIComponent(address.password)])
  if (secret) log = log.replaceAll(secret, "[REDACTED]");
writeFileSync(join(directory, "runner.log"), log.replace(/postgres(?:ql)?:\/\/\S+/g, "[REDACTED_URL]"), {
  mode: 0o600,
});
// Cleanup is independently checked even when the child failed; a failed run never becomes a receipt.
const fixtures = lines(fixturesFile);
const names = [...new Set<string>(fixtures.filter((event) => event.kind === "attempted").map((event) => event.name))];
const roles = lines(rolesFile);
const client = new pg.Client({ connectionString: address.href });
try {
  await client.connect();
  const server = await client.query("SELECT current_setting('server_version_num') AS number");
  assert.equal(Math.floor(Number(server.rows[0].number) / 10000), 18);
  const cleanup = {
    databases: (await client.query("SELECT datname FROM pg_catalog.pg_database WHERE datname=ANY($1::text[])", [names]))
      .rows,
    roles: (
      await client.query("SELECT rolname FROM pg_catalog.pg_roles WHERE rolname=ANY($1::text[])", [
        roles.map((role) => role.name),
      ])
    ).rows,
  };
  writeFileSync(join(directory, "independent-cleanup.json"), JSON.stringify(cleanup, null, 2) + "\n", { mode: 0o600 });
  assert.deepEqual(cleanup, { databases: [], roles: [] }, "Owned fixtures or roles remain");
} finally {
  await client.end();
}
if (result.error) throw result.error;
assert.equal(result.signal, null, `Runner was interrupted; see ${directory}`);
assert.equal(result.status, 0, `Runner failed; see ${directory}`);
// Check the exact family-specific database and role inventory journaled before preparation.
assert.equal(
  names.length,
  (gate === "consumer" ? consumerFixtures : generationFixtures).get(proof.extension),
  "Unexpected owned fixture count",
);
for (const name of names) {
  assert(/^loom_ext_[a-f0-9]{32}$/.test(name));
  const owned = fixtures.filter((event) => event.name === name);
  assert(owned.every((event) => event.runId === runId && event.sha256 === hash(Buffer.from(name))));
  assert.deepEqual(
    owned.map((event) => event.kind),
    ["attempted", "created", "dropped"],
  );
}
const roleNames = [...new Set<string>(roles.map((event) => event.name))];
assert.equal(
  roleNames.length,
  (gate === "consumer" ? consumerRoles : generationRoles).get(proof.extension),
  "Unexpected owned role count",
);
for (const event of roles) {
  assert.equal(event.runId, runId);
  assert(/^loom_fdw_rpc_[a-f0-9]{32}$/.test(event.name));
  assert.equal(event.sha256, hash(Buffer.from(event.name)));
}
// Bun's own tally must show exactly one executed, passing test.
assert.match(log, /^\s*1 pass$/m, "Bun did not report exactly one passing test");
assert.match(log, /^\s*0 fail$/m, "Bun reported a failing test");
// Sibling cases in the same file register at module load. They must be exact, well-formed generation or consumer
// definitions that never started; only selected family's events reach the exact-case collector.
const events: ExtensionProofEvent[] = lines(eventsFile);
const foreign = events.filter(
  (event) => (event.kind === "registered" ? event.definition.id : event.caseId) !== definition.id,
);
for (const event of foreign) {
  assert.equal(event.runId, runId, "Stale or foreign proof run");
  assert.equal(event.kind, "registered", "A sibling proof case executed inside the selected family gate");
  assert(
    ["generation", "consumer"].includes(event.definition.gate),
    "Foreign case registered for a non-composition gate",
  );
  extensionProofCasesDigest([event.definition]);
}
assert.equal(new Set(foreign.map((event) => event.kind === "registered" && event.definition.id)).size, foreign.length);
const cases = collectExtensionProofCases({
  runId,
  expected: [definition],
  events: events.filter((event) => !foreign.includes(event)),
  exitCode: result.status,
});
const after = sources();
assert.equal(
  extensionProofSourcesDigest(before),
  extensionProofSourcesDigest(after),
  `Source bytes changed during composition proof: ${after
    .filter((source, index) => source.sha256 !== before[index]!.sha256)
    .map((source) => source.file)
    .join(", ")}`,
);
const afterVersion = spawnSync("bun", ["--version"], { encoding: "utf8" });
assert.equal(afterVersion.status, 0);
assert.equal(afterVersion.stdout, version.stdout);
const base = {
  format: 2 as const,
  runId,
  finalizedBy: "host" as const,
  runner: { name: "bun" as const, version: version.stdout.trim() },
  command,
  exitCode: 0,
  sourcesBefore: before,
  sourcesAfter: after,
  definitionsDigest: extensionProofCasesDigest([definition]),
  cases,
  totals: { passed: 1, failed: 0, skipped: 0, todo: 0, incomplete: 0 },
};
let receipt: ExtensionProofReceipt;
if (gate === "consumer") {
  // The consumer body must write this only after its cold frozen install, declarations, runtime, bundle and native
  // checks all passed. Without it the gate stays pending; the host never infers these flags.
  const observationFile = join(directory, "consumer.json");
  assert(existsSync(observationFile), `Packed consumer wrote no observation; retained diagnostics at ${directory}`);
  const observation = v.parse(
    v.strictObject({
      runId: v.literal(runId),
      nodeVersion: v.pipe(v.string(), v.regex(/^v24\.\d+\.\d+$/)),
      installation: v.literal("isolated"),
      frozenReinstallPassed: v.literal(true),
      declarationsPassed: v.literal(true),
      runtimePassed: v.literal(true),
      selectedBundleChecksPassed: v.literal(true),
      tarballSha256: v.pipe(v.string(), v.regex(/^[a-f0-9]{64}$/)),
    }),
    JSON.parse(readFileSync(observationFile, "utf8")),
  );
  const nativeVersion = spawnSync("node", ["--version"], { encoding: "utf8" });
  assert.equal(nativeVersion.status, 0);
  assert.equal(nativeVersion.stdout.trim(), observation.nodeVersion);
  const bytes = readFileSync(tarball);
  const tarballSha256 = hash(bytes);
  assert.equal(observation.tarballSha256, tarballSha256, "Consumer observed different tarball bytes");
  const { runId: _observedRunId, tarballSha256: _observedTarball, ...packageObservation } = observation;
  receipt = {
    ...base,
    gate,
    package: {
      ...packageObservation,
      tarballSha256,
      buildSources: before.filter((source) => source.file.startsWith("apps/loom/dist/")),
    },
  };
  assert.equal(verifyPackedBuildSources(bytes, receipt.package.buildSources).tarballSha256, tarballSha256);
} else receipt = { ...base, gate };
const receiptDigest = extensionProofReceiptDigest(receipt);
const receiptFile = profile === "neon" ? "host-receipt.json" : "local-characterization-receipt.json";
writeFileSync(join(directory, receiptFile), JSON.stringify(receipt, null, 2) + "\n", { mode: 0o600 });
writeFileSync(
  join(directory, "host-summary.json"),
  JSON.stringify(
    {
      runId,
      gate,
      profile,
      receiptFile,
      receiptDigest,
      guardSha256,
      sourceCount: before.length,
      hostDriverSha256: before.find((source) => source.file === driver)?.sha256,
      siblingRegistrations: foreign.length,
      databaseFixtures: names.length,
      databaseRoles: roles.length,
      independentCleanupReadback: true,
      fullFamilyAcceptance: false,
    },
    null,
    2,
  ) + "\n",
  { mode: 0o600 },
);
console.log(
  JSON.stringify({ directory, gate, profile, receiptDigest, cases: cases.length, fullFamilyAcceptance: false }),
);
