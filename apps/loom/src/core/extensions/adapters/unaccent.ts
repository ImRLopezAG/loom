import type { SQL } from "drizzle-orm";
import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { createExtensionCodec, nullableCodec, textCodec } from "../codecs";
import { createSqlFunction, type ExtensionSqlInput } from "../sql";

const dictionaryBrand: unique symbol = Symbol("loom:unaccent:dictionary");
const dictionaryReferences = new WeakSet<object>();

/** A portable dictionary identity; PostgreSQL resolves it on the invocation connection. */
export interface DictionaryReference {
  readonly schema: string;
  readonly name: string;
  readonly [dictionaryBrand]: true;
}

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { ignoreBOM: true });
const identifier = v.pipe(
  v.string(),
  v.check((value) => {
    const bytes = encoder.encode(value);
    return value.length > 0 && !value.includes("\u0000") && bytes.length <= 63 && decoder.decode(bytes) === value;
  }, "Expected a lossless PostgreSQL identifier of 1–63 UTF-8 bytes"),
);
const qualifiedName = v.strictObject({ schema: identifier, name: identifier });
const referenceSchema = v.custom<DictionaryReference>(
  (value) => value instanceof Object && dictionaryReferences.has(value),
  "Expected a factory-created qualified dictionary reference",
);
const nullableReference = v.nullable(referenceSchema);

/** Names are independently quoted and bound as data, never interpreted as raw SQL or fixture OIDs. */
export function dictionaryReference(reference: {
  readonly schema: string;
  readonly name: string;
}): DictionaryReference {
  const names = v.parse(qualifiedName, reference);
  const result = Object.freeze({ ...names, [dictionaryBrand]: true as const });
  dictionaryReferences.add(result);
  return result;
}

const quoteName = (name: string) => `"${name.replaceAll('"', '""')}"`;
const dictionaryCodec = createExtensionCodec({
  id: "pg:regdictionary:qualified:1",
  sqlType: { schema: "pg_catalog", name: "regdictionary" },
  input: referenceSchema,
  output: referenceSchema,
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
