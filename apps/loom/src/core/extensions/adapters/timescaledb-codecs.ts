import * as v from "valibot";
import {
  arrayCodec,
  booleanCodec,
  compositeCodec,
  createExtensionCodec,
  floatCodec,
  integerCodec,
  nullableCodec,
  textCodec,
  withCodecSqlType,
  type CompositeOutput,
  type ExtensionCodec,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { jsonbCodec } from "../native-json-codecs";
import { timestampCodec, timestamptzCodec } from "../native-timestamp-codecs";
import { int2Codec } from "../primitive-number-codecs";

// Text forms are PostgreSQL 18 output under Neon's captured defaults (DateStyle ISO, IntervalStyle postgres).
// Other session styles fail closed; PostgreSQL alone parses, buckets and computes every value.
const date = v.pipe(v.string(), v.regex(/^(?:-?infinity|\d{4,7}-\d{2}-\d{2}(?: BC)?)$/));
/** ISO DateStyle date text, including BC and infinities; PostgreSQL validates the calendar. */
export const timescaledbDateCodec = createExtensionCodec({
  id: "pg:date:iso:1",
  sqlType: { schema: "pg_catalog", name: "date" },
  input: date,
  output: date,
  transport: "text",
  encode: (value) => value,
  decode: (value) => value,
});
const interval = v.pipe(
  v.string(),
  v.regex(
    /^(?:-?infinity|(?=[+\-\d])(?:[+-]?\d+ years?(?: |$))?(?:[+-]?\d+ mons?(?: |$))?(?:[+-]?\d+ days?(?: |$))?(?:[+-]?\d+:\d{2}:\d{2}(?:\.\d{1,6})?)?)$/,
  ),
  v.check((value) => !value.endsWith(" "), "Invalid PostgreSQL interval text"),
);
/** IntervalStyle postgres text; months, days and microseconds stay separate PostgreSQL fields. */
export const timescaledbIntervalCodec = createExtensionCodec({
  id: "pg:interval:postgres:1",
  sqlType: { schema: "pg_catalog", name: "interval" },
  input: interval,
  output: interval,
  transport: "text",
  encode: (value) => value,
  decode: (value) => value,
});
const intervalCodec = timescaledbIntervalCodec;
// Object-identifier aliases are PostgreSQL's own search_path-aware output text; they are never re-resolved in JS.
const nameCodec = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "name" });
const nameArrayCodec = arrayCodec(nameCodec);
const regclassTextCodec = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "regclass" });
const regtypeCodec = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "regtype" });
const regroleCodec = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "regrole" });
const regprocCodec = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "regproc" });
export { timescaledbDateCodec as dateCodec, nameCodec, regclassTextCodec, regprocCodec };

