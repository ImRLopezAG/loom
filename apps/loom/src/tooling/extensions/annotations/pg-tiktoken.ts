const evidence = [
  "apps/loom/src/tooling/extensions/manifests/pg_tiktoken.json: Neon PostgreSQL 18.6 catalogue capture; 0.0.1 strict text,text -> int8/int8[]",
  "https://github.com/kelvich/pg_tiktoken/blob/master/src/lib.rs: inspected 2026-10-02; encode_with_model maps bundled selectors and uses encode_with_special_tokens; upstream branch does not pin provider binary",
  "packages/tests/types/extensions-fuzzy-token.test-d.ts: selector-first text expressions and bigint/bounds-preserving results",
  "packages/tests/unit/extensions-fuzzy-token.test.ts: strict fuzzy and token parameters retain NULL and token signatures retain selector first",
  "packages/e2e/integration/extensions-fuzzy-token.test.ts: provider pg_tiktoken selector, special token, Unicode, NULL, empty and bigint wire acceptance (Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-fuzzy-token.md)",
] as const;
const semantics = {
  authority: "query",
  nulls: "NULL for any NULL argument",
  observability: "external",
  determinism:
    "Upstream embeds deterministic encoder vocabularies and model mapping; source has no session/GUC or network lookups. Provider revision and mapping are unresolved, so no table-only live eligibility is claimed from VOLATILE alone.",
  selectors:
    "Canonical argument is text. Upstream recognizes cl100k_base, r50k_base/gpt2, p50k_base, p50k_edit plus bundled model aliases. The four encodings and tested model aliases are witnessed on Neon; no modern encoder/model union is invented.",
  specialTokens:
    "Upstream encode_with_special_tokens recognizes its built-in special tokens; unknown selector errors in PostgreSQL.",
  providerAcceptance: "passed",
  providerReceipt: "docs/validation/2026-10-02-typed-extensions-fuzzy-token.md",
} as const;

export const pgTiktokenAnnotations = [
  {
    id: "routine:$extension:pg_tiktoken.tiktoken_count(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    evidence,
    reason:
      "count / sql.functions.tiktoken_count binds encoding_selector first and input text second; decodes captured int8 exactly as bigint.",
    semantics: { ...semantics, result: "bigint | null", codec: "pg:int8:1:nullable" },
  },
  {
    id: "routine:$extension:pg_tiktoken.tiktoken_encode(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    evidence,
    reason:
      "encode / sql.functions.tiktoken_encode binds encoding_selector first and input text second; decodes captured int8[] with precise bigint elements and PostgreSQL dimensions/bounds.",
    semantics: {
      ...semantics,
      result: "PostgreSqlArray<bigint> | null",
      codec: "pg:array:1:,:pg:int8:1:nullable",
      arrayGrammar:
        "Upstream returns Vec<i64>; Neon fixtures witness one-dimensional arrays; preserve checked dimensions, bounds and NULL representation for the canonical int8[] result.",
    },
  },
] as const;
