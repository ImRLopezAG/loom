import * as v from "valibot";
import sourceRegistry from "./isn-proof-sources.json";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/isn.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { isnAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/isn";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { isnMemberProofs, isnProofCases, isnProofFamily } from "./isn-proof-cases";
import { isnProofSchema } from "./isn-api";

// The host reconciles these reviewed paths with each actual import graph and binds bytes before and after execution.
const rosters = v.parse(
  v.strictObject({
    format: v.literal(1),
    entry: v.literal("packages/e2e/integration/extensions-isn.test.ts"),
    sources: v.pipe(v.array(v.string()), v.minLength(1)),
    generationSources: v.pipe(v.array(v.string()), v.minLength(1)),
    consumerSources: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  sourceRegistry,
);
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/src/core/extensions/adapters/isn.ts",
  "apps/loom/src/core/extensions/adapters/isn-codecs.ts",
  "apps/loom/src/tooling/extensions/annotations/isn.ts",
  "apps/loom/src/tooling/extensions/manifests/isn.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "apps/loom/src/tooling/extensions/operations/isn.ts",
  "packages/e2e/fixtures/isn-api.ts",
  "packages/e2e/fixtures/isn-generated-project.ts",
  "packages/e2e/fixtures/isn-consumer.ts.fixture",
  "packages/e2e/fixtures/isn-proof-cases.ts",
  "packages/e2e/fixtures/isn-proof-sources.json",
  "packages/e2e/fixtures/isn-semantic-proof.ts",
  "packages/e2e/fixtures/proof-artifact.ts",
  "packages/e2e/scripts/report-extension-semantic-proof.ts",
  "bun.lock",
];
export const isnGateProofSources = {
  database: [...common, ...rosters.sources],
  unit: [...common, "packages/tests/unit/extensions-isn.test.ts", "apps/loom/src/tooling/codegen/extensions.ts"],
  types: [...common, "packages/tests/types/extensions-isn.test-d.ts", "apps/loom/src/tooling/codegen/extensions.ts"],
  generation: [...common, ...rosters.generationSources],
  consumer: [...common, ...rosters.consumerSources],
};
export const isnSemanticProofSources = [...new Set(Object.values(isnGateProofSources).flat())];
extensionProofSourcesDigest(isnSemanticProofSources.map((file) => ({ file, sha256: "0".repeat(64) })));

/** Registration declares requirements; only current host receipts and direct witnesses can satisfy them. */
export function registerIsnSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate isn ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [...new Set([...isnGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])])],
      proofs: receipt
        ? isnProofCases
            .filter((definition) => definition.gate === gate)
            .map((definition) => ({
              caseId: definition.id,
              runId: receipt.runId,
              receiptDigest: extensionProofReceiptDigest(receipt),
            }))
        : [],
    };
  }
  const candidate: ExtensionProofDeclaration = {
    extension: "isn",
    state: "candidate",
    family: isnProofFamily,
    schema: isnProofSchema,
    members: isnAnnotations.map((annotation) => {
      const proof = isnMemberProofs.find((entry) => entry.id === annotation.id);
      if (!proof || proof.disposition !== annotation.disposition)
        throw new Error(`ISN annotation/proof mismatch: ${annotation.id}`);
      return {
        ...proof,
        reason: annotation.reason,
        citations: [...new Set([...annotation.evidence, ...proof.citations])],
      };
    }),
    gates: {
      database: requirement("database"),
      unit: requirement("unit"),
      types: requirement("types"),
      generation: requirement("generation"),
      consumer: requirement("consumer"),
    },
    catalogueVersionReconciliation: null,
  };
  if (!input.declarations.some((entry) => entry.extension === "isn" && entry.state === "pending"))
    throw new Error("isn registration requires its existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "isn" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...isnProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
