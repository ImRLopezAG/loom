import { sql } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { booleanCodec, nullableCodec, textCodec, withCodecSqlType } from "../codecs";
import { createExtensionField } from "../fields";
import { extensionRows } from "../rows";
import { checkedExtensionExpression, createSqlFunction, statefulSqlMember } from "../sql";
import type { ExtensionValueSchema } from "../values";
import { relationCodec, relationDependency, resolveRelationName, type RelationInput } from "./pgstattuple-codecs";
import {
  pgRepackNameCodec,
  pgRepackOidCodec,
  pgRepackPrimaryKeyArrayCodec,
  pgRepackPrimaryKeyCodec,
  pgRepackPrimaryKeyFields,
  pgRepackRegclassArrayCodec,
  pgRepackTableArrayCodec,
  pgRepackTableCodec,
  pgRepackTableFields,
} from "./pg_repack-codecs";

export type { PgRepackPrimaryKey, PgRepackTable } from "./pg_repack-codecs";
export type { RelationInput, RelationName } from "./pgstattuple-codecs";

export const pgRepackDigest = "9199927c1639ebed2a4403def3b2d81e78076865f20b9ad4b78e91c6e1bb5e32";
/** Captured objects always live in schema `repack`; CREATE EXTENSION does not relocate them. */
export const pgRepackSqlSchema = "repack";

const nullableText = { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] } as const;
const nullableOid = {
  kind: "union",
  variants: [{ kind: "number", integer: true, minimum: 0, maximum: 4294967295 }, { kind: "null" }],
} as const;
const primaryKeyValue = {
  kind: "object",
  properties: { indrelid: nullableOid, indexrelid: nullableOid },
} as const;
const tableValue = {
  kind: "object",
  properties: {
    relname: nullableText,
    relid: nullableOid,
    reltoastrelid: nullableOid,
    reltoastidxid: nullableOid,
    schemaname: nullableText,
    pkid: nullableOid,
    ckid: nullableOid,
    create_pktype: nullableText,
    create_log: nullableText,
    create_trigger: nullableText,
    enable_trigger: nullableText,
    create_table: nullableText,
    tablespace_orig: nullableText,
    copy_data: nullableText,
    alter_col_storage: nullableText,
    drop_columns: nullableText,
    delete_log: nullableText,
    lock_table: nullableText,
    ckey: nullableText,
    sql_peek: nullableText,
    sql_insert: nullableText,
    sql_delete: nullableText,
    sql_update: nullableText,
    sql_pop: nullableText,
  },
} as const;
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

