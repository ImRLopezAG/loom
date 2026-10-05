import * as v from "valibot";
import source from "../../../apps/loom/src/tooling/extensions/manifests/lakebase_tokenizer.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import {
  extensionProofReceiptDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  lakebaseTokenizerMemberProofs,
  lakebaseTokenizerProofCases,
  lakebaseTokenizerProofFamily,
} from "./lakebase-tokenizer-proof-cases";

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, source));
const common = [
  "apps/loom/package.json",
  "bun.lock",
  "apps/loom/src/core/extensions/adapters/lakebase_tokenizer.ts",
  "apps/loom/src/core/extensions/bindings.ts",
  "apps/loom/src/core/extensions/codecs.ts",
  "apps/loom/src/core/extensions/dictionary-reference.ts",
  "apps/loom/src/core/extensions/fields.ts",
  "apps/loom/src/core/extensions/sql.ts",
  "apps/loom/src/core/extensions/rows.ts",
  "apps/loom/src/core/extensions/values.ts",
  "apps/loom/src/core/extensions/json-transport.ts",
  "apps/loom/src/core/extensions/contracts.ts",
  "apps/loom/src/core/extensions/registry.ts",
  "apps/loom/src/tooling/extensions/annotations/lakebase_tokenizer.ts",
  "apps/loom/src/tooling/extensions/manifests/lakebase_tokenizer.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/lakebase-tokenizer-proof-cases.ts",
  "packages/e2e/fixtures/lakebase-tokenizer-semantic-proof.ts",
];
export const lakebaseTokenizerGateProofSources = {
  unit: [
    ...common,
    "packages/tests/unit/extensions-lakebase-tokenizer.test.ts",
    "packages/e2e/fixtures/extension-proof-unit.ts",
    "apps/loom/src/tooling/extensions/operations/lakebase_tokenizer.ts",
    "apps/loom/src/core/server/rpc/snapshot.ts",
  ],
  types: [
    ...common,
    "packages/tests/types/extensions-lakebase-tokenizer.test-d.ts",
    "packages/e2e/fixtures/lakebase-tokenizer-public-types.ts.fixture",
    "packages/e2e/scripts/run-lakebase-tokenizer-local-proof.ts",
  ],
  database: [
    ...common,
    "packages/e2e/integration/extensions-lakebase-tokenizer.test.ts",
    "packages/e2e/fixtures/extension-proof.ts",
    "packages/e2e/fixtures/extension-database.ts",
    "apps/loom/src/tooling/extensions/operations/lakebase_tokenizer.ts",
    "apps/loom/src/tooling/extensions/operations.ts",
    "apps/loom/src/tooling/extensions/capture.ts",
    "apps/loom/src/tooling/extensions/verify.ts",
    "apps/loom/src/tooling/migrations/connection.ts",
    "apps/loom/src/core/server/database/connection.ts",
    "apps/loom/src/core/schema/compile.ts",
    "apps/loom/src/tooling/migrations/adapter.ts",
  ],
  generation: [
    ...common,
    "apps/loom/src/tooling/codegen/extensions.ts",
    "packages/e2e/fixtures/lakebase-tokenizer-generated-project.ts",
    "packages/e2e/fixtures/lakebase-tokenizer-generated-rpc.mjs.fixture",
    "packages/e2e/fixtures/lakebase-tokenizer-generated-setup.mjs.fixture",
    "packages/e2e/integration/extensions-lakebase-tokenizer-generated.test.ts",
  ],
  consumer: [
    ...common,
    "apps/loom/src/tooling/codegen/extensions.ts",
    "packages/e2e/fixtures/lakebase-tokenizer-generated-project.ts",
    "packages/e2e/fixtures/lakebase-tokenizer-generated-rpc.mjs.fixture",
    "packages/e2e/fixtures/lakebase-tokenizer-generated-setup.mjs.fixture",
    "packages/e2e/fixtures/proof-artifact.ts",
    "packages/e2e/integration/packed-lakebase-tokenizer.test.ts",
  ],
};
export const lakebaseTokenizerSemanticProofSources = [
  ...new Set(Object.values(lakebaseTokenizerGateProofSources).flat()),
];

/** Registration only. The parent supplies authoritative frozen source closures and receipts for all five gates. */
export function registerLakebaseTokenizerSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate lakebase_tokenizer ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([
          ...lakebaseTokenizerGateProofSources[gate],
          ...(receipt?.sourcesBefore.map((value) => value.file) ?? []),
        ]),
      ],
      proofs: receipt
        ? lakebaseTokenizerProofCases
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
    extension: "lakebase_tokenizer",
    state: "candidate",
    family: lakebaseTokenizerProofFamily,
    schema: 'token"izer',
    members: lakebaseTokenizerMemberProofs,
    gates: {
      unit: requirement("unit"),
      types: requirement("types"),
      database: requirement("database"),
      generation: requirement("generation"),
      consumer: requirement("consumer"),
    },
    catalogueVersionReconciliation: null,
  };
  if (!input.declarations.some((entry) => entry.extension === "lakebase_tokenizer" && entry.state === "pending"))
    throw new Error("Tokenizer registration requires its existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "lakebase_tokenizer" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...lakebaseTokenizerProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
