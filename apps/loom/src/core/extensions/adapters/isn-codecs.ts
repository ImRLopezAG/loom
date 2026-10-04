import * as v from "valibot";
import { arrayCodec, createExtensionCodec, decodeFailure, type PostgreSqlArray } from "../codecs";
import type { ExtensionValueSchema } from "../fields";

export const isnKinds = ["ean13", "isbn", "isbn13", "ismn", "ismn13", "issn", "issn13", "upc"] as const;
export type IsnKind = (typeof isnKinds)[number];
/** The SQL type is part of the value, so incompatible native overloads cannot accept each other's input. */
export interface IsnValue<Kind extends IsnKind = IsnKind> {
  readonly kind: Kind;
  readonly text: string;
}
const inputText = v.pipe(
  v.string(),
  v.regex(/^[0-9mMxX? -]+!?$/),
  v.check((value) => /[0-9]/.test(value)),
);
function valueSchema<const Kind extends IsnKind>(kind: Kind) {
  return v.strictObject({ kind: v.literal(kind), text: inputText });
}
export function isnValue<const Kind extends IsnKind>(kind: Kind, text: string): IsnValue<Kind> {
  return v.parse(valueSchema(kind), { kind, text });
}
/** Decode native output, without reconstructing PostgreSQL's dated prefix/hyphenation catalogue. */
function nativeText(kind: IsnKind, text: string): string {
  if (!/^[0-9MX]+(?:-[0-9MX]+)*!?$/.test(text)) throw new Error("Invalid native isn text");
  const digits = text.replaceAll("-", "").replace(/!$/, "");
  const long = /^\d{13}$/.test(digits);
  const valid =
    kind === "ean13"
      ? long
      : kind === "upc"
        ? /^\d{12}$/.test(digits)
        : kind === "isbn"
          ? /^\d{9}[0-9X]$/.test(digits) || (long && /^(978|979[1-9])/.test(digits))
          : kind === "ismn"
            ? /^M\d{9}$/.test(digits) || (long && digits.startsWith("9790"))
            : kind === "issn"
              ? /^\d{7}[0-9X]$/.test(digits) || (long && digits.startsWith("977"))
              : kind === "isbn13"
                ? long && /^(978|979[1-9])/.test(digits)
                : kind === "ismn13"
                  ? long && digits.startsWith("9790")
                  : long && digits.startsWith("977");
  if (!valid) throw new Error("Invalid native isn type");
  return text;
}
/** Native input owns prefix/check-digit validation, '?' correction, and intentional '!' invalid marking. */
export function createIsnCodec<const Kind extends IsnKind>(schema: string, kind: Kind) {
  const valueValidator = valueSchema(kind);
  return createExtensionCodec({
    id: `isn:${kind}:typed-text:1`,
    sqlType: { schema, name: kind },
    input: valueValidator,
    output: valueValidator,
    transport: "text",
    encode: (value) => value.text,
    decode: (value) => ({ kind, text: nativeText(kind, v.parse(v.string(), value)) }),
  });
}
export function createIsnArrayCodec<const Kind extends IsnKind>(schema: string, kind: Kind) {
  const codec = arrayCodec(createIsnCodec(schema, kind));
  function bounds(value: PostgreSqlArray<IsnValue<Kind>>) {
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
      throw new Error("Invalid native isn array bounds");
  }
  return Object.freeze({
    ...codec,
    encode(value: PostgreSqlArray<IsnValue<Kind>>) {
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
export function isnWireValue(kind: IsnKind): ExtensionValueSchema {
  return {
    kind: "object",
    properties: { kind: { kind: "string", enum: [kind] }, text: { kind: "string", pattern: "^[0-9mMxX? -]+!?$" } },
  };
}
export function isnArrayWireValue(kind: IsnKind): ExtensionValueSchema {
  let nested: ExtensionValueSchema = { kind: "union", variants: [isnWireValue(kind), { kind: "null" }] };
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
