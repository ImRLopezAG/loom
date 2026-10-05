import type { ExtensionDescriptor } from "../bindings";
import type { CodecInput, ExtensionCodec } from "../codecs";
import { createExtensionField } from "../fields";
import { Field } from "../../schema/fields";
import { registerExtensionStorageCheck, type ExtensionValueSchema } from "../values";
import { anonCompositeCodecs, type AnonCompositeName } from "./anon-codecs";

const text = { kind: "string" } as const;
const integer = { kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 } as const;
const oid = { kind: "number", integer: true, minimum: 0, maximum: 4294967295 } as const;
const boolean = { kind: "boolean" } as const;
const nullable = (value: ExtensionValueSchema): ExtensionValueSchema => ({
  kind: "union",
  variants: [value, { kind: "null" }],
});
function arrayValue(element: ExtensionValueSchema): ExtensionValueSchema {
  let nested = nullable(element);
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
const dictionary = { kind: "object", properties: { oid: integer, val: nullable(text) } } as const;
const maskingRule = {
  kind: "object",
  properties: {
    attrelid: nullable(oid),
    attnum: nullable(integer),
    relnamespace: nullable(text),
    relname: nullable(text),
    attname: nullable(text),
    format_type: nullable(text),
    col_description: nullable(text),
    masking_function: nullable(text),
    masking_value: nullable(text),
    priority: nullable(integer),
    masking_filter: nullable(text),
    trusted_schema: nullable(boolean),
  },
} as const;
const values = {
  address: dictionary,
  city: dictionary,
  company: dictionary,
  country: dictionary,
  email: dictionary,
  first_name: dictionary,
  iban: dictionary,
  identifier: { kind: "object", properties: { lang: text, attname: text, fk_identifiers_category: nullable(text) } },
  identifiers_category: {
    kind: "object",
    properties: { name: text, direct_identifier: nullable(boolean), anon_function: nullable(text) },
  },
  last_name: dictionary,
  lorem_ipsum: { kind: "object", properties: { oid: integer, paragraph: nullable(text) } },
  pg_identifiers: {
    kind: "object",
    properties: {
      attrelid: nullable(oid),
      attnum: nullable(integer),
      relname: nullable(text),
      attname: nullable(text),
      format_type: nullable(text),
      col_description: nullable(text),
      indirect_identifier: nullable(boolean),
      priority: nullable(integer),
    },
  },
  pg_masked_roles: {
    kind: "object",
    properties: {
      rolname: nullable(text),
      rolsuper: nullable(boolean),
      rolinherit: nullable(boolean),
      rolcreaterole: nullable(boolean),
      rolcreatedb: nullable(boolean),
      rolcanlogin: nullable(boolean),
      rolreplication: nullable(boolean),
      rolconnlimit: nullable(integer),
      rolpassword: nullable(text),
      rolvaliduntil: nullable({
        kind: "object",
        properties: { type: { kind: "string", enum: ["timestamptz"] }, text },
      }),
      rolbypassrls: nullable(boolean),
      rolconfig: nullable(arrayValue(text)),
      oid: nullable(oid),
      hasmask: nullable(boolean),
    },
  },
  pg_masking_rules: maskingRule,
  pg_masks: maskingRule,
  pg_trusted_functions: { kind: "object", properties: { schema: nullable(text), function: nullable(text) } },
  postcode: dictionary,
  siret: dictionary,
} as const satisfies Record<AnonCompositeName, ExtensionValueSchema>;
const search = { filter: false, comparison: false, order: false, text: false } as const;
type Codecs = ReturnType<typeof anonCompositeCodecs>;
type Fields = {
  readonly [Name in keyof Codecs]: () => ReturnType<
    typeof createExtensionField<CodecInput<Codecs[Name]>, typeof search>
  >;
};

/** Native row types and their arrays; no unverified comparison/search operators are invented. */
export function anonFields(descriptor: ExtensionDescriptor<"anon", { version: "2.5.1"; schema: string }>): Fields {
  const codecs = anonCompositeCodecs("anon");
  // SAFETY: each key keeps its corresponding composite codec, exact native type identity and public value shape.
  return Object.freeze(
    Object.fromEntries(
      Object.entries(codecs).map(([name, codec]) => {
        const array = name.startsWith("_");
        // SAFETY: anonCompositeCodecs contains only composite keys and their underscore-prefixed array counterparts.
        const type = name.replace(/^_/, "") as AnonCompositeName;
        return [
          name,
          () => {
            // SAFETY: the codec belongs to this exact field key; createExtensionField validates each supplied value through it.
            const field = createExtensionField({
              extension: { ...descriptor, schema: "anon" },
              member: `type:anon.${name}`,
              type,
              array,
              codec: codec as ExtensionCodec<unknown, unknown>,
              value: array ? arrayValue(values[type]) : values[type],
              search,
            });
            // Installation placement and captured SQL storage namespace are distinct in this nonrelocatable extension.
            const metadata = Object.freeze({
              ...field.metadata.extension!,
              schema: descriptor.schema,
              storage: { schema: "anon", type, dimensions: array ? 1 : 0 },
            });
            // SAFETY: storage input is untrusted and this codec's encode function validates the corresponding native composite shape.
            registerExtensionStorageCheck(metadata, (value) =>
              (codec as ExtensionCodec<unknown, unknown>).encode(value),
            );
            return new Field(
              field.build,
              { ...field.metadata, extension: metadata },
              field.validator,
              field.encodeDefault,
            );
          },
        ];
      }),
    ),
  ) as Fields;
}
