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
import { pgUuidv7ProofCases, pgUuidv7ProofFamily, pgUuidv7NativeProofCase } from "./pg-uuidv7-proof-cases";

// Captured from the actual native import graph and reviewed independently of receipts.
// The host reconciles this roster against the graph before every native proof run.
export const pgUuidv7DatabaseProofSources = v.parse(
  v.strictObject({
    format: v.literal(1),
    entry: v.literal("packages/e2e/integration/extensions-pg-uuidv7.test.ts"),
    sources: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  sourceRegistry,
).sources;
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
