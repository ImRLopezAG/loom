import * as v from "valibot";
import sourceRegistry from "./roaringbitmap-proof-sources.json";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/roaringbitmap.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  roaringbitmapMemberProofs,
  roaringbitmapProofCases,
  roaringbitmapProofFamily,
  roaringbitmapProofSchema,
} from "./roaringbitmap-proof-cases";

// The host reconciles these reviewed paths with each actual import graph and binds bytes before and after execution.
const rosters = v.parse(
  v.strictObject({
    format: v.literal(1),
    entry: v.literal("packages/e2e/integration/extensions-roaringbitmap.test.ts"),
    sources: v.pipe(v.array(v.string()), v.minLength(1)),
    generationSources: v.pipe(v.array(v.string()), v.minLength(1)),
    consumerSources: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  sourceRegistry,
);
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/src/core/extensions/adapters/roaringbitmap.ts",
  "apps/loom/src/core/extensions/adapters/roaringbitmap-codecs.ts",
  "apps/loom/src/tooling/extensions/annotations/roaringbitmap.ts",
  "apps/loom/src/tooling/extensions/operations/roaringbitmap.ts",
  "apps/loom/src/tooling/extensions/manifests/roaringbitmap.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/roaringbitmap-proof-cases.ts",
  "packages/e2e/fixtures/roaringbitmap-proof-sources.json",
  "packages/e2e/fixtures/roaringbitmap-semantic-proof.ts",
  "packages/e2e/fixtures/proof-artifact.ts",
  "packages/e2e/scripts/report-extension-semantic-proof.ts",
  "bun.lock",
];
export const roaringbitmapGateProofSources = {
  database: [...common, ...rosters.sources],
  unit: [...common, "packages/tests/unit/extensions-roaringbitmap.test.ts", "apps/loom/src/tooling/codegen/extensions.ts"],
  types: [
    ...common,
    "packages/tests/types/extensions-roaringbitmap.test-d.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  generation: [...common, ...rosters.generationSources],
  consumer: [...common, ...rosters.consumerSources],
};
export const roaringbitmapSemanticProofSources = [...new Set(Object.values(roaringbitmapGateProofSources).flat())];
extensionProofSourcesDigest(roaringbitmapSemanticProofSources.map((file) => ({ file, sha256: "0".repeat(64) })));

/** Registration declares requirements; only current host receipts and direct witnesses can satisfy them. */
export function registerRoaringbitmapSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate roaringbitmap ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...roaringbitmapGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? roaringbitmapProofCases
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
    extension: "roaringbitmap",
    state: "candidate",
    family: roaringbitmapProofFamily,
    schema: roaringbitmapProofSchema,
    members: roaringbitmapMemberProofs(),
    gates: {
      database: requirement("database"),
      unit: requirement("unit"),
      types: requirement("types"),
      generation: requirement("generation"),
      consumer: requirement("consumer"),
    },
    catalogueVersionReconciliation: null,
  };
  if (!input.declarations.some((entry) => entry.extension === "roaringbitmap" && entry.state === "pending"))
    throw new Error("roaringbitmap registration requires its existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "roaringbitmap" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...roaringbitmapProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
