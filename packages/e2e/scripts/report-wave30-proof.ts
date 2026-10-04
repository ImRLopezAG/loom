import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import * as v from "valibot";
import baseline from "../../../apps/loom/src/tooling/extensions/catalogue.json";
import { loadRetainedArtifact } from "../fixtures/proof-artifact";
import { wave30Root as root, wave30Proofs, verifyWave30Roster } from "./run-wave30-unit-types-proof";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  validateExtensionSemanticProof,
  type ExtensionProofGate,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { registerSemverSemanticProof } from "../fixtures/semver-semantic-proof";
import { registerIntarraySemanticProof } from "../fixtures/intarray-semantic-proof";
import { registerPgxUlidSemanticProof } from "../fixtures/pgx-ulid-semantic-proof";
import { registerLtreeSemanticProof } from "../fixtures/ltree-semantic-proof";
import { registerHllSemanticProof } from "../fixtures/hll-semantic-proof";
import { registerIsnSemanticProof } from "../fixtures/isn-semantic-proof";
import { registerBtreeGinSemanticProof } from "../fixtures/btree_gin-semantic-proof";
import { registerBtreeGistSemanticProof } from "../fixtures/btree_gist-semantic-proof";
import { registerXml2SemanticProof } from "../fixtures/xml2-semantic-proof";
import { registerPrefixSemanticProof } from "../fixtures/prefix-semantic-proof";
const registrations = new Map([
  ["semver", registerSemverSemanticProof],
  ["intarray", registerIntarraySemanticProof],
  ["pgx_ulid", registerPgxUlidSemanticProof],
  ["ltree", registerLtreeSemanticProof],
  ["hll", registerHllSemanticProof],
  ["isn", registerIsnSemanticProof],
  ["btree_gin", registerBtreeGinSemanticProof],
  ["btree_gist", registerBtreeGistSemanticProof],
  ["xml2", registerXml2SemanticProof],
  ["prefix", registerPrefixSemanticProof],
]);
export async function loadWave30SemanticProofInput(
  evidenceDirectory = "docs/architecture/evidence/typed-extension-proof",
): Promise<ExtensionSemanticProofInput> {
  verifyWave30Roster();
  const evidence = resolve(root, evidenceDirectory);
  function readReceipt(name: string, gate: ExtensionProofGate, expected: ExtensionSemanticProofInput["cases"]) {
    const receipt: ExtensionProofReceipt = JSON.parse(
      readFileSync(join(evidence, `2026-10-04-${name}-${gate}.json`), "utf8"),
    );
    extensionProofReceiptDigest(receipt);
    assert.equal(receipt.format, 2);
    assert.equal(receipt.gate, gate);
    assert(receipt.runId.startsWith("wave30."));
    assert.equal(receipt.definitionsDigest, extensionProofCasesDigest(expected));
    assert.deepEqual(receipt.cases.map((item) => item.id).sort(), expected.map((item) => item.id).sort());
    return receipt;
  }
  const sharedGates: ExtensionProofGate[] = ["unit", "types"];
  const shared = sharedGates.map((gate) =>
    readReceipt(
      "wave30",
      gate,
      wave30Proofs.flatMap((proof) => proof.cases.filter((item) => item.gate === gate)),
    ),
  );
  const receipts = [...shared];
  const artifacts: NonNullable<ExtensionSemanticProofInput["artifacts"]> = [];
  const perFamily = new Map<string, ExtensionProofReceipt[]>();
  for (const proof of wave30Proofs) {
    const own = ["database", "generation", "consumer"].flatMap((gate) => {
      assert(gate === "database" || gate === "generation" || gate === "consumer");
      if (!existsSync(join(evidence, `2026-10-04-${proof.extension}-${gate}.json`))) return [];
      return [
        readReceipt(
          proof.extension,
          gate,
          proof.cases.filter((item) => item.gate === gate),
        ),
      ];
    });
    const consumer = own.find((item) => item.gate === "consumer");
    if (consumer?.gate === "consumer") {
      const artifact = await loadRetainedArtifact(
        join(evidence, `2026-10-04-${proof.extension}-consumer-kello.tgz`),
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
        ? { extension: entry.name, state: "pending", prerequisite: "Outside this exact wave30 audit" }
        : { extension: entry.name, state: "excluded", reason: `Dated provider disposition: ${entry.disposition}` },
    ),
    manifests: [],
    cases: [],
    receipts: [],
    currentSources,
    artifact: null,
    artifacts,
  };
  for (const proof of wave30Proofs) {
    const register = registrations.get(proof.extension);
    assert(register);
    input = register(input, perFamily.get(proof.extension)!);
  }
  return { ...input, receipts: [...new Map(input.receipts.map((receipt) => [receipt.runId, receipt])).values()] };
}
if (import.meta.main) {
  const input = await loadWave30SemanticProofInput(process.argv[2]);
  const result = validateExtensionSemanticProof(input);
  const families = result.families.filter((family) =>
    wave30Proofs.some((proof) => proof.extension === family.extension),
  );
  console.log(
    JSON.stringify(
      { scope: "Ten exact wave30 families; no global ledger mutation", checkedAt: new Date().toISOString(), families },
      null,
      2,
    ),
  );
  if (families.length !== 10 || families.some((family) => family.state !== "accepted")) process.exitCode = 1;
}
