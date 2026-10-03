import { sql, type SQL } from "drizzle-orm";
import { createHstoreRecord_1_8 } from "../../../apps/loom/src/core/extensions/hstore-record";
import type { HstoreValue } from "../../../apps/loom/src/core/extensions/hstore-codec";
import { textCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { int4Codec } from "../../../apps/loom/src/core/extensions/native-codecs";
import { defineSchema } from "../../../apps/loom/src/core/schema/define-schema";
import type { Id } from "../../../apps/loom/src/core/schema/fields";

const api = createHstoreRecord_1_8({
  name: "hstore",
  version: "1.8",
  schema: "extensions",
  apiSupport: { status: "verified", digest: "cea995a9f416f391e531e262624a397016d7fc562ef1c78cb7247dd76d98daf1" },
});
const schema = defineSchema((field) => ({
  people: { name: field.text().notNull(), status: field.enum(["open", "closed"]).notNull(), amount: field.numeric() },
}));
// Named witnesses are constructed within a managed RPC invocation at runtime.
function checkedTypes() {
  const row = api.record.tableRow(schema, "people");
  const type = api.record.tableType(schema, "people");
  const hstore: SQL<HstoreValue> = api.fromRecord(type);
  const value = api.populateRecord(type, { entries: [] });
  const id: SQL<Id<"people"> | null> = value.fields._id;
  const created: SQL<number | null> = value.fields._createdAt;
  const name: SQL<string | null> = value.fields.name;
  const status: SQL<"open" | "closed" | null> = value.fields.status;
  const amount: SQL<string | null> = value.fields.amount;
  const nameAttribute: string = value.attributes.name;
  const replaced: SQL<string | null> = api.sql.operators["#="](row, null).fields.name;
  const original: SQL<HstoreValue> = api.sql.overloads["routine:$extension:hstore.hstore(pg_catalog.record)"](row);
  const populated: SQL<"open" | "closed" | null> = api.sql.overloads[
    "routine:$extension:hstore.populate_record(pg_catalog.anyelement,$extension:hstore.hstore)"
  ](type, null).fields.status;
  const canonical: SQL<Id<"people"> | null> = api.sql.overloads[
    "operator:$extension:hstore.#=(pg_catalog.anyelement,$extension:hstore.hstore)"
  ](row, null).fields._id;
  const anonymous = api.record.anonymousRow([
    [int4Codec, 1],
    [textCodec, schema.tables.people.name],
  ] as const);
  const anonymousHstore: SQL<HstoreValue> = api.fromRecord(anonymous);
  // @ts-expect-error Every composite field is nullable, including notNull table fields.
  const nonNullName: SQL<string> = value.fields.name;
  // @ts-expect-error A record witness cannot be supplied as an untyped SQL value.
  api.populateRecord(sql`null`, null);
  // @ts-expect-error Anonymous rewrites require a separate reviewed output witness.
  api.populateRecord(anonymous, null);
  // @ts-expect-error The operator does not decode arbitrary anonymous records.
  api.sql.operators["#="](anonymous, null);
  // @ts-expect-error Real schema entity keys constrain table types.
  api.record.tableType(schema, "missing");
  // @ts-expect-error Real schema entity keys constrain whole rows.
  api.record.tableRow(schema, "missing");
  // @ts-expect-error There is no caller result generic for hstore(record).
  api.fromRecord<{ forged: true }>(row);
  // @ts-expect-error A caller result shape is not a witnessed PgTable.
  api.populateRecord<{ forged: string }>(row, null);
  const unrelated = defineSchema((field) => ({ other: { count: field.integer() } }));
  // @ts-expect-error Even an explicit real but unrelated table cannot replace the witnessed result type.
  api.populateRecord<typeof unrelated.tables.other>(row, null);
  // @ts-expect-error An hstore value is not a named composite witness.
  api.populateRecord({ entries: [] }, null);
  const extensionCodec = { ...textCodec, sqlType: { schema: "extensions", name: "citext" } } as const;
  // @ts-expect-error Explicit extension type I/O metadata is not an anonymous built-in witness.
  api.record.anonymousRow([[extensionCodec, "value"]] as const);
  const regclassCodec = { ...textCodec, sqlType: { schema: "pg_catalog", name: "regclass" } } as const;
  // @ts-expect-error A pg_catalog namespace alone does not prove the type I/O is reviewed.
  api.record.anonymousRow([[regclassCodec, "value"]] as const);
  const extensionArray = { ...textCodec, sqlType: { schema: "extensions", name: "citext", array: true } } as const;
  // @ts-expect-error Array leaves require the same reviewed built-in type authority.
  api.record.anonymousRow([[extensionArray, "value"]] as const);
  // @ts-expect-error The element codec constrains its anonymous input value.
  api.record.anonymousRow([[int4Codec, "wrong"]] as const);
  return {
    hstore,
    id,
    created,
    name,
    status,
    amount,
    nameAttribute,
    replaced,
    original,
    populated,
    canonical,
    anonymousHstore,
    nonNullName,
  };
}
void checkedTypes;
