import * as v from "valibot";
import sourceRegistry from "./pg-jsonschema-proof-sources.json";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/pg_jsonschema.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { pgJsonschemaAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg-jsonschema";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  pgJsonschemaDatabaseProofCases,
  pgJsonschemaProofCases,
  pgJsonschemaProofFamily,
  pgJsonschemaProofSchema,
} from "./pg-jsonschema-proof-cases";

// The host reconciles these reviewed paths with each actual import graph and binds bytes before and after execution.
const rosters = v.parse(
  v.strictObject({
    format: v.literal(1),
    entry: v.literal("packages/e2e/integration/extensions-jsonschema.test.ts"),
    sources: v.pipe(v.array(v.string()), v.minLength(1)),
    generationSources: v.pipe(v.array(v.string()), v.minLength(1)),
    consumerSources: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  sourceRegistry,
);
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/src/core/extensions/adapters/pg-jsonschema.ts",
  "apps/loom/src/core/extensions/native-json-codecs.ts",
  "apps/loom/src/tooling/extensions/annotations/pg-jsonschema.ts",
  "apps/loom/src/tooling/extensions/manifests/pg_jsonschema.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/pg-jsonschema-proof-cases.ts",
  "packages/e2e/fixtures/pg-jsonschema-proof-sources.json",
  "packages/e2e/fixtures/pg-jsonschema-semantic-proof.ts",
  "packages/e2e/fixtures/proof-artifact.ts",
  "packages/e2e/scripts/report-extension-semantic-proof.ts",
  "bun.lock",
];
export const pgJsonschemaGateProofSources = {
  database: [...common, ...rosters.sources],
  unit: [...common, "packages/tests/unit/extensions-jsonschema.test.ts", "apps/loom/src/tooling/codegen/extensions.ts"],
  types: [
    ...common,
    "packages/tests/types/extensions-jsonschema.test-d.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  generation: [...common, ...rosters.generationSources],
  consumer: [...common, ...rosters.consumerSources],
};
export const pgJsonschemaSemanticProofSources = [...new Set(Object.values(pgJsonschemaGateProofSources).flat())];
extensionProofSourcesDigest(pgJsonschemaSemanticProofSources.map((file) => ({ file, sha256: "0".repeat(64) })));

/** Registration declares requirements; only current host receipts and direct witnesses can satisfy them. */
export function registerPgJsonschemaSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate pg_jsonschema ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...pgJsonschemaGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? pgJsonschemaProofCases
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
    extension: "pg_jsonschema",
    state: "candidate",
    family: pgJsonschemaProofFamily,
    schema: pgJsonschemaProofSchema,
    members: pgJsonschemaAnnotations.map((annotation) => ({
      id: annotation.id,
      disposition: annotation.disposition,
      reason: annotation.reason,
      citations: [...annotation.evidence, "packages/e2e/integration/extensions-jsonschema.test.ts"],
      cases: pgJsonschemaDatabaseProofCases.flatMap((definition) =>
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
  if (!input.declarations.some((entry) => entry.extension === "pg_jsonschema" && entry.state === "pending"))
    throw new Error("pg_jsonschema registration requires its existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "pg_jsonschema" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...pgJsonschemaProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
