import sourceRegistry from "./pg-uuidv7-proof-sources.json";
import baseline from "../../../docs/architecture/evidence/neon-extension-capability-map-2026-10-02.json";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/pg_uuidv7.json";
import * as v from "valibot";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { pgUuidv7Annotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg-uuidv7";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionProofSource,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { pgUuidv7ProofCases, pgUuidv7ProofFamily, pgUuidv7NativeProofCase, pgUuidv7AllGateProofCases } from "./pg-uuidv7-proof-cases";

// Captured from the actual native import graph and reviewed independently of receipts.
// The host reconciles this roster against the graph before every native proof run.
const rosters = v.parse(
  v.strictObject({
    format: v.literal(1),
    entry: v.literal("packages/e2e/integration/extensions-pg-uuidv7.test.ts"),
    sources: v.pipe(v.array(v.string()), v.minLength(1)),
    generationSources: v.pipe(v.array(v.string()), v.minLength(1)),
    consumerSources: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  sourceRegistry,
);
export const pgUuidv7DatabaseProofSources = rosters.sources;
// Reuse the exact normalized path and duplicate rules without pretending these are byte hashes.
extensionProofSourcesDigest(pgUuidv7DatabaseProofSources.map((file) => ({ file, sha256: "0".repeat(64) })));

const disposition = v.picklist([
  "eligible",
  "unavailable-pg18",
  "existing-only",
  "deprecated",
  "builtin",
  "decoder-plugin",
]);

/** Native proof alone is deliberately insufficient for semantic family acceptance. */
export function pgUuidv7SemanticProofInput(
  receipt: ExtensionProofReceipt,
  currentSources: ExtensionProofSource[],
): ExtensionSemanticProofInput {
  const catalogue: ExtensionSemanticProofInput["baseline"] = baseline.entries.map((entry) => ({
    name: entry.name,
    version: entry.postgres18ListedVersion,
    disposition: v.parse(disposition, entry.providerStatus === "listed-pg18" ? "eligible" : entry.providerStatus),
  }));
  const receiptDigest = extensionProofReceiptDigest(receipt);
  const candidate: ExtensionProofDeclaration = {
    extension: "pg_uuidv7",
    state: "candidate",
    family: pgUuidv7ProofFamily,
    schema: 'custom"v7',
    members: pgUuidv7Annotations.map((annotation) => ({
      id: annotation.id,
      disposition: annotation.disposition,
      reason: annotation.reason,
      citations: [...annotation.evidence],
      cases: pgUuidv7NativeProofCase.claims
        .filter((claim) => claim.member === annotation.id)
        .map((claim) => ({ caseId: pgUuidv7NativeProofCase.id, scenario: claim.scenario })),
      transfers: [],
    })),
    gates: {
      database: {
        sources: [...new Set([...pgUuidv7DatabaseProofSources, ...receipt.sourcesBefore.map((source) => source.file)])],
        proofs: pgUuidv7ProofCases.map((definition) => ({
          caseId: definition.id,
          runId: receipt.runId,
          receiptDigest,
        })),
      },
      unit: { sources: ["packages/tests/unit/extensions-pg-uuidv7.test.ts"], proofs: [] },
      types: { sources: ["packages/tests/types/extensions-pg-uuidv7.test-d.ts"], proofs: [] },
      generation: { sources: ["packages/e2e/integration/extension-adapter-codegen.test.ts"], proofs: [] },
      consumer: { sources: ["packages/e2e/integration/packed-extension-adapters.test.ts"], proofs: [] },
    },
    catalogueVersionReconciliation: null,
  };
  const declarations: ExtensionProofDeclaration[] = catalogue.map((entry) => {
    if (entry.disposition !== "eligible")
      return { extension: entry.name, state: "excluded", reason: `Dated provider disposition: ${entry.disposition}` };
    if (entry.name === candidate.extension) return candidate;
    return {
      extension: entry.name,
      state: "pending",
      prerequisite:
        entry.name === "pgx_ulid"
          ? "Verified preload and valid binary receiver evidence remain prerequisites; all 48 members stay in scope."
          : entry.name === "pg_hashids"
            ? "Provider binary safety provenance remains a prerequisite; every captured member stays in scope."
            : "Source-bound native member, type, generation and isolated consumer proof remain pending.",
    };
  });
  return {
    baseline: catalogue,
    declarations,
    manifests: [validateExtensionManifest(v.parse(extensionManifestValidator, manifest))],
    cases: pgUuidv7ProofCases,
    receipts: [receipt],
    currentSources,
    artifact: null,
  };
}

const common = [
  "apps/loom/package.json",
  "apps/loom/src/core/extensions/adapters/pg-uuidv7.ts",
  "apps/loom/src/core/extensions/native-timestamp-codecs.ts",
  "apps/loom/src/core/extensions/native-uuid-codec.ts",
  "apps/loom/src/tooling/extensions/annotations/pg-uuidv7.ts",
  "apps/loom/src/tooling/extensions/manifests/pg_uuidv7.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/pg-uuidv7-proof-cases.ts",
  "packages/e2e/fixtures/pg-uuidv7-proof-sources.json",
  "packages/e2e/fixtures/pg-uuidv7-semantic-proof.ts",
  "packages/e2e/fixtures/proof-artifact.ts",
  "packages/e2e/scripts/report-extension-semantic-proof.ts",
  "bun.lock",
];
export const pgUuidv7GateProofSources = {
  database: [...common, ...rosters.sources],
  unit: [...common, "packages/tests/unit/extensions-pg-uuidv7.test.ts", "apps/loom/src/tooling/codegen/extensions.ts"],
  types: [...common, "packages/tests/types/extensions-pg-uuidv7.test-d.ts", "apps/loom/src/tooling/codegen/extensions.ts"],
  generation: [...common, ...rosters.generationSources],
  consumer: [...common, ...rosters.consumerSources],
};
export const pgUuidv7SemanticProofSources = [...new Set(Object.values(pgUuidv7GateProofSources).flat())];
extensionProofSourcesDigest(pgUuidv7SemanticProofSources.map(file => ({file, sha256: "0".repeat(64)})));

/** Extend the legacy native candidate without treating its historical receipt as current proof. */
export function registerPgUuidv7SemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  const candidate = input.declarations.find(entry => entry.extension === "pg_uuidv7");
  if (!candidate || candidate.state !== "candidate") throw new Error("UUIDv7 registration requires its native candidate");
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter(receipt => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate UUIDv7 ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [...new Set([...pgUuidv7GateProofSources[gate], ...(receipt?.sourcesBefore.map(({file}) => file) ?? [])])],
      proofs: receipt ? pgUuidv7AllGateProofCases.filter(definition => definition.gate === gate).map(definition => ({
        caseId: definition.id, runId: receipt.runId, receiptDigest: extensionProofReceiptDigest(receipt),
      })) : [],
    };
  }
  return {
    ...input,
    declarations: input.declarations.map(entry => entry.extension === "pg_uuidv7" ? {...candidate, gates: {
      database: requirement("database"), unit: requirement("unit"), types: requirement("types"),
      generation: requirement("generation"), consumer: requirement("consumer"),
    }} : entry),
    cases: [...input.cases, ...pgUuidv7AllGateProofCases.filter(definition => definition.gate !== "database")],
    receipts: [...input.receipts, ...receipts],
  };
}
