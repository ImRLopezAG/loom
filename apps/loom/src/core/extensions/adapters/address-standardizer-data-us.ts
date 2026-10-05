import { sql } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  arrayCodec,
  booleanCodec,
  compositeCodec,
  integerCodec,
  nullableCodec,
  textCodec,
  withCodecSqlType,
  type ExtensionCodec,
} from "../codecs";
import { int4Codec } from "../native-codecs";
import { createExtensionField, type ExtensionValueSchema } from "../fields";
import { checkedExtensionExpression } from "../sql";
import type { AddressStandardizerSources } from "./address-standardizer-codecs";

export const ADDRESS_STANDARDIZER_DATA_US_DIGEST = "063cb37742a0baf3dd885cb96255db38daf06b13d3b75fd7232b81822a7f01d0";
const lexFields = {
  id: int4Codec,
  seq: nullableCodec(int4Codec),
  word: nullableCodec(textCodec),
  stdword: nullableCodec(textCodec),
  token: nullableCodec(int4Codec),
  is_custom: booleanCodec,
} as const;
const rulesFields = { id: int4Codec, rule: nullableCodec(textCodec), is_custom: booleanCodec } as const;
const sequenceFields = { last_value: integerCodec, log_cnt: integerCodec, is_called: booleanCodec } as const;
// Composite/array text I/O uses PostgreSQL's boolout t/f, rather than JS boolean strings.
const recordBooleanCodec = Object.freeze({
  ...booleanCodec,
  id: "pg:bool:record-text:1",
  transport: "text" as const,
  encode: (value: boolean) => (booleanCodec.encode(value) ? "t" : "f"),
});
const lexCompositeFields = {
  ...lexFields,
  id: nullableCodec(int4Codec),
  is_custom: nullableCodec(recordBooleanCodec),
} as const;
const rulesCompositeFields = {
  ...rulesFields,
  id: nullableCodec(int4Codec),
  is_custom: nullableCodec(recordBooleanCodec),
} as const;
const intValue: ExtensionValueSchema = { kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 };
const nullable = (value: ExtensionValueSchema): ExtensionValueSchema => ({
  kind: "union",
  variants: [value, { kind: "null" }],
});
const lexValue: ExtensionValueSchema = {
  kind: "object",
  properties: {
    id: nullable(intValue),
    seq: nullable(intValue),
    word: nullable({ kind: "string" }),
    stdword: nullable({ kind: "string" }),
    token: nullable(intValue),
    is_custom: nullable({ kind: "boolean" }),
  },
};
const rulesValue: ExtensionValueSchema = {
  kind: "object",
  properties: { id: nullable(intValue), rule: nullable({ kind: "string" }), is_custom: nullable({ kind: "boolean" }) },
};
function arrayValue(value: ExtensionValueSchema): ExtensionValueSchema {
  let nested = nullable(value);
  const variants: ExtensionValueSchema[] = [];
  for (let rank = 0; rank < 6; rank++) {
    nested = { kind: "array", items: nested };
    variants.push(nested);
  }
  return {
    kind: "object",
    properties: {
      dimensions: {
        kind: "array",
        items: {
          kind: "object",
          properties: {
            lowerBound: intValue,
            length: { kind: "number", integer: true, minimum: 0, maximum: 2147483647 },
          },
        },
      },
      values: { kind: "union", variants },
    },
  };
}
type Fields = Readonly<Record<string, ExtensionCodec<never, unknown>>>;
type Descriptor = ExtensionDescriptor<
  "address_standardizer_data_us",
  { readonly version: "3.6.4"; readonly schema: string }
>;

