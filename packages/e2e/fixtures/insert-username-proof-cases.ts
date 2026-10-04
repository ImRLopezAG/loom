import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
export const insertUsernameProofFamily = {
  extension: "insert_username",
  version: "1.0",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "1e0649029c558b2e3000544c8066e51f12288377fd520226476740e7b0d25c32",
} as const satisfies ExtensionProofFamily;
export const insertUsernameUnitCase: ExtensionProofCase = {
  id: "insert_username.unit-contracts",
  gate: "unit",
  families: [insertUsernameProofFamily],
  claims: [],
  file: "packages/tests/unit/extensions-insert-username.test.ts",
  title: "insert_username exact schema callback contract",
};
export const insertUsernameTypesCase: ExtensionProofCase = {
  id: "insert_username.types-contracts",
  gate: "types",
  families: [insertUsernameProofFamily],
  claims: [],
  file: "packages/tests/types/extensions-insert-username.test-d.ts",
  title: "insert_username exact schema-authority declarations",
};
export const insertUsernameDatabaseFixtureCount = 1;
export const insertUsernameDatabaseRoleCount = 1;
export const insertUsernameDatabaseCase: ExtensionProofCase = {
  id: "insert_username.native-trigger",
  gate: "database",
  families: [insertUsernameProofFamily],
  file: "packages/e2e/integration/extensions-insert-username.test.ts",
  title: "insert_username native current_user overwrite and rollback",
  claims: [
    {
      family: insertUsernameProofFamily,
      member: "routine:$extension:insert_username.insert_username()",
      scenario: "native-current-user-null-overwrite-insert-update-rollback-and-protocol",
    },
  ],
};
