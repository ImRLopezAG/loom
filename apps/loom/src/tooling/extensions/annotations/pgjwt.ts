const evidence = [
  "https://github.com/michelp/pgjwt/blob/master/pgjwt--0.2.0.sql",
  "packages/tests/unit/extension-pgjwt.test.ts",
  "packages/tests/types/extension-pgjwt.test-d.ts",
  "packages/e2e/integration/extensions-pgjwt.test.ts",
] as const;
const semantics = {
  authority: "query",
  nulls: "Non-STRICT SQL functions retain their native NULL behavior, including NULL fields in verify's output row.",
  privilege: "PUBLIC EXECUTE; pgcrypto must be explicitly selected and installed in the same trusted namespace.",
  installation: "Native @extschema@ substitution rejects double quotes, dollar signs, single quotes and backslashes.",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
  limitation: "JWT data and a valid signature do not establish Kello identity or authorization.",
} as const;

/** Six exact captured SQL identities; acceptance remains tied to executable proof receipts. */
export const pgJwtAnnotations = [
  {
    id: "routine:$extension:pgjwt.algorithm_sign(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    evidence,
    reason:
      "algorithmSign / sql.functions.algorithm_sign binds text, secret and the exact HS256/HS384/HS512 native algorithm domain.",
    semantics: { ...semantics, observability: "tables", result: "string | null", codec: "pg:text:1:nullable" },
  },
  {
    id: "routine:$extension:pgjwt.sign(pg_catalog.json,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    evidence,
    reason: "sign preserves raw JSON document text and secret; omitted algorithm uses PostgreSQL's HS256 default.",
    semantics: { ...semantics, observability: "tables", result: "string | null", codec: "pg:text:1:nullable" },
  },
  {
    id: "routine:$extension:pgjwt.try_cast_double(pg_catalog.text)",
    disposition: "query",
    evidence,
    reason:
      "tryCastDouble returns PostgreSQL float8 or NULL on failed conversion, retaining native NaN and infinities.",
    semantics: {
      ...semantics,
      observability: "tables",
      result: "number | FloatNonfinite | null",
      codec: "pg:float8:1:nullable",
    },
  },
  {
    id: "routine:$extension:pgjwt.url_decode(pg_catalog.text)",
    disposition: "query",
    evidence,
    reason: "urlDecode returns checked lossless bytea hex; malformed base64url remains a native error.",
    semantics: {
      ...semantics,
      observability: "tables",
      result: "{ hex: string } | null",
      codec: "pg:bytea:hex:1:nullable",
    },
  },
  {
    id: "routine:$extension:pgjwt.url_encode(pg_catalog.bytea)",
    disposition: "query",
    evidence,
    reason: "urlEncode binds bytea without UTF-8 conversion and returns unpadded base64url text.",
    semantics: { ...semantics, observability: "tables", result: "string | null", codec: "pg:text:1:nullable" },
  },
  {
    id: "routine:$extension:pgjwt.verify(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    evidence,
    reason:
      "verify exposes fixed named header/payload JSON and valid boolean output, preserving transaction-time and caller algorithm semantics.",
    semantics: {
      ...semantics,
      observability: "session",
      codec: "pgjwt:verification:1",
      live: "Transaction-time dependence is retained through the checked FROM source; it cannot qualify as an automatic table-only live query.",
      behavior:
        "The caller algorithm controls HMAC, not the JWT header; nbf/exp are evaluated against CURRENT_TIMESTAMP using native timestamp range semantics.",
      limitation:
        "Native signature comparison is ordinary equality. Malformed JSON errors may be pruned if the query does not project the JSON fields. Verification does not establish application identity.",
    },
  },
] as const;
