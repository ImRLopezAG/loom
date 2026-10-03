import type { SQL } from "drizzle-orm";
import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { createExtensionCodec, nullableCodec, textCodec } from "../codecs";
import { createSqlFunction, type ExtensionSqlInput } from "../sql";

import { dictionaryReference, dictionaryReferenceValidator, type DictionaryReference } from "../dictionary-reference";
export { dictionaryReference, type DictionaryReference } from "../dictionary-reference";
const nullableReference = v.nullable(dictionaryReferenceValidator);

const quoteName = (name: string) => `"${name.replaceAll('"', '""')}"`;
const dictionaryCodec = createExtensionCodec({
  id: "pg:regdictionary:qualified:1",
  sqlType: { schema: "pg_catalog", name: "regdictionary" },
  input: dictionaryReferenceValidator,
  output: dictionaryReferenceValidator,
  transport: "native",
  encode: (reference) => `${quoteName(reference.schema)}.${quoteName(reference.name)}`,
  decode: () => {
    throw new Error("Qualified dictionary references are input identities, not raw OID results");
  },
});
const text = nullableCodec(textCodec);
type TextInput = ExtensionSqlInput<typeof text>;

/** Native rule processing may expand or delete text; mutable dictionary/rule state prevents automatic live queries. */
export function createUnaccent_1_1<
  const Descriptor extends ExtensionDescriptor<"unaccent", { version: "1.1"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "unaccent" ||
    descriptor.version !== "1.1" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== "f983b4bfaa4c974c4ae2eba548249eb86d31d86376d019898b070ff66f9832dd"
  )
    throw new Error("unaccent 1.1 requires its exact verified contract");
  const base = { schema: descriptor.schema, dependencies: [], observability: "external", authority: "query" } as const;
  const implicit = createSqlFunction({
    ...base,
    name: "unaccent",
    member: "routine:$extension:unaccent.unaccent(pg_catalog.text)",
    arguments: [text] as const,
    result: text,
  });
  const explicit = createSqlFunction({
    ...base,
    name: "unaccent",
    member: "routine:$extension:unaccent.unaccent(pg_catalog.regdictionary,pg_catalog.text)",
    arguments: [nullableCodec(dictionaryCodec), text] as const,
    result: text,
  });
  function unaccent(value: TextInput): SQL<string | null>;
  function unaccent(dictionary: DictionaryReference | null, value: TextInput): SQL<string | null>;
  function unaccent(...values: [TextInput] | [DictionaryReference | null, TextInput]): SQL<string | null> {
    if (values.length === 1) return implicit(...values);
    // Generic SQL helpers accept SQLWrapper arguments; dictionary identities deliberately do not.
    v.parse(nullableReference, values[0]);
    return explicit(...values);
  }
  return bindExtension(descriptor, {
    dictionary: dictionaryReference({ schema: descriptor.schema, name: "unaccent" }),
    unaccent,
    sql: Object.freeze({ functions: Object.freeze({ unaccent }), operators: Object.freeze({}) }),
  });
}
