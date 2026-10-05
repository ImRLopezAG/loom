import * as v from "valibot";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/btree_gin.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { btreeGinAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/btree_gin";
import {
  extensionProofReceiptDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  btreeGinNativeProofCase,
  btreeGinProofCases,
  btreeGinProofFamily,
  btreeGinProofSchema,
} from "./btree_gin-proof-cases";
import { btreeGinInternalRelations } from "./btree_gin-internal-relations";

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "bun.lock",
  "apps/loom/src/core/extensions/adapters/btree_gin.ts",
  "apps/loom/src/tooling/extensions/annotations/btree_gin.ts",
  "apps/loom/src/tooling/extensions/manifests/btree_gin.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/btree_gin-proof-cases.ts",
  "packages/e2e/fixtures/btree_gin-schema.ts",
  "packages/e2e/fixtures/btree_gin-generated-project.ts",
  "packages/e2e/fixtures/btree_gin-internal-relations.ts",
  "packages/e2e/fixtures/btree_gin-semantic-proof.ts",
];
export const btreeGinGateProofSources = {
  unit: [...common, "packages/tests/unit/extensions-btree_gin.test.ts"],
  types: [
    ...common,
    "packages/tests/types/extensions-btree_gin.test-d.ts",
    "packages/tests/types/btree_gin.tsconfig.json",
  ],
  database: [
    ...common,
    "packages/e2e/integration/extensions-btree_gin.test.ts",
    "packages/e2e/fixtures/extension-database.ts",
    "packages/e2e/fixtures/extension-proof.ts",
    "packages/e2e/fixtures/extension-proof-database.ts",
    "apps/loom/src/core/extensions/fields.ts",
    "apps/loom/src/tooling/migrations/adapter.ts",
  ],
  generation: [
    ...common,
    "packages/e2e/fixtures/btree-gin-generated-runtime.ts",
    "packages/e2e/fixtures/btree-gin-runtime-prepare.mjs.fixture",
    "packages/e2e/fixtures/btree-gin-generated-rpc.mjs.fixture",
    "packages/e2e/integration/extensions-btree_gin-generation.test.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  consumer: [
    ...common,
    "packages/e2e/fixtures/btree-gin-generated-runtime.ts",
    "packages/e2e/fixtures/btree-gin-runtime-prepare.mjs.fixture",
    "packages/e2e/fixtures/btree-gin-generated-rpc.mjs.fixture",
    "packages/e2e/integration/packed-btree_gin.test.ts",
    "packages/e2e/fixtures/proof-artifact.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
};
export const btreeGinSemanticProofSources = [...new Set(Object.values(btreeGinGateProofSources).flat())];
function directCases(id: string) {
  return btreeGinNativeProofCase.claims
    .filter((claim) => claim.member === id)
    .map((claim) => ({ caseId: btreeGinNativeProofCase.id, scenario: claim.scenario }));
}
export const btreeGinMemberProofs = btreeGinAnnotations.map((annotation) => {
  const edges =
    annotation.disposition === "internal"
      ? (Object.entries(btreeGinInternalRelations).find(([id]) => id === annotation.id)?.[1] ?? [])
      : [];
  const cases = directCases(annotation.id);
  if (annotation.disposition === "internal" ? !edges.length : cases.length !== 1)
    throw new Error(`Missing exact btree_gin member proof: ${annotation.id}`);
  return {
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases,
    transfers: edges.flatMap((edge) => {
      const parents = directCases(edge.from);
      if (parents.length !== 1) throw new Error(`Missing native btree_gin parent witness: ${edge.from}`);
      return parents.map((proof) => ({
        ...edge,
        ...proof,
        basis:
          "Exact captured class/family/support row. The native parent witness migrates and inspects the class, builds and mutates its index, and verifies all five strategy scans against a sequential oracle before and after schema relocation.",
      }));
    }),
  };
});

/** Declares candidate coverage only. All five fresh acceptance receipts are owned by the parent host. */
export function registerBtreeGinSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate btree_gin ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...btreeGinGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? btreeGinProofCases
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
    extension: "btree_gin",
    state: "candidate",
    family: btreeGinProofFamily,
    schema: btreeGinProofSchema,
    members: btreeGinMemberProofs,
    gates: {
      unit: requirement("unit"),
      types: requirement("types"),
      database: requirement("database"),
      generation: requirement("generation"),
      consumer: requirement("consumer"),
    },
    catalogueVersionReconciliation: null,
  };
  if (!input.declarations.some((entry) => entry.extension === "btree_gin" && entry.state === "pending"))
    throw new Error("btree_gin registration requires its pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "btree_gin" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...btreeGinProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
