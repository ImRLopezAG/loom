import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const fuzzystrmatchProofFamily = {
  extension: "fuzzystrmatch",
  version: "1.2",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "0607e044d263e8999732df67f96cfb29479f6811db8b4df674acf3c9c9d16961",
} satisfies ExtensionProofFamily;
export const fuzzystrmatchProofSchema = 'custom"fuzzy';
export const fuzzystrmatchNativeProofClaims = {
  codes: {
    family: fuzzystrmatchProofFamily,
    member: "routine:$extension:fuzzystrmatch.daitch_mokotoff(pg_catalog.text)",
    scenario: "utf8-array-bounds-and-no-codes-null",
  },
  difference: {
    family: fuzzystrmatchProofFamily,
    member: "routine:$extension:fuzzystrmatch.difference(pg_catalog.text,pg_catalog.text)",
    scenario: "soundex-position-score-and-strict-null",
  },
  alternate: {
    family: fuzzystrmatchProofFamily,
    member: "routine:$extension:fuzzystrmatch.dmetaphone_alt(pg_catalog.text)",
    scenario: "alternate-phonetic-code-and-strict-null",
  },
  primary: {
    family: fuzzystrmatchProofFamily,
    member: "routine:$extension:fuzzystrmatch.dmetaphone(pg_catalog.text)",
    scenario: "primary-phonetic-code-and-strict-null",
  },
  boundedCosts: {
    family: fuzzystrmatchProofFamily,
    member:
      "routine:$extension:fuzzystrmatch.levenshtein_less_equal(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)",
    scenario: "directional-cost-bounded-distance-and-strict-null",
  },
  bounded: {
    family: fuzzystrmatchProofFamily,
    member: "routine:$extension:fuzzystrmatch.levenshtein_less_equal(pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
    scenario: "bounded-exact-threshold-and-strict-null",
  },
  cost: {
    family: fuzzystrmatchProofFamily,
    member:
      "routine:$extension:fuzzystrmatch.levenshtein(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)",
    scenario: "directional-insert-delete-substitute-costs-and-strict-null",
  },
  distance: {
    family: fuzzystrmatchProofFamily,
    member: "routine:$extension:fuzzystrmatch.levenshtein(pg_catalog.text,pg_catalog.text)",
    scenario: "utf8-edit-distance-filter-order-and-255-character-limit",
  },
  metaphone: {
    family: fuzzystrmatchProofFamily,
    member: "routine:$extension:fuzzystrmatch.metaphone(pg_catalog.text,pg_catalog.int4)",
    scenario: "byte-limits-truncated-code-and-strict-null",
  },
  soundex: {
    family: fuzzystrmatchProofFamily,
    member: "routine:$extension:fuzzystrmatch.soundex(pg_catalog.text)",
    scenario: "soundex-filtered-native-column-and-strict-null",
  },
  textSoundex: {
    family: fuzzystrmatchProofFamily,
    member: "routine:$extension:fuzzystrmatch.text_soundex(pg_catalog.text)",
    scenario: "canonical-soundex-alias-native-column-and-strict-null",
  },
};
export const fuzzystrmatchNativeProofCase = {
  id: "fuzzystrmatch.native-semantics",
  file: "packages/e2e/integration/extensions-fuzzy-token.test.ts",
  title: "fuzzy all eleven signatures decode and compose inside a Kello transaction",
  gate: "database",
  families: [fuzzystrmatchProofFamily],
  claims: Object.values(fuzzystrmatchNativeProofClaims),
} satisfies ExtensionProofCase;
export const fuzzystrmatchDatabaseProofCases = [fuzzystrmatchNativeProofCase];
export const fuzzystrmatchUnitProofCase = {
  id: "fuzzystrmatch.unit-contracts",
  file: "packages/tests/unit/extensions-fuzzy-token.test.ts",
  title: "fuzzystrmatch exact pin, required API and selected phonetic contracts",
  gate: "unit",
  families: [fuzzystrmatchProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const fuzzystrmatchTypesProofCase = {
  id: "fuzzystrmatch.types-contracts",
  file: "packages/tests/types/extensions-fuzzy-token.test-d.ts",
  title: "fuzzystrmatch public and generated exact overloads, arrays and nullable declarations",
  gate: "types",
  families: [fuzzystrmatchProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const fuzzystrmatchGenerationProofCase = {
  id: "fuzzystrmatch.generation-contracts",
  file: "packages/e2e/integration/extension-adapter-codegen.test.ts",
  title: "fuzzystrmatch first load retains every overload through mounted RPC and Effect",
  gate: "generation",
  families: [fuzzystrmatchProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const fuzzystrmatchConsumerProofCase = {
  id: "fuzzystrmatch.consumer-contracts",
  file: "packages/e2e/integration/packed-fuzzystrmatch.test.ts",
  title: "fuzzystrmatch isolated packed overloads, native RPC and selected bundles",
  gate: "consumer",
  families: [fuzzystrmatchProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const fuzzystrmatchProofCases = [
  ...fuzzystrmatchDatabaseProofCases,
  fuzzystrmatchUnitProofCase,
  fuzzystrmatchTypesProofCase,
  fuzzystrmatchGenerationProofCase,
  fuzzystrmatchConsumerProofCase,
];
