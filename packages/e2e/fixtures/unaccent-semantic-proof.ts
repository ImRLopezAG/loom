import * as v from "valibot";
import sourceRegistry from "./unaccent-proof-sources.json";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/unaccent.json";
import graphSource from "../../../apps/loom/src/tooling/extensions/text-search-contracts/unaccent.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { unaccentAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/unaccent";
import {
  extensionTextSearchCaptureValidator,
  validateExtensionTextSearchCapture,
} from "../../../apps/loom/src/tooling/extensions/text-search-capture";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofCase,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  unaccentConsumerProofCase,
  unaccentGenerationProofCase,
  unaccentNativeProofCase,
  unaccentNativeProofClaims,
  unaccentProofCases,
  unaccentProofFamily,
  unaccentProofSchema,
  unaccentTypesProofCase,
  unaccentUnitProofCase,
} from "./unaccent-proof-cases";

// Reviewed static import roster. The host must reconcile the compiled public import graph
// and bind its actual bytes before/after every proof run; this JSON is not a receipt.
const sourceRosters = v.parse(
  v.strictObject({
    format: v.literal(1),
    entry: v.literal("packages/e2e/integration/unaccent-semantic-acceptance.test.ts"),
    sources: v.pipe(v.array(v.string()), v.minLength(1)),
    generationSources: v.pipe(v.array(v.string()), v.minLength(1)),
    consumerSources: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  sourceRegistry,
);
export const unaccentDatabaseProofSources = sourceRosters.sources;
// Reuse normalized path/duplicate validation only; these sentinels are never observed proof hashes.
for (const roster of [unaccentDatabaseProofSources, sourceRosters.generationSources, sourceRosters.consumerSources])
  extensionProofSourcesDigest(roster.map((file) => ({ file, sha256: "0".repeat(64) })));
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const graph = validateExtensionTextSearchCapture(v.parse(extensionTextSearchCaptureValidator, graphSource), manifest);
const graphFile = "apps/loom/src/tooling/extensions/text-search-contracts/unaccent.json";
const commonSources = [
  graphFile,
  "apps/loom/package.json",
  "apps/loom/src/core/extensions/adapters/unaccent.ts",
  "apps/loom/src/core/extensions/dictionary-reference.ts",
  "apps/loom/src/tooling/extensions/annotations/unaccent.ts",
  "apps/loom/src/tooling/extensions/manifests/unaccent.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "apps/loom/src/tooling/extensions/unaccent.ts",
  "apps/loom/src/tooling/extensions/operations.ts",
  "packages/e2e/fixtures/unaccent-proof-cases.ts",
  "packages/e2e/fixtures/unaccent-proof-sources.json",
  "packages/e2e/fixtures/unaccent-semantic-proof.ts",
  "packages/e2e/fixtures/proof-artifact.ts",
  "packages/e2e/scripts/report-extension-semantic-proof.ts",
  "bun.lock",
];
export const unaccentGateProofSources = {
  database: unaccentDatabaseProofSources,
  unit: [
    ...commonSources,
    unaccentUnitProofCase.file,
    "packages/tests/unit/extensions-unaccent-tooling.test.ts",
    "packages/tests/unit/extensions-unaccent-generated.test.ts",
    "packages/tests/unit/extensions-api-artifact.test.ts",
    "packages/tests/unit/proof-artifact.test.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
    "apps/loom/src/tooling/migrations/required-api.ts",
    "apps/loom/src/tooling/migrations/required-api-verification.ts",
  ],
  types: [...commonSources, unaccentTypesProofCase.file, "packages/tests/types/extensions-unaccent-tooling.test-d.ts"],
  generation: [
    ...commonSources,
    ...sourceRosters.generationSources,
    unaccentGenerationProofCase.file,
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  consumer: [
    ...commonSources,
    ...sourceRosters.consumerSources,
    unaccentConsumerProofCase.file,
    "apps/loom/src/tooling/codegen/extensions.ts",
    "apps/loom/src/tooling/migrations/required-api.ts",
    "apps/loom/src/tooling/migrations/required-api-verification.ts",
  ],
};
export const unaccentSemanticProofSources = [
  ...new Set([...unaccentDatabaseProofSources, ...Object.values(unaccentGateProofSources).flat()]),
];

/** Add only this candidate; missing receipts remain pending in the existing five-gate validator. */
export function registerUnaccentSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(definition: ExtensionProofCase) {
    const matching = receipts.filter((receipt) => receipt.gate === definition.gate);
    if (matching.length > 1) throw new Error(`Duplicate Unaccent ${definition.gate} receipt`);
    const receipt = matching[0];
    // The validator, not the presence of a file, decides whether a host receipt proves this case.
    return {
      sources: [
        ...new Set([
          ...unaccentGateProofSources[definition.gate],
          ...(receipt?.sourcesBefore.map(({ file }) => file) ?? []),
        ]),
      ],
      proofs: receipt
        ? [{ caseId: definition.id, runId: receipt.runId, receiptDigest: extensionProofReceiptDigest(receipt) }]
        : [],
    };
  }
  const candidate: ExtensionProofDeclaration = {
    extension: "unaccent",
    state: "candidate",
    family: unaccentProofFamily,
    schema: unaccentProofSchema,
    textSearch: { file: graphFile, capture: graph },
    members: unaccentAnnotations.map((annotation) => ({
      id: annotation.id,
      disposition: annotation.disposition,
      reason: annotation.reason,
      citations: [...annotation.evidence, unaccentNativeProofCase.file],
      cases: unaccentNativeProofCase.claims
        .filter((claim) => claim.member === annotation.id)
        .map((claim) => ({ caseId: unaccentNativeProofCase.id, scenario: claim.scenario })),
      transfers:
        "proofTransfer" in annotation
          ? annotation.proofTransfer.from.map((from) => ({
              from,
              relation: { kind: "text-search-callback" as const, slot: annotation.proofTransfer.relation.slot },
              caseId: unaccentNativeProofCase.id,
              scenario: unaccentNativeProofClaims.template.scenario,
              basis: annotation.proofTransfer.basis,
            }))
          : [],
    })),
    gates: {
      database: requirement(unaccentNativeProofCase),
      unit: requirement(unaccentUnitProofCase),
      types: requirement(unaccentTypesProofCase),
      generation: requirement(unaccentGenerationProofCase),
      consumer: requirement(unaccentConsumerProofCase),
    },
    catalogueVersionReconciliation: null,
  };
  if (!input.declarations.some((entry) => entry.extension === "unaccent" && entry.state === "pending"))
    throw new Error("Unaccent registration requires its existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "unaccent" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...unaccentProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
