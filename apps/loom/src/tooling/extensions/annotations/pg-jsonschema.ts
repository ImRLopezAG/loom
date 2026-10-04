const source = "https://github.com/supabase/pg_jsonschema/blob/v0.3.4/src/lib.rs";
const dependency = "https://docs.rs/crate/jsonschema/0.37.1/source/src/";
const evidence = [
  `${source}: all four strict immutable functions; matches delegate to is_valid; is_valid checks meta::validate; errors collects validator_for errors`,
  "https://github.com/supabase/pg_jsonschema/blob/v0.3.4/Cargo.toml: jsonschema 0.37.1, arbitrary-precision, default-features=false",
  `${dependency}lib.rs: is_valid panics for invalid schemas; drafts 4/6/7/2019-09/2020-12; options.rs uses Draft::default; referencing 0.37.1 src/specification/mod.rs defaults Draft202012`,
  `${dependency}retriever.rs: without resolve-http/resolve-file, external retrieval returns an error; no custom retriever in wrapper`,
  "packages/tests/unit/extensions-jsonschema.test.ts: four JSON Schema calls parameterize qualified JSON and JSONB overloads",
  "packages/tests/types/extensions-jsonschema.test-d.ts: exact JSON versus JSONB inputs, SQL NULL and checked result types",
  "packages/e2e/integration/extensions-jsonschema.test.ts: pg_jsonschema all four routines, invalid schemas, drafts and references match provider behavior (provider acceptance required); verifyPgJsonschema_0_3_4 covers native table filtering, relational extras, exact numbers, strict NULLs and invalid-schema diagnostics",
] as const;
const semantics = {
  authority: "query",
  observability: "tables",
  nulls: "SQL NULL for any SQL NULL argument; JSON null is a document value",
  dialects: "Draft 4, 6, 7, 2019-09 and 2020-12; $schema detection, default 2020-12 in jsonschema 0.37.1",
  references:
    "Local and bundled schema references. Upstream disables HTTP/file retrieval; provider binary behavior requires acceptance.",
  limitation:
    "JSON/JSONB text codecs preserve transport precision; JSONB normalization and extension validation are PostgreSQL behavior, not Kello authorization.",
  providerAcceptance: "passed",
  acceptanceReceipt: "docs/validation/2026-10-02-typed-extensions-jsonschema.md",
  publicExportAcceptance: "passed",
} as const;

/** Exact captured identities; executable provider tests remain a separate completion gate. */
export const pgJsonschemaAnnotations = [
  {
    id: "routine:$extension:pg_jsonschema.json_matches_schema(pg_catalog.json,pg_catalog.json)",
    disposition: "query",
    evidence,
    reason:
      "jsonMatchesSchema / sql.functions.json_matches_schema validates an instance with a JSON schema; invalid schema compilation raises rather than returning false.",
    semantics: { ...semantics, result: "boolean | null", codec: "pg:bool:1:nullable" },
  },
  {
    id: "routine:$extension:pg_jsonschema.jsonb_matches_schema(pg_catalog.json,pg_catalog.jsonb)",
    disposition: "query",
    evidence,
    reason:
      "jsonbMatchesSchema / sql.functions.jsonb_matches_schema keeps schema JSON and instance JSONB distinct; invalid schema compilation raises.",
    semantics: { ...semantics, result: "boolean | null", codec: "pg:bool:1:nullable" },
  },
  {
    id: "routine:$extension:pg_jsonschema.jsonschema_is_valid(pg_catalog.json)",
    disposition: "query",
    evidence,
    reason:
      "isValid / sql.functions.jsonschema_is_valid checks schema against its meta-schema; invalid schema returns false with a PostgreSQL NOTICE.",
    semantics: { ...semantics, result: "boolean | null", codec: "pg:bool:1:nullable" },
  },
  {
    id: "routine:$extension:pg_jsonschema.jsonschema_validation_errors(pg_catalog.json,pg_catalog.json)",
    disposition: "query",
    evidence,
    reason:
      "validationErrors / sql.functions.jsonschema_validation_errors returns empty text[] on success, instance diagnostics on mismatch, one compilation diagnostic for an invalid schema.",
    semantics: { ...semantics, result: "PostgreSqlArray<string> | null", codec: "pg:array:1:,:pg:text:1:nullable" },
  },
] as const;
