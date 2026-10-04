import {
  arrayCodec,
  booleanCodec,
  compositeCodec,
  floatCodec,
  integerCodec,
  nullableCodec,
  numericCodec,
  textCodec,
  type CompositeOutput,
} from "../codecs";
import { timestamptzCodec } from "../native-timestamp-codecs";
import { loOidCodec } from "./lo-codecs";

/** Exact PostgreSQL 18 / pg_stat_statements 1.12 OUT order. Query text and IDs can be hidden by role. */
export const statementFields = Object.freeze({
  userid: loOidCodec,
  dbid: loOidCodec,
  toplevel: booleanCodec,
  queryid: nullableCodec(integerCodec),
  query: nullableCodec(textCodec),
  plans: integerCodec,
  total_plan_time: floatCodec,
  min_plan_time: floatCodec,
  max_plan_time: floatCodec,
  mean_plan_time: floatCodec,
  stddev_plan_time: floatCodec,
  calls: integerCodec,
  total_exec_time: floatCodec,
  min_exec_time: floatCodec,
  max_exec_time: floatCodec,
  mean_exec_time: floatCodec,
  stddev_exec_time: floatCodec,
  rows: integerCodec,
  shared_blks_hit: integerCodec,
  shared_blks_read: integerCodec,
  shared_blks_dirtied: integerCodec,
  shared_blks_written: integerCodec,
  local_blks_hit: integerCodec,
  local_blks_read: integerCodec,
  local_blks_dirtied: integerCodec,
  local_blks_written: integerCodec,
  temp_blks_read: integerCodec,
  temp_blks_written: integerCodec,
  shared_blk_read_time: floatCodec,
  shared_blk_write_time: floatCodec,
  local_blk_read_time: floatCodec,
  local_blk_write_time: floatCodec,
  temp_blk_read_time: floatCodec,
  temp_blk_write_time: floatCodec,
  wal_records: integerCodec,
  wal_fpi: integerCodec,
  wal_bytes: numericCodec,
  wal_buffers_full: integerCodec,
  jit_functions: integerCodec,
  jit_generation_time: floatCodec,
  jit_inlining_count: integerCodec,
  jit_inlining_time: floatCodec,
  jit_optimization_count: integerCodec,
  jit_optimization_time: floatCodec,
  jit_emission_count: integerCodec,
  jit_emission_time: floatCodec,
  jit_deform_count: integerCodec,
  jit_deform_time: floatCodec,
  parallel_workers_to_launch: integerCodec,
  parallel_workers_launched: integerCodec,
  stats_since: timestamptzCodec,
  minmax_stats_since: timestamptzCodec,
} as const);
export const statementInfoFields = Object.freeze({ dealloc: integerCodec, stats_reset: timestamptzCodec });
export const statementCodec = compositeCodec("pg_stat_statements:1.12", statementFields);
export const statementInfoCodec = compositeCodec("pg_stat_statements_info:1.12", statementInfoFields);
export const statementArrayCodec = arrayCodec(statementCodec);
export const statementInfoArrayCodec = arrayCodec(statementInfoCodec);
export type StatementStatistics = CompositeOutput<typeof statementFields>;
export type StatementStatisticsInfo = CompositeOutput<typeof statementInfoFields>;
