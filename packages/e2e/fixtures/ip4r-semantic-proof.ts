import * as v from "valibot";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/ip4r.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { ip4rAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/ip4r";
import {
  extensionProofReceiptDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  ip4rMemberProofs,
  ip4rDatabaseProofCases,
  ip4rUnitProofCases,
  ip4rTypesProofCase,
  ip4rProofSchema,
  ip4rProofFamily,
} from "./ip4r-proof-cases";
import { ip4rGenerationProofCase, ip4rConsumerProofCase } from "./ip4r-composition-proof-cases";
export const ip4rProofCases = [
  ...ip4rUnitProofCases,
  ip4rTypesProofCase,
  ...ip4rDatabaseProofCases,
  ip4rGenerationProofCase,
  ip4rConsumerProofCase,
];

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/vite.config.ts",
  "bun.lock",
  "apps/loom/src/core/extensions/adapters/ip4r.ts",
  "apps/loom/src/core/extensions/adapters/ip4r-codecs.ts",
  "apps/loom/src/core/extensions/native-codecs.ts",
  "apps/loom/src/core/extensions/sql.ts",
  "apps/loom/src/tooling/extensions/annotations/ip4r.ts",
  "apps/loom/src/tooling/extensions/manifests/ip4r.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/ip4r-proof-cases.ts",
  "packages/e2e/fixtures/ip4r-composition-proof-cases.ts",
  "packages/e2e/fixtures/ip4r-semantic-proof.ts",
  "packages/e2e/scripts/run-wave60-unit-types-proof.ts",
  "packages/e2e/scripts/report-wave60-proof.ts",
];
export const ip4rGateProofSources = {
  unit: [...common, "packages/tests/unit/extensions-ip4r.test.ts", "packages/e2e/fixtures/extension-proof-unit.ts"],
  types: [...common, "packages/tests/types/extensions-ip4r.test-d.ts"],
  database: [
    ...common,
    "packages/e2e/scripts/run-wave60-database-proof.ts",
    "packages/e2e/integration/extensions-ip4r.test.ts",
    "packages/e2e/fixtures/ip4r-api.ts",
    "packages/e2e/fixtures/extension-database.ts",
    "packages/e2e/fixtures/extension-proof.ts",
    "packages/e2e/fixtures/extension-proof-database.ts",
    "apps/loom/src/tooling/extensions/capture.ts",
  ],
  generation: [
    ...common,
    "packages/e2e/scripts/run-wave60-composition-proof.ts",
    "packages/e2e/integration/extensions-ip4r-generation.test.ts",
    "packages/e2e/fixtures/ip4r-generated-project.ts",
    "packages/e2e/fixtures/ip4r-generated-runtime.ts",
    "packages/e2e/fixtures/ip4r-runtime-prepare.mjs.fixture",
    "packages/e2e/fixtures/ip4r-generated-rpc.mjs.fixture",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  consumer: [
    ...common,
    "packages/e2e/scripts/run-wave60-composition-proof.ts",
    "packages/e2e/integration/packed-ip4r.test.ts",
    "packages/e2e/fixtures/ip4r-generated-project.ts",
    "packages/e2e/fixtures/ip4r-packed-generation.mjs.fixture",
    "packages/e2e/fixtures/ip4r-generated-runtime.ts",
    "packages/e2e/fixtures/ip4r-runtime-prepare.mjs.fixture",
    "packages/e2e/fixtures/ip4r-generated-rpc.mjs.fixture",
    "packages/e2e/fixtures/proof-artifact.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
};
export const ip4rSemanticProofSources = [...new Set(Object.values(ip4rGateProofSources).flat())];

/** Family-local candidate registration. Definitions and local tests confer no canonical gate acceptance. */
export function registerIp4rSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw Error(`Duplicate ip4r ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [...new Set([...ip4rGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])])],
      proofs: receipt
        ? ip4rProofCases
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
    extension: "ip4r",
    state: "candidate",
    family: ip4rProofFamily,
    schema: ip4rProofSchema,
    members: ip4rAnnotations.map((annotation) => {
      const proof = ip4rMemberProofs.find((proof) => proof.id === annotation.id);
      if (!proof || proof.disposition !== annotation.disposition)
        throw Error(`ip4r annotation/proof mismatch: ${annotation.id}`);
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
  if (!input.declarations.some((entry) => entry.extension === "ip4r" && entry.state === "pending"))
    throw Error("ip4r registration requires the existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "ip4r" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...ip4rProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
