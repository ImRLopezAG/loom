import { snapshotProofSources } from "../fixtures/proof-source-snapshot";
import assert from "node:assert/strict";
import { readFile, realpath } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as v from "valibot";
import baseline from "../../../apps/loom/src/tooling/extensions/catalogue.json";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  validateExtensionSemanticProof,
  type ExtensionProofGate,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { bloomProofCases } from "../fixtures/bloom-proof-cases";
import { bloomSemanticProofSources, registerBloomSemanticProof } from "../fixtures/bloom-semantic-proof";
import { loadRetainedArtifact } from "../fixtures/proof-artifact";

// Read-only bloom audit of retained host receipts. It writes nothing; ledger and progress integration stay with the
// root reporter. Usage: bun report-bloom-proof.ts [evidence-directory] [receipt-prefix]
const root = await realpath(fileURLToPath(new URL("../../../", import.meta.url)));
export async function loadBloomSemanticProofInput(
  evidenceDirectory = "docs/architecture/evidence/typed-extension-proof",
  receiptPrefix = "2026-10-04-bloom",
): Promise<ExtensionSemanticProofInput> {
  const evidence = resolve(root, evidenceDirectory);
  const prefix = v.parse(v.pipe(v.string(), v.regex(/^\d{4}-\d{2}-\d{2}-bloom$/)), receiptPrefix);
  const gates: ExtensionProofGate[] = ["database", "unit", "types", "generation", "consumer"];
  // Absent receipts leave their gate pending; present receipts must be well-formed bloom receipts for their gate.
  const receipts: ExtensionProofReceipt[] = [];
  for (const gate of gates) {
    let bytes: string;
    try {
      bytes = await readFile(resolve(evidence, `${prefix}-${gate}.json`), "utf8");
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") continue;
      throw error;
    }
    const observed: ExtensionProofReceipt = JSON.parse(bytes);
    extensionProofReceiptDigest(observed);
    extensionProofSourcesDigest(observed.sourcesBefore);
    assert.equal(observed.format, 2, "Bloom needs instrumented exact-case receipts");
    assert.equal(observed.gate, gate, "Retained bloom receipt has the wrong gate");
    assert(observed.runId.startsWith(`bloom.${gate}.`), "Do not relabel another family's receipt");
    assert.equal(
      observed.definitionsDigest,
      extensionProofCasesDigest(bloomProofCases.filter((definition) => definition.gate === gate)),
      `Retained bloom ${gate} receipt is not bound to the current exact definitions`,
    );
    receipts.push(observed);
  }
  const consumer = receipts.find((observed) => observed.gate === "consumer");
  const artifact =
    consumer?.gate === "consumer"
      ? await loadRetainedArtifact(resolve(evidence, `${prefix}-consumer-kello.tgz`), consumer)
      : null;
  const currentSources = snapshotProofSources(root, [
    ...bloomSemanticProofSources,
    ...receipts.flatMap((observed) => observed.sourcesBefore.map(({ file }) => file)),
  ]);
  const catalogue: ExtensionSemanticProofInput["baseline"] = baseline.entries.map((entry) => ({
    name: entry.name,
    version: entry.postgres18ListedVersion,
    disposition: v.parse(
      v.picklist(["eligible", "unavailable-pg18", "existing-only", "deprecated", "builtin", "decoder-plugin"]),
      entry.providerStatus === "listed-pg18" ? "eligible" : entry.providerStatus,
    ),
  }));
  return {
    ...registerBloomSemanticProof(
      {
        baseline: catalogue,
        declarations: catalogue.map((entry) =>
          entry.disposition === "eligible"
            ? { extension: entry.name, state: "pending", prerequisite: "Outside this bloom audit" }
            : { extension: entry.name, state: "excluded", reason: `Dated provider disposition: ${entry.disposition}` },
        ),
        manifests: [],
        cases: [],
        receipts: [],
        currentSources,
        artifact: null,
      },
      receipts,
    ),
    artifact,
  };
}
if (import.meta.main) {
  const input = await loadBloomSemanticProofInput(process.argv[2], process.argv[3]);
  const result = validateExtensionSemanticProof(input);
  const family = result.families.find((entry) => entry.extension === "bloom");
  assert(family, "Bloom is missing from the catalogue result");
  console.log(
    JSON.stringify(
      {
        scope: "exact bloom 1.0 family; no ledger or progress mutation",
        checkedAt: new Date().toISOString(),
        receiptDigests: input.receipts.map((observed) => ({
          gate: observed.gate,
          sha256: extensionProofReceiptDigest(observed),
        })),
        missingGates: (["database", "unit", "types", "generation", "consumer"] as const).filter(
          (gate) => !input.receipts.some((observed) => observed.gate === gate),
        ),
        artifactRetained: input.artifact !== null,
        family,
      },
      null,
      2,
    ),
  );
  if (family.state !== "accepted") process.exitCode = 1;
}
