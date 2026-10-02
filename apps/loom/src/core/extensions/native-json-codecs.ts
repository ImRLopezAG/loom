import * as v from "valibot";
import type { JsonValue } from "../schema/fields";
import { json } from "../validation/encoding";
import { createExtensionCodec } from "./codecs";

/** Exact JSON text; JSON null is { type: "json", text: "null" }, while SQL NULL is null. */
export interface JsonDocument {
  readonly type: "json";
  readonly text: string;
}
/** Text returned by PostgreSQL JSONB: normalized keys/whitespace, last duplicate key wins. */
export interface JsonbDocument {
  readonly type: "jsonb";
  readonly text: string;
}

const documentText = v.pipe(
  v.string(),
  v.check((text) => {
    try {
      // Syntax check only. Discard the JS representation to retain every original number and key.
      JSON.parse(text);
      return true;
    } catch {
      return false;
    }
  }, "Invalid JSON document syntax"),
);
const jsonDocumentSchema = v.object({ type: v.literal("json"), text: documentText });
const jsonbDocumentSchema = v.object({ type: v.literal("jsonb"), text: documentText });

/** Preserve RFC JSON grammar verbatim; PostgreSQL validates encoding and type-specific numeric limits. */
export function jsonDocument(text: string): JsonDocument {
  return Object.freeze(v.parse(jsonDocumentSchema, { type: "json", text }));
}
/** Does not emulate JSONB normalization: PostgreSQL performs it when the parameter is cast. */
export function jsonbDocument(text: string): JsonbDocument {
  return Object.freeze(v.parse(jsonbDocumentSchema, { type: "jsonb", text }));
}
/** Serialize a new JS value. A JS string is a JSON string, never parsed as document text. */
export function jsonValue(value: JsonValue): JsonDocument {
  return jsonDocument(JSON.stringify(v.parse(json, value)));
}
export function jsonbValue(value: JsonValue): JsonbDocument {
  return jsonbDocument(JSON.stringify(v.parse(json, value)));
}

/** Text projection bypasses the driver's lossy JSON.parse, preserving numeric precision. */
export const jsonCodec = createExtensionCodec({
  id: "pg:json:text:1",
  sqlType: { schema: "pg_catalog", name: "json" },
  input: jsonDocumentSchema,
  output: jsonDocumentSchema,
  transport: "text",
  encode: (value) => value.text,
  decode: (value) => ({ type: "json", text: v.parse(v.string(), value) }),
});
export const jsonbCodec = createExtensionCodec({
  id: "pg:jsonb:text:1",
  sqlType: { schema: "pg_catalog", name: "jsonb" },
  input: jsonbDocumentSchema,
  output: jsonbDocumentSchema,
  transport: "text",
  encode: (value) => value.text,
  decode: (value) => ({ type: "jsonb", text: v.parse(v.string(), value) }),
});
