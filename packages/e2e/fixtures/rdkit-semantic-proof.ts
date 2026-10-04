import { rdkitAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/rdkit";
import { rdkitMemberProofs, rdkitProofCases, rdkitProofFamily } from "./rdkit-proof-cases";
import * as v from "valibot";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/rdkit.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import {
  extensionProofReceiptDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofGate,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));

/** Family-local candidate only. Parent owns canonical five-gate receipts. */
export const rdkitSemanticProofCandidate = {
  family: rdkitProofFamily,
  cases: rdkitProofCases,
  members: rdkitMemberProofs,
  annotations: rdkitAnnotations,
};

/** Register actual gate identities; the shared validator still decides acceptance. */
export function registerRdkitSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[],
): ExtensionSemanticProofInput {
  function gateRequirement(gate: ExtensionProofGate) {
    const receipt = receipts.find((entry) => entry.gate === gate);
    return {
      sources: [
        ...new Set([
          ...(receipt?.sourcesBefore.map((source) => source.file) ?? []),
          "packages/e2e/fixtures/rdkit-proof-cases.ts",
          "apps/loom/src/core/extensions/adapters/rdkit.ts",
          "apps/loom/src/core/extensions/adapters/rdkit-codecs.ts",
          "apps/loom/src/tooling/extensions/annotations/rdkit.ts",
          "apps/loom/src/tooling/extensions/manifests/rdkit.json",
          "apps/loom/package.json",
          "bun.lock",
          ...rdkitProofCases.filter((definition) => definition.gate === gate).map((definition) => definition.file),
        ]),
      ].sort(),
      proofs: receipt
        ? rdkitProofCases
            .filter((definition) => definition.gate === gate)
            .map((definition) => ({
              caseId: definition.id,
              runId: receipt.runId,
              receiptDigest: extensionProofReceiptDigest(receipt),
            }))
        : [],
    };
  }
  const declaration: ExtensionProofDeclaration = {
    extension: "rdkit",
    state: "candidate",
    family: rdkitProofFamily,
    schema: 'Chem"日本',
    members: rdkitMemberProofs,
    gates: {
      unit: gateRequirement("unit"),
      types: gateRequirement("types"),
      database: gateRequirement("database"),
      generation: gateRequirement("generation"),
      consumer: gateRequirement("consumer"),
    },
    catalogueVersionReconciliation: null,
  };
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "rdkit" ? declaration : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...rdkitProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
