import * as v from "valibot";
import sourceRegistry from "./uuid-ossp-proof-sources.json";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/uuid-ossp.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { uuidOsspAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/uuid-ossp";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  uuidOsspDatabaseProofCases,
  uuidOsspProofCases,
  uuidOsspProofFamily,
  uuidOsspProofSchema,
} from "./uuid-ossp-proof-cases";

// The host reconciles these reviewed paths with each actual import graph and binds bytes before and after execution.
const rosters = v.parse(
  v.strictObject({
    format: v.literal(1),
    entry: v.literal("packages/e2e/integration/extensions-uuid-ossp.test.ts"),
    sources: v.pipe(v.array(v.string()), v.minLength(1)),
    generationSources: v.pipe(v.array(v.string()), v.minLength(1)),
    consumerSources: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  sourceRegistry,
);
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/src/core/extensions/adapters/uuid-ossp.ts",
  "apps/loom/src/core/extensions/native-uuid-codec.ts",
  "apps/loom/src/tooling/extensions/annotations/uuid-ossp.ts",
  "apps/loom/src/tooling/extensions/manifests/uuid-ossp.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/uuid-ossp-proof-cases.ts",
  "packages/e2e/fixtures/uuid-ossp-proof-sources.json",
  "packages/e2e/fixtures/uuid-ossp-semantic-proof.ts",
  "packages/e2e/fixtures/proof-artifact.ts",
  "packages/e2e/scripts/report-extension-semantic-proof.ts",
  "bun.lock",
];
export const uuidOsspGateProofSources = {
  database: [...common, ...rosters.sources],
  unit: [...common, "packages/tests/unit/extensions-uuid-ossp.test.ts", "apps/loom/src/tooling/codegen/extensions.ts"],
  types: [
    ...common,
    "packages/tests/types/extensions-uuid-ossp.test-d.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  generation: [...common, ...rosters.generationSources],
  consumer: [...common, ...rosters.consumerSources],
};
export const uuidOsspSemanticProofSources = [...new Set(Object.values(uuidOsspGateProofSources).flat())];
extensionProofSourcesDigest(uuidOsspSemanticProofSources.map((file) => ({ file, sha256: "0".repeat(64) })));

/** Registration declares requirements; only current host receipts and direct witnesses can satisfy them. */
export function registerUuidOsspSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate UUID-OSSP ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...uuidOsspGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? uuidOsspProofCases
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
    extension: "uuid-ossp",
    state: "candidate",
    family: uuidOsspProofFamily,
    schema: uuidOsspProofSchema,
    members: uuidOsspAnnotations.map((annotation) => ({
      id: annotation.id,
      disposition: annotation.disposition,
      reason: annotation.reason,
      citations: [...annotation.evidence, "packages/e2e/integration/extensions-uuid-ossp.test.ts"],
      cases: uuidOsspDatabaseProofCases.flatMap((definition) =>
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
  if (!input.declarations.some((entry) => entry.extension === "uuid-ossp" && entry.state === "pending"))
    throw new Error("UUID-OSSP registration requires its existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "uuid-ossp" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...uuidOsspProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
