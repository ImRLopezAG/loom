import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
export const refintProofFamily = {
  extension: "refint",
  version: "1.0",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "689cb4ce75e39aea52f0b19a522b1b35bb743a8fca286195e9fa98894fa49011",
} as const satisfies ExtensionProofFamily;
export const refintUnitCase: ExtensionProofCase = {
  id: "refint.unit-contracts",
  gate: "unit",
  families: [refintProofFamily],
  claims: [],
  file: "packages/tests/unit/extensions-refint.test.ts",
  title: "refint exact schema callback contracts",
};
export const refintTypesCase: ExtensionProofCase = {
  id: "refint.types-contracts",
  gate: "types",
  families: [refintProofFamily],
  claims: [],
  file: "packages/tests/types/extensions-refint.test-d.ts",
  title: "refint exact schema-authority declarations",
};
export const refintDatabaseFixtureCount = 1;
export const refintDatabaseRoleCount = 1;
export const refintDatabaseCase: ExtensionProofCase = {
  id: "refint.native-triggers",
  gate: "database",
  families: [refintProofFamily],
  file: "packages/e2e/integration/extensions-refint.test.ts",
  title: "refint native key checks and all referential actions",
  claims: [
    {
      family: refintProofFamily,
      member: "routine:$extension:refint.check_primary_key()",
      scenario: "native-insert-update-null-key-and-missing-reference",
    },
    {
      family: refintProofFamily,
      member: "routine:$extension:refint.check_foreign_key()",
      scenario: "native-update-delete-restrict-cascade-setnull-multiple-references-and-rollback",
    },
  ],
};
