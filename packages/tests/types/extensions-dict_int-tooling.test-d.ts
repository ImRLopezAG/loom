import { dictionaryReference, createDictInt_1_0, type DictionaryReference } from "kello/extensions/dict-int";
import { withDictIntDictionaries } from "kello/tooling/extensions/dict-int";

const descriptor = {
  name: "dict_int",
  version: "1.0",
  schema: "extensions",
  apiSupport: { status: "verified", digest: "1a745014cc5c4e94724c34d742b8fb154fe0852306dca4163cc307b8dca9e5da" },
} as const;
const ref = dictionaryReference({ schema: "custom", name: "digits" });
void withDictIntDictionaries("postgresql://operator/fixture", descriptor, async (dictionaries) => {
  const facts = await dictionaries.createDictionary(ref, { maxlen: 4, rejectlong: true, absval: false });
  const nominal: DictionaryReference = facts.reference;
  const owner: string = facts.owner;
  const options: string | null = facts.options;
  const maxlen: number = facts.parsed.maxlen;
  const template = await dictionaries.inspectTemplate();
  const name: "intdict_template" = template.name;
  const member: 'text search template:"$extension:dict_int".intdict_template' = template.member;
  const init: "routine:$extension:dict_int.dintdict_init(pg_catalog.internal)" = template.init;
  await dictionaries.inspectDictionary();
  await dictionaries.inspectDictionary(ref);
  await dictionaries.alterDictionary(ref, { absval: true });
  createDictInt_1_0(descriptor);
  // @ts-expect-error Facts do not expose mutable owner fields.
  facts.owner = "other";
  // @ts-expect-error Nested template identity is immutable.
  facts.template.name = "other";
  // @ts-expect-error Qualified field copies cannot mint nominal references.
  void dictionaries.createDictionary({ schema: "custom", name: "digits" });
  // @ts-expect-error Options are structured, not a rules basename.
  void dictionaries.alterDictionary(ref, "maxlen");
  // @ts-expect-error The callback has no raw PostgreSQL client.
  void dictionaries.client;
  // @ts-expect-error Init/lexize are not tooling methods.
  void dictionaries.dintdict_init;
  // @ts-expect-error Template creation is not a dict_int dictionary capability.
  void dictionaries.createTemplate;
  // @ts-expect-error Method result codecs cannot be user-selected.
  void dictionaries.inspectDictionary<number>();
  void [nominal, owner, options, maxlen, name, member, init];
});
// @ts-expect-error Runtime bindings expose identities only.
void createDictInt_1_0(descriptor).withDictIntDictionaries;
