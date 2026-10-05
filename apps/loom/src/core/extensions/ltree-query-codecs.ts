import * as v from "valibot";
import { createExtensionCodec } from "./codecs";

function wellFormedUnicode(value: string): boolean {
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index);
    if (code >= 0xd800 && code <= 0xdbff) {
      const next = value.charCodeAt(++index);
      if (!(next >= 0xdc00 && next <= 0xdfff)) return false;
    } else if (code >= 0xdc00 && code <= 0xdfff) return false;
  }
  return true;
}
const text = v.pipe(
  v.string(),
  v.check((value) => !value.includes("\0") && wellFormedUnicode(value), "Expected lossless PostgreSQL UTF8 text"),
);
const queryValue = v.pipe(text, v.brand("Lquery"));
const textQueryValue = v.pipe(text, v.brand("Ltxtquery"));
export type Lquery = v.InferOutput<typeof queryValue>;
export type Ltxtquery = v.InferOutput<typeof textQueryValue>;

/** Preserve supplied spelling; this checks UTF8 representation, not PostgreSQL lquery grammar. */
export const lquery = (input: string): Lquery => v.parse(queryValue, input);
/** Preserve supplied spelling; this checks UTF8 representation, not PostgreSQL ltxtquery grammar. */
export const ltxtquery = (input: string): Ltxtquery => v.parse(textQueryValue, input);

/** Native selected-schema lquery identity; PostgreSQL owns grammar, canonical text, and limits. */
export function createLqueryCodec(schema: string) {
  return createExtensionCodec({
    id: "ltree:lquery:query:utf8:1",
    sqlType: { schema, name: "lquery" },
    input: text,
    output: queryValue,
    transport: "text",
    encode: (input) => input,
    decode: (input) => input,
  });
}

/** Native selected-schema ltxtquery identity; PostgreSQL owns grammar, canonical text, and limits. */
export function createLtxtqueryCodec(schema: string) {
  return createExtensionCodec({
    id: "ltree:ltxtquery:query:utf8:1",
    sqlType: { schema, name: "ltxtquery" },
    input: text,
    output: textQueryValue,
    transport: "text",
    encode: (input) => input,
    decode: (input) => input,
  });
}
