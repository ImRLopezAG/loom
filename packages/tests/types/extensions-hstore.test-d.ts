import type { SQL } from "drizzle-orm";
import { sql } from "drizzle-orm";
import type { PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";
import type { JsonDocument, JsonbDocument } from "../../../apps/loom/src/core/extensions/native-json-codecs";
import { createHstore_1_8, type HstoreValue } from "../../../apps/loom/src/core/extensions/adapters/hstore";

const api = createHstore_1_8({
  name: "hstore",
  version: "1.8",
  schema: "search",
  apiSupport: { status: "verified", digest: "cea995a9f416f391e531e262624a397016d7fc562ef1c78cb7247dd76d98daf1" },
});
const mapping = api.value([
  { key: "stored", value: null },
  { key: "string", value: "NULL" },
]);
const textArray: PostgreSqlArray<string> = { dimensions: [{ lowerBound: -2, length: 2 }], values: ["key", null] };
const schema: "search" = api.schema;
const version: "1.8" = api.version;
const member0: SQL<JsonDocument | null> = api.sql.overloads["cast:$extension:hstore.hstore->pg_catalog.json"](mapping);
const member1: SQL<JsonbDocument | null> =
  api.sql.overloads["cast:$extension:hstore.hstore->pg_catalog.jsonb"](mapping);
const member2: SQL<HstoreValue | null> =
  api.sql.overloads["cast:pg_catalog._text->$extension:hstore.hstore"](textArray);
const member3: SQL<HstoreValue | null> = api.sql.overloads[
  "operator:$extension:hstore.-($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member4: SQL<HstoreValue | null> = api.sql.overloads[
  "operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog._text)"
](mapping, textArray);
const member5: SQL<HstoreValue | null> = api.sql.overloads[
  "operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog.text)"
](mapping, "key");
const member6: SQL<PostgreSqlArray<string> | null> = api.sql.overloads[
  "operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog._text)"
](mapping, textArray);
const member7: SQL<string | null> = api.sql.overloads[
  "operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog.text)"
](mapping, "key");
const member8: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:hstore.?($extension:hstore.hstore,pg_catalog.text)"
](mapping, "key");
const member9: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:hstore.?&($extension:hstore.hstore,pg_catalog._text)"
](mapping, textArray);
const member10: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:hstore.?|($extension:hstore.hstore,pg_catalog._text)"
](mapping, textArray);
const member11: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:hstore.@>($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member12: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:hstore.#<#($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member13: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:hstore.#<=#($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member14: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:hstore.#>#($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member15: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:hstore.#>=#($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member16: SQL<PostgreSqlArray<string> | null> =
  api.sql.overloads["operator:$extension:hstore.%#(,$extension:hstore.hstore)"](mapping);
const member17: SQL<PostgreSqlArray<string> | null> =
  api.sql.overloads["operator:$extension:hstore.%%(,$extension:hstore.hstore)"](mapping);
const member18: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:hstore.<@($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member19: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:hstore.<>($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member20: SQL<boolean | null> = api.sql.overloads[
  "operator:$extension:hstore.=($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member21: SQL<HstoreValue | null> = api.sql.overloads[
  "operator:$extension:hstore.||($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member22: SQL<PostgreSqlArray<string> | null> =
  api.sql.overloads["routine:$extension:hstore.akeys($extension:hstore.hstore)"](mapping);
const member23: SQL<PostgreSqlArray<string> | null> =
  api.sql.overloads["routine:$extension:hstore.avals($extension:hstore.hstore)"](mapping);
const member24: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:hstore.defined($extension:hstore.hstore,pg_catalog.text)"
](mapping, "key");
const member25: SQL<HstoreValue | null> = api.sql.overloads[
  "routine:$extension:hstore.delete($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member26: SQL<HstoreValue | null> = api.sql.overloads[
  "routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog._text)"
](mapping, textArray);
const member27: SQL<HstoreValue | null> = api.sql.overloads[
  "routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog.text)"
](mapping, "key");
const member28: SQL<{ readonly key: string; readonly value: string | null }> =
  api.sql.overloads["routine:$extension:hstore.each($extension:hstore.hstore)"](mapping);
const member29: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:hstore.exist($extension:hstore.hstore,pg_catalog.text)"
](mapping, "key");
const member30: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:hstore.exists_all($extension:hstore.hstore,pg_catalog._text)"
](mapping, textArray);
const member31: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:hstore.exists_any($extension:hstore.hstore,pg_catalog._text)"
](mapping, textArray);
const member32: SQL<string | null> = api.sql.overloads[
  "routine:$extension:hstore.fetchval($extension:hstore.hstore,pg_catalog.text)"
](mapping, "key");
const member33: SQL<HstoreValue | null> = api.sql.overloads[
  "routine:$extension:hstore.hs_concat($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member34: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:hstore.hs_contained($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member35: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:hstore.hs_contains($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member36: SQL<number | null> = api.sql.overloads[
  "routine:$extension:hstore.hstore_cmp($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member37: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:hstore.hstore_eq($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member38: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:hstore.hstore_ge($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member39: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:hstore.hstore_gt($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member40: SQL<bigint | null> = api.sql.overloads[
  "routine:$extension:hstore.hstore_hash_extended($extension:hstore.hstore,pg_catalog.int8)"
](mapping, 1n);
const member41: SQL<number | null> =
  api.sql.overloads["routine:$extension:hstore.hstore_hash($extension:hstore.hstore)"](mapping);
