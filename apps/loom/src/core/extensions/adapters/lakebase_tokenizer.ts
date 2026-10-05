import * as v from "valibot";
import { sql } from "drizzle-orm";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  arrayCodec,
  compositeCodec,
  createExtensionCodec,
  nullableCodec,
  textCodec,
  withCodecSqlType,
} from "../codecs";
import { dictionaryReference, dictionaryReferenceValidator } from "../dictionary-reference";
import { createExtensionField } from "../fields";
import { extensionRows } from "../rows";
import { checkedExtensionExpression, createSqlFunction } from "../sql";
import type { ExtensionValueSchema } from "../values";

export { dictionaryReference, type DictionaryReference } from "../dictionary-reference";
export type { PostgreSqlArray } from "../codecs";

export const lakebaseTokenizerDigest = "b57e5d3240d67c933ba1a2665c2fd347f72df94f159f16a4d6c7ebeb8e7d7ef8";
export type LakebaseTokenizerDescriptor = ExtensionDescriptor<
  "lakebase_tokenizer",
  { version: "0.1.1"; schema: string }
>;

/** Null removes an option on ALTER; omission leaves an existing option untouched. Native INIT owns combinations. */
export const lakebaseTokenizerOptionsValidator = v.strictObject({
  lowercase: v.optional(v.nullable(v.boolean())),
  normalize: v.optional(v.nullable(v.picklist(["NFC", "NFD", "NFKC", "NFKD", "none"]))),
  englishPossessive: v.optional(v.nullable(v.boolean())),
  stripAccents: v.optional(v.nullable(v.boolean())),
  stopwords: v.optional(v.nullable(v.string())),
  synonyms: v.optional(v.nullable(v.string())),
  stemmer: v.optional(v.nullable(v.literal("english"))),
});
export type LakebaseTokenizerOptions = v.InferOutput<typeof lakebaseTokenizerOptionsValidator>;
export interface LakebaseTokenizerStopword {
  readonly name: string | null;
  readonly word: string | null;
}
export interface LakebaseTokenizerSynonym extends LakebaseTokenizerStopword {
  readonly synonym: string | null;
}

const quote = (name: string) => `"${name.replaceAll('"', '""')}"`;
const dictionaryCodec = createExtensionCodec({
  id: "lakebase_tokenizer:regdictionary:qualified:1",
  sqlType: { schema: "pg_catalog", name: "regdictionary" },
  input: dictionaryReferenceValidator,
  output: dictionaryReferenceValidator,
  transport: "native",
  encode: (reference) => `${quote(reference.schema)}.${quote(reference.name)}`,
  decode: () => {
    throw new Error("Dictionary references are input identities, not OID results");
  },
});
const text = nullableCodec(textCodec);
const stopwordColumns = Object.freeze({ name: text, word: text });
const synonymColumns = Object.freeze({ name: text, word: text, synonym: text });
const stopwordTableColumns = Object.freeze({ name: textCodec, word: textCodec });
const synonymTableColumns = Object.freeze({ name: textCodec, word: textCodec, synonym: textCodec });
const nullableTextValue = { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] } as const;
const stopwordValue = { kind: "object", properties: { name: nullableTextValue, word: nullableTextValue } } as const;
const synonymValue = {
  kind: "object",
  properties: { ...stopwordValue.properties, synonym: nullableTextValue },
} as const;
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
            lowerBound: { kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 },
            length: { kind: "number", integer: true, minimum: 0, maximum: 2147483647 },
          },
        },
      },
      values: { kind: "union", variants: ranks },
    },
  };
}

