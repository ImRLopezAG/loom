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
import { extensionContractDigest } from "../../../apps/loom/src/core/extensions/registry";
import { collectExtensionProofCases } from "../fixtures/extension-proof";
import { collectExtensionProofDatabaseObservations } from "../fixtures/extension-proof-database";
import {
  wave10CallbackDatabaseProofCases,
  wave10CallbackProofs,
  wave10AdapterFileName,
} from "../fixtures/wave10-callback-proof-cases";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofReceipt,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

// This host records one database gate. It cannot accept an extension family or replace the other four gates.
const root = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));
const profile = process.argv[2];
assert(profile === "local" || profile === "neon", "Usage: bun run-wave10-callback-database-proof.ts local|neon");
const connectionFile = process.env.LOOM_PROOF_DATABASE_CONNECTION_FILE;
assert(connectionFile, "Supply an owned fixture connection file");
const address = new URL(readFileSync(connectionFile, "utf8").trim());
assert(["postgres:", "postgresql:"].includes(address.protocol));
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

const runId = `wave10.callbacks.database.${randomUUID()}`;
const directory = realpathSync(mkdtempSync(join(tmpdir(), "kello-wave10-callback-proof-")));
const files = {
  cases: join(directory, "cases.jsonl"),
  observations: join(directory, "database.jsonl"),
  fixtures: join(directory, "fixtures.jsonl"),
  roles: join(directory, "roles.jsonl"),
};
for (const file of Object.values(files)) writeFileSync(file, "", { flag: "wx", mode: 0o600 });
const definitions = wave10CallbackDatabaseProofCases;
const command = ["bun", "test", "--timeout", "90000", ...new Set(definitions.map(({ file }) => file))];
const { build }: Pick<typeof import("../../../apps/loom/node_modules/esbuild/lib/main.js"), "build"> = createRequire(
  join(root, "apps/loom/package.json"),
)("esbuild");
const manifest = v.parse(
  v.object({ exports: v.record(v.string(), v.unknown()) }),
  JSON.parse(readFileSync(join(root, "apps/loom/package.json"), "utf8")),
);

