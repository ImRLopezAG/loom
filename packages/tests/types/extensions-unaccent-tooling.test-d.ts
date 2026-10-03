import {
  dictionaryReference,
  createUnaccent_1_1,
  type DictionaryReference,
} from "../../../apps/loom/src/core/extensions/adapters/unaccent";
import {
  withUnaccentDictionaries,
  restoreUnaccentDictionary,
} from "../../../apps/loom/src/tooling/extensions/unaccent";
const descriptor = {
  name: "unaccent",
  version: "1.1",
  schema: "extensions",
  apiSupport: { status: "verified", digest: "f983b4bfaa4c974c4ae2eba548249eb86d31d86376d019898b070ff66f9832dd" },
} as const;
const ref = dictionaryReference({ schema: "custom", name: "dictionary" });
void withUnaccentDictionaries("postgresql://operator/fixture", descriptor, async (dictionaries) => {
  const facts = await dictionaries.createDictionary(ref);
  const nominal: DictionaryReference = facts.reference;
  const owner: string = facts.owner;
  const options: string | null = facts.options;
  const template = await dictionaries.inspectTemplate();
  const name: "unaccent" = template.name;
  const member: 'text search template:"$extension:unaccent".unaccent' = template.member;
  createUnaccent_1_1(descriptor).unaccent(nominal, "é");
  await dictionaries.inspectDictionary();
  await dictionaries.inspectDictionary(ref);
  await dictionaries.setRules(ref, "unaccent");
  await dictionaries.reloadRules();
  await dictionaries.reloadRules(ref);
  // @ts-expect-error Facts do not expose mutable owner fields.
  facts.owner = "other";
  // @ts-expect-error Nested template identity is immutable.
  facts.template.name = "other";
  // @ts-expect-error Qualified field copies cannot mint nominal references.
  void dictionaries.createDictionary({ schema: "custom", name: "dictionary" });
  // @ts-expect-error Rules are native installed basenames represented by text.
  void dictionaries.setRules(ref, 1);
  // @ts-expect-error The callback has no raw PostgreSQL client.
  void dictionaries.client;
  // @ts-expect-error The callback has no tracked generic runner.
  void dictionaries.run;
  // @ts-expect-error The callback has no SQL executor.
  void dictionaries.query;
  // @ts-expect-error Template creation is not a Unaccent dictionary capability.
  void dictionaries.createTemplate;
  // @ts-expect-error Method result codecs cannot be user-selected.
  void dictionaries.inspectDictionary<number>();
  void [owner, options, name, member];
});
void restoreUnaccentDictionary("postgresql://operator/fixture", descriptor, new AbortController().signal);
// @ts-expect-error Restoration has a fixed default target, not a caller-selected dictionary.
void restoreUnaccentDictionary("postgresql://operator/fixture", descriptor, ref);
// @ts-expect-error Restoration has exactly three inputs and no alternate rules authority.
void restoreUnaccentDictionary("postgresql://operator/fixture", descriptor, undefined, "alternate");
// @ts-expect-error Runtime bindings expose query capabilities only.
void createUnaccent_1_1(descriptor).restoreUnaccentDictionary;
