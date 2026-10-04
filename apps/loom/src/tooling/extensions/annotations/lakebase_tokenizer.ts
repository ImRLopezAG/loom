const evidence = [
  "apps/loom/src/tooling/extensions/manifests/lakebase_tokenizer.json: exact Neon PG18 0.1.1 capture, 32 members",
  "https://docs.databricks.com/aws/en/oltp/projects/lakebase-tokenizer",
  "https://docs.databricks.com/aws/en/oltp/projects/extensions: lists 0.1.1",
  "packages/tests/unit/extensions-lakebase-tokenizer.test.ts",
  "packages/tests/types/extensions-lakebase-tokenizer.test-d.ts",
  "packages/e2e/integration/extensions-lakebase-tokenizer.test.ts: authored; exact native execution pending",
  "packages/e2e/scripts/run-lakebase-tokenizer-native-characterization.ts: parent-run read-only characterization",
] as const;
const pending = {
  providerAcceptance: "pending",
  nativeAcceptance: "pending",
  publicExportAcceptance: "pending",
  observability: "external",
  maintenance:
    "Reload dictionaries after set edits; regenerate stored tsvectors and review dependent indexes. No automatic application-table rewrite.",
  tokenization: "Native template only; no JavaScript tokenizer, normalizer, accent stripper or stemmer",
} as const;
export const lakebaseTokenizerAnnotationContract = {
  extension: "lakebase_tokenizer",
  postgresMajor: 18,
  version: "0.1.1",
  provider: "neon",
  digest: "b57e5d3240d67c933ba1a2665c2fd347f72df94f159f16a4d6c7ebeb8e7d7ef8",
  providerAcceptance: "pending",
} as const;

