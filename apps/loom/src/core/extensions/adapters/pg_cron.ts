import { sql } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { withCodecSqlType } from "../codecs";
import { extensionRows } from "../rows";
import { checkedExtensionExpression } from "../sql";
import {
  cronJobFields,
  cronRunDetailFields,
  cronJobCodec,
  cronRunDetailCodec,
  cronJobArrayCodec,
  cronRunDetailArrayCodec,
} from "./pg_cron-codecs";
export type { CronJob, CronRunDetail } from "./pg_cron-codecs";

/** Scheduler writes require the separate operator boundary, even for native PUBLIC EXECUTE routines. */
export function createPgCron_1_6<
  const Descriptor extends ExtensionDescriptor<"pg_cron", { version: "1.6"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "pg_cron" ||
    descriptor.version !== "1.6" ||
    descriptor.schema !== "pg_catalog" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== "a5b37c25b617856dbc5afb7a7e1d409e362baf9a809ae384920cbe5b18acff4c"
  )
    throw new Error("pg_cron 1.6 requires its exact verified pg_catalog contract");
  const jobs = () =>
    checkedExtensionExpression(sql`"cron"."job"`, cronJobCodec, [], undefined, "table:cron.job", "external");
  const runs = () =>
    checkedExtensionExpression(
      sql`"cron"."job_run_details"`,
      cronRunDetailCodec,
      [],
      undefined,
      "table:cron.job_run_details",
      "external",
    );
  return bindExtension(descriptor, {
    jobRows: (alias: string) => extensionRows(jobs(), alias, cronJobFields, "named"),
    runDetailRows: (alias: string) => extensionRows(runs(), alias, cronRunDetailFields, "named"),
    jobCodec: withCodecSqlType(cronJobCodec, { schema: "cron", name: "job" }),
    runDetailCodec: withCodecSqlType(cronRunDetailCodec, { schema: "cron", name: "job_run_details" }),
    jobArrayCodec: withCodecSqlType(cronJobArrayCodec, { schema: "cron", name: "job", array: true }),
    runDetailArrayCodec: withCodecSqlType(cronRunDetailArrayCodec, {
      schema: "cron",
      name: "job_run_details",
      array: true,
    }),
    sql: Object.freeze({ functions: Object.freeze({}), operators: Object.freeze({}) }),
  });
}
