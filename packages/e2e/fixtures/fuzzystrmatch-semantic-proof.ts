import * as v from "valibot";
import sourceRegistry from "./fuzzystrmatch-proof-sources.json";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/fuzzystrmatch.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { fuzzystrmatchAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/fuzzystrmatch";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  fuzzystrmatchDatabaseProofCases,
  fuzzystrmatchProofCases,
  fuzzystrmatchProofFamily,
  fuzzystrmatchProofSchema,
} from "./fuzzystrmatch-proof-cases";

// The host reconciles these reviewed paths with each actual import graph and binds bytes before and after execution.
const rosters = v.parse(
  v.strictObject({
    format: v.literal(1),
    entry: v.literal("packages/e2e/integration/extensions-fuzzy-token.test.ts"),
    sources: v.pipe(v.array(v.string()), v.minLength(1)),
    generationSources: v.pipe(v.array(v.string()), v.minLength(1)),
    consumerSources: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  sourceRegistry,
);
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/src/core/extensions/adapters/fuzzystrmatch.ts",
  "apps/loom/src/tooling/extensions/annotations/fuzzystrmatch.ts",
  "apps/loom/src/tooling/extensions/manifests/fuzzystrmatch.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/fuzzystrmatch-proof-cases.ts",
  "packages/e2e/fixtures/fuzzystrmatch-proof-sources.json",
  "packages/e2e/fixtures/fuzzystrmatch-semantic-proof.ts",
  "packages/e2e/fixtures/proof-artifact.ts",
  "packages/e2e/scripts/report-extension-semantic-proof.ts",
  "bun.lock",
];
export const fuzzystrmatchGateProofSources = {
  database: [...common, ...rosters.sources],
  unit: [
    ...common,
    "packages/tests/unit/extensions-fuzzy-token.test.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  types: [
    ...common,
    "packages/tests/types/extensions-fuzzy-token.test-d.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  generation: [...common, ...rosters.generationSources],
  consumer: [...common, ...rosters.consumerSources],
};
export const fuzzystrmatchSemanticProofSources = [...new Set(Object.values(fuzzystrmatchGateProofSources).flat())];
extensionProofSourcesDigest(fuzzystrmatchSemanticProofSources.map((file) => ({ file, sha256: "0".repeat(64) })));

/** Registration declares requirements; only current host receipts and direct witnesses can satisfy them. */
export function registerFuzzystrmatchSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate fuzzystrmatch ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...fuzzystrmatchGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? fuzzystrmatchProofCases
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
    extension: "fuzzystrmatch",
    state: "candidate",
    family: fuzzystrmatchProofFamily,
    schema: fuzzystrmatchProofSchema,
    members: fuzzystrmatchAnnotations.map((annotation) => ({
      id: annotation.id,
      disposition: annotation.disposition,
      reason: annotation.reason,
      citations: [...annotation.evidence, "packages/e2e/integration/extensions-fuzzy-token.test.ts"],
      cases: fuzzystrmatchDatabaseProofCases.flatMap((definition) =>
        definition.claims
          .filter((claim) => claim.member === annotation.id)
          .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
      ),
      transfers: [],
    })),
    gates: {
      database: requirement("database"),
      unit: requirement("unit"),
      types: requirement("types"),
      generation: requirement("generation"),
      consumer: requirement("consumer"),
    },
    catalogueVersionReconciliation: null,
  };
  if (!input.declarations.some((entry) => entry.extension === "fuzzystrmatch" && entry.state === "pending"))
    throw new Error("fuzzystrmatch registration requires its existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "fuzzystrmatch" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...fuzzystrmatchProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
