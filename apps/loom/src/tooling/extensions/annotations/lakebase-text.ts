const evidence = [
  "apps/loom/src/tooling/extensions/manifests/lakebase_text.json",
  "https://neon.com/docs/extensions/lakebase-text",
  "apps/loom/src/core/extensions/adapters/lakebase-text.ts",
  "packages/tests/unit/extensions-lakebase-text.test.ts",
  "packages/tests/types/extensions-lakebase-text.test-d.ts",
  "packages/e2e/integration/extensions-lakebase-text.test.ts",
] as const;
const pending = {
  nativeAcceptance: "pending",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;
const index = {
  authority: "schema",
  surface:
    "defineTable indexes: { fields, extension: lakebase_text.indexes.tsvector(), with: lakebase_text.storage(...) }",
  strategies: "<@> ordering against bm25query_tsvector; corpus statistics come from the named index",
  nulls: "NULL tsvector keys are not ranked by the strict operator procedure",
  ...pending,
} as const;

/** Exact member dispositions. Native Neon 0.1.3 acceptance stays pending until parent host proof. */
export const lakebaseTextAnnotations = [
  {
    id: "access method:lakebase_bm25",
    disposition: "schema",
    reason:
      "Current lakebase_bm25 index access method selected by indexes.tsvector(); not a scalar query value.",
    evidence,
    semantics: {
      ...index,
      format: "current index storage format; upgrades from lakebase_bm25v0 use REINDEX INDEX CONCURRENTLY",
    },
  },
  {
    id: "access method:lakebase_bm25v0",
    disposition: "schema",
    reason:
      "Legacy lakebase_bm25v0 access method selected by indexes.tsvector({ format: \"v0\" }); format is not extension version.",
    evidence,
    semantics: { ...index, format: "legacy index storage format retained until a concurrent reindex completes" },
  },
  {
    id: 'composite type:"$extension:lakebase_text".bm25query_tsvector',
    disposition: "schema",
    reason:
      "Composite definition for bm25query_tsvector (query tsvector, index regclass); decoded by the query-type codec.",
    evidence,
    semantics: { ...pending, parent: "type:$extension:lakebase_text.bm25query_tsvector" },
  },
  {
    id: 'function of access method:function 1 (pg_catalog.tsvector, pg_catalog.tsvector) of "$extension:lakebase_text".tsvector_bm25_ops USING lakebase_bm25',
    disposition: "internal",
    reason:
      "Captured access-method support attachment for the current tsvector_bm25_ops class; catalog wiring, not a public SQL helper.",
    evidence,
    semantics: { ...pending, parent: "opclass:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25" },
  },
  {
    id: 'function of access method:function 1 (pg_catalog.tsvector, pg_catalog.tsvector) of "$extension:lakebase_text".tsvector_bm25_ops USING lakebase_bm25v0',
    disposition: "internal",
    reason:
      "Captured access-method support attachment for the legacy tsvector_bm25_ops class; catalog wiring, not a public SQL helper.",
    evidence,
    semantics: { ...pending, parent: "opclass:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25v0" },
  },
  {
    id: "opclass:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25",
    disposition: "schema",
    reason: "indexes.tsvector() selects the captured default tsvector class for lakebase_bm25.",
    evidence,
    semantics: { ...index, input: "pg_catalog.tsvector columns" },
  },
  {
    id: "opclass:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25v0",
    disposition: "schema",
    reason: "indexes.tsvector({ format: \"v0\" }) selects the captured default tsvector class for lakebase_bm25v0.",
    evidence,
    semantics: { ...index, input: "pg_catalog.tsvector columns" },
  },
  {
    id: 'operator of access method:operator 1 (pg_catalog.tsvector, "$extension:lakebase_text".bm25query_tsvector) of "$extension:lakebase_text".tsvector_bm25_ops USING lakebase_bm25',
    disposition: "internal",
    reason:
      "Captured access-method attachment of <@> strategy 1 on the current class; public ranking uses the operator member.",
    evidence,
    semantics: { ...pending, parent: "opclass:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25" },
  },
  {
    id: 'operator of access method:operator 1 (pg_catalog.tsvector, "$extension:lakebase_text".bm25query_tsvector) of "$extension:lakebase_text".tsvector_bm25_ops USING lakebase_bm25v0',
    disposition: "internal",
    reason:
      "Captured access-method attachment of <@> strategy 1 on the legacy class; public ranking uses the operator member.",
    evidence,
    semantics: { ...pending, parent: "opclass:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25v0" },
  },
  {
    id: "operator:$extension:lakebase_text.<@>(pg_catalog.tsvector,$extension:lakebase_text.bm25query_tsvector)",
    disposition: "query",
    reason:
      "rank / sql.operators.<@> composes the captured negative float8 BM25 score; PostgreSQL evaluates the score.",
    evidence,
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg:float8:1:nullable",
      result: "Native float8 negative BM25 score; order ascending for most-relevant-first.",
      nulls: "STRICT operator procedure: any NULL operand yields NULL.",
      limitation:
        "A lakebase_bm25 scan may omit rows whose <@> value is exactly 0.0 unless lakebase_bm25.enable_scan is off.",
      ...pending,
    },
  },
  {
    id: "opfamily:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25",
    disposition: "internal",
    reason: "Catalog family backing the current tsvector_bm25_ops class; not a separately callable query.",
    evidence,
    semantics: { ...pending, parent: "opclass:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25" },
  },
  {
    id: "opfamily:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25v0",
    disposition: "internal",
    reason: "Catalog family backing the legacy tsvector_bm25_ops class; not a separately callable query.",
    evidence,
    semantics: { ...pending, parent: "opclass:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25v0" },
  },
  {
    id: "routine:$extension:lakebase_text._lakebase_bm25_evaluate_tsvector(pg_catalog.tsvector,$extension:lakebase_text.bm25query_tsvector)",
    disposition: "query",
    reason:
      "evaluate / sql.functions._lakebase_bm25_evaluate_tsvector is the captured SQL-callable operator procedure; <@> remains the documented ranking operator.",
    evidence,
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg:float8:1:nullable",
      nulls: "STRICT function: any NULL operand yields NULL.",
      ...pending,
    },
  },
  {
    id: "routine:$extension:lakebase_text._lakebase_bm25_support_tsvector_bm25_ops()",
    disposition: "query",
    reason:
      "support / sql.functions._lakebase_bm25_support_tsvector_bm25_ops is the captured SQL-callable family procedure; it has no internal or cstring arguments.",
    evidence,
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg:text:1:nullable",
      nulls: "STRICT zero-argument function; a NULL result is still a SQL null, not a client default.",
      ...pending,
    },
  },
  {
    id: "routine:$extension:lakebase_text.lakebase_bm25_amhandler(pg_catalog.internal)",
    disposition: "schema",
    reason:
      "index_am_handler for lakebase_bm25; PostgreSQL resolves it through pg_am. The internal argument makes direct calls fail.",
    evidence,
    semantics: { ...index, surface: "accessMethods.lakebase_bm25.handler" },
  },
  {
    id: "routine:$extension:lakebase_text.lakebase_bm25_index_info(pg_catalog.regclass)",
    disposition: "query",
    reason:
      "indexInfo / sql.functions.lakebase_bm25_index_info reads captured volatile text metadata for a BM25 index.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      codec: "pg:text:1:nullable",
      live: "Index metadata is not a table-revision subscription.",
      ...pending,
    },
  },
  {
    id: "routine:$extension:lakebase_text.lakebase_bm25v0_amhandler(pg_catalog.internal)",
    disposition: "schema",
    reason:
      "index_am_handler for lakebase_bm25v0; PostgreSQL resolves it through pg_am. The internal argument makes direct calls fail.",
    evidence,
    semantics: { ...index, surface: "accessMethods.lakebase_bm25v0.handler" },
  },
  {
    id: "routine:$extension:lakebase_text.to_bm25query(pg_catalog.tsvector,pg_catalog.regclass)",
    disposition: "query",
    reason:
      "toBm25Query / sql.functions.to_bm25query constructs the captured bm25query_tsvector from a tsvector and index regclass.",
    evidence,
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg:composite:1:lakebase_text:0.1.3:bm25query_tsvector:query:pg:tsvector:text:1:nullable;index:pg:text:1:nullable",
      nulls: "Not STRICT; NULL arguments are passed through to the composite fields.",
      ...pending,
    },
  },
  {
    id: "type:$extension:lakebase_text._bm25query_tsvector",
    disposition: "schema",
    reason: "Array type of bm25query_tsvector; fields.bm25QueryArray() binds the captured array storage.",
    evidence,
    semantics: { ...pending, parent: "type:$extension:lakebase_text.bm25query_tsvector" },
  },
  {
    id: "type:$extension:lakebase_text.bm25query_tsvector",
    disposition: "schema",
    reason: "Query value type combining a tsvector with the BM25 index identity; fields.bm25Query() and the query codec.",
    evidence,
    semantics: {
      authority: "schema",
      codec: "pg:composite:1:lakebase_text:0.1.3:bm25query_tsvector:query:pg:tsvector:text:1:nullable;index:pg:text:1:nullable",
      ...pending,
    },
  },
] as const;
