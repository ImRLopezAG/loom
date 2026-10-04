import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import * as v from "valibot";
import { collectExtensionProofCases } from "../fixtures/extension-proof";
import { verifyPackedBuildSources } from "../fixtures/proof-artifact";
import { wave20GenerationProofCase } from "../fixtures/wave20-generation-proof-cases";
import { wave20ConsumerProofCase } from "../fixtures/wave20-consumer-proof-cases";
import { wave20Proofs } from "./run-wave20-unit-types-proof";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofReceipt,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

const root = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));
const gate = process.argv[2];
assert(gate === "generation" || gate === "consumer", "Usage: bun run-wave20-composition-proof.ts generation|consumer");
const definition = gate === "generation" ? wave20GenerationProofCase : wave20ConsumerProofCase;
const directory = realpathSync(mkdtempSync(join(tmpdir(), `kello-wave20-${gate}-proof-`)));
const runId = `wave20.adapters.${gate}.${randomUUID()}`;
const eventsFile = join(directory, "cases.jsonl");
const fixturesFile = join(directory, "fixtures.jsonl");
const rolesFile = join(directory, "roles.jsonl");
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
function bindPackage(directory: string) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = join(directory, entry.name);
    if (entry.isDirectory()) bindPackage(file);
    else if (entry.isFile()) packageFiles.push(sourcePath(file));
  }
}
// Bind the complete current package and its actual dist bytes before packing/generation.
// This deliberately broad roster does not waive source freshness for other families.
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
  outdir: join(directory, "graph"),
});
const paths = [
  ...new Set([
    ...packageFiles,
    ...Object.keys(graph.metafile!.inputs).map(sourcePath),
    ...wave20Proofs.map((proof) => sourcePath(proof.definitionFile)),
    "bun.lock",
    "apps/loom/package.json",
    "packages/e2e/package.json",
    "packages/tests/tsconfig.json",
    "packages/ts-config/base.json",
    "packages/ts-config/bun.json",
  ]),
].sort();
function sources() {
  return paths.map((file) => ({ file, sha256: hash(readFileSync(join(root, sourcePath(file)))) }));
}
function lines(file: string) {
  return readFileSync(file, "utf8")
    .trim()
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}
const before = sources();
let address: URL | undefined;
let guardSha256: string | undefined;
if (gate === "generation") {
  const connectionFile = process.env.LOOM_PROOF_DATABASE_CONNECTION_FILE;
  const guardFile = process.env.LOOM_PROOF_NEON_GUARD_FILE;
  assert(connectionFile && guardFile, "Generation needs the owned Neon connection and fresh guard files");
  address = new URL(readFileSync(connectionFile, "utf8").trim());
  assert(["postgres:", "postgresql:"].includes(address.protocol));
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
}
const command = ["bun", "test", "--timeout", "120000", definition.file];
const version = spawnSync("bun", ["--version"], { encoding: "utf8" });
assert.equal(version.status, 0);
const env: NodeJS.ProcessEnv = {
  ...process.env,
  CI: "1",
  LOOM_EXTENSION_PROOF_RUN_ID: runId,
  LOOM_EXTENSION_PROOF_OUTPUT: eventsFile,
  LOOM_EXTENSION_PROOF_FIXTURE_OUTPUT: fixturesFile,
  LOOM_EXTENSION_PROOF_ROLE_OUTPUT: rolesFile,
  LOOM_EXTENSION_PROOF_PACKED_OUTPUT: directory,
};
if (address) env.LOOM_TEST_DATABASE_URL = address.href;
const result = spawnSync(command[0]!, command.slice(1), {
  cwd: root,
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
  env,
});
let log = result.stdout + result.stderr;
if (address)
  for (const secret of [address.href, address.password, decodeURIComponent(address.password)])
    if (secret) log = log.replaceAll(secret, "[REDACTED]");
