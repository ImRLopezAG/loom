import * as v from "valibot";
import {
  arrayCodec,
  booleanCodec,
  compositeCodec,
  createExtensionCodec,
  integerCodec,
  nullableCodec,
  textCodec,
  withCodecSqlType,
  type CompositeOutput,
} from "../codecs";
import { timestamptzCodec } from "../native-timestamp-codecs";
const int4 = v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647));
export const partmanInt4Codec = createExtensionCodec({
  id: "pg:int4:1",
  sqlType: { schema: "pg_catalog", name: "int4" },
  input: int4,
  output: int4,
  transport: "text",
  encode: String,
  decode: (value) => (v.is(v.string(), value) ? Number(v.parse(v.pipe(v.string(), v.regex(/^-?\d+$/)), value)) : value),
});
// Interval text is parsed and evaluated by PostgreSQL, including month/day distinctions.
export const partmanIntervalCodec = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "interval" });
const nameCodec = withCodecSqlType(textCodec, { schema: "pg_catalog", name: "name" });
export const partmanTextArrayCodec = arrayCodec(textCodec);
export const partmanInt8ArrayCodec = arrayCodec(integerCodec);
export const partmanTimeArrayCodec = arrayCodec(timestamptzCodec);
export const partmanVoidCodec = createExtensionCodec({
  id: "pg:void:1",
  sqlType: { schema: "pg_catalog", name: "void" },
  input: v.null(),
  output: v.null(),
  transport: "text",
  encode: () => null,
  decode: (value) => (value === "" ? null : value),
});
export const check_default_tableFields = Object.freeze({
  default_table: nullableCodec(textCodec),
  count: nullableCodec(integerCodec),
} as const);
export const check_default_tableCodec = compositeCodec(
  "pg_partman:5.1.0:check_default_table",
  check_default_tableFields,
);
export type CheckDefaultTable = CompositeOutput<typeof check_default_tableFields>;
export const part_configFields = Object.freeze({
  parent_table: nullableCodec(textCodec),
  control: nullableCodec(textCodec),
  partition_interval: nullableCodec(textCodec),
  partition_type: nullableCodec(textCodec),
  premake: nullableCodec(partmanInt4Codec),
  automatic_maintenance: nullableCodec(textCodec),
  template_table: nullableCodec(textCodec),
  retention: nullableCodec(textCodec),
  retention_schema: nullableCodec(textCodec),
  retention_keep_index: nullableCodec(booleanCodec),
  retention_keep_table: nullableCodec(booleanCodec),
  epoch: nullableCodec(textCodec),
  constraint_cols: nullableCodec(partmanTextArrayCodec),
  optimize_constraint: nullableCodec(partmanInt4Codec),
  infinite_time_partitions: nullableCodec(booleanCodec),
  datetime_string: nullableCodec(textCodec),
  jobmon: nullableCodec(booleanCodec),
  sub_partition_set_full: nullableCodec(booleanCodec),
  undo_in_progress: nullableCodec(booleanCodec),
  inherit_privileges: nullableCodec(booleanCodec),
  constraint_valid: nullableCodec(booleanCodec),
  ignore_default_data: nullableCodec(booleanCodec),
  default_table: nullableCodec(booleanCodec),
  date_trunc_interval: nullableCodec(textCodec),
  maintenance_order: nullableCodec(partmanInt4Codec),
  retention_keep_publication: nullableCodec(booleanCodec),
  maintenance_last_run: nullableCodec(timestamptzCodec),
} as const);
export const part_configCodec = compositeCodec("pg_partman:5.1.0:part_config", part_configFields);
export type PartConfig = CompositeOutput<typeof part_configFields>;
export const part_config_subFields = Object.freeze({
  sub_parent: nullableCodec(textCodec),
  sub_control: nullableCodec(textCodec),
  sub_partition_interval: nullableCodec(textCodec),
  sub_partition_type: nullableCodec(textCodec),
  sub_premake: nullableCodec(partmanInt4Codec),
  sub_automatic_maintenance: nullableCodec(textCodec),
  sub_template_table: nullableCodec(textCodec),
  sub_retention: nullableCodec(textCodec),
  sub_retention_schema: nullableCodec(textCodec),
  sub_retention_keep_index: nullableCodec(booleanCodec),
  sub_retention_keep_table: nullableCodec(booleanCodec),
  sub_epoch: nullableCodec(textCodec),
  sub_constraint_cols: nullableCodec(partmanTextArrayCodec),
  sub_optimize_constraint: nullableCodec(partmanInt4Codec),
  sub_infinite_time_partitions: nullableCodec(booleanCodec),
  sub_jobmon: nullableCodec(booleanCodec),
  sub_inherit_privileges: nullableCodec(booleanCodec),
  sub_constraint_valid: nullableCodec(booleanCodec),
  sub_ignore_default_data: nullableCodec(booleanCodec),
  sub_default_table: nullableCodec(booleanCodec),
  sub_date_trunc_interval: nullableCodec(textCodec),
  sub_maintenance_order: nullableCodec(partmanInt4Codec),
  sub_retention_keep_publication: nullableCodec(booleanCodec),
} as const);
export const part_config_subCodec = compositeCodec("pg_partman:5.1.0:part_config_sub", part_config_subFields);
export type PartConfigSub = CompositeOutput<typeof part_config_subFields>;
export const table_privsFields = Object.freeze({
  grantor: nullableCodec(nameCodec),
  grantee: nullableCodec(nameCodec),
  table_schema: nullableCodec(nameCodec),
  table_name: nullableCodec(nameCodec),
  privilege_type: nullableCodec(textCodec),
} as const);
export const table_privsCodec = compositeCodec("pg_partman:5.1.0:table_privs", table_privsFields);
export type TablePrivs = CompositeOutput<typeof table_privsFields>;
export const calculate_time_partition_infoFields = Object.freeze({
  base_timestamp: nullableCodec(timestamptzCodec),
  datetime_string: nullableCodec(textCodec),
} as const);
export const calculate_time_partition_infoCodec = compositeCodec(
  "pg_partman:5.1.0:calculate_time_partition_info",
  calculate_time_partition_infoFields,
);
export type CalculateTimePartitionInfo = CompositeOutput<typeof calculate_time_partition_infoFields>;
export const check_control_typeFields = Object.freeze({
  general_type: nullableCodec(textCodec),
  exact_type: nullableCodec(textCodec),
} as const);
export const check_control_typeCodec = compositeCodec("pg_partman:5.1.0:check_control_type", check_control_typeFields);
export type CheckControlType = CompositeOutput<typeof check_control_typeFields>;
export const check_subpart_sameconfigFields = Object.freeze({
  sub_control: nullableCodec(textCodec),
  sub_partition_interval: nullableCodec(textCodec),
  sub_partition_type: nullableCodec(textCodec),
  sub_premake: nullableCodec(partmanInt4Codec),
  sub_automatic_maintenance: nullableCodec(textCodec),
  sub_template_table: nullableCodec(textCodec),
  sub_retention: nullableCodec(textCodec),
  sub_retention_schema: nullableCodec(textCodec),
  sub_retention_keep_index: nullableCodec(booleanCodec),
  sub_retention_keep_table: nullableCodec(booleanCodec),
  sub_epoch: nullableCodec(textCodec),
  sub_constraint_cols: nullableCodec(partmanTextArrayCodec),
  sub_optimize_constraint: nullableCodec(partmanInt4Codec),
  sub_infinite_time_partitions: nullableCodec(booleanCodec),
  sub_jobmon: nullableCodec(booleanCodec),
  sub_inherit_privileges: nullableCodec(booleanCodec),
  sub_constraint_valid: nullableCodec(booleanCodec),
  sub_date_trunc_interval: nullableCodec(textCodec),
  sub_ignore_default_data: nullableCodec(booleanCodec),
  sub_default_table: nullableCodec(booleanCodec),
  sub_maintenance_order: nullableCodec(partmanInt4Codec),
  sub_retention_keep_publication: nullableCodec(booleanCodec),
} as const);
export const check_subpart_sameconfigCodec = compositeCodec(
  "pg_partman:5.1.0:check_subpart_sameconfig",
  check_subpart_sameconfigFields,
);
export type CheckSubpartSameconfig = CompositeOutput<typeof check_subpart_sameconfigFields>;
export const check_subpartition_limitsFields = Object.freeze({
  sub_min: nullableCodec(textCodec),
  sub_max: nullableCodec(textCodec),
} as const);
export const check_subpartition_limitsCodec = compositeCodec(
  "pg_partman:5.1.0:check_subpartition_limits",
  check_subpartition_limitsFields,
);
export type CheckSubpartitionLimits = CompositeOutput<typeof check_subpartition_limitsFields>;
export const show_partition_infoFields = Object.freeze({
  child_start_time: nullableCodec(timestamptzCodec),
  child_end_time: nullableCodec(timestamptzCodec),
  child_start_id: nullableCodec(integerCodec),
  child_end_id: nullableCodec(integerCodec),
  suffix: nullableCodec(textCodec),
} as const);
export const show_partition_infoCodec = compositeCodec(
  "pg_partman:5.1.0:show_partition_info",
  show_partition_infoFields,
);
export type ShowPartitionInfo = CompositeOutput<typeof show_partition_infoFields>;
export const show_partition_nameFields = Object.freeze({
  partition_schema: nullableCodec(textCodec),
  partition_table: nullableCodec(textCodec),
  suffix_timestamp: nullableCodec(timestamptzCodec),
  suffix_id: nullableCodec(integerCodec),
  table_exists: nullableCodec(booleanCodec),
} as const);
export const show_partition_nameCodec = compositeCodec(
  "pg_partman:5.1.0:show_partition_name",
  show_partition_nameFields,
);
export type ShowPartitionName = CompositeOutput<typeof show_partition_nameFields>;
export const show_partitionsFields = Object.freeze({
  partition_schemaname: nullableCodec(textCodec),
  partition_tablename: nullableCodec(textCodec),
} as const);
export const show_partitionsCodec = compositeCodec("pg_partman:5.1.0:show_partitions", show_partitionsFields);
export type ShowPartitions = CompositeOutput<typeof show_partitionsFields>;
export const undo_partitionFields = Object.freeze({
  partitions_undone: nullableCodec(partmanInt4Codec),
  rows_undone: nullableCodec(integerCodec),
} as const);
export const undo_partitionCodec = compositeCodec("pg_partman:5.1.0:undo_partition", undo_partitionFields);
export type UndoPartition = CompositeOutput<typeof undo_partitionFields>;
export const check_default_tableArrayCodec = arrayCodec(check_default_tableCodec);
export const part_configArrayCodec = arrayCodec(part_configCodec);
export const part_config_subArrayCodec = arrayCodec(part_config_subCodec);
export const table_privsArrayCodec = arrayCodec(table_privsCodec);
