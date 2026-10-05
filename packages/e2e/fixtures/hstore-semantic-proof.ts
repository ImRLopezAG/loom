import * as v from "valibot";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/hstore.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { hstoreAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/hstore";
import {
  extensionProofReceiptDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { hstoreMemberProofs, hstoreProofFamily, hstoreProofSchema, hstoreProofCases } from "./hstore-proof-cases";
export { hstoreProofCases } from "./hstore-proof-cases";

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/vite.config.ts",
  "bun.lock",
  "apps/loom/src/core/extensions/adapters/hstore.ts",
  "apps/loom/src/core/extensions/native-codecs.ts",
  "apps/loom/src/core/extensions/hstore-codec.ts",
  "apps/loom/src/core/extensions/hstore-fields.ts",
  "apps/loom/src/core/extensions/hstore-record.ts",
  "apps/loom/src/core/extensions/fields.ts",
  "apps/loom/src/core/extensions/codecs.ts",
  "apps/loom/src/core/extensions/sql.ts",
  "apps/loom/src/tooling/extensions/annotations/hstore.ts",
  "apps/loom/src/tooling/extensions/manifests/hstore.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/hstore-proof-cases.ts",
  "packages/e2e/fixtures/hstore-semantic-proof.ts",
  "packages/e2e/scripts/run-hstore-unit-types-proof.ts",
  "packages/e2e/fixtures/proof-source-snapshot.ts",
  "packages/e2e/scripts/report-hstore-proof.ts",
];
export const hstoreGateProofSources = {
  unit: [
    ...common,
    ...["", "-codec", "-codegen", "-defaults", "-fields", "-record", "-members"].map(
      (suffix) => `packages/tests/unit/extensions-hstore${suffix}.test.ts`,
    ),
    "packages/e2e/fixtures/extension-proof-unit.ts",
  ],
  types: [
    ...common,
    "packages/tests/types/hstore.tsconfig.json",
    ...["", "-codec", "-fields", "-record"].map(
      (suffix) => `packages/tests/types/extensions-hstore${suffix}.test-d.ts`,
    ),
  ],
  database: [
    ...common,
    "packages/e2e/scripts/run-hstore-database-proof.ts",
    ...["", "-codec", "-defaults", "-fields", "-record", "-members"].map(
      (suffix) => `packages/e2e/integration/extensions-hstore${suffix}.test.ts`,
    ),
    ...["api", "codec", "fields", "record", "roles"].map((name) => `packages/e2e/fixtures/hstore-${name}.ts`),
    "apps/loom/src/tooling/extensions/subscript-capture.ts",
    "packages/e2e/fixtures/extension-database.ts",
    "packages/e2e/fixtures/extension-proof.ts",
    "packages/e2e/fixtures/extension-proof-database.ts",
    "apps/loom/src/tooling/extensions/capture.ts",
  ],
  generation: [
    ...common,
    "packages/e2e/scripts/run-hstore-composition-proof.ts",
    "packages/e2e/integration/extensions-hstore-generated.test.ts",
    "packages/e2e/fixtures/hstore-generated-project.ts",
    "packages/e2e/fixtures/hstore-generated.ts",
    "packages/e2e/fixtures/hstore-public-generation.mjs.fixture",
    "packages/e2e/fixtures/hstore-generated-runtime.ts",
    "packages/e2e/fixtures/hstore-runtime-prepare.mjs.fixture",
    "packages/e2e/fixtures/hstore-generated-rpc.mjs.fixture",
    "packages/e2e/fixtures/hstore-runtime-cleanup.mjs.fixture",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  consumer: [
    ...common,
    "packages/e2e/scripts/run-hstore-composition-proof.ts",
    "packages/e2e/integration/packed-hstore.test.ts",
    "packages/e2e/fixtures/hstore-generated-project.ts",
    "packages/e2e/fixtures/hstore-generated.ts",
    "packages/e2e/fixtures/hstore-public-generation.mjs.fixture",
    "packages/e2e/fixtures/hstore-generated-runtime.ts",
    "packages/e2e/fixtures/hstore-runtime-prepare.mjs.fixture",
    "packages/e2e/fixtures/hstore-generated-rpc.mjs.fixture",
    "packages/e2e/fixtures/hstore-runtime-cleanup.mjs.fixture",
    "packages/e2e/fixtures/proof-artifact.ts",
    "packages/e2e/fixtures/packed-consumer-observation.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
};
export const hstoreSemanticProofSources = [...new Set(Object.values(hstoreGateProofSources).flat())];

/** Family-local candidate registration. Definitions and local tests confer no canonical gate acceptance. */
export function registerHstoreSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw Error(`Duplicate hstore ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...hstoreGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? hstoreProofCases
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
    extension: "hstore",
    state: "candidate",
    family: hstoreProofFamily,
    schema: hstoreProofSchema,
    members: hstoreAnnotations.map((annotation) => {
      const proof = hstoreMemberProofs.find((proof) => proof.id === annotation.id);
      if (!proof || proof.disposition !== annotation.disposition)
        throw Error(`hstore annotation/proof mismatch: ${annotation.id}`);
      return {
        ...proof,
        reason: annotation.reason,
        citations: [...new Set([...annotation.evidence, ...proof.citations])],
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
  if (!input.declarations.some((entry) => entry.extension === "hstore" && entry.state === "pending"))
    throw Error("hstore registration requires the existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "hstore" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...hstoreProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
