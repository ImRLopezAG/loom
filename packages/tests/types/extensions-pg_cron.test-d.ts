import { expectTypeOf } from "vite-plus/test";
import type { SQL } from "drizzle-orm";
import {
  createPgCron_1_6,
  type CronJob,
  type CronRunDetail,
} from "../../../apps/loom/src/core/extensions/adapters/pg_cron";
import { withPgCron, type CronOperatorSession } from "../../../apps/loom/src/tooling/extensions/operations/pg_cron";
import { pgCronDescriptor } from "../../e2e/fixtures/pg_cron";
function types(): void {
  const binding = createPgCron_1_6(pgCronDescriptor);
  expectTypeOf(binding.version).toEqualTypeOf<"1.6">();
  expectTypeOf(binding.schema).toEqualTypeOf<"pg_catalog">();
  expectTypeOf(binding.jobRows("j").columns.jobid).toEqualTypeOf<SQL<bigint>>();
  expectTypeOf(binding.runDetailRows("r").columns.start_time).toEqualTypeOf<SQL<CronRunDetail["start_time"]>>();
  // @ts-expect-error No scheduler mutations in application context.
  void binding.sql.functions.schedule;
  // @ts-expect-error Exact SQL version.
  createPgCron_1_6({ ...pgCronDescriptor, version: "1.5" });
  void withPgCron("postgresql://operator/fixture", pgCronDescriptor, async (session) => {
    expectTypeOf(session).toEqualTypeOf<CronOperatorSession>();
    expectTypeOf(await session.schedule("* * * * *", "SELECT 1")).toEqualTypeOf<bigint | null>();
    expectTypeOf(await session.sql.functions.schedule("uuid", "1 second", "SELECT 1")).toEqualTypeOf<bigint | null>();
    const jobs: readonly CronJob[] = await session.jobs();
    const details: readonly CronRunDetail[] = await session.runDetails(1n);
    await session.alterJob(1n, { active: false, schedule: null });
    await session.sql.functions.unschedule("uuid");
    // @ts-expect-error Job IDs are bigint.
    await session.unschedule(1);
    // @ts-expect-error Exact schedule arity.
    await session.schedule("SELECT 1");
    // @ts-expect-error Native bool active.
    await session.scheduleInDatabase("uuid", "* * * * *", "SELECT 1", "postgres", null, "false");
    // @ts-expect-error Closed operator API never exposes a raw client.
    void session.client;
    return [jobs, details];
  });
}
void types;
