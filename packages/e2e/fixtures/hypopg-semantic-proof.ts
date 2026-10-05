import * as v from "valibot";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/hypopg.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import {
  extensionProofReceiptDigest,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { hypopgSchema } from "./hypopg";
import { hypopgMemberProofs, hypopgProofCases, hypopgProofFamily } from "./hypopg-proof-cases";

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/src/core/extensions/adapters/hypopg.ts",
  "apps/loom/src/core/extensions/adapters/hypopg-codecs.ts",
  "apps/loom/src/tooling/extensions/operations/hypopg.ts",
  "apps/loom/src/tooling/extensions/annotations/hypopg.ts",
  "apps/loom/src/tooling/extensions/manifests/hypopg.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/hypopg.ts",
  "packages/e2e/fixtures/hypopg-proof-cases.ts",
  "packages/e2e/fixtures/hypopg-semantic-proof.ts",
  "bun.lock",
];
/** Minimum family roster. The parent must reconcile the actual import graph and bind its before/after bytes. */
export const hypopgGateProofSources = {
  unit: [...common, "packages/tests/unit/extensions-hypopg.test.ts", "packages/e2e/fixtures/extension-proof-unit.ts"],
  types: [...common, "packages/tests/types/extensions-hypopg.test-d.ts", "packages/tests/tsconfig.json"],
  database: [
    ...common,
    "packages/e2e/integration/extensions-hypopg.test.ts",
    "packages/e2e/fixtures/extension-database.ts",
    "packages/e2e/fixtures/extension-proof.ts",
    "packages/e2e/fixtures/extension-proof-database.ts",
  ],
  generation: [
    ...common,
    "packages/e2e/integration/extension-hypopg-codegen.test.ts",
    "packages/e2e/fixtures/hypopg-generated-project.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  consumer: [
    ...common,
    "packages/e2e/integration/packed-hypopg.test.ts",
    "packages/e2e/fixtures/hypopg-generated-project.ts",
    "packages/e2e/fixtures/proof-artifact.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
    "apps/loom/vite.config.ts",
  ],
};

/** No receipt is fabricated here; without parent receipts every gate remains unsatisfied. */
export function registerHypopgSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  if (!input.declarations.some((entry) => entry.extension === "hypopg" && entry.state === "pending"))
    throw new Error("hypopg registration requires its existing pending catalogue declaration");
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate hypopg ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...hypopgGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? hypopgProofCases
            .filter((definition) => definition.gate === gate)
            .map((definition) => ({
              caseId: definition.id,
              runId: receipt.runId,
              receiptDigest: extensionProofReceiptDigest(receipt),
            }))
        : [],
    };
  }
  return {
    ...input,
    declarations: input.declarations.map((entry) =>
      entry.extension === "hypopg"
        ? {
            extension: "hypopg",
            state: "candidate",
            family: hypopgProofFamily,
            schema: hypopgSchema,
            members: hypopgMemberProofs,
            gates: {
              unit: requirement("unit"),
              types: requirement("types"),
              database: requirement("database"),
              generation: requirement("generation"),
              consumer: requirement("consumer"),
            },
            catalogueVersionReconciliation: null,
          }
        : entry,
    ),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...hypopgProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
