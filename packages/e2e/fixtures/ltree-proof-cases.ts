import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { ltreeAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/ltree";

export const ltreeProofFamily = {
  extension: "ltree",
  version: "1.3",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "f0d5b39c468e80a8748a7a35ed30af0e530da547c2c15ebcaee307e34090c82e",
} satisfies ExtensionProofFamily;
export const ltreeProofSchema = 'Ltree "Q';
export const ltreeQueryScenario = "typed-builder-equals-direct-native-call-and-strict-null";
export const ltreeStorageScenario = "migrated-selected-schema-storage-round-trip-and-rpc";
export const ltreeIndexScenario = "migrated-selected-schema-class-and-native-index-scan";
const claims = (disposition: "query" | "schema", scenario: (id: string) => string) =>
  ltreeAnnotations
    .filter((annotation) => annotation.disposition === disposition)
    .map((annotation) => ({ family: ltreeProofFamily, member: annotation.id, scenario: scenario(annotation.id) }));
export const ltreeNativeProofCase = {
  id: "ltree.native-semantics",
  file: "packages/e2e/integration/extensions-ltree.test.ts",
  title: "ltree every public routine and operator matches direct native calls",
  gate: "database",
  families: [ltreeProofFamily],
  claims: claims("query", () => ltreeQueryScenario),
} satisfies ExtensionProofCase;
export const ltreeEdgeProofCase = {
  id: "ltree.native-edges",
  file: "packages/e2e/integration/extensions-ltree.test.ts",
  title: "ltree labels, case, unicode, limits and array rejections stay native",
  gate: "database",
  families: [ltreeProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const ltreeSchemaProofCase = {
  id: "ltree.native-schema",
  file: "packages/e2e/integration/extensions-ltree.test.ts",
  title: "ltree fields, defaults, operator classes and native index scans",
  gate: "database",
  families: [ltreeProofFamily],
  claims: claims("schema", (id) => (id.startsWith("opclass:") ? ltreeIndexScenario : ltreeStorageScenario)),
} satisfies ExtensionProofCase;
export const ltreeNativeGraphProofCase = {
  id: "ltree.native-unregistered-estimator",
  file: "packages/e2e/integration/extensions-ltree.test.ts",
  title: "ltree unregistered estimator has its exact native signature and no catalog owner",
  gate: "database",
  families: [ltreeProofFamily],
  claims: [
    {
      family: ltreeProofFamily,
      member:
        "routine:$extension:ltree.ltreeparentsel(pg_catalog.internal,pg_catalog.oid,pg_catalog.internal,pg_catalog.int4)",
      scenario: "exact-native-internal-signature-and-no-registered-owner",
    },
  ],
} satisfies ExtensionProofCase;
export const ltreeDatabaseProofCases = [
  ltreeNativeProofCase,
  ltreeEdgeProofCase,
  ltreeSchemaProofCase,
  ltreeNativeGraphProofCase,
];
export const ltreeUnitProofCase = {
  id: "ltree.unit-contracts",
  file: "packages/tests/unit/extensions-ltree.test.ts",
  title: "ltree exact pin, generated factory and required API contracts",
  gate: "unit",
  families: [ltreeProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const ltreeTypesProofCase = {
  id: "ltree.types-contracts",
  file: "packages/tests/types/extensions-ltree.test-d.ts",
  title: "ltree branded inputs, nullable strict results and exact overload arity",
  gate: "types",
  families: [ltreeProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const ltreeGenerationProofCase = {
  id: "ltree.generation-contracts",
  file: "packages/e2e/integration/extensions-ltree-codegen.test.ts",
  title: "ltree first load generates the selected adapter through mounted RPC and Effect",
  gate: "generation",
  families: [ltreeProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const ltreeConsumerProofCase = {
  id: "ltree.consumer-contracts",
  file: "packages/e2e/integration/packed-ltree.test.ts",
  title: "ltree isolated packed consumer, native RPC and selected bundles",
  gate: "consumer",
  families: [ltreeProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const ltreeProofCases = [
  ...ltreeDatabaseProofCases,
  ltreeUnitProofCase,
  ltreeTypesProofCase,
  ltreeGenerationProofCase,
  ltreeConsumerProofCase,
];
