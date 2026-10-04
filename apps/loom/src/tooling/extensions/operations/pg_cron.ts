import * as v from "valibot";
import { createPgCron_1_6 } from "../../../core/extensions/adapters/pg_cron";
import {
  cronJobCodec,
  cronRunDetailCodec,
  type CronJob,
  type CronRunDetail,
} from "../../../core/extensions/adapters/pg_cron-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { booleanCodec, integerCodec, nullableCodec, textCodec } from "../../../core/extensions/codecs";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { acquireExtensionLock } from "../../migrations/connection";
import { withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/pg_cron.json";

const text = nullableCodec(textCodec);
const int8 = nullableCodec(integerCodec);
const bool = nullableCodec(booleanCodec);
export const cronAlterJobValidator = v.strictObject({
  schedule: v.optional(v.nullable(v.string())),
  command: v.optional(v.nullable(v.string())),
  database: v.optional(v.nullable(v.string())),
  username: v.optional(v.nullable(v.string())),
  active: v.optional(v.nullable(v.boolean())),
});
export type CronAlterJob = v.InferInput<typeof cronAlterJobValidator>;
export interface CronPrerequisites {
  readonly database: string;
  readonly username: string;
  readonly sharedPreloadLibraries: string;
  readonly cronDatabase: string | null;
  readonly timezone: string | null;
  readonly host: string | null;
  readonly useBackgroundWorkers: string | null;
  readonly logRun: string | null;
  readonly launchActiveJobs: string | null;
  readonly maxRunningJobs: string | null;
  readonly maxWorkerProcesses: string;
  readonly scheduleInDatabaseExecutable: boolean;
  readonly alterJobExecutable: boolean;
  /** libpq mode also requires job-role authentication; scheduler execution is proven by job run readback. */
  readonly execution: "requires-native-job-readback";
}
export interface CronSchedule {
  (schedule: string | null, command: string | null): Promise<bigint | null>;
  (name: string | null, schedule: string | null, command: string | null): Promise<bigint | null>;
}
export interface CronUnschedule {
  (jobId: bigint | null): Promise<boolean | null>;
  (jobName: string | null): Promise<boolean | null>;
}
export interface CronOperatorSession {
  readonly prerequisites: () => Promise<CronPrerequisites>;
  readonly jobs: () => Promise<readonly CronJob[]>;
  readonly job: (id: bigint) => Promise<CronJob | undefined>;
  readonly runDetails: (id: bigint) => Promise<readonly CronRunDetail[]>;
  /** A named job is unique per name and username, not per database; PostgreSQL performs native upsert. */
  readonly schedule: CronSchedule;
  readonly scheduleInDatabase: (
    name: string | null,
    schedule: string | null,
    command: string | null,
    database: string | null,
    username?: string | null,
    active?: boolean | null,
  ) => Promise<bigint | null>;
  readonly alterJob: (id: bigint, changes?: CronAlterJob) => Promise<void>;
  readonly unschedule: CronUnschedule;
  readonly sql: {
    readonly functions: {
      readonly schedule: CronSchedule;
      readonly schedule_in_database: CronOperatorSession["scheduleInDatabase"];
      readonly alter_job: CronOperatorSession["alterJob"];
      readonly unschedule: CronUnschedule;
    };
    readonly operators: Readonly<Record<never, never>>;
  };
}

/** Owned transaction; committed jobs persist. No implicit job deletion or retry. Native RLS/privileges apply. */
export async function withPgCron<Result>(
  directOperatorUrl: string,
  descriptor: ExtensionDescriptor<"pg_cron", { version: "1.6"; schema: string }>,
  callback: (session: CronOperatorSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result }> {
  createPgCron_1_6(descriptor);
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  return withExtensionOperation(
    directOperatorUrl,
    async (context): Promise<CronOperatorSession> => {
      await acquireExtensionLock(context.client, signal);
      await verifyExtensionApiContracts(context.client, [requirement]);
      await context.client.query("SET LOCAL DateStyle = 'ISO, YMD'; SET LOCAL TimeZone = 'UTC'");
      const schedule: CronSchedule = (
        ...args: [string | null, string | null] | [string | null, string | null, string | null]
      ) =>
        context.run(async () => {
          const parameters = args.map((value) => text.encode(value));
          const signature =
            args.length === 2
              ? "$1::pg_catalog.text,$2::pg_catalog.text"
              : "$1::pg_catalog.text,$2::pg_catalog.text,$3::pg_catalog.text";
          const result = await context.client.query(
            `SELECT cron.schedule(${signature})::pg_catalog.text AS value`,
            parameters,
          );
          return int8.decode(result.rows[0].value);
        });
      const scheduleInDatabase: CronOperatorSession["scheduleInDatabase"] = (
        name,
        schedule,
        command,
        database,
        username,
        active,
      ) =>
        context.run(async () => {
          const parameters = [name, schedule, command, database].map((value) => text.encode(value));
          let signature = "$1::pg_catalog.text,$2::pg_catalog.text,$3::pg_catalog.text,$4::pg_catalog.text";
          if (username !== undefined || active !== undefined) {
            parameters.push(text.encode(username ?? null));
            signature += ",$5::pg_catalog.text";
          }
          if (active !== undefined) {
            parameters.push(bool.encode(active));
            signature += ",$6::pg_catalog.bool";
          }
          const result = await context.client.query(
            `SELECT cron.schedule_in_database(${signature})::pg_catalog.text AS value`,
            parameters,
          );
          return int8.decode(result.rows[0].value);
        });
      const alterJob: CronOperatorSession["alterJob"] = (id, changes = {}) =>
        context.run(async () => {
          const checked = v.parse(cronAlterJobValidator, changes);
          await context.client.query(
            "SELECT cron.alter_job($1::pg_catalog.int8,$2::pg_catalog.text,$3::pg_catalog.text,$4::pg_catalog.text,$5::pg_catalog.text,$6::pg_catalog.bool)",
            [
              integerCodec.encode(id),
              text.encode(checked.schedule ?? null),
              text.encode(checked.command ?? null),
              text.encode(checked.database ?? null),
              text.encode(checked.username ?? null),
              bool.encode(checked.active ?? null),
            ],
          );
        });
      const unschedule: CronUnschedule = (selector: bigint | string | null) =>
        context.run(async () => {
          const isName = v.is(v.string(), selector);
          const result = await context.client.query(
            `SELECT cron.unschedule($1::pg_catalog.${isName ? "text" : "int8"}) AS value`,
            [isName ? text.encode(selector) : int8.encode(selector)],
          );
          return bool.decode(result.rows[0].value);
        });
      async function jobs(id?: bigint) {
        const result = await context.client.query(
          `SELECT ROW(j.*)::pg_catalog.text AS value FROM cron.job AS j ${id === undefined ? "" : "WHERE jobid=$1::pg_catalog.int8"} ORDER BY jobid`,
          id === undefined ? [] : [integerCodec.encode(id)],
        );
        return Object.freeze(
          v
            .parse(v.array(v.strictObject({ value: v.string() })), result.rows)
            .map((row) => cronJobCodec.decode(row.value)),
        );
      }
      return Object.freeze({
        prerequisites: () =>
          context.run(async () => {
            const result = await context.client.query(`SELECT current_database() AS database, current_user AS username,
          current_setting('shared_preload_libraries') AS preload, current_setting('cron.database_name',true) AS cron_database,
          current_setting('cron.timezone',true) AS timezone, current_setting('cron.host',true) AS host,
          current_setting('cron.use_background_workers',true) AS workers, current_setting('cron.log_run',true) AS log_run,
          current_setting('cron.launch_active_jobs',true) AS launch, current_setting('cron.max_running_jobs',true) AS max_jobs,
          current_setting('max_worker_processes') AS max_workers,
          has_function_privilege(current_user,'cron.schedule_in_database(text,text,text,text,text,boolean)','EXECUTE') AS schedule,
          has_function_privilege(current_user,'cron.alter_job(bigint,text,text,text,text,boolean)','EXECUTE') AS alter`);
            const [row] = v.parse(
              v.tuple([
                v.strictObject({
                  database: v.string(),
                  username: v.string(),
                  preload: v.string(),
                  cron_database: v.nullable(v.string()),
                  timezone: v.nullable(v.string()),
                  host: v.nullable(v.string()),
                  workers: v.nullable(v.string()),
                  log_run: v.nullable(v.string()),
                  launch: v.nullable(v.string()),
                  max_jobs: v.nullable(v.string()),
                  max_workers: v.string(),
                  schedule: v.boolean(),
                  alter: v.boolean(),
                }),
              ]),
              result.rows,
            );
            return {
              database: row.database,
              username: row.username,
              sharedPreloadLibraries: row.preload,
              cronDatabase: row.cron_database,
              timezone: row.timezone,
              host: row.host,
              useBackgroundWorkers: row.workers,
              logRun: row.log_run,
              launchActiveJobs: row.launch,
              maxRunningJobs: row.max_jobs,
              maxWorkerProcesses: row.max_workers,
              scheduleInDatabaseExecutable: row.schedule,
              alterJobExecutable: row.alter,
              execution: "requires-native-job-readback",
            } as const;
          }),
        jobs: () => context.run(() => jobs()),
        job: (id: bigint) => context.run(async () => (await jobs(id))[0]),
        runDetails: (id: bigint) =>
          context.run(async () => {
            const result = await context.client.query(
              "SELECT ROW(r.*)::pg_catalog.text AS value FROM cron.job_run_details AS r WHERE jobid=$1::pg_catalog.int8 ORDER BY runid",
              [integerCodec.encode(id)],
            );
            return Object.freeze(
              v
                .parse(v.array(v.strictObject({ value: v.string() })), result.rows)
                .map((row) => cronRunDetailCodec.decode(row.value)),
            );
          }),
        schedule,
        scheduleInDatabase,
        alterJob,
        unschedule,
        sql: Object.freeze({
          functions: Object.freeze({
            schedule,
            schedule_in_database: scheduleInDatabase,
            alter_job: alterJob,
            unschedule,
          }),
          operators: Object.freeze({}),
        }),
      });
    },
    callback,
    signal,
  );
}
