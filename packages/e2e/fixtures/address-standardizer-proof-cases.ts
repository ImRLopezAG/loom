import type {
  ExtensionProofCase,
  ExtensionProofFamily,
  ExtensionProofDeclaration,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { addressStandardizerAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/address-standardizer";

export const ADDRESS_STANDARDIZER_DIGEST =
  "f59d9c3801428f5360f8279dd04c64d7a8c74ed9c58afb733d95399aacdc5cc1";

export const addressStandardizerProofFamily = {
  extension: "address_standardizer",
  version: "3.6.4",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: ADDRESS_STANDARDIZER_DIGEST,
} as const satisfies ExtensionProofFamily;

export const addressStandardizerMembers = [
  'composite type:"$extension:address_standardizer".stdaddr',
  "routine:$extension:address_standardizer.debug_standardize_address(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  "routine:$extension:address_standardizer.parse_address(pg_catalog.text)",
  "routine:$extension:address_standardizer.standardize_address(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  "routine:$extension:address_standardizer.standardize_address(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  "type:$extension:address_standardizer._stdaddr",
  "type:$extension:address_standardizer.stdaddr",
] as const;

export const addressStandardizerProofSchema = 'Addr"日本';

export const addressStandardizerUnitProofCases = [
  { id: "address_standardizer.unit-contracts", title: "address_standardizer exact 7-member digest and factory identity" },
  {
    id: "address_standardizer.unit-transport",
    title: "stdaddr composite NULL Unicode and type IO without a JS address algorithm",
  },
  {
    id: "address_standardizer.unit-sources",
    title: "lex gaz rules source witness encodes native qualification search_path and dependencies",
  },
].map(
  (entry) =>
    ({
      ...entry,
      file: "packages/tests/unit/extensions-address-standardizer.test.ts",
      gate: "unit",
      families: [addressStandardizerProofFamily],
      claims: [],
    }) as const,
) satisfies ExtensionProofCase[];

export const addressStandardizerTypesProofCase = {
  id: "address_standardizer.types-contracts",
  file: "packages/tests/types/extensions-address-standardizer.test-d.ts",
  title: "address_standardizer public exact-version overloads typed sources and composite fields",
  gate: "types",
  families: [addressStandardizerProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

const typeMembers = [
  'composite type:"$extension:address_standardizer".stdaddr',
  "type:$extension:address_standardizer.stdaddr",
  "type:$extension:address_standardizer._stdaddr",
] as const;

export const addressStandardizerTypeIoProofCase = {
  id: "address_standardizer.native-stdaddr-type-io",
  file: "packages/e2e/integration/extensions-address-standardizer.test.ts",
  title: "address_standardizer stdaddr and array native record_in record_out NULL Unicode type IO",
  gate: "database",
  families: [addressStandardizerProofFamily],
  claims: typeMembers.map((member) => ({
    family: addressStandardizerProofFamily,
    member,
    scenario: "native-record-text-binary-null-unicode-type-io",
  })),
} satisfies ExtensionProofCase;

const routineMembers = addressStandardizerMembers.filter((member) => member.startsWith("routine:"));

export const addressStandardizerRoutineProofCase = {
  id: "address_standardizer.native-routines",
  file: "packages/e2e/scripts/run-address-standardizer-native-routines.ts",
  title: "address_standardizer both standardize_address overloads parse_address and debug native sources",
  gate: "database",
  families: [addressStandardizerProofFamily],
  claims: routineMembers.map((member) => ({
    family: addressStandardizerProofFamily,
    member,
    scenario: "native-source-qualification-search-path-relation-dependencies-and-strict-null",
  })),
} satisfies ExtensionProofCase;

export const addressStandardizerDatabaseProofCases = [
  addressStandardizerTypeIoProofCase,
  addressStandardizerRoutineProofCase,
] satisfies ExtensionProofCase[];

export const addressStandardizerGenerationProofCase = {
  id: "address_standardizer.generation-contracts",
  file: "packages/e2e/integration/extensions-address-standardizer-generated.test.ts",
  title: "address_standardizer public kello/tooling first-load disk types host/mounted RPC/Effect",
  gate: "generation",
  families: [addressStandardizerProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

type MemberProof = Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"][number];
export const addressStandardizerMemberProofs: MemberProof[] = addressStandardizerAnnotations.map((annotation) => {
  const cases = addressStandardizerDatabaseProofCases.flatMap((definition) =>
    definition.claims
      .filter((claim) => claim.member === annotation.id)
      .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
  );
  if (cases.length !== 1) throw new Error(`Missing exact address_standardizer native proof: ${annotation.id}`);
  return {
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases,
    transfers: [],
  };
});
