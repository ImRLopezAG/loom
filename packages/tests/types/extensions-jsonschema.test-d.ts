import type { SQL } from "drizzle-orm";
import { pgTable, text, jsonb } from "drizzle-orm/pg-core";
import { createPgJsonschema_0_3_4 } from "../../../apps/loom/src/core/extensions/adapters/pg-jsonschema";
import {
  jsonDocument,
  jsonbDocument,
  jsonValue,
  jsonbValue,
} from "../../../apps/loom/src/core/extensions/native-json-codecs";
import type { JsonDocument, JsonbDocument } from "../../../apps/loom/src/core/extensions/native-json-codecs";
import type { PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
const adapter = createPgJsonschema_0_3_4({
  name: "pg_jsonschema",
  version: "0.3.4",
  schema: "custom",
  apiSupport: { status: "verified" },
});
const table = pgTable("documents", {
  title: text(),
  json: jsonb().$type<JsonDocument>(),
  jsonb: jsonb().$type<JsonbDocument>(),
});
const schema = jsonValue({ type: "string" });
const loomSchema = defineSchema((fields) => ({ documents: { body: fields.json() } }));
adapter.jsonbMatchesSchema(schema, loomSchema.tables.documents.body);
adapter.jsonMatchesSchema(loomSchema.tables.documents.body, loomSchema.tables.documents.body);
const match: SQL<boolean | null> = adapter.jsonMatchesSchema(schema, jsonValue("foo"));
const binaryMatch: SQL<boolean | null> = adapter.jsonbMatchesSchema(schema, jsonbValue(null));
const valid: SQL<boolean | null> = adapter.isValid(table.json);
const errors: SQL<PostgreSqlArray<string> | null> = adapter.validationErrors(schema, table.json);
adapter.jsonbMatchesSchema(schema, table.jsonb);
adapter.sql.functions.json_matches_schema(null, jsonDocument("null"));
adapter.sql.functions.jsonb_matches_schema(null, jsonbDocument("null"));
adapter.sql.functions.jsonschema_is_valid(null);
adapter.sql.functions.jsonschema_validation_errors(null, null);
// @ts-expect-error JSONB instance cannot replace exact JSON instance.
adapter.jsonMatchesSchema(schema, jsonbValue("foo"));
// @ts-expect-error Schema is JSON even for the JSONB routine.
adapter.jsonbMatchesSchema(jsonbValue({}), jsonbValue("foo"));
// @ts-expect-error JSON instance cannot replace exact JSONB instance.
adapter.jsonbMatchesSchema(schema, jsonValue("foo"));
// @ts-expect-error SQL text columns are not JSON documents.
adapter.isValid(table.title);
// @ts-expect-error Raw text is ambiguous with a JSON string and must use jsonDocument/jsonValue.
adapter.jsonMatchesSchema(schema, "foo");
// @ts-expect-error A schema check does not offer a caller-selected result generic.
adapter.isValid<string>(schema);
createPgJsonschema_0_3_4({
  name: "pg_jsonschema",
  // @ts-expect-error Only the captured version is typed.
  version: "0.3.3",
  schema: "custom",
  apiSupport: { status: "verified" },
});
void [match, binaryMatch, valid, errors];
