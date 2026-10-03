import pg from "pg";
import { defineRelations, type SQL } from "drizzle-orm";
import { createHstore_1_8 } from "../../../apps/loom/src/core/extensions/adapters/hstore";
import type { PostgreSqlArray } from "../../../apps/loom/src/core/extensions/codecs";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import { connectDatabase, type DatabaseConnection } from "../../../apps/loom/src/core/server/database/connection";
import { hstoreSchema, hstoreType, hstoreFunction, nativeHstoreParameters, withNativeHstore } from "./hstore-codec";

export const hstoreApi = createHstore_1_8({
  name: "hstore",
  version: "1.8",
  schema: hstoreSchema,
  apiSupport: { status: "verified", digest: "cea995a9f416f391e531e262624a397016d7fc562ef1c78cb7247dd76d98daf1" },
});
const quotedSchema = pg.escapeIdentifier(hstoreSchema);
export const mapping = hstoreApi.value([
  { key: "stored", value: null },
  { key: "string", value: "NULL" },
  { key: "key", value: "日本'\\\";--" },
  { key: "__proto__", value: "data" },
]);
export const other = hstoreApi.value([
  { key: "stored", value: null },
  { key: "new", value: "new" },
]);
export const textArray: PostgreSqlArray<string> = {
  dimensions: [{ lowerBound: -2, length: 2 }],
  values: ["key", "value"],
};

