import { snapshotProofSources } from "../fixtures/proof-source-snapshot";
import assert from "node:assert/strict";
import { existsSync, readFileSync, realpathSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { pathToFileURL } from "node:url";
import * as v from "valibot";
import baseline from "../../../apps/loom/src/tooling/extensions/catalogue.json";
import { wave20ConsumerProofCase } from "../fixtures/wave20-consumer-proof-cases";
import { loadRetainedArtifact } from "../fixtures/proof-artifact";
import {
  wave20Root as root,
  wave20Proofs,
  wave20UnitCases,
  wave20TypesCases,
  wave20DatabaseCases,
  verifyWave20Roster,
} from "./run-wave20-unit-types-proof";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  validateExtensionSemanticProof,
  type ExtensionProofCase,
  type ExtensionProofDeclaration,
  type ExtensionProofGate,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export async function loadWave20SemanticProofInput(
  evidenceDirectory = "docs/architecture/evidence/typed-extension-proof",
  prefix = "2026-10-04-wave20",
): Promise<ExtensionSemanticProofInput> {
  assert(/^\d{4}-\d{2}-\d{2}-wave20$/.test(prefix));
  // Read-only selected-family audit. Fresh host receipts remain separate from family acceptance.
  verifyWave20Roster();
  const evidence = resolve(root, evidenceDirectory);
  const generationFile = resolve(
    root,
    process.env.LOOM_WAVE20_GENERATION_DEFINITIONS_FILE ?? "packages/e2e/fixtures/wave20-generation-proof-cases.ts",
  );
  assert(
    existsSync(generationFile),
    "Wave20 generation prerequisite: supply an actual instrumented generation case module and fresh host receipt",
  );
  const generationPhysical = realpathSync(generationFile);
  assert(generationPhysical.startsWith(root + sep), "Generation definitions escape checkout");
  const generationModule = await import(pathToFileURL(generationPhysical).href);
  const generationCases: ExtensionProofCase[] =
    generationModule.wave20GenerationProofCases ??
    (generationModule.wave20GenerationProofCase ? [generationModule.wave20GenerationProofCase] : []);
  assert(
    Array.isArray(generationCases) && generationCases.length > 0,
    "Generation module must export wave20GenerationProofCases or wave20GenerationProofCase",
  );
  extensionProofCasesDigest(generationCases);
  for (const definition of generationCases) {
    assert.equal(definition.gate, "generation");
    assert.equal(definition.claims.length, 0, "Generation composition does not claim native member witnesses");
    for (const family of definition.families) {
      const proof = wave20Proofs.find((candidate) => candidate.family.extension === family.extension);
      assert(proof, "Generation definition contains an out-of-scope family");
      assert.deepEqual(family, proof.family, "Generation definition contains a stale family capture");
    }
  }
  for (const proof of wave20Proofs)
    assert(
      generationCases.some((definition) =>
        definition.families.some((family) => family.extension === proof.family.extension),
      ),
      `Missing actual generation case for ${proof.family.extension}`,
    );
  const gates: ExtensionProofGate[] = ["database", "unit", "types", "generation", "consumer"];
  const receipts: ExtensionProofReceipt[] = gates.map((gate) => {
    const receipt: ExtensionProofReceipt = JSON.parse(readFileSync(join(evidence, `${prefix}-${gate}.json`), "utf8"));
    extensionProofReceiptDigest(receipt);
    assert.equal(receipt.format, 2, "Wave20 needs instrumented exact-case receipts");
    assert.equal(receipt.gate, gate);
    assert(receipt.runId.startsWith("wave20."), "Do not relabel receipts from an earlier wave");
    return receipt;
  });
  assert.equal(new Set(receipts.map((receipt) => receipt.runId)).size, gates.length);
  const cases = [
    ...wave20UnitCases,
    ...wave20TypesCases,
    ...wave20DatabaseCases,
    ...generationCases,
    wave20ConsumerProofCase,
  ];
  extensionProofCasesDigest(cases);
  for (const receipt of receipts) {
    const expected = cases.filter((definition) => definition.gate === receipt.gate);
    assert.equal(
      receipt.definitionsDigest,
      extensionProofCasesDigest(expected),
      `Host ${receipt.gate} receipt is not bound to the current exact wave20 definitions`,
    );
    assert.deepEqual(
      receipt.cases.map((definition) => definition.id).sort(),
      expected.map((definition) => definition.id).sort(),
      "Receipt omits or adds cases",
    );
  }
  const consumer = receipts.find((receipt) => receipt.gate === "consumer");
  assert(consumer?.gate === "consumer");
  const artifact = await loadRetainedArtifact(join(evidence, `${prefix}-consumer-kello.tgz`), consumer);
  assert(artifact, "The actual tested isolated consumer tarball must be retained");
  const catalogue: ExtensionSemanticProofInput["baseline"] = baseline.entries.map((entry) => ({
    name: entry.name,
    version: entry.postgres18ListedVersion,
    disposition: v.parse(
      v.picklist(["eligible", "unavailable-pg18", "existing-only", "deprecated", "builtin", "decoder-plugin"]),
      entry.providerStatus === "listed-pg18" ? "eligible" : entry.providerStatus,
    ),
  }));
  const candidates = new Map<string, ExtensionProofDeclaration>();
  for (const proof of wave20Proofs) {
    function gateRequirement(gate: ExtensionProofGate) {
      const receipt = receipts.find((candidate) => candidate.gate === gate)!;
      const selected = cases.filter(
        (definition) =>
          definition.gate === gate && definition.families.some((family) => family.extension === proof.family.extension),
      );
      assert(selected.length > 0, `No real ${gate} case for ${proof.family.extension}`);
      // Required source paths come from the current roster as well as the actual host closure.
      // A receipt cannot make an omitted adapter, manifest or case file optional.
      const sources = new Set([
        ...receipt.sourcesBefore.map((source) => source.file),
        proof.definitionFile,
        `apps/loom/src/core/extensions/adapters/${proof.adapter}.ts`,
        `apps/loom/src/tooling/extensions/annotations/${proof.adapter}.ts`,
        `apps/loom/src/tooling/extensions/manifests/${proof.family.extension}.json`,
        "apps/loom/package.json",
        "bun.lock",
        ...selected.map((definition) => definition.file),
      ]);
      if (gate === "unit" || gate === "types") sources.add("packages/e2e/scripts/run-wave20-unit-types-proof.ts");
      if (gate === "database") sources.add("packages/e2e/scripts/run-wave20-database-proof.ts");
      if (gate === "generation") sources.add(relative(root, generationPhysical).split(sep).join("/"));
      if (gate === "consumer") sources.add("packages/e2e/fixtures/wave20-consumer-proof-cases.ts");
      return {
        sources: [...sources].sort(),
        proofs: selected.map((definition) => ({
          caseId: definition.id,
          runId: receipt.runId,
          receiptDigest: extensionProofReceiptDigest(receipt),
        })),
      };
    }
    candidates.set(proof.family.extension, {
      extension: proof.family.extension,
      state: "candidate",
      family: proof.family,
      schema: proof.schema,
      members: proof.members,
      gates: {
        unit: gateRequirement("unit"),
        types: gateRequirement("types"),
        database: gateRequirement("database"),
        generation: gateRequirement("generation"),
        consumer: gateRequirement("consumer"),
      },
      catalogueVersionReconciliation: null,
    });
  }
  const currentSources = snapshotProofSources(
    root,
    receipts.flatMap((receipt) => receipt.sourcesBefore.map((source) => source.file)),
  );
  return {
    baseline: catalogue,
    declarations: catalogue.map(
      (entry) =>
        candidates.get(entry.name) ??
        (entry.disposition === "eligible"
          ? { extension: entry.name, state: "pending", prerequisite: "Outside this selected wave20 audit" }
          : { extension: entry.name, state: "excluded", reason: `Dated provider disposition: ${entry.disposition}` }),
    ),
    manifests: wave20Proofs.map((proof) =>
      JSON.parse(
        readFileSync(join(root, `apps/loom/src/tooling/extensions/manifests/${proof.family.extension}.json`), "utf8"),
      ),
    ),
    cases,
    receipts,
    currentSources,
    artifact,
  };
}

if (import.meta.main) {
  const input = await loadWave20SemanticProofInput(process.argv[2], process.argv[3]);
  const result = validateExtensionSemanticProof(input);
  const selectedFamilies = result.families.filter((family) =>
    wave20Proofs.some((proof) => proof.family.extension === family.extension),
  );
  console.log(
    JSON.stringify(
      {
        scope: `exact ${wave20Proofs.length} wave20 families; no global ledger mutation`,
        allExtensionFamiliesAccepted: false,
        requiredBranchReviewCompleted: false,
        checkedAt: new Date().toISOString(),
        receiptDigests: input.receipts.map((receipt) => ({
          gate: receipt.gate,
          sha256: extensionProofReceiptDigest(receipt),
        })),
        families: selectedFamilies,
      },
      null,
      2,
    ),
  );
  if (selectedFamilies.length !== wave20Proofs.length || selectedFamilies.some((family) => family.state !== "accepted"))
    process.exitCode = 1;
}
