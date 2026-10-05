import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { lakebaseTokenizerAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/lakebase_tokenizer";

export const lakebaseTokenizerProofFamily = {
  extension: "lakebase_tokenizer",
  version: "0.1.1",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "b57e5d3240d67c933ba1a2665c2fd347f72df94f159f16a4d6c7ebeb8e7d7ef8",
} as const;
const base = { families: [lakebaseTokenizerProofFamily], claims: [] };
export const lakebaseTokenizerUnitProofCase: ExtensionProofCase = {
  ...base,
  id: "lakebase_tokenizer.unit",
  gate: "unit",
  file: "packages/tests/unit/extensions-lakebase-tokenizer.test.ts",
  title: "tokenizer exact contract and complete 32 member dispositions",
};
export const lakebaseTokenizerTypesProofCase: ExtensionProofCase = {
  ...base,
  id: "lakebase_tokenizer.types",
  gate: "types",
  file: "packages/tests/types/extensions-lakebase-tokenizer.test-d.ts",
  title: "tokenizer exact selection, native text and row/array result types, isolated maintenance",
};
export const lakebaseTokenizerDatabaseProofCase: ExtensionProofCase = {
  ...base,
  id: "lakebase_tokenizer.native",
  gate: "database",
  file: "packages/e2e/integration/extensions-lakebase-tokenizer.test.ts",
  title: "tokenizer native template, options, tables, constraints, codecs and relocation",
  claims: lakebaseTokenizerAnnotations.map((member) => ({
    family: lakebaseTokenizerProofFamily,
    member: member.id,
    scenario: "exact-native-catalog-and-family-behavior",
  })),
};
export const lakebaseTokenizerGenerationProofCase: ExtensionProofCase = {
  ...base,
  id: "lakebase_tokenizer.generation",
  gate: "generation",
  file: "packages/e2e/integration/extensions-lakebase-tokenizer-generated.test.ts",
  title: "tokenizer real first-load and disk generation, compiled types and native RPC/Effect",
};
export const lakebaseTokenizerConsumerProofCase: ExtensionProofCase = {
  ...base,
  id: "lakebase_tokenizer.consumer",
  gate: "consumer",
  file: "packages/e2e/integration/packed-lakebase-tokenizer.test.ts",
  title: "tokenizer preinstalled packed consumer, public generation and native cold RPC/Effect",
};
export const lakebaseTokenizerProofCases = [
  lakebaseTokenizerUnitProofCase,
  lakebaseTokenizerTypesProofCase,
  lakebaseTokenizerDatabaseProofCase,
  lakebaseTokenizerGenerationProofCase,
  lakebaseTokenizerConsumerProofCase,
];
type MemberProof = Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"][number];
export const lakebaseTokenizerMemberProofs: MemberProof[] = lakebaseTokenizerAnnotations.map((member) => ({
  id: member.id,
  disposition: member.disposition,
  reason: member.reason,
  citations: [...member.evidence],
  cases: [{ caseId: lakebaseTokenizerDatabaseProofCase.id, scenario: "exact-native-catalog-and-family-behavior" }],
  transfers: [],
}));