/** Data-only native extension. Installation owns tables, serials, defaults, indexes and seeds. */
export function createAddressStandardizerDataUs_3_6_4<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "address_standardizer_data_us" ||
    descriptor.version !== "3.6.4" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== ADDRESS_STANDARDIZER_DATA_US_DIGEST
  )
    throw new Error("address_standardizer_data_us 3.6.4 requires its exact verified contract");
  function relation<const RowFields extends Fields>(name: string, fields: RowFields, kind: "table" | "sequence") {
    const member = `${kind}:"$extension:address_standardizer_data_us".${name}`;
    const dependencies = kind === "table" ? [`${descriptor.schema}.${name}`] : [];
    const observability = kind === "table" ? "tables" : "external";
    return Object.freeze({
      member,
      relation: Object.freeze({ schema: descriptor.schema, name }),
      fields,
      rows(alias: string) {
        const columns = Object.fromEntries(
          Object.entries(fields).map(([column, codec]) => [
            column,
            checkedExtensionExpression(
              sql`${sql.identifier(alias)}.${sql.identifier(column)}`,
              codec,
              dependencies,
              undefined,
              member,
              observability,
            ),
          ]),
        );
        return {
          from: sql`${sql.identifier(descriptor.schema)}.${sql.identifier(name)} as ${sql.identifier(alias)}`,
          // SAFETY: every mapped key is decoded with the same captured column codec.
          columns: columns as {
            readonly [Key in keyof RowFields]: ReturnType<typeof checkedExtensionExpression<RowFields[Key]>>;
          },
        };
      },
    });
  }
  function table<const RowFields extends Fields, Value>(
    name: string,
    fields: RowFields,
    rowCodec: ExtensionCodec<Value, Value>,
    value: ExtensionValueSchema,
  ) {
    const codec = withCodecSqlType(rowCodec, { schema: descriptor.schema, name });
    const array = withCodecSqlType(arrayCodec(codec), { schema: descriptor.schema, name, array: true });
    const search = { filter: false, comparison: false, order: false, text: false } as const;
    return Object.freeze({
      ...relation(name, fields, "table"),
      codec,
      arrayCodec: array,
      field: () =>
        createExtensionField({
          extension: descriptor,
          member: `type:$extension:address_standardizer_data_us.${name}`,
          type: name,
          codec,
          value,
          search,
        }),
      arrayField: () =>
        createExtensionField({
          extension: descriptor,
          member: `type:$extension:address_standardizer_data_us._${name}`,
          type: name,
          codec: array,
          value: arrayValue(value),
          array: true,
          search,
        }),
    });
  }
  const tables = Object.freeze({
    us_lex: table(
      "us_lex",
      lexFields,
      compositeCodec("address_standardizer_data_us:us_lex", lexCompositeFields),
      lexValue,
    ),
    us_gaz: table(
      "us_gaz",
      lexFields,
      compositeCodec("address_standardizer_data_us:us_gaz", lexCompositeFields),
      lexValue,
    ),
    us_rules: table(
      "us_rules",
      rulesFields,
      compositeCodec("address_standardizer_data_us:us_rules", rulesCompositeFields),
      rulesValue,
    ),
  });
  const sequences = Object.freeze({
    us_lex_id_seq: relation("us_lex_id_seq", sequenceFields, "sequence"),
    us_gaz_id_seq: relation("us_gaz_id_seq", sequenceFields, "sequence"),
    us_rules_id_seq: relation("us_rules_id_seq", sequenceFields, "sequence"),
  });
  const sources = Object.freeze({
    lex: tables.us_lex.relation,
    gaz: tables.us_gaz.relation,
    rules: tables.us_rules.relation,
  }) satisfies AddressStandardizerSources;
  const types = Object.freeze({
    "type:$extension:address_standardizer_data_us.us_lex": tables.us_lex.codec,
    "type:$extension:address_standardizer_data_us._us_lex": tables.us_lex.arrayCodec,
    "type:$extension:address_standardizer_data_us.us_gaz": tables.us_gaz.codec,
    "type:$extension:address_standardizer_data_us._us_gaz": tables.us_gaz.arrayCodec,
    "type:$extension:address_standardizer_data_us.us_rules": tables.us_rules.codec,
    "type:$extension:address_standardizer_data_us._us_rules": tables.us_rules.arrayCodec,
  });
  const declarations = Object.freeze({
    installation: Object.freeze({
      extension: descriptor.name,
      version: descriptor.version,
      schema: descriptor.schema,
      digest: ADDRESS_STANDARDIZER_DATA_US_DIGEST,
    }),
    tables: Object.freeze(
      Object.values(tables).map((entry) =>
        Object.freeze({
          member: entry.member,
          relation: entry.relation,
          primaryKey: `pk_${entry.relation.name}`,
          index: Object.freeze({
            name: `pk_${entry.relation.name}`,
            method: "btree",
            columns: Object.freeze(["id"]),
            unique: true,
          }),
          notNull: Object.freeze(["id", "is_custom"]),
          defaults: Object.freeze({ id: `${entry.relation.name}_id_seq`, is_custom: true }),
          seedDumpFilter: "WHERE is_custom",
        }),
      ),
    ),
  });
  return bindExtension(descriptor, {
    tables,
    sequences,
    sources,
    declarations,
    sql: Object.freeze({ functions: Object.freeze({}), operators: Object.freeze({}), types }),
  });
}
export type AddressStandardizerDataUsApi = ReturnType<typeof createAddressStandardizerDataUs_3_6_4>;
