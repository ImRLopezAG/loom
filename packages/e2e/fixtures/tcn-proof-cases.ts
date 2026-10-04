import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
export const tcnProofFamily = {
  extension: "tcn",
  version: "1.0",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "9e2c3a247e11851d4d598bef9c62c5a7e26ba585089bce5d7a71e2c2db548a8a",
} as const satisfies ExtensionProofFamily;
export const tcnUnitCase: ExtensionProofCase = {
  id: "tcn.unit-contracts",
  gate: "unit",
  families: [tcnProofFamily],
  claims: [],
  file: "packages/tests/unit/extensions-tcn.test.ts",
  title: "tcn exact schema callback contract",
};
export const tcnTypesCase: ExtensionProofCase = {
  id: "tcn.types-contracts",
  gate: "types",
  families: [tcnProofFamily],
  claims: [],
  file: "packages/tests/types/extensions-tcn.test-d.ts",
  title: "tcn exact schema-authority and dedicated-session declarations",
};
export const tcnDatabaseFixtureCount = 1;
export const tcnSessionUnitCases: ExtensionProofCase[] = [
  "tcn decodes commas, Unicode, doubled quotes and old key values as text",
  "tcn acknowledges LISTEN before admission and revokes pending or retained session reads",
  "tcn cancellation settles a waiting callback and closes its dedicated session",
  "tcn preserves even undefined callback failures beside UNLISTEN and close failures",
  "tcn connection loss and invalid payloads fail the scope even when a read rejection is caught",
  "tcn listener cannot use pooled credentials or invalid channels",
].map((title, index) => ({
  id: `tcn.session-unit-${index + 1}`,
  gate: "unit",
  families: [tcnProofFamily],
  claims: [],
  file: "packages/tests/unit/extensions-tcn-session.test.ts",
  title,
}));
export const tcnDatabaseCase: ExtensionProofCase = {
  id: "tcn.native-trigger",
  gate: "database",
  families: [tcnProofFamily],
  file: "packages/e2e/integration/extensions-tcn.test.ts",
  title: "tcn native committed notifications carry old update keys",
  claims: [
    {
      family: tcnProofFamily,
      member: "routine:$extension:tcn.triggered_change_notification()",
      scenario: "native-committed-insert-update-old-delete-key-notifications-and-rollback-silence",
    },
  ],
};
