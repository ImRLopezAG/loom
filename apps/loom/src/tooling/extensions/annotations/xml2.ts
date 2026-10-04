const sources = [
  "https://www.postgresql.org/docs/18/xml2.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/xml2/xpath.c",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/xml2/xslt_proc.c",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/xml2/pgxml--1.1--1.2.sql",
  "apps/loom/src/tooling/extensions/manifests/xml2.json",
] as const;
const unit =
  "packages/tests/unit/extensions-xml2.test.ts: exact contract, qualified SQL, parameterized text, quoted xpath_table identities";
const types =
  "packages/tests/types/extensions-xml2.test-d.ts: nullable text/bool/float4 results, rejected raw WHERE, exact factory version";
const database =
  "packages/e2e/integration/extensions-xml2.test.ts: native well-formedness, XPath, XSLT, forbidden XSLT file/network IO, xpath_table, STRICT NULL, rollback; source-bound member gates remain required";
const evidence = [...sources, unit, types, database] as const;
const query = {
  authority: "query",
  observability: "tables",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
  nativeAcceptance: "pending",
} as const;

/** Reviewed dispositions; final per-member acceptance requires source-bound native and provider receipts. */
export const xml2AnnotationContract = {
  extension: "xml2",
  postgresMajor: 18,
  version: "1.2",
  provider: "neon",
  digest: "0353f94ca9d2e1f73f4a490e2a210a6412e88dd516028b44e9b81a59ff3fb03c",
  providerAcceptance: "pending",
} as const;

export const xml2Annotations = [
  {
    id: "routine:$extension:xml2.xml_encode_special_chars(pg_catalog.text)",
    disposition: "query",
    reason:
      "encodeSpecialChars / sql.functions.xml_encode_special_chars binds the captured encoder. It emits XML character entities; it does not parse or validate a document.",
    evidence,
    semantics: {
      ...query,
      result: "string | null",
      codec: "pg:text:1:nullable",
      nulls: "STRICT: any SQL NULL argument returns NULL",
    },
  },
  {
    id: "routine:$extension:xml2.xml_valid(pg_catalog.text)",
    disposition: "query",
    reason:
      "valid / sql.functions.xml_valid binds the captured well-formedness check. The name is historical; the function does not perform DTD validation.",
    evidence,
    semantics: {
      ...query,
      result: "boolean | null",
      codec: "pg:bool:1:nullable",
      nulls: "STRICT: any SQL NULL argument returns NULL",
    },
  },
  {
    id: "routine:$extension:xml2.xpath_bool(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason: "xpathBool / sql.functions.xpath_bool evaluates an XPath predicate against a document text argument.",
    evidence,
    semantics: {
      ...query,
      result: "boolean | null",
      codec: "pg:bool:1:nullable",
      nulls: "STRICT: any SQL NULL argument returns NULL",
    },
  },
  {
    id: "routine:$extension:xml2.xpath_list(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "xpathList(document, path, separator) / the three-argument sql.overloads member joins matching node strings with the captured separator.",
    evidence,
    semantics: {
      ...query,
      result: "string | null",
      codec: "pg:text:1:nullable",
      nulls: "STRICT: any SQL NULL argument returns NULL",
    },
  },
  {
    id: "routine:$extension:xml2.xpath_list(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "xpathList(document, path) binds the captured two-argument SQL wrapper, which supplies the native comma separator.",
    evidence,
    semantics: {
      ...query,
      result: "string | null",
      codec: "pg:text:1:nullable",
      nulls: "STRICT: any SQL NULL argument returns NULL",
    },
  },
  {
    id: "routine:$extension:xml2.xpath_nodeset(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "xpathNodeset(document, path, toptag, itemtag) binds the captured four-argument wrapper that wraps a nodeset in caller-supplied tags.",
    evidence,
    semantics: {
      ...query,
      result: "string | null",
      codec: "pg:text:1:nullable",
      nulls: "STRICT: any SQL NULL argument returns NULL",
    },
  },
  {
    id: "routine:$extension:xml2.xpath_nodeset(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "xpathNodeset(document, path, toptag) binds the captured three-argument SQL wrapper, which supplies an empty item tag.",
    evidence,
    semantics: {
      ...query,
      result: "string | null",
      codec: "pg:text:1:nullable",
      nulls: "STRICT: any SQL NULL argument returns NULL",
    },
  },
  {
    id: "routine:$extension:xml2.xpath_nodeset(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "xpathNodeset(document, path) binds the captured two-argument SQL wrapper, which supplies empty top and item tags.",
    evidence,
    semantics: {
      ...query,
      result: "string | null",
      codec: "pg:text:1:nullable",
      nulls: "STRICT: any SQL NULL argument returns NULL",
    },
  },
  {
    id: "routine:$extension:xml2.xpath_number(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "xpathNumber / sql.functions.xpath_number returns native float4; PostgreSQL converts a nonnumeric XPath result to SQL NULL.",
    evidence,
    semantics: {
      ...query,
      result: "number | NonfiniteNumber | null",
      codec: "pg:float4:1:nullable",
      nulls: "STRICT: any SQL NULL argument returns NULL",
    },
  },
  {
    id: "routine:$extension:xml2.xpath_string(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason: "xpathString / sql.functions.xpath_string returns the string-value of an XPath against document text.",
    evidence,
    semantics: {
      ...query,
      result: "string | null",
      codec: "pg:text:1:nullable",
      nulls: "STRICT: any SQL NULL argument returns NULL",
    },
  },
  {
    id: "routine:$extension:xml2.xpath_table(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "xpathTable interpolates quoted relation/column identities or a managed nested-query subquery. Raw WHERE text and unproven relation strings are rejected; the condition is the constant true or the nested query's already-reviewed predicate.",
    evidence,
    semantics: {
      ...query,
      result: "setof record with an explicit key-plus-XPath column schema",
      codec: "anonymous record columns from caller codecs",
      nulls: "STRICT: NULL arguments yield no rows",
      nested: "Typed relation identity or NestedQuery; never caller SQL text",
    },
  },
  {
    id: "routine:$extension:xml2.xslt_process(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "xsltProcess(document, stylesheet, params) binds the captured volatile three-argument member. xslt_proc.c forbids libxslt file and network IO, so parameter values and stylesheets cannot read outside the query's tables.",
    evidence,
    semantics: {
      ...query,
      result: "string | null",
      codec: "pg:text:1:nullable",
      nulls: "STRICT: any SQL NULL argument returns NULL",
    },
  },
  {
    id: "routine:$extension:xml2.xslt_process(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "xsltProcess(document, stylesheet) binds the captured immutable two-argument transform. It shares the three-argument member's forbidden file and network IO.",
    evidence,
    semantics: {
      ...query,
      result: "string | null",
      codec: "pg:text:1:nullable",
      nulls: "STRICT: any SQL NULL argument returns NULL",
    },
  },
] as const;
