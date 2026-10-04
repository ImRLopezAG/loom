import * as v from "valibot";
import { arrayCodec, createExtensionCodec, decodeFailure, type PostgreSqlArray } from "../codecs";
import type { ExtensionValueSchema } from "../fields";

export const ip4rKinds = ["ip4", "ip4r", "ip6", "ip6r", "ipaddress", "iprange"] as const;
export type Ip4rKind = (typeof ip4rKinds)[number];
/** The SQL type is part of the value, so incompatible native overloads cannot accept each other's input. */
export interface Ip4rValue<Kind extends Ip4rKind = Ip4rKind> {
  readonly kind: Kind;
  readonly text: string;
}

const lossless = v.pipe(
  v.string(),
  v.check((text) => !text.includes("\0") && !/[\uD800-\uDFFF]/u.test(text), "Expected lossless PostgreSQL UTF8 text"),
);
const inetValue = v.pipe(lossless, v.brand("PgInet"));
const cidrValue = v.pipe(lossless, v.brand("PgCidr"));
export type PgInet = v.InferOutput<typeof inetValue>;
export type PgCidr = v.InferOutput<typeof cidrValue>;
export const inet = (input: string) => v.parse(inetValue, input);
export const cidr = (input: string) => v.parse(cidrValue, input);
export const inetCodec = createExtensionCodec({
  id: "pg:inet:string:1",
  sqlType: { schema: "pg_catalog", name: "inet" },
  input: inetValue,
  output: inetValue,
  transport: "text",
  encode: (value) => value,
  decode: (value) => inet(v.parse(v.string(), value)),
});
export const cidrCodec = createExtensionCodec({
  id: "pg:cidr:string:1",
  sqlType: { schema: "pg_catalog", name: "cidr" },
  input: cidrValue,
  output: cidrValue,
  transport: "text",
  encode: (value) => value,
  decode: (value) => cidr(v.parse(v.string(), value)),
});

function octet(value: string): boolean {
  if (!/^\d{1,3}$/.test(value)) return false;
  const number = Number(value);
  return number <= 255 && String(number) === value;
}
/** Native ip4_out emits four decimal octets; leading zeros are not part of that spelling. */
function nativeIp4(text: string): boolean {
  const parts = text.split(".");
  return parts.length === 4 && parts.every(octet);
}
function nativeIp6(text: string): boolean {
  if (!text.includes(":") || /[^0-9A-Fa-f:.]/.test(text)) return false;
  const halves = text.split("::");
  if (halves.length > 2) return false;
  const groups = text.replace("::", ":").split(":").filter(Boolean);
  return groups.length <= 8 && groups.every((group) => /^[0-9A-Fa-f]{1,4}$/.test(group) || nativeIp4(group));
}
function prefix(text: string, maximum: number): { address: string; length: number } | undefined {
  const index = text.lastIndexOf("/");
  if (index <= 0) return undefined;
  const length = Number(text.slice(index + 1));
  if (!Number.isInteger(length) || length < 0 || length > maximum) return undefined;
  return { address: text.slice(0, index), length };
}
function nativeRange(text: string, address: (value: string) => boolean, maximum: number): boolean {
  if (address(text)) return true;
  const cidrForm = prefix(text, maximum);
  if (cidrForm) return address(cidrForm.address);
  const parts = text.split("-");
  return parts.length === 2 && address(parts[0]!) && address(parts[1]!);
}
function nativeText(kind: Ip4rKind, text: string): string {
  const valid =
    kind === "ip4"
      ? nativeIp4(text)
      : kind === "ip6"
        ? nativeIp6(text)
        : kind === "ip4r"
          ? nativeRange(text, nativeIp4, 32)
          : kind === "ip6r"
            ? nativeRange(text, nativeIp6, 128)
            : kind === "ipaddress"
              ? nativeIp4(text) || nativeIp6(text)
              : text === "-" || nativeRange(text, nativeIp4, 32) || nativeRange(text, nativeIp6, 128);
  if (!valid) throw new Error(`Invalid native ${kind} text`);
  return text;
}
function inputText(kind: Ip4rKind) {
  return v.pipe(
    lossless,
    v.check((value) => {
      try {
        nativeText(kind, value);
        return true;
      } catch {
        return false;
      }
    }, `Expected a native ${kind} spelling`),
  );
}
function valueSchema<const Kind extends Ip4rKind>(kind: Kind) {
  return v.strictObject({ kind: v.literal(kind), text: inputText(kind) });
}
export function ip4rValue<const Kind extends Ip4rKind>(kind: Kind, text: string): Ip4rValue<Kind> {
  return v.parse(valueSchema(kind), { kind, text });
}
export function createIp4rCodec<const Kind extends Ip4rKind>(schema: string, kind: Kind) {
  const typedText = valueSchema(kind);
  return createExtensionCodec({
    id: `ip4r:${kind}:typed-text:1`,
    sqlType: { schema, name: kind },
    input: typedText,
    output: typedText,
    transport: "text",
    encode: (value) => value.text,
    decode: (value) => ({ kind, text: nativeText(kind, v.parse(v.string(), value)) }),
  });
}
export function createIp4rArrayCodec<const Kind extends Ip4rKind>(schema: string, kind: Kind) {
  const codec = arrayCodec(createIp4rCodec(schema, kind));
  function bounds(value: PostgreSqlArray<Ip4rValue<Kind>>) {
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
      throw new Error("Invalid native ip4r array bounds");
  }
  return Object.freeze({
    ...codec,
    encode(value: PostgreSqlArray<Ip4rValue<Kind>>) {
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
export function ip4rWireValue(kind: Ip4rKind): ExtensionValueSchema {
  return { kind: "object", properties: { kind: { kind: "string", enum: [kind] }, text: { kind: "string" } } };
}
export function ip4rArrayWireValue(kind: Ip4rKind): ExtensionValueSchema {
  let nested: ExtensionValueSchema = { kind: "union", variants: [ip4rWireValue(kind), { kind: "null" }] };
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
