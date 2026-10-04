import { snapshotProofSources } from "../fixtures/proof-source-snapshot";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import * as v from "valibot";
import baseline from "../../../apps/loom/src/tooling/extensions/catalogue.json";
import { loadRetainedArtifact } from "../fixtures/proof-artifact";
import { wave40Root as root, wave40Proofs, verifyWave40Roster } from "./run-wave40-unit-types-proof";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  validateExtensionSemanticProof,
  type ExtensionProofGate,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { registerTablefuncSemanticProof } from "../fixtures/tablefunc-semantic-proof";
import { registerRoaringbitmapSemanticProof } from "../fixtures/roaringbitmap-semantic-proof";
import { registerHypopgSemanticProof } from "../fixtures/hypopg-semantic-proof";
import { registerLakebaseTextSemanticProof } from "../fixtures/lakebase-text-semantic-proof";
import { registerNeonUtilsSemanticProof } from "../fixtures/neon_utils-semantic-proof";
import { registerPgHashidsSemanticProof } from "../fixtures/pg-hashids-semantic-proof";
const registrations = new Map([
  ["tablefunc", registerTablefuncSemanticProof],
  ["roaringbitmap", registerRoaringbitmapSemanticProof],
  ["hypopg", registerHypopgSemanticProof],
  ["lakebase_text", registerLakebaseTextSemanticProof],
  ["neon_utils", registerNeonUtilsSemanticProof],
  ["pg_hashids", registerPgHashidsSemanticProof],
]);
export async function loadWave40SemanticProofInput(
  evidenceDirectory = "docs/architecture/evidence/typed-extension-proof",
): Promise<ExtensionSemanticProofInput> {
  verifyWave40Roster();
  const evidence = resolve(root, evidenceDirectory);
  function readReceipt(name: string, gate: ExtensionProofGate, expected: ExtensionSemanticProofInput["cases"]) {
    const receipt: ExtensionProofReceipt = JSON.parse(
      readFileSync(join(evidence, `2026-10-04-${name}-${gate}.json`), "utf8"),
    );
    extensionProofReceiptDigest(receipt);
    assert.equal(receipt.format, 2);
    assert.equal(receipt.gate, gate);
    assert(receipt.runId.startsWith("wave40."));
    assert.equal(receipt.definitionsDigest, extensionProofCasesDigest(expected));
    assert.deepEqual(receipt.cases.map((item) => item.id).sort(), expected.map((item) => item.id).sort());
    return receipt;
  }
  const sharedGates: ExtensionProofGate[] = ["unit", "types"];
  const shared = sharedGates.map((gate) =>
    readReceipt(
      "wave40",
      gate,
      wave40Proofs.flatMap((proof) => proof.cases.filter((item) => item.gate === gate)),
    ),
  );
  const receipts = [...shared];
  const artifacts: NonNullable<ExtensionSemanticProofInput["artifacts"]> = [];
  const perFamily = new Map<string, ExtensionProofReceipt[]>();
  for (const proof of wave40Proofs) {
    const own = ["database", "generation", "consumer"].flatMap((gate) => {
      assert(gate === "database" || gate === "generation" || gate === "consumer");
      if (!existsSync(join(evidence, `2026-10-04-wave40-${proof.extension}-${gate}.json`))) return [];
      return [
        readReceipt(
          "wave40-" + proof.extension,
          gate,
          proof.cases.filter((item) => item.gate === gate),
        ),
      ];
    });
    const consumer = own.find((item) => item.gate === "consumer");
    if (consumer?.gate === "consumer") {
      const artifact = await loadRetainedArtifact(
        join(evidence, `2026-10-04-wave40-${proof.extension}-consumer-kello.tgz`),
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
        ? { extension: entry.name, state: "pending", prerequisite: "Outside this exact wave40 audit" }
        : { extension: entry.name, state: "excluded", reason: `Dated provider disposition: ${entry.disposition}` },
    ),
    manifests: [],
    cases: [],
    receipts: [],
    currentSources,
    artifact: null,
    artifacts,
  };
  for (const proof of wave40Proofs) {
    const register = registrations.get(proof.extension);
    assert(register);
    input = register(input, perFamily.get(proof.extension)!);
  }
  return { ...input, receipts: [...new Map(input.receipts.map((receipt) => [receipt.runId, receipt])).values()] };
}
if (import.meta.main) {
  const input = await loadWave40SemanticProofInput(process.argv[2]);
  const result = validateExtensionSemanticProof(input);
  const families = result.families.filter((family) =>
    wave40Proofs.some((proof) => proof.extension === family.extension),
  );
  console.log(
    JSON.stringify(
      {
        scope: "Six exact wave40 families; native repair blockers remain pending; no global ledger mutation",
        checkedAt: new Date().toISOString(),
        families,
      },
      null,
      2,
    ),
  );
  if (
    families.length !== 6 ||
    families.filter((family) => family.extension !== "pg_hashids").some((family) => family.state !== "accepted") ||
    families.find((family) => family.extension === "pg_hashids")?.state === "accepted"
  )
    process.exitCode = 1;
}
