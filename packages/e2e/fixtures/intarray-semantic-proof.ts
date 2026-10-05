import * as v from "valibot";
import sourceRegistry from "./intarray-proof-sources.json";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/intarray.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { intarrayAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/intarray";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  intarrayDatabaseProofCases,
  intarrayProofCases,
  intarrayProofFamily,
  intarrayProofSchema,
  intarrayInternalRelations,
} from "./intarray-proof-cases";

// The host reconciles these reviewed paths with each actual import graph and binds bytes before and after execution.
const rosters = v.parse(
  v.strictObject({
    format: v.literal(1),
    entry: v.literal("packages/e2e/integration/extensions-intarray.test.ts"),
    sources: v.pipe(v.array(v.string()), v.minLength(1)),
    generationSources: v.pipe(v.array(v.string()), v.minLength(1)),
    consumerSources: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  sourceRegistry,
);
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/src/core/extensions/adapters/intarray.ts",
  "apps/loom/src/core/extensions/adapters/intarray-codecs.ts",
  "apps/loom/src/tooling/extensions/annotations/intarray.ts",
  "apps/loom/src/tooling/extensions/manifests/intarray.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/intarray-proof-cases.ts",
  "packages/e2e/fixtures/intarray-proof-sources.json",
  "packages/e2e/fixtures/intarray-semantic-proof.ts",
  "packages/e2e/fixtures/proof-artifact.ts",
  "packages/e2e/scripts/report-extension-semantic-proof.ts",
  "bun.lock",
];
export const intarrayGateProofSources = {
  database: [...common, ...rosters.sources],
  unit: [
    ...common,
    "packages/tests/unit/extensions-intarray.test.ts",
    "packages/tests/unit/extensions-intarray-registry.test.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  types: [
    ...common,
    "packages/tests/types/extensions-intarray.test-d.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  generation: [...common, ...rosters.generationSources],
  consumer: [...common, ...rosters.consumerSources],
};
export const intarraySemanticProofSources = [...new Set(Object.values(intarrayGateProofSources).flat())];
extensionProofSourcesDigest(intarraySemanticProofSources.map((file) => ({ file, sha256: "0".repeat(64) })));

/** Every internal disposition requires an exact captured relation and a native owning-member witness. */
export const intarrayUnresolvedInternalMembers = intarrayAnnotations
  .filter((row) => row.disposition === "internal" && !Object.hasOwn(intarrayInternalRelations, row.id))
  .map((row) => row.id);

/** Registration declares requirements; only current host receipts and direct witnesses can satisfy them. */
export function registerIntarraySemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate intarray ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...intarrayGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? intarrayProofCases
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
    extension: "intarray",
    state: "candidate",
    family: intarrayProofFamily,
    schema: intarrayProofSchema,
    members: intarrayAnnotations.map((annotation) => ({
      id: annotation.id,
      disposition: annotation.disposition,
      reason: annotation.reason,
      citations: [...annotation.evidence, "packages/e2e/integration/extensions-intarray.test.ts"],
      cases: intarrayDatabaseProofCases.flatMap((definition) =>
        definition.claims
          .filter((claim) => claim.member === annotation.id)
          .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
      ),
      transfers: (() => {
        const edge = Object.entries(intarrayInternalRelations).find(([id]) => id === annotation.id)?.[1];
        if (!edge) return [];
        const root = (id: string): string => {
          const parent = Object.entries(intarrayInternalRelations).find(([key]) => key === id)?.[1];
          return parent ? root(parent.from) : id;
        };
        const claim = intarrayDatabaseProofCases
          .flatMap((definition) => definition.claims.map((claim) => ({ definition, claim })))
          .find(
            ({ definition, claim }) =>
              claim.member === root(edge.from) &&
              (edge.relation.kind !== "operator-estimator" ||
                (definition.id === "intarray.operator-estimators" &&
                  claim.scenario ===
                    (edge.relation.slot === "restrict"
                      ? "native-where-restrict-planning-and-filtered-results"
                      : "native-join-planning-and-matched-pairs"))),
          );
        if (!claim) throw new Error(`Missing intarray root witness: ${annotation.id}`);
        return [
          {
            ...edge,
            caseId: claim.definition.id,
            scenario: claim.claim.scenario,
            basis:
              edge.relation.kind === "operator-estimator"
                ? `Exact captured operator ${edge.relation.slot} pointer; the native root witness exercises ${edge.relation.slot === "restrict" ? "WHERE restriction" : "JOIN"} planning with EXPLAIN ANALYZE and asserted SQL results. Host validation and current receipts remain required.`
                : "Exact captured intarray catalog edge; the native root witness exercises the owning operator class or PostgreSQL type I/O. Host validation and current receipts remain required.",
          },
        ];
      })(),
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
  if (!input.declarations.some((entry) => entry.extension === "intarray" && entry.state === "pending"))
    throw new Error("intarray registration requires its existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "intarray" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...intarrayProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
