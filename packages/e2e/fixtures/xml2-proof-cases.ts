import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const xml2ProofFamily = {
  extension: "xml2",
  version: "1.2",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "0353f94ca9d2e1f73f4a490e2a210a6412e88dd516028b44e9b81a59ff3fb03c",
} as const satisfies ExtensionProofFamily;

export const xml2Members = [
  "routine:$extension:xml2.xml_encode_special_chars(pg_catalog.text)",
  "routine:$extension:xml2.xml_valid(pg_catalog.text)",
  "routine:$extension:xml2.xpath_bool(pg_catalog.text,pg_catalog.text)",
  "routine:$extension:xml2.xpath_list(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  "routine:$extension:xml2.xpath_list(pg_catalog.text,pg_catalog.text)",
  "routine:$extension:xml2.xpath_nodeset(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  "routine:$extension:xml2.xpath_nodeset(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  "routine:$extension:xml2.xpath_nodeset(pg_catalog.text,pg_catalog.text)",
  "routine:$extension:xml2.xpath_number(pg_catalog.text,pg_catalog.text)",
  "routine:$extension:xml2.xpath_string(pg_catalog.text,pg_catalog.text)",
  "routine:$extension:xml2.xpath_table(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  "routine:$extension:xml2.xslt_process(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  "routine:$extension:xml2.xslt_process(pg_catalog.text,pg_catalog.text)",
] as const;

export const xml2UnitProofCases = [
  { id: "xml2.unit-contracts", title: "xml2 exact manifest coverage and digest identity" },
  { id: "xml2.unit-sql", title: "xml2 qualified SQL binds parameters and quoted xpath_table identities" },
].map(
  (entry) =>
    ({
      ...entry,
      file: "packages/tests/unit/extensions-xml2.test.ts",
      gate: "unit",
      families: [xml2ProofFamily],
      claims: [],
    }) as const,
) satisfies ExtensionProofCase[];

export const xml2TypesProofCase = {
  id: "xml2.types-contracts",
  file: "packages/tests/types/extensions-xml2.test-d.ts",
  title: "xml2 public exact-version helpers and rejected raw table SQL",
  gate: "types",
  families: [xml2ProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const xml2NativeProofCase = {
  id: "xml2.native-ordinary",
  file: "packages/e2e/integration/extensions-xml2.test.ts",
  title: "xml2.all13NativeIdentitiesNullXPathTableAndXslt",
  gate: "database",
  families: [xml2ProofFamily],
  claims: xml2Members.map((member) => ({
    family: xml2ProofFamily,
    member,
    scenario: "native-independent-sql-value-and-strict-null",
  })),
} satisfies ExtensionProofCase;

export const xml2GenerationProofCase = {
  id: "xml2.generation-contracts",
  file: "packages/e2e/integration/extension-xml2-codegen.test.ts",
  title: "xml2 first load, disk import, RPC/Effect bindings and 13 native members through generated extensions",
  gate: "generation",
  families: [xml2ProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