const member42: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:hstore.hstore_le($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member43: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:hstore.hstore_lt($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member44: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:hstore.hstore_ne($extension:hstore.hstore,$extension:hstore.hstore)"
](mapping, mapping);
const member45: SQL<{ readonly hex: string } | null> =
  api.sql.overloads["routine:$extension:hstore.hstore_send($extension:hstore.hstore)"](mapping);
const member46: SQL<PostgreSqlArray<string> | null> =
  api.sql.overloads["routine:$extension:hstore.hstore_to_array($extension:hstore.hstore)"](mapping);
const member47: SQL<JsonDocument | null> =
  api.sql.overloads["routine:$extension:hstore.hstore_to_json_loose($extension:hstore.hstore)"](mapping);
const member48: SQL<JsonDocument | null> =
  api.sql.overloads["routine:$extension:hstore.hstore_to_json($extension:hstore.hstore)"](mapping);
const member49: SQL<JsonbDocument | null> =
  api.sql.overloads["routine:$extension:hstore.hstore_to_jsonb_loose($extension:hstore.hstore)"](mapping);
const member50: SQL<JsonbDocument | null> =
  api.sql.overloads["routine:$extension:hstore.hstore_to_jsonb($extension:hstore.hstore)"](mapping);
const member51: SQL<PostgreSqlArray<string> | null> =
  api.sql.overloads["routine:$extension:hstore.hstore_to_matrix($extension:hstore.hstore)"](mapping);
const member52: SQL<number | null> =
  api.sql.overloads["routine:$extension:hstore.hstore_version_diag($extension:hstore.hstore)"](mapping);
const member53: SQL<HstoreValue | null> = api.sql.overloads[
  "routine:$extension:hstore.hstore(pg_catalog._text,pg_catalog._text)"
](textArray, textArray);
const member54: SQL<HstoreValue | null> =
  api.sql.overloads["routine:$extension:hstore.hstore(pg_catalog._text)"](textArray);
const member55: SQL<HstoreValue | null> = api.sql.overloads[
  "routine:$extension:hstore.hstore(pg_catalog.text,pg_catalog.text)"
]("key", "key");
const member56: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:hstore.isdefined($extension:hstore.hstore,pg_catalog.text)"
](mapping, "key");
const member57: SQL<boolean | null> = api.sql.overloads[
  "routine:$extension:hstore.isexists($extension:hstore.hstore,pg_catalog.text)"
](mapping, "key");
const member58: SQL<string> = api.sql.overloads["routine:$extension:hstore.skeys($extension:hstore.hstore)"](mapping);
const member59: SQL<PostgreSqlArray<string> | null> = api.sql.overloads[
  "routine:$extension:hstore.slice_array($extension:hstore.hstore,pg_catalog._text)"
](mapping, textArray);
const member60: SQL<HstoreValue | null> = api.sql.overloads[
  "routine:$extension:hstore.slice($extension:hstore.hstore,pg_catalog._text)"
](mapping, textArray);
const member61: SQL<string | null> =
  api.sql.overloads["routine:$extension:hstore.svals($extension:hstore.hstore)"](mapping);
const member62: SQL<HstoreValue | null> = api.sql.overloads[
  "routine:$extension:hstore.tconvert(pg_catalog.text,pg_catalog.text)"
]("key", "key");
const nullable: SQL<HstoreValue | null> = api.concat(mapping, null);
const direct: SQL<HstoreValue | null> = api.fromPair(sql<string>`'key'::text`, "value");
const matrix: SQL<PostgreSqlArray<string> | null> = api.toMatrix(mapping);
const namedRows = api.each(mapping);
const key: SQL<string> = namedRows.columns.key;
const value: SQL<string | null> = namedRows.columns.value;
// @ts-expect-error Hstore input is an entries mapping, not a caller-defined result type.
api.get<boolean>(mapping, "key");
// @ts-expect-error Native hash seed is exact bigint.
api.hashExtended(mapping, 1);
// @ts-expect-error Full array dimensions must not be erased.
api.fromArray(["key", "value"]);
// @ts-expect-error Wrong result shape cannot be assigned to an hstore constructor.
const wrong: SQL<string> = api.fromPair("key", "value");
// @ts-expect-error A JSON document result preserves lexical precision, not a JS object.
const dictionary: SQL<Record<string, string>> = api.toJsonLoose(mapping);
// @ts-expect-error Boolean SQL cannot substitute for an hstore operand.
api.concat(sql<boolean>`true`, mapping);
// @ts-expect-error Record construction awaits an exact witness.
api.sql.functions.hstore.fromRecord({ key: "value" });
// @ts-expect-error Polymorphic composite update awaits an exact witness.
api.sql.functions.populate_record(mapping, mapping);
// @ts-expect-error No unsafe generic record operator is exposed.
api.sql.operators["#="]({ key: "value" }, mapping);
// @ts-expect-error Cast target result cannot be chosen by a caller.
api.sql.casts.hstore_to_jsonb<string>(mapping);
// @ts-expect-error Exact version factory only admits 1.8.
createHstore_1_8({ ...api, version: "1.7" });
void [schema, version, nullable, direct, matrix, key, value, wrong, dictionary];
void [
  member0,
  member1,
  member2,
  member3,
  member4,
  member5,
  member6,
  member7,
  member8,
  member9,
  member10,
  member11,
  member12,
  member13,
  member14,
  member15,
  member16,
  member17,
  member18,
  member19,
  member20,
  member21,
  member22,
  member23,
  member24,
  member25,
  member26,
  member27,
  member28,
  member29,
  member30,
  member31,
  member32,
  member33,
  member34,
  member35,
  member36,
  member37,
  member38,
  member39,
  member40,
  member41,
  member42,
  member43,
  member44,
  member45,
  member46,
  member47,
  member48,
  member49,
  member50,
  member51,
  member52,
  member53,
  member54,
  member55,
  member56,
  member57,
  member58,
  member59,
  member60,
  member61,
  member62,
];
