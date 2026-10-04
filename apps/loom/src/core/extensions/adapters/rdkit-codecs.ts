import * as v from "valibot";
import { arrayCodec, createExtensionCodec, decodeFailure, type PostgreSqlArray } from "../codecs";
import type { ExtensionValueSchema } from "../fields";

export const rdkitKinds = ["mol", "qmol", "xqmol", "reaction", "bfp", "sfp"] as const;
export type RdkitKind = (typeof rdkitKinds)[number];
/** Native cartridge text. PostgreSQL owns SMILES, SMARTS, reaction and fingerprint grammar. */
export interface RdkitValue<Kind extends RdkitKind = RdkitKind> {
  readonly kind: Kind;
  readonly text: string;
}

function valueSchema<const Kind extends RdkitKind>(kind: Kind) {
  return v.strictObject({ kind: v.literal(kind), text: v.string() });
}

export function rdkitValue<const Kind extends RdkitKind>(kind: Kind, text: string): RdkitValue<Kind> {
  return v.parse(valueSchema(kind), { kind, text });
}

/** Pass through captured *_out text. No client chemistry, fingerprint or pickle algorithm. */
export function createRdkitCodec<const Kind extends RdkitKind>(schema: string, kind: Kind) {
  const valueValidator = valueSchema(kind);
  return createExtensionCodec({
    id: `rdkit:${kind}:native-text:1`,
    sqlType: { schema, name: kind },
    input: valueValidator,
    output: valueValidator,
    transport: "text",
    encode: (value) => value.text,
    decode: (value) => ({ kind, text: v.parse(v.string(), value) }),
  });
}

export function createRdkitArrayCodec<const Kind extends RdkitKind>(schema: string, kind: Kind) {
  const codec = arrayCodec(createRdkitCodec(schema, kind));
  function bounds(value: PostgreSqlArray<RdkitValue<Kind>>) {
    if (
      value.dimensions.length > 6 ||
      value.dimensions.some(
        ({ lowerBound, length }) =>
          !Number.isInteger(lowerBound) ||
          lowerBound < -2147483648 ||
          lowerBound > 2147483647 ||
          !Number.isInteger(length) ||
          length < 1 ||
          length > 2147483647 ||
          lowerBound + length > 2147483647,
      )
    )
      throw new Error("Invalid native rdkit array bounds");
  }
  return Object.freeze({
    ...codec,
    encode(value: PostgreSqlArray<RdkitValue<Kind>>) {
      bounds(value);
      return codec.encode(value);
    },
    decode(value: Parameters<typeof codec.decode>[0]) {
      return decodeFailure(() => {
        const parsed = codec.decode(value);
        bounds(parsed);
        return parsed;
      });
    },
  });
}

export function rdkitWireValue(kind: RdkitKind): ExtensionValueSchema {
  return {
    kind: "object",
    properties: { kind: { kind: "string", enum: [kind] }, text: { kind: "string" } },
  };
}

export function rdkitArrayWireValue(kind: RdkitKind): ExtensionValueSchema {
  let nested: ExtensionValueSchema = { kind: "union", variants: [rdkitWireValue(kind), { kind: "null" }] };
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
            lowerBound: { kind: "number", integer: true, minimum: -2147483648, maximum: 2147483647 },
            length: { kind: "number", integer: true, minimum: 1, maximum: 2147483647 },
          },
        },
      },
      values: { kind: "union", variants },
    },
  };
}