/** Captured timescaledb_experimental.policies columns; every view column is nullable. */
export const timescaledbPoliciesFields = Object.freeze({
  relation_name: nullableCodec(nameCodec),
  relation_schema: nullableCodec(nameCodec),
  schedule_interval: nullableCodec(intervalCodec),
  proc_schema: nullableCodec(nameCodec),
  proc_name: nullableCodec(nameCodec),
  config: nullableCodec(jsonbCodec),
  hypertable_schema: nullableCodec(nameCodec),
  hypertable_name: nullableCodec(nameCodec),
});
/** Captured timescaledb_information.chunk_columnstore_settings columns; every view column is nullable. */
export const timescaledbChunkColumnstoreSettingsFields = Object.freeze({
  hypertable: nullableCodec(regclassTextCodec),
  chunk: nullableCodec(regclassTextCodec),
  segmentby: nullableCodec(textCodec),
  orderby: nullableCodec(textCodec),
  index: nullableCodec(jsonbCodec),
});
/** Captured timescaledb_information.chunk_compression_settings columns; every view column is nullable. */
export const timescaledbChunkCompressionSettingsFields = Object.freeze({
  hypertable: nullableCodec(regclassTextCodec),
  chunk: nullableCodec(regclassTextCodec),
  segmentby: nullableCodec(textCodec),
  orderby: nullableCodec(textCodec),
  index: nullableCodec(jsonbCodec),
});
/** Captured timescaledb_information.chunks columns; every view column is nullable. */
export const timescaledbChunksFields = Object.freeze({
  hypertable_schema: nullableCodec(nameCodec),
  hypertable_name: nullableCodec(nameCodec),
  chunk_schema: nullableCodec(nameCodec),
  chunk_name: nullableCodec(nameCodec),
  primary_dimension: nullableCodec(nameCodec),
  primary_dimension_type: nullableCodec(regtypeCodec),
  range_start: nullableCodec(timestamptzCodec),
  range_end: nullableCodec(timestamptzCodec),
  range_start_integer: nullableCodec(integerCodec),
  range_end_integer: nullableCodec(integerCodec),
  is_compressed: nullableCodec(booleanCodec),
  chunk_tablespace: nullableCodec(nameCodec),
  chunk_creation_time: nullableCodec(timestamptzCodec),
});
/** Captured timescaledb_information.compression_settings columns; every view column is nullable. */
export const timescaledbCompressionSettingsFields = Object.freeze({
  hypertable_schema: nullableCodec(nameCodec),
  hypertable_name: nullableCodec(nameCodec),
  attname: nullableCodec(nameCodec),
  segmentby_column_index: nullableCodec(int2Codec),
  orderby_column_index: nullableCodec(int2Codec),
  orderby_asc: nullableCodec(booleanCodec),
  orderby_nullsfirst: nullableCodec(booleanCodec),
});
/** Captured timescaledb_information.continuous_aggregates columns; every view column is nullable. */
export const timescaledbContinuousAggregatesFields = Object.freeze({
  hypertable_schema: nullableCodec(nameCodec),
  hypertable_name: nullableCodec(nameCodec),
  view_schema: nullableCodec(nameCodec),
  view_name: nullableCodec(nameCodec),
  view_owner: nullableCodec(nameCodec),
  materialized_only: nullableCodec(booleanCodec),
  compression_enabled: nullableCodec(booleanCodec),
  materialization_hypertable_schema: nullableCodec(nameCodec),
  materialization_hypertable_name: nullableCodec(nameCodec),
  view_definition: nullableCodec(textCodec),
  finalized: nullableCodec(booleanCodec),
});
/** Captured timescaledb_information.dimensions columns; every view column is nullable. */
export const timescaledbDimensionsFields = Object.freeze({
  hypertable_schema: nullableCodec(nameCodec),
  hypertable_name: nullableCodec(nameCodec),
  dimension_number: nullableCodec(integerCodec),
  column_name: nullableCodec(nameCodec),
  column_type: nullableCodec(regtypeCodec),
  dimension_type: nullableCodec(textCodec),
  time_interval: nullableCodec(intervalCodec),
  integer_interval: nullableCodec(integerCodec),
  integer_now_func: nullableCodec(nameCodec),
  num_partitions: nullableCodec(int2Codec),
});
/** Captured timescaledb_information.hypertable_columnstore_settings columns; every view column is nullable. */
export const timescaledbHypertableColumnstoreSettingsFields = Object.freeze({
  hypertable: nullableCodec(regclassTextCodec),
  segmentby: nullableCodec(textCodec),
  orderby: nullableCodec(textCodec),
  compress_interval_length: nullableCodec(textCodec),
  index: nullableCodec(jsonbCodec),
});
/** Captured timescaledb_information.hypertable_compression_settings columns; every view column is nullable. */
export const timescaledbHypertableCompressionSettingsFields = Object.freeze({
  hypertable: nullableCodec(regclassTextCodec),
  segmentby: nullableCodec(textCodec),
  orderby: nullableCodec(textCodec),
  compress_interval_length: nullableCodec(textCodec),
  index: nullableCodec(jsonbCodec),
});
/** Captured timescaledb_information.hypertables columns; every view column is nullable. */
export const timescaledbHypertablesFields = Object.freeze({
  hypertable_schema: nullableCodec(nameCodec),
  hypertable_name: nullableCodec(nameCodec),
  owner: nullableCodec(nameCodec),
  num_dimensions: nullableCodec(int2Codec),
  num_chunks: nullableCodec(integerCodec),
  compression_enabled: nullableCodec(booleanCodec),
  tablespaces: nullableCodec(nameArrayCodec),
  primary_dimension: nullableCodec(nameCodec),
  primary_dimension_type: nullableCodec(regtypeCodec),
});
/** Captured timescaledb_information.job_errors columns; every view column is nullable. */
export const timescaledbJobErrorsFields = Object.freeze({
  job_id: nullableCodec(int4Codec),
  proc_schema: nullableCodec(textCodec),
  proc_name: nullableCodec(textCodec),
  pid: nullableCodec(int4Codec),
  start_time: nullableCodec(timestamptzCodec),
  finish_time: nullableCodec(timestamptzCodec),
  sqlerrcode: nullableCodec(textCodec),
  err_message: nullableCodec(textCodec),
});
/** Captured timescaledb_information.job_history columns; every view column is nullable. */
export const timescaledbJobHistoryFields = Object.freeze({
  id: nullableCodec(integerCodec),
  job_id: nullableCodec(int4Codec),
  succeeded: nullableCodec(booleanCodec),
  proc_schema: nullableCodec(textCodec),
  proc_name: nullableCodec(textCodec),
  pid: nullableCodec(int4Codec),
  start_time: nullableCodec(timestamptzCodec),
  finish_time: nullableCodec(timestamptzCodec),
  config: nullableCodec(jsonbCodec),
  sqlerrcode: nullableCodec(textCodec),
  err_message: nullableCodec(textCodec),
});
/** Captured timescaledb_information.job_stats columns; every view column is nullable. */
export const timescaledbJobStatsFields = Object.freeze({
  hypertable_schema: nullableCodec(nameCodec),
  hypertable_name: nullableCodec(nameCodec),
  job_id: nullableCodec(int4Codec),
  last_run_started_at: nullableCodec(timestamptzCodec),
  last_successful_finish: nullableCodec(timestamptzCodec),
  last_run_status: nullableCodec(textCodec),
  job_status: nullableCodec(textCodec),
  last_run_duration: nullableCodec(intervalCodec),
  next_start: nullableCodec(timestamptzCodec),
  total_runs: nullableCodec(integerCodec),
  total_successes: nullableCodec(integerCodec),
  total_failures: nullableCodec(integerCodec),
});
/** Captured timescaledb_information.jobs columns; every view column is nullable. */
export const timescaledbJobsFields = Object.freeze({
  job_id: nullableCodec(int4Codec),
  application_name: nullableCodec(nameCodec),
  schedule_interval: nullableCodec(intervalCodec),
  max_runtime: nullableCodec(intervalCodec),
  max_retries: nullableCodec(int4Codec),
  retry_period: nullableCodec(intervalCodec),
  proc_schema: nullableCodec(nameCodec),
  proc_name: nullableCodec(nameCodec),
  owner: nullableCodec(regroleCodec),
  scheduled: nullableCodec(booleanCodec),
  fixed_schedule: nullableCodec(booleanCodec),
  config: nullableCodec(jsonbCodec),
  next_start: nullableCodec(timestamptzCodec),
  initial_start: nullableCodec(timestamptzCodec),
  hypertable_schema: nullableCodec(nameCodec),
  hypertable_name: nullableCodec(nameCodec),
  check_schema: nullableCodec(nameCodec),
  check_name: nullableCodec(nameCodec),
});
/** routine:$extension:timescaledb.add_dimension(pg_catalog.regclass,_timescaledb_internal.dimension_info,pg_catalog.bool) OUT columns. */
export const timescaledbAddDimensionInfoFields = Object.freeze({
  dimension_id: nullableCodec(int4Codec),
  created: nullableCodec(booleanCodec),
});
/** routine:$extension:timescaledb.add_dimension(pg_catalog.regclass,pg_catalog.name,pg_catalog.int4,pg_catalog.anyelement,pg_catalog.regproc,pg_catalog.bool) OUT columns. */
export const timescaledbAddDimensionFields = Object.freeze({
  dimension_id: nullableCodec(int4Codec),
  schema_name: nullableCodec(nameCodec),
  table_name: nullableCodec(nameCodec),
  column_name: nullableCodec(nameCodec),
  created: nullableCodec(booleanCodec),
});
/** routine:$extension:timescaledb.chunk_columnstore_stats(pg_catalog.regclass) OUT columns. */
export const timescaledbChunkColumnstoreStatsFields = Object.freeze({
  chunk_schema: nullableCodec(nameCodec),
  chunk_name: nullableCodec(nameCodec),
  compression_status: nullableCodec(textCodec),
  before_compression_table_bytes: nullableCodec(integerCodec),
  before_compression_index_bytes: nullableCodec(integerCodec),
  before_compression_toast_bytes: nullableCodec(integerCodec),
  before_compression_total_bytes: nullableCodec(integerCodec),
  after_compression_table_bytes: nullableCodec(integerCodec),
  after_compression_index_bytes: nullableCodec(integerCodec),
  after_compression_toast_bytes: nullableCodec(integerCodec),
  after_compression_total_bytes: nullableCodec(integerCodec),
  node_name: nullableCodec(nameCodec),
});
/** routine:$extension:timescaledb.chunk_compression_stats(pg_catalog.regclass) OUT columns. */
export const timescaledbChunkCompressionStatsFields = Object.freeze({
  chunk_schema: nullableCodec(nameCodec),
  chunk_name: nullableCodec(nameCodec),
  compression_status: nullableCodec(textCodec),
  before_compression_table_bytes: nullableCodec(integerCodec),
  before_compression_index_bytes: nullableCodec(integerCodec),
  before_compression_toast_bytes: nullableCodec(integerCodec),
  before_compression_total_bytes: nullableCodec(integerCodec),
  after_compression_table_bytes: nullableCodec(integerCodec),
  after_compression_index_bytes: nullableCodec(integerCodec),
  after_compression_toast_bytes: nullableCodec(integerCodec),
  after_compression_total_bytes: nullableCodec(integerCodec),
  node_name: nullableCodec(nameCodec),
});
/** routine:$extension:timescaledb.chunks_detailed_size(pg_catalog.regclass) OUT columns. */
export const timescaledbChunksDetailedSizeFields = Object.freeze({
  chunk_schema: nullableCodec(nameCodec),
  chunk_name: nullableCodec(nameCodec),
  table_bytes: nullableCodec(integerCodec),
  index_bytes: nullableCodec(integerCodec),
  toast_bytes: nullableCodec(integerCodec),
  total_bytes: nullableCodec(integerCodec),
  node_name: nullableCodec(nameCodec),
});
/** routine:$extension:timescaledb.create_hypertable(pg_catalog.regclass,_timescaledb_internal.dimension_info,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool) OUT columns. */
export const timescaledbCreateHypertableInfoFields = Object.freeze({
  hypertable_id: nullableCodec(int4Codec),
  created: nullableCodec(booleanCodec),
});
/** routine:$extension:timescaledb.create_hypertable(pg_catalog.regclass,pg_catalog.name,pg_catalog.name,pg_catalog.int4,pg_catalog.name,pg_catalog.name,pg_catalog.anyelement,pg_catalog.bool,pg_catalog.bool,pg_catalog.regproc,pg_catalog.bool,pg_catalog.text,pg_catalog.regproc,pg_catalog.regproc) OUT columns. */
export const timescaledbCreateHypertableFields = Object.freeze({
  hypertable_id: nullableCodec(int4Codec),
  schema_name: nullableCodec(nameCodec),
  table_name: nullableCodec(nameCodec),
  created: nullableCodec(booleanCodec),
});
/** routine:$extension:timescaledb.disable_chunk_skipping(pg_catalog.regclass,pg_catalog.name,pg_catalog.bool) OUT columns. */
export const timescaledbDisableChunkSkippingFields = Object.freeze({
  hypertable_id: nullableCodec(int4Codec),
  column_name: nullableCodec(nameCodec),
  disabled: nullableCodec(booleanCodec),
});
/** routine:$extension:timescaledb.enable_chunk_skipping(pg_catalog.regclass,pg_catalog.name,pg_catalog.bool) OUT columns. */
export const timescaledbEnableChunkSkippingFields = Object.freeze({
  column_stats_id: nullableCodec(int4Codec),
  enabled: nullableCodec(booleanCodec),
});
/** routine:$extension:timescaledb.hypertable_approximate_detailed_size(pg_catalog.regclass) OUT columns. */
export const timescaledbHypertableApproximateDetailedSizeFields = Object.freeze({
  table_bytes: nullableCodec(integerCodec),
  index_bytes: nullableCodec(integerCodec),
  toast_bytes: nullableCodec(integerCodec),
  total_bytes: nullableCodec(integerCodec),
});
/** routine:$extension:timescaledb.hypertable_columnstore_stats(pg_catalog.regclass) OUT columns. */
export const timescaledbHypertableColumnstoreStatsFields = Object.freeze({
  total_chunks: nullableCodec(integerCodec),
  number_compressed_chunks: nullableCodec(integerCodec),
  before_compression_table_bytes: nullableCodec(integerCodec),
  before_compression_index_bytes: nullableCodec(integerCodec),
  before_compression_toast_bytes: nullableCodec(integerCodec),
  before_compression_total_bytes: nullableCodec(integerCodec),
  after_compression_table_bytes: nullableCodec(integerCodec),
  after_compression_index_bytes: nullableCodec(integerCodec),
  after_compression_toast_bytes: nullableCodec(integerCodec),
  after_compression_total_bytes: nullableCodec(integerCodec),
  node_name: nullableCodec(nameCodec),
});
/** routine:$extension:timescaledb.hypertable_compression_stats(pg_catalog.regclass) OUT columns. */
export const timescaledbHypertableCompressionStatsFields = Object.freeze({
  total_chunks: nullableCodec(integerCodec),
  number_compressed_chunks: nullableCodec(integerCodec),
  before_compression_table_bytes: nullableCodec(integerCodec),
  before_compression_index_bytes: nullableCodec(integerCodec),
  before_compression_toast_bytes: nullableCodec(integerCodec),
  before_compression_total_bytes: nullableCodec(integerCodec),
  after_compression_table_bytes: nullableCodec(integerCodec),
  after_compression_index_bytes: nullableCodec(integerCodec),
  after_compression_toast_bytes: nullableCodec(integerCodec),
  after_compression_total_bytes: nullableCodec(integerCodec),
  node_name: nullableCodec(nameCodec),
});
/** routine:$extension:timescaledb.hypertable_detailed_size(pg_catalog.regclass) OUT columns. */
export const timescaledbHypertableDetailedSizeFields = Object.freeze({
  table_bytes: nullableCodec(integerCodec),
  index_bytes: nullableCodec(integerCodec),
  toast_bytes: nullableCodec(integerCodec),
  total_bytes: nullableCodec(integerCodec),
  node_name: nullableCodec(nameCodec),
});
/** routine:$extension:timescaledb.set_adaptive_chunking(...) OUT columns (chunk_sizing_func is INOUT). */
export const timescaledbSetAdaptiveChunkingFields = Object.freeze({
  chunk_sizing_func: nullableCodec(regprocCodec),
  chunk_target_size: nullableCodec(integerCodec),
});

