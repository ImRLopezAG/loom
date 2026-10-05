import * as v from "valibot";
import sourceRegistry from "./hll-proof-sources.json";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/hll.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { hllMemberProofs, hllProofCases, hllProofFamily, hllProofSchema } from "./hll-proof-cases";

// The host reconciles these reviewed paths with each actual import graph and binds bytes before and after execution.
const rosters = v.parse(
  v.strictObject({
    format: v.literal(1),
    entry: v.literal("packages/e2e/integration/extensions-hll.test.ts"),
    sources: v.pipe(v.array(v.string()), v.minLength(1)),
    generationSources: v.pipe(v.array(v.string()), v.minLength(1)),
    consumerSources: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  sourceRegistry,
);
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/src/core/extensions/adapters/hll.ts",
  "apps/loom/src/core/extensions/adapters/hll-codecs.ts",
  "apps/loom/src/tooling/extensions/annotations/hll.ts",
  "apps/loom/src/tooling/extensions/manifests/hll.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/hll-proof-cases.ts",
  "packages/e2e/fixtures/hll-proof-sources.json",
  "packages/e2e/fixtures/hll-semantic-proof.ts",
  "packages/e2e/fixtures/proof-artifact.ts",
  "packages/e2e/scripts/report-extension-semantic-proof.ts",
  "bun.lock",
];
export const hllGateProofSources = {
  database: [...common, ...rosters.sources],
  unit: [...common, "packages/tests/unit/extensions-hll.test.ts", "apps/loom/src/tooling/codegen/extensions.ts"],
  types: [...common, "packages/tests/types/extensions-hll.test-d.ts", "apps/loom/src/tooling/codegen/extensions.ts"],
  generation: [...common, ...rosters.generationSources],
  consumer: [...common, ...rosters.consumerSources],
};
export const hllSemanticProofSources = [...new Set(Object.values(hllGateProofSources).flat())];
extensionProofSourcesDigest(hllSemanticProofSources.map((file) => ({ file, sha256: "0".repeat(64) })));

/** Registration declares requirements; only current host receipts and direct witnesses can satisfy them. */
export function registerHllSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate hll ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [...new Set([...hllGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])])],
      proofs: receipt
        ? hllProofCases
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
    extension: "hll",
    state: "candidate",
    family: hllProofFamily,
    schema: hllProofSchema,
    members: hllMemberProofs,
    gates: {
      database: requirement("database"),
      unit: requirement("unit"),
      types: requirement("types"),
      generation: requirement("generation"),
      consumer: requirement("consumer"),
    },
    catalogueVersionReconciliation: null,
  };
  if (!input.declarations.some((entry) => entry.extension === "hll" && entry.state === "pending"))
    throw new Error("hll registration requires its existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "hll" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...hllProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
