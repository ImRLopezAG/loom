import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const tarball = "/tmp/loom-pg_repack-src-6I7g/pg_repack-1.5.2.tar.gz";
const tarballDigest = "4516cad42251ed3ad53ff619733004db47d5755acac83f75924cd94d1c4fb681";
const bakedImage = "loom-pg_repack-pg18:1.5.2";
const suffix = crypto.randomUUID().replaceAll("-", "");
const container = `loom-pg_repack-pg18-${suffix}`;

function execute(command: string[], cwd?: string) {
  return spawnSync(command[0]!, command.slice(1), {
    cwd,
    env: process.env,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

function requireStatus(child: ReturnType<typeof execute>, message: string) {
  assert.equal(child.status, 0, `${message}\n${child.stdout}\n${child.stderr}`);
  return child;
}

function dockerAvailable() {
  return execute(["docker", "image", "inspect", "postgres:18"]).status === 0;
}

function bakeImage() {
  if (execute(["docker", "image", "inspect", bakedImage]).status === 0) return;
  assert(dockerAvailable(), "Local postgres:18 image is required to compile disposable pg_repack 1.5.2");
  const bytes = require("node:fs").readFileSync(tarball);
  assert.equal(createHash("sha256").update(bytes).digest("hex"), tarballDigest, "pg_repack 1.5.2 tarball digest drifted");
  const name = `loom-pg_repack-bake-${suffix}`;
  const started = execute([
    "docker",
    "run",
    "-d",
    "--name",
    name,
    "--entrypoint",
    "sleep",
    "postgres:18",
    "infinity",
  ]);
  requireStatus(started, "Failed to start bake container");
  try {
    requireStatus(execute(["docker", "cp", tarball, `${name}:/tmp/pg_repack-1.5.2.tar.gz`]), "Failed to copy tarball");
    const build = execute([
      "docker",
      "exec",
      "-u",
      "root",
      name,
      "bash",
      "-lc",
      [
        "set -euo pipefail",
        "apt-get update",
        "DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends build-essential postgresql-server-dev-18 ca-certificates libzstd-dev liblz4-dev zlib1g-dev libreadline-dev libnuma-dev",
        "mkdir -p /tmp/pg_repack-src",
        "tar -xzf /tmp/pg_repack-1.5.2.tar.gz -C /tmp/pg_repack-src",
        "cd /tmp/pg_repack-src/pg_repack-ver_1.5.2",
        "make",
        "make install",
        "test -x /usr/lib/postgresql/18/bin/pg_repack",
        "/usr/lib/postgresql/18/bin/pg_repack --version",
      ].join(" && "),
    ]);
    writeFileSync(join(tmpdir(), `loom-pg_repack-bake-${suffix}.log`), build.stdout + build.stderr, { mode: 0o600 });
    requireStatus(build, `pg_repack 1.5.2 failed to compile; log retained`);
    requireStatus(execute(["docker", "commit", name, bakedImage]), "Failed to commit baked image");
  } finally {
    execute(["docker", "rm", "-f", name]);
  }
}

function startFixture(): { url: string; binary: string } {
  bakeImage();
  const started = execute([
    "docker",
    "run",
    "-d",
    "--name",
    container,
    "-e",
    "POSTGRES_HOST_AUTH_METHOD=trust",
    "-e",
    "POSTGRES_USER=loom",
    "-e",
    "POSTGRES_DB=loom",
    "-p",
    "127.0.0.1::5432",
    "--entrypoint",
    "docker-entrypoint.sh",
    bakedImage,
    "postgres",
  ]);
  requireStatus(started, "Failed to start characterization container");
  for (let attempt = 0; attempt < 60; attempt++) {
    if (execute(["docker", "exec", container, "pg_isready", "-U", "loom", "-d", "loom"]).status === 0) break;
    if (attempt === 59) throw new Error("Disposable pg_repack PostgreSQL 18 did not become ready");
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }
  const port = execute(["docker", "port", container, "5432/tcp"]);
  requireStatus(port, "Failed to read published port");
  const match = /127\.0\.0\.1:(\d+)/.exec(port.stdout);
  assert(match, `Could not parse published port: ${port.stdout}`);
  const binary = "/usr/lib/postgresql/18/bin/pg_repack";
  requireStatus(execute(["docker", "exec", container, "test", "-x", binary]), "pg_repack client missing from baked image");
  return { url: `postgres://loom@127.0.0.1:${match[1]}/loom`, binary };
}

type Outcome = { ok: unknown } | { error: { code: string | undefined; message: string } };
async function attempt(client: pg.Client, text: string, values: unknown[] = []): Promise<Outcome> {
  try {
    const result = await client.query(text, values);
    return { ok: result.rows };
  } catch (cause) {
    assert(cause instanceof Error);
    return { error: { code: (cause as Error & { code?: string }).code, message: cause.message } };
  }
}

const fixture = startFixture();
const admin = new pg.Client({ connectionString: fixture.url });
const receipt: Record<string, unknown> = {
  image: bakedImage,
  container,
  binary: fixture.binary,
  clientVersion: execute(["docker", "exec", container, "/usr/lib/postgresql/18/bin/pg_repack", "--version"]).stdout.trim(),
};
await admin.connect();
try {
  await admin.query("CREATE EXTENSION pg_repack VERSION '1.5.2'");
  const schema = await admin.query(
    "SELECT n.nspname AS schema, e.extrelocatable AS relocatable FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname='pg_repack'",
  );
  const relocate = await attempt(admin, "ALTER EXTENSION pg_repack SET SCHEMA public");
  const withSchema = await attempt(admin, "CREATE EXTENSION IF NOT EXISTS pg_repack WITH SCHEMA public VERSION '1.5.2'");
  receipt.installation = { schema: schema.rows, relocate, withSchema };
  const versions = await admin.query("SELECT repack.version() AS version, repack.version_sql() AS version_sql");
  receipt.versions = versions.rows[0];
  const owned = `loom_repack_${suffix}`;
  await admin.query(`CREATE SCHEMA ${owned}`);
  await admin.query(
    `CREATE TABLE ${owned}.items(id integer PRIMARY KEY, label text NOT NULL); INSERT INTO ${owned}.items SELECT g, 'row'||g FROM generate_series(1,20) g`,
  );
  const ids = await admin.query(
    `SELECT c.oid::text AS table_oid, i.indexrelid::text AS pk_oid FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN pg_index i ON i.indrelid=c.oid AND i.indisprimary WHERE n.nspname=$1 AND c.relname='items'`,
    [owned],
  );
  const tableOid = ids.rows[0].table_oid as string;
  const pkOid = ids.rows[0].pk_oid as string;
  const q = (text: string, values: unknown[] = []) => attempt(admin, text, values);
  receipt.members = {
    "routine:repack.version()": await q("SELECT repack.version() AS value"),
    "routine:repack.version_sql()": await q("SELECT repack.version_sql() AS value"),
    "routine:repack.oid2text(pg_catalog.oid)": await q("SELECT repack.oid2text($1::oid) AS value", [tableOid]),
    "routine:repack.get_index_columns(pg_catalog.oid)": await q("SELECT repack.get_index_columns($1::oid) AS value", [pkOid]),
    "routine:repack.get_order_by(pg_catalog.oid,pg_catalog.oid)": await q(
      "SELECT repack.get_order_by($1::oid,$2::oid) AS value",
      [pkOid, tableOid],
    ),
    "routine:repack.get_create_index_type(pg_catalog.oid,pg_catalog.name)": await q(
      "SELECT repack.get_create_index_type($1::oid,$2::name) AS value",
      [pkOid, "pk_type"],
    ),
    "routine:repack.get_create_trigger(pg_catalog.oid,pg_catalog.oid)": await q(
      "SELECT repack.get_create_trigger($1::oid,$2::oid) AS value",
      [tableOid, pkOid],
    ),
    "routine:repack.get_enable_trigger(pg_catalog.oid)": await q("SELECT repack.get_enable_trigger($1::oid) AS value", [
      tableOid,
    ]),
    "routine:repack.get_assign(pg_catalog.oid,pg_catalog.text)": await q(
      "SELECT repack.get_assign($1::oid,$2::text) AS value",
      [tableOid, "$2"],
    ),
    "routine:repack.get_compare_pkey(pg_catalog.oid,pg_catalog.text)": await q(
      "SELECT repack.get_compare_pkey($1::oid,$2::text) AS value",
      [pkOid, "$1"],
    ),
    "routine:repack.get_columns_for_create_as(pg_catalog.oid)": await q(
      "SELECT repack.get_columns_for_create_as($1::oid) AS value",
      [tableOid],
    ),
    "routine:repack.get_drop_columns(pg_catalog.oid,pg_catalog.text)": await q(
      "SELECT repack.get_drop_columns($1::oid,$2::text) AS value",
      [tableOid, `repack.table_${tableOid}`],
    ),
    "routine:repack.get_storage_param(pg_catalog.oid)": await q("SELECT repack.get_storage_param($1::oid) AS value", [
      tableOid,
    ]),
    "routine:repack.get_alter_col_storage(pg_catalog.oid)": await q(
      "SELECT repack.get_alter_col_storage($1::oid) AS value",
      [tableOid],
    ),
    "routine:repack.get_table_and_inheritors(pg_catalog.regclass)": await q(
      "SELECT repack.get_table_and_inheritors($1::regclass)::text AS value",
      [`${owned}.items`],
    ),
    "routine:repack.conflicted_triggers(pg_catalog.oid)": await q(
      "SELECT * FROM repack.conflicted_triggers($1::oid) AS value",
      [tableOid],
    ),
    "routine:repack.repack_indexdef(pg_catalog.oid,pg_catalog.oid,pg_catalog.name,pg_catalog.bool)": await q(
      "SELECT repack.repack_indexdef($1::oid,$2::oid,$3::name,$4::bool) AS value",
      [pkOid, tableOid, "repack", false],
    ),
    "routine:repack.repack_trigger()": await q("SELECT repack.repack_trigger()"),
    "view:repack.primary_keys": await q(
      "SELECT indrelid::text, indexrelid::text FROM repack.primary_keys WHERE indrelid=$1::oid",
      [tableOid],
    ),
    "view:repack.tables": await q("SELECT * FROM repack.tables WHERE relid=$1::oid", [tableOid]),
    "type:repack.primary_keys": await q(
      "SELECT ROW(p.*)::text AS value FROM repack.primary_keys p WHERE p.indrelid=$1::oid",
      [tableOid],
    ),
    "type:repack.tables": await q("SELECT ROW(t.*)::text AS value FROM repack.tables t WHERE t.relid=$1::oid", [
      tableOid,
    ]),
    "schema:repack": await q("SELECT nspname FROM pg_namespace WHERE nspname='repack'"),
  };
  receipt.mutating = {
    create_index_type: await q("SELECT repack.create_index_type($1::oid,$2::oid)", [pkOid, tableOid]),
    create_log_table: await q("SELECT repack.create_log_table($1::oid)", [tableOid]),
    create_table: await q("SELECT repack.create_table($1::oid,$2::name)", [tableOid, "pg_default"]),
    disable_autovacuum: await q("SELECT repack.disable_autovacuum($1::regclass)", [`repack.table_${tableOid}`]),
    repack_apply_empty: await q(
      "SELECT repack.repack_apply($1::cstring,$2::cstring,$3::cstring,$4::cstring,$5::cstring,$6::int4) AS value",
      [
        `SELECT * FROM repack.log_${tableOid} ORDER BY id LIMIT $1`,
        `INSERT INTO repack.table_${tableOid} VALUES ($1.*)`,
        `DELETE FROM repack.table_${tableOid} WHERE FALSE`,
        `UPDATE repack.table_${tableOid} SET id=id WHERE FALSE`,
        `DELETE FROM repack.log_${tableOid} WHERE id IN (`,
        10,
      ],
    ),
    repack_index_swap_missing: await q("SELECT repack.repack_index_swap($1::oid)", [pkOid]),
    repack_drop: await q("SELECT repack.repack_drop($1::oid,$2::int4)", [tableOid, 1]),
  };
  const client = execute([
    "docker",
    "exec",
    container,
    "/usr/lib/postgresql/18/bin/pg_repack",
    "-k",
    "-h",
    "127.0.0.1",
    "-U",
    "loom",
    "-d",
    "loom",
    "-t",
    `${owned}.items`,
    "-e",
  ]);
  receipt.client = { status: client.status, stdout: client.stdout, stderr: client.stderr };
  const leftover = await admin.query(
    "SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='repack' AND relname ~ $1",
    [`(_|table_|log_|pk_)${tableOid}`],
  );
  receipt.leftover = leftover.rows;
} finally {
  await admin.end();
  execute(["docker", "rm", "-f", container]);
}

const runId = `pg-repack.local.characterization.${suffix}`;
mkdirSync("/tmp/loom-typed-extensions-work", { recursive: true });
const path = `/tmp/loom-typed-extensions-work/${runId}.json`;
writeFileSync(path, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify({ runId, path, container, image: bakedImage }));
