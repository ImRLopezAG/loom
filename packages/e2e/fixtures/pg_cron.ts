import assert from "node:assert/strict";
import pg from "pg";
import * as v from "valibot";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/pg_cron.json";
import { captureExtensionContract } from "../../../apps/loom/src/tooling/extensions/capture";

export const pgCronDescriptor = {
  name: "pg_cron",
  version: "1.6",
  schema: "pg_catalog",
  apiSupport: { status: "verified", digest: manifest.digest },
} as const;

/** This fixture owns a dedicated preloaded local cluster; it never accepts a provider URL. */
export function pgCronLocalUrl(): string {
  const value = process.env.LOOM_PG_CRON_LOCAL_URL;
  assert(value, "LOOM_PG_CRON_LOCAL_URL must identify the owned preloaded local fixture");
  const url = new URL(value);
  assert(["127.0.0.1", "localhost", "[::1]"].includes(url.hostname), "pg_cron fixture must be local");
  return value;
}

/** Native characterization, deliberately independent of the new family adapter/operator code. */
export async function characterizePgCron(url: string) {
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const prefix = `loom_cron_${crypto.randomUUID().replaceAll("-", "")}`;
  const owned: string[] = [];
  try {
    await client.query("CREATE EXTENSION IF NOT EXISTS pg_cron VERSION '1.6'");
    const capture = await captureExtensionContract(client, {
      name: "pg_cron",
      provider: "neon",
      fixture: "local-pg18-preloaded-pg_cron-characterization",
    });
    assert.equal(capture.digest, manifest.digest, "Local SQL inventory must equal the pinned manifest");
    const settings = (
      await client.query(`SELECT current_setting('server_version') AS server,
      current_setting('shared_preload_libraries') AS preload,
      current_setting('cron.database_name') AS database,
      current_setting('cron.timezone') AS timezone,
      current_setting('cron.use_background_workers') AS workers,
      current_setting('cron.host') AS host,
      current_setting('cron.log_run') AS log_run`)
    ).rows[0];
    const permissions = (
      await client.query(`SELECT p.oid::regprocedure::text AS identity, p.prosecdef AS security_definer,
      p.proisstrict AS strict, pg_get_expr(p.proargdefaults,0) AS defaults,
      has_function_privilege('public',p.oid,'EXECUTE') AS public_execute
      FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE n.nspname='cron' ORDER BY 1`)
    ).rows;
    async function id(sql: string, parameters: string[]) {
      const row = v.parse(v.strictObject({ id: v.string() }), (await client.query(sql, parameters)).rows[0]);
      owned.push(row.id);
      return row.id;
    }
    const anonymous = await id("SELECT cron.schedule($1::text,$2::text)::text AS id", ["0 0 1 1 *", "SELECT 1"]);
    const named = await id("SELECT cron.schedule($1::text,$2::text,$3::text)::text AS id", [
      prefix,
      "0 0 1 1 *",
      "SELECT '☃'::text",
    ]);
    const replacement = await id("SELECT cron.schedule($1::text,$2::text,$3::text)::text AS id", [
      prefix,
      "0 0 $ * *",
      "SELECT 2",
    ]);
    assert.equal(replacement, named, "Name/current-user identity upserts the existing job");
    const database = await id("SELECT cron.schedule_in_database($1::text,$2::text,$3::text,$4::text)::text AS id", [
      prefix + "_db",
      "0 0 1 1 *",
      "SELECT 3",
      "postgres",
    ]);
    const inactive = await id(
      "SELECT cron.schedule_in_database($1::text,$2::text,$3::text,$4::text,$5::text,$6::bool)::text AS id",
      [prefix + "_inactive", "1 second", "SELECT 4", "postgres", "postgres", "false"],
    );
    await assert.rejects(client.query("SELECT cron.alter_job($1::int8)", [named]), /no updates specified/);
    await client.query("SELECT cron.alter_job($1::int8,$2::text,$3::text,$4::text,$5::text,$6::bool)", [
      named,
      "59 seconds",
      "SELECT 5",
      "postgres",
      "postgres",
      false,
    ]);
    const jobs = (
      await client.query("SELECT ROW(j.*)::text AS value FROM cron.job j WHERE jobid=ANY($1::int8[]) ORDER BY jobid", [
        owned,
      ])
    ).rows.map((row) => row.value);
    const compositeArrays = (
      await client.query("SELECT array_agg(j)::text AS jobs FROM cron.job j WHERE jobid=ANY($1::int8[])", [owned])
    ).rows[0];
    const nullContracts = (
      await client.query(
        "SELECT cron.schedule(NULL::text,'SELECT 1') AS schedule, cron.unschedule(NULL::int8) AS id, cron.unschedule(NULL::text) AS name",
      )
    ).rows[0];
    assert.deepEqual(nullContracts, { schedule: null, id: null, name: null });
    await assert.rejects(
      client.query("SELECT cron.unschedule($1::text) AS value", [prefix + "_missing"]),
      /could not find valid entry/,
    );
    const missing = "XX000: could not find valid entry";
    const trigger = (
      await client.query(
        "SELECT pg_get_triggerdef(oid) AS definition FROM pg_trigger WHERE tgrelid='cron.job'::regclass AND tgname='cron_job_cache_invalidate'",
      )
    ).rows[0].definition;
    assert.match(trigger, /EXECUTE FUNCTION cron.job_cache_invalidate\(\)/);
    assert.equal((await client.query("SELECT cron.unschedule($1::text) AS value", [prefix])).rows[0].value, true);
    assert.equal((await client.query("SELECT cron.unschedule($1::int8) AS value", [anonymous])).rows[0].value, true);
    return {
      digest: capture.digest,
      memberCount: capture.contract.members.length,
      settings,
      permissions,
      jobs,
      compositeArrays,
      nullContracts,
      missing,
      trigger,
      invoked: [
        "schedule(text,text)",
        "schedule(text,text,text)",
        "schedule_in_database(text,text,text,text,text,bool)",
        "alter_job(int8,text,text,text,text,bool)",
        "unschedule(int8)",
        "unschedule(text)",
        "job_cache_invalidate():native-attached-trigger",
      ],
      ids: { anonymous, named, database, inactive },
    };
  } finally {
    try {
      // IDs originate exclusively from this invocation's schedules; never delete unrelated jobs.
      for (const id of new Set(owned))
        await client.query(
          "SELECT cron.unschedule($1::int8) WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobid=$1::int8)",
          [id],
        );
    } finally {
      await client.end();
    }
  }
}
