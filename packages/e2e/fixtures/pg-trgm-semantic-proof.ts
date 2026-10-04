import * as v from "valibot";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/pg_trgm.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import {
  extensionProofReceiptDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { pgTrgmMemberProofs, pgTrgmProofCases, pgTrgmProofFamily, pgTrgmProofSchema } from "./pg-trgm-proof-cases";

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/vite.config.ts",
  "bun.lock",
  "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
  "apps/loom/src/core/extensions/sql.ts",
  "apps/loom/src/tooling/extensions/annotations/pg-trgm.ts",
  "apps/loom/src/tooling/extensions/manifests/pg_trgm.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/pg-trgm-proof-cases.ts",
  "packages/e2e/fixtures/pg-trgm-semantic-proof.ts",
  "packages/e2e/scripts/run-pg-trgm-unit-types-proof.ts",
  "packages/e2e/scripts/report-pg-trgm-proof.ts",
];
const generated = [
  "packages/e2e/scripts/run-pg-trgm-composition-proof.ts",
  "packages/e2e/fixtures/pg-trgm-generated-project.ts",
  "packages/e2e/fixtures/pg-trgm-generated-runtime.ts",
  "packages/e2e/fixtures/pg-trgm-runtime-prepare.mjs.fixture",
  "packages/e2e/fixtures/pg-trgm-generated-rpc.mjs.fixture",
  "packages/e2e/fixtures/extension-database.ts",
  "apps/loom/src/tooling/codegen/extensions.ts",
];
export const pgTrgmGateProofSources = {
  unit: [...common, "packages/tests/unit/extensions-pg-trgm.test.ts", "packages/e2e/fixtures/extension-proof-unit.ts"],
  types: [...common, "packages/tests/types/extensions-pg-trgm.test-d.ts", "packages/tests/types/pg-trgm.tsconfig.json"],
  database: [
    ...common,
    "packages/e2e/scripts/run-pg-trgm-database-proof.ts",
    "packages/e2e/integration/extensions-pg-trgm.test.ts",
    "packages/e2e/fixtures/pg-trgm-roles.ts",
    "packages/e2e/fixtures/extension-database.ts",
    "packages/e2e/fixtures/extension-proof.ts",
    "packages/e2e/fixtures/extension-proof-database.ts",
    "apps/loom/src/tooling/extensions/capture.ts",
    "apps/loom/src/tooling/extensions/pg-trgm.ts",
  ],
  generation: [...common, ...generated, "packages/e2e/integration/extensions-pg-trgm-generated.test.ts"],
  consumer: [
    ...common,
    ...generated,
    "packages/e2e/integration/packed-pg-trgm.test.ts",
    "packages/e2e/fixtures/pg-trgm-packed-generation.mjs.fixture",
    "packages/e2e/fixtures/proof-artifact.ts",
  ],
};
export const pgTrgmSemanticProofSources = [...new Set(Object.values(pgTrgmGateProofSources).flat())];

/** Family-local candidate registration. Definitions and local tests confer no canonical gate acceptance. */
export function registerPgTrgmSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate pg_trgm ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...pgTrgmGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? pgTrgmProofCases
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
    extension: "pg_trgm",
    state: "candidate",
    family: pgTrgmProofFamily,
    schema: pgTrgmProofSchema,
    members: pgTrgmMemberProofs,
    gates: {
      unit: requirement("unit"),
      types: requirement("types"),
      database: requirement("database"),
      generation: requirement("generation"),
      consumer: requirement("consumer"),
    },
    catalogueVersionReconciliation: null,
  };
  if (!input.declarations.some((entry) => entry.extension === "pg_trgm" && entry.state === "pending"))
    throw new Error("pg_trgm registration requires the existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "pg_trgm" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...pgTrgmProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
