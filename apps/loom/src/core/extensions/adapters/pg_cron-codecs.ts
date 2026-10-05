import {
  arrayCodec,
  booleanCodec,
  compositeCodec,
  integerCodec,
  nullableCodec,
  textCodec,
  type CompositeOutput,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { timestamptzCodec } from "../native-timestamp-codecs";

/** Native cron.job column order, including the nullable job name. IDs never pass through Number. */
export const cronJobFields = Object.freeze({
  jobid: integerCodec,
  schedule: textCodec,
  command: textCodec,
  nodename: textCodec,
  nodeport: int4Codec,
  database: textCodec,
  username: textCodec,
  active: booleanCodec,
  jobname: nullableCodec(textCodec),
});
/** Every run detail except runid is nullable in the captured native table. */
export const cronRunDetailFields = Object.freeze({
  jobid: nullableCodec(integerCodec),
  runid: integerCodec,
  job_pid: nullableCodec(int4Codec),
  database: nullableCodec(textCodec),
  username: nullableCodec(textCodec),
  command: nullableCodec(textCodec),
  status: nullableCodec(textCodec),
  return_message: nullableCodec(textCodec),
  start_time: nullableCodec(timestamptzCodec),
  end_time: nullableCodec(timestamptzCodec),
});
export const cronJobCodec = compositeCodec("cron.job:pg_cron:1.6", cronJobFields);
export const cronRunDetailCodec = compositeCodec("cron.job_run_details:pg_cron:1.6", cronRunDetailFields);
export const cronJobArrayCodec = arrayCodec(cronJobCodec);
export const cronRunDetailArrayCodec = arrayCodec(cronRunDetailCodec);
export type CronJob = CompositeOutput<typeof cronJobFields>;
export type CronRunDetail = CompositeOutput<typeof cronRunDetailFields>;
