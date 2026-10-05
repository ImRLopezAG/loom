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
const value = v.pipe(text, v.brand("Ltree"));
export type Ltree = v.InferOutput<typeof value>;

/** Preserve empty paths and spelling; PostgreSQL owns locale, syntax, and native path limits. */
export const ltree = (input: string): Ltree => v.parse(value, input);

/** Native ltree SQL identity with lossless text transport in the selected installation schema. */
export function createLtreeCodec(schema: string) {
  return createExtensionCodec({
    id: "ltree:ltree:path:utf8:1",
    sqlType: { schema, name: "ltree" },
    input: text,
    output: value,
    transport: "text",
    encode: (input) => input,
    decode: (input) => input,
  });
}