writeFileSync(join(directory, "runner.log"), log.replace(/postgres(?:ql)?:\/\/\S+/g, "[REDACTED_URL]"), {
  mode: 0o600,
});
// Cleanup is independently checked even when the child failed; a failed run never becomes a receipt.
if (address) {
  const fixtures = lines(fixturesFile);
  const names = [...new Set<string>(fixtures.filter((event) => event.kind === "attempted").map((event) => event.name))];
  if (result.status === 0) assert.equal(names.length, 1);
  else assert(names.length <= 1, "Unexpected database fixture count in failed generation");
  for (const name of names) {
    assert(/^loom_ext_[a-f0-9]{32}$/.test(name));
    const owned = fixtures.filter((event) => event.name === name);
    assert(owned.every((event) => event.runId === runId && event.sha256 === hash(Buffer.from(name))));
    assert.deepEqual(
      owned.map((event) => event.kind),
      ["attempted", "created", "dropped"],
    );
  }
  const roles = lines(rolesFile);
  if (result.status === 0) assert.equal(roles.length, 1);
  else assert(roles.length <= 1, "Unexpected role fixture count in failed generation");
  assert(
    roles.every(
      (role) =>
        role.runId === runId &&
        /^gen_wave_[a-f0-9]{32}$/.test(role.name) &&
        role.sha256 === hash(Buffer.from(role.name)),
    ),
  );
  const client = new pg.Client({ connectionString: address.href });
  try {
    await client.connect();
    const server = await client.query("SELECT current_setting('server_version_num') AS number");
    assert.equal(Math.floor(Number(server.rows[0].number) / 10000), 18);
    assert.deepEqual(
      (await client.query("SELECT datname FROM pg_catalog.pg_database WHERE datname=ANY($1::text[])", [names])).rows,
      [],
    );
    assert.deepEqual(
      (
        await client.query("SELECT rolname FROM pg_catalog.pg_roles WHERE rolname=ANY($1::text[])", [
          roles.map((role) => role.name),
        ])
      ).rows,
      [],
    );
  } finally {
    await client.end();
  }
}
if (result.error) throw result.error;
assert.equal(result.signal, null);
const cases = collectExtensionProofCases({
  runId,
  expected: [definition],
  events: lines(eventsFile),
  exitCode: result.status,
});
const after = sources();
assert.equal(
  extensionProofSourcesDigest(before),
  extensionProofSourcesDigest(after),
  "Source bytes changed during composition proof",
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
  const observation = v.parse(
    v.strictObject({
      runId: v.literal(runId),
      nodeVersion: v.pipe(v.string(), v.regex(/^v\d+\.\d+\.\d+$/)),
      installation: v.literal("isolated"),
      frozenReinstallPassed: v.literal(true),
      declarationsPassed: v.literal(true),
      runtimePassed: v.literal(true),
      selectedBundleChecksPassed: v.literal(true),
    }),
    JSON.parse(readFileSync(join(directory, "consumer.json"), "utf8")),
  );
  const nativeVersion = spawnSync("node", ["--version"], { encoding: "utf8" });
  assert.equal(nativeVersion.status, 0);
  assert.equal(nativeVersion.stdout.trim(), observation.nodeVersion);
  const { runId: observedRunId, ...packageObservation } = observation;
  assert.equal(observedRunId, runId);
  const tarballSha256 = hash(readFileSync(join(directory, "kello.tgz")));
  receipt = {
    ...base,
    gate,
    package: {
      ...packageObservation,
      tarballSha256,
      buildSources: before.filter((source) => source.file.startsWith("apps/loom/dist/")),
    },
  };
  assert.equal(
    verifyPackedBuildSources(readFileSync(join(directory, "kello.tgz")), receipt.package.buildSources).tarballSha256,
    tarballSha256,
  );
} else receipt = { ...base, gate };
const receiptDigest = extensionProofReceiptDigest(receipt);
writeFileSync(join(directory, "host-receipt.json"), JSON.stringify(receipt, null, 2) + "\n", { mode: 0o600 });
writeFileSync(
  join(directory, "host-summary.json"),
  JSON.stringify(
    {
      runId,
      gate,
      receiptDigest,
      guardSha256,
      sourceCount: before.length,
      independentCleanupReadback: Boolean(address),
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
