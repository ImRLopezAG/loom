const evidence = [
  "apps/loom/src/tooling/extensions/manifests/address_standardizer.json",
  "https://github.com/postgis/postgis/blob/3.6.4/extensions/address_standardizer/std_pg_hash.c",
  "https://github.com/postgis/postgis/blob/3.6.4/extensions/address_standardizer/address_standardizer.c",
  "apps/loom/src/core/extensions/adapters/address-standardizer.ts",
  "apps/loom/src/core/extensions/adapters/address-standardizer-codecs.ts",
  "packages/tests/unit/extensions-address-standardizer.test.ts",
  "packages/tests/types/extensions-address-standardizer.test-d.ts",
  "packages/e2e/integration/extensions-address-standardizer.test.ts",
  "packages/e2e/scripts/run-address-standardizer-native-routines.ts",
  "packages/e2e/scripts/address-standardizer-native.Dockerfile",
] as const;

const pending = {
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
  nativeAcceptance: "owned-local-pg18",
} as const;

/** Exact 7-member dispositions. Native routines use the family-owned address_standardizer 3.6.4 image. */
export const addressStandardizerAnnotations = [
  {
    id: 'composite type:"$extension:address_standardizer".stdaddr',
    disposition: "schema",
    reason:
      "Captured composite relation for stdaddr; field layout matches type:$extension:address_standardizer.stdaddr and uses pg_catalog.record_in/record_out.",
    evidence,
    semantics: {
      ...pending,
      parent: "type:$extension:address_standardizer.stdaddr",
      transport:
        "Sixteen nullable text attributes in captured ordinal order. Empty composite fields are SQL NULL; Unicode and quoted text follow native record I/O.",
    },
  },
  {
    id: "routine:$extension:address_standardizer.debug_standardize_address(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact sql.overloads bind debug_standardize_address. Native is not strict; the fifth macro argument defaults to NULL and then parseaddress splits micro.",
    evidence,
    semantics: {
      ...pending,
      authority: "query",
      observability:
        "Typed lex/gaz/rules witnesses mark qualified relations as table dependencies. Unqualified names and raw text overloads follow search_path (session).",
      nulls: "Not strict. Missing macro uses native parseaddress; tableNameOk rejects non-alnum _ . \" source names.",
      transport:
        "Returns text. Native rule-id lookup quote_identifier()s the entire rultab string, so debug's secondary SELECT is a single identifier even when load_lex concatenated schema.table.",
    },
  },
  {
    id: "routine:$extension:address_standardizer.parse_address(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact sql.overloads bind parse_address. Native C parseaddress owns splitting; this adapter does not implement a JavaScript address algorithm.",
    evidence,
    semantics: {
      ...pending,
      authority: "query",
      observability: "tables",
      nulls: "Strict. NULL input yields NULL. OUT fields num, street, street2, address1, city, state, zip, zipplus, country are nullable text.",
      transport: "Returns a record decoded by the captured OUT attribute order.",
    },
  },
  {
    id: "routine:$extension:address_standardizer.standardize_address(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact five-argument standardize_address overload. Native std_standardize_mm owns normalization from micro and macro plus lex/gaz/rules tables.",
    evidence,
    semantics: {
      ...pending,
      authority: "query",
      observability:
        "Typed qualified sources witness schema.name dependencies. Unqualified sources and raw text table names are search_path session lookups.",
      nulls: "Strict. Any NULL argument yields NULL. Source names must pass native tableNameOk before SPI concatenation.",
      transport:
        "Returns stdaddr via record_in from sixteen nullable text attributes. load_lex/load_rules concatenate FROM <tab> ORDER BY id.",
    },
  },
  {
    id: "routine:$extension:address_standardizer.standardize_address(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact four-argument standardize_address overload. Native parseaddress splits the single address into micro and macro, then std_standardize_mm runs.",
    evidence,
    semantics: {
      ...pending,
      authority: "query",
      observability:
        "Typed qualified sources witness schema.name dependencies. Unqualified sources and raw text table names are search_path session lookups.",
      nulls: "Strict. Intersections (street2) error natively. Source names must pass native tableNameOk.",
      transport:
        "Same stdaddr composite as the five-argument overload. No JavaScript fallback algorithm is used or exported.",
    },
  },
  {
    id: "type:$extension:address_standardizer._stdaddr",
    disposition: "schema",
    reason: "Native stdaddr array field uses pg_catalog.array_in/out/recv/send over the stdaddr composite.",
    evidence,
    semantics: {
      ...pending,
      transport:
        "Array transfer preserves ranks, lower bounds, and NULL elements. Element text is the stdaddr record representation.",
    },
  },
  {
    id: "type:$extension:address_standardizer.stdaddr",
    disposition: "schema",
    reason:
      "Native stdaddr composite field uses pg_catalog.record_in/record_out. PostgreSQL owns attribute nulls; this codec does not invent address parts.",
    evidence,
    semantics: {
      ...pending,
      transport:
        "Text/binary record transfer. Attributes: building, house_num, predir, qual, pretype, name, suftype, sufdir, ruralroute, extra, city, state, country, postcode, box, unit.",
    },
  },
] as const;
