import { expectTypeOf } from "vite-plus/test";
import { type SQL } from "drizzle-orm";
import {
  createLakebaseTokenizer_0_1_1,
  dictionaryReference,
  type LakebaseTokenizerStopword,
  type LakebaseTokenizerSynonym,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/adapters/lakebase_tokenizer";
import {
  planLakebaseTokenizerDictionary,
  withLakebaseTokenizer,
} from "../../../apps/loom/src/tooling/extensions/operations/lakebase_tokenizer";

const descriptor = {
  name: "lakebase_tokenizer",
  version: "0.1.1",
  schema: "tokenizer_custom",
  apiSupport: { status: "verified", digest: "b57e5d3240d67c933ba1a2665c2fd347f72df94f159f16a4d6c7ebeb8e7d7ef8" },
} as const;
const api = createLakebaseTokenizer_0_1_1(descriptor);
const dictionary = dictionaryReference({ schema: "app", name: "words" });
expectTypeOf(api.version).toEqualTypeOf<"0.1.1">();
expectTypeOf(api.schema).toEqualTypeOf<"tokenizer_custom">();
expectTypeOf(api.lexize(dictionary, "Running")).toEqualTypeOf<SQL<PostgreSqlArray<string> | null>>();
expectTypeOf(api.sql.functions.ts_lexize(null, null)).toEqualTypeOf<SQL<PostgreSqlArray<string> | null>>();
expectTypeOf(api.codecs.stopword.decode("(named,word)")).toEqualTypeOf<LakebaseTokenizerStopword>();
expectTypeOf(api.codecs.synonym.decode("(named,word,synonym)")).toEqualTypeOf<LakebaseTokenizerSynonym>();
expectTypeOf(api.codecs.stopwordArray.decode("{}")).toEqualTypeOf<PostgreSqlArray<LakebaseTokenizerStopword>>();
expectTypeOf(api.stopwords("sw").columns.word).toEqualTypeOf<SQL<string>>();
expectTypeOf(api.synonyms("syn").columns.synonym).toEqualTypeOf<SQL<string>>();
planLakebaseTokenizerDictionary(descriptor, dictionary, "alter", { normalize: "NFC", stemmer: null });
void withLakebaseTokenizer;
function compileOnly() {
  // @ts-expect-error The selected factory cannot admit another extension version.
  createLakebaseTokenizer_0_1_1({ ...descriptor, version: "0.1.0" });
  // @ts-expect-error Dictionary identity is factory-created and qualified, never raw text.
  api.lexize("app.words", "Running");
  // @ts-expect-error Native input is text.
  api.lexize(dictionary, 123);
  // @ts-expect-error Internal pointer callbacks are not application SQL functions.
  api.sql.functions.lakebase_tokenizer_wholeword_init(null);
  // @ts-expect-error Maintenance is not in application context.
  api.replaceStopwords("named", ["the"]);
  // @ts-expect-error The template only documents the English stemmer.
  planLakebaseTokenizerDictionary(descriptor, dictionary, "alter", { stemmer: "spanish" });
  // @ts-expect-error Unsupported option keys are not emitted.
  planLakebaseTokenizerDictionary(descriptor, dictionary, "create", { split: "whitespace" });
}
void compileOnly;
