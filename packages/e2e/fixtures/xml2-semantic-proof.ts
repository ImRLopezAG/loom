import * as v from "valibot";
import sourceRegistry from "./xml2-proof-sources.json";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/xml2.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { xml2Annotations } from "../../../apps/loom/src/tooling/extensions/annotations/xml2";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { xml2ConsumerProofCase } from "./xml2-consumer-proof-cases";
import {
  xml2GenerationProofCase,
  xml2NativeProofCase,
  xml2ProofFamily,
  xml2TypesProofCase,
  xml2UnitProofCases,
} from "./xml2-proof-cases";

// The host reconciles these reviewed paths with each actual import graph and binds bytes before and after execution.
const rosters = v.parse(
  v.strictObject({
    format: v.literal(1),
    entry: v.literal("packages/e2e/integration/extensions-xml2.test.ts"),
    sources: v.pipe(v.array(v.string()), v.minLength(1)),
    generationSources: v.pipe(v.array(v.string()), v.minLength(1)),
    consumerSources: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  sourceRegistry,
);
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
export const xml2ProofSchema = 'xml"2';
export const xml2ProofCases = [
  xml2NativeProofCase,
  ...xml2UnitProofCases,
  xml2TypesProofCase,
  xml2GenerationProofCase,
  xml2ConsumerProofCase,
];
const common = [
  "apps/loom/package.json",
  "apps/loom/src/core/extensions/adapters/xml2.ts",
  "apps/loom/src/tooling/extensions/annotations/xml2.ts",
  "apps/loom/src/tooling/extensions/manifests/xml2.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/proof-artifact.ts",
  "packages/e2e/fixtures/xml2-consumer-proof-cases.ts",
  "packages/e2e/fixtures/xml2-proof-cases.ts",
  "packages/e2e/fixtures/xml2-proof-sources.json",
  "packages/e2e/fixtures/xml2-semantic-proof.ts",
  "packages/e2e/scripts/report-extension-semantic-proof.ts",
  "bun.lock",
];
export const xml2GateProofSources = {
  database: [...common, ...rosters.sources],
  unit: [...common, "packages/tests/unit/extensions-xml2.test.ts", "apps/loom/src/tooling/codegen/extensions.ts"],
  types: [...common, "packages/tests/types/extensions-xml2.test-d.ts", "apps/loom/src/tooling/codegen/extensions.ts"],
  generation: [...common, ...rosters.generationSources],
  consumer: [...common, ...rosters.consumerSources],
};
export const xml2SemanticProofSources = [...new Set(Object.values(xml2GateProofSources).flat())];
extensionProofSourcesDigest(xml2SemanticProofSources.map((file) => ({ file, sha256: "0".repeat(64) })));

/** Every xml2 member is a public routine; each needs exactly one direct native witness and nothing transfers. */
export const xml2MemberProofs = xml2Annotations.map((annotation) => {
  const cases = xml2ProofCases
    .filter((definition) => definition.gate === "database")
    .flatMap((definition) =>
      definition.claims
        .filter((claim) => claim.member === annotation.id)
        .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
    );
  if (cases.length !== 1) throw new Error(`Missing exact xml2 member proof: ${annotation.id}`);
  return {
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases,
    transfers: [],
  };
});

/** Registration declares requirements; only current host receipts and direct witnesses can satisfy them. */
export function registerXml2SemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate xml2 ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [...new Set([...xml2GateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])])],
      proofs: receipt
        ? xml2ProofCases
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
    extension: "xml2",
    state: "candidate",
    family: xml2ProofFamily,
    schema: xml2ProofSchema,
    members: xml2MemberProofs,
    gates: {
      database: requirement("database"),
      unit: requirement("unit"),
      types: requirement("types"),
      generation: requirement("generation"),
      consumer: requirement("consumer"),
    },
    catalogueVersionReconciliation: null,
  };
  if (!input.declarations.some((entry) => entry.extension === "xml2" && entry.state === "pending"))
    throw new Error("xml2 registration requires its existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "xml2" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...xml2ProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
