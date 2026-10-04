import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const image = "loom-pg_graphql-pg18:latest";
const suffix = crypto.randomUUID().replaceAll("-", "");
const container = `loom-pg_graphql-pg18-${suffix}`;
const user = `loom_${suffix.slice(0, 12)}`;
const password = crypto.randomUUID();
const database = `loom_${suffix.slice(0, 12)}`;

function execute(command: string[]) {
  return spawnSync(command[0]!, command.slice(1), {
    cwd: root,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
}

function redact(text: string, url: URL) {
  let output = text;
  for (const value of [url.href, url.password, url.username, password])
    if (value) output = output.replaceAll(value, "[redacted]").replaceAll(decodeURIComponent(value), "[redacted]");
  return output.replace(/postgres(?:ql)?:\/\/\S+/g, "[REDACTED_URL]");
}

const inspected = execute(["docker", "image", "inspect", image]);
assert.equal(inspected.status, 0, `Local image ${image} is required`);
const started = execute([
  "docker",
  "run",
  "-d",
  "--name",
  container,
  "-e",
  `POSTGRES_USER=${user}`,
  "-e",
  `POSTGRES_PASSWORD=${password}`,
  "-e",
  `POSTGRES_DB=${database}`,
  "-p",
  "127.0.0.1::5432",
  image,
]);
assert.equal(started.status, 0, started.stderr);

try {
  for (let attempt = 0; attempt < 60; attempt++) {
    const ready = execute(["docker", "exec", container, "pg_isready", "-U", user, "-d", database]);
    if (ready.status === 0) break;
    if (attempt === 59) throw new Error("Disposable pg_graphql PostgreSQL 18 did not become ready");
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }
  const port = execute(["docker", "port", container, "5432/tcp"]);
  assert.equal(port.status, 0, port.stderr);
  const match = /127\.0\.0\.1:(\d+)/.exec(port.stdout);
  assert(match, `Could not parse published port: ${port.stdout}`);
  const url = new URL(`postgresql://127.0.0.1:${match[1]}/${database}`);
  url.username = user;
  url.password = password;

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
      .map((row) => JSON.parse(row) as { kind?: string; name?: string });
  const events = lines(journal);
  const names = [...new Set(events.filter((event) => event.kind === "attempted").map((event) => String(event.name)))];
  const ownedRoles = lines(roles).map((event) => String(event.name));
  assert(names.every((name) => /^loom_ext_[a-f0-9]{32}$/.test(name)));

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
    container,
    image,
    exitCode,
    ownedDatabases: names.length,
    ownedRoles: ownedRoles.length,
    independentCleanup: cleanup,
    unitExit: unit.status,
    typesExit: types.status,
    gatesExit: gates.status,
    log: `${base}.log`,
    proofs,
    observations,
  };
  writeFileSync(`${base}.result.json`, `${JSON.stringify(result, null, 2)}\n`, { mode: 0o600 });
  console.log(JSON.stringify(result));
  process.exitCode = exitCode === 0 && cleanup ? 0 : 1;
} finally {
  execute(["docker", "rm", "-f", container]);
}