/** Catalog SQL helpers only. Apply/swap/drop and the client binary stay on the operator session. */
export function createPgRepack_1_5_2<
  const Descriptor extends ExtensionDescriptor<"pg_repack", { version: "1.5.2"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "pg_repack" ||
    descriptor.version !== "1.5.2" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== pgRepackDigest
  )
    throw new Error("pg_repack 1.5.2 requires its exact verified contract");
  const base = {
    schema: pgRepackSqlSchema,
    dependencies: [],
    observability: "external",
    authority: "query",
  } as const;
  const libraryVersion = createSqlFunction({
    ...base,
    name: "version",
    member: "routine:repack.version()",
    arguments: [] as const,
    result: textCodec,
  });
  const sqlVersion = createSqlFunction({
    ...base,
    name: "version_sql",
    member: "routine:repack.version_sql()",
    arguments: [] as const,
    result: textCodec,
  });
  const oid2text = createSqlFunction({
    ...base,
    name: "oid2text",
    member: "routine:repack.oid2text(pg_catalog.oid)",
    arguments: [pgRepackOidCodec] as const,
    result: textCodec,
  });
  const getIndexColumns = createSqlFunction({
    ...base,
    name: "get_index_columns",
    member: "routine:repack.get_index_columns(pg_catalog.oid)",
    arguments: [pgRepackOidCodec] as const,
    result: textCodec,
  });
  const getOrderBy = createSqlFunction({
    ...base,
    name: "get_order_by",
    member: "routine:repack.get_order_by(pg_catalog.oid,pg_catalog.oid)",
    arguments: [pgRepackOidCodec, pgRepackOidCodec] as const,
    result: textCodec,
  });
  const getCreateIndexType = createSqlFunction({
    ...base,
    name: "get_create_index_type",
    member: "routine:repack.get_create_index_type(pg_catalog.oid,pg_catalog.name)",
    arguments: [pgRepackOidCodec, pgRepackNameCodec] as const,
    result: textCodec,
  });
  const getCreateTrigger = createSqlFunction({
    ...base,
    name: "get_create_trigger",
    member: "routine:repack.get_create_trigger(pg_catalog.oid,pg_catalog.oid)",
    arguments: [pgRepackOidCodec, pgRepackOidCodec] as const,
    result: textCodec,
  });
  const getEnableTrigger = createSqlFunction({
    ...base,
    name: "get_enable_trigger",
    member: "routine:repack.get_enable_trigger(pg_catalog.oid)",
    arguments: [pgRepackOidCodec] as const,
    result: textCodec,
  });
  const getAssign = createSqlFunction({
    ...base,
    name: "get_assign",
    member: "routine:repack.get_assign(pg_catalog.oid,pg_catalog.text)",
    arguments: [pgRepackOidCodec, textCodec] as const,
    result: textCodec,
  });
  const getComparePkey = createSqlFunction({
    ...base,
    name: "get_compare_pkey",
    member: "routine:repack.get_compare_pkey(pg_catalog.oid,pg_catalog.text)",
    arguments: [pgRepackOidCodec, textCodec] as const,
    result: textCodec,
  });
  const getColumnsForCreateAs = createSqlFunction({
    ...base,
    name: "get_columns_for_create_as",
    member: "routine:repack.get_columns_for_create_as(pg_catalog.oid)",
    arguments: [pgRepackOidCodec] as const,
    result: textCodec,
  });
  const getDropColumns = createSqlFunction({
    ...base,
    name: "get_drop_columns",
    member: "routine:repack.get_drop_columns(pg_catalog.oid,pg_catalog.text)",
    arguments: [pgRepackOidCodec, textCodec] as const,
    result: nullableCodec(textCodec),
  });
  const getStorageParam = createSqlFunction({
    ...base,
    name: "get_storage_param",
    member: "routine:repack.get_storage_param(pg_catalog.oid)",
    arguments: [pgRepackOidCodec] as const,
    result: textCodec,
  });
  const getAlterColStorage = createSqlFunction({
    ...base,
    name: "get_alter_col_storage",
    member: "routine:repack.get_alter_col_storage(pg_catalog.oid)",
    arguments: [pgRepackOidCodec] as const,
    result: nullableCodec(textCodec),
  });
  const getTableAndInheritors = (relation: RelationInput) => {
    const resolved = resolveRelationName(relation);
    return createSqlFunction({
      ...base,
      name: "get_table_and_inheritors",
      member: "routine:repack.get_table_and_inheritors(pg_catalog.regclass)",
      arguments: [relationCodec] as const,
      result: pgRepackRegclassArrayCodec,
      dependencies: [relationDependency(resolved)],
    })(resolved);
  };
  const conflictedTriggers = createSqlFunction({
    ...base,
    name: "conflicted_triggers",
    member: "routine:repack.conflicted_triggers(pg_catalog.oid)",
    arguments: [pgRepackOidCodec] as const,
    result: pgRepackNameCodec,
  });
  const repackIndexdef = createSqlFunction({
    ...base,
    name: "repack_indexdef",
    member: "routine:repack.repack_indexdef(pg_catalog.oid,pg_catalog.oid,pg_catalog.name,pg_catalog.bool)",
    arguments: [
      nullableCodec(pgRepackOidCodec),
      nullableCodec(pgRepackOidCodec),
      nullableCodec(pgRepackNameCodec),
      nullableCodec(booleanCodec),
    ] as const,
    result: nullableCodec(textCodec),
  });
  const primaryKeysCodec = withCodecSqlType(pgRepackPrimaryKeyCodec, { schema: pgRepackSqlSchema, name: "primary_keys" });
  const tablesCodec = withCodecSqlType(pgRepackTableCodec, { schema: pgRepackSqlSchema, name: "tables" });
  const primaryKeysArrayCodec = withCodecSqlType(pgRepackPrimaryKeyArrayCodec, {
    schema: pgRepackSqlSchema,
    name: "primary_keys",
    array: true,
  });
  const tablesArrayCodec = withCodecSqlType(pgRepackTableArrayCodec, {
    schema: pgRepackSqlSchema,
    name: "tables",
    array: true,
  });
  const search = { filter: false, comparison: false, order: false, text: false } as const;
  return bindExtension(descriptor, {
    libraryVersion,
    sqlVersion,
    oid2text,
    getIndexColumns,
    getOrderBy,
    getCreateIndexType,
    getCreateTrigger,
    getEnableTrigger,
    getAssign,
    getComparePkey,
    getColumnsForCreateAs,
    getDropColumns,
    getStorageParam,
    getAlterColStorage,
    getTableAndInheritors,
    conflictedTriggers,
    repackIndexdef,
    primaryKeys: (alias: string) =>
      extensionRows(
        checkedExtensionExpression(
          sql`${sql.identifier(pgRepackSqlSchema)}.${sql.identifier("primary_keys")}`,
          primaryKeysCodec,
          [],
          undefined,
          "view:repack.primary_keys",
          "external",
        ),
        alias,
        pgRepackPrimaryKeyFields,
        "named",
      ),
    tables: (alias: string) =>
      extensionRows(
        checkedExtensionExpression(
          sql`${sql.identifier(pgRepackSqlSchema)}.${sql.identifier("tables")}`,
          tablesCodec,
          [],
          undefined,
          "view:repack.tables",
          "external",
        ),
        alias,
        pgRepackTableFields,
        "named",
      ),
    primaryKeysCodec,
    tablesCodec,
    primaryKeysArrayCodec,
    tablesArrayCodec,
    primaryKeyField: () =>
      createExtensionField({
        extension: { ...descriptor, schema: pgRepackSqlSchema },
        member: "type:repack.primary_keys",
        type: "primary_keys",
        codec: primaryKeysCodec,
        value: primaryKeyValue,
        search,
      }),
    tableField: () =>
      createExtensionField({
        extension: { ...descriptor, schema: pgRepackSqlSchema },
        member: "type:repack.tables",
        type: "tables",
        codec: tablesCodec,
        value: tableValue,
        search,
      }),
    primaryKeyArrayField: () =>
      createExtensionField({
        extension: { ...descriptor, schema: pgRepackSqlSchema },
        member: "type:repack._primary_keys",
        type: "primary_keys",
        codec: primaryKeysArrayCodec,
        array: true,
        value: arrayValue(primaryKeyValue),
        search,
      }),
    tableArrayField: () =>
      createExtensionField({
        extension: { ...descriptor, schema: pgRepackSqlSchema },
        member: "type:repack._tables",
        type: "tables",
        codec: tablesArrayCodec,
        array: true,
        value: arrayValue(tableValue),
        search,
      }),
    createIndexType: statefulSqlMember("routine:repack.create_index_type(pg_catalog.oid,pg_catalog.oid)", "operator"),
    createLogTable: statefulSqlMember("routine:repack.create_log_table(pg_catalog.oid)", "operator"),
    createTable: statefulSqlMember("routine:repack.create_table(pg_catalog.oid,pg_catalog.name)", "operator"),
    disableAutovacuum: statefulSqlMember("routine:repack.disable_autovacuum(pg_catalog.regclass)", "operator"),
    repackApply: statefulSqlMember(
      "routine:repack.repack_apply(pg_catalog.cstring,pg_catalog.cstring,pg_catalog.cstring,pg_catalog.cstring,pg_catalog.cstring,pg_catalog.int4)",
      "operator",
    ),
    repackDrop: statefulSqlMember("routine:repack.repack_drop(pg_catalog.oid,pg_catalog.int4)", "operator"),
    repackIndexSwap: statefulSqlMember("routine:repack.repack_index_swap(pg_catalog.oid)", "operator"),
    repackSwap: statefulSqlMember("routine:repack.repack_swap(pg_catalog.oid)", "operator"),
    sql: Object.freeze({
      functions: Object.freeze({
        version: libraryVersion,
        version_sql: sqlVersion,
        oid2text,
        get_index_columns: getIndexColumns,
        get_order_by: getOrderBy,
        get_create_index_type: getCreateIndexType,
        get_create_trigger: getCreateTrigger,
        get_enable_trigger: getEnableTrigger,
        get_assign: getAssign,
        get_compare_pkey: getComparePkey,
        get_columns_for_create_as: getColumnsForCreateAs,
        get_drop_columns: getDropColumns,
        get_storage_param: getStorageParam,
        get_alter_col_storage: getAlterColStorage,
        get_table_and_inheritors: getTableAndInheritors,
        conflicted_triggers: conflictedTriggers,
        repack_indexdef: repackIndexdef,
      }),
      operators: Object.freeze({}),
    }),
  });
}
