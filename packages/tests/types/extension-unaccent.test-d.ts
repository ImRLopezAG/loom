import type { SQL } from "drizzle-orm";
import { pgTable, text, integer, boolean } from "drizzle-orm/pg-core";
import { createUnaccent_1_1, dictionaryReference } from "../../../apps/loom/src/core/extensions/adapters/unaccent";

const table = pgTable("documents", { title: text().notNull(), optional: text(), count: integer(), enabled: boolean() });
const extension = createUnaccent_1_1({
  name: "unaccent",
  version: "1.1",
  schema: "accents",
  apiSupport: { status: "verified", digest: "f983b4bfaa4c974c4ae2eba548249eb86d31d86376d019898b070ff66f9832dd" },
});
const selected: "accents" = extension.schema;
const ordinary: SQL<string | null> = extension.unaccent(table.title);
const nullable: SQL<string | null> = extension.unaccent(table.optional);
const explicit: SQL<string | null> = extension.unaccent(extension.dictionary, table.title);
const canonical: SQL<string | null> = extension.sql.functions.unaccent(
  dictionaryReference({ schema: "custom", name: "dictionary" }),
  "Æther",
);
extension.unaccent(null);
extension.unaccent(null, "é");
extension.unaccent(extension.dictionary, null);
// @ts-expect-error A qualified reference comes from the nominal factory, never raw OIDs.
extension.unaccent(123, "é");
// @ts-expect-error A plain qualified-name object cannot impersonate a dictionary reference.
extension.unaccent({ schema: "accents", name: "unaccent" }, "é");
// @ts-expect-error A text string is not a dictionary identity.
extension.unaccent("accents.unaccent", "é");
// @ts-expect-error Text inputs reject numeric columns.
extension.unaccent(table.count);
// @ts-expect-error Text inputs reject boolean columns even in the explicit overload.
extension.unaccent(extension.dictionary, table.enabled);
// @ts-expect-error SQL helpers expose exactly one or two native arguments.
extension.unaccent();
// @ts-expect-error Extra arguments are not captured overloads.
extension.unaccent(extension.dictionary, "é", "extra");
// @ts-expect-error User-selected result generic casts do not exist.
extension.unaccent<number>("é");
// @ts-expect-error An input identity factory is not a numeric OID encoder.
dictionaryReference(123);
// @ts-expect-error Privileged callbacks are not application methods.
void extension.sql.functions.unaccent_init;
// @ts-expect-error Dictionary maintenance does not belong to context.
void extension.createDictionary;
createUnaccent_1_1({
  name: "unaccent",
  // @ts-expect-error Exact factory versions cannot silently widen.
  version: "1.0",
  schema: "accents",
  apiSupport: { status: "verified", digest: "f983b4bfaa4c974c4ae2eba548249eb86d31d86376d019898b070ff66f9832dd" },
});
void [selected, ordinary, nullable, explicit, canonical];