/** Every captured object is accounted for; authored proof is never reported as native acceptance. */
export const lakebaseTokenizerAnnotations = [
  {
    id: 'index:"$extension:lakebase_tokenizer".lakebase_tokenizer_stopwords_pkey',
    disposition: "internal",
    reason:
      "lakebase_tokenizer_stopwords_pkey is the PostgreSQL-owned index implementing the named catalog table primary key. Native schema/duplicate-key proof checks it; operator tooling never drops or edits the index directly.",
    evidence,
    semantics: pending,
  },
  {
    id: 'index:"$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms_pkey',
    disposition: "internal",
    reason:
      "lakebase_tokenizer_synonyms_pkey is the PostgreSQL-owned index implementing the named catalog table primary key. Native schema/duplicate-key proof checks it; operator tooling never drops or edits the index directly.",
    evidence,
    semantics: pending,
  },
  {
    id: 'index:pg_toast."$toast-index:lakebase_tokenizer_stopwords"',
    disposition: "internal",
    reason:
      '"$toast-index:lakebase_tokenizer_stopwords" is PostgreSQL-managed TOAST index for the corresponding extension catalog table. Native catalog inspection proves its owning relation; no direct storage editing API is emitted.',
    evidence,
    semantics: pending,
  },
  {
    id: 'index:pg_toast."$toast-index:lakebase_tokenizer_synonyms"',
    disposition: "internal",
    reason:
      '"$toast-index:lakebase_tokenizer_synonyms" is PostgreSQL-managed TOAST index for the corresponding extension catalog table. Native catalog inspection proves its owning relation; no direct storage editing API is emitted.',
    evidence,
    semantics: pending,
  },
  {
    id: "routine:$extension:lakebase_tokenizer.lakebase_tokenizer_wholeword_init(pg_catalog.internal)",
    disposition: "internal",
    reason:
      "lakebase_tokenizer_wholeword_init is the native INIT pointer callback of tokenizer_wholeword. Exercise it through dictionary creation and ts_lexize, never an application SQL call.",
    evidence,
    semantics: pending,
  },
  {
    id: "routine:$extension:lakebase_tokenizer.lakebase_tokenizer_wholeword_lexize(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "lakebase_tokenizer_wholeword_lexize is the native LEXIZE pointer callback of tokenizer_wholeword. Exercise it through dictionary creation and ts_lexize, never an application SQL call.",
    evidence,
    semantics: pending,
  },
  {
    id: 'table column:"$extension:lakebase_tokenizer".lakebase_tokenizer_stopwords.name',
    disposition: "schema",
    reason:
      '"$extension:lakebase_tokenizer".lakebase_tokenizer_stopwords.name is a captured text column exposed by typed table rows and operator parameters. Table NULL rejection belongs to PostgreSQL; composite NULL attributes remain valid.',
    evidence,
    semantics: pending,
  },
  {
    id: 'table column:"$extension:lakebase_tokenizer".lakebase_tokenizer_stopwords.word',
    disposition: "schema",
    reason:
      '"$extension:lakebase_tokenizer".lakebase_tokenizer_stopwords.word is a captured text column exposed by typed table rows and operator parameters. Table NULL rejection belongs to PostgreSQL; composite NULL attributes remain valid.',
    evidence,
    semantics: pending,
  },
  {
    id: 'table column:"$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms.name',
    disposition: "schema",
    reason:
      '"$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms.name is a captured text column exposed by typed table rows and operator parameters. Table NULL rejection belongs to PostgreSQL; composite NULL attributes remain valid.',
    evidence,
    semantics: pending,
  },
  {
    id: 'table column:"$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms.synonym',
    disposition: "schema",
    reason:
      '"$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms.synonym is a captured text column exposed by typed table rows and operator parameters. Table NULL rejection belongs to PostgreSQL; composite NULL attributes remain valid.',
    evidence,
    semantics: pending,
  },
  {
    id: 'table column:"$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms.word',
    disposition: "schema",
    reason:
      '"$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms.word is a captured text column exposed by typed table rows and operator parameters. Table NULL rejection belongs to PostgreSQL; composite NULL attributes remain valid.',
    evidence,
    semantics: pending,
  },
  {
    id: 'table constraint:lakebase_tokenizer_stopwords_name_check on "$extension:lakebase_tokenizer".lakebase_tokenizer_stopwords',
    disposition: "schema",
    reason:
      'Native constraint lakebase_tokenizer_stopwords_name_check on "$extension:lakebase_tokenizer".lakebase_tokenizer_stopwords enforces CHECK (octet_length(name) <= 256). Operator set mutations preserve its database-enforced behavior; the proof harness checks the exact definition and actual violation.',
    evidence,
    semantics: pending,
  },
  {
    id: 'table constraint:lakebase_tokenizer_stopwords_name_not_null on "$extension:lakebase_tokenizer".lakebase_tokenizer_stopwords',
    disposition: "schema",
    reason:
      'Native constraint lakebase_tokenizer_stopwords_name_not_null on "$extension:lakebase_tokenizer".lakebase_tokenizer_stopwords enforces NOT NULL name. Operator set mutations preserve its database-enforced behavior; the proof harness checks the exact definition and actual violation.',
    evidence,
    semantics: pending,
  },
  {
    id: 'table constraint:lakebase_tokenizer_stopwords_pkey on "$extension:lakebase_tokenizer".lakebase_tokenizer_stopwords',
    disposition: "schema",
    reason:
      'Native constraint lakebase_tokenizer_stopwords_pkey on "$extension:lakebase_tokenizer".lakebase_tokenizer_stopwords enforces PRIMARY KEY (name, word). Operator set mutations preserve its database-enforced behavior; the proof harness checks the exact definition and actual violation.',
    evidence,
    semantics: pending,
  },
  {
    id: 'table constraint:lakebase_tokenizer_stopwords_word_check on "$extension:lakebase_tokenizer".lakebase_tokenizer_stopwords',
    disposition: "schema",
    reason:
      'Native constraint lakebase_tokenizer_stopwords_word_check on "$extension:lakebase_tokenizer".lakebase_tokenizer_stopwords enforces CHECK (octet_length(word) <= 1024). Operator set mutations preserve its database-enforced behavior; the proof harness checks the exact definition and actual violation.',
    evidence,
    semantics: pending,
  },
  {
    id: 'table constraint:lakebase_tokenizer_stopwords_word_not_null on "$extension:lakebase_tokenizer".lakebase_tokenizer_stopwords',
    disposition: "schema",
    reason:
      'Native constraint lakebase_tokenizer_stopwords_word_not_null on "$extension:lakebase_tokenizer".lakebase_tokenizer_stopwords enforces NOT NULL word. Operator set mutations preserve its database-enforced behavior; the proof harness checks the exact definition and actual violation.',
    evidence,
    semantics: pending,
  },
  {
    id: 'table constraint:lakebase_tokenizer_synonyms_name_check on "$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms',
    disposition: "schema",
    reason:
      'Native constraint lakebase_tokenizer_synonyms_name_check on "$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms enforces CHECK (octet_length(name) <= 256). Operator set mutations preserve its database-enforced behavior; the proof harness checks the exact definition and actual violation.',
    evidence,
    semantics: pending,
  },
  {
    id: 'table constraint:lakebase_tokenizer_synonyms_name_not_null on "$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms',
    disposition: "schema",
    reason:
      'Native constraint lakebase_tokenizer_synonyms_name_not_null on "$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms enforces NOT NULL name. Operator set mutations preserve its database-enforced behavior; the proof harness checks the exact definition and actual violation.',
    evidence,
    semantics: pending,
  },
  {
    id: 'table constraint:lakebase_tokenizer_synonyms_pkey on "$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms',
    disposition: "schema",
    reason:
      'Native constraint lakebase_tokenizer_synonyms_pkey on "$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms enforces PRIMARY KEY (name, word). Operator set mutations preserve its database-enforced behavior; the proof harness checks the exact definition and actual violation.',
    evidence,
    semantics: pending,
  },
  {
    id: 'table constraint:lakebase_tokenizer_synonyms_synonym_check on "$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms',
    disposition: "schema",
    reason:
      'Native constraint lakebase_tokenizer_synonyms_synonym_check on "$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms enforces CHECK (octet_length(synonym) <= 1024). Operator set mutations preserve its database-enforced behavior; the proof harness checks the exact definition and actual violation.',
    evidence,
    semantics: pending,
  },
  {
    id: 'table constraint:lakebase_tokenizer_synonyms_synonym_not_null on "$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms',
    disposition: "schema",
    reason:
      'Native constraint lakebase_tokenizer_synonyms_synonym_not_null on "$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms enforces NOT NULL synonym. Operator set mutations preserve its database-enforced behavior; the proof harness checks the exact definition and actual violation.',
    evidence,
    semantics: pending,
  },
  {
    id: 'table constraint:lakebase_tokenizer_synonyms_word_check on "$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms',
    disposition: "schema",
    reason:
      'Native constraint lakebase_tokenizer_synonyms_word_check on "$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms enforces CHECK (octet_length(word) <= 1024). Operator set mutations preserve its database-enforced behavior; the proof harness checks the exact definition and actual violation.',
    evidence,
    semantics: pending,
  },
  {
    id: 'table constraint:lakebase_tokenizer_synonyms_word_not_null on "$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms',
    disposition: "schema",
    reason:
      'Native constraint lakebase_tokenizer_synonyms_word_not_null on "$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms enforces NOT NULL word. Operator set mutations preserve its database-enforced behavior; the proof harness checks the exact definition and actual violation.',
    evidence,
    semantics: pending,
  },
  {
    id: 'table:"$extension:lakebase_tokenizer".lakebase_tokenizer_stopwords',
    disposition: "tooling",
    reason:
      "lakebase_tokenizer_stopwords has typed query rows; operator tooling replaces named sets atomically, reloads native dictionaries and returns the required stored-vector regeneration/index review action.",
    evidence,
    semantics: pending,
  },
  {
    id: 'table:"$extension:lakebase_tokenizer".lakebase_tokenizer_synonyms',
    disposition: "tooling",
    reason:
      "lakebase_tokenizer_synonyms has typed query rows; operator tooling replaces named sets atomically, reloads native dictionaries and returns the required stored-vector regeneration/index review action.",
    evidence,
    semantics: pending,
  },
  {
    id: 'text search template:"$extension:lakebase_tokenizer".tokenizer_wholeword',
    disposition: "tooling",
    reason:
      "tokenizer_wholeword is the native dictionary template. Tooling creates/alters dictionaries with seven documented options; ts_lexize decodes native lexemes. Native output, privileges and cache semantics require exact-version parent acceptance.",
    evidence,
    semantics: pending,
  },
  {
    id: 'toast table:pg_toast."$toast:lakebase_tokenizer_stopwords"',
    disposition: "internal",
    reason:
      '"$toast:lakebase_tokenizer_stopwords" is PostgreSQL-managed TOAST storage for the corresponding extension catalog table. Native catalog inspection proves its owning relation; no direct storage editing API is emitted.',
    evidence,
    semantics: pending,
  },
  {
    id: 'toast table:pg_toast."$toast:lakebase_tokenizer_synonyms"',
    disposition: "internal",
    reason:
      '"$toast:lakebase_tokenizer_synonyms" is PostgreSQL-managed TOAST storage for the corresponding extension catalog table. Native catalog inspection proves its owning relation; no direct storage editing API is emitted.',
    evidence,
    semantics: pending,
  },
  {
    id: "type:$extension:lakebase_tokenizer._lakebase_tokenizer_stopwords",
    disposition: "query",
    reason:
      "sql.types._lakebase_tokenizer_stopwords and the matching array codec/field preserve the captured lakebase_tokenizer_stopwords element identity, NULL elements, ranks and lower bounds.",
    evidence,
    semantics: pending,
  },
  {
    id: "type:$extension:lakebase_tokenizer._lakebase_tokenizer_synonyms",
    disposition: "query",
    reason:
      "sql.types._lakebase_tokenizer_synonyms and the matching array codec/field preserve the captured lakebase_tokenizer_synonyms element identity, NULL elements, ranks and lower bounds.",
    evidence,
    semantics: pending,
  },
  {
    id: "type:$extension:lakebase_tokenizer.lakebase_tokenizer_stopwords",
    disposition: "query",
    reason:
      "sql.types.lakebase_tokenizer_stopwords and the matching row codec/field preserve the captured ordered text attributes. Stand-alone composite attributes can be NULL despite table constraints.",
    evidence,
    semantics: pending,
  },
  {
    id: "type:$extension:lakebase_tokenizer.lakebase_tokenizer_synonyms",
    disposition: "query",
    reason:
      "sql.types.lakebase_tokenizer_synonyms and the matching row codec/field preserve the captured ordered text attributes. Stand-alone composite attributes can be NULL despite table constraints.",
    evidence,
    semantics: pending,
  },
] as const;
