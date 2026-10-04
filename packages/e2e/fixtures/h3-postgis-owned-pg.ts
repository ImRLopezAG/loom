import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import pg from "pg";

export const H3_POSTGIS_IMAGE = "sha256:75b44aeefa7df1a7bf697063db8362f3332d742b4c5d6db9fe11852786474879";
export const H3_POSTGIS_DIGEST = "9803892394c3cec2d4305ca64a925baefbe37c9108e8bb2601c7f384575f481e";
export const H3_POSTGIS_CUSTOM_PLACEMENT = {
  h3: "custom H3",
  postgis: "postgis 地",
  postgis_raster: "postgis 地",
  h3_postgis: "h3 Pg",
} as const;
export const H3_POSTGIS_DEFAULT_PLACEMENT = {
  h3: "extensions",
  postgis: "extensions",
  postgis_raster: "extensions",
  h3_postgis: "extensions",
} as const;
export const H3_POSTGIS_CONFIGURED_PLACEMENT = {
  h3: "h3_custom",
  postgis: "postgis_custom",
  postgis_raster: "postgis_custom",
  h3_postgis: "h3_postgis_custom",
} as const;
export type H3PostgisPlacement = { readonly [Key in keyof typeof H3_POSTGIS_CUSTOM_PLACEMENT]: string };
const execute = (args: string[]) => execFileSync("docker", args, { encoding: "utf8", stdio: "pipe" }).trim();

/** Retained exact primary-source image. No build, installation, provider access, or shared fixture. */
export async function startH3PostgisOwnedPg(directory: string) {
  const runId = randomUUID();
  const container = `loom-h3-postgis-${runId}`;
  const journal = join(directory, `owned-${runId}.jsonl`);
  await mkdir(directory, { recursive: true });
  const record = (event: string, fields: { database?: string; image?: string; placement?: H3PostgisPlacement } = {}) =>
    appendFile(journal, JSON.stringify({ runId, container, event, ...fields }) + "\n", { mode: 0o600 });
  assert.equal(execute(["image", "inspect", H3_POSTGIS_IMAGE, "--format", "{{.Id}}"]), H3_POSTGIS_IMAGE);
  const password = randomUUID();
  await record("container-attempted", { image: H3_POSTGIS_IMAGE });
  execute([
    "run",
    "-d",
    "--name",
    container,
    "--label",
    `loom.h3-postgis.owner=${runId}`,
    "-e",
    `POSTGRES_PASSWORD=${password}`,
    "-p",
    "127.0.0.1::5432",
    H3_POSTGIS_IMAGE,
  ]);
  await record("container-created");
  const databases: string[] = [];
  let control: pg.Client | undefined;
  try {
    const port = /127\.0\.0\.1:(\d+)/.exec(execute(["port", container, "5432/tcp"]))?.[1];
    assert(port);
    const base = new URL(`postgresql://127.0.0.1:${port}/postgres`);
    base.username = "postgres";
    base.password = password;
    for (let attempt = 0; attempt < 120; attempt++) {
      const candidate = new pg.Client({ connectionString: base.href });
      try {
        await candidate.connect();
        control = candidate;
        break;
      } catch (cause) {
        await candidate.end();
        if (attempt === 119) throw cause;
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
    assert(control);
    assert.equal(
      Math.floor(
        Number(
          (await control.query<{ server_version_num: string }>("SHOW server_version_num")).rows[0]!.server_version_num,
        ) / 10000,
      ),
      18,
    );
    const connected = control;
    return {
      runId,
      container,
      journal,
      async provision(placement: H3PostgisPlacement) {
        assert.equal(placement.postgis, placement.postgis_raster, "Native raster requires PostGIS's schema");
        const database = `loom_h3pg_${randomUUID().replaceAll("-", "")}`;
        databases.push(database);
        await record("database-attempted", { database, placement });
        await connected.query(`CREATE DATABASE ${pg.escapeIdentifier(database)}`);
        await record("database-created", { database });
        const url = new URL(base.href);
        url.pathname = `/${database}`;
        const client = new pg.Client({ connectionString: url.href });
        await client.connect();
        try {
          for (const schema of new Set(Object.values(placement)))
            await client.query(`CREATE SCHEMA ${pg.escapeIdentifier(schema)}`);
          for (const [name, version] of [
            ["postgis", "3.6.4"],
            ["postgis_raster", "3.6.4"],
            ["h3", "4.2.3"],
            ["h3_postgis", "4.2.3"],
          ] as const)
            await client.query(
              `CREATE EXTENSION ${pg.escapeIdentifier(name)} WITH SCHEMA ${pg.escapeIdentifier(placement[name])} VERSION '${version}'`,
            );
          const observed = await client.query<{ extname: string; extversion: string; schema: string }>(
            "SELECT e.extname,e.extversion,n.nspname AS schema FROM pg_extension e JOIN pg_namespace n ON n.oid=e.extnamespace WHERE e.extname=ANY($1::text[]) ORDER BY e.extname",
            [Object.keys(placement)],
          );
          assert.deepEqual(observed.rows, [
            { extname: "h3", extversion: "4.2.3", schema: placement.h3 },
            { extname: "h3_postgis", extversion: "4.2.3", schema: placement.h3_postgis },
            { extname: "postgis", extversion: "3.6.4", schema: placement.postgis },
            { extname: "postgis_raster", extversion: "3.6.4", schema: placement.postgis_raster },
          ]);
          await connected.query(
            `ALTER DATABASE ${pg.escapeIdentifier(database)} SET search_path TO ${[...new Set([placement.h3_postgis, placement.h3, placement.postgis]), "pg_catalog", "public"].map(pg.escapeIdentifier).join(",")}`,
          );
        } finally {
          await client.end();
        }
        return url.href;
      },
      async stop() {
        try {
          for (const database of databases) {
            await connected.query(`DROP DATABASE IF EXISTS ${pg.escapeIdentifier(database)} WITH (FORCE)`);
            await record("database-dropped", { database });
            const observed = await connected.query("SELECT 1 FROM pg_database WHERE datname=$1", [database]);
            assert.equal(observed.rowCount, 0);
            await record("database-absent", { database });
          }
        } finally {
          await connected.end();
          execute(["rm", "-f", container]);
          await record("container-removed");
        }
      },
      async proveAbsent() {
        assert.equal(execute(["ps", "-aq", "--filter", `name=^${container}$`]), "");
        await record("container-absent");
      },
    };
  } catch (cause) {
    await control?.end();
    execute(["rm", "-f", container]);
    await record("container-removed-after-error");
    assert.equal(execute(["ps", "-aq", "--filter", `name=^${container}$`]), "");
    throw cause;
  }
}
