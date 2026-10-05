import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { nullableCodec, textCodec } from "../codecs";
import { createExtensionField } from "../fields";
import { createSqlFunction, defaultSqlArgument, type ExtensionSqlInput } from "../sql";
import {
  ADDRESS_STANDARDIZER_DIGEST,
  addressStandardizerSourceWitness,
  createStdaddrArrayCodec,
  createStdaddrCodec,
  parseAddressCodec,
  stdaddrArrayValueSchema,
  stdaddrValueSchema,
  type AddressStandardizerSources,
} from "./address-standardizer-codecs";

export {
  ADDRESS_STANDARDIZER_DIGEST,
  addressStandardizerParseFields,
  addressStandardizerStdaddrFields,
  addressStandardizerTableNameOk,
  encodeAddressStandardizerSource,
  parseAddressCodec,
} from "./address-standardizer-codecs";
export type {
  AddressStandardizerParse,
  AddressStandardizerRelation,
  AddressStandardizerSources,
  AddressStandardizerStdaddr,
  PostgreSqlArray,
} from "./address-standardizer-codecs";

const digest = ADDRESS_STANDARDIZER_DIGEST;
type Descriptor = ExtensionDescriptor<"address_standardizer", { readonly version: "3.6.4"; readonly schema: string }>;
type NullableText = ReturnType<typeof nullableCodec<string, string>>;
const member = {
  debug:
    "routine:$extension:address_standardizer.debug_standardize_address(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  parse: "routine:$extension:address_standardizer.parse_address(pg_catalog.text)",
  five: "routine:$extension:address_standardizer.standardize_address(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  four: "routine:$extension:address_standardizer.standardize_address(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  composite: 'composite type:"$extension:address_standardizer".stdaddr',
  array: "type:$extension:address_standardizer._stdaddr",
  stdaddr: "type:$extension:address_standardizer.stdaddr",
} as const;

/** Exact address_standardizer 3.6.4 queries. Native C owns tokenization; this adapter never parses addresses. */
export function createAddressStandardizer_3_6_4<const Selected extends Descriptor>(descriptor: Selected) {
  if (
    descriptor.name !== "address_standardizer" ||
    descriptor.version !== "3.6.4" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("address_standardizer 3.6.4 requires its exact verified contract");
  const codec = createStdaddrCodec(descriptor.schema);
  const array = createStdaddrArrayCodec(descriptor.schema);
  const stdaddr = nullableCodec(codec);
  const parsed = nullableCodec(parseAddressCodec);
  const text = nullableCodec(textCodec);
  const search = { filter: false, comparison: false, order: false, text: false } as const;
  const query = { schema: descriptor.schema, authority: "query" } as const;
  const opaque = { ...query, dependencies: [], observability: "session" } as const;
  const four = createSqlFunction({
    ...opaque,
    name: "standardize_address",
    member: member.four,
    arguments: [text, text, text, text] as const,
    result: stdaddr,
  });
  const five = createSqlFunction({
    ...opaque,
    name: "standardize_address",
    member: member.five,
    arguments: [text, text, text, text, text] as const,
    result: stdaddr,
  });
  const parse_address = createSqlFunction({
    ...query,
    dependencies: [],
    observability: "tables",
    name: "parse_address",
    member: member.parse,
    arguments: [text] as const,
    result: parsed,
  });
  const debug_standardize_address = createSqlFunction({
    ...opaque,
    name: "debug_standardize_address",
    member: member.debug,
    arguments: [text, text, text, text, defaultSqlArgument(text, "macro")] as const,
    result: text,
  });
  function bindSources(sources: AddressStandardizerSources) {
    const witness = addressStandardizerSourceWitness(sources);
    return {
      witness,
      four: createSqlFunction({
        ...query,
        dependencies: witness.dependencies,
        observability: witness.observability,
        name: "standardize_address",
        member: member.four,
        arguments: [text, text, text, text] as const,
        result: stdaddr,
      }),
      five: createSqlFunction({
        ...query,
        dependencies: witness.dependencies,
        observability: witness.observability,
        name: "standardize_address",
        member: member.five,
        arguments: [text, text, text, text, text] as const,
        result: stdaddr,
      }),
      debug: createSqlFunction({
        ...query,
        dependencies: witness.dependencies,
        observability: witness.observability,
        name: "debug_standardize_address",
        member: member.debug,
        arguments: [text, text, text, text, defaultSqlArgument(text, "macro")] as const,
        result: text,
      }),
    };
  }
  function standardizeAddress(
    sources: AddressStandardizerSources,
    address: ExtensionSqlInput<NullableText>,
  ): ReturnType<typeof four>;
  function standardizeAddress(
    sources: AddressStandardizerSources,
    micro: ExtensionSqlInput<NullableText>,
    macro: ExtensionSqlInput<NullableText>,
  ): ReturnType<typeof five>;
  function standardizeAddress(
    sources: AddressStandardizerSources,
    micro: ExtensionSqlInput<NullableText>,
    macro?: ExtensionSqlInput<NullableText>,
  ) {
    const bound = bindSources(sources);
    return macro === undefined
      ? bound.four(bound.witness.lex, bound.witness.gaz, bound.witness.rules, micro)
      : bound.five(bound.witness.lex, bound.witness.gaz, bound.witness.rules, micro, macro);
  }
  function debugStandardizeAddress(
    sources: AddressStandardizerSources,
    micro: ExtensionSqlInput<NullableText>,
    macro?: ExtensionSqlInput<NullableText>,
  ) {
    const bound = bindSources(sources);
    return macro === undefined
      ? bound.debug(bound.witness.lex, bound.witness.gaz, bound.witness.rules, micro)
      : bound.debug(bound.witness.lex, bound.witness.gaz, bound.witness.rules, micro, macro);
  }
  function standardize_address(
    lex: ExtensionSqlInput<NullableText>,
    gaz: ExtensionSqlInput<NullableText>,
    rules: ExtensionSqlInput<NullableText>,
    address: ExtensionSqlInput<NullableText>,
  ): ReturnType<typeof four>;
  function standardize_address(
    lex: ExtensionSqlInput<NullableText>,
    gaz: ExtensionSqlInput<NullableText>,
    rules: ExtensionSqlInput<NullableText>,
    micro: ExtensionSqlInput<NullableText>,
    macro: ExtensionSqlInput<NullableText>,
  ): ReturnType<typeof five>;
  function standardize_address(
    lex: ExtensionSqlInput<NullableText>,
    gaz: ExtensionSqlInput<NullableText>,
    rules: ExtensionSqlInput<NullableText>,
    micro: ExtensionSqlInput<NullableText>,
    macro?: ExtensionSqlInput<NullableText>,
  ) {
    return macro === undefined ? four(lex, gaz, rules, micro) : five(lex, gaz, rules, micro, macro);
  }
  const functions = Object.freeze({
    standardize_address,
    parse_address,
    debug_standardize_address,
  });
  const overloads = Object.freeze({
    [member.four]: four,
    [member.five]: five,
    [member.parse]: parse_address,
    [member.debug]: debug_standardize_address,
  });
  const types = Object.freeze({
    [member.composite]: codec,
    [member.stdaddr]: codec,
    [member.array]: array,
  });
  const field = () =>
    createExtensionField({
      extension: descriptor,
      member: member.stdaddr,
      type: "stdaddr",
      codec,
      value: stdaddrValueSchema,
      search,
    });
  const arrayField = () =>
    createExtensionField({
      extension: descriptor,
      member: member.array,
      type: "stdaddr",
      array: true,
      codec: array,
      value: stdaddrArrayValueSchema,
      search,
    });
  return bindExtension(descriptor, {
    codec,
    arrayCodec: array,
    parseCodec: parseAddressCodec,
    field,
    arrayField,
    standardizeAddress,
    debugStandardizeAddress,
    parseAddress: parse_address,
    sql: Object.freeze({ functions, operators: Object.freeze({}), overloads, types }),
  });
}
export type AddressStandardizerApi = ReturnType<typeof createAddressStandardizer_3_6_4>;
