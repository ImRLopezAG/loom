import * as v from "valibot";
import sourceRegistry from "./tablefunc-proof-sources.json";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/tablefunc.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { tablefuncAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/tablefunc";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { tablefuncConsumerProofCase } from "./tablefunc-consumer-proof-cases";
import {
  tablefuncDatabaseProofCases,
  tablefuncGenerationProofCase,
  tablefuncProofFamily,
  tablefuncProofSchema,
  tablefuncTypesProofCase,
  tablefuncUnitProofCases,
} from "./tablefunc-proof-cases";

// The host reconciles these reviewed paths with each actual import graph and binds bytes before and after execution.
const rosters = v.parse(
  v.strictObject({
    format: v.literal(1),
    entry: v.literal("packages/e2e/integration/extensions-tablefunc.test.ts"),
    sources: v.pipe(v.array(v.string()), v.minLength(1)),
    generationSources: v.pipe(v.array(v.string()), v.minLength(1)),
    consumerSources: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  sourceRegistry,
);
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/src/core/extensions/adapters/tablefunc.ts",
  "apps/loom/src/tooling/extensions/annotations/tablefunc.ts",
  "apps/loom/src/tooling/extensions/manifests/tablefunc.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/tablefunc-consumer-proof-cases.ts",
  "packages/e2e/fixtures/tablefunc-proof-cases.ts",
  "packages/e2e/fixtures/tablefunc-proof-sources.json",
  "packages/e2e/fixtures/tablefunc-semantic-proof.ts",
  "packages/e2e/fixtures/proof-artifact.ts",
  "packages/e2e/scripts/report-extension-semantic-proof.ts",
  "bun.lock",
];
export const tablefuncProofCases = [
  ...tablefuncDatabaseProofCases,
  ...tablefuncUnitProofCases,
  tablefuncTypesProofCase,
  tablefuncGenerationProofCase,
  tablefuncConsumerProofCase,
];
export const tablefuncGateProofSources = {
  database: [...common, ...rosters.sources],
  unit: [...common, "packages/tests/unit/extensions-tablefunc.test.ts", "apps/loom/src/tooling/codegen/extensions.ts"],
  types: [
    ...common,
    "packages/tests/types/extensions-tablefunc.test-d.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  generation: [...common, ...rosters.generationSources],
  consumer: [...common, ...rosters.consumerSources],
};
export const tablefuncSemanticProofSources = [...new Set(Object.values(tablefuncGateProofSources).flat())];
extensionProofSourcesDigest(tablefuncSemanticProofSources.map((file) => ({ file, sha256: "0".repeat(64) })));

/** Registration declares requirements; only current host receipts and direct witnesses can satisfy them. */
export function registerTablefuncSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate tablefunc ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...tablefuncGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? tablefuncProofCases
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
    extension: "tablefunc",
    state: "candidate",
    family: tablefuncProofFamily,
    schema: tablefuncProofSchema,
    members: tablefuncAnnotations.map((annotation) => ({
      id: annotation.id,
      disposition: annotation.disposition,
      reason: annotation.reason,
      citations: [...annotation.evidence, "packages/e2e/integration/extensions-tablefunc.test.ts"],
      cases: tablefuncDatabaseProofCases.flatMap((definition) =>
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
  if (!input.declarations.some((entry) => entry.extension === "tablefunc" && entry.state === "pending"))
    throw new Error("tablefunc registration requires its existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "tablefunc" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...tablefuncProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
