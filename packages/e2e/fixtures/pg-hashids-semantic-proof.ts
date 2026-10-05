import * as v from "valibot";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/pg_hashids.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { pgHashidsAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg-hashids";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  pgHashidsAllGateProofCases,
  pgHashidsProofCases,
  pgHashidsProofFamily,
  pgHashidsProofSchema,
  pgHashidsUnitProofCase,
  pgHashidsTypesProofCase,
} from "./pg-hashids-proof-cases";

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/src/core/extensions/adapters/pg-hashids.ts",
  "apps/loom/src/tooling/extensions/annotations/pg-hashids.ts",
  "apps/loom/src/tooling/extensions/manifests/pg_hashids.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/pg-hashids-proof-cases.ts",
  "packages/e2e/fixtures/pg-hashids-semantic-proof.ts",
  "packages/e2e/scripts/report-extension-semantic-proof.ts",
  "bun.lock",
];
export const pgHashidsGateProofSources = {
  database: [...common, "packages/e2e/integration/extensions-pg-hashids.test.ts"],
  unit: [...common, pgHashidsUnitProofCase.file],
  types: [...common, pgHashidsTypesProofCase.file],
  generation: [
    ...common,
    "packages/e2e/fixtures/pg-hashids-isolated-codegen.ts",
    "packages/e2e/scripts/run-pg-hashids-generation-proof.ts",
  ],
  consumer: [...common, "packages/e2e/scripts/run-pg-hashids-packed-proof.ts"],
};
export const pgHashidsSemanticProofSources = [...new Set(Object.values(pgHashidsGateProofSources).flat())];
extensionProofSourcesDigest(pgHashidsSemanticProofSources.map((file) => ({ file, sha256: "0".repeat(64) })));

/** Registration declares requirements; only current host receipts and direct witnesses can satisfy them. */
export function registerPgHashidsSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate pg_hashids ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...pgHashidsGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? pgHashidsAllGateProofCases
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
    extension: "pg_hashids",
    state: "candidate",
    family: pgHashidsProofFamily,
    schema: pgHashidsProofSchema,
    members: pgHashidsAnnotations.map((annotation) => ({
      id: annotation.id,
      disposition: annotation.disposition,
      reason: annotation.reason,
      citations: [...annotation.evidence],
      cases: pgHashidsProofCases[0]!.claims
        .filter((claim) => claim.member === annotation.id)
        .map((claim) => ({ caseId: pgHashidsProofCases[0]!.id, scenario: claim.scenario })),
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
  if (!input.declarations.some((entry) => entry.extension === "pg_hashids" && entry.state === "pending"))
    throw new Error("pg_hashids registration requires its existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "pg_hashids" ? candidate : entry)),
    manifests: [...input.manifests.filter((entry) => entry.contract.extension !== "pg_hashids"), manifest],
    cases: [
      ...input.cases.filter((entry) => entry.families.every((family) => family.extension !== "pg_hashids")),
      ...pgHashidsAllGateProofCases,
    ],
    receipts: [...input.receipts, ...receipts],
  };
}
