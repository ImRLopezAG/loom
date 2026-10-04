import * as v from "valibot";
import sourceRegistry from "./bloom-proof-sources.json";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/bloom.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { bloomAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/bloom";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  bloomDatabaseProofCases,
  bloomInternalRelations,
  bloomProofCases,
  bloomProofFamily,
  bloomProofSchema,
} from "./bloom-proof-cases";

// The host reconciles these reviewed paths with each actual import graph and binds bytes before and after execution.
const rosters = v.parse(
  v.strictObject({
    format: v.literal(1),
    entry: v.literal("packages/e2e/integration/extensions-bloom.test.ts"),
    sources: v.pipe(v.array(v.string()), v.minLength(1)),
    generationSources: v.pipe(v.array(v.string()), v.minLength(1)),
    consumerSources: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  sourceRegistry,
);
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/src/core/extensions/adapters/bloom.ts",
  "apps/loom/src/tooling/extensions/annotations/bloom.ts",
  "apps/loom/src/tooling/extensions/manifests/bloom.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/bloom-proof-cases.ts",
  "packages/e2e/fixtures/bloom-proof-sources.json",
  "packages/e2e/fixtures/bloom-semantic-proof.ts",
  "packages/e2e/fixtures/proof-artifact.ts",
  "packages/e2e/scripts/report-extension-semantic-proof.ts",
  "packages/e2e/scripts/report-bloom-proof.ts",
  "bun.lock",
];
export const bloomGateProofSources = {
  database: [...common, ...rosters.sources, "packages/e2e/scripts/run-bloom-database-proof.ts"],
  unit: [
    ...common,
    "packages/tests/unit/extensions-bloom.test.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
    "packages/e2e/scripts/run-bloom-unit-types-proof.ts",
  ],
  types: [
    ...common,
    "packages/tests/types/extensions-bloom.test-d.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
    "packages/e2e/scripts/run-bloom-unit-types-proof.ts",
  ],
  generation: [...common, ...rosters.generationSources, "packages/e2e/scripts/run-bloom-composition-proof.ts"],
  consumer: [...common, ...rosters.consumerSources, "packages/e2e/scripts/run-bloom-composition-proof.ts"],
};
export const bloomSemanticProofSources = [...new Set(Object.values(bloomGateProofSources).flat())];
extensionProofSourcesDigest(bloomSemanticProofSources.map((file) => ({ file, sha256: "0".repeat(64) })));

function directCases(id: string) {
  return bloomDatabaseProofCases.flatMap((definition) =>
    definition.claims
      .filter((claim) => claim.member === id)
      .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
  );
}

/** Public members need a direct native witness; internal catalog rows transfer from their exact parent class witness. */
export const bloomMemberProofs = bloomAnnotations.map((annotation) => {
  const cases = directCases(annotation.id);
  const edge = Object.entries(bloomInternalRelations).find(([id]) => id === annotation.id)?.[1];
  const parent = edge ? directCases(edge.from) : [];
  if (annotation.disposition === "internal" ? !edge || parent.length !== 1 : cases.length !== 1)
    throw new Error(`Missing exact bloom member proof: ${annotation.id}`);
  return {
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases,
    transfers:
      edge && annotation.disposition === "internal"
        ? parent.map((proof) => ({
            ...edge,
            ...proof,
            basis:
              "Exact captured bloom catalog edge; the parent class witness builds, inserts into and scans a native bloom index whose equality results match a sequential oracle, executing this support row.",
          }))
        : [],
  };
});

/** Registration declares requirements; only current host receipts and direct witnesses can satisfy them. */
export function registerBloomSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate bloom ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...bloomGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? bloomProofCases
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
    extension: "bloom",
    state: "candidate",
    family: bloomProofFamily,
    schema: bloomProofSchema,
    members: bloomMemberProofs,
    gates: {
      database: requirement("database"),
      unit: requirement("unit"),
      types: requirement("types"),
      generation: requirement("generation"),
      consumer: requirement("consumer"),
    },
    catalogueVersionReconciliation: null,
  };
  if (!input.declarations.some((entry) => entry.extension === "bloom" && entry.state === "pending"))
    throw new Error("bloom registration requires its existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "bloom" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...bloomProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
