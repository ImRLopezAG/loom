import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const unaccentProofFamily = {
  extension: "unaccent",
  version: "1.1",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "f983b4bfaa4c974c4ae2eba548249eb86d31d86376d019898b070ff66f9832dd",
} satisfies ExtensionProofFamily;
export const unaccentProofSchema = 'capture"text';
export const unaccentProofMembers = {
  implicit: "routine:$extension:unaccent.unaccent(pg_catalog.text)",
  explicit: "routine:$extension:unaccent.unaccent(pg_catalog.regdictionary,pg_catalog.text)",
  dictionary: 'text search dictionary:"$extension:unaccent".unaccent',
  template: 'text search template:"$extension:unaccent".unaccent',
  init: "routine:$extension:unaccent.unaccent_init(pg_catalog.internal)",
  lexize:
    "routine:$extension:unaccent.unaccent_lexize(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
} as const;
export const unaccentNativeProofClaims = {
  implicit: {
    family: unaccentProofFamily,
    member: unaccentProofMembers.implicit,
    scenario: "published-implicit-unicode-deletion-null-and-schema-lookup",
  },
  explicit: {
    family: unaccentProofFamily,
    member: unaccentProofMembers.explicit,
    scenario: "published-explicit-authentic-qualified-dictionaries-and-strict-nulls",
  },
  dictionary: {
    family: unaccentProofFamily,
    member: unaccentProofMembers.dictionary,
    scenario: "published-dictionary-inspection-creation-rules-reload-and-native-lexization",
  },
  template: {
    family: unaccentProofFamily,
    member: unaccentProofMembers.template,
    scenario: "published-template-inspection-native-creation-and-callback-lexization",
  },
};

export const unaccentNativeProofCase = {
  id: "unaccent.native-public-semantics",
  file: "packages/e2e/integration/unaccent-semantic-acceptance.test.ts",
  title:
    "Unaccent exact 1.1 public runtime and tooling preserve qualified native overloads, dictionaries and template callbacks",
  gate: "database",
  families: [unaccentProofFamily],
  claims: Object.values(unaccentNativeProofClaims),
} satisfies ExtensionProofCase;

// These are required case contracts, not observed executions or registrations in those runners.
// Genuine host receipts and corresponding runner wiring remain prerequisites for each gate.
export const unaccentUnitProofCase = {
  id: "unaccent.unit-contracts",
  file: "packages/tests/unit/extension-unaccent.test.ts",
  title: "Unaccent runtime, tooling and generated exact-pin unit contracts",
  gate: "unit",
  families: [unaccentProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const unaccentTypesProofCase = {
  id: "unaccent.types-contracts",
  file: "packages/tests/types/extension-unaccent.test-d.ts",
  title: "Unaccent public and generated nullable query and tooling declaration contracts",
  gate: "types",
  families: [unaccentProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const unaccentGenerationProofCase = {
  id: "unaccent.generation-contracts",
  file: "packages/e2e/integration/extension-adapter-codegen.test.ts",
  title: "Unaccent fresh project generation and mounted exact-selection contracts",
  gate: "generation",
  families: [unaccentProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const unaccentConsumerProofCase = {
  id: "unaccent.consumer-contracts",
  file: "packages/e2e/integration/packed-unaccent-identity.test.ts",
  title: "Unaccent isolated packed public identity, generated runtime, declarations and selected bundles",
  gate: "consumer",
  families: [unaccentProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const unaccentDatabaseProofCases = [unaccentNativeProofCase] satisfies ExtensionProofCase[];
export const unaccentProofCases = [
  unaccentNativeProofCase,
  unaccentUnitProofCase,
  unaccentTypesProofCase,
  unaccentGenerationProofCase,
  unaccentConsumerProofCase,
] satisfies ExtensionProofCase[];
