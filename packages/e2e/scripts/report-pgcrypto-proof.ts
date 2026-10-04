import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import * as v from "valibot";
import baseline from "../../../apps/loom/src/tooling/extensions/catalogue.json";
import { loadRetainedArtifact } from "../fixtures/proof-artifact";
import { registerPgcryptoSemanticProof } from "../fixtures/pgcrypto-semantic-proof";
import { pgcryptoRoot as root, pgcryptoProofs, verifyPgcryptoRoster } from "./run-pgcrypto-unit-types-proof";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  validateExtensionSemanticProof,
  type ExtensionProofGate,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

const gates: ExtensionProofGate[] = ["unit", "types", "database", "generation", "consumer"];

/** Receipts are `<prefix>-<gate>.json`; the consumer archive is `<prefix>-consumer-kello.tgz`. Missing gates stay pending. */
export async function loadPgcryptoSemanticProofInput(
  evidenceDirectory = "docs/architecture/evidence/typed-extension-proof",
  prefix = "pgcrypto",
): Promise<ExtensionSemanticProofInput> {
  verifyPgcryptoRoster();
  const proof = pgcryptoProofs[0]!;
  const evidence = resolve(root, evidenceDirectory);
  const receipts: ExtensionProofReceipt[] = [];
  for (const gate of gates) {
    const file = join(evidence, `${prefix}-${gate}.json`);
    if (!existsSync(file)) continue;
    const expected = proof.cases.filter((item) => item.gate === gate);
    const receipt: ExtensionProofReceipt = JSON.parse(readFileSync(file, "utf8"));
    extensionProofReceiptDigest(receipt);
    assert.equal(receipt.format, 2);
    assert.equal(receipt.gate, gate);
    assert(receipt.runId.startsWith(`pgcrypto.${gate}.`));
    assert.equal(receipt.finalizedBy, "host");
    assert.equal(receipt.definitionsDigest, extensionProofCasesDigest(expected));
    assert.deepEqual(receipt.cases.map((item) => item.id).sort(), expected.map((item) => item.id).sort());
    receipts.push(receipt);
  }
  const artifacts: NonNullable<ExtensionSemanticProofInput["artifacts"]> = [];
  const consumer = receipts.find((item) => item.gate === "consumer");
  if (consumer?.gate === "consumer") {
    const artifact = await loadRetainedArtifact(join(evidence, `${prefix}-consumer-kello.tgz`), consumer);
    assert(artifact, "Retain the actual tested consumer archive");
    artifacts.push(artifact);
  }
  const catalogue: ExtensionSemanticProofInput["baseline"] = baseline.entries.map((entry) => ({
    name: entry.name,
    version: entry.postgres18ListedVersion,
    disposition: v.parse(
      v.picklist(["eligible", "unavailable-pg18", "existing-only", "deprecated", "builtin", "decoder-plugin"]),
      entry.providerStatus === "listed-pg18" ? "eligible" : entry.providerStatus,
    ),
  }));
  const currentSources = [
    ...new Set(receipts.flatMap((receipt) => receipt.sourcesBefore.map((item) => item.file))),
  ].map((file) => {
    const path = realpathSync(resolve(root, file));
    assert(path.startsWith(root + sep));
    return { file, sha256: createHash("sha256").update(readFileSync(path)).digest("hex") };
  });
  return registerPgcryptoSemanticProof(
    {
      baseline: catalogue,
      declarations: catalogue.map((entry) =>
        entry.disposition === "eligible"
          ? { extension: entry.name, state: "pending", prerequisite: "Outside this exact pgcrypto audit" }
          : { extension: entry.name, state: "excluded", reason: `Dated provider disposition: ${entry.disposition}` },
      ),
      manifests: [],
      cases: [],
      receipts: [],
      currentSources,
      artifact: null,
      artifacts,
    },
    receipts,
  );
}

if (import.meta.main) {
  const input = await loadPgcryptoSemanticProofInput(process.argv[2], process.argv[3]);
  const result = validateExtensionSemanticProof(input);
  const families = result.families.filter((family) => family.extension === "pgcrypto");
  console.log(
    JSON.stringify(
      {
        scope: "Exact pgcrypto 1.4 family; missing gates remain pending; no global ledger mutation",
        checkedAt: new Date().toISOString(),
        families,
      },
      null,
      2,
    ),
  );
  if (families.length !== 1 || families.some((family) => family.state !== "accepted")) process.exitCode = 1;
}
