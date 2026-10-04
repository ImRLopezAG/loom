import { sql } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { integerCodec, nullableCodec, textCodec, withCodecSqlType } from "../codecs";
import { createExtensionField } from "../fields";
import { extensionRows } from "../rows";
import { checkedExtensionExpression, createSqlFunction, statefulSqlMember } from "../sql";
import type { ExtensionValueSchema } from "../values";
import {
  hypopgOidCodec,
  hypopgIndexCodec,
  hypopgIndexFields,
  hypopgHiddenOidFields,
  hypopgListCodec,
  hypopgListArrayCodec,
  hypopgHiddenCodec,
  hypopgHiddenArrayCodec,
  hypopgListFields,
  hypopgHiddenFields,
} from "./hypopg-codecs";
export type { HypopgCreatedIndex, HypopgIndex, HypopgListedIndex, HypopgHiddenIndex } from "./hypopg-codecs";

const digest = "cba16a038628eb85dd40262f5d657ecdb01f755a3bc1314e24098278ea441fff";
const nullableText = { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] } as const;
const listValue = {
  kind: "object",
  properties: {
    indexrelid: {
      kind: "union",
      variants: [{ kind: "number", integer: true, minimum: 0, maximum: 4294967295 }, { kind: "null" }],
    },
    index_name: nullableText,
    schema_name: nullableText,
    table_name: nullableText,
    am_name: nullableText,
  },
} as const;
const hiddenValue = {
  kind: "object",
  properties: {
    ...listValue.properties,
    is_hypo: { kind: "union", variants: [{ kind: "boolean" }, { kind: "null" }] },
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

/** HypoPG state belongs to the current backend, not a table-revision live query. */
export function createHypopg_1_4_3<
  const Descriptor extends ExtensionDescriptor<"hypopg", { version: "1.4.3"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "hypopg" ||
    descriptor.version !== "1.4.3" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("hypopg 1.4.3 requires its exact verified contract");
  const base = { schema: descriptor.schema, dependencies: [], observability: "session", authority: "query" } as const;
  const indexes = createSqlFunction({
    ...base,
    name: "hypopg",
    member: "routine:$extension:hypopg.hypopg()",
    arguments: [] as const,
    result: hypopgIndexCodec,
  });
  const hiddenIndexes = createSqlFunction({
    ...base,
    name: "hypopg_hidden_indexes",
    member: "routine:$extension:hypopg.hypopg_hidden_indexes()",
    arguments: [] as const,
    result: hypopgOidCodec,
  });
  const getIndexdef = createSqlFunction({
    ...base,
    name: "hypopg_get_indexdef",
    member: "routine:$extension:hypopg.hypopg_get_indexdef(pg_catalog.oid)",
    arguments: [nullableCodec(hypopgOidCodec)] as const,
    result: nullableCodec(textCodec),
  });
  const relationSize = createSqlFunction({
    ...base,
    name: "hypopg_relation_size",
    member: "routine:$extension:hypopg.hypopg_relation_size(pg_catalog.oid)",
    arguments: [nullableCodec(hypopgOidCodec)] as const,
    result: nullableCodec(integerCodec),
  });
  const listCodec = withCodecSqlType(hypopgListCodec, { schema: descriptor.schema, name: "hypopg_list_indexes" });
  const hiddenCodec = withCodecSqlType(hypopgHiddenCodec, { schema: descriptor.schema, name: "hypopg_hidden_indexes" });
  const listArrayCodec = withCodecSqlType(hypopgListArrayCodec, {
    schema: descriptor.schema,
    name: "hypopg_list_indexes",
    array: true,
  });
  const hiddenArrayCodec = withCodecSqlType(hypopgHiddenArrayCodec, {
    schema: descriptor.schema,
    name: "hypopg_hidden_indexes",
    array: true,
  });
  const search = { filter: false, comparison: false, order: false, text: false } as const;
  return bindExtension(descriptor, {
    indexes,
    hiddenIndexes,
    getIndexdef,
    relationSize,
    indexRows: (alias: string) => extensionRows(indexes(), alias, hypopgIndexFields, "named"),
    hiddenIndexRows: (alias: string) => extensionRows(hiddenIndexes(), alias, hypopgHiddenOidFields, "named"),
    listView: (alias: string) =>
      extensionRows(
        checkedExtensionExpression(
          sql`${sql.identifier(descriptor.schema)}.${sql.identifier("hypopg_list_indexes")}`,
          listCodec,
          [],
          undefined,
          'view:"$extension:hypopg".hypopg_list_indexes',
          "session",
        ),
        alias,
        hypopgListFields,
        "named",
      ),
    hiddenView: (alias: string) =>
      extensionRows(
        checkedExtensionExpression(
          sql`${sql.identifier(descriptor.schema)}.${sql.identifier("hypopg_hidden_indexes")}`,
          hiddenCodec,
          [],
          undefined,
          'view:"$extension:hypopg".hypopg_hidden_indexes',
          "session",
        ),
        alias,
        hypopgHiddenFields,
        "named",
      ),
    listCodec,
    hiddenCodec,
    listArrayCodec,
    hiddenArrayCodec,
    listField: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:hypopg.hypopg_list_indexes",
        type: "hypopg_list_indexes",
        codec: listCodec,
        value: listValue,
        search,
      }),
    hiddenField: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:hypopg.hypopg_hidden_indexes",
        type: "hypopg_hidden_indexes",
        codec: hiddenCodec,
        value: hiddenValue,
        search,
      }),
    listArrayField: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:hypopg._hypopg_list_indexes",
        type: "hypopg_list_indexes",
        codec: listArrayCodec,
        array: true,
        value: arrayValue(listValue),
        search,
      }),
    hiddenArrayField: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:hypopg._hypopg_hidden_indexes",
        type: "hypopg_hidden_indexes",
        codec: hiddenArrayCodec,
        array: true,
        value: arrayValue(hiddenValue),
        search,
      }),
    createIndex: statefulSqlMember("routine:$extension:hypopg.hypopg_create_index(pg_catalog.text)", "session"),
    dropIndex: statefulSqlMember("routine:$extension:hypopg.hypopg_drop_index(pg_catalog.oid)", "session"),
    hideIndex: statefulSqlMember("routine:$extension:hypopg.hypopg_hide_index(pg_catalog.oid)", "session"),
    unhideIndex: statefulSqlMember("routine:$extension:hypopg.hypopg_unhide_index(pg_catalog.oid)", "session"),
    reset: statefulSqlMember("routine:$extension:hypopg.hypopg_reset()", "session"),
    resetIndex: statefulSqlMember("routine:$extension:hypopg.hypopg_reset_index()", "session"),
    unhideAllIndexes: statefulSqlMember("routine:$extension:hypopg.hypopg_unhide_all_indexes()", "session"),
    sql: Object.freeze({
      functions: Object.freeze({
        hypopg: indexes,
        hypopg_hidden_indexes: hiddenIndexes,
        hypopg_get_indexdef: getIndexdef,
        hypopg_relation_size: relationSize,
      }),
      operators: Object.freeze({}),
    }),
  });
}
