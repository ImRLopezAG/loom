import * as v from "valibot";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/postgres_fdw.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { postgresFdwAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/postgres_fdw";
import {
  extensionProofReceiptDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  postgresFdwMemberProofs,
  postgresFdwDatabaseProofCases,
  postgresFdwUnitProofCases,
  postgresFdwTypesProofCase,
  postgresFdwGenerationProofCase,
  postgresFdwConsumerProofCase,
  postgresFdwProofFamily,
} from "./postgres_fdw-proof-cases";
export const postgresFdwProofCases = [
  ...postgresFdwUnitProofCases,
  postgresFdwTypesProofCase,
  ...postgresFdwDatabaseProofCases,
  postgresFdwGenerationProofCase,
  postgresFdwConsumerProofCase,
];

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/vite.config.ts",
  "bun.lock",
  "apps/loom/src/core/extensions/adapters/postgres_fdw.ts",
  "apps/loom/src/core/extensions/adapters/postgres_fdw-codecs.ts",
  "apps/loom/src/core/extensions/native-codecs.ts",
  "apps/loom/src/core/extensions/sql.ts",
  "apps/loom/src/tooling/extensions/operations/postgres_fdw.ts",
  "apps/loom/src/tooling/extensions/annotations/postgres_fdw.ts",
  "apps/loom/src/tooling/extensions/manifests/postgres_fdw.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/postgres_fdw-proof-cases.ts",
  "packages/e2e/fixtures/postgres_fdw-semantic-proof.ts",
  "packages/e2e/scripts/run-wave50-unit-types-proof.ts",
  "packages/e2e/scripts/report-wave50-proof.ts",
];
export const postgresFdwGateProofSources = {
  unit: [
    ...common,
    "packages/tests/unit/extensions-postgres_fdw.test.ts",
    "packages/e2e/fixtures/extension-proof-unit.ts",
  ],
  types: [...common, "packages/tests/types/extensions-postgres_fdw.test-d.ts"],
  database: [
    ...common,
    "packages/e2e/scripts/run-wave50-database-proof.ts",
    "packages/e2e/integration/extensions-postgres_fdw.test.ts",
    "packages/e2e/fixtures/postgres_fdw.ts",
    "packages/e2e/fixtures/postgres_fdw-remote.ts",
    "packages/e2e/fixtures/extension-database.ts",
    "packages/e2e/fixtures/extension-proof.ts",
    "packages/e2e/fixtures/extension-proof-database.ts",
    "apps/loom/src/tooling/extensions/capture.ts",
  ],
  generation: [
    ...common,
    "packages/e2e/scripts/run-wave50-composition-proof.ts",
    "packages/e2e/integration/extensions-postgres_fdw-generation.test.ts",
    "packages/e2e/fixtures/postgres_fdw-generated-project.ts",
    "packages/e2e/fixtures/postgres_fdw-generated-runtime.ts",
    "packages/e2e/fixtures/postgres_fdw-runtime-prepare.mjs.fixture",
    "packages/e2e/fixtures/postgres_fdw-generated-rpc.mjs.fixture",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  consumer: [
    ...common,
    "packages/e2e/scripts/run-wave50-composition-proof.ts",
    "packages/e2e/integration/packed-postgres_fdw.test.ts",
    "packages/e2e/fixtures/postgres_fdw-generated-project.ts",
    "packages/e2e/fixtures/postgres_fdw-packed-generation.mjs.fixture",
    "packages/e2e/fixtures/postgres_fdw-generated-runtime.ts",
    "packages/e2e/fixtures/postgres_fdw-runtime-prepare.mjs.fixture",
    "packages/e2e/fixtures/postgres_fdw-generated-rpc.mjs.fixture",
    "packages/e2e/fixtures/proof-artifact.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
};
export const postgresFdwSemanticProofSources = [...new Set(Object.values(postgresFdwGateProofSources).flat())];

/** Family-local candidate registration. Definitions and local tests confer no canonical gate acceptance. */
export function registerPostgresFdwSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw Error(`Duplicate postgres_fdw ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...postgresFdwGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? postgresFdwProofCases
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
    extension: "postgres_fdw",
    state: "candidate",
    family: postgresFdwProofFamily,
    schema: 'fdw "cache"',
    members: postgresFdwAnnotations.map((annotation) => {
      const proof = postgresFdwMemberProofs.find((proof) => proof.id === annotation.id);
      if (!proof || proof.disposition !== annotation.disposition)
        throw Error(`postgres_fdw annotation/proof mismatch: ${annotation.id}`);
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
  if (!input.declarations.some((entry) => entry.extension === "postgres_fdw" && entry.state === "pending"))
    throw Error("postgres_fdw registration requires the existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "postgres_fdw" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...postgresFdwProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
