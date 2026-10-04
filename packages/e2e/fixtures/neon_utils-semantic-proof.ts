import * as v from "valibot";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/neon_utils.json";
import sourceRoster from "./neon_utils-proof-sources.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { neonUtilsAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/neon_utils";
import {
  extensionProofReceiptDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { neonUtilsMemberProofs, neonUtilsProofCases, neonUtilsProofFamily } from "./neon_utils-proof-cases";

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "packages/e2e/fixtures/generated-runtime-prepare.mjs.fixture",
  "packages/e2e/fixtures/generated-runtime-bundle.mjs.fixture",
  "apps/loom/package.json",
  "apps/loom/vite.config.ts",
  "bun.lock",
  "apps/loom/src/core/extensions/adapters/neon_utils.ts",
  "apps/loom/src/core/extensions/native-codecs.ts",
  "apps/loom/src/core/extensions/sql.ts",
  "apps/loom/src/tooling/extensions/annotations/neon_utils.ts",
  "apps/loom/src/tooling/extensions/manifests/neon_utils.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/neon_utils-proof-cases.ts",
  "packages/e2e/fixtures/neon_utils-proof-sources.json",
  "packages/e2e/fixtures/neon_utils-semantic-proof.ts",
  "packages/e2e/fixtures/neon_utils-public-types.ts.fixture",
  "packages/e2e/fixtures/neon_utils-generated-rpc.mjs.fixture",
  "packages/e2e/scripts/run-neon_utils-local-proof.ts",
];
export const neonUtilsGateProofSources = {
  unit: [
    ...sourceRoster.unit,
    ...common,
    "packages/tests/unit/extensions-neon_utils.test.ts",
    "packages/e2e/fixtures/extension-proof-unit.ts",
  ],
  types: [...sourceRoster.types, ...common, "packages/tests/types/extensions-neon_utils.test-d.ts"],
  database: [
    ...sourceRoster.database,
    ...common,
    "packages/e2e/integration/extensions-neon_utils.test.ts",
    "packages/e2e/fixtures/extension-database.ts",
    "packages/e2e/fixtures/extension-proof.ts",
    "packages/e2e/fixtures/extension-proof-database.ts",
    "apps/loom/src/tooling/extensions/capture.ts",
  ],
  generation: [
    ...sourceRoster.generation,
    ...common,
    "packages/e2e/integration/extensions-neon_utils-generated.test.ts",
    "packages/e2e/fixtures/neon_utils-generated-project.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  consumer: [
    ...sourceRoster.consumer,
    ...common,
    "packages/e2e/integration/packed-neon_utils.test.ts",
    "packages/e2e/fixtures/neon_utils-generated-project.ts",
    "packages/e2e/fixtures/proof-artifact.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
};
export const neonUtilsSemanticProofSources = [...new Set(Object.values(neonUtilsGateProofSources).flat())];

/** Family-local candidate registration. Definitions and local tests confer no canonical gate acceptance. */
export function registerNeonUtilsSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw Error(`Duplicate neon_utils ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...neonUtilsGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? neonUtilsProofCases
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
    extension: "neon_utils",
    state: "candidate",
    family: neonUtilsProofFamily,
    schema: 'cpu"native',
    members: neonUtilsAnnotations.map((annotation) => {
      const proof = neonUtilsMemberProofs.find((proof) => proof.id === annotation.id);
      if (!proof || proof.disposition !== annotation.disposition)
        throw Error(`neon_utils annotation/proof mismatch: ${annotation.id}`);
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
  if (!input.declarations.some((entry) => entry.extension === "neon_utils" && entry.state === "pending"))
    throw Error("neon_utils registration requires the existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "neon_utils" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...neonUtilsProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
