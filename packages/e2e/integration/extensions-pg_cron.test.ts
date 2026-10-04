import assert from "node:assert/strict";
import { setTimeout } from "node:timers/promises";
import pg from "pg";
import { defineRelations } from "drizzle-orm";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase } from "../../../apps/loom/src/core/server/database/connection";
import { extensionProofTest, extensionProofWitness } from "../fixtures/extension-proof";
import { observeExtensionProofDatabase } from "../fixtures/extension-proof-database";
import { pgCronDatabaseProofCase } from "../fixtures/pg_cron-proof-cases";
import { characterizePgCron, pgCronDescriptor, pgCronLocalUrl } from "../fixtures/pg_cron";
import { withPgCron, type CronOperatorSession } from "../../../apps/loom/src/tooling/extensions/operations/pg_cron";
import { ExtensionOperationError } from "../../../apps/loom/src/tooling/extensions/operations";
import { createPgCron_1_6 } from "../../../apps/loom/src/core/extensions/adapters/pg_cron";
import {
  cronJobCodec,
  cronJobArrayCodec,
  cronRunDetailCodec,
  cronRunDetailArrayCodec,
} from "../../../apps/loom/src/core/extensions/adapters/pg_cron-codecs";

extensionProofTest(
  pgCronDatabaseProofCase,
  async () => {
    const url = pgCronLocalUrl();
    const characterization = await characterizePgCron(url);
    assert.equal(characterization.memberCount, 70);
    const client = new pg.Client({ connectionString: url });
    await client.connect();
    const prefix = `loom_cron_${crypto.randomUUID().replaceAll("-", "")}`;
    const role = prefix + "_role";
    const ownedIds = new Set<bigint>();
    let roleCreated = false;
    const ownership = (id: bigint | null) => {
      assert(id !== null);
      ownedIds.add(id);
      return id;
    };
    try {
      await observeExtensionProofDatabase(url, pgCronDatabaseProofCase.id, "pg_cron");
      let retained: CronOperatorSession | undefined;
      const selected = createPgCron_1_6(pgCronDescriptor);
      const result = await withPgCron(url, pgCronDescriptor, async (session) => {
        retained = session;
        const prerequisites = await session.prerequisites();
        assert.equal(prerequisites.cronDatabase, "postgres");
        assert.match(prerequisites.sharedPreloadLibraries, /pg_cron/);
        assert.equal(prerequisites.useBackgroundWorkers, "on");
        assert.equal(prerequisites.timezone, "GMT");
        assert.equal(prerequisites.scheduleInDatabaseExecutable, true);
        assert.equal(prerequisites.alterJobExecutable, true);
        const anonymous = ownership(await session.sql.functions.schedule("0 0 1 1 *", `SELECT 1 /* ${prefix} */`));
        const named = ownership(await session.schedule(prefix, "0 0 $ * *", `SELECT 'a,"☃"'::text /* ${prefix} */`));
        assert.equal(await session.schedule(prefix, "0 0 1 1 *", "SELECT 2"), named);
        const cross = ownership(
          await session.sql.functions.schedule_in_database(prefix + "_db", "0 0 1 1 *", "SELECT 3", "postgres"),
        );
        const dormant = ownership(
          await session.scheduleInDatabase(prefix + "_inactive", "1 second", "SELECT 4", "postgres", null, false),
        );
        await session.sql.functions.alter_job(named, {
          schedule: "59 seconds",
          command: "SELECT 5",
          database: "postgres",
          username: "postgres",
          active: false,
        });
        assert.deepEqual(await session.job(named), {
          jobid: named,
          schedule: "59 seconds",
          command: "SELECT 5",
          nodename: "localhost",
          nodeport: 5432,
          database: "postgres",
          username: "postgres",
          active: false,
          jobname: prefix,
        });
        assert.equal((await session.job(anonymous))?.jobname, null);
        assert.equal((await session.job(cross))?.active, true);
        assert.equal((await session.job(dormant))?.active, false);
        assert.equal(await session.schedule(null, "SELECT 1"), null);
        assert.equal(await session.sql.functions.unschedule(null), null);
        assert.deepEqual(await session.runDetails(dormant), []);
        assert.equal(await session.unschedule(prefix), true);
        assert.equal(await session.unschedule(anonymous), true);
        assert.equal(await session.job(named), undefined);
        assert.equal(
          (await session.jobs()).some((j) => j.jobid === cross),
          true,
        );
        return { cross, dormant };
      });
      assert.equal(result.completion, "committed");
      await assert.rejects(retained!.jobs(), /inactive|owner/);

      // Real worker execution observes persistence after the operator transaction commits.
      const worker = ownership(
        (
          await withPgCron(url, pgCronDescriptor, (s) =>
            s.schedule(prefix + "_worker", "1 second", "SELECT 42 AS answer"),
          )
        ).value,
      );
      let detail: Awaited<ReturnType<CronOperatorSession["runDetails"]>> = [];
      const deadline = Date.now() + 20000;
      while (Date.now() < deadline) {
        detail = (await withPgCron(url, pgCronDescriptor, (s) => s.runDetails(worker))).value;
        if (detail.some((r) => r.status === "succeeded")) break;
        await setTimeout(100);
      }
      const success = detail.find((r) => r.status === "succeeded");
      assert(success, "Native worker must execute the owned job");
      assert.equal(success.jobid, worker);
      assert.equal(success.command, "SELECT 42 AS answer");
      assert.equal(success.return_message, "SELECT 1");
      assert(success.start_time && success.end_time);
      await withPgCron(url, pgCronDescriptor, (s) => s.unschedule(worker));

      // Composite and array encoders are native inputs; output is decoded after PostgreSQL canonicalizes booleans.
      const sample = {
        jobid: 9007199254740993n,
        schedule: "0 0 $ * *",
        command: "SELECT 'a,\"☃\"'",
        nodename: "localhost",
        nodeport: 5432,
        database: "postgres",
        username: "postgres",
        active: false,
        jobname: null,
      };
      const jobRoundtrip = await client.query("SELECT $1::cron.job::text AS value", [cronJobCodec.encode(sample)]);
      assert.deepEqual(cronJobCodec.decode(jobRoundtrip.rows[0].value), sample);
      const array = { dimensions: [{ lowerBound: -2, length: 2 }], values: [sample, null] };
      const arrays = await client.query("SELECT $1::cron.job[]::text AS value", [cronJobArrayCodec.encode(array)]);
      assert.deepEqual(cronJobArrayCodec.decode(arrays.rows[0].value), array);
      const run = {
        jobid: null,
        runid: 9223372036854775807n,
        job_pid: null,
        database: null,
        username: null,
        command: null,
        status: null,
        return_message: null,
        start_time: { type: "timestamptz", text: "2026-10-04 01:02:03.123456+00" } as const,
        end_time: null,
      };
      await client.query("SET DateStyle='ISO, YMD'; SET TimeZone='UTC'");
      const runs = await client.query("SELECT $1::cron.job_run_details::text AS value", [
        cronRunDetailCodec.encode(run),
      ]);
      assert.deepEqual(cronRunDetailCodec.decode(runs.rows[0].value), run);
      const runArray = { dimensions: [{ lowerBound: 3, length: 2 }], values: [run, null] };
      const runArrays = await client.query("SELECT $1::cron.job_run_details[]::text AS value", [
        cronRunDetailArrayCodec.encode(runArray),
      ]);
      assert.deepEqual(cronRunDetailArrayCodec.decode(runArrays.rows[0].value), runArray);

      const schema = defineSchema(() => ({}));
      const connection = await connectDatabase({
        schema,
        relations: defineRelations(schema.tables),
        connectionString: url,
      });
      try {
        const database = connection.db;
        const table = selected.jobRows("j");
        const rows = await database.select(table.columns).from(table.from);
        assert(rows.some((j) => j.jobid === result.value.dormant && !j.active));
        const runTable = selected.runDetailRows("r");
        const runRows = await database.select(runTable.columns).from(runTable.from);
        assert(runRows.some((r) => r.jobid === worker && r.start_time?.text === success.start_time!.text));
      } finally {
        await connection.close();
      }

      // Native scheduler table policies and permissions: only the UUID role's own job is visible.
      await client.query(`CREATE ROLE "${role}" LOGIN`);
      roleCreated = true;
      await client.query(`GRANT USAGE ON SCHEMA cron TO "${role}"`);
      const restricted = new URL(url);
      restricted.username = role;
      const roleId = ownership(
        (
          await withPgCron(restricted.href, pgCronDescriptor, (s) =>
            s.schedule(prefix + "_rolejob", "0 0 1 1 *", "SELECT 6"),
          )
        ).value,
      );
      const visible = (await withPgCron(restricted.href, pgCronDescriptor, (s) => s.jobs())).value;
      assert.deepEqual(
        visible.map((j) => j.jobid),
        [roleId],
      );
      assert.equal(visible[0]!.username, role);
      await assert.rejects(
        withPgCron(restricted.href, pgCronDescriptor, (s) => s.prerequisites()),
        (error) =>
          error instanceof ExtensionOperationError &&
          error.cause instanceof pg.DatabaseError &&
          error.cause.code === "42501",
      );
      await client.query(`GRANT pg_read_all_settings TO "${role}"`);
      assert.equal(
        (await withPgCron(restricted.href, pgCronDescriptor, (s) => s.prerequisites())).value
          .scheduleInDatabaseExecutable,
        false,
      );
      await assert.rejects(
        withPgCron(restricted.href, pgCronDescriptor, (s) => s.alterJob(roleId, { active: false })),
        (error) =>
          error instanceof ExtensionOperationError &&
          error.completion === "rolled-back" &&
          error.cause instanceof pg.DatabaseError &&
          error.cause.code === "42501",
      );
      await assert.rejects(
        withPgCron(restricted.href, pgCronDescriptor, (s) =>
          s.scheduleInDatabase(prefix + "_denied", "1 second", "SELECT 1", "postgres"),
        ),
        (error) =>
          error instanceof ExtensionOperationError &&
          error.cause instanceof pg.DatabaseError &&
          error.cause.code === "42501",
      );
      await assert.rejects(
        withPgCron(restricted.href, pgCronDescriptor, (s) => s.unschedule(result.value.dormant)),
        (error) => error instanceof ExtensionOperationError && error.cause instanceof pg.DatabaseError,
      );
      assert.equal(
        (await withPgCron(restricted.href, pgCronDescriptor, (s) => s.unschedule(prefix + "_rolejob"))).value,
        true,
      );

      const rollbackReason = new Error("rollback own UUID scheduled job");
      let rolled: bigint | undefined;
      await assert.rejects(
        withPgCron(url, pgCronDescriptor, async (s) => {
          rolled = ownership(await s.schedule(prefix + "_rollback", "0 0 1 1 *", "SELECT 7"));
          throw rollbackReason;
        }),
        (error) =>
          error instanceof ExtensionOperationError &&
          error.cause === rollbackReason &&
          error.completion === "rolled-back",
      );
      assert.equal((await client.query("SELECT 1 FROM cron.job WHERE jobid=$1", [rolled!.toString()])).rowCount, 0);
      for (const callback of [
        (s: CronOperatorSession) => s.alterJob(result.value.dormant),
        (s: CronOperatorSession) => s.unschedule(prefix + "_missing"),
        (s: CronOperatorSession) => s.schedule(prefix + "_invalid", "not a cron schedule", "SELECT 1"),
        (s: CronOperatorSession) => s.schedule(null, "1 second", "SELECT 1"),
      ])
        await assert.rejects(
          withPgCron(url, pgCronDescriptor, async (s) => {
            await callback(s);
          }),
          (error) =>
            error instanceof ExtensionOperationError &&
            error.completion === "rolled-back" &&
            error.cause instanceof pg.DatabaseError,
        );

      // Structural members are witnessed against the exact native capture before cleanup; the direct routines,
      // codecs, attached trigger, defaults, constraints and policies above provide semantic observations.
      for (const claim of pgCronDatabaseProofCase.claims)
        await extensionProofWitness({ ...claim, schema: "pg_catalog" }, () => {
          assert.equal(characterization.digest, pgCronDescriptor.apiSupport.digest);
          if (claim.member.includes("job_cache_invalidate"))
            assert.match(characterization.trigger, /AFTER INSERT OR DELETE OR UPDATE OR TRUNCATE/);
          if (claim.member.startsWith("routine:") && !claim.member.includes("job_cache_invalidate"))
            assert(characterization.invoked.some((name) => claim.member.includes(name.split("(")[0]!)));
        });
    } finally {
      try {
        for (const id of ownedIds) {
          await client.query(
            "SELECT cron.unschedule($1::int8) WHERE EXISTS(SELECT 1 FROM cron.job WHERE jobid=$1::int8)",
            [id.toString()],
          );
          await client.query("DELETE FROM cron.job_run_details WHERE jobid=$1::int8", [id.toString()]);
        }
        assert.equal(
          (
            await client.query("SELECT count(*)::int AS count FROM cron.job WHERE jobid=ANY($1::int8[])", [
              [...ownedIds].map(String),
            ])
          ).rows[0].count,
          0,
        );
        if (roleCreated) {
          await client.query(`DROP OWNED BY "${role}"`);
          await client.query(`DROP ROLE "${role}"`);
        }
      } finally {
        await client.end();
      }
    }
  },
  60000,
);
