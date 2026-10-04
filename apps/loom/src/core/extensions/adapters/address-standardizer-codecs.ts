import * as v from "valibot";
import {
  arrayCodec,
  compositeCodec,
  nullableCodec,
  textCodec,
  withCodecSqlType,
  type PostgreSqlArray,
} from "../codecs";
import type { ExtensionValueSchema } from "../fields";

export type { PostgreSqlArray };

export const ADDRESS_STANDARDIZER_DIGEST =
  "f59d9c3801428f5360f8279dd04c64d7a8c74ed9c58afb733d95399aacdc5cc1";

/** Captured stdaddr attribute order from address_standardizer 3.6.4. */
export const addressStandardizerStdaddrFields = [
  "building",
  "house_num",
  "predir",
  "qual",
  "pretype",
  "name",
  "suftype",
  "sufdir",
  "ruralroute",
  "extra",
  "city",
  "state",
  "country",
  "postcode",
  "box",
  "unit",
] as const;

/** Captured parse_address OUT attribute order. */
export const addressStandardizerParseFields = [
  "num",
  "street",
  "street2",
  "address1",
  "city",
  "state",
  "zip",
  "zipplus",
  "country",
] as const;

export type AddressStandardizerStdaddrField = (typeof addressStandardizerStdaddrFields)[number];
export type AddressStandardizerParseField = (typeof addressStandardizerParseFields)[number];
export type AddressStandardizerStdaddr = {
  readonly [Field in AddressStandardizerStdaddrField]: string | null;
};
export type AddressStandardizerParse = {
  readonly [Field in AddressStandardizerParseField]: string | null;
};

export type AddressStandardizerRelation =
  | { readonly schema: string; readonly name: string }
  | { readonly name: string; readonly schema?: undefined };

export type AddressStandardizerSources = {
  readonly lex: AddressStandardizerRelation;
  readonly gaz: AddressStandardizerRelation;
  readonly rules: AddressStandardizerRelation;
};

const identifier = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0"), "Invalid PostgreSQL identifier"),
);

/**
 * PostGIS 3.6.4 std_pg_hash.c tableNameOk: alnum, underscore, period, and double quote only.
 * load_lex/load_rules concatenate this string after FROM; search_path applies to unqualified names.
 */
export function addressStandardizerTableNameOk(value: string): boolean {
  return value.length > 0 && [...value].every((character) => /[A-Za-z0-9_."]/.test(character));
}

function quoteIdent(value: string): string {
  return `"${v.parse(identifier, value).replaceAll('"', '""')}"`;
}

/** Exact quoted identity native SPI will concatenate. Unqualified names remain search_path lookups. */
export function encodeAddressStandardizerSource(relation: AddressStandardizerRelation): string {
  const encoded =
    relation.schema === undefined ? quoteIdent(relation.name) : `${quoteIdent(relation.schema)}.${quoteIdent(relation.name)}`;
  if (!addressStandardizerTableNameOk(encoded))
    throw new Error("address_standardizer source failed native tableNameOk");
  return encoded;
}

export function addressStandardizerRelationDependency(relation: AddressStandardizerRelation): string | undefined {
  if (relation.schema === undefined) return undefined;
  return `${v.parse(identifier, relation.schema)}.${v.parse(identifier, relation.name)}`;
}

export function addressStandardizerSourceWitness(sources: AddressStandardizerSources) {
  const lex = encodeAddressStandardizerSource(sources.lex);
  const gaz = encodeAddressStandardizerSource(sources.gaz);
  const rules = encodeAddressStandardizerSource(sources.rules);
  const dependencies = [
    addressStandardizerRelationDependency(sources.lex),
    addressStandardizerRelationDependency(sources.gaz),
    addressStandardizerRelationDependency(sources.rules),
  ];
  const qualified = dependencies.every((dependency) => dependency !== undefined);
  return Object.freeze({
    lex,
    gaz,
    rules,
    dependencies: Object.freeze(qualified ? (dependencies as readonly string[]) : []),
    observability: qualified ? ("tables" as const) : ("session" as const),
  });
}

const nullableText = nullableCodec(textCodec);
const stdaddrFieldCodecs = Object.freeze(
  Object.fromEntries(addressStandardizerStdaddrFields.map((name) => [name, nullableText])),
) as { readonly [Field in AddressStandardizerStdaddrField]: typeof nullableText };
const parseFieldCodecs = Object.freeze(
  Object.fromEntries(addressStandardizerParseFields.map((name) => [name, nullableText])),
) as { readonly [Field in AddressStandardizerParseField]: typeof nullableText };

export function createStdaddrCodec(schema: string) {
  return withCodecSqlType(compositeCodec("address_standardizer:stdaddr", stdaddrFieldCodecs), {
    schema,
    name: "stdaddr",
  });
}

export function createStdaddrArrayCodec(schema: string) {
  const codec = createStdaddrCodec(schema);
  return withCodecSqlType(arrayCodec(codec), { schema, name: "stdaddr", array: true });
}

export const parseAddressCodec = withCodecSqlType(compositeCodec("address_standardizer:parse_address", parseFieldCodecs), {
  schema: "pg_catalog",
  name: "record",
});

const nullableString: ExtensionValueSchema = { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] };
export const stdaddrValueSchema: ExtensionValueSchema = {
  kind: "object",
  properties: Object.fromEntries(addressStandardizerStdaddrFields.map((name) => [name, nullableString])),
};
let nested: ExtensionValueSchema = { kind: "union", variants: [stdaddrValueSchema, { kind: "null" }] };
const depths: ExtensionValueSchema[] = [];
for (let rank = 0; rank < 6; rank++) {
  nested = { kind: "array", items: nested };
  depths.push(nested);
}
export const stdaddrArrayValueSchema: ExtensionValueSchema = {
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
    values: { kind: "union", variants: depths },
  },
};
