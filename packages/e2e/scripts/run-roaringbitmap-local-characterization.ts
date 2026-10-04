import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import pg from "pg";

// Local characterization only. The parent owns canonical five-gate receipts, builds and provider acceptance.
// Supply the already-authorized local fixture through LOOM_TEST_DATABASE_URL; this script discovers no credentials.
const root = fileURLToPath(new URL("../../../", import.meta.url));
const connectionString = process.env.LOOM_TEST_DATABASE_URL;
assert(connectionString, "Missing authorized local PostgreSQL fixture");
const address = new URL(connectionString);
assert(["postgres:", "postgresql:"].includes(address.protocol));
assert(["127.0.0.1", "localhost", "[::1]"].includes(address.hostname), "Local fixture required; no Neon execution");
const directory = mkdtempSync(join(tmpdir(), "loom-roaringbitmap-characterization-"));
const runId = `roaringbitmap.local.${randomUUID()}`;
const files = {
  fixtures: join(directory, "fixtures.jsonl"),
  proofs: join(directory, "proofs.jsonl"),
  observations: join(directory, "observations.jsonl"),
};
for (const file of Object.values(files)) writeFileSync(file, "", { flag: "wx", mode: 0o600 });
const admin = new pg.Client({ connectionString });
try {
  await admin.connect();
  const server = await admin.query("select current_setting('server_version_num')::int version");
  assert.equal(Math.floor(server.rows[0]!.version / 10000), 18);
  const available = await admin.query(
    "select 1 from pg_available_extension_versions where name='roaringbitmap' and version='1.2'",
  );
  assert.equal(available.rowCount, 1, "The local fixture must already supply roaringbitmap 1.2");
  const child = spawnSync("bun", ["test", "--timeout", "180000", "packages/e2e/integration/extensions-roaringbitmap.test.ts"], {
    cwd: root,
    encoding: "utf8",
    timeout: 240000,
    maxBuffer: 16 * 1024 * 1024,
    env: {
      ...process.env,
      LOOM_EXTENSION_PROOF_RUN_ID: runId,
      LOOM_EXTENSION_PROOF_FIXTURE_OUTPUT: files.fixtures,
      LOOM_EXTENSION_PROOF_OUTPUT: files.proofs,
      LOOM_EXTENSION_PROOF_DATABASE_OUTPUT: files.observations,
      LOOM_EXTENSION_PROOF_PROVIDER: "postgres",
    },
  });
  const log = (child.stdout + child.stderr).replaceAll(connectionString, "[REDACTED_CONNECTION]")
    .replace(/postgres(?:ql)?:\/\/\S+/g, "[REDACTED_CONNECTION]");
  writeFileSync(join(directory, "database.log"), log, { mode: 0o600 });
  const events = readFileSync(files.fixtures, "utf8").trim().split("\n").filter(Boolean).map((line) => JSON.parse(line));
  assert(events.every((event) => event.runId === runId));
  const owned: string[] = [...new Set<string>(events.filter((event) => event.kind === "attempted").map((event) => event.name))];
  assert(owned.every((name) => /^loom_ext_[a-f0-9]{32}$/.test(name)));
  const remaining = await admin.query("select datname from pg_database where datname=any($1::text[])", [owned]);
  const cleanup = remaining.rowCount === 0 && owned.length === 4 && owned.every((name) =>
    events.some((event) => event.name === name && event.kind === "created") &&
    events.some((event) => event.name === name && event.kind === "dropped"),
  );
  const result = {
    scope: "local PostgreSQL characterization; not canonical five-gate or Neon acceptance",
    runId,
    exitCode: child.status,
    signal: child.signal,
    ownedDatabases: owned.length,
    independentCleanup: cleanup,
    directory,
    files,
  };
  writeFileSync(join(directory, "result.json"), JSON.stringify(result, null, 2) + "\n", { mode: 0o600 });
  console.log(JSON.stringify(result));
  process.exitCode = child.status === 0 && cleanup ? 0 : 1;
} finally {
  await admin.end();
}
