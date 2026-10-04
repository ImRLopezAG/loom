import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { appendFile, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";

const image = "loom-postgis-core-3.6.4-pg18:local";
const archive = "/tmp/loom-postgis-3.6.4-source/postgis-3.6.4.tar.gz";
const archiveDigest = "ed8dc6679f1e06f7b113592b04cde2a7e00f1b1e681294c8ca2204058990cec6";

function docker(...args: string[]) {
  const result = spawnSync("docker", args, { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
  return result.stdout.trim();
}

/** An independently owned UUID container; only exact hash-verified upstream data SQL is installed. */
export async function startDataUsOwnedPg() {
  assert.equal(
    createHash("sha256")
      .update(await readFile(archive))
      .digest("hex"),
    archiveDigest,
  );
  docker("image", "inspect", image);
  const runId = randomUUID();
  const container = `loom-data-us-gen-${runId}`;
  const journalFile = join(tmpdir(), `loom-data-us-gen-${runId}.jsonl`);
  const directory = await mkdtemp(join(tmpdir(), "loom-data-us-package-"));
  const journal = async (event: string, detail = {}) =>
    appendFile(journalFile, `${JSON.stringify({ event, runId, container, ...detail })}\n`, { mode: 0o600 });
  let port = 0;
  let started = false;
  const extract = (name: string) => {
    const result = spawnSync("tar", ["-xOf", archive, `postgis-3.6.4/extensions/address_standardizer/${name}`], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
    });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  };
  const stop = async () => {
    await journal("cleanup-intent");
    if (started) docker("rm", "-f", container);
    started = false;
    await rm(directory, { recursive: true, force: true });
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
    const sql = [
      "us_lex.sql",
      "us_gaz.sql",
      "us_rules.sql",
      "sql_bits/address_standardizer_data_us_mark_editable_objects.sql.in",
    ]
      .map(extract)
      .join("\n");
    await writeFile(join(directory, "address_standardizer_data_us--3.6.4.sql"), sql);
    await writeFile(
      join(directory, "address_standardizer_data_us.control"),
      extract("address_standardizer_data_us.control.in").replaceAll("@EXTVERSION@", "3.6.4"),
    );
    await journal("container-intent", { image, archiveDigest });
    docker("run", "-d", "--name", container, "-e", "POSTGRES_HOST_AUTH_METHOD=trust", "-p", "127.0.0.1::5432", image);
    started = true;
    for (let attempt = 0; attempt < 60; attempt++) {
      if (spawnSync("docker", ["exec", container, "pg_isready", "-h", "127.0.0.1", "-U", "postgres"]).status === 0)
        break;
      assert(attempt < 59, "Owned PostgreSQL did not start");
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    for (const file of ["address_standardizer_data_us--3.6.4.sql", "address_standardizer_data_us.control"])
      docker("cp", join(directory, file), `${container}:/usr/share/postgresql/18/extension/${file}`);
    port = Number(docker("port", container, "5432/tcp").split(":").at(-1));
    assert(Number.isInteger(port) && port > 0);
    await journal("ready", { port });
    return {
      runId,
      container,
      journalFile,
      async provision(schema: string) {
        const database = `dataus_${randomUUID().replaceAll("-", "")}`;
        await journal("database-ddl-intent", { database, schema });
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
            schema,
            extension: "address_standardizer_data_us",
            version: "3.6.4",
          });
          await client.query(
            `CREATE SCHEMA ${pg.escapeIdentifier(schema)}; CREATE EXTENSION address_standardizer_data_us WITH SCHEMA ${pg.escapeIdentifier(schema)} VERSION '3.6.4'`,
          );
          const installed = await client.query(
            "SELECT e.extname,e.extversion,n.nspname FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname LIKE 'address_standardizer%'",
          );
          assert.deepEqual(installed.rows, [
            { extname: "address_standardizer_data_us", extversion: "3.6.4", nspname: schema },
          ]);
          assert.equal(
            Math.floor(Number((await client.query("SHOW server_version_num")).rows[0].server_version_num) / 10000),
            18,
          );
          await journal("installed", { database, schema, exactVersion: true, baseAbsent: true });
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
