import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { appendFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
import { POSTGIS_TIGER_FIXED_SCHEMA } from "./postgis-tiger-geocoder-generated-project.ts";

const image = process.env.LOOM_POSTGIS_TIGER_GEOCODER_IMAGE ?? "loom-postgis-tiger-geocoder-3.6.4-pg18:local";

function docker(...args: string[]) {
  const result = spawnSync("docker", args, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

function quote(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

/** Independently owned UUID container. Installs exact 3.6.4 only; never fetches census data. */
export async function startPostgisTigerGeocoderOwnedPg() {
  docker("image", "inspect", image);
  const runId = randomUUID();
  const container = `loom-tiger-gen-${runId}`;
  const journalFile = join(tmpdir(), `loom-tiger-gen-${runId}.jsonl`);
  const journal = async (event: string, detail: Record<string, unknown> = {}) =>
    appendFile(journalFile, `${JSON.stringify({ event, runId, container, ...detail })}\n`, { mode: 0o600 });
  let port = 0;
  let started = false;
  const stop = async () => {
    await journal("cleanup-intent");
    if (started) docker("rm", "-f", container);
    started = false;
    await journal("removed");
  };
  const proveAbsent = async () => {
    assert.notEqual(spawnSync("docker", ["inspect", container]).status, 0);
    assert.equal(docker("ps", "-aq", "--filter", `name=^${container}$`), "");
    if (port) {
      const client = new pg.Client({
        host: "127.0.0.1",
        port,
        user: "postgres",
        database: "postgres",
        connectionTimeoutMillis: 1000,
      });
      try {
        await assert.rejects(client.connect());
      } finally {
        await client.end();
      }
    }
    await journal("independent-absence-proven", { port });
  };
  try {
    await journal("container-intent", { image });
    docker("run", "-d", "--name", container, "-e", "POSTGRES_HOST_AUTH_METHOD=trust", "-p", "127.0.0.1::5432", image);
    started = true;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (spawnSync("docker", ["exec", container, "pg_isready", "-h", "127.0.0.1", "-U", "postgres"]).status === 0) break;
      assert(attempt < 59, "Owned PostgreSQL did not start");
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    port = Number(docker("port", container, "5432/tcp").split(":").at(-1));
    assert(Number.isInteger(port) && port > 0);
    await journal("ready", { port });
    return {
      runId,
      container,
      journalFile,
      async provision(postgisSchema: string) {
        const database = `tiger_${randomUUID().replaceAll("-", "")}`;
        await journal("database-ddl-intent", { database, postgisSchema, tigerSchema: POSTGIS_TIGER_FIXED_SCHEMA });
        const admin = new pg.Client({ host: "127.0.0.1", port, user: "postgres", database: "postgres" });
        try {
          await admin.connect();
          await admin.query(`CREATE DATABASE ${pg.escapeIdentifier(database)}`);
        } finally {
          await admin.end();
        }
        const connectionString = `postgresql://postgres@127.0.0.1:${port}/${database}`;
        const client = new pg.Client({ connectionString });
        try {
          await client.connect();
          await journal("extension-ddl-intent", {
            database,
            postgisSchema,
            tigerSchema: POSTGIS_TIGER_FIXED_SCHEMA,
            extensions: ["fuzzystrmatch", "postgis", "postgis_tiger_geocoder"],
            versions: { postgis: "3.6.4", postgis_tiger_geocoder: "3.6.4" },
          });
          await client.query("CREATE EXTENSION fuzzystrmatch");
          if (postgisSchema !== "public") await client.query(`CREATE SCHEMA IF NOT EXISTS ${quote(postgisSchema)}`);
          await client.query(`CREATE EXTENSION postgis WITH SCHEMA ${quote(postgisSchema)} VERSION '3.6.4'`);
          if (postgisSchema !== "public") {
            await journal("native-condition", {
              condition: "postgis_tiger_geocoder--3.6.4.sql resolves unqualified geometry only from public during CREATE EXTENSION",
              postgisSchema,
            });
          }
          await client.query("CREATE EXTENSION postgis_tiger_geocoder VERSION '3.6.4'");
          await client.query(`ALTER DATABASE ${pg.escapeIdentifier(database)} SET search_path TO ${quote(postgisSchema)}, tiger, public`);
          const installed = await client.query<{ extname: string; extversion: string; nspname: string }>(
            `SELECT e.extname, e.extversion, n.nspname
             FROM pg_catalog.pg_extension e
             JOIN pg_catalog.pg_namespace n ON n.oid = e.extnamespace
             WHERE e.extname = ANY($1::text[])
             ORDER BY e.extname`,
            [["fuzzystrmatch", "postgis", "postgis_tiger_geocoder"]],
          );
          const byName = Object.fromEntries(installed.rows.map((row) => [row.extname, row]));
          assert.equal(byName.postgis?.extversion, "3.6.4");
          assert.equal(byName.postgis?.nspname, postgisSchema);
          assert.equal(byName.postgis_tiger_geocoder?.extversion, "3.6.4");
          assert.equal(byName.postgis_tiger_geocoder?.nspname, POSTGIS_TIGER_FIXED_SCHEMA);
          assert.ok(byName.fuzzystrmatch);
          assert.equal(Math.floor(Number((await client.query("SHOW server_version_num")).rows[0]!.server_version_num) / 10000), 18);
          const empty = await client.query<{ n: string }>("SELECT count(*)::text AS n FROM tiger.addr");
          const states = await client.query<{ n: string }>("SELECT count(*)::text AS n FROM tiger.state_lookup");
          assert.equal(Number(empty.rows[0]?.n), 0);
          assert.equal(Number(states.rows[0]?.n), 59);
          await journal("installed", {
            database,
            postgisSchema,
            tigerSchema: POSTGIS_TIGER_FIXED_SCHEMA,
            exactVersion: true,
            emptyAddr: 0,
            stateLookup: 59,
            loaderExecuted: false,
            nativeCondition: "CREATE EXTENSION postgis_tiger_geocoder 3.6.4 requires public.geometry",
          });
        } finally {
          await client.end();
        }
        return connectionString;
      },
      journal,
      stop,
      proveAbsent,
    };
  } catch (cause) {
    await stop();
    await proveAbsent();
    throw cause;
  }
}
