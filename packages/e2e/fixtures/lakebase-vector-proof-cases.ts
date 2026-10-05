import type { ExtensionProofCase, ExtensionProofFamily } from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const lakebaseVectorProofFamily = {
  extension: "lakebase_vector",
  version: "1.1.1",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "bfa194865eaeda1069f2743247af32e0609848bdee87f1565e17cefc231fec20",
} as const satisfies ExtensionProofFamily;

export const lakebaseVectorUnitProofCase = {
  id: "lakebase_vector.unit-contracts",
  file: "packages/tests/unit/extensions-lakebase-vector.test.ts",
  title: "lakebase_vector exact 1.1.1 pin, 212-member graph, codecs, indexes and SQL",
  gate: "unit",
  families: [lakebaseVectorProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const lakebaseVectorTypesProofCase = {
  id: "lakebase_vector.types-contracts",
  file: "packages/tests/types/extensions-lakebase-vector.test-d.ts",
  title: "lakebase_vector public literal pins, fields, indexes and callable overloads",
  gate: "types",
  families: [lakebaseVectorProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

/** Public loadProject/generateProject, including virtual and emitted-disk selection. */
export const lakebaseVectorGenerationProofCase = {
  id: "lakebase_vector.generation-contracts",
  file: "packages/e2e/integration/extensions-lakebase-vector-generated.test.ts",
  title: "lakebase_vector public generation: virtual/disk, omitted/empty/future, default/custom and RPC/Effect types",
  gate: "generation",
  families: [lakebaseVectorProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

/** Parent supplies a frozen tarball installation and the exact private native target. */
export const lakebaseVectorConsumerProofCase = {
  id: "lakebase_vector.consumer-contracts",
  file: "packages/e2e/integration/packed-lakebase-vector.test.ts",
  title: "lakebase_vector frozen tarball genuine generation, cold Node24 emitted RPC/Effect and exhaustive native calls",
  gate: "consumer",
  families: [lakebaseVectorProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const lakebaseVectorNativeProofCase = {
  id: "lakebase_vector.native-characterization",
  file: "packages/e2e/scripts/run-lakebase-vector-native-characterization.ts",
  title: "lakebase_vector parent private 1.1.1 native callable/index/type graph, no skipped acceptance",
  gate: "database",
  families: [lakebaseVectorProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const lakebaseVectorProofCases = [
  lakebaseVectorUnitProofCase,
  lakebaseVectorTypesProofCase,
  lakebaseVectorGenerationProofCase,
  lakebaseVectorConsumerProofCase,
  lakebaseVectorNativeProofCase,
];
