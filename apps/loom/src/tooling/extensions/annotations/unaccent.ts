const dictionaryId = 'text search dictionary:"$extension:unaccent".unaccent';
const templateId = 'text search template:"$extension:unaccent".unaccent';
const initId = "routine:$extension:unaccent.unaccent_init(pg_catalog.internal)";
const lexizeId =
  "routine:$extension:unaccent.unaccent_lexize(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)";
const evidence = [
  "https://www.postgresql.org/docs/18/unaccent.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/unaccent/unaccent.c",
  "apps/loom/src/tooling/extensions/text-search-contracts/unaccent.json: exact dictionary/template INIT/LEXIZE graph",
  "packages/e2e/integration/extension-unaccent.test.ts: both native overloads, Unicode, NULL, invocation composition and external observability",
  "packages/e2e/integration/extensions-unaccent-tooling.test.ts: native dictionary and template inspection, creation, rules changes and reload",
] as const;
const query = {
  authority: "query",
  observability: "external",
  nulls: "STRICT: any SQL NULL argument returns NULL",
  result: "string | null",
  codec: "pg:text:1:nullable",
  live: "Mutable dictionaries and installed rules files prevent automatic live subscriptions",
} as const;
const templateProof = {
  kind: "database",
  file: "packages/e2e/integration/extensions-unaccent-tooling.test.ts",
  case: "Unaccent tooling creates qualified dictionaries and returns authentic runtime references",
  fixture: "native default/custom dictionary ts_lexize plus exact template inspection",
} as const;

/** Reviewed dispositions and exact pins; full family/provider acceptance remains a separate host gate. */
export const unaccentAnnotationContract = {
  extension: "unaccent",
  postgresMajor: 18,
  version: "1.1",
  provider: "neon",
  digest: "f983b4bfaa4c974c4ae2eba548249eb86d31d86376d019898b070ff66f9832dd",
  textSearchDigest: "9bfba15f9043a004cea04315c1c52dec6ce8a19f4a5e828a369234ac1644ba2d",
  providerAcceptance: "pending",
} as const;

export const unaccentAnnotations = [
  {
    id: "routine:$extension:unaccent.unaccent(pg_catalog.text)",
    disposition: "query",
    reason:
      "unaccent(text) uses the dictionary named unaccent in the function's installation schema; native rules can expand, delete or replace text.",
    evidence,
    semantics: query,
  },
  {
    id: "routine:$extension:unaccent.unaccent(pg_catalog.regdictionary,pg_catalog.text)",
    disposition: "query",
    reason:
      "unaccent(dictionary,text) binds an authentic qualified dictionary identity, never a raw OID or search-path-dependent text name.",
    evidence,
    semantics: { ...query, input: "DictionaryReference | null, nullable text literal or SQL expression" },
  },
  {
    id: dictionaryId,
    disposition: "tooling",
    reason:
      "The extension-owned native dictionary has mutable rules options; inspection and changes use the dedicated operator transaction, outside application bindings.",
    evidence,
    proofs: [templateProof],
    sqlDependency: templateId,
    semantics: { authority: "tooling", options: "rules = 'unaccent'", runtime: "Qualified input identity only" },
  },
  {
    id: templateId,
    disposition: "tooling",
    reason:
      "The extension-owned native template exposes inspected INIT/LEXIZE facts; native dictionary creation and ts_lexize directly exercise this template.",
    evidence,
    proofs: [templateProof],
    semantics: { authority: "tooling", init: initId, lexize: lexizeId },
  },
  ...(
    [
      [initId, "init"],
      [lexizeId, "lexize"],
    ] as const
  ).map(([id, slot]) => ({
    id,
    disposition: "internal" as const,
    reason:
      "Native internal-pointer callback is callable only through its exact captured template slot; PUBLIC execute does not make its pointer ABI an application API.",
    evidence,
    parents: [templateId],
    proofs: [templateProof],
    proofTransfer: {
      from: [templateId],
      relation: { kind: "text-search-callback", slot },
      basis:
        "The pinned native graph assigns this exact callback to this exact template slot; direct native dictionary execution witnesses the template root.",
    },
  })),
] as const;
