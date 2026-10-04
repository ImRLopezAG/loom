import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import * as v from "valibot";
import baseline from "../../../docs/architecture/evidence/neon-extension-capability-map-2026-10-02.json";
import { rdkitProofCases } from "../fixtures/rdkit-proof-cases";
import { registerRdkitSemanticProof } from "../fixtures/rdkit-semantic-proof";
import { loadRetainedArtifact } from "../fixtures/proof-artifact";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  validateExtensionSemanticProof,
  type ExtensionProofGate,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

const root = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));

export async function loadRdkitSemanticProofInput(
  evidenceDirectory = "docs/architecture/evidence/typed-extension-proof",
  prefix = "2026-10-04-rdkit",
): Promise<ExtensionSemanticProofInput> {
  assert(/^\d{4}-\d{2}-\d{2}-rdkit$/.test(prefix));
  const evidence = resolve(root, evidenceDirectory);
  const gates: ExtensionProofGate[] = ["unit", "types", "database", "generation", "consumer"];
  const receipts = gates.map((gate) => {
    const receipt: ExtensionProofReceipt = JSON.parse(readFileSync(join(evidence, `${prefix}-${gate}.json`), "utf8"));
    extensionProofReceiptDigest(receipt);
    assert.equal(receipt.format, 2);
    assert.equal(receipt.gate, gate);
    assert(receipt.runId.startsWith(`rdkit.${gate}.`));
    const expected = rdkitProofCases.filter((definition) => definition.gate === gate);
    assert.equal(receipt.definitionsDigest, extensionProofCasesDigest(expected));
    assert.deepEqual(receipt.cases.map((entry) => entry.id).sort(), expected.map((entry) => entry.id).sort());
    return receipt;
  });
  assert.equal(new Set(receipts.map((receipt) => receipt.runId)).size, gates.length);
  const consumer = receipts.find((receipt) => receipt.gate === "consumer");
  assert(consumer?.gate === "consumer");
  const artifact = await loadRetainedArtifact(join(evidence, `${prefix}-consumer-kello.tgz`), consumer);
  assert(artifact, "Retain the actual tested RDKit consumer archive");
  const catalogue: ExtensionSemanticProofInput["baseline"] = baseline.entries.map((entry) => ({
    name: entry.name,
    version: entry.postgres18ListedVersion,
    disposition: v.parse(
      v.picklist(["eligible", "unavailable-pg18", "existing-only", "deprecated", "builtin", "decoder-plugin"]),
      entry.providerStatus === "listed-pg18" ? "eligible" : entry.providerStatus,
    ),
  }));
  const currentSources = [
    ...new Set(receipts.flatMap((receipt) => receipt.sourcesBefore.map((source) => source.file))),
  ].map((file) => {
    const physical = realpathSync(resolve(root, file));
    assert(physical.startsWith(root + sep), "Source escapes checkout");
    return { file, sha256: createHash("sha256").update(readFileSync(physical)).digest("hex") };
  });
  return registerRdkitSemanticProof(
    {
      baseline: catalogue,
      declarations: catalogue.map((entry) =>
        entry.disposition === "eligible"
          ? { extension: entry.name, state: "pending", prerequisite: "Outside this selected RDKit audit" }
          : { extension: entry.name, state: "excluded", reason: `Dated provider disposition: ${entry.disposition}` },
      ),
      manifests: [],
      cases: [],
      receipts: [],
      currentSources,
      artifact,
    },
    receipts,
  );
}

if (import.meta.main) {
  const input = await loadRdkitSemanticProofInput(process.argv[2], process.argv[3]);
  const result = validateExtensionSemanticProof(input);
  const families = result.families.filter((family) => family.extension === "rdkit");
  console.log(
    JSON.stringify(
      {
        scope: "RDKit exact family; no global ledger mutation",
        allExtensionFamiliesAccepted: false,
        checkedAt: new Date().toISOString(),
        receiptDigests: input.receipts.map((receipt) => ({
          gate: receipt.gate,
          sha256: extensionProofReceiptDigest(receipt),
        })),
        families,
      },
      null,
      2,
    ),
  );
  if (families.length !== 1 || families[0]?.state !== "accepted") process.exitCode = 1;
}
