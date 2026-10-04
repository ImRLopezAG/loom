import { sql } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { booleanCodec, nullableCodec, textCodec, withCodecSqlType } from "../codecs";
import { timestamptzCodec } from "../native-timestamp-codecs";
import { createExtensionField } from "../fields";
import { extensionRows } from "../rows";
import { checkedExtensionExpression, createSqlFunction, defaultSqlArgument } from "../sql";
import type { ExtensionValueSchema } from "../values";
import {
  partmanIntervalCodec,
  check_default_tableFields,
  check_default_tableCodec,
  part_configFields,
  part_configCodec,
  part_config_subFields,
  part_config_subCodec,
  table_privsFields,
  table_privsCodec,
  calculate_time_partition_infoFields,
  calculate_time_partition_infoCodec,
  check_control_typeFields,
  check_control_typeCodec,
  check_subpart_sameconfigFields,
  check_subpart_sameconfigCodec,
  check_subpartition_limitsFields,
  check_subpartition_limitsCodec,
  show_partition_infoFields,
  show_partition_infoCodec,
  show_partition_nameFields,
  show_partition_nameCodec,
  show_partitionsFields,
  show_partitionsCodec,
  check_default_tableArrayCodec,
  part_configArrayCodec,
  part_config_subArrayCodec,
  table_privsArrayCodec,
} from "./pg_partman-codecs";
export * from "./pg_partman-codecs";
export const pgPartmanDigest = "f7833b872d553ea877f41e6e15834e9e3bfb4a2cfd84f43e3ac4710188193555";
export function createPgPartman_5_1_0<
  const Descriptor extends ExtensionDescriptor<"pg_partman", { version: "5.1.0"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "pg_partman" ||
    descriptor.version !== "5.1.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== pgPartmanDigest
  )
    throw new Error("pg_partman 5.1.0 requires its exact verified contract");
  const base = { schema: descriptor.schema, dependencies: [], observability: "external", authority: "query" } as const;
  const calculate_time_partition_info = createSqlFunction({
    ...base,
    name: "calculate_time_partition_info",
    member:
      "routine:$extension:pg_partman.calculate_time_partition_info(pg_catalog.interval,pg_catalog.timestamptz,pg_catalog.text)",
    arguments: [
      nullableCodec(partmanIntervalCodec),
      nullableCodec(timestamptzCodec),
      defaultSqlArgument(nullableCodec(textCodec), "p_date_trunc_interval"),
    ] as const,
    result: calculate_time_partition_infoCodec,
  });
  const check_automatic_maintenance_value = createSqlFunction({
    ...base,
    name: "check_automatic_maintenance_value",
    member: "routine:$extension:pg_partman.check_automatic_maintenance_value(pg_catalog.text)",
    arguments: [nullableCodec(textCodec)] as const,
    result: nullableCodec(booleanCodec),
  });
  const check_control_type = createSqlFunction({
    ...base,
    name: "check_control_type",
    member: "routine:$extension:pg_partman.check_control_type(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [nullableCodec(textCodec), nullableCodec(textCodec), nullableCodec(textCodec)] as const,
    result: check_control_typeCodec,
  });
  const check_default = createSqlFunction({
    ...base,
    name: "check_default",
    member: "routine:$extension:pg_partman.check_default(pg_catalog.bool)",
    arguments: [defaultSqlArgument(nullableCodec(booleanCodec), "p_exact_count")] as const,
    result: check_default_tableCodec,
  });
  const check_epoch_type = createSqlFunction({
    ...base,
    name: "check_epoch_type",
    member: "routine:$extension:pg_partman.check_epoch_type(pg_catalog.text)",
    arguments: [nullableCodec(textCodec)] as const,
    result: nullableCodec(booleanCodec),
  });
  const check_name_length = createSqlFunction({
    ...base,
    name: "check_name_length",
    member: "routine:$extension:pg_partman.check_name_length(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    arguments: [
      nullableCodec(textCodec),
      defaultSqlArgument(nullableCodec(textCodec), "p_suffix"),
      defaultSqlArgument(nullableCodec(booleanCodec), "p_table_partition"),
    ] as const,
    result: nullableCodec(textCodec),
  });
  const check_partition_type = createSqlFunction({
    ...base,
    name: "check_partition_type",
    member: "routine:$extension:pg_partman.check_partition_type(pg_catalog.text)",
    arguments: [nullableCodec(textCodec)] as const,
    result: nullableCodec(booleanCodec),
  });
  const check_subpart_sameconfig = createSqlFunction({
    ...base,
    name: "check_subpart_sameconfig",
    member: "routine:$extension:pg_partman.check_subpart_sameconfig(pg_catalog.text)",
    arguments: [nullableCodec(textCodec)] as const,
    result: check_subpart_sameconfigCodec,
  });
  const check_subpartition_limits = createSqlFunction({
    ...base,
    name: "check_subpartition_limits",
    member: "routine:$extension:pg_partman.check_subpartition_limits(pg_catalog.text,pg_catalog.text)",
    arguments: [nullableCodec(textCodec), nullableCodec(textCodec)] as const,
    result: check_subpartition_limitsCodec,
  });
  const dump_partitioned_table_definition = createSqlFunction({
    ...base,
    name: "dump_partitioned_table_definition",
    member: "routine:$extension:pg_partman.dump_partitioned_table_definition(pg_catalog.text,pg_catalog.bool)",
    arguments: [
      nullableCodec(textCodec),
      defaultSqlArgument(nullableCodec(booleanCodec), "p_ignore_template_table"),
    ] as const,
    result: nullableCodec(textCodec),
  });
  const show_partition_info = createSqlFunction({
    ...base,
    name: "show_partition_info",
    member: "routine:$extension:pg_partman.show_partition_info(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    arguments: [
      nullableCodec(textCodec),
      defaultSqlArgument(nullableCodec(textCodec), "p_partition_interval"),
      defaultSqlArgument(nullableCodec(textCodec), "p_parent_table"),
    ] as const,
    result: show_partition_infoCodec,
  });
  const show_partition_name = createSqlFunction({
    ...base,
    name: "show_partition_name",
    member: "routine:$extension:pg_partman.show_partition_name(pg_catalog.text,pg_catalog.text)",
    arguments: [nullableCodec(textCodec), nullableCodec(textCodec)] as const,
    result: show_partition_nameCodec,
  });
  const show_partitions = createSqlFunction({
    ...base,
    name: "show_partitions",
    member: "routine:$extension:pg_partman.show_partitions(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    arguments: [
      nullableCodec(textCodec),
      defaultSqlArgument(nullableCodec(textCodec), "p_order"),
      defaultSqlArgument(nullableCodec(booleanCodec), "p_include_default"),
    ] as const,
    result: show_partitionsCodec,
  });
  const search = { filter: false, comparison: false, order: false, text: false } as const;
  function arrayValue(element: ExtensionValueSchema): ExtensionValueSchema {
    let nested: ExtensionValueSchema = { kind: "union", variants: [element, { kind: "null" }] };
    const ranks: ExtensionValueSchema[] = [];
    for (let rank = 0; rank < 6; rank++) {
      nested = { kind: "array", items: nested };
      ranks.push(nested);
    }
    return {
      kind: "object",
      properties: {
        dimensions: {
          kind: "array",
          items: {
            kind: "object",
            properties: {
              lowerBound: { kind: "number", integer: true },
              length: { kind: "number", integer: true, minimum: 0 },
            },
          },
        },
        values: { kind: "union", variants: ranks },
      },
    };
  }
  const check_default_tableValue = {
    kind: "object",
    properties: {
      default_table: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      count: { kind: "union", variants: [{ kind: "bigint" }, { kind: "null" }] },
    },
  } as const;
  const check_default_tableTypedCodec = withCodecSqlType(check_default_tableCodec, {
    schema: descriptor.schema,
    name: "check_default_table",
  });
  const check_default_tableTypedArrayCodec = withCodecSqlType(check_default_tableArrayCodec, {
    schema: descriptor.schema,
    name: "check_default_table",
    array: true,
  });
  const part_configValue = {
    kind: "object",
    properties: {
      parent_table: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      control: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      partition_interval: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      partition_type: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      premake: {
        kind: "union",
        variants: [{ kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 }, { kind: "null" }],
      },
      automatic_maintenance: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      template_table: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      retention: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      retention_schema: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      retention_keep_index: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      retention_keep_table: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      epoch: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      constraint_cols: { kind: "union", variants: [arrayValue({ kind: "string" }), { kind: "null" }] },
      optimize_constraint: {
        kind: "union",
        variants: [{ kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 }, { kind: "null" }],
      },
      infinite_time_partitions: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      datetime_string: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      jobmon: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      sub_partition_set_full: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      undo_in_progress: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      inherit_privileges: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      constraint_valid: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      ignore_default_data: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      default_table: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      date_trunc_interval: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      maintenance_order: {
        kind: "union",
        variants: [{ kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 }, { kind: "null" }],
      },
      retention_keep_publication: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      maintenance_last_run: {
        kind: "union",
        variants: [
          { kind: "object", properties: { type: { kind: "string", enum: ["timestamptz"] }, text: { kind: "string" } } },
          { kind: "null" },
        ],
      },
    },
  } as const;
  const part_configTypedCodec = withCodecSqlType(part_configCodec, { schema: descriptor.schema, name: "part_config" });
  const part_configTypedArrayCodec = withCodecSqlType(part_configArrayCodec, {
    schema: descriptor.schema,
    name: "part_config",
    array: true,
  });
  const part_config_subValue = {
    kind: "object",
    properties: {
      sub_parent: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      sub_control: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      sub_partition_interval: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      sub_partition_type: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      sub_premake: {
        kind: "union",
        variants: [{ kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 }, { kind: "null" }],
      },
      sub_automatic_maintenance: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      sub_template_table: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      sub_retention: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      sub_retention_schema: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      sub_retention_keep_index: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      sub_retention_keep_table: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      sub_epoch: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      sub_constraint_cols: { kind: "union", variants: [arrayValue({ kind: "string" }), { kind: "null" }] },
      sub_optimize_constraint: {
        kind: "union",
        variants: [{ kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 }, { kind: "null" }],
      },
      sub_infinite_time_partitions: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      sub_jobmon: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      sub_inherit_privileges: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      sub_constraint_valid: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      sub_ignore_default_data: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      sub_default_table: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
      sub_date_trunc_interval: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      sub_maintenance_order: {
        kind: "union",
        variants: [{ kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 }, { kind: "null" }],
      },
      sub_retention_keep_publication: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
    },
  } as const;
  const part_config_subTypedCodec = withCodecSqlType(part_config_subCodec, {
    schema: descriptor.schema,
    name: "part_config_sub",
  });
  const part_config_subTypedArrayCodec = withCodecSqlType(part_config_subArrayCodec, {
    schema: descriptor.schema,
    name: "part_config_sub",
    array: true,
  });
  const table_privsValue = {
    kind: "object",
    properties: {
      grantor: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      grantee: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      table_schema: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      table_name: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
      privilege_type: { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] },
    },
  } as const;
  const table_privsTypedCodec = withCodecSqlType(table_privsCodec, { schema: descriptor.schema, name: "table_privs" });
  const table_privsTypedArrayCodec = withCodecSqlType(table_privsArrayCodec, {
    schema: descriptor.schema,
    name: "table_privs",
    array: true,
  });
  return bindExtension(descriptor, {
    calculate_time_partition_info,
    calculate_time_partition_infoRows: (alias: string, ...args: Parameters<typeof calculate_time_partition_info>) =>
      extensionRows(calculate_time_partition_info(...args), alias, calculate_time_partition_infoFields, "named"),
    check_automatic_maintenance_value,
    check_control_type,
    check_control_typeRows: (alias: string, ...args: Parameters<typeof check_control_type>) =>
      extensionRows(check_control_type(...args), alias, check_control_typeFields, "named"),
    check_default,
    check_defaultRows: (alias: string, ...args: Parameters<typeof check_default>) =>
      extensionRows(check_default(...args), alias, check_default_tableFields, "named"),
    check_epoch_type,
    check_name_length,
    check_partition_type,
    check_subpart_sameconfig,
    check_subpart_sameconfigRows: (alias: string, ...args: Parameters<typeof check_subpart_sameconfig>) =>
      extensionRows(check_subpart_sameconfig(...args), alias, check_subpart_sameconfigFields, "named"),
    check_subpartition_limits,
    check_subpartition_limitsRows: (alias: string, ...args: Parameters<typeof check_subpartition_limits>) =>
      extensionRows(check_subpartition_limits(...args), alias, check_subpartition_limitsFields, "named"),
    dump_partitioned_table_definition,
    show_partition_info,
    show_partition_infoRows: (alias: string, ...args: Parameters<typeof show_partition_info>) =>
      extensionRows(show_partition_info(...args), alias, show_partition_infoFields, "named"),
    show_partition_name,
    show_partition_nameRows: (alias: string, ...args: Parameters<typeof show_partition_name>) =>
      extensionRows(show_partition_name(...args), alias, show_partition_nameFields, "named"),
    show_partitions,
    show_partitionsRows: (alias: string, ...args: Parameters<typeof show_partitions>) =>
      extensionRows(show_partitions(...args), alias, show_partitionsFields, "named"),
    check_default_tableCodec: check_default_tableTypedCodec,
    check_default_tableArrayCodec: check_default_tableTypedArrayCodec,
    check_default_tableField: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:pg_partman.check_default_table",
        type: "check_default_table",
        codec: check_default_tableTypedCodec,
        value: check_default_tableValue,
        search,
      }),
    check_default_tableArrayField: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:pg_partman._check_default_table",
        type: "check_default_table",
        codec: check_default_tableTypedArrayCodec,
        array: true,
        value: arrayValue(check_default_tableValue),
        search,
      }),
    part_configCodec: part_configTypedCodec,
    part_configArrayCodec: part_configTypedArrayCodec,
    part_configField: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:pg_partman.part_config",
        type: "part_config",
        codec: part_configTypedCodec,
        value: part_configValue,
        search,
      }),
    part_configArrayField: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:pg_partman._part_config",
        type: "part_config",
        codec: part_configTypedArrayCodec,
        array: true,
        value: arrayValue(part_configValue),
        search,
      }),
    part_configRows: (alias: string) =>
      extensionRows(
        checkedExtensionExpression(
          sql`${sql.identifier(descriptor.schema)}.${sql.identifier("part_config")}`,
          part_configTypedCodec,
          [],
          undefined,
          'table:"$extension:pg_partman".part_config',
          "external",
        ),
        alias,
        part_configFields,
        "named",
      ),
    part_config_subCodec: part_config_subTypedCodec,
    part_config_subArrayCodec: part_config_subTypedArrayCodec,
    part_config_subField: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:pg_partman.part_config_sub",
        type: "part_config_sub",
        codec: part_config_subTypedCodec,
        value: part_config_subValue,
        search,
      }),
    part_config_subArrayField: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:pg_partman._part_config_sub",
        type: "part_config_sub",
        codec: part_config_subTypedArrayCodec,
        array: true,
        value: arrayValue(part_config_subValue),
        search,
      }),
    part_config_subRows: (alias: string) =>
      extensionRows(
        checkedExtensionExpression(
          sql`${sql.identifier(descriptor.schema)}.${sql.identifier("part_config_sub")}`,
          part_config_subTypedCodec,
          [],
          undefined,
          'table:"$extension:pg_partman".part_config_sub',
          "external",
        ),
        alias,
        part_config_subFields,
        "named",
      ),
    table_privsCodec: table_privsTypedCodec,
    table_privsArrayCodec: table_privsTypedArrayCodec,
    table_privsField: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:pg_partman.table_privs",
        type: "table_privs",
        codec: table_privsTypedCodec,
        value: table_privsValue,
        search,
      }),
    table_privsArrayField: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:pg_partman._table_privs",
        type: "table_privs",
        codec: table_privsTypedArrayCodec,
        array: true,
        value: arrayValue(table_privsValue),
        search,
      }),
    table_privsRows: (alias: string) =>
      extensionRows(
        checkedExtensionExpression(
          sql`${sql.identifier(descriptor.schema)}.${sql.identifier("table_privs")}`,
          table_privsTypedCodec,
          [],
          undefined,
          'view:"$extension:pg_partman".table_privs',
          "external",
        ),
        alias,
        table_privsFields,
        "named",
      ),
    sql: Object.freeze({
      functions: Object.freeze({
        calculate_time_partition_info,
        check_automatic_maintenance_value,
        check_control_type,
        check_default,
        check_epoch_type,
        check_name_length,
        check_partition_type,
        check_subpart_sameconfig,
        check_subpartition_limits,
        dump_partitioned_table_definition,
        show_partition_info,
        show_partition_name,
        show_partitions,
      }),
      operators: Object.freeze({}),
    }),
  });
}
