import * as v from "valibot";
import { createPgPartman_5_1_0, pgPartmanDigest } from "../../../core/extensions/adapters/pg_partman";
import {
  booleanCodec,
  integerCodec,
  nullableCodec,
  numericCodec,
  textCodec,
  type CodecInput,
  type ExtensionCodec,
} from "../../../core/extensions/codecs";
import { timestamptzCodec } from "../../../core/extensions/native-timestamp-codecs";
import {
  partmanInt4Codec,
  partmanIntervalCodec,
  partmanTextArrayCodec,
  partmanInt8ArrayCodec,
  partmanTimeArrayCodec,
  partmanVoidCodec,
  check_default_tableCodec,
  part_configCodec,
  part_config_subCodec,
  calculate_time_partition_infoCodec,
  check_control_typeCodec,
  check_subpart_sameconfigCodec,
  check_subpartition_limitsCodec,
  show_partition_infoCodec,
  show_partition_nameCodec,
  show_partitionsCodec,
  undo_partitionCodec,
} from "../../../core/extensions/adapters/pg_partman-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { acquireExtensionLock, withMigrationConnection } from "../../migrations/connection";
import { withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/pg_partman.json";
export type PgPartmanDescriptor = ExtensionDescriptor<"pg_partman", { version: "5.1.0"; schema: string }>;
const quote = (name: string) => {
  if (!name || name.includes("\0")) throw new Error("Invalid PostgreSQL identifier");
  return '"' + name.replaceAll('"', '""') + '"';
};
function requirement(descriptor: PgPartmanDescriptor) {
  createPgPartman_5_1_0(descriptor);
  return validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
}
function directUrl(value: string) {
  const url = new URL(value);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("Expected a PostgreSQL operator URL");
  if (url.hostname.endsWith(".neon.tech") && url.hostname.split(".")[0]?.endsWith("-pooler"))
    throw new Error("pg_partman operator operations require a direct connection");
  return value;
}
export interface ApplyClusterRequest {
  readonly p_parent_schema: string | null;
  readonly p_parent_tablename: string | null;
  readonly p_child_schema: string | null;
  readonly p_child_tablename: string | null;
}
export interface ApplyConstraintsRequest {
  readonly p_parent_table: string | null;
  readonly p_child_table?: string | null | undefined;
  readonly p_analyze?: boolean | null | undefined;
  readonly p_job_id?: bigint | null | undefined;
}
export interface ApplyPrivilegesRequest {
  readonly p_parent_schema: string | null;
  readonly p_parent_tablename: string | null;
  readonly p_child_schema: string | null;
  readonly p_child_tablename: string | null;
  readonly p_job_id?: bigint | null | undefined;
}
export interface AutovacuumOffRequest {
  readonly p_parent_schema: string | null;
  readonly p_parent_tablename: string | null;
  readonly p_source_schema?: string | null | undefined;
  readonly p_source_tablename?: string | null | undefined;
}
export interface AutovacuumResetRequest {
  readonly p_parent_schema: string | null;
  readonly p_parent_tablename: string | null;
  readonly p_source_schema?: string | null | undefined;
  readonly p_source_tablename?: string | null | undefined;
}
export interface CalculateTimePartitionInfoRequest {
  readonly p_time_interval: string | null;
  readonly p_start_time: CodecInput<typeof timestamptzCodec> | null;
  readonly p_date_trunc_interval?: string | null | undefined;
}
export interface CheckAutomaticMaintenanceValueRequest {
  readonly p_automatic_maintenance: string | null;
}
export interface CheckControlTypeRequest {
  readonly p_parent_schema: string | null;
  readonly p_parent_tablename: string | null;
  readonly p_control: string | null;
}
export interface CheckDefaultRequest {
  readonly p_exact_count?: boolean | null | undefined;
}
export interface CheckEpochTypeRequest {
  readonly p_type: string | null;
}
export interface CheckNameLengthRequest {
  readonly p_object_name: string | null;
  readonly p_suffix?: string | null | undefined;
  readonly p_table_partition?: boolean | null | undefined;
}
export interface CheckPartitionTypeRequest {
  readonly p_type: string | null;
}
export interface CheckSubpartSameconfigRequest {
  readonly p_parent_table: string | null;
}
export interface CheckSubpartitionLimitsRequest {
  readonly p_parent_table: string | null;
  readonly p_type: string | null;
}
export interface CreateParentRequest {
  readonly p_parent_table: string | null;
  readonly p_control: string | null;
  readonly p_interval: string | null;
  readonly p_type?: string | null | undefined;
  readonly p_epoch?: string | null | undefined;
  readonly p_premake?: number | null | undefined;
  readonly p_start_partition?: string | null | undefined;
  readonly p_default_table?: boolean | null | undefined;
  readonly p_automatic_maintenance?: string | null | undefined;
  readonly p_constraint_cols?: CodecInput<typeof partmanTextArrayCodec> | null | undefined;
  readonly p_template_table?: string | null | undefined;
  readonly p_jobmon?: boolean | null | undefined;
  readonly p_date_trunc_interval?: string | null | undefined;
}
export interface CreatePartitionIdRequest {
  readonly p_parent_table: string | null;
  readonly p_partition_ids: CodecInput<typeof partmanInt8ArrayCodec> | null;
  readonly p_start_partition?: string | null | undefined;
}
export interface CreatePartitionTimeRequest {
  readonly p_parent_table: string | null;
  readonly p_partition_times: CodecInput<typeof partmanTimeArrayCodec> | null;
  readonly p_start_partition?: string | null | undefined;
}
export interface CreateSubParentRequest {
  readonly p_top_parent: string | null;
  readonly p_control: string | null;
  readonly p_interval: string | null;
  readonly p_type?: string | null | undefined;
  readonly p_default_table?: boolean | null | undefined;
  readonly p_declarative_check?: string | null | undefined;
  readonly p_constraint_cols?: CodecInput<typeof partmanTextArrayCodec> | null | undefined;
  readonly p_premake?: number | null | undefined;
  readonly p_start_partition?: string | null | undefined;
  readonly p_epoch?: string | null | undefined;
  readonly p_jobmon?: boolean | null | undefined;
  readonly p_date_trunc_interval?: string | null | undefined;
}
export interface DropConstraintsRequest {
  readonly p_parent_table: string | null;
  readonly p_child_table: string | null;
  readonly p_debug?: boolean | null | undefined;
}
export interface DropPartitionIdRequest {
  readonly p_parent_table: string | null;
  readonly p_retention?: bigint | null | undefined;
  readonly p_keep_table?: boolean | null | undefined;
  readonly p_keep_index?: boolean | null | undefined;
  readonly p_retention_schema?: string | null | undefined;
}
export interface DropPartitionTimeRequest {
  readonly p_parent_table: string | null;
  readonly p_retention?: string | null | undefined;
  readonly p_keep_table?: boolean | null | undefined;
  readonly p_keep_index?: boolean | null | undefined;
  readonly p_retention_schema?: string | null | undefined;
  readonly p_reference_timestamp?: CodecInput<typeof timestamptzCodec> | null | undefined;
}
export interface DumpPartitionedTableDefinitionRequest {
  readonly p_parent_table: string | null;
  readonly p_ignore_template_table?: boolean | null | undefined;
}
export interface InheritReplicaIdentityRequest {
  readonly p_parent_schemaname: string | null;
  readonly p_parent_tablename: string | null;
  readonly p_child_tablename: string | null;
}
export interface InheritTemplatePropertiesRequest {
  readonly p_parent_table: string | null;
  readonly p_child_schema: string | null;
  readonly p_child_tablename: string | null;
}
export interface PartitionDataIdRequest {
  readonly p_parent_table: string | null;
  readonly p_batch_count?: number | null | undefined;
  readonly p_batch_interval?: bigint | null | undefined;
  readonly p_lock_wait?: CodecInput<typeof numericCodec> | null | undefined;
  readonly p_order?: string | null | undefined;
  readonly p_analyze?: boolean | null | undefined;
  readonly p_source_table?: string | null | undefined;
  readonly p_ignored_columns?: CodecInput<typeof partmanTextArrayCodec> | null | undefined;
}
export interface PartitionDataTimeRequest {
  readonly p_parent_table: string | null;
  readonly p_batch_count?: number | null | undefined;
  readonly p_batch_interval?: string | null | undefined;
  readonly p_lock_wait?: CodecInput<typeof numericCodec> | null | undefined;
  readonly p_order?: string | null | undefined;
  readonly p_analyze?: boolean | null | undefined;
  readonly p_source_table?: string | null | undefined;
  readonly p_ignored_columns?: CodecInput<typeof partmanTextArrayCodec> | null | undefined;
}
export interface PartitionGapFillRequest {
  readonly p_parent_table: string | null;
}
export interface ReapplyPrivilegesRequest {
  readonly p_parent_table: string | null;
}
export interface RunMaintenanceRequest {
  readonly p_parent_table?: string | null | undefined;
  readonly p_analyze?: boolean | null | undefined;
  readonly p_jobmon?: boolean | null | undefined;
}
export interface ShowPartitionInfoRequest {
  readonly p_child_table: string | null;
  readonly p_partition_interval?: string | null | undefined;
  readonly p_parent_table?: string | null | undefined;
}
export interface ShowPartitionNameRequest {
  readonly p_parent_table: string | null;
  readonly p_value: string | null;
}
export interface ShowPartitionsRequest {
  readonly p_parent_table: string | null;
  readonly p_order?: string | null | undefined;
  readonly p_include_default?: boolean | null | undefined;
}
export interface StopSubPartitionRequest {
  readonly p_parent_table: string | null;
  readonly p_jobmon?: boolean | null | undefined;
}
export interface UndoPartitionRequest {
  readonly p_parent_table: string | null;
  readonly p_target_table: string | null;
  readonly p_loop_count?: number | null | undefined;
  readonly p_batch_interval?: string | null | undefined;
  readonly p_keep_table?: boolean | null | undefined;
  readonly p_lock_wait?: CodecInput<typeof numericCodec> | null | undefined;
  readonly p_ignored_columns?: CodecInput<typeof partmanTextArrayCodec> | null | undefined;
  readonly p_drop_cascade?: boolean | null | undefined;
}
export interface PartitionDataProcRequest {
  readonly p_parent_table: string | null;
  readonly p_loop_count?: number | null | undefined;
  readonly p_interval?: string | null | undefined;
  readonly p_lock_wait?: number | null | undefined;
  readonly p_lock_wait_tries?: number | null | undefined;
  readonly p_wait?: number | null | undefined;
  readonly p_order?: string | null | undefined;
  readonly p_source_table?: string | null | undefined;
  readonly p_ignored_columns?: CodecInput<typeof partmanTextArrayCodec> | null | undefined;
  readonly p_quiet?: boolean | null | undefined;
}
export interface ReapplyConstraintsProcRequest {
  readonly p_parent_table: string | null;
  readonly p_drop_constraints?: boolean | null | undefined;
  readonly p_apply_constraints?: boolean | null | undefined;
  readonly p_wait?: number | null | undefined;
  readonly p_dryrun?: boolean | null | undefined;
}
export interface RunAnalyzeRequest {
  readonly p_skip_locked?: boolean | null | undefined;
  readonly p_quiet?: boolean | null | undefined;
  readonly p_parent_table?: string | null | undefined;
}
export interface RunMaintenanceProcRequest {
  readonly p_wait?: number | null | undefined;
  readonly p_analyze?: boolean | null | undefined;
  readonly p_jobmon?: boolean | null | undefined;
}
export interface UndoPartitionProcRequest {
  readonly p_parent_table: string | null;
  readonly p_target_table?: string | null | undefined;
  readonly p_loop_count?: number | null | undefined;
  readonly p_interval?: string | null | undefined;
  readonly p_keep_table?: boolean | null | undefined;
  readonly p_lock_wait?: number | null | undefined;
  readonly p_lock_wait_tries?: number | null | undefined;
  readonly p_wait?: number | null | undefined;
  readonly p_ignored_columns?: CodecInput<typeof partmanTextArrayCodec> | null | undefined;
  readonly p_drop_cascade?: boolean | null | undefined;
  readonly p_quiet?: boolean | null | undefined;
}
export type PgPartmanProcedureRequest =
  | { readonly procedure: "partition_data_proc"; readonly arguments: PartitionDataProcRequest }
  | { readonly procedure: "reapply_constraints_proc"; readonly arguments: ReapplyConstraintsProcRequest }
  | { readonly procedure: "run_analyze"; readonly arguments: RunAnalyzeRequest }
  | { readonly procedure: "run_maintenance_proc"; readonly arguments: RunMaintenanceProcRequest }
  | { readonly procedure: "undo_partition_proc"; readonly arguments: UndoPartitionProcRequest };
export interface PartConfigPatch {
  readonly control?: string | undefined;
  readonly partition_interval?: string | undefined;
  readonly partition_type?: string | undefined;
  readonly premake?: number | undefined;
  readonly automatic_maintenance?: string | undefined;
  readonly template_table?: string | null | undefined;
  readonly retention?: string | null | undefined;
  readonly retention_schema?: string | null | undefined;
  readonly retention_keep_index?: boolean | undefined;
  readonly retention_keep_table?: boolean | undefined;
  readonly epoch?: string | undefined;
  readonly constraint_cols?: CodecInput<typeof partmanTextArrayCodec> | null | undefined;
  readonly optimize_constraint?: number | undefined;
  readonly infinite_time_partitions?: boolean | undefined;
  readonly datetime_string?: string | null | undefined;
  readonly jobmon?: boolean | undefined;
  readonly sub_partition_set_full?: boolean | undefined;
  readonly undo_in_progress?: boolean | undefined;
  readonly inherit_privileges?: boolean | null | undefined;
  readonly constraint_valid?: boolean | undefined;
  readonly ignore_default_data?: boolean | undefined;
  readonly default_table?: boolean | null | undefined;
  readonly date_trunc_interval?: string | null | undefined;
  readonly maintenance_order?: number | null | undefined;
  readonly retention_keep_publication?: boolean | undefined;
  readonly maintenance_last_run?: CodecInput<typeof timestamptzCodec> | null | undefined;
}
export interface PartConfigSubPatch {
  readonly sub_control?: string | undefined;
  readonly sub_partition_interval?: string | undefined;
  readonly sub_partition_type?: string | undefined;
  readonly sub_premake?: number | undefined;
  readonly sub_automatic_maintenance?: string | undefined;
  readonly sub_template_table?: string | null | undefined;
  readonly sub_retention?: string | null | undefined;
  readonly sub_retention_schema?: string | null | undefined;
  readonly sub_retention_keep_index?: boolean | undefined;
  readonly sub_retention_keep_table?: boolean | undefined;
  readonly sub_epoch?: string | undefined;
  readonly sub_constraint_cols?: CodecInput<typeof partmanTextArrayCodec> | null | undefined;
  readonly sub_optimize_constraint?: number | undefined;
  readonly sub_infinite_time_partitions?: boolean | undefined;
  readonly sub_jobmon?: boolean | undefined;
  readonly sub_inherit_privileges?: boolean | null | undefined;
  readonly sub_constraint_valid?: boolean | undefined;
  readonly sub_ignore_default_data?: boolean | undefined;
  readonly sub_default_table?: boolean | null | undefined;
  readonly sub_date_trunc_interval?: string | null | undefined;
  readonly sub_maintenance_order?: number | null | undefined;
  readonly sub_retention_keep_publication?: boolean | undefined;
}
/** Ordinary functions and configuration changes share an owned operator transaction. No client or SQL caller escapes. */
export async function withPgPartman<Result>(
  directOperatorUrl: string,
  descriptor: PgPartmanDescriptor,
  callback: (session: PgPartmanSession) => Promise<Result>,
  signal?: AbortSignal,
) {
  const required = requirement(descriptor);
  const schema = quote(descriptor.schema);
  return withExtensionOperation(
    directUrl(directOperatorUrl),
    async (context) => {
      await acquireExtensionLock(context.client, signal);
      await verifyExtensionApiContracts(context.client, [required]);
      await context.client.query("SET LOCAL DateStyle='ISO,YMD'; SET LOCAL IntervalStyle='postgres'");
      function invoke<Output>(
        name: string,
        parameters: readonly (readonly [string, string, unknown])[],
        codec: ExtensionCodec<never, Output>,
        set: true,
      ): Promise<readonly Output[]>;
      function invoke<Output>(
        name: string,
        parameters: readonly (readonly [string, string, unknown])[],
        codec: ExtensionCodec<never, Output>,
        set?: false,
      ): Promise<Output>;
      async function invoke<Output>(
        name: string,
        parameters: readonly (readonly [string, string, unknown])[],
        codec: ExtensionCodec<never, Output>,
        set = false,
      ) {
        const values: unknown[] = [];
        const args = parameters
          .filter(([, , value]) => value !== undefined)
          .map(([name, type, value]) => {
            values.push(value);
            return quote(name) + "=> $" + values.length + "::" + type;
          });
        const projection = codec.transport === "native" ? "r" : "r::pg_catalog.text";
        const rows = await context.client.query(
          `SELECT ${projection} AS value FROM ${schema}.${quote(name)}(${args.join(",")}) AS r`,
          values,
        );
        const checked = v
          .parse(v.array(v.strictObject({ value: v.unknown() })), rows.rows)
          .map((row) => codec.decode(row.value));
        if (set) return Object.freeze(checked);
        if (checked.length !== 1) throw new Error("pg_partman scalar returned a non-scalar result");
        return checked[0]!;
      }
      return Object.freeze({
        apply_cluster: (request: ApplyClusterRequest) =>
          context.run(() =>
            invoke(
              "apply_cluster",
              [
                [
                  "p_parent_schema",
                  "pg_catalog.text",
                  nullableCodec(textCodec).encode(request.p_parent_schema),
                ] as const,
                [
                  "p_parent_tablename",
                  "pg_catalog.text",
                  nullableCodec(textCodec).encode(request.p_parent_tablename),
                ] as const,
                ["p_child_schema", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_child_schema)] as const,
                [
                  "p_child_tablename",
                  "pg_catalog.text",
                  nullableCodec(textCodec).encode(request.p_child_tablename),
                ] as const,
              ],
              partmanVoidCodec,
            ),
          ),
        apply_constraints: (request: ApplyConstraintsRequest) =>
          context.run(() =>
            invoke(
              "apply_constraints",
              [
                ["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const,
                [
                  "p_child_table",
                  "pg_catalog.text",
                  request.p_child_table === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_child_table),
                ] as const,
                [
                  "p_analyze",
                  "pg_catalog.bool",
                  request.p_analyze === undefined ? undefined : nullableCodec(booleanCodec).encode(request.p_analyze),
                ] as const,
                [
                  "p_job_id",
                  "pg_catalog.int8",
                  request.p_job_id === undefined ? undefined : nullableCodec(integerCodec).encode(request.p_job_id),
                ] as const,
              ],
              partmanVoidCodec,
            ),
          ),
        apply_privileges: (request: ApplyPrivilegesRequest) =>
          context.run(() =>
            invoke(
              "apply_privileges",
              [
                [
                  "p_parent_schema",
                  "pg_catalog.text",
                  nullableCodec(textCodec).encode(request.p_parent_schema),
                ] as const,
                [
                  "p_parent_tablename",
                  "pg_catalog.text",
                  nullableCodec(textCodec).encode(request.p_parent_tablename),
                ] as const,
                ["p_child_schema", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_child_schema)] as const,
                [
                  "p_child_tablename",
                  "pg_catalog.text",
                  nullableCodec(textCodec).encode(request.p_child_tablename),
                ] as const,
                [
                  "p_job_id",
                  "pg_catalog.int8",
                  request.p_job_id === undefined ? undefined : nullableCodec(integerCodec).encode(request.p_job_id),
                ] as const,
              ],
              partmanVoidCodec,
            ),
          ),
        autovacuum_off: (request: AutovacuumOffRequest) =>
          context.run(() =>
            invoke(
              "autovacuum_off",
              [
                [
                  "p_parent_schema",
                  "pg_catalog.text",
                  nullableCodec(textCodec).encode(request.p_parent_schema),
                ] as const,
                [
                  "p_parent_tablename",
                  "pg_catalog.text",
                  nullableCodec(textCodec).encode(request.p_parent_tablename),
                ] as const,
                [
                  "p_source_schema",
                  "pg_catalog.text",
                  request.p_source_schema === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_source_schema),
                ] as const,
                [
                  "p_source_tablename",
                  "pg_catalog.text",
                  request.p_source_tablename === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_source_tablename),
                ] as const,
              ],
              nullableCodec(booleanCodec),
            ),
          ),
        autovacuum_reset: (request: AutovacuumResetRequest) =>
          context.run(() =>
            invoke(
              "autovacuum_reset",
              [
                [
                  "p_parent_schema",
                  "pg_catalog.text",
                  nullableCodec(textCodec).encode(request.p_parent_schema),
                ] as const,
                [
                  "p_parent_tablename",
                  "pg_catalog.text",
                  nullableCodec(textCodec).encode(request.p_parent_tablename),
                ] as const,
                [
                  "p_source_schema",
                  "pg_catalog.text",
                  request.p_source_schema === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_source_schema),
                ] as const,
                [
                  "p_source_tablename",
                  "pg_catalog.text",
                  request.p_source_tablename === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_source_tablename),
                ] as const,
              ],
              nullableCodec(booleanCodec),
            ),
          ),
        calculate_time_partition_info: (request: CalculateTimePartitionInfoRequest) =>
          context.run(() =>
            invoke(
              "calculate_time_partition_info",
              [
                [
                  "p_time_interval",
                  "pg_catalog.interval",
                  nullableCodec(partmanIntervalCodec).encode(request.p_time_interval),
                ] as const,
                [
                  "p_start_time",
                  "pg_catalog.timestamptz",
                  nullableCodec(timestamptzCodec).encode(request.p_start_time),
                ] as const,
                [
                  "p_date_trunc_interval",
                  "pg_catalog.text",
                  request.p_date_trunc_interval === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_date_trunc_interval),
                ] as const,
              ],
              calculate_time_partition_infoCodec,
            ),
          ),
        check_automatic_maintenance_value: (request: CheckAutomaticMaintenanceValueRequest) =>
          context.run(() =>
            invoke(
              "check_automatic_maintenance_value",
              [
                [
                  "p_automatic_maintenance",
                  "pg_catalog.text",
                  nullableCodec(textCodec).encode(request.p_automatic_maintenance),
                ] as const,
              ],
              nullableCodec(booleanCodec),
            ),
          ),
        check_control_type: (request: CheckControlTypeRequest) =>
          context.run(() =>
            invoke(
              "check_control_type",
              [
                [
                  "p_parent_schema",
                  "pg_catalog.text",
                  nullableCodec(textCodec).encode(request.p_parent_schema),
                ] as const,
                [
                  "p_parent_tablename",
                  "pg_catalog.text",
                  nullableCodec(textCodec).encode(request.p_parent_tablename),
                ] as const,
                ["p_control", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_control)] as const,
              ],
              check_control_typeCodec,
              true,
            ),
          ),
        check_default: (request: CheckDefaultRequest = {}) =>
          context.run(() =>
            invoke(
              "check_default",
              [
                [
                  "p_exact_count",
                  "pg_catalog.bool",
                  request.p_exact_count === undefined
                    ? undefined
                    : nullableCodec(booleanCodec).encode(request.p_exact_count),
                ] as const,
              ],
              check_default_tableCodec,
              true,
            ),
          ),
        check_epoch_type: (request: CheckEpochTypeRequest) =>
          context.run(() =>
            invoke(
              "check_epoch_type",
              [["p_type", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_type)] as const],
              nullableCodec(booleanCodec),
            ),
          ),
        check_name_length: (request: CheckNameLengthRequest) =>
          context.run(() =>
            invoke(
              "check_name_length",
              [
                ["p_object_name", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_object_name)] as const,
                [
                  "p_suffix",
                  "pg_catalog.text",
                  request.p_suffix === undefined ? undefined : nullableCodec(textCodec).encode(request.p_suffix),
                ] as const,
                [
                  "p_table_partition",
                  "pg_catalog.bool",
                  request.p_table_partition === undefined
                    ? undefined
                    : nullableCodec(booleanCodec).encode(request.p_table_partition),
                ] as const,
              ],
              nullableCodec(textCodec),
            ),
          ),
        check_partition_type: (request: CheckPartitionTypeRequest) =>
          context.run(() =>
            invoke(
              "check_partition_type",
              [["p_type", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_type)] as const],
              nullableCodec(booleanCodec),
            ),
          ),
        check_subpart_sameconfig: (request: CheckSubpartSameconfigRequest) =>
          context.run(() =>
            invoke(
              "check_subpart_sameconfig",
              [["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const],
              check_subpart_sameconfigCodec,
              true,
            ),
          ),
        check_subpartition_limits: (request: CheckSubpartitionLimitsRequest) =>
          context.run(() =>
            invoke(
              "check_subpartition_limits",
              [
                ["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const,
                ["p_type", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_type)] as const,
              ],
              check_subpartition_limitsCodec,
            ),
          ),
        create_parent: (request: CreateParentRequest) =>
          context.run(() =>
            invoke(
              "create_parent",
              [
                ["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const,
                ["p_control", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_control)] as const,
                ["p_interval", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_interval)] as const,
                [
                  "p_type",
                  "pg_catalog.text",
                  request.p_type === undefined ? undefined : nullableCodec(textCodec).encode(request.p_type),
                ] as const,
                [
                  "p_epoch",
                  "pg_catalog.text",
                  request.p_epoch === undefined ? undefined : nullableCodec(textCodec).encode(request.p_epoch),
                ] as const,
                [
                  "p_premake",
                  "pg_catalog.int4",
                  request.p_premake === undefined
                    ? undefined
                    : nullableCodec(partmanInt4Codec).encode(request.p_premake),
                ] as const,
                [
                  "p_start_partition",
                  "pg_catalog.text",
                  request.p_start_partition === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_start_partition),
                ] as const,
                [
                  "p_default_table",
                  "pg_catalog.bool",
                  request.p_default_table === undefined
                    ? undefined
                    : nullableCodec(booleanCodec).encode(request.p_default_table),
                ] as const,
                [
                  "p_automatic_maintenance",
                  "pg_catalog.text",
                  request.p_automatic_maintenance === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_automatic_maintenance),
                ] as const,
                [
                  "p_constraint_cols",
                  "pg_catalog._text",
                  request.p_constraint_cols === undefined
                    ? undefined
                    : nullableCodec(partmanTextArrayCodec).encode(request.p_constraint_cols),
                ] as const,
                [
                  "p_template_table",
                  "pg_catalog.text",
                  request.p_template_table === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_template_table),
                ] as const,
                [
                  "p_jobmon",
                  "pg_catalog.bool",
                  request.p_jobmon === undefined ? undefined : nullableCodec(booleanCodec).encode(request.p_jobmon),
                ] as const,
                [
                  "p_date_trunc_interval",
                  "pg_catalog.text",
                  request.p_date_trunc_interval === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_date_trunc_interval),
                ] as const,
              ],
              nullableCodec(booleanCodec),
            ),
          ),
        create_partition_id: (request: CreatePartitionIdRequest) =>
          context.run(() =>
            invoke(
              "create_partition_id",
              [
                ["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const,
                [
                  "p_partition_ids",
                  "pg_catalog._int8",
                  nullableCodec(partmanInt8ArrayCodec).encode(request.p_partition_ids),
                ] as const,
                [
                  "p_start_partition",
                  "pg_catalog.text",
                  request.p_start_partition === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_start_partition),
                ] as const,
              ],
              nullableCodec(booleanCodec),
            ),
          ),
        create_partition_time: (request: CreatePartitionTimeRequest) =>
          context.run(() =>
            invoke(
              "create_partition_time",
              [
                ["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const,
                [
                  "p_partition_times",
                  "pg_catalog._timestamptz",
                  nullableCodec(partmanTimeArrayCodec).encode(request.p_partition_times),
                ] as const,
                [
                  "p_start_partition",
                  "pg_catalog.text",
                  request.p_start_partition === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_start_partition),
                ] as const,
              ],
              nullableCodec(booleanCodec),
            ),
          ),
        create_sub_parent: (request: CreateSubParentRequest) =>
          context.run(() =>
            invoke(
              "create_sub_parent",
              [
                ["p_top_parent", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_top_parent)] as const,
                ["p_control", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_control)] as const,
                ["p_interval", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_interval)] as const,
                [
                  "p_type",
                  "pg_catalog.text",
                  request.p_type === undefined ? undefined : nullableCodec(textCodec).encode(request.p_type),
                ] as const,
                [
                  "p_default_table",
                  "pg_catalog.bool",
                  request.p_default_table === undefined
                    ? undefined
                    : nullableCodec(booleanCodec).encode(request.p_default_table),
                ] as const,
                [
                  "p_declarative_check",
                  "pg_catalog.text",
                  request.p_declarative_check === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_declarative_check),
                ] as const,
                [
                  "p_constraint_cols",
                  "pg_catalog._text",
                  request.p_constraint_cols === undefined
                    ? undefined
                    : nullableCodec(partmanTextArrayCodec).encode(request.p_constraint_cols),
                ] as const,
                [
                  "p_premake",
                  "pg_catalog.int4",
                  request.p_premake === undefined
                    ? undefined
                    : nullableCodec(partmanInt4Codec).encode(request.p_premake),
                ] as const,
                [
                  "p_start_partition",
                  "pg_catalog.text",
                  request.p_start_partition === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_start_partition),
                ] as const,
                [
                  "p_epoch",
                  "pg_catalog.text",
                  request.p_epoch === undefined ? undefined : nullableCodec(textCodec).encode(request.p_epoch),
                ] as const,
                [
                  "p_jobmon",
                  "pg_catalog.bool",
                  request.p_jobmon === undefined ? undefined : nullableCodec(booleanCodec).encode(request.p_jobmon),
                ] as const,
                [
                  "p_date_trunc_interval",
                  "pg_catalog.text",
                  request.p_date_trunc_interval === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_date_trunc_interval),
                ] as const,
              ],
              nullableCodec(booleanCodec),
            ),
          ),
        drop_constraints: (request: DropConstraintsRequest) =>
          context.run(() =>
            invoke(
              "drop_constraints",
              [
                ["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const,
                ["p_child_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_child_table)] as const,
                [
                  "p_debug",
                  "pg_catalog.bool",
                  request.p_debug === undefined ? undefined : nullableCodec(booleanCodec).encode(request.p_debug),
                ] as const,
              ],
              partmanVoidCodec,
            ),
          ),
        drop_partition_id: (request: DropPartitionIdRequest) =>
          context.run(() =>
            invoke(
              "drop_partition_id",
              [
                ["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const,
                [
                  "p_retention",
                  "pg_catalog.int8",
                  request.p_retention === undefined
                    ? undefined
                    : nullableCodec(integerCodec).encode(request.p_retention),
                ] as const,
                [
                  "p_keep_table",
                  "pg_catalog.bool",
                  request.p_keep_table === undefined
                    ? undefined
                    : nullableCodec(booleanCodec).encode(request.p_keep_table),
                ] as const,
                [
                  "p_keep_index",
                  "pg_catalog.bool",
                  request.p_keep_index === undefined
                    ? undefined
                    : nullableCodec(booleanCodec).encode(request.p_keep_index),
                ] as const,
                [
                  "p_retention_schema",
                  "pg_catalog.text",
                  request.p_retention_schema === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_retention_schema),
                ] as const,
              ],
              nullableCodec(partmanInt4Codec),
            ),
          ),
        drop_partition_time: (request: DropPartitionTimeRequest) =>
          context.run(() =>
            invoke(
              "drop_partition_time",
              [
                ["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const,
                [
                  "p_retention",
                  "pg_catalog.interval",
                  request.p_retention === undefined
                    ? undefined
                    : nullableCodec(partmanIntervalCodec).encode(request.p_retention),
                ] as const,
                [
                  "p_keep_table",
                  "pg_catalog.bool",
                  request.p_keep_table === undefined
                    ? undefined
                    : nullableCodec(booleanCodec).encode(request.p_keep_table),
                ] as const,
                [
                  "p_keep_index",
                  "pg_catalog.bool",
                  request.p_keep_index === undefined
                    ? undefined
                    : nullableCodec(booleanCodec).encode(request.p_keep_index),
                ] as const,
                [
                  "p_retention_schema",
                  "pg_catalog.text",
                  request.p_retention_schema === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_retention_schema),
                ] as const,
                [
                  "p_reference_timestamp",
                  "pg_catalog.timestamptz",
                  request.p_reference_timestamp === undefined
                    ? undefined
                    : nullableCodec(timestamptzCodec).encode(request.p_reference_timestamp),
                ] as const,
              ],
              nullableCodec(partmanInt4Codec),
            ),
          ),
        dump_partitioned_table_definition: (request: DumpPartitionedTableDefinitionRequest) =>
          context.run(() =>
            invoke(
              "dump_partitioned_table_definition",
              [
                ["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const,
                [
                  "p_ignore_template_table",
                  "pg_catalog.bool",
                  request.p_ignore_template_table === undefined
                    ? undefined
                    : nullableCodec(booleanCodec).encode(request.p_ignore_template_table),
                ] as const,
              ],
              nullableCodec(textCodec),
            ),
          ),
        inherit_replica_identity: (request: InheritReplicaIdentityRequest) =>
          context.run(() =>
            invoke(
              "inherit_replica_identity",
              [
                [
                  "p_parent_schemaname",
                  "pg_catalog.text",
                  nullableCodec(textCodec).encode(request.p_parent_schemaname),
                ] as const,
                [
                  "p_parent_tablename",
                  "pg_catalog.text",
                  nullableCodec(textCodec).encode(request.p_parent_tablename),
                ] as const,
                [
                  "p_child_tablename",
                  "pg_catalog.text",
                  nullableCodec(textCodec).encode(request.p_child_tablename),
                ] as const,
              ],
              partmanVoidCodec,
            ),
          ),
        inherit_template_properties: (request: InheritTemplatePropertiesRequest) =>
          context.run(() =>
            invoke(
              "inherit_template_properties",
              [
                ["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const,
                ["p_child_schema", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_child_schema)] as const,
                [
                  "p_child_tablename",
                  "pg_catalog.text",
                  nullableCodec(textCodec).encode(request.p_child_tablename),
                ] as const,
              ],
              nullableCodec(booleanCodec),
            ),
          ),
        partition_data_id: (request: PartitionDataIdRequest) =>
          context.run(() =>
            invoke(
              "partition_data_id",
              [
                ["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const,
                [
                  "p_batch_count",
                  "pg_catalog.int4",
                  request.p_batch_count === undefined
                    ? undefined
                    : nullableCodec(partmanInt4Codec).encode(request.p_batch_count),
                ] as const,
                [
                  "p_batch_interval",
                  "pg_catalog.int8",
                  request.p_batch_interval === undefined
                    ? undefined
                    : nullableCodec(integerCodec).encode(request.p_batch_interval),
                ] as const,
                [
                  "p_lock_wait",
                  "pg_catalog.numeric",
                  request.p_lock_wait === undefined
                    ? undefined
                    : nullableCodec(numericCodec).encode(request.p_lock_wait),
                ] as const,
                [
                  "p_order",
                  "pg_catalog.text",
                  request.p_order === undefined ? undefined : nullableCodec(textCodec).encode(request.p_order),
                ] as const,
                [
                  "p_analyze",
                  "pg_catalog.bool",
                  request.p_analyze === undefined ? undefined : nullableCodec(booleanCodec).encode(request.p_analyze),
                ] as const,
                [
                  "p_source_table",
                  "pg_catalog.text",
                  request.p_source_table === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_source_table),
                ] as const,
                [
                  "p_ignored_columns",
                  "pg_catalog._text",
                  request.p_ignored_columns === undefined
                    ? undefined
                    : nullableCodec(partmanTextArrayCodec).encode(request.p_ignored_columns),
                ] as const,
              ],
              nullableCodec(integerCodec),
            ),
          ),
        partition_data_time: (request: PartitionDataTimeRequest) =>
          context.run(() =>
            invoke(
              "partition_data_time",
              [
                ["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const,
                [
                  "p_batch_count",
                  "pg_catalog.int4",
                  request.p_batch_count === undefined
                    ? undefined
                    : nullableCodec(partmanInt4Codec).encode(request.p_batch_count),
                ] as const,
                [
                  "p_batch_interval",
                  "pg_catalog.interval",
                  request.p_batch_interval === undefined
                    ? undefined
                    : nullableCodec(partmanIntervalCodec).encode(request.p_batch_interval),
                ] as const,
                [
                  "p_lock_wait",
                  "pg_catalog.numeric",
                  request.p_lock_wait === undefined
                    ? undefined
                    : nullableCodec(numericCodec).encode(request.p_lock_wait),
                ] as const,
                [
                  "p_order",
                  "pg_catalog.text",
                  request.p_order === undefined ? undefined : nullableCodec(textCodec).encode(request.p_order),
                ] as const,
                [
                  "p_analyze",
                  "pg_catalog.bool",
                  request.p_analyze === undefined ? undefined : nullableCodec(booleanCodec).encode(request.p_analyze),
                ] as const,
                [
                  "p_source_table",
                  "pg_catalog.text",
                  request.p_source_table === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_source_table),
                ] as const,
                [
                  "p_ignored_columns",
                  "pg_catalog._text",
                  request.p_ignored_columns === undefined
                    ? undefined
                    : nullableCodec(partmanTextArrayCodec).encode(request.p_ignored_columns),
                ] as const,
              ],
              nullableCodec(integerCodec),
            ),
          ),
        partition_gap_fill: (request: PartitionGapFillRequest) =>
          context.run(() =>
            invoke(
              "partition_gap_fill",
              [["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const],
              nullableCodec(partmanInt4Codec),
            ),
          ),
        reapply_privileges: (request: ReapplyPrivilegesRequest) =>
          context.run(() =>
            invoke(
              "reapply_privileges",
              [["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const],
              partmanVoidCodec,
            ),
          ),
        run_maintenance: (request: RunMaintenanceRequest = {}) =>
          context.run(() =>
            invoke(
              "run_maintenance",
              [
                [
                  "p_parent_table",
                  "pg_catalog.text",
                  request.p_parent_table === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_parent_table),
                ] as const,
                [
                  "p_analyze",
                  "pg_catalog.bool",
                  request.p_analyze === undefined ? undefined : nullableCodec(booleanCodec).encode(request.p_analyze),
                ] as const,
                [
                  "p_jobmon",
                  "pg_catalog.bool",
                  request.p_jobmon === undefined ? undefined : nullableCodec(booleanCodec).encode(request.p_jobmon),
                ] as const,
              ],
              partmanVoidCodec,
            ),
          ),
        show_partition_info: (request: ShowPartitionInfoRequest) =>
          context.run(() =>
            invoke(
              "show_partition_info",
              [
                ["p_child_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_child_table)] as const,
                [
                  "p_partition_interval",
                  "pg_catalog.text",
                  request.p_partition_interval === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_partition_interval),
                ] as const,
                [
                  "p_parent_table",
                  "pg_catalog.text",
                  request.p_parent_table === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_parent_table),
                ] as const,
              ],
              show_partition_infoCodec,
            ),
          ),
        show_partition_name: (request: ShowPartitionNameRequest) =>
          context.run(() =>
            invoke(
              "show_partition_name",
              [
                ["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const,
                ["p_value", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_value)] as const,
              ],
              show_partition_nameCodec,
            ),
          ),
        show_partitions: (request: ShowPartitionsRequest) =>
          context.run(() =>
            invoke(
              "show_partitions",
              [
                ["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const,
                [
                  "p_order",
                  "pg_catalog.text",
                  request.p_order === undefined ? undefined : nullableCodec(textCodec).encode(request.p_order),
                ] as const,
                [
                  "p_include_default",
                  "pg_catalog.bool",
                  request.p_include_default === undefined
                    ? undefined
                    : nullableCodec(booleanCodec).encode(request.p_include_default),
                ] as const,
              ],
              show_partitionsCodec,
              true,
            ),
          ),
        stop_sub_partition: (request: StopSubPartitionRequest) =>
          context.run(() =>
            invoke(
              "stop_sub_partition",
              [
                ["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const,
                [
                  "p_jobmon",
                  "pg_catalog.bool",
                  request.p_jobmon === undefined ? undefined : nullableCodec(booleanCodec).encode(request.p_jobmon),
                ] as const,
              ],
              nullableCodec(booleanCodec),
            ),
          ),
        undo_partition: (request: UndoPartitionRequest) =>
          context.run(() =>
            invoke(
              "undo_partition",
              [
                ["p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_parent_table)] as const,
                ["p_target_table", "pg_catalog.text", nullableCodec(textCodec).encode(request.p_target_table)] as const,
                [
                  "p_loop_count",
                  "pg_catalog.int4",
                  request.p_loop_count === undefined
                    ? undefined
                    : nullableCodec(partmanInt4Codec).encode(request.p_loop_count),
                ] as const,
                [
                  "p_batch_interval",
                  "pg_catalog.text",
                  request.p_batch_interval === undefined
                    ? undefined
                    : nullableCodec(textCodec).encode(request.p_batch_interval),
                ] as const,
                [
                  "p_keep_table",
                  "pg_catalog.bool",
                  request.p_keep_table === undefined
                    ? undefined
                    : nullableCodec(booleanCodec).encode(request.p_keep_table),
                ] as const,
                [
                  "p_lock_wait",
                  "pg_catalog.numeric",
                  request.p_lock_wait === undefined
                    ? undefined
                    : nullableCodec(numericCodec).encode(request.p_lock_wait),
                ] as const,
                [
                  "p_ignored_columns",
                  "pg_catalog._text",
                  request.p_ignored_columns === undefined
                    ? undefined
                    : nullableCodec(partmanTextArrayCodec).encode(request.p_ignored_columns),
                ] as const,
                [
                  "p_drop_cascade",
                  "pg_catalog.bool",
                  request.p_drop_cascade === undefined
                    ? undefined
                    : nullableCodec(booleanCodec).encode(request.p_drop_cascade),
                ] as const,
              ],
              undo_partitionCodec,
            ),
          ),
        part_config: (parent: string) =>
          context.run(async () => {
            const rows = await context.client.query(
              `SELECT ROW(r.*)::text AS value FROM ${schema}."part_config" r WHERE "parent_table"=$1`,
              [textCodec.encode(parent)],
            );
            return Object.freeze(
              v
                .parse(v.array(v.strictObject({ value: v.string() })), rows.rows)
                .map((row) => part_configCodec.decode(row.value)),
            );
          }),
        configure_part_config: (parent: string, patch: PartConfigPatch) =>
          context.run(async () => {
            const parameters: unknown[] = [textCodec.encode(parent)];
            const assignments: string[] = [];
            if (patch.control !== undefined) {
              parameters.push(textCodec.encode(patch.control));
              assignments.push('"control"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.partition_interval !== undefined) {
              parameters.push(textCodec.encode(patch.partition_interval));
              assignments.push('"partition_interval"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.partition_type !== undefined) {
              parameters.push(textCodec.encode(patch.partition_type));
              assignments.push('"partition_type"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.premake !== undefined) {
              parameters.push(partmanInt4Codec.encode(patch.premake));
              assignments.push('"premake"=$' + parameters.length + "::pg_catalog.int4");
            }
            if (patch.automatic_maintenance !== undefined) {
              parameters.push(textCodec.encode(patch.automatic_maintenance));
              assignments.push('"automatic_maintenance"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.template_table !== undefined) {
              parameters.push(nullableCodec(textCodec).encode(patch.template_table));
              assignments.push('"template_table"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.retention !== undefined) {
              parameters.push(nullableCodec(textCodec).encode(patch.retention));
              assignments.push('"retention"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.retention_schema !== undefined) {
              parameters.push(nullableCodec(textCodec).encode(patch.retention_schema));
              assignments.push('"retention_schema"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.retention_keep_index !== undefined) {
              parameters.push(booleanCodec.encode(patch.retention_keep_index));
              assignments.push('"retention_keep_index"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.retention_keep_table !== undefined) {
              parameters.push(booleanCodec.encode(patch.retention_keep_table));
              assignments.push('"retention_keep_table"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.epoch !== undefined) {
              parameters.push(textCodec.encode(patch.epoch));
              assignments.push('"epoch"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.constraint_cols !== undefined) {
              parameters.push(nullableCodec(partmanTextArrayCodec).encode(patch.constraint_cols));
              assignments.push('"constraint_cols"=$' + parameters.length + "::pg_catalog._text");
            }
            if (patch.optimize_constraint !== undefined) {
              parameters.push(partmanInt4Codec.encode(patch.optimize_constraint));
              assignments.push('"optimize_constraint"=$' + parameters.length + "::pg_catalog.int4");
            }
            if (patch.infinite_time_partitions !== undefined) {
              parameters.push(booleanCodec.encode(patch.infinite_time_partitions));
              assignments.push('"infinite_time_partitions"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.datetime_string !== undefined) {
              parameters.push(nullableCodec(textCodec).encode(patch.datetime_string));
              assignments.push('"datetime_string"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.jobmon !== undefined) {
              parameters.push(booleanCodec.encode(patch.jobmon));
              assignments.push('"jobmon"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.sub_partition_set_full !== undefined) {
              parameters.push(booleanCodec.encode(patch.sub_partition_set_full));
              assignments.push('"sub_partition_set_full"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.undo_in_progress !== undefined) {
              parameters.push(booleanCodec.encode(patch.undo_in_progress));
              assignments.push('"undo_in_progress"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.inherit_privileges !== undefined) {
              parameters.push(nullableCodec(booleanCodec).encode(patch.inherit_privileges));
              assignments.push('"inherit_privileges"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.constraint_valid !== undefined) {
              parameters.push(booleanCodec.encode(patch.constraint_valid));
              assignments.push('"constraint_valid"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.ignore_default_data !== undefined) {
              parameters.push(booleanCodec.encode(patch.ignore_default_data));
              assignments.push('"ignore_default_data"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.default_table !== undefined) {
              parameters.push(nullableCodec(booleanCodec).encode(patch.default_table));
              assignments.push('"default_table"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.date_trunc_interval !== undefined) {
              parameters.push(nullableCodec(textCodec).encode(patch.date_trunc_interval));
              assignments.push('"date_trunc_interval"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.maintenance_order !== undefined) {
              parameters.push(nullableCodec(partmanInt4Codec).encode(patch.maintenance_order));
              assignments.push('"maintenance_order"=$' + parameters.length + "::pg_catalog.int4");
            }
            if (patch.retention_keep_publication !== undefined) {
              parameters.push(booleanCodec.encode(patch.retention_keep_publication));
              assignments.push('"retention_keep_publication"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.maintenance_last_run !== undefined) {
              parameters.push(nullableCodec(timestamptzCodec).encode(patch.maintenance_last_run));
              assignments.push('"maintenance_last_run"=$' + parameters.length + "::pg_catalog.timestamptz");
            }
            if (!assignments.length) return;
            await context.client.query(
              `UPDATE ${schema}."part_config" SET ${assignments.join(",")} WHERE "parent_table"=$1`,
              parameters,
            );
          }),
        part_config_sub: (parent: string) =>
          context.run(async () => {
            const rows = await context.client.query(
              `SELECT ROW(r.*)::text AS value FROM ${schema}."part_config_sub" r WHERE "sub_parent"=$1`,
              [textCodec.encode(parent)],
            );
            return Object.freeze(
              v
                .parse(v.array(v.strictObject({ value: v.string() })), rows.rows)
                .map((row) => part_config_subCodec.decode(row.value)),
            );
          }),
        configure_part_config_sub: (parent: string, patch: PartConfigSubPatch) =>
          context.run(async () => {
            const parameters: unknown[] = [textCodec.encode(parent)];
            const assignments: string[] = [];
            if (patch.sub_control !== undefined) {
              parameters.push(textCodec.encode(patch.sub_control));
              assignments.push('"sub_control"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.sub_partition_interval !== undefined) {
              parameters.push(textCodec.encode(patch.sub_partition_interval));
              assignments.push('"sub_partition_interval"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.sub_partition_type !== undefined) {
              parameters.push(textCodec.encode(patch.sub_partition_type));
              assignments.push('"sub_partition_type"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.sub_premake !== undefined) {
              parameters.push(partmanInt4Codec.encode(patch.sub_premake));
              assignments.push('"sub_premake"=$' + parameters.length + "::pg_catalog.int4");
            }
            if (patch.sub_automatic_maintenance !== undefined) {
              parameters.push(textCodec.encode(patch.sub_automatic_maintenance));
              assignments.push('"sub_automatic_maintenance"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.sub_template_table !== undefined) {
              parameters.push(nullableCodec(textCodec).encode(patch.sub_template_table));
              assignments.push('"sub_template_table"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.sub_retention !== undefined) {
              parameters.push(nullableCodec(textCodec).encode(patch.sub_retention));
              assignments.push('"sub_retention"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.sub_retention_schema !== undefined) {
              parameters.push(nullableCodec(textCodec).encode(patch.sub_retention_schema));
              assignments.push('"sub_retention_schema"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.sub_retention_keep_index !== undefined) {
              parameters.push(booleanCodec.encode(patch.sub_retention_keep_index));
              assignments.push('"sub_retention_keep_index"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.sub_retention_keep_table !== undefined) {
              parameters.push(booleanCodec.encode(patch.sub_retention_keep_table));
              assignments.push('"sub_retention_keep_table"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.sub_epoch !== undefined) {
              parameters.push(textCodec.encode(patch.sub_epoch));
              assignments.push('"sub_epoch"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.sub_constraint_cols !== undefined) {
              parameters.push(nullableCodec(partmanTextArrayCodec).encode(patch.sub_constraint_cols));
              assignments.push('"sub_constraint_cols"=$' + parameters.length + "::pg_catalog._text");
            }
            if (patch.sub_optimize_constraint !== undefined) {
              parameters.push(partmanInt4Codec.encode(patch.sub_optimize_constraint));
              assignments.push('"sub_optimize_constraint"=$' + parameters.length + "::pg_catalog.int4");
            }
            if (patch.sub_infinite_time_partitions !== undefined) {
              parameters.push(booleanCodec.encode(patch.sub_infinite_time_partitions));
              assignments.push('"sub_infinite_time_partitions"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.sub_jobmon !== undefined) {
              parameters.push(booleanCodec.encode(patch.sub_jobmon));
              assignments.push('"sub_jobmon"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.sub_inherit_privileges !== undefined) {
              parameters.push(nullableCodec(booleanCodec).encode(patch.sub_inherit_privileges));
              assignments.push('"sub_inherit_privileges"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.sub_constraint_valid !== undefined) {
              parameters.push(booleanCodec.encode(patch.sub_constraint_valid));
              assignments.push('"sub_constraint_valid"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.sub_ignore_default_data !== undefined) {
              parameters.push(booleanCodec.encode(patch.sub_ignore_default_data));
              assignments.push('"sub_ignore_default_data"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.sub_default_table !== undefined) {
              parameters.push(nullableCodec(booleanCodec).encode(patch.sub_default_table));
              assignments.push('"sub_default_table"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (patch.sub_date_trunc_interval !== undefined) {
              parameters.push(nullableCodec(textCodec).encode(patch.sub_date_trunc_interval));
              assignments.push('"sub_date_trunc_interval"=$' + parameters.length + "::pg_catalog.text");
            }
            if (patch.sub_maintenance_order !== undefined) {
              parameters.push(nullableCodec(partmanInt4Codec).encode(patch.sub_maintenance_order));
              assignments.push('"sub_maintenance_order"=$' + parameters.length + "::pg_catalog.int4");
            }
            if (patch.sub_retention_keep_publication !== undefined) {
              parameters.push(booleanCodec.encode(patch.sub_retention_keep_publication));
              assignments.push('"sub_retention_keep_publication"=$' + parameters.length + "::pg_catalog.bool");
            }
            if (!assignments.length) return;
            await context.client.query(
              `UPDATE ${schema}."part_config_sub" SET ${assignments.join(",")} WHERE "sub_parent"=$1`,
              parameters,
            );
          }),
        prerequisites: () =>
          context.run(async () => {
            const rows = await context.client.query(
              "SELECT current_user AS operator, current_setting('TimeZone') AS timezone, current_setting('shared_preload_libraries') AS shared_preload_libraries, EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_jobmon') AS jobmon_installed, EXISTS(SELECT 1 FROM pg_extension WHERE extname='pg_cron') AS cron_installed",
            );
            return v.parse(
              v.strictObject({
                operator: v.string(),
                timezone: v.string(),
                shared_preload_libraries: v.string(),
                jobmon_installed: v.boolean(),
                cron_installed: v.boolean(),
              }),
              rows.rows[0],
            );
          }),
      });
    },
    callback,
    signal,
  );
}
export interface PgPartmanSession {
  readonly apply_cluster: (request: ApplyClusterRequest) => Promise<ReturnType<typeof partmanVoidCodec.decode>>;
  readonly apply_constraints: (request: ApplyConstraintsRequest) => Promise<ReturnType<typeof partmanVoidCodec.decode>>;
  readonly apply_privileges: (request: ApplyPrivilegesRequest) => Promise<ReturnType<typeof partmanVoidCodec.decode>>;
  readonly autovacuum_off: (request: AutovacuumOffRequest) => Promise<boolean | null>;
  readonly autovacuum_reset: (request: AutovacuumResetRequest) => Promise<boolean | null>;
  readonly calculate_time_partition_info: (
    request: CalculateTimePartitionInfoRequest,
  ) => Promise<ReturnType<typeof calculate_time_partition_infoCodec.decode>>;
  readonly check_automatic_maintenance_value: (
    request: CheckAutomaticMaintenanceValueRequest,
  ) => Promise<boolean | null>;
  readonly check_control_type: (
    request: CheckControlTypeRequest,
  ) => Promise<readonly ReturnType<typeof check_control_typeCodec.decode>[]>;
  readonly check_default: (
    request?: CheckDefaultRequest,
  ) => Promise<readonly ReturnType<typeof check_default_tableCodec.decode>[]>;
  readonly check_epoch_type: (request: CheckEpochTypeRequest) => Promise<boolean | null>;
  readonly check_name_length: (request: CheckNameLengthRequest) => Promise<string | null>;
  readonly check_partition_type: (request: CheckPartitionTypeRequest) => Promise<boolean | null>;
  readonly check_subpart_sameconfig: (
    request: CheckSubpartSameconfigRequest,
  ) => Promise<readonly ReturnType<typeof check_subpart_sameconfigCodec.decode>[]>;
  readonly check_subpartition_limits: (
    request: CheckSubpartitionLimitsRequest,
  ) => Promise<ReturnType<typeof check_subpartition_limitsCodec.decode>>;
  readonly create_parent: (request: CreateParentRequest) => Promise<boolean | null>;
  readonly create_partition_id: (request: CreatePartitionIdRequest) => Promise<boolean | null>;
  readonly create_partition_time: (request: CreatePartitionTimeRequest) => Promise<boolean | null>;
  readonly create_sub_parent: (request: CreateSubParentRequest) => Promise<boolean | null>;
  readonly drop_constraints: (request: DropConstraintsRequest) => Promise<ReturnType<typeof partmanVoidCodec.decode>>;
  readonly drop_partition_id: (request: DropPartitionIdRequest) => Promise<number | null>;
  readonly drop_partition_time: (request: DropPartitionTimeRequest) => Promise<number | null>;
  readonly dump_partitioned_table_definition: (
    request: DumpPartitionedTableDefinitionRequest,
  ) => Promise<string | null>;
  readonly inherit_replica_identity: (
    request: InheritReplicaIdentityRequest,
  ) => Promise<ReturnType<typeof partmanVoidCodec.decode>>;
  readonly inherit_template_properties: (request: InheritTemplatePropertiesRequest) => Promise<boolean | null>;
  readonly partition_data_id: (request: PartitionDataIdRequest) => Promise<bigint | null>;
  readonly partition_data_time: (request: PartitionDataTimeRequest) => Promise<bigint | null>;
  readonly partition_gap_fill: (request: PartitionGapFillRequest) => Promise<number | null>;
  readonly reapply_privileges: (
    request: ReapplyPrivilegesRequest,
  ) => Promise<ReturnType<typeof partmanVoidCodec.decode>>;
  readonly run_maintenance: (request?: RunMaintenanceRequest) => Promise<ReturnType<typeof partmanVoidCodec.decode>>;
  readonly show_partition_info: (
    request: ShowPartitionInfoRequest,
  ) => Promise<ReturnType<typeof show_partition_infoCodec.decode>>;
  readonly show_partition_name: (
    request: ShowPartitionNameRequest,
  ) => Promise<ReturnType<typeof show_partition_nameCodec.decode>>;
  readonly show_partitions: (
    request: ShowPartitionsRequest,
  ) => Promise<readonly ReturnType<typeof show_partitionsCodec.decode>[]>;
  readonly stop_sub_partition: (request: StopSubPartitionRequest) => Promise<boolean | null>;
  readonly undo_partition: (request: UndoPartitionRequest) => Promise<ReturnType<typeof undo_partitionCodec.decode>>;
  readonly part_config: (parent: string) => Promise<readonly ReturnType<typeof part_configCodec.decode>[]>;
  readonly configure_part_config: (parent: string, patch: PartConfigPatch) => Promise<void>;
  readonly part_config_sub: (parent: string) => Promise<readonly ReturnType<typeof part_config_subCodec.decode>[]>;
  readonly configure_part_config_sub: (parent: string, patch: PartConfigSubPatch) => Promise<void>;
  readonly prerequisites: () => Promise<{
    operator: string;
    timezone: string;
    shared_preload_libraries: string;
    jobmon_installed: boolean;
    cron_installed: boolean;
  }>;
}
export class PgPartmanProcedureError extends Error {
  readonly atomic = false;
  readonly completion = "unknown";
  constructor(cause: unknown) {
    super("pg_partman procedure failed; earlier batches may have committed", { cause });
    this.name = "PgPartmanProcedureError";
  }
}
/** A top-level CALL owns a dedicated operator backend. Native batch COMMITs are retained; no retries or claimed rollback. */
export async function executePgPartmanProcedure(
  directOperatorUrl: string,
  descriptor: PgPartmanDescriptor,
  request: PgPartmanProcedureRequest,
) {
  const required = requirement(descriptor);
  const schema = quote(descriptor.schema);
  return withMigrationConnection(directUrl(directOperatorUrl), async (client) => {
    await acquireExtensionLock(client);
    await verifyExtensionApiContracts(client, [required]);
    await client.query("SET DateStyle='ISO,YMD'; SET IntervalStyle='postgres'");
    const values: unknown[] = [];
    const args: string[] = [];
    // oxlint-disable-next-line anti-slop/no-unknown-parameters -- Exact native codecs validate each encoded argument before this private driver binding sink.
    function parameter(name: string, type: string, value: unknown) {
      if (value !== undefined) {
        values.push(value);
        args.push(quote(name) + "=> $" + values.length + "::" + type);
      }
    }
    switch (request.procedure) {
      case "partition_data_proc": {
        const input = request.arguments;
        parameter("p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(input.p_parent_table));
        parameter(
          "p_loop_count",
          "pg_catalog.int4",
          input.p_loop_count === undefined ? undefined : nullableCodec(partmanInt4Codec).encode(input.p_loop_count),
        );
        parameter(
          "p_interval",
          "pg_catalog.text",
          input.p_interval === undefined ? undefined : nullableCodec(textCodec).encode(input.p_interval),
        );
        parameter(
          "p_lock_wait",
          "pg_catalog.int4",
          input.p_lock_wait === undefined ? undefined : nullableCodec(partmanInt4Codec).encode(input.p_lock_wait),
        );
        parameter(
          "p_lock_wait_tries",
          "pg_catalog.int4",
          input.p_lock_wait_tries === undefined
            ? undefined
            : nullableCodec(partmanInt4Codec).encode(input.p_lock_wait_tries),
        );
        parameter(
          "p_wait",
          "pg_catalog.int4",
          input.p_wait === undefined ? undefined : nullableCodec(partmanInt4Codec).encode(input.p_wait),
        );
        parameter(
          "p_order",
          "pg_catalog.text",
          input.p_order === undefined ? undefined : nullableCodec(textCodec).encode(input.p_order),
        );
        parameter(
          "p_source_table",
          "pg_catalog.text",
          input.p_source_table === undefined ? undefined : nullableCodec(textCodec).encode(input.p_source_table),
        );
        parameter(
          "p_ignored_columns",
          "pg_catalog._text",
          input.p_ignored_columns === undefined
            ? undefined
            : nullableCodec(partmanTextArrayCodec).encode(input.p_ignored_columns),
        );
        parameter(
          "p_quiet",
          "pg_catalog.bool",
          input.p_quiet === undefined ? undefined : nullableCodec(booleanCodec).encode(input.p_quiet),
        );
        break;
      }
      case "reapply_constraints_proc": {
        const input = request.arguments;
        parameter("p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(input.p_parent_table));
        parameter(
          "p_drop_constraints",
          "pg_catalog.bool",
          input.p_drop_constraints === undefined
            ? undefined
            : nullableCodec(booleanCodec).encode(input.p_drop_constraints),
        );
        parameter(
          "p_apply_constraints",
          "pg_catalog.bool",
          input.p_apply_constraints === undefined
            ? undefined
            : nullableCodec(booleanCodec).encode(input.p_apply_constraints),
        );
        parameter(
          "p_wait",
          "pg_catalog.int4",
          input.p_wait === undefined ? undefined : nullableCodec(partmanInt4Codec).encode(input.p_wait),
        );
        parameter(
          "p_dryrun",
          "pg_catalog.bool",
          input.p_dryrun === undefined ? undefined : nullableCodec(booleanCodec).encode(input.p_dryrun),
        );
        break;
      }
      case "run_analyze": {
        const input = request.arguments;
        parameter(
          "p_skip_locked",
          "pg_catalog.bool",
          input.p_skip_locked === undefined ? undefined : nullableCodec(booleanCodec).encode(input.p_skip_locked),
        );
        parameter(
          "p_quiet",
          "pg_catalog.bool",
          input.p_quiet === undefined ? undefined : nullableCodec(booleanCodec).encode(input.p_quiet),
        );
        parameter(
          "p_parent_table",
          "pg_catalog.text",
          input.p_parent_table === undefined ? undefined : nullableCodec(textCodec).encode(input.p_parent_table),
        );
        break;
      }
      case "run_maintenance_proc": {
        const input = request.arguments;
        parameter(
          "p_wait",
          "pg_catalog.int4",
          input.p_wait === undefined ? undefined : nullableCodec(partmanInt4Codec).encode(input.p_wait),
        );
        parameter(
          "p_analyze",
          "pg_catalog.bool",
          input.p_analyze === undefined ? undefined : nullableCodec(booleanCodec).encode(input.p_analyze),
        );
        parameter(
          "p_jobmon",
          "pg_catalog.bool",
          input.p_jobmon === undefined ? undefined : nullableCodec(booleanCodec).encode(input.p_jobmon),
        );
        break;
      }
      case "undo_partition_proc": {
        const input = request.arguments;
        parameter("p_parent_table", "pg_catalog.text", nullableCodec(textCodec).encode(input.p_parent_table));
        parameter(
          "p_target_table",
          "pg_catalog.text",
          input.p_target_table === undefined ? undefined : nullableCodec(textCodec).encode(input.p_target_table),
        );
        parameter(
          "p_loop_count",
          "pg_catalog.int4",
          input.p_loop_count === undefined ? undefined : nullableCodec(partmanInt4Codec).encode(input.p_loop_count),
        );
        parameter(
          "p_interval",
          "pg_catalog.text",
          input.p_interval === undefined ? undefined : nullableCodec(textCodec).encode(input.p_interval),
        );
        parameter(
          "p_keep_table",
          "pg_catalog.bool",
          input.p_keep_table === undefined ? undefined : nullableCodec(booleanCodec).encode(input.p_keep_table),
        );
        parameter(
          "p_lock_wait",
          "pg_catalog.int4",
          input.p_lock_wait === undefined ? undefined : nullableCodec(partmanInt4Codec).encode(input.p_lock_wait),
        );
        parameter(
          "p_lock_wait_tries",
          "pg_catalog.int4",
          input.p_lock_wait_tries === undefined
            ? undefined
            : nullableCodec(partmanInt4Codec).encode(input.p_lock_wait_tries),
        );
        parameter(
          "p_wait",
          "pg_catalog.int4",
          input.p_wait === undefined ? undefined : nullableCodec(partmanInt4Codec).encode(input.p_wait),
        );
        parameter(
          "p_ignored_columns",
          "pg_catalog._text",
          input.p_ignored_columns === undefined
            ? undefined
            : nullableCodec(partmanTextArrayCodec).encode(input.p_ignored_columns),
        );
        parameter(
          "p_drop_cascade",
          "pg_catalog.bool",
          input.p_drop_cascade === undefined ? undefined : nullableCodec(booleanCodec).encode(input.p_drop_cascade),
        );
        parameter(
          "p_quiet",
          "pg_catalog.bool",
          input.p_quiet === undefined ? undefined : nullableCodec(booleanCodec).encode(input.p_quiet),
        );
        break;
      }
      default: {
        const unreachable: never = request;
        throw new Error(`Unknown pg_partman procedure: ${String(unreachable)}`);
      }
    }
    try {
      await client.query(`CALL ${schema}.${quote(request.procedure)}(${args.join(",")})`, values);
    } catch (cause) {
      throw new PgPartmanProcedureError(cause);
    }
    return Object.freeze({
      completion: "completed",
      atomic: false,
      procedure: request.procedure,
      digest: pgPartmanDigest,
    } as const);
  });
}
