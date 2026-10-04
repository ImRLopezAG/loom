import { expect, test } from "vite-plus/test";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import {
  createLakebaseTokenizer_0_1_1,
  dictionaryReference,
} from "../../../apps/loom/src/core/extensions/adapters/lakebase_tokenizer";
import {
  lakebaseTokenizerAnnotations,
  lakebaseTokenizerAnnotationContract,
} from "../../../apps/loom/src/tooling/extensions/annotations/lakebase_tokenizer";
import {
  planLakebaseTokenizerDictionary,
  withLakebaseTokenizer,
} from "../../../apps/loom/src/tooling/extensions/operations/lakebase_tokenizer";
import {
  checkCompiledExtensionQuery,
  extensionExpressionContract,
  extensionSqlDialect,
} from "../../../apps/loom/src/core/extensions/sql";
import { evaluateSnapshot } from "../../../apps/loom/src/core/server/rpc/snapshot";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/lakebase_tokenizer.json";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { lakebaseTokenizerUnitProofCase } from "../../e2e/fixtures/lakebase-tokenizer-proof-cases";

const descriptor = {
  name: "lakebase_tokenizer",
  version: "0.1.1",
  schema: 'token"izer',
  apiSupport: { status: "verified", digest: "b57e5d3240d67c933ba1a2665c2fd347f72df94f159f16a4d6c7ebeb8e7d7ef8" },
} as const;
const dialect = extensionSqlDialect(nodePgCodecs);

extensionProofUnitTest(lakebaseTokenizerUnitProofCase, () => {
  expect(capture.digest).toBe(descriptor.apiSupport.digest);
  expect(lakebaseTokenizerAnnotationContract.digest).toBe(capture.digest);
  expect(lakebaseTokenizerAnnotationContract.providerAcceptance).toBe("pending");
  expect(lakebaseTokenizerAnnotations.map((x) => x.id).sort()).toEqual(
    capture.contract.members.map((x) => x.id).sort(),
  );
  expect(new Set(lakebaseTokenizerAnnotations.map((x) => x.id)).size).toBe(32);
  expect(() =>
    createLakebaseTokenizer_0_1_1({ ...descriptor, apiSupport: { status: "verified", digest: "0".repeat(64) } }),
  ).toThrow("exact verified contract");
  expect(() => createLakebaseTokenizer_0_1_1({ ...descriptor, apiSupport: { status: "unverified" } })).toThrow();
});

test("native dictionary SQL is qualified, strict, decoded and externally observable", () => {
  const api = createLakebaseTokenizer_0_1_1(descriptor);
  const dictionary = dictionaryReference({ schema: 'dict"schema', name: "words'quoted" });
  const expression = api.lexize(dictionary, "Café's");
  const query = dialect.sqlToQuery(expression);
  expect(query.sql).toBe('"pg_catalog"."ts_lexize"($1::"pg_catalog"."regdictionary", $2::"pg_catalog"."text")');
  expect(query.params).toEqual(['"dict""schema"."words\'quoted"', "Café's"]);
  expect(extensionExpressionContract(expression)).toMatchObject({ observability: "external", dependencies: [] });
  expect(api.codecs.lexemes.decode("{café}")).toEqual({ dimensions: [{ lowerBound: 1, length: 1 }], values: ["café"] });
  expect(api.codecs.lexemes.decode(null)).toBeNull();
  expect(Object.keys(api.sql.functions)).toEqual(["ts_lexize"]);
  expect(api.sql.functions.ts_lexize).toBe(api.lexize);
  expect(api.sql.functions).not.toHaveProperty("lakebase_tokenizer_wholeword_init");
  expect(api.sql.functions).not.toHaveProperty("lakebase_tokenizer_wholeword_lexize");
  expect(api.template).toMatchObject({ schema: descriptor.schema, name: "tokenizer_wholeword" });
});

test("table row codecs preserve NULL attributes, Unicode and array bounds", () => {
  const api = createLakebaseTokenizer_0_1_1(descriptor);
  const stopword = { name: 'a,"b', word: null };
  const synonym = { name: "named", word: "café", synonym: "united_states" };
  expect(api.codecs.stopword.decode(api.codecs.stopword.encode(stopword))).toEqual(stopword);
  expect(api.codecs.synonym.decode(api.codecs.synonym.encode(synonym))).toEqual(synonym);
  const value = { dimensions: [{ lowerBound: -2, length: 2 }], values: [synonym, null] };
  expect(api.codecs.synonymArray.decode(api.codecs.synonymArray.encode(value))).toEqual(value);
  expect(api.fields.stopword().metadata.extension).toMatchObject({
    type: "lakebase_tokenizer_stopwords",
    digest: capture.digest,
  });
  expect(api.fields.synonymArray().metadata.extension).toMatchObject({
    type: "lakebase_tokenizer_synonyms",
    array: true,
  });
  const relation = api.stopwords("sw");
  expect(dialect.sqlToQuery(relation.from).sql).toBe(
    '"token""izer"."lakebase_tokenizer_stopwords" as "sw"("name", "word")',
  );
  expect(Object.keys(relation.columns)).toEqual(["name", "word"]);
  expect(Object.keys(api.synonyms("syn").columns)).toEqual(["name", "word", "synonym"]);
});

test("operator dictionary plans quote identifiers and values and preserve native option removals", () => {
  const dictionary = dictionaryReference({ schema: 'dict"schema', name: "words" });
  const create = planLakebaseTokenizerDictionary(descriptor, dictionary, "create", {
    lowercase: true,
    normalize: "NFKC",
    englishPossessive: false,
    stripAccents: false,
    stopwords: "set'one",
    synonyms: "set\\two",
    stemmer: "english",
  });
  expect(create.statement).toBe(
    "CREATE TEXT SEARCH DICTIONARY \"dict\"\"schema\".\"words\" (TEMPLATE = \"token\"\"izer\".\"tokenizer_wholeword\", Lowercase = 'true', Normalize = 'NFKC', EnglishPossessive = 'false', StripAccents = 'false', Stopwords = 'set''one', Synonyms =  E'set\\\\two', Stemmer = 'english')",
  );
  expect(
    planLakebaseTokenizerDictionary(descriptor, dictionary, "alter", { stemmer: null, stopwords: "" }),
  ).toMatchObject({
    statement: 'ALTER TEXT SEARCH DICTIONARY "dict""schema"."words" (Stopwords = \'\', Stemmer)',
    storedVectors: "regeneration-required",
  });
  expect(planLakebaseTokenizerDictionary(descriptor, dictionary, "reload").statement).toBe(
    'ALTER TEXT SEARCH DICTIONARY "dict""schema"."words" (dummy)',
  );
  expect(() => planLakebaseTokenizerDictionary(descriptor, dictionary, "alter", {})).toThrow();
});

test("mutable dictionary queries refuse automatic live subscriptions", async () => {
  const api = createLakebaseTokenizer_0_1_1(descriptor);
  const query = dialect.sqlToQuery(api.lexize(dictionaryReference({ schema: "app", name: "words" }), "cats"));
  await expect(
    evaluateSnapshot(async () => {
      checkCompiledExtensionQuery(query);
      return [];
    }),
  ).rejects.toThrow("Automatic live query cannot observe external extension dependency");
});

test("operator rejects unverified identity before connection acquisition", async () => {
  await expect(
    withLakebaseTokenizer("invalid-url", { ...descriptor, apiSupport: { status: "unverified" } }, async () => {}),
  ).rejects.toThrow("exact verified contract");
});
