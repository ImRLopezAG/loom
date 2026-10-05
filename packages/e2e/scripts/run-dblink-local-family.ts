import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import * as v from "valibot";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const suppliedUrl = process.env.LOOM_TEST_DATABASE_URL;
assert(suppliedUrl, "Supply LOOM_TEST_DATABASE_URL from the parent-managed shared PostgreSQL fixture");
const url = new URL(suppliedUrl);
assert(["postgres:", "postgresql:"].includes(url.protocol), "Expected a PostgreSQL fixture URL");

function redact(text: string, url: URL) {
  let output = text;
  for (const value of [url.href, url.password, url.username])
    if (value) output = output.replaceAll(value, "[redacted]").replaceAll(decodeURIComponent(value), "[redacted]");
  return output.replace(/postgres(?:ql)?:\/\/\S+/g, "[REDACTED_URL]");
}

/** Bun's own summary; zero passes or any skip/todo means the gate did not run. */
function bunTestCounts(output: string) {
  const count = (label: string) => Number(output.match(new RegExp(`^\\s*(\\d+) ${label}$`, "m"))?.[1] ?? 0);
  return { pass: count("pass"), skip: count("skip"), todo: count("todo"), fail: count("fail") };
}

{
  const runId = `dblink.local.characterization.${crypto.randomUUID()}`;
  mkdirSync("/tmp/loom-typed-extensions-work", { recursive: true });
  const base = `/tmp/loom-typed-extensions-work/${runId}`;
  const journal = `${base}.fixtures.jsonl`;
  const roles = `${base}.roles.jsonl`;
  const proofs = `${base}.proofs.jsonl`;
  const observations = `${base}.observations.jsonl`;
  for (const path of [journal, roles, proofs, observations]) writeFileSync(path, "", { flag: "wx", mode: 0o600 });

  const env = {
    ...process.env,
    CI: "1",
    LOOM_TEST_DATABASE_URL: url.href,
    LOOM_EXTENSION_PROOF_RUN_ID: runId,
    LOOM_EXTENSION_PROOF_FIXTURE_OUTPUT: journal,
    LOOM_EXTENSION_PROOF_ROLE_OUTPUT: roles,
    LOOM_EXTENSION_PROOF_OUTPUT: proofs,
    LOOM_EXTENSION_PROOF_DATABASE_OUTPUT: observations,
    LOOM_EXTENSION_PROOF_PROVIDER: "postgres",
  };

  const unit = spawnSync("bun", ["run", "packages/e2e/scripts/run-dblink-unit-types-proof.ts", "unit"], {
    cwd: root,
    env,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    timeout: 180000,
  });
  const types = spawnSync("bun", ["run", "packages/e2e/scripts/run-dblink-unit-types-proof.ts", "types"], {
    cwd: root,
    env,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    timeout: 180000,
  });
  const databaseProof = spawnSync(
    "bun",
    ["test", "--timeout", "180000", "packages/e2e/integration/extensions-dblink.test.ts"],
    { cwd: root, env, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 240000 },
  );

  const packageJson = v.parse(
    v.object({ exports: v.optional(v.record(v.string(), v.union([v.string(), v.record(v.string(), v.string())]))) }),
    JSON.parse(readFileSync(`${root}apps/loom/package.json`, "utf8")),
  );
  assert(
    packageJson.exports?.["./extensions/dblink"],
    "The public dblink export must be integrated before verification",
  );
  const generation = spawnSync(
    "bun",
    ["test", "--timeout", "180000", "packages/e2e/integration/extensions-dblink-generation.test.ts"],
    { cwd: root, env, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 240000 },
  );
  const packed = spawnSync("bun", ["test", "--timeout", "360000", "packages/e2e/integration/packed-dblink.test.ts"], {
    cwd: root,
    env,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    timeout: 420000,
  });

  writeFileSync(
    `${base}.log`,
    redact(
      [
        unit.stdout,
        unit.stderr,
        types.stdout,
        types.stderr,
        databaseProof.stdout,
        databaseProof.stderr,
        generation.stdout,
        generation.stderr,
        packed.stdout,
        packed.stderr,
      ].join("\n"),
      url,
    ),
    { mode: 0o600 },
  );

  const lines = (path: string) =>
    readFileSync(path, "utf8")
      .trim()
      .split("\n")
      .filter(Boolean)
      .map((row) => v.parse(v.object({ kind: v.string(), name: v.string() }), JSON.parse(row)));
  const events = lines(journal);
  const names = [...new Set(events.filter((event) => event.kind === "attempted").map((event) => String(event.name)))];
  const ownedRoles = lines(roles).map((event) => String(event.name));
  assert(names.length > 0, "No owned fixture databases were attempted");
  assert(names.every((name) => /^loom_ext_[a-f0-9]{32}$/.test(name)));
  const proofEntries = readFileSync(proofs, "utf8").split("\n").filter(Boolean).length;
  const testCounts = {
    databaseProof: bunTestCounts(`${databaseProof.stdout}\n${databaseProof.stderr}`),
    generation: bunTestCounts(`${generation.stdout}\n${generation.stderr}`),
    packed: bunTestCounts(`${packed.stdout}\n${packed.stderr}`),
  };
  const testsRan = Object.values(testCounts).every(
    (counts) => counts.pass > 0 && counts.skip === 0 && counts.todo === 0 && counts.fail === 0,
  );

  const admin = new pg.Client({ connectionString: url.href });
  let cleanup = false;
  try {
    await admin.connect();
    const dbs = await admin.query("select datname from pg_database where datname=any($1::text[])", [names]);
    const rs = await admin.query("select rolname from pg_roles where rolname=any($1::text[])", [ownedRoles]);
    assert.equal(dbs.rowCount, 0, "Owned fixture DB cleanup incomplete");
    assert.equal(rs.rowCount, 0, "Owned fixture role cleanup incomplete");
    cleanup = names.every(
      (name) =>
        events.some((event) => event.name === name && event.kind === "created") &&
        events.some((event) => event.name === name && event.kind === "dropped"),
    );
  } finally {
    await admin.end();
  }

  const exitCode =
    unit.status === 0 &&
    types.status === 0 &&
    databaseProof.status === 0 &&
    generation.status === 0 &&
    packed.status === 0
      ? 0
      : 1;
  const result = {
    scope: "Local characterization, not canonical Neon/five-gate acceptance",
    runId,
    fixture: "parent-managed-shared-postgres",
    exitCode,
    ownedDatabases: names.length,
    ownedRoles: ownedRoles.length,
    independentCleanup: cleanup,
    unitExit: unit.status,
    typesExit: types.status,
    databaseExit: databaseProof.status,
    generationExit: generation.status,
    packedExit: packed.status,
    log: `${base}.log`,
    proofs,
    proofEntries,
    testCounts,
    testsRan,
    observations,
  };
  writeFileSync(`${base}.result.json`, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify(result));
  process.exitCode = exitCode === 0 && cleanup && testsRan && proofEntries > 0 ? 0 : 1;
}
