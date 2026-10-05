import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { mkdtempSync, readdirSync, readFileSync, realpathSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import pg from "pg";
import * as v from "valibot";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofReceipt,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { collectExtensionProofCases } from "../fixtures/extension-proof";
import {
  lakebaseTokenizerConsumerProofCase,
  lakebaseTokenizerGenerationProofCase,
} from "../fixtures/lakebase-tokenizer-proof-cases";
import { lakebaseTokenizerGateProofSources } from "../fixtures/lakebase-tokenizer-semantic-proof";
import {
  assertInstalledPackageMatchesTarball,
  consumerLockfileSha256,
  verifyPackedBuildSources,
} from "../fixtures/proof-artifact";

// Parent-owned host. It verifies the ephemeral provider target before allowing the exact repository case to run.
const root = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));
const gate = process.argv[2];
assert(
  gate === "generation" || gate === "consumer",
  "Usage: bun run-lakebase-tokenizer-public-proof.ts generation|consumer",
);
const connectionFile = process.env.LOOM_PROOF_DATABASE_CONNECTION_FILE;
const guardFile = process.env.LOOM_PROOF_NEON_GUARD_FILE;
const preparationFile = process.env.LOOM_PROOF_CONSUMER_PREPARATION_FILE;
assert(connectionFile && guardFile && preparationFile);
const address = new URL(readFileSync(connectionFile, "utf8").trim());
const guardBytes = readFileSync(guardFile);
const guard = JSON.parse(guardBytes.toString("utf8"));
const age = Date.now() - Date.parse(guard.verifiedAt);
assert(guard.source === "connected-neon-cli" && age >= 0 && age < 600000);
assert(guard.branch.primary === false && guard.branch.default === false && guard.branch.protected === false);
assert(guard.branch.currentState === "ready" && Date.parse(guard.branch.expiresAt) > Date.now() + 420000);
assert(guard.endpoint.branchId === guard.branch.id && guard.endpoint.projectId === guard.branch.projectId);
assert(guard.endpoint.type === "read_write" && guard.endpoint.disabled === false);
assert.equal(address.hostname, guard.endpoint.host);
assert.equal(address.hostname.split(".")[0], guard.endpoint.id);
assert.equal(address.searchParams.get("sslmode"), "verify-full");
const preparation = JSON.parse(readFileSync(preparationFile, "utf8"));
assert.equal(preparation.coldFrozenReinstall, true);
const artifact = readFileSync(preparation.artifact);
const hash = (bytes: Uint8Array) => createHash("sha256").update(bytes).digest("hex");
assert.equal(hash(artifact), preparation.artifactHash);
assert.equal(await consumerLockfileSha256(preparation.root), preparation.lockfileSha256);
const installedFiles = await assertInstalledPackageMatchesTarball(preparation.root, artifact);
const definition = gate === "generation" ? lakebaseTokenizerGenerationProofCase : lakebaseTokenizerConsumerProofCase;
const runId = `lakebase_tokenizer.${gate}.${randomUUID()}`;
const directory = realpathSync(mkdtempSync(join(tmpdir(), `kello-tokenizer-${gate}-proof-`)));
const files = {
  cases: join(directory, "cases.jsonl"),
  fixtures: join(directory, "fixtures.jsonl"),
  roles: join(directory, "roles.jsonl"),
};
for (const file of Object.values(files)) writeFileSync(file, "", { flag: "wx", mode: 0o600 });
const command = ["bun", "test", definition.file];
const node = process.env.LOOM_LAKEBASE_TOKENIZER_NODE24;
assert(node, "The parent supplies an actual Node 24 executable");
function execute(command: string[], env = process.env) {
  const child = spawnSync(command[0]!, command.slice(1), {
    cwd: root,
    env,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  assert.equal(child.error, undefined);
  return child;
}
const nodeProbe = execute([node, "--version"]);
assert.equal(nodeProbe.status, 0);
assert(nodeProbe.stdout.trim().startsWith("v24."));
const bunProbe = execute(["bun", "--version"]);
assert.equal(bunProbe.status, 0);
const { build }: Pick<typeof import("../../../apps/loom/node_modules/esbuild/lib/main.js"), "build"> = createRequire(
  join(root, "apps/loom/package.json"),
)("esbuild");
const manifest = JSON.parse(readFileSync(join(root, "apps/loom/package.json"), "utf8"));
function sourcePath(path: string) {
  const physical = realpathSync(resolve(root, path));
  assert(physical.startsWith(root + sep), "Proof source escapes checkout");
  return relative(root, physical).split(sep).join("/");
}
function publicExport(specifier: string) {
  const key = specifier === "kello" ? "." : `./${specifier.slice("kello/".length)}`;
  const target = manifest.exports[key];
  const direct = v.safeParse(v.string(), target);
  const conditional = direct.success
    ? { import: direct.output, default: undefined }
    : v.parse(v.object({ import: v.optional(v.string()), default: v.optional(v.string()) }), target);
  const entry = v.parse(v.pipe(v.string(), v.startsWith("./dist/")), conditional.import ?? conditional.default);
  return realpathSync(join(root, "apps/loom", entry));
}
const graph = await build({
  absWorkingDir: root,
  entryPoints: [fileURLToPath(import.meta.url), definition.file],
  bundle: true,
  write: false,
  metafile: true,
  platform: "node",
  format: "esm",
  target: "esnext",
  outdir: join(directory, "graph"),
  plugins: [
    {
      name: "public-package-exports",
      setup(builder) {
        builder.onResolve({ filter: /^[^./]/ }, (args) => {
          if (args.kind === "entry-point") return;
          if (args.path === "kello" || args.path.startsWith("kello/")) return { path: publicExport(args.path) };
          return { path: args.path, external: true };
        });
      },
    },
  ],
});
const paths = new Set([
  ...Object.keys(graph.metafile!.inputs).map(sourcePath),
  ...lakebaseTokenizerGateProofSources[gate],
]);
// Freeze the complete package source/output trees. Generated fixture strings and public package chunks are included
// even when their imports are loaded dynamically by Bun, Node, or the generated project compiler.
function addTree(directory: string) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) addTree(path);
    else {
      assert(entry.isFile());
      paths.add(sourcePath(path));
    }
  }
}
addTree(join(root, "apps/loom/src"));
addTree(join(root, "apps/loom/dist"));
for (const file of [
  "apps/loom/package.json",
  "apps/loom/vite.config.ts",
  "apps/loom/scripts/third-party.ts",
  "bun.lock",
  "packages/e2e/package.json",
  "packages/ts-config/bun.json",
  "packages/e2e/fixtures/lakebase-tokenizer-generated-setup.mjs.fixture",
  "packages/e2e/fixtures/lakebase-tokenizer-generated-rpc.mjs.fixture",
  "packages/e2e/fixtures/lakebase-tokenizer-public-types.ts.fixture",
])
  paths.add(file);
