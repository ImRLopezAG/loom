import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { stripVTControlCharacters } from "node:util";
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

/** Bun or Vitest's own summary; zero passes or any skip/todo means the gate did not run. */
function testCounts(raw: string) {
  const output = stripVTControlCharacters(raw);
  const vitest = output.match(/^\s*Tests\s+(.+)$/m)?.[1];
  const count = (bun: string, vite: string) =>
    Number(
      (vitest
        ? vitest.match(new RegExp(`(\\d+) ${vite}`))
        : output.match(new RegExp(`^\\s*(\\d+) ${bun}$`, "m")))?.[1] ?? 0,
    );
  return {
    pass: count("pass", "passed"),
    skip: count("skip", "skipped"),
    todo: count("todo", "todo"),
    fail: count("fail", "failed"),
  };
}

{
  const runId = `pg-graphql.local.characterization.${crypto.randomUUID()}`;
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

  const unit = spawnSync("bun", ["run", "test", "unit/extensions-pg_graphql.test.ts"], {
    cwd: `${root}/packages/tests`,
    env,
    encoding: "utf8",
    maxBuffer: 16 * 1024 * 1024,
    timeout: 180000,
  });
  const types = spawnSync(
    "bunx",
    ["tsc", "-p", "packages/tests/types/pg_graphql.tsconfig.json", "--noEmit", "--pretty", "false"],
    { cwd: root, env, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 180000 },
  );
  const gates = spawnSync(
    "bun",
    [
      "test",
      "--timeout",
      "240000",
      "packages/e2e/integration/extensions-pg_graphql-generated.test.ts",
      "packages/e2e/integration/packed-pg_graphql.test.ts",
      "packages/e2e/integration/extensions-pg_graphql.test.ts",
    ],
    { cwd: root, env, encoding: "utf8", maxBuffer: 16 * 1024 * 1024, timeout: 900000 },
  );

  writeFileSync(
    `${base}.log`,
    redact([unit.stdout, unit.stderr, types.stdout, types.stderr, gates.stdout, gates.stderr].join("\n"), url),
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
  const counts = {
    unit: testCounts(`${unit.stdout}\n${unit.stderr}`),
    gates: testCounts(`${gates.stdout}\n${gates.stderr}`),
  };
  const testsRan = Object.values(counts).every(
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

  const exitCode = unit.status === 0 && types.status === 0 && gates.status === 0 ? 0 : 1;
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
    gatesExit: gates.status,
    log: `${base}.log`,
    proofs,
    proofEntries,
    testCounts: counts,
    testsRan,
    observations,
  };
  writeFileSync(`${base}.result.json`, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify(result));
  process.exitCode = exitCode === 0 && cleanup && testsRan && proofEntries > 0 ? 0 : 1;
}
