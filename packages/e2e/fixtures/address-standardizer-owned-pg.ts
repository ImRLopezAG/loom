import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";

export const ADDRESS_STANDARDIZER_FAMILY_IMAGE = "loom-address-standardizer-3.6.4-pg18:local";
export const ADDRESS_STANDARDIZER_SOURCE_TARBALL = "/tmp/loom-postgis-3.6.4-source/postgis-3.6.4.tar.gz";
export const ADDRESS_STANDARDIZER_SOURCE_TARBALL_SHA256 =
  "ed8dc6679f1e06f7b113592b04cde2a7e00f1b1e681294c8ca2204058990cec6";
const journalPath = join(tmpdir(), "loom-address-standardizer-owned-uuid-journal.jsonl");

export type AddressStandardizerOwnedPg = {
  readonly runId: string;
  readonly container: string;
  readonly journalFile: string;
  readonly controlUrl: string;
  provision(schema: string): Promise<string>;
  stop(): Promise<void>;
  proveAbsent(): Promise<void>;
};

function execute(command: string[]) {
  return spawnSync(command[0]!, command.slice(1), {
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function requireSuccess(child: ReturnType<typeof execute>, label: string) {
  assert.equal(child.status, 0, `${label}\n${child.stdout}\n${child.stderr}`);
  return child;
}

function extractSql(name: string) {
  return requireSuccess(
    execute(["tar", "-xOf", ADDRESS_STANDARDIZER_SOURCE_TARBALL, `postgis-3.6.4/extensions/address_standardizer/${name}`]),
    name,
  ).stdout;
}

function writeJournal(entry: Record<string, unknown>) {
  appendFileSync(journalPath, `${JSON.stringify(entry)}\n`, { mode: 0o600 });
}

/** One family image container plus UUID databases. Does not rebuild the image and does not install data_us. */
export async function startAddressStandardizerOwnedPg(): Promise<AddressStandardizerOwnedPg> {
  const tarballSha = createHash("sha256").update(readFileSync(ADDRESS_STANDARDIZER_SOURCE_TARBALL)).digest("hex");
  assert.equal(tarballSha, ADDRESS_STANDARDIZER_SOURCE_TARBALL_SHA256, "Exact PostGIS 3.6.4 source tarball required");
  assert.equal(
    execute(["docker", "image", "inspect", ADDRESS_STANDARDIZER_FAMILY_IMAGE]).status,
    0,
    `Exact family image ${ADDRESS_STANDARDIZER_FAMILY_IMAGE} is required`,
  );
  const runId = randomUUID();
  const suffix = runId.replaceAll("-", "");
  const container = `loom-addrstd-gen-pg18-${suffix}`;
  const user = `loom_${suffix.slice(0, 12)}`;
  const password = randomUUID();
  const bootstrap = `loom_${suffix.slice(0, 12)}`;
  const journalFile = join(tmpdir(), `loom-address-standardizer-owned-uuid-${runId}.json`);
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
    `POSTGRES_DB=${bootstrap}`,
    "-p",
    "127.0.0.1::5432",
    ADDRESS_STANDARDIZER_FAMILY_IMAGE,
  ]);
  assert.equal(started.status, 0, started.stderr);
  const record = {
    runId,
    image: ADDRESS_STANDARDIZER_FAMILY_IMAGE,
    container,
    user,
    bootstrap,
    databases: [] as string[],
    port: 0,
    stopped: false,
  };
  writeFileSync(journalFile, JSON.stringify(record, null, 2), { mode: 0o600 });
  writeJournal({ event: "started", ...record, journalFile });
  try {
    for (let attempt = 0; attempt < 60; attempt++) {
      if (execute(["docker", "exec", container, "pg_isready", "-U", user, "-d", bootstrap]).status === 0) break;
      if (attempt === 59) throw new Error("Owned address_standardizer PostgreSQL 18 did not become ready");
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
    }
    const published = requireSuccess(execute(["docker", "port", container, "5432/tcp"]), "docker port");
    const match = /127\.0\.0\.1:(\d+)/.exec(published.stdout);
    assert(match, `Could not parse published port: ${published.stdout}`);
    record.port = Number(match[1]);
    writeFileSync(journalFile, JSON.stringify(record, null, 2), { mode: 0o600 });
    const control = new URL(`postgresql://127.0.0.1:${record.port}/${bootstrap}`);
    control.username = user;
    control.password = password;
    const lex = extractSql("us_lex.sql");
    const gaz = extractSql("us_gaz.sql");
    const rules = extractSql("us_rules.sql");
    return {
      runId,
      container,
      journalFile,
      controlUrl: control.href,
      async provision(schema: string) {
        const database = `loom_${randomUUID().replaceAll("-", "").slice(0, 12)}`;
        const admin = new pg.Client({ connectionString: control.href });
        await admin.connect();
        try {
          await admin.query(`CREATE DATABASE ${pg.escapeIdentifier(database)}`);
        } finally {
          await admin.end();
        }
        record.databases.push(database);
        writeFileSync(journalFile, JSON.stringify(record, null, 2), { mode: 0o600 });
        writeJournal({ event: "provisioned", runId, container, database, schema });
        const url = new URL(control.href);
        url.pathname = `/${database}`;
        const client = new pg.Client({ connectionString: url.href });
        await client.connect();
        try {
          const ns = pg.escapeIdentifier(schema);
          await client.query(`CREATE SCHEMA ${ns}`);
          await client.query(`CREATE EXTENSION address_standardizer WITH SCHEMA ${ns} VERSION '3.6.4'`);
          const installed = await client.query<{ extversion: string; nspname: string }>(
            `SELECT e.extversion, n.nspname
             FROM pg_extension e
             JOIN pg_namespace n ON n.oid = e.extnamespace
             WHERE e.extname = 'address_standardizer'`,
          );
          assert.equal(installed.rows[0]?.extversion, "3.6.4");
          assert.equal(installed.rows[0]?.nspname, schema);
          const companion = await client.query<{ count: string }>(
            "SELECT count(*)::text AS count FROM pg_extension WHERE extname = 'address_standardizer_data_us'",
          );
          assert.equal(companion.rows[0]?.count, "0");
          await client.query("CREATE SCHEMA lex_schema");
          await client.query("SET search_path TO lex_schema, pg_catalog");
          await client.query(lex);
          await client.query(gaz);
          await client.query(rules);
          await client.query(`ALTER DATABASE ${pg.escapeIdentifier(database)} SET search_path TO lex_schema, pg_catalog`);
        } finally {
          await client.end();
        }
        return url.href;
      },
      async stop() {
        execute(["docker", "rm", "-f", container]);
        record.stopped = true;
        writeFileSync(journalFile, JSON.stringify(record, null, 2), { mode: 0o600 });
        writeJournal({ event: "stopped", runId, container, databases: record.databases });
      },
      async proveAbsent() {
        const inspect = execute(["docker", "inspect", container]);
        assert.notEqual(inspect.status, 0, `Owned container ${container} is still present`);
        const listed = execute(["docker", "ps", "-aq", "--filter", `name=^${container}$`]);
        assert.equal(listed.stdout.trim(), "", `Owned container ${container} still listed`);
        if (record.port) {
          const leftover = new pg.Client({
            connectionString: `postgresql://127.0.0.1:${record.port}/${bootstrap}`,
            connectionTimeoutMillis: 1000,
          });
          await assert.rejects(leftover.connect());
        }
        writeJournal({ event: "absent", runId, container, independentlyProven: true });
      },
    };
  } catch (cause) {
    execute(["docker", "rm", "-f", container]);
    writeJournal({ event: "failed", runId, container, error: cause instanceof Error ? cause.message : "unknown" });
    throw cause;
  }
}
