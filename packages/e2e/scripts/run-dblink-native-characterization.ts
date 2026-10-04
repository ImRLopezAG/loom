import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";

const root = fileURLToPath(new URL("../../../", import.meta.url));
const suffix = crypto.randomUUID().replaceAll("-", "");
const container = `loom-dblink-pg18-${suffix}`;
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

const inspected = execute(["docker", "image", "inspect", "postgres:18"]);
assert.equal(inspected.status, 0, "Local postgres:18 image is required for disposable dblink 1.2 characterization");
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
  "postgres:18",
]);
assert.equal(started.status, 0, started.stderr);

try {
  for (let attempt = 0; attempt < 60; attempt++) {
    const ready = execute(["docker", "exec", container, "pg_isready", "-U", user, "-d", database]);
    if (ready.status === 0) break;
    if (attempt === 59) throw new Error("Disposable dblink PostgreSQL 18 did not become ready");
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 1000);
  }
  const port = execute(["docker", "port", container, "5432/tcp"]);
  assert.equal(port.status, 0, port.stderr);
  const match = /127\.0\.0\.1:(\d+)/.exec(port.stdout);
  assert(match, `Could not parse published port: ${port.stdout}`);
  const url = new URL(`postgresql://127.0.0.1:${match[1]}/${database}`);
  url.username = user;
  url.password = password;
  const remoteName = `loom_dblink_r_${suffix.slice(0, 12)}`;
  const observations: Record<string, unknown>[] = [];
  const admin = new pg.Client({ connectionString: url.href });
  await admin.connect();
  try {
    await admin.query(`CREATE DATABASE ${pg.escapeIdentifier(remoteName)}`);
    const remoteUrl = new URL(url.href);
    remoteUrl.pathname = `/${remoteName}`;
    const remote = new pg.Client({ connectionString: remoteUrl.href });
    await remote.connect();
    try {
      await remote.query("CREATE TABLE items(id integer PRIMARY KEY, label text NOT NULL)");
      await remote.query("INSERT INTO items VALUES (1, 'alpha'), (2, 'beta')");
    } finally {
      await remote.end();
    }
    const local = new pg.Client({ connectionString: url.href });
    await local.connect();
    try {
      await local.query(`CREATE SCHEMA "db""link"`);
      await local.query(`CREATE EXTENSION dblink WITH SCHEMA "db""link" VERSION '1.2'`);
      const version = await local.query(
        "SELECT extversion, extrelocatable FROM pg_extension WHERE extname='dblink'",
      );
      observations.push({ member: "extension", version: version.rows });
      const members = await local.query(`
        SELECT
          p.proname,
          pg_catalog.pg_get_function_identity_arguments(p.oid) AS args,
          pg_catalog.pg_get_function_result(p.oid) AS result,
          p.prorettype::regtype::text AS rettype,
          p.proretset,
          p.proisstrict,
          p.prosecdef,
          p.provolatile,
          p.proparallel,
          p.prolang::regproc::text AS language,
          (
            p.proacl IS NULL
            OR EXISTS (
              SELECT 1
              FROM pg_catalog.aclexplode(p.proacl) e
              WHERE e.grantee = 0 AND e.privilege_type = 'EXECUTE'
            )
          ) AS public_execute
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid=p.pronamespace
        WHERE n.nspname='db"link'
        ORDER BY p.proname, 2
      `);
      observations.push({ member: "catalogue-routines", count: members.rowCount, identities: members.rows });
      const types = await local.query(`
        SELECT t.typname, t.typtype, t.typcategory, t.typlen, t.typbyval, t.typdelim
        FROM pg_type t
        JOIN pg_namespace n ON n.oid=t.typnamespace
        WHERE n.nspname='db"link'
        ORDER BY t.typname
      `);
      observations.push({ member: "catalogue-types", types: types.rows });
      const fdw = await local.query(
        `SELECT f.fdwname, h.proname AS handler, v.proname AS validator
         FROM pg_foreign_data_wrapper f
         LEFT JOIN pg_proc h ON h.oid=f.fdwhandler
         LEFT JOIN pg_proc v ON v.oid=f.fdwvalidator
         WHERE f.fdwname='dblink_fdw'`,
      );
      observations.push({ member: "foreign-data wrapper:dblink_fdw", rows: fdw.rows });
      await local.query(`CREATE TABLE local_items(id integer PRIMARY KEY, label text NOT NULL)`);
      await local.query(`INSERT INTO local_items VALUES (1, 'alpha')`);
      const pkey = await local.query(`SELECT * FROM "db""link".dblink_get_pkey('local_items')`);
      observations.push({ member: "dblink_get_pkey", rows: pkey.rows });
      const insertSql = await local.query(
        `SELECT "db""link".dblink_build_sql_insert('local_items','1'::int2vector,1,ARRAY['1']::text[],ARRAY['9']::text[]) AS sql`,
      );
      observations.push({ member: "dblink_build_sql_insert", sql: insertSql.rows[0]?.sql });
      const updateSql = await local.query(
        `SELECT "db""link".dblink_build_sql_update('local_items','1'::int2vector,1,ARRAY['1']::text[],ARRAY['9']::text[]) AS sql`,
      );
      observations.push({ member: "dblink_build_sql_update", sql: updateSql.rows[0]?.sql });
      const deleteSql = await local.query(
        `SELECT "db""link".dblink_build_sql_delete('local_items','1'::int2vector,1,ARRAY['1']::text[]) AS sql`,
      );
      observations.push({ member: "dblink_build_sql_delete", sql: deleteSql.rows[0]?.sql });
      const current = await local.query(`SELECT "db""link".dblink_current_query() AS query`);
      observations.push({
        member: "dblink_current_query",
        hasText: typeof current.rows[0]?.query === "string",
        includesSelf: String(current.rows[0]?.query ?? "").includes("dblink_current_query"),
      });
      const emptyConnections = await local.query(`SELECT "db""link".dblink_get_connections() AS connections`);
      observations.push({ member: "dblink_get_connections-empty", connections: emptyConnections.rows[0]?.connections });
      const connstr = `host=127.0.0.1 port=5432 dbname=${remoteName} user=${user} password=${password}`;
      const connected = await local.query(`SELECT "db""link".dblink_connect('named', $1::text) AS status`, [connstr]);
      observations.push({ member: "dblink_connect-named", status: connected.rows[0]?.status });
      const connections = await local.query(`SELECT "db""link".dblink_get_connections() AS connections`);
      observations.push({ member: "dblink_get_connections-named", connections: connections.rows[0]?.connections });
      const unnamed = await local.query(`SELECT "db""link".dblink_connect($1::text) AS status`, [connstr]);
      observations.push({ member: "dblink_connect-unnamed", status: unnamed.rows[0]?.status });
      const queryNamed = await local.query(
        `SELECT * FROM "db""link".dblink('named','SELECT id, label FROM items ORDER BY id') AS t(id integer, label text)`,
      );
      observations.push({ member: "dblink-named", rows: queryNamed.rows });
      const queryNamedFail = await local.query(
        `SELECT * FROM "db""link".dblink('named','SELECT id, label FROM items ORDER BY id', true) AS t(id integer, label text)`,
      );
      observations.push({ member: "dblink-named-fail", rows: queryNamedFail.rows });
      const queryUnnamed = await local.query(
        `SELECT * FROM "db""link".dblink('SELECT id FROM items WHERE id=1') AS t(id integer)`,
      );
      observations.push({ member: "dblink-unnamed", rows: queryUnnamed.rows });
      const queryUnnamedFail = await local.query(
        `SELECT * FROM "db""link".dblink('SELECT id FROM items WHERE id=1', true) AS t(id integer)`,
      );
      observations.push({ member: "dblink-unnamed-fail", rows: queryUnnamedFail.rows });
      const execNamed = await local.query(
        `SELECT "db""link".dblink_exec('named','INSERT INTO items VALUES (3, ''gamma'')') AS status`,
      );
      observations.push({ member: "dblink_exec-named", status: execNamed.rows[0]?.status });
      const execNamedFail = await local.query(
        `SELECT "db""link".dblink_exec('named','INSERT INTO items VALUES (4, ''delta'')', true) AS status`,
      );
      observations.push({ member: "dblink_exec-named-fail", status: execNamedFail.rows[0]?.status });
      const execUnnamed = await local.query(
        `SELECT "db""link".dblink_exec('UPDATE items SET label=''alpha2'' WHERE id=1') AS status`,
      );
      observations.push({ member: "dblink_exec-unnamed", status: execUnnamed.rows[0]?.status });
      const execUnnamedFail = await local.query(
        `SELECT "db""link".dblink_exec('UPDATE items SET label=''alpha3'' WHERE id=1', true) AS status`,
      );
      observations.push({ member: "dblink_exec-unnamed-fail", status: execUnnamedFail.rows[0]?.status });
      const opened = await local.query(
        `SELECT "db""link".dblink_open('named','cur','SELECT id, label FROM items ORDER BY id') AS status`,
      );
      observations.push({ member: "dblink_open-named", status: opened.rows[0]?.status });
      const fetched = await local.query(
        `SELECT * FROM "db""link".dblink_fetch('named','cur',1) AS t(id integer, label text)`,
      );
      observations.push({ member: "dblink_fetch-named", rows: fetched.rows });
      const fetchedFail = await local.query(
        `SELECT * FROM "db""link".dblink_fetch('named','cur',10, true) AS t(id integer, label text)`,
      );
      observations.push({ member: "dblink_fetch-named-fail", rows: fetchedFail.rows });
      const closed = await local.query(`SELECT "db""link".dblink_close('named','cur') AS status`);
      observations.push({ member: "dblink_close-named", status: closed.rows[0]?.status });
      const openedUnnamed = await local.query(
        `SELECT "db""link".dblink_open('cur2','SELECT id FROM items ORDER BY id', true) AS status`,
      );
      observations.push({ member: "dblink_open-unnamed-fail", status: openedUnnamed.rows[0]?.status });
      const fetchedUnnamed = await local.query(
        `SELECT * FROM "db""link".dblink_fetch('cur2',1, true) AS t(id integer)`,
      );
      observations.push({ member: "dblink_fetch-unnamed-fail", rows: fetchedUnnamed.rows });
      const closedUnnamed = await local.query(`SELECT "db""link".dblink_close('cur2', true) AS status`);
      observations.push({ member: "dblink_close-unnamed-fail", status: closedUnnamed.rows[0]?.status });
      const openedUnnamed2 = await local.query(`SELECT "db""link".dblink_open('cur3','SELECT id FROM items') AS status`);
      observations.push({ member: "dblink_open-unnamed", status: openedUnnamed2.rows[0]?.status });
      const fetchedUnnamed2 = await local.query(`SELECT * FROM "db""link".dblink_fetch('cur3',2) AS t(id integer)`);
      observations.push({ member: "dblink_fetch-unnamed", rows: fetchedUnnamed2.rows });
      const closedUnnamed2 = await local.query(`SELECT "db""link".dblink_close('cur3') AS status`);
      observations.push({ member: "dblink_close-unnamed", status: closedUnnamed2.rows[0]?.status });
      const sent = await local.query(
        `SELECT "db""link".dblink_send_query('named','SELECT id FROM items WHERE id=2') AS sent`,
      );
      observations.push({ member: "dblink_send_query", sent: sent.rows[0]?.sent });
      const busy = await local.query(`SELECT "db""link".dblink_is_busy('named') AS busy`);
      observations.push({ member: "dblink_is_busy", busy: busy.rows[0]?.busy });
      const result = await local.query(
        `SELECT * FROM "db""link".dblink_get_result('named') AS t(id integer)`,
      );
      observations.push({ member: "dblink_get_result", rows: result.rows });
      const resultFail = await local.query(
        `SELECT * FROM "db""link".dblink_get_result('named', true) AS t(id integer)`,
      );
      observations.push({ member: "dblink_get_result-fail", rows: resultFail.rows });
      const err = await local.query(`SELECT "db""link".dblink_error_message('named') AS message`);
      observations.push({ member: "dblink_error_message", message: err.rows[0]?.message });
      const notifyEmpty = await local.query(`SELECT * FROM "db""link".dblink_get_notify('named')`);
      observations.push({ member: "dblink_get_notify-named", rows: notifyEmpty.rows });
      const notifyUnnamed = await local.query(`SELECT * FROM "db""link".dblink_get_notify()`);
      observations.push({ member: "dblink_get_notify-unnamed", rows: notifyUnnamed.rows });
      await local.query(`SELECT "db""link".dblink_exec('named','NOTIFY dblink_probe, ''extra''')`);
      const notifyAfter = await local.query(`SELECT * FROM "db""link".dblink_get_notify('named')`);
      observations.push({
        member: "dblink_get_notify-after",
        rows: notifyAfter.rows.map((row) => ({
          notify_name: row.notify_name,
          extra: row.extra,
          be_pid: typeof row.be_pid,
        })),
      });
      const cancel = await local.query(`SELECT "db""link".dblink_cancel_query('named') AS status`);
      observations.push({ member: "dblink_cancel_query", status: cancel.rows[0]?.status });
      const validator = await local.query(
        `SELECT "db""link".dblink_fdw_validator(ARRAY[]::text[], 'pg_foreign_server'::regclass::oid)`,
      );
      observations.push({ member: "dblink_fdw_validator-empty", rowCount: validator.rowCount });
      let validatorError: string | undefined;
      try {
        await local.query(
          `SELECT "db""link".dblink_fdw_validator(ARRAY['host=127.0.0.1']::text[], 'pg_foreign_server'::regclass::oid)`,
        );
      } catch (error) {
        validatorError = error instanceof Error ? error.message.replaceAll(password, "[redacted]") : "unknown";
      }
      observations.push({ member: "dblink_fdw_validator-options", error: validatorError });
      const typeText = await local.query(
        `SELECT pg_catalog.format_type(t.oid, NULL) AS type
         FROM pg_type t JOIN pg_namespace n ON n.oid=t.typnamespace
         WHERE n.nspname='db"link' AND t.typname='dblink_pkey_results'`,
      );
      observations.push({ member: "type-dblink_pkey_results", type: typeText.rows[0]?.type });
      const arrayType = await local.query(
        `SELECT ARRAY[ROW(1,'id')::"db""link".dblink_pkey_results]::text AS value`,
      );
      observations.push({ member: "type-_dblink_pkey_results", value: arrayType.rows[0]?.value });
      let connectU: string | undefined;
      try {
        const resultU = await local.query(`SELECT "db""link".dblink_connect_u('priv', $1::text) AS status`, [connstr]);
        connectU = String(resultU.rows[0]?.status);
      } catch (error) {
        connectU = error instanceof Error ? error.message.replaceAll(password, "[redacted]") : "unknown";
      }
      observations.push({ member: "dblink_connect_u-named", status: connectU });
      let connectUUnnamed: string | undefined;
      try {
        const resultU = await local.query(`SELECT "db""link".dblink_connect_u($1::text) AS status`, [connstr]);
        connectUUnnamed = String(resultU.rows[0]?.status);
      } catch (error) {
        connectUUnnamed = error instanceof Error ? error.message.replaceAll(password, "[redacted]") : "unknown";
      }
      observations.push({ member: "dblink_connect_u-unnamed", status: connectUUnnamed });
      const disconnectNamed = await local.query(`SELECT "db""link".dblink_disconnect('named') AS status`);
      observations.push({ member: "dblink_disconnect-named", status: disconnectNamed.rows[0]?.status });
      const disconnectUnnamed = await local.query(`SELECT "db""link".dblink_disconnect() AS status`);
      observations.push({ member: "dblink_disconnect-unnamed", status: disconnectUnnamed.rows[0]?.status });
      const remaining = await local.query(`SELECT "db""link".dblink_get_connections() AS connections`);
      observations.push({ member: "dblink_get_connections-after", connections: remaining.rows[0]?.connections });
      let missing: string | undefined;
      try {
        await local.query(`SELECT "db""link".dblink_disconnect('missing')`);
      } catch (error) {
        missing = error instanceof Error ? error.message : "unknown";
      }
      observations.push({ member: "dblink_disconnect-missing", error: missing });
      let nullConnect: string | undefined;
      try {
        await local.query(`SELECT "db""link".dblink_connect(NULL)`);
      } catch (error) {
        nullConnect = error instanceof Error ? error.message : "unknown";
      }
      observations.push({ member: "dblink_connect-null", error: nullConnect ?? "strict-null" });
    } finally {
      await local.end();
    }
    await admin.query(`DROP DATABASE IF EXISTS ${pg.escapeIdentifier(remoteName)} WITH (FORCE)`);
  } finally {
    await admin.end();
  }
  mkdirSync("/tmp/loom-typed-extensions-work", { recursive: true });
  const path = `/tmp/loom-typed-extensions-work/dblink-native-${suffix}.json`;
  writeFileSync(path, redact(JSON.stringify({ container, observations }, null, 2), url), { mode: 0o600 });
  console.log(JSON.stringify({ container, observationPath: path, count: observations.length }));
} finally {
  execute(["docker", "rm", "-f", container]);
}