function hash(bytes: Uint8Array) {
  return createHash("sha256").update(bytes).digest("hex");
}
function sourcePath(path: string) {
  const physical = realpathSync(resolve(root, path));
  assert(physical.startsWith(root + sep), "Proof source escapes checkout");
  return relative(root, physical).split(sep).join("/");
}
function publicExport(specifier: string) {
  const key = specifier === "kello" ? "." : `./${specifier.slice("kello/".length)}`;
  const entry = manifest.exports[key];
  const direct = v.safeParse(v.string(), entry);
  const conditional = direct.success
    ? { import: direct.output, default: undefined }
    : v.parse(v.object({ import: v.optional(v.string()), default: v.optional(v.string()) }), entry);
  const target = v.parse(v.pipe(v.string(), v.startsWith("./dist/")), conditional.import ?? conditional.default);
  return realpathSync(join(root, "apps/loom", target));
}
async function sources() {
  const graph = await build({
    absWorkingDir: root,
    entryPoints: [fileURLToPath(import.meta.url), ...definitions.map(({ file }) => file)],
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
  const paths = new Set(Object.keys(graph.metafile!.inputs).map(sourcePath));
  for (const name of Object.values(wave10CallbackProofs).map((proof) => wave10AdapterFileName(proof.family.extension)))
    for (const kind of ["core/extensions/adapters", "tooling/extensions/annotations"])
      paths.add(`apps/loom/src/${kind}/${name}.ts`);
  for (const name of Object.keys(wave10CallbackProofs))
    paths.add(`apps/loom/src/tooling/extensions/manifests/${name}.json`);
  paths.add("apps/loom/src/tooling/extensions/text-search-contracts/dict_int.json");
  for (const file of ["apps/loom/package.json", "bun.lock"]) paths.add(file);
  return [...paths].sort().map((file) => ({ file, sha256: hash(readFileSync(join(root, sourcePath(file)))) }));
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
    await admin.query(
      "SELECT current_setting('server_version') AS version, current_setting('server_version_num') AS number, current_database() AS database",
    )
  ).rows[0];
  assert.equal(Math.floor(Number(server.number) / 10000), 18);
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
      LOOM_EXTENSION_PROOF_OUTPUT: files.cases,
      LOOM_EXTENSION_PROOF_DATABASE_OUTPUT: files.observations,
      LOOM_EXTENSION_PROOF_FIXTURE_OUTPUT: files.fixtures,
      LOOM_EXTENSION_PROOF_ROLE_OUTPUT: files.roles,
      LOOM_EXTENSION_PROOF_PROVIDER: profile === "neon" ? "neon" : "postgres",
    },
  });
  let diagnostic = result.stdout + result.stderr;
  for (const secret of [address.href, address.password, decodeURIComponent(address.password)])
    if (secret) diagnostic = diagnostic.replaceAll(secret, "[REDACTED]");
  writeFileSync(join(directory, "native.log"), diagnostic.replace(/postgres(?:ql)?:\/\/\S+/g, "[REDACTED_URL]"), {
    mode: 0o600,
  });
  const after = await sources();
  assert.equal(extensionProofSourcesDigest(before), extensionProofSourcesDigest(after), "Sources changed during proof");
  assert.equal(bunVersion(), version, "Runner changed during proof");
  const cases = collectExtensionProofCases({
    runId,
    expected: definitions,
    events: readLines(files.cases),
    exitCode: result.status,
  });
  const expectedObservations = definitions.flatMap((definition) =>
    definition.families.map((family) => ({
      id: definition.families.length === 1 ? definition.id : `${definition.id}:${family.extension}`,
      definition,
      family,
    })),
  );
  const observations = collectExtensionProofDatabaseObservations({
    runId,
    expectedCaseIds: expectedObservations.map(({ id }) => id),
    observations: readLines(files.observations),
  });
  const events = readLines(files.fixtures);
  const attempted = [
    ...new Set<string>(events.filter((event) => event.kind === "attempted").map((event) => event.name)),
  ];
  assert.equal(
    attempted.length,
    Object.values(wave10CallbackProofs).reduce(
      (total, proof) => total + ("databaseFixtures" in proof ? proof.databaseFixtures : 1),
      0,
    ),
  );
  for (const name of attempted) {
    assert(/^loom_ext_[a-f0-9]{32}$/.test(name));
    const owned = events.filter((event) => event.name === name);
    assert(owned.every((event) => event.runId === runId && event.sha256 === hash(Buffer.from(name))));
    assert.deepEqual(
      owned.map((event) => event.kind),
      ["attempted", "created", "dropped"],
    );
  }
  assert.deepEqual(
    (await admin.query("SELECT datname FROM pg_catalog.pg_database WHERE datname=ANY($1::text[])", [attempted])).rows,
    [],
  );
  const roles = readLines(files.roles);
  assert.equal(
    roles.length,
    Object.values(wave10CallbackProofs).reduce(
      (total, proof) => total + ("databaseRoles" in proof ? proof.databaseRoles : 0),
      0,
    ),
  );
  assert.equal(new Set(roles.map((role) => role.name)).size, roles.length);
  for (const role of roles)
    assert(
      role.runId === runId &&
        /^pst_reader_[a-f0-9]{32}$/.test(role.name) &&
        role.sha256 === hash(Buffer.from(role.name)),
    );
  assert.deepEqual(
    (
      await admin.query("SELECT rolname FROM pg_catalog.pg_roles WHERE rolname=ANY($1::text[])", [
        roles.map((role) => role.name),
      ])
    ).rows,
    [],
  );
  const observedEnvironments = observations.map((observation) => {
    const { definition, family } = expectedObservations.find(({ id }) => id === observation.caseId)!;
    const installation = observation.manifest;
    // A local contract has a different provider identity and cannot satisfy the Neon gate.
    // Compare its captured shape against the same reviewed SQL contract, retaining its actual digest below.
    const reviewed = JSON.parse(
      readFileSync(join(root, `apps/loom/src/tooling/extensions/manifests/${family.extension}.json`), "utf8"),
    );
    assert.equal(reviewed.digest, family.manifestDigest);
    const expectedDigest =
      profile === "neon"
        ? family.manifestDigest
        : extensionContractDigest({ ...reviewed.contract, provider: "postgres" });
    assert.equal(installation.digest, expectedDigest);
    assert.equal(installation.contract.extension, family.extension);
    assert.equal(installation.contract.version, family.version);
    assert.equal(installation.contract.postgresMajor, 18);
    assert.equal(installation.contract.provider, profile === "neon" ? "neon" : "postgres");
    assert(attempted.some((name) => hash(Buffer.from(name)) === observation.databaseFingerprint));
    const witnesses = cases
      .find(({ id }) => id === definition.id)!
      .witnesses.filter((witness) => witness.family.extension === family.extension);
    // Composition cases require successful execution but claim no member coverage.
    // Member acceptance still requires its declared direct witness or captured transfer.
    assert.equal(
      witnesses.length,
      definition.claims.filter((claim) => claim.family.extension === family.extension).length,
    );
    assert(witnesses.every((witness) => witness.schema === installation.provenance.installationSchema));
    const observedFamily: Extract<ExtensionProofReceipt, { gate: "database" }>["database"]["observed"][number] = {
      ...family,
      manifestDigest: installation.digest,
      provider: installation.contract.provider,
      schema: installation.provenance.installationSchema,
    };
    if (observation.textSearch) observedFamily.textSearchDigest = observation.textSearch.digest;
    return observedFamily;
  });
  const environments = new Map<string, (typeof observedEnvironments)[number]>();
  for (const environment of observedEnvironments) {
    const previous = environments.get(environment.extension);
    if (previous) assert.deepEqual(environment, previous, "Native cases observed different family environments");
    else environments.set(environment.extension, environment);
  }
  const observed = [...environments.values()];
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
        receiptDigest,
        started,
        completed: new Date().toISOString(),
        sourceCount: before.length,
        guardSource,
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
      runId,
      receiptDigest,
      cases: cases.length,
      sourceCount: before.length,
      fullFamilyAcceptance: false,
    }),
  );
} finally {
  await admin.end();
}
