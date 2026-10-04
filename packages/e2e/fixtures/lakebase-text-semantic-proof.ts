import * as v from "valibot";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/lakebase_text.json";
import sourceRoster from "./lakebase-text-proof-sources.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { lakebaseTextAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/lakebase-text";
import {
  extensionProofReceiptDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  lakebaseTextDatabaseProofCase,
  lakebaseTextInternalRelations,
  lakebaseTextProofCases,
  lakebaseTextProofFamily,
} from "./lakebase-text-proof-cases";

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "packages/e2e/fixtures/generated-runtime-prepare.mjs.fixture",
  "packages/e2e/fixtures/generated-runtime-bundle.mjs.fixture",
  "apps/loom/package.json",
  "bun.lock",
  "apps/loom/src/core/extensions/adapters/lakebase-text.ts",
  "apps/loom/src/core/extensions/adapters/lakebase-text-codecs.ts",
  "apps/loom/src/tooling/extensions/annotations/lakebase-text.ts",
  "apps/loom/src/tooling/extensions/manifests/lakebase_text.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/lakebase-text-proof-cases.ts",
  "packages/e2e/fixtures/lakebase-text-proof-sources.json",
  "packages/e2e/fixtures/lakebase-text-semantic-proof.ts",
  "packages/e2e/scripts/run-lakebase-text-local-proof.ts",
];
export const lakebaseTextGateProofSources = {
  unit: [
    ...sourceRoster.unit,
    ...common,
    "packages/tests/unit/extensions-lakebase-text.test.ts",
    "packages/tests/unit/extensions-lakebase-text-generation-fixture.test.ts",
    "packages/e2e/fixtures/extension-proof-unit.ts",
  ],
  types: [...sourceRoster.types, ...common, "packages/tests/types/extensions-lakebase-text.test-d.ts"],
  database: [
    ...sourceRoster.database,
    ...common,
    "packages/e2e/integration/extensions-lakebase-text.test.ts",
    "packages/e2e/fixtures/extension-proof.ts",
    "packages/e2e/scripts/run-lakebase-text-database-proof.ts",
  ],
  generation: [
    ...sourceRoster.generation,
    ...common,
    "packages/e2e/integration/extensions-lakebase-text-generated.test.ts",
    "packages/e2e/fixtures/lakebase-text-generated-project.ts",
  ],
  consumer: [
    ...sourceRoster.consumer,
    ...common,
    "packages/e2e/integration/packed-lakebase-text.test.ts",
    "packages/e2e/fixtures/lakebase-text-generated-project.ts",
    "packages/e2e/fixtures/proof-artifact.ts",
  ],
};
export const lakebaseTextSemanticProofSources = [...new Set(Object.values(lakebaseTextGateProofSources).flat())];

function parentOf(id: string) {
  // SAFETY: Object.hasOwn below checks membership in this closed native relation map before indexing.
  return Object.hasOwn(lakebaseTextInternalRelations, id)
    ? lakebaseTextInternalRelations[id as keyof typeof lakebaseTextInternalRelations]
    : undefined;
}

/** Family-local candidate registration. Local tests confer no canonical five-gate acceptance. */
export function registerLakebaseTextSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw Error(`Duplicate lakebase_text ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...lakebaseTextGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? lakebaseTextProofCases
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
    extension: "lakebase_text",
    state: "candidate",
    family: lakebaseTextProofFamily,
    schema: 'bm25"text',
    members: lakebaseTextAnnotations.map((annotation) => {
      const edge = parentOf(annotation.id);
      return {
        id: annotation.id,
        disposition: annotation.disposition,
        reason: annotation.reason,
        citations: [...annotation.evidence],
        cases:
          annotation.disposition === "internal"
            ? []
            : [
                {
                  caseId: lakebaseTextDatabaseProofCase.id,
                  scenario: "native-bm25-score-and-index-identity",
                },
              ],
        transfers:
          annotation.disposition === "internal" && edge
            ? [
                {
                  ...edge,
                  caseId: lakebaseTextDatabaseProofCase.id,
                  scenario: "native-bm25-score-and-index-identity",
                  basis:
                    "Exact captured lakebase_text catalog edge; the parent public member witness executes this support row.",
                },
              ]
            : [],
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
  if (!input.declarations.some((entry) => entry.extension === "lakebase_text" && entry.state === "pending"))
    throw Error("lakebase_text registration requires the existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "lakebase_text" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...lakebaseTextProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
