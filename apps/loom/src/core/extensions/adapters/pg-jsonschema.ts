import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { arrayCodec, booleanCodec, nullableCodec, textCodec } from "../codecs";
import { jsonCodec, jsonbCodec } from "../native-json-codecs";
import { createSqlFunction } from "../sql";
import { Column, is, sql, type SQL } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import type { JsonValue } from "../../schema/fields";
import type { JsonDocument, JsonbDocument } from "../native-json-codecs";

export { jsonDocument, jsonbDocument, jsonValue, jsonbValue } from "../native-json-codecs";
export type { JsonDocument, JsonbDocument } from "../native-json-codecs";

type NativeJsonColumn = AnyPgColumn<{ data: JsonValue | JsonDocument | JsonbDocument; dataType: "object json" }>;
type JsonInput = JsonDocument | null | SQL<JsonDocument | null> | NativeJsonColumn;
type JsonbInput = JsonbDocument | null | SQL<JsonbDocument | null> | NativeJsonColumn;

function jsonArgument(value: JsonInput) {
  // The original native column remains SQL; no driver-decoded JS value flows through this type.
  return is(value, Column) ? sql<JsonDocument | null>`${value}::"pg_catalog"."json"` : value;
}
function jsonbArgument(value: JsonbInput) {
  return is(value, Column) ? sql<JsonbDocument | null>`${value}::"pg_catalog"."jsonb"` : value;
}

/** Schema checks are query expressions; they confer no invocation identity or output permission. */
export function createPgJsonschema_0_3_4<
  const Descriptor extends ExtensionDescriptor<"pg_jsonschema", { version: "0.3.4"; schema: string }>,
>(descriptor: Descriptor) {
  const json = nullableCodec(jsonCodec);
  const jsonb = nullableCodec(jsonbCodec);
  // Upstream disables HTTP/file retrieval and supplies no custom retriever. Built-in drafts and
  // local references depend on their arguments; unavailable external references raise/return errors.
  const base = { schema: descriptor.schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const matchJson = createSqlFunction({
    ...base,
    name: "json_matches_schema",
    member: "routine:$extension:pg_jsonschema.json_matches_schema(pg_catalog.json,pg_catalog.json)",
    arguments: [json, json] as const,
    result: nullableCodec(booleanCodec),
  });
  const matchJsonb = createSqlFunction({
    ...base,
    name: "jsonb_matches_schema",
    member: "routine:$extension:pg_jsonschema.jsonb_matches_schema(pg_catalog.json,pg_catalog.jsonb)",
    arguments: [json, jsonb] as const,
    result: nullableCodec(booleanCodec),
  });
  const valid = createSqlFunction({
    ...base,
    name: "jsonschema_is_valid",
    member: "routine:$extension:pg_jsonschema.jsonschema_is_valid(pg_catalog.json)",
    arguments: [json] as const,
    result: nullableCodec(booleanCodec),
  });
  const errors = createSqlFunction({
    ...base,
    name: "jsonschema_validation_errors",
    member: "routine:$extension:pg_jsonschema.jsonschema_validation_errors(pg_catalog.json,pg_catalog.json)",
    arguments: [json, json] as const,
    result: nullableCodec(arrayCodec(textCodec)),
  });
  const jsonMatchesSchema = (schema: JsonInput, instance: JsonInput) =>
    matchJson(jsonArgument(schema), jsonArgument(instance));
  const jsonbMatchesSchema = (schema: JsonInput, instance: JsonbInput) =>
    matchJsonb(jsonArgument(schema), jsonbArgument(instance));
  const isValid = (schema: JsonInput) => valid(jsonArgument(schema));
  const validationErrors = (schema: JsonInput, instance: JsonInput) =>
    errors(jsonArgument(schema), jsonArgument(instance));
  return bindExtension(descriptor, {
    jsonMatchesSchema,
    jsonbMatchesSchema,
    isValid,
    validationErrors,
    sql: Object.freeze({
      functions: Object.freeze({
        json_matches_schema: jsonMatchesSchema,
        jsonb_matches_schema: jsonbMatchesSchema,
        jsonschema_is_valid: isValid,
        jsonschema_validation_errors: validationErrors,
      }),
      operators: Object.freeze({}),
    }),
  });
}
