import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import * as v from "valibot";
import baseline from "../../../apps/loom/src/tooling/extensions/catalogue.json";
import { loadRetainedArtifact } from "../fixtures/proof-artifact";
import { wave60Root as root, wave60Proofs, verifyWave60Roster } from "./run-wave60-unit-types-proof";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  validateExtensionSemanticProof,
  type ExtensionProofGate,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { registerIp4rSemanticProof } from "../fixtures/ip4r-semantic-proof";
const registrations = new Map([["ip4r", registerIp4rSemanticProof]]);
export async function loadWave60SemanticProofInput(
  evidenceDirectory = "docs/architecture/evidence/typed-extension-proof",
): Promise<ExtensionSemanticProofInput> {
  verifyWave60Roster();
  const evidence = resolve(root, evidenceDirectory);
  function readReceipt(name: string, gate: ExtensionProofGate, expected: ExtensionSemanticProofInput["cases"]) {
    const receipt: ExtensionProofReceipt = JSON.parse(
      readFileSync(join(evidence, `2026-10-04-${name}-${gate}.json`), "utf8"),
    );
    extensionProofReceiptDigest(receipt);
    assert.equal(receipt.format, 2);
    assert.equal(receipt.gate, gate);
    assert(receipt.runId.startsWith("wave60."));
    assert.equal(receipt.definitionsDigest, extensionProofCasesDigest(expected));
    assert.deepEqual(receipt.cases.map((item) => item.id).sort(), expected.map((item) => item.id).sort());
    return receipt;
  }
  const sharedGates: ExtensionProofGate[] = ["unit", "types"];
  const shared = sharedGates.map((gate) =>
    readReceipt(
      "wave60",
      gate,
      wave60Proofs.flatMap((proof) => proof.cases.filter((item) => item.gate === gate)),
    ),
  );
  const receipts = [...shared];
  const artifacts: NonNullable<ExtensionSemanticProofInput["artifacts"]> = [];
  const perFamily = new Map<string, ExtensionProofReceipt[]>();
  for (const proof of wave60Proofs) {
    const own = ["database", "generation", "consumer"].flatMap((gate) => {
      assert(gate === "database" || gate === "generation" || gate === "consumer");
      if (!existsSync(join(evidence, `2026-10-04-wave60-${proof.extension}-${gate}.json`))) return [];
      return [
        readReceipt(
          "wave60-" + proof.extension,
          gate,
          proof.cases.filter((item) => item.gate === gate),
        ),
      ];
    });
    const consumer = own.find((item) => item.gate === "consumer");
    if (consumer?.gate === "consumer") {
      const artifact = await loadRetainedArtifact(
        join(evidence, `2026-10-04-wave60-${proof.extension}-consumer-kello.tgz`),
        consumer,
      );
      assert(artifact, "Retain each actual tested consumer archive");
      if (!artifacts.some((item) => item.tarballSha256 === artifact.tarballSha256)) artifacts.push(artifact);
    }
    receipts.push(...own);
    perFamily.set(proof.extension, [...shared, ...own]);
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
  let input: ExtensionSemanticProofInput = {
    baseline: catalogue,
    declarations: catalogue.map((entry) =>
      entry.disposition === "eligible"
        ? { extension: entry.name, state: "pending", prerequisite: "Outside this exact wave60 audit" }
        : { extension: entry.name, state: "excluded", reason: `Dated provider disposition: ${entry.disposition}` },
    ),
    manifests: [],
    cases: [],
    receipts: [],
    currentSources,
    artifact: null,
    artifacts,
  };
  for (const proof of wave60Proofs) {
    const register = registrations.get(proof.extension);
    assert(register);
    input = register(input, perFamily.get(proof.extension)!);
  }
  return { ...input, receipts: [...new Map(input.receipts.map((receipt) => [receipt.runId, receipt])).values()] };
}
if (import.meta.main) {
  const input = await loadWave60SemanticProofInput(process.argv[2]);
  const result = validateExtensionSemanticProof(input);
  const families = result.families.filter((family) =>
    wave60Proofs.some((proof) => proof.extension === family.extension),
  );
  console.log(
    JSON.stringify(
      {
        scope: "Exact wave60 families; missing gates remain pending; no global ledger mutation",
        checkedAt: new Date().toISOString(),
        families,
      },
      null,
      2,
    ),
  );
  if (families.length !== 1 || families.some((family) => family.state !== "accepted")) process.exitCode = 1;
}