const sourceFiles = [...paths].sort();
const sources = () => sourceFiles.map((file) => ({ file, sha256: hash(readFileSync(join(root, sourcePath(file)))) }));
const before = sources();
const buildSources = before.filter((source) => source.file.startsWith("apps/loom/dist/"));
verifyPackedBuildSources(artifact, buildSources);
writeFileSync(
  join(directory, "host-before.json"),
  JSON.stringify(
    {
      runId,
      command,
      sourcesBefore: before,
      guardSha256: hash(guardBytes),
      preparationSha256: hash(readFileSync(preparationFile)),
      installedFiles,
    },
    null,
    2,
  ),
  { mode: 0o600 },
);
const admin = new pg.Client({ connectionString: address.href });
try {
  await admin.connect();
  assert.equal(
    (await admin.query("SELECT current_setting('server_version_num')::int/10000 AS major")).rows[0].major,
    18,
  );
  const child = execute(command, {
    ...process.env,
    LOOM_TEST_DATABASE_URL: address.href,
    LOOM_EXTENSION_PROOF_RUN_ID: runId,
    LOOM_EXTENSION_PROOF_OUTPUT: files.cases,
    LOOM_EXTENSION_PROOF_FIXTURE_OUTPUT: files.fixtures,
    LOOM_EXTENSION_PROOF_ROLE_OUTPUT: files.roles,
    LOOM_LAKEBASE_TOKENIZER_PARENT_HOST: address.hostname,
    LOOM_LAKEBASE_TOKENIZER_TARBALL: preparation.artifact,
    LOOM_LAKEBASE_TOKENIZER_PACKED_CONSUMER_ROOT: preparation.root,
    LOOM_LAKEBASE_TOKENIZER_NODE24: node,
  });
  let diagnostic = child.stdout + child.stderr;
  for (const secret of [address.href, address.password, decodeURIComponent(address.password)])
    if (secret) diagnostic = diagnostic.replaceAll(secret, "[REDACTED]");
  writeFileSync(join(directory, "runner.log"), diagnostic.replace(/postgres(?:ql)?:\/\/\S+/g, "[REDACTED_URL]"), {
    mode: 0o600,
  });
  function readLines(file: string) {
    return readFileSync(file, "utf8")
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  }
  const fixtures = readLines(files.fixtures);
  const attempted = [
    ...new Set<string>(fixtures.filter((event) => event.kind === "attempted").map((event) => event.name)),
  ];
  assert.equal(attempted.length, 5);
  for (const name of attempted) {
    assert(/^loom_ext_[a-f0-9]{32}$/.test(name));
    const owned = fixtures.filter((event) => event.name === name);
    assert(owned.every((event) => event.runId === runId && event.sha256 === hash(Buffer.from(name))));
    assert.deepEqual(
      owned.map((event) => event.kind),
      ["attempted", "created", "dropped"],
    );
  }
  assert.deepEqual(
    (await admin.query("SELECT datname FROM pg_database WHERE datname=ANY($1::text[])", [attempted])).rows,
    [],
  );
  const roles = readLines(files.roles);
  const roleNames = [
    ...new Set<string>(roles.filter((event) => event.kind === "attempted").map((event) => event.name)),
  ];
  assert.equal(roleNames.length, 5);
  for (const name of roleNames) {
    assert(/^loom_tokenizer_rpc_[a-f0-9]{32}$/.test(name));
    const owned = roles.filter((event) => event.name === name);
    assert(owned.every((event) => event.runId === runId && event.sha256 === hash(Buffer.from(name))));
    assert.deepEqual(
      owned.map((event) => event.kind),
      ["attempted", "dropped"],
    );
  }
  assert.deepEqual(
    (await admin.query("SELECT rolname FROM pg_roles WHERE rolname=ANY($1::text[])", [roleNames])).rows,
    [],
  );
  const after = sources();
  assert.equal(extensionProofSourcesDigest(before), extensionProofSourcesDigest(after));
  assert.equal(hash(readFileSync(preparation.artifact)), preparation.artifactHash);
  assert.equal(await consumerLockfileSha256(preparation.root), preparation.lockfileSha256);
  assert.equal(await assertInstalledPackageMatchesTarball(preparation.root, artifact), installedFiles);
  assert.equal(execute(["bun", "--version"]).stdout, bunProbe.stdout);
  assert.equal(execute([node, "--version"]).stdout, nodeProbe.stdout);
  const cases = collectExtensionProofCases({
    runId,
    expected: [definition],
    events: readLines(files.cases),
    exitCode: child.status,
  });
  assert.equal(child.status, 0);
  assert.equal(child.signal, null);
  const base = {
    format: 2 as const,
    runId,
    finalizedBy: "host" as const,
    runner: { name: "bun" as const, version: bunProbe.stdout.trim() },
    command,
    exitCode: child.status,
    sourcesBefore: before,
    sourcesAfter: after,
    definitionsDigest: extensionProofCasesDigest([definition]),
    cases,
    totals: { passed: 1, failed: 0, skipped: 0, todo: 0, incomplete: 0 },
  };
  const receipt: ExtensionProofReceipt =
    gate === "generation"
      ? { ...base, gate }
      : {
          ...base,
          gate,
          package: {
            tarballSha256: preparation.artifactHash,
            buildSources,
            nodeVersion: nodeProbe.stdout.trim(),
            installation: "isolated",
            frozenReinstallPassed: true,
            declarationsPassed: true,
            runtimePassed: true,
            selectedBundleChecksPassed: true,
          },
        };
  const receiptDigest = extensionProofReceiptDigest(receipt);
  writeFileSync(join(directory, "host-receipt.json"), JSON.stringify(receipt, null, 2), { mode: 0o600 });
  writeFileSync(
    join(directory, "host-summary.json"),
    JSON.stringify(
      {
        runId,
        gate,
        receiptDigest,
        sourceCount: before.length,
        independentDatabaseAndRoleCleanup: true,
        fullFamilyAcceptance: false,
      },
      null,
      2,
    ),
    { mode: 0o600 },
  );
  console.log(
    JSON.stringify({ directory, runId, gate, receiptDigest, sourceCount: before.length, fullFamilyAcceptance: false }),
  );
} finally {
  await admin.end();
}