/** Selected native template and tables only. All token transformations execute in PostgreSQL. */
export function createLakebaseTokenizer_0_1_1<const Descriptor extends LakebaseTokenizerDescriptor>(
  descriptor: Descriptor,
) {
  if (
    descriptor.name !== "lakebase_tokenizer" ||
    descriptor.version !== "0.1.1" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== lakebaseTokenizerDigest
  )
    throw new Error("lakebase_tokenizer 0.1.1 requires its exact verified contract");
  const stopwordType = { schema: descriptor.schema, name: "lakebase_tokenizer_stopwords" };
  const synonymType = { schema: descriptor.schema, name: "lakebase_tokenizer_synonyms" };
  // Table constraints do not constrain stand-alone composite values: attributes and array elements may be NULL.
  const stopword = withCodecSqlType(compositeCodec(stopwordType.name, stopwordColumns), stopwordType);
  const synonym = withCodecSqlType(compositeCodec(synonymType.name, synonymColumns), synonymType);
  const stopwordArray = withCodecSqlType(arrayCodec(stopword), { ...stopwordType, array: true });
  const synonymArray = withCodecSqlType(arrayCodec(synonym), { ...synonymType, array: true });
  const lexemes = nullableCodec(arrayCodec(textCodec));
  const lexize = createSqlFunction({
    schema: "pg_catalog",
    name: "ts_lexize",
    member: 'text search template:"$extension:lakebase_tokenizer".tokenizer_wholeword',
    arguments: [nullableCodec(dictionaryCodec), text] as const,
    result: lexemes,
    authority: "query",
    observability: "external",
    dependencies: [],
  });
  const table = (name: string, codec: typeof stopword | typeof synonym) =>
    checkedExtensionExpression(
      sql`${sql.identifier(descriptor.schema)}.${sql.identifier(name)}`,
      codec,
      [],
      undefined,
      `table:"$extension:lakebase_tokenizer".${name}`,
      "external",
    );
  return bindExtension(descriptor, {
    dictionary: dictionaryReference,
    template: Object.freeze({
      schema: descriptor.schema,
      name: "tokenizer_wholeword",
      member: 'text search template:"$extension:lakebase_tokenizer".tokenizer_wholeword',
      init: "routine:$extension:lakebase_tokenizer.lakebase_tokenizer_wholeword_init(pg_catalog.internal)",
      lexize:
        "routine:$extension:lakebase_tokenizer.lakebase_tokenizer_wholeword_lexize(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    } as const),
    lexize,
    stopwords: (alias: string) =>
      extensionRows(table(stopwordType.name, stopword), alias, stopwordTableColumns, "named"),
    synonyms: (alias: string) => extensionRows(table(synonymType.name, synonym), alias, synonymTableColumns, "named"),
    codecs: Object.freeze({ stopword, synonym, stopwordArray, synonymArray, lexemes }),
    fields: Object.freeze({
      stopword: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:lakebase_tokenizer.lakebase_tokenizer_stopwords",
          type: stopwordType.name,
          codec: stopword,
          value: stopwordValue,
          search,
        }),
      synonym: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:lakebase_tokenizer.lakebase_tokenizer_synonyms",
          type: synonymType.name,
          codec: synonym,
          value: synonymValue,
          search,
        }),
      stopwordArray: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:lakebase_tokenizer._lakebase_tokenizer_stopwords",
          type: stopwordType.name,
          array: true,
          codec: stopwordArray,
          value: arrayValue(stopwordValue),
          search,
        }),
      synonymArray: () =>
        createExtensionField({
          extension: descriptor,
          member: "type:$extension:lakebase_tokenizer._lakebase_tokenizer_synonyms",
          type: synonymType.name,
          array: true,
          codec: synonymArray,
          value: arrayValue(synonymValue),
          search,
        }),
    }),
    sql: Object.freeze({
      functions: Object.freeze({ ts_lexize: lexize }),
      operators: Object.freeze({}),
      types: Object.freeze({
        lakebase_tokenizer_stopwords: stopword,
        lakebase_tokenizer_synonyms: synonym,
        _lakebase_tokenizer_stopwords: stopwordArray,
        _lakebase_tokenizer_synonyms: synonymArray,
      }),
    }),
  });
}
