import * as v from "valibot";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/pg_graphql.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { pgGraphqlAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_graphql";
import {
  extensionProofReceiptDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  pgGraphqlMemberProofs,
  pgGraphqlNativeProofCase,
  pgGraphqlUnitProofCases,
  pgGraphqlTypesProofCase,
  pgGraphqlProofFamily,
} from "./pg_graphql-proof-cases";
import { pgGraphqlGenerationProofCase, pgGraphqlConsumerProofCase } from "./pg_graphql-proof-cases";
const pgGraphqlProofSchema = "graphql";
export const pgGraphqlProofCases = [
  ...pgGraphqlUnitProofCases,
  pgGraphqlTypesProofCase,
  pgGraphqlNativeProofCase,
  pgGraphqlGenerationProofCase,
  pgGraphqlConsumerProofCase,
];

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/vite.config.ts",
  "bun.lock",
  "apps/loom/src/core/extensions/adapters/pg_graphql.ts",
  "apps/loom/src/core/extensions/native-codecs.ts",
  "apps/loom/src/core/extensions/sql.ts",
  "apps/loom/src/tooling/extensions/annotations/pg_graphql.ts",
  "apps/loom/src/tooling/extensions/manifests/pg_graphql.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/pg_graphql-proof-cases.ts",
  "packages/e2e/fixtures/pg_graphql-semantic-proof.ts",
  "packages/e2e/scripts/run-wave70-unit-types-proof.ts",
  "packages/e2e/scripts/report-wave70-proof.ts",
];
export const pgGraphqlGateProofSources = {
  unit: [
    ...common,
    "packages/tests/unit/extensions-pg_graphql.test.ts",
    "packages/e2e/fixtures/extension-proof-unit.ts",
  ],
  types: [...common, "packages/tests/types/extensions-pg_graphql.test-d.ts"],
  database: [
    ...common,
    "packages/e2e/scripts/run-wave70-database-proof.ts",
    "packages/e2e/integration/extensions-pg_graphql.test.ts",
    "packages/e2e/fixtures/pg_graphql.ts",
    "packages/e2e/fixtures/extension-database.ts",
    "packages/e2e/fixtures/extension-proof.ts",
    "packages/e2e/fixtures/extension-proof-database.ts",
    "apps/loom/src/tooling/extensions/capture.ts",
  ],
  generation: [
    ...common,
    "packages/e2e/scripts/run-wave70-composition-proof.ts",
    "packages/e2e/integration/extensions-pg_graphql-generated.test.ts",
    "packages/e2e/fixtures/pg_graphql-generated-project.ts",
    "packages/e2e/fixtures/pg-graphql-generated-runtime.ts",
    "packages/e2e/fixtures/pg-graphql-runtime-prepare.mjs.fixture",
    "packages/e2e/fixtures/pg-graphql-generated-rpc.mjs.fixture",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  consumer: [
    ...common,
    "packages/e2e/scripts/run-wave70-composition-proof.ts",
    "packages/e2e/integration/packed-pg_graphql.test.ts",
    "packages/e2e/fixtures/pg_graphql-generated-project.ts",
    "packages/e2e/fixtures/pg-graphql-generated-runtime.ts",
    "packages/e2e/fixtures/pg-graphql-runtime-prepare.mjs.fixture",
    "packages/e2e/fixtures/pg-graphql-generated-rpc.mjs.fixture",
    "packages/e2e/fixtures/proof-artifact.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
};
export const pgGraphqlSemanticProofSources = [...new Set(Object.values(pgGraphqlGateProofSources).flat())];

/** Family-local candidate registration. Definitions and local tests confer no canonical gate acceptance. */
export function registerPgGraphqlSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw Error(`Duplicate pgGraphql ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...pgGraphqlGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? pgGraphqlProofCases
            .filter((proof) => proof.gate === gate)
            .map((proof) => ({
              caseId: proof.id,
              runId: receipt.runId,
              receiptDigest: extensionProofReceiptDigest(receipt),
            }))
        : [],
    };
  }
  const candidate: ExtensionProofDeclaration = {
    extension: "pg_graphql",
    state: "candidate",
    family: pgGraphqlProofFamily,
    schema: pgGraphqlProofSchema,
    members: pgGraphqlAnnotations.map((annotation) => {
      const proof = pgGraphqlMemberProofs.find((proof) => proof.id === annotation.id);
      if (!proof || proof.disposition !== annotation.disposition)
        throw Error(`pgGraphql annotation/proof mismatch: ${annotation.id}`);
      return {
        ...proof,
        reason: annotation.reason,
        citations: [...new Set([...annotation.evidence, ...proof.citations])],
      };
    }),
    gates: {
      unit: requirement("unit"),
      types: requirement("types"),
      database: requirement("database"),
      generation: requirement("generation"),
      consumer: requirement("consumer"),
    },
    catalogueVersionReconciliation: null,
  };
  if (!input.declarations.some((entry) => entry.extension === "pg_graphql" && entry.state === "pending"))
    throw Error("pgGraphql registration requires the existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "pg_graphql" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...pgGraphqlProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