type Fields = Readonly<Record<string, ExtensionCodec<never, unknown>>>;
const record = <const RowFields extends Fields>(name: string, fields: RowFields) =>
  compositeCodec(`timescaledb:2.24.0:${name}`, fields);
export const timescaledbHypertableDetailedSizeCodec = record(
  "hypertable_detailed_size",
  timescaledbHypertableDetailedSizeFields,
);
export const timescaledbHypertableApproximateDetailedSizeCodec = record(
  "hypertable_approximate_detailed_size",
  timescaledbHypertableApproximateDetailedSizeFields,
);
export const timescaledbCreateHypertableInfoCodec = record("create_hypertable", timescaledbCreateHypertableInfoFields);
export const timescaledbCreateHypertableCodec = record("create_hypertable_legacy", timescaledbCreateHypertableFields);
export const timescaledbAddDimensionInfoCodec = record("add_dimension", timescaledbAddDimensionInfoFields);
export const timescaledbAddDimensionCodec = record("add_dimension_legacy", timescaledbAddDimensionFields);
export const timescaledbEnableChunkSkippingCodec = record(
  "enable_chunk_skipping",
  timescaledbEnableChunkSkippingFields,
);
export const timescaledbDisableChunkSkippingCodec = record(
  "disable_chunk_skipping",
  timescaledbDisableChunkSkippingFields,
);
export const timescaledbSetAdaptiveChunkingCodec = record(
  "set_adaptive_chunking",
  timescaledbSetAdaptiveChunkingFields,
);
export type TimescaledbHypertable = CompositeOutput<typeof timescaledbHypertablesFields>;
export type TimescaledbDimension = CompositeOutput<typeof timescaledbDimensionsFields>;
export type TimescaledbChunk = CompositeOutput<typeof timescaledbChunksFields>;
export type TimescaledbJob = CompositeOutput<typeof timescaledbJobsFields>;
export type TimescaledbDetailedSize = CompositeOutput<typeof timescaledbHypertableDetailedSizeFields>;
export type TimescaledbChunkDetailedSize = CompositeOutput<typeof timescaledbChunksDetailedSizeFields>;
export type TimescaledbCreatedHypertable = CompositeOutput<typeof timescaledbCreateHypertableInfoFields>;
export type TimescaledbLegacyCreatedHypertable = CompositeOutput<typeof timescaledbCreateHypertableFields>;
export type TimescaledbAddedDimension = CompositeOutput<typeof timescaledbAddDimensionInfoFields>;
export type TimescaledbLegacyAddedDimension = CompositeOutput<typeof timescaledbAddDimensionFields>;
export type TimescaledbChunkSkippingEnabled = CompositeOutput<typeof timescaledbEnableChunkSkippingFields>;
export type TimescaledbChunkSkippingDisabled = CompositeOutput<typeof timescaledbDisableChunkSkippingFields>;
export type TimescaledbAdaptiveChunking = CompositeOutput<typeof timescaledbSetAdaptiveChunkingFields>;
export { floatCodec, int2Codec, int4Codec, integerCodec, timestampCodec, timestamptzCodec };