export interface HstoreQueryCase {
  readonly member: string;
  readonly kind:
    | "hstore"
    | "array"
    | "each"
    | "binary"
    | "bigint"
    | "textSet"
    | "text"
    | "bool"
    | "int4"
    | "json"
    | "jsonb";
  readonly expression: SQL;
  readonly native: string;
}
// Separately qualified native expressions use constructor-produced inputs, not adapter serialization.
export function portableHstoreCases(api = hstoreApi): readonly HstoreQueryCase[] {
  return [
    {
      member: "cast:$extension:hstore.hstore->pg_catalog.json",
      kind: "json",
      expression: api.sql.overloads["cast:$extension:hstore.hstore->pg_catalog.json"](mapping),
      native: `lhs::pg_catalog.json`,
    },
    {
      member: "cast:$extension:hstore.hstore->pg_catalog.jsonb",
      kind: "jsonb",
      expression: api.sql.overloads["cast:$extension:hstore.hstore->pg_catalog.jsonb"](mapping),
      native: `lhs::pg_catalog.jsonb`,
    },
    {
      member: "cast:pg_catalog._text->$extension:hstore.hstore",
      kind: "hstore",
      expression: api.sql.overloads["cast:pg_catalog._text->$extension:hstore.hstore"](textArray),
      native: `tags::${hstoreType}`,
    },
    {
      member: "operator:$extension:hstore.-($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "hstore",
      expression: api.sql.overloads["operator:$extension:hstore.-($extension:hstore.hstore,$extension:hstore.hstore)"](
        mapping,
        other,
      ),
      native: `(lhs operator(${quotedSchema}.-) rhs)`,
    },
    {
      member: "operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog._text)",
      kind: "hstore",
      expression: api.sql.overloads["operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog._text)"](
        mapping,
        textArray,
      ),
      native: `(lhs operator(${quotedSchema}.-) tags)`,
    },
    {
      member: "operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog.text)",
      kind: "hstore",
      expression: api.sql.overloads["operator:$extension:hstore.-($extension:hstore.hstore,pg_catalog.text)"](
        mapping,
        "key",
      ),
      native: `(lhs operator(${quotedSchema}.-) keyarg)`,
    },
    {
      member: "operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog._text)",
      kind: "array",
      expression: api.sql.overloads["operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog._text)"](
        mapping,
        textArray,
      ),
      native: `(lhs operator(${quotedSchema}.->) tags)`,
    },
    {
      member: "operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog.text)",
      kind: "text",
      expression: api.sql.overloads["operator:$extension:hstore.->($extension:hstore.hstore,pg_catalog.text)"](
        mapping,
        "key",
      ),
      native: `(lhs operator(${quotedSchema}.->) keyarg)`,
    },
    {
      member: "operator:$extension:hstore.?($extension:hstore.hstore,pg_catalog.text)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:hstore.?($extension:hstore.hstore,pg_catalog.text)"](
        mapping,
        "key",
      ),
      native: `(lhs operator(${quotedSchema}.?) keyarg)`,
    },
    {
      member: "operator:$extension:hstore.?&($extension:hstore.hstore,pg_catalog._text)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:hstore.?&($extension:hstore.hstore,pg_catalog._text)"](
        mapping,
        textArray,
      ),
      native: `(lhs operator(${quotedSchema}.?&) tags)`,
    },
    {
      member: "operator:$extension:hstore.?|($extension:hstore.hstore,pg_catalog._text)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:hstore.?|($extension:hstore.hstore,pg_catalog._text)"](
        mapping,
        textArray,
      ),
      native: `(lhs operator(${quotedSchema}.?|) tags)`,
    },
    {
      member: "operator:$extension:hstore.@>($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:hstore.@>($extension:hstore.hstore,$extension:hstore.hstore)"](
        mapping,
        other,
      ),
      native: `(lhs operator(${quotedSchema}.@>) rhs)`,
    },
    {
      member: "operator:$extension:hstore.#<#($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "bool",
      expression: api.sql.overloads[
        "operator:$extension:hstore.#<#($extension:hstore.hstore,$extension:hstore.hstore)"
      ](mapping, other),
      native: `(lhs operator(${quotedSchema}.#<#) rhs)`,
    },
    {
      member: "operator:$extension:hstore.#<=#($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "bool",
      expression: api.sql.overloads[
        "operator:$extension:hstore.#<=#($extension:hstore.hstore,$extension:hstore.hstore)"
      ](mapping, other),
      native: `(lhs operator(${quotedSchema}.#<=#) rhs)`,
    },
    {
      member: "operator:$extension:hstore.#>#($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "bool",
      expression: api.sql.overloads[
        "operator:$extension:hstore.#>#($extension:hstore.hstore,$extension:hstore.hstore)"
      ](mapping, other),
      native: `(lhs operator(${quotedSchema}.#>#) rhs)`,
    },
    {
      member: "operator:$extension:hstore.#>=#($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "bool",
      expression: api.sql.overloads[
        "operator:$extension:hstore.#>=#($extension:hstore.hstore,$extension:hstore.hstore)"
      ](mapping, other),
      native: `(lhs operator(${quotedSchema}.#>=#) rhs)`,
    },
    {
      member: "operator:$extension:hstore.%#(,$extension:hstore.hstore)",
      kind: "array",
      expression: api.sql.overloads["operator:$extension:hstore.%#(,$extension:hstore.hstore)"](mapping),
      native: `(operator(${quotedSchema}.%#) lhs)`,
    },
    {
      member: "operator:$extension:hstore.%%(,$extension:hstore.hstore)",
      kind: "array",
      expression: api.sql.overloads["operator:$extension:hstore.%%(,$extension:hstore.hstore)"](mapping),
      native: `(operator(${quotedSchema}.%%) lhs)`,
    },
    {
      member: "operator:$extension:hstore.<@($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:hstore.<@($extension:hstore.hstore,$extension:hstore.hstore)"](
        mapping,
        other,
      ),
      native: `(lhs operator(${quotedSchema}.<@) rhs)`,
    },
    {
      member: "operator:$extension:hstore.<>($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:hstore.<>($extension:hstore.hstore,$extension:hstore.hstore)"](
        mapping,
        other,
      ),
      native: `(lhs operator(${quotedSchema}.<>) rhs)`,
    },
    {
      member: "operator:$extension:hstore.=($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "bool",
      expression: api.sql.overloads["operator:$extension:hstore.=($extension:hstore.hstore,$extension:hstore.hstore)"](
        mapping,
        other,
      ),
      native: `(lhs operator(${quotedSchema}.=) rhs)`,
    },
    {
      member: "operator:$extension:hstore.||($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "hstore",
      expression: api.sql.overloads["operator:$extension:hstore.||($extension:hstore.hstore,$extension:hstore.hstore)"](
        mapping,
        other,
      ),
      native: `(lhs operator(${quotedSchema}.||) rhs)`,
    },
    {
      member: "routine:$extension:hstore.akeys($extension:hstore.hstore)",
      kind: "array",
      expression: api.sql.overloads["routine:$extension:hstore.akeys($extension:hstore.hstore)"](mapping),
      native: `${hstoreFunction("akeys")}(lhs)`,
    },
    {
      member: "routine:$extension:hstore.avals($extension:hstore.hstore)",
      kind: "array",
      expression: api.sql.overloads["routine:$extension:hstore.avals($extension:hstore.hstore)"](mapping),
      native: `${hstoreFunction("avals")}(lhs)`,
    },
    {
      member: "routine:$extension:hstore.defined($extension:hstore.hstore,pg_catalog.text)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:hstore.defined($extension:hstore.hstore,pg_catalog.text)"](
        mapping,
        "key",
      ),
      native: `${hstoreFunction("defined")}(lhs,keyarg)`,
    },
    {
      member: "routine:$extension:hstore.delete($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "hstore",
      expression: api.sql.overloads[
        "routine:$extension:hstore.delete($extension:hstore.hstore,$extension:hstore.hstore)"
      ](mapping, other),
      native: `${hstoreFunction("delete")}(lhs,rhs)`,
    },
    {
      member: "routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog._text)",
      kind: "hstore",
      expression: api.sql.overloads["routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog._text)"](
        mapping,
        textArray,
      ),
      native: `${hstoreFunction("delete")}(lhs,tags)`,
    },
    {
      member: "routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog.text)",
      kind: "hstore",
      expression: api.sql.overloads["routine:$extension:hstore.delete($extension:hstore.hstore,pg_catalog.text)"](
        mapping,
        "key",
      ),
      native: `${hstoreFunction("delete")}(lhs,keyarg)`,
    },
    {
      member: "routine:$extension:hstore.each($extension:hstore.hstore)",
      kind: "each",
      expression: api.sql.overloads["routine:$extension:hstore.each($extension:hstore.hstore)"](mapping),
      native: `${hstoreFunction("each")}(lhs)`,
    },
    {
      member: "routine:$extension:hstore.exist($extension:hstore.hstore,pg_catalog.text)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:hstore.exist($extension:hstore.hstore,pg_catalog.text)"](
        mapping,
        "key",
      ),
      native: `${hstoreFunction("exist")}(lhs,keyarg)`,
    },
    {
      member: "routine:$extension:hstore.exists_all($extension:hstore.hstore,pg_catalog._text)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:hstore.exists_all($extension:hstore.hstore,pg_catalog._text)"](
        mapping,
        textArray,
      ),
      native: `${hstoreFunction("exists_all")}(lhs,tags)`,
    },
    {
      member: "routine:$extension:hstore.exists_any($extension:hstore.hstore,pg_catalog._text)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:hstore.exists_any($extension:hstore.hstore,pg_catalog._text)"](
        mapping,
        textArray,
      ),
      native: `${hstoreFunction("exists_any")}(lhs,tags)`,
    },
    {
      member: "routine:$extension:hstore.fetchval($extension:hstore.hstore,pg_catalog.text)",
      kind: "text",
      expression: api.sql.overloads["routine:$extension:hstore.fetchval($extension:hstore.hstore,pg_catalog.text)"](
        mapping,
        "key",
      ),
      native: `${hstoreFunction("fetchval")}(lhs,keyarg)`,
    },
    {
      member: "routine:$extension:hstore.hs_concat($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "hstore",
      expression: api.sql.overloads[
        "routine:$extension:hstore.hs_concat($extension:hstore.hstore,$extension:hstore.hstore)"
      ](mapping, other),
      native: `${hstoreFunction("hs_concat")}(lhs,rhs)`,
    },
    {
      member: "routine:$extension:hstore.hs_contained($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "bool",
      expression: api.sql.overloads[
        "routine:$extension:hstore.hs_contained($extension:hstore.hstore,$extension:hstore.hstore)"
      ](mapping, other),
      native: `${hstoreFunction("hs_contained")}(lhs,rhs)`,
    },
    {
      member: "routine:$extension:hstore.hs_contains($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "bool",
      expression: api.sql.overloads[
        "routine:$extension:hstore.hs_contains($extension:hstore.hstore,$extension:hstore.hstore)"
      ](mapping, other),
      native: `${hstoreFunction("hs_contains")}(lhs,rhs)`,
    },
    {
      member: "routine:$extension:hstore.hstore_cmp($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "int4",
      expression: api.sql.overloads[
        "routine:$extension:hstore.hstore_cmp($extension:hstore.hstore,$extension:hstore.hstore)"
      ](mapping, other),
      native: `${hstoreFunction("hstore_cmp")}(lhs,rhs)`,
    },
    {
      member: "routine:$extension:hstore.hstore_eq($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "bool",
      expression: api.sql.overloads[
        "routine:$extension:hstore.hstore_eq($extension:hstore.hstore,$extension:hstore.hstore)"
      ](mapping, other),
      native: `${hstoreFunction("hstore_eq")}(lhs,rhs)`,
    },
    {
      member: "routine:$extension:hstore.hstore_ge($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "bool",
      expression: api.sql.overloads[
        "routine:$extension:hstore.hstore_ge($extension:hstore.hstore,$extension:hstore.hstore)"
      ](mapping, other),
      native: `${hstoreFunction("hstore_ge")}(lhs,rhs)`,
    },
    {
      member: "routine:$extension:hstore.hstore_gt($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "bool",
      expression: api.sql.overloads[
        "routine:$extension:hstore.hstore_gt($extension:hstore.hstore,$extension:hstore.hstore)"
      ](mapping, other),
      native: `${hstoreFunction("hstore_gt")}(lhs,rhs)`,
    },
    {
      member: "routine:$extension:hstore.hstore_hash_extended($extension:hstore.hstore,pg_catalog.int8)",
      kind: "bigint",
      expression: api.sql.overloads[
        "routine:$extension:hstore.hstore_hash_extended($extension:hstore.hstore,pg_catalog.int8)"
      ](mapping, 1n),
      native: `${hstoreFunction("hstore_hash_extended")}(lhs,1::pg_catalog.int8)`,
    },
    {
      member: "routine:$extension:hstore.hstore_hash($extension:hstore.hstore)",
      kind: "int4",
      expression: api.sql.overloads["routine:$extension:hstore.hstore_hash($extension:hstore.hstore)"](mapping),
      native: `${hstoreFunction("hstore_hash")}(lhs)`,
    },
    {
      member: "routine:$extension:hstore.hstore_le($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "bool",
      expression: api.sql.overloads[
        "routine:$extension:hstore.hstore_le($extension:hstore.hstore,$extension:hstore.hstore)"
      ](mapping, other),
      native: `${hstoreFunction("hstore_le")}(lhs,rhs)`,
    },
    {
      member: "routine:$extension:hstore.hstore_lt($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "bool",
      expression: api.sql.overloads[
        "routine:$extension:hstore.hstore_lt($extension:hstore.hstore,$extension:hstore.hstore)"
      ](mapping, other),
      native: `${hstoreFunction("hstore_lt")}(lhs,rhs)`,
    },
    {
      member: "routine:$extension:hstore.hstore_ne($extension:hstore.hstore,$extension:hstore.hstore)",
      kind: "bool",
      expression: api.sql.overloads[
        "routine:$extension:hstore.hstore_ne($extension:hstore.hstore,$extension:hstore.hstore)"
      ](mapping, other),
      native: `${hstoreFunction("hstore_ne")}(lhs,rhs)`,
    },
    {
      member: "routine:$extension:hstore.hstore_send($extension:hstore.hstore)",
      kind: "binary",
      expression: api.sql.overloads["routine:$extension:hstore.hstore_send($extension:hstore.hstore)"](mapping),
      native: `${hstoreFunction("hstore_send")}(lhs)`,
    },
    {
      member: "routine:$extension:hstore.hstore_to_array($extension:hstore.hstore)",
      kind: "array",
      expression: api.sql.overloads["routine:$extension:hstore.hstore_to_array($extension:hstore.hstore)"](mapping),
      native: `${hstoreFunction("hstore_to_array")}(lhs)`,
    },
    {
      member: "routine:$extension:hstore.hstore_to_json_loose($extension:hstore.hstore)",
      kind: "json",
      expression:
        api.sql.overloads["routine:$extension:hstore.hstore_to_json_loose($extension:hstore.hstore)"](mapping),
      native: `${hstoreFunction("hstore_to_json_loose")}(lhs)`,
    },
    {
      member: "routine:$extension:hstore.hstore_to_json($extension:hstore.hstore)",
      kind: "json",
      expression: api.sql.overloads["routine:$extension:hstore.hstore_to_json($extension:hstore.hstore)"](mapping),
      native: `${hstoreFunction("hstore_to_json")}(lhs)`,
    },
    {
      member: "routine:$extension:hstore.hstore_to_jsonb_loose($extension:hstore.hstore)",
      kind: "jsonb",
      expression:
        api.sql.overloads["routine:$extension:hstore.hstore_to_jsonb_loose($extension:hstore.hstore)"](mapping),
      native: `${hstoreFunction("hstore_to_jsonb_loose")}(lhs)`,
    },
    {
      member: "routine:$extension:hstore.hstore_to_jsonb($extension:hstore.hstore)",
      kind: "jsonb",
      expression: api.sql.overloads["routine:$extension:hstore.hstore_to_jsonb($extension:hstore.hstore)"](mapping),
      native: `${hstoreFunction("hstore_to_jsonb")}(lhs)`,
    },
    {
      member: "routine:$extension:hstore.hstore_to_matrix($extension:hstore.hstore)",
      kind: "array",
      expression: api.sql.overloads["routine:$extension:hstore.hstore_to_matrix($extension:hstore.hstore)"](mapping),
      native: `${hstoreFunction("hstore_to_matrix")}(lhs)`,
    },
    {
      member: "routine:$extension:hstore.hstore_version_diag($extension:hstore.hstore)",
      kind: "int4",
      expression: api.sql.overloads["routine:$extension:hstore.hstore_version_diag($extension:hstore.hstore)"](mapping),
      native: `${hstoreFunction("hstore_version_diag")}(lhs)`,
    },
    {
      member: "routine:$extension:hstore.hstore(pg_catalog._text,pg_catalog._text)",
      kind: "hstore",
      expression: api.sql.overloads["routine:$extension:hstore.hstore(pg_catalog._text,pg_catalog._text)"](
        textArray,
        textArray,
      ),
      native: `${hstoreFunction("hstore")}(tags,tags)`,
    },
    {
      member: "routine:$extension:hstore.hstore(pg_catalog._text)",
      kind: "hstore",
      expression: api.sql.overloads["routine:$extension:hstore.hstore(pg_catalog._text)"](textArray),
      native: `${hstoreFunction("hstore")}(tags)`,
    },
    {
      member: "routine:$extension:hstore.hstore(pg_catalog.text,pg_catalog.text)",
      kind: "hstore",
      expression: api.sql.overloads["routine:$extension:hstore.hstore(pg_catalog.text,pg_catalog.text)"]("key", "key"),
      native: `${hstoreFunction("hstore")}(keyarg,keyarg)`,
    },
    {
      member: "routine:$extension:hstore.isdefined($extension:hstore.hstore,pg_catalog.text)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:hstore.isdefined($extension:hstore.hstore,pg_catalog.text)"](
        mapping,
        "key",
      ),
      native: `${hstoreFunction("isdefined")}(lhs,keyarg)`,
    },
    {
      member: "routine:$extension:hstore.isexists($extension:hstore.hstore,pg_catalog.text)",
      kind: "bool",
      expression: api.sql.overloads["routine:$extension:hstore.isexists($extension:hstore.hstore,pg_catalog.text)"](
        mapping,
        "key",
      ),
      native: `${hstoreFunction("isexists")}(lhs,keyarg)`,
    },
    {
      member: "routine:$extension:hstore.skeys($extension:hstore.hstore)",
      kind: "textSet",
      expression: api.sql.overloads["routine:$extension:hstore.skeys($extension:hstore.hstore)"](mapping),
      native: `${hstoreFunction("skeys")}(lhs)`,
    },
    {
      member: "routine:$extension:hstore.slice_array($extension:hstore.hstore,pg_catalog._text)",
      kind: "array",
      expression: api.sql.overloads["routine:$extension:hstore.slice_array($extension:hstore.hstore,pg_catalog._text)"](
        mapping,
        textArray,
      ),
      native: `${hstoreFunction("slice_array")}(lhs,tags)`,
    },
    {
      member: "routine:$extension:hstore.slice($extension:hstore.hstore,pg_catalog._text)",
      kind: "hstore",
      expression: api.sql.overloads["routine:$extension:hstore.slice($extension:hstore.hstore,pg_catalog._text)"](
        mapping,
        textArray,
      ),
      native: `${hstoreFunction("slice")}(lhs,tags)`,
    },
    {
      member: "routine:$extension:hstore.svals($extension:hstore.hstore)",
      kind: "textSet",
      expression: api.sql.overloads["routine:$extension:hstore.svals($extension:hstore.hstore)"](mapping),
      native: `${hstoreFunction("svals")}(lhs)`,
    },
    {
      member: "routine:$extension:hstore.tconvert(pg_catalog.text,pg_catalog.text)",
      kind: "hstore",
      expression: api.sql.overloads["routine:$extension:hstore.tconvert(pg_catalog.text,pg_catalog.text)"](
        "key",
        "key",
      ),
      native: `${hstoreFunction("tconvert")}(keyarg,keyarg)`,
    },
  ];
}
const schema = defineSchema(() => ({}));
const relations = defineRelations(schema.tables);
type Connection = DatabaseConnection<typeof relations>;
export async function withHstoreApi(
  operation: (fixture: {
    readonly client: pg.Client;
    readonly connection: Connection;
    readonly api: typeof hstoreApi;
  }) => Promise<void>,
) {
  await withNativeHstore(async (client, url) => {
    await client.query(
      `create table portable_native_inputs(lhs ${hstoreType},rhs ${hstoreType},tags text[],keyarg text)`,
    );
    await client.query(
      `insert into portable_native_inputs values (${hstoreFunction("hstore")}($1::text[],$2::text[]),${hstoreFunction("hstore")}($3::text[],$4::text[]),$5::text[],$6::text)`,
      [
        ...nativeHstoreParameters(mapping.entries),
        ...nativeHstoreParameters(other.entries),
        '[-2:-1]={"key","value"}',
        "key",
      ],
    );
    const connection = await connectDatabase({ schema, relations, connectionString: url });
    try {
      await operation({ client, connection, api: hstoreApi });
    } finally {
      await connection.close();
    }
  });
}
