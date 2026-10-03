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

// Compile the two closed public package entries in the same physical declaration graph.
// This file is never executed by the type gate host.
import {
  createUnaccent_1_1 as createPublicUnaccent,
  dictionaryReference as publicDictionaryReference,
  type DictionaryReference as PublicDictionaryReference,
} from "loom/extensions/unaccent";
import { withUnaccentDictionaries as withPublicDictionaries, restoreUnaccentDictionary as restorePublicDictionary }
  from "loom/tooling/extensions/unaccent";
const publicDescriptor = {
  name: "unaccent", version: "1.1", schema: 'public"accents',
  apiSupport: { status: "verified", digest: "f983b4bfaa4c974c4ae2eba548249eb86d31d86376d019898b070ff66f9832dd" },
} as const;
const publicBinding = createPublicUnaccent(publicDescriptor);
const publicReference = publicDictionaryReference({ schema: "custom", name: "dictionary" });
const publicImplicit: SQL<string | null> = publicBinding.unaccent(table.optional);
const publicExplicit: SQL<string | null> = publicBinding.unaccent(publicReference, table.title);
const publicNulls: SQL<string | null> = publicBinding.unaccent(null, null);
const publicSchema: 'public"accents' = publicBinding.schema;
// @ts-expect-error Native null propagation prevents a nonnullable result promise.
const publicNonnullable: SQL<string> = publicBinding.unaccent(table.title);
// @ts-expect-error Public dictionary admission remains nominal.
publicBinding.unaccent({ schema: publicReference.schema, name: publicReference.name }, "é");
// @ts-expect-error Numeric columns are not text inputs in the public declaration.
publicBinding.unaccent(table.count);
// @ts-expect-error Internal callbacks are absent from the public query surface.
void publicBinding.sql.functions.unaccent_lexize;
// @ts-expect-error Public runtime bindings do not expose maintenance.
void publicBinding.createDictionary;
void withPublicDictionaries("postgresql://operator/fixture", publicDescriptor, async (dictionaries) => {
  const facts = await dictionaries.createDictionary(publicReference);
  const transferred: PublicDictionaryReference = facts.reference;
  const result: SQL<string | null> = publicBinding.unaccent(transferred, null);
  const owner: string = facts.owner;
  const options: string | null = facts.options;
  const template = await dictionaries.inspectTemplate();
  const member: 'text search template:"$extension:unaccent".unaccent' = template.member;
  await dictionaries.inspectDictionary(publicBinding.dictionary);
  await dictionaries.setRules(publicReference, "unaccent");
  await dictionaries.reloadRules(publicReference);
  // @ts-expect-error Inspection facts cannot confer mutable owner authority.
  facts.owner = "other";
  // @ts-expect-error Public tooling has no raw SQL escape hatch.
  void dictionaries.query;
  // @ts-expect-error Qualified field copies cannot mint a public nominal reference.
  void dictionaries.createDictionary({ schema: "custom", name: "dictionary" });
  // @ts-expect-error Results are determined by captured facts, not a caller's generic.
  void dictionaries.inspectDictionary<number>();
  void [result, owner, options, member];
});
void restorePublicDictionary("postgresql://operator/fixture", publicDescriptor, new AbortController().signal);
// @ts-expect-error Restoration cannot select a different dictionary target.
void restorePublicDictionary("postgresql://operator/fixture", publicDescriptor, publicReference);
void [publicImplicit, publicExplicit, publicNulls, publicSchema, publicNonnullable];
