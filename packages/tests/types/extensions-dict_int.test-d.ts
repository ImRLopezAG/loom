import { createDictInt_1_0, dictionaryReference, type DictionaryReference } from "kello/extensions/dict-int";

const descriptor = {
  name: "dict_int",
  version: "1.0",
  schema: 'dict"int',
  apiSupport: { status: "verified", digest: "1a745014cc5c4e94724c34d742b8fb154fe0852306dca4163cc307b8dca9e5da" },
} as const;
const api = createDictInt_1_0(descriptor);
const dictionary: DictionaryReference = api.dictionary;
const same: DictionaryReference = api.intdict;
const name: "intdict_template" = api.template.name;
const init: "routine:$extension:dict_int.dintdict_init(pg_catalog.internal)" = api.template.init;
const schema: 'dict"int' = api.schema;
const version: "1.0" = api.version;
const encoded: string | null = api.options.encode({ maxlen: 4, rejectlong: true });
const parsed = api.options.parse(null);
const maxlen: number = parsed.maxlen;
// @ts-expect-error Exact factory only accepts 1.0.
createDictInt_1_0({ ...descriptor, version: "1.1" });
// @ts-expect-error Init is not a query helper.
api.sql.functions.dintdict_init(null);
// @ts-expect-error Lexize is not a query helper.
api.sql.functions.dintdict_lexize(null, null, null, null);
// @ts-expect-error ts_lexize is not a dict_int member.
api.sql.functions.ts_lexize(api.dictionary, "123");
// @ts-expect-error Plain name objects cannot mint dictionary references.
void dictionaryReference({ schema: 'dict"int' });
// @ts-expect-error Unknown option keys are not portable configuration.
api.options.encode({ rules: "unaccent" });
// @ts-expect-error Template identity is immutable.
api.template.name = "other";
void [dictionary, same, name, init, schema, version, encoded, maxlen];
