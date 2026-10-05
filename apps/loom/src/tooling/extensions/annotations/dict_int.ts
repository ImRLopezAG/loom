const dictionaryId = 'text search dictionary:"$extension:dict_int".intdict';
const templateId = 'text search template:"$extension:dict_int".intdict_template';
const initId = "routine:$extension:dict_int.dintdict_init(pg_catalog.internal)";
const lexizeId =
  "routine:$extension:dict_int.dintdict_lexize(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)";
const evidence = [
  "https://www.postgresql.org/docs/18/dict-int.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/dict_int/dict_int.c",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/dict_int/dict_int--1.0.sql",
  "apps/loom/src/tooling/extensions/manifests/dict_int.json: captured dictionary, template, and internal-typed INIT/LEXIZE routines",
  "packages/tests/unit/extensions-dict_int.test.ts: identities, options codec, no SQL helpers for callbacks",
  "packages/tests/unit/extensions-dict_int-tooling.test.ts: tooling rejects foreign contracts before connection",
  "packages/tests/types/extensions-dict_int.test-d.ts: frozen identities and rejected callback calls",
  "packages/e2e/integration/extensions-dict_int.test.ts: native ts_lexize oracle, operator option changes and release drift checks",
  "packages/e2e/integration/extensions-dict_int-tooling.test.ts: unverified descriptor rejection before connection acquisition",
  "packages/e2e/integration/extensions-dict-int-text-search.test.ts: native dictionary/template/callback graph across qualified installations",
  "apps/loom/src/tooling/extensions/text-search-contracts/dict_int.json: connected Neon PostgreSQL 18 supplemental graph capture",
] as const;
const pending = {
  authority: "tooling",
  observability: "external",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
  nativeAcceptance: "pending",
  live: "Mutable dictionary options prevent automatic live subscriptions",
} as const;

/** Reviewed dispositions; final per-member acceptance still requires source-bound gate receipts. */
export const dictIntAnnotationContract = {
  extension: "dict_int",
  postgresMajor: 18,
  version: "1.0",
  provider: "neon",
  digest: "1a745014cc5c4e94724c34d742b8fb154fe0852306dca4163cc307b8dca9e5da",
  providerAcceptance: "pending",
} as const;

export const dictIntAnnotations = [
  {
    id: dictionaryId,
    disposition: "tooling",
    reason:
      "The extension-owned intdict dictionary has mutable maxlen/rejectlong/absval options. Inspection and ALTER stay in operator tooling; the query adapter exposes only a qualified DictionaryReference.",
    evidence,
    sqlDependency: templateId,
    semantics: {
      ...pending,
      textSearchDigest: "30d18d75bba47e968e7cb932340285fbb370bc1abd75caf9145dc17936d1a6b8",
      options: "maxlen = 6, rejectlong = false, absval = false when dictinitoption is NULL",
      runtime: "Qualified input identity only; never a raw OID",
      privilege:
        "ALTER requires dictionary ownership. Neon's operator creates and manages a separate dictionary when the installed intdict is provider-owned.",
    },
  },
  {
    id: templateId,
    disposition: "tooling",
    reason:
      "intdict_template is the captured text-search template. Tooling inspects INIT/LEXIZE catalogue linkage; it does not emit SQL calls to the internal-pointer callbacks.",
    evidence,
    semantics: {
      ...pending,
      init: initId,
      lexize: lexizeId,
      textSearchDigest: "30d18d75bba47e968e7cb932340285fbb370bc1abd75caf9145dc17936d1a6b8",
    },
  },
  {
    id: initId,
    disposition: "internal",
    reason:
      "dintdict_init is the template INIT callback: one pg_catalog.internal argument and result. C-language PUBLIC EXECUTE does not make the pointer ABI an application SQL function; it is reachable only through the template slot.",
    evidence,
    parents: [templateId],
    proofTransfer: {
      from: [templateId],
      relation: { kind: "text-search-callback", slot: "init" },
      basis:
        "The supplemental dict_int 1.0 graph binds this exact internal signature to intdict_template's INIT slot. Native template initialization occurs through dictionary creation and ts_lexize, never a direct pointer call.",
    },
  },
  {
    id: lexizeId,
    disposition: "internal",
    reason:
      "dintdict_lexize is the template LEXIZE callback: four pg_catalog.internal arguments returning internal. Not an ordinary public function; token results are observed through pg_catalog.ts_lexize on a configured dictionary.",
    evidence,
    parents: [templateId],
    proofTransfer: {
      from: [templateId],
      relation: { kind: "text-search-callback", slot: "lexize" },
      basis:
        "The supplemental dict_int 1.0 graph binds this exact internal signature to intdict_template's LEXIZE slot. Native token results are observed through ts_lexize and verified catalogue inspection, never direct pointer calls.",
    },
  },
] as const;
