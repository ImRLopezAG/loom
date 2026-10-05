import { snapshotProofSources } from "../fixtures/proof-source-snapshot";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import * as v from "valibot";
import baseline from "../../../apps/loom/src/tooling/extensions/catalogue.json";
import { loadRetainedArtifact } from "../fixtures/proof-artifact";
import { wave70Root as root, wave70Proofs, verifyWave70Roster } from "./run-wave70-unit-types-proof";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  validateExtensionSemanticProof,
  type ExtensionProofGate,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { registerPgGraphqlSemanticProof } from "../fixtures/pg_graphql-semantic-proof";
const registrations = new Map([["pg_graphql", registerPgGraphqlSemanticProof]]);
export async function loadWave70SemanticProofInput(
  evidenceDirectory = "docs/architecture/evidence/typed-extension-proof",
): Promise<ExtensionSemanticProofInput> {
  verifyWave70Roster();
  const evidence = resolve(root, evidenceDirectory);
  function readReceipt(name: string, gate: ExtensionProofGate, expected: ExtensionSemanticProofInput["cases"]) {
    const receipt: ExtensionProofReceipt = JSON.parse(
      readFileSync(join(evidence, `2026-10-04-${name}-${gate}.json`), "utf8"),
    );
    extensionProofReceiptDigest(receipt);
    assert.equal(receipt.format, 2);
    assert.equal(receipt.gate, gate);
    assert(receipt.runId.startsWith("wave70."));
    assert.equal(receipt.definitionsDigest, extensionProofCasesDigest(expected));
    assert.deepEqual(receipt.cases.map((item) => item.id).sort(), expected.map((item) => item.id).sort());
    return receipt;
  }
  const sharedGates: ExtensionProofGate[] = ["unit", "types"];
  const shared = sharedGates.map((gate) =>
    readReceipt(
      "wave70",
      gate,
      wave70Proofs.flatMap((proof) => proof.cases.filter((item) => item.gate === gate)),
    ),
  );
  const receipts = [...shared];
  const artifacts: NonNullable<ExtensionSemanticProofInput["artifacts"]> = [];
  const perFamily = new Map<string, ExtensionProofReceipt[]>();
  for (const proof of wave70Proofs) {
    const own = ["database", "generation", "consumer"].flatMap((gate) => {
      assert(gate === "database" || gate === "generation" || gate === "consumer");
      if (!existsSync(join(evidence, `2026-10-04-wave70-${proof.extension}-${gate}.json`))) return [];
      return [
        readReceipt(
          "wave70-" + proof.extension,
          gate,
          proof.cases.filter((item) => item.gate === gate),
        ),
      ];
    });
    const consumer = own.find((item) => item.gate === "consumer");
    if (consumer?.gate === "consumer") {
      const artifact = await loadRetainedArtifact(
        join(evidence, `2026-10-04-wave70-${proof.extension}-consumer-kello.tgz`),
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
  const currentSources = snapshotProofSources(
    root,
    receipts.flatMap((receipt) => receipt.sourcesBefore.map((source) => source.file)),
  );
  let input: ExtensionSemanticProofInput = {
    baseline: catalogue,
    declarations: catalogue.map((entry) =>
      entry.disposition === "eligible"
        ? { extension: entry.name, state: "pending", prerequisite: "Outside this exact wave70 audit" }
        : { extension: entry.name, state: "excluded", reason: `Dated provider disposition: ${entry.disposition}` },
    ),
    manifests: [],
    cases: [],
    receipts: [],
    currentSources,
    artifact: null,
    artifacts,
  };
  for (const proof of wave70Proofs) {
    const register = registrations.get(proof.extension);
    assert(register);
    input = register(input, perFamily.get(proof.extension)!);
  }
  return { ...input, receipts: [...new Map(input.receipts.map((receipt) => [receipt.runId, receipt])).values()] };
}
if (import.meta.main) {
  const input = await loadWave70SemanticProofInput(process.argv[2]);
  const result = validateExtensionSemanticProof(input);
  const families = result.families.filter((family) =>
    wave70Proofs.some((proof) => proof.extension === family.extension),
  );
  console.log(
    JSON.stringify(
      {
        scope: "Exact wave70 families; missing gates remain pending; no global ledger mutation",
        checkedAt: new Date().toISOString(),
        families,
      },
      null,
      2,
    ),
  );
  if (families.length !== 1 || families.some((family) => family.state !== "accepted")) process.exitCode = 1;
}
