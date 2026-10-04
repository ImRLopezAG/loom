import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync, realpathSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import * as v from "valibot";
import baseline from "../../../apps/loom/src/tooling/extensions/catalogue.json";
import { autoincAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/autoinc";
import { moddatetimeAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/moddatetime";
import { tsmSystemRowsAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/tsm-system-rows";
import { tsmSystemTimeAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/tsm-system-time";
import { intaggAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/intagg";
import { pgstattupleAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pgstattuple";
import { pgrowlocksAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pgrowlocks";
import { dictIntAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/dict_int";
import { citextMemberProofs } from "../fixtures/citext-proof-cases";
import { cubeMemberProofs } from "../fixtures/cube-proof-cases";
import { extensionTextSearchCaptureValidator } from "../../../apps/loom/src/tooling/extensions/text-search-capture";
import {
  wave10CallbackDatabaseProofCases,
  wave10CallbackProofs,
  wave10AdapterFileName,
} from "../fixtures/wave10-callback-proof-cases";
import { wave10CallbackUnitCases, wave10CallbackTypesCases } from "../fixtures/wave10-callback-unit-types-cases";
import { wave10GenerationProofCase, wave10ConsumerProofCase } from "../fixtures/wave10-composition-proof-cases";
import { loadRetainedArtifact } from "../fixtures/proof-artifact";
import {
  extensionProofCasesDigest,
  extensionProofReceiptDigest,
  validateExtensionSemanticProof,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionMemberProof,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

// Read-only scoped audit. It never rewrites the complete branch acceptance ledger.
const root = realpathSync(fileURLToPath(new URL("../../../", import.meta.url)));
export async function loadWave10SemanticProofInput(
  evidenceDirectory = "docs/architecture/evidence/typed-extension-proof",
  prefix = "2026-10-04-wave10-callback",
): Promise<ExtensionSemanticProofInput> {
  assert(/^\d{4}-\d{2}-\d{2}-wave10-callback$/.test(prefix));
  const evidence = resolve(root, evidenceDirectory);
  const receipts: ExtensionProofReceipt[] = ["database", "unit", "types", "generation", "consumer"].map((gate) => {
    const receipt: ExtensionProofReceipt = JSON.parse(readFileSync(join(evidence, `${prefix}-${gate}.json`), "utf8"));
    extensionProofReceiptDigest(receipt);
    assert.equal(receipt.gate, gate);
    assert.equal(receipt.format, 2);
    assert(receipt.runId.startsWith(`wave10.callbacks.${gate}.`));
    return receipt;
  });
  const annotations = {
    autoinc: autoincAnnotations,
    moddatetime: moddatetimeAnnotations,
    tsm_system_rows: tsmSystemRowsAnnotations,
    tsm_system_time: tsmSystemTimeAnnotations,
    intagg: intaggAnnotations,
    pgstattuple: pgstattupleAnnotations,
    pgrowlocks: pgrowlocksAnnotations,
    dict_int: dictIntAnnotations,
  };
  const cases = [
    ...wave10CallbackDatabaseProofCases,
    ...wave10CallbackUnitCases,
    ...wave10CallbackTypesCases,
    wave10GenerationProofCase,
    wave10ConsumerProofCase,
  ];
  extensionProofCasesDigest(cases);
  assert.equal(new Set(receipts.map((receipt) => receipt.runId)).size, receipts.length);
  for (const receipt of receipts) {
    const expected = cases.filter((definition) => definition.gate === receipt.gate);
    assert.equal(receipt.definitionsDigest, extensionProofCasesDigest(expected));
    assert.deepEqual(receipt.cases.map((entry) => entry.id).sort(), expected.map((entry) => entry.id).sort());
  }
  const consumer = receipts.find((receipt) => receipt.gate === "consumer");
  assert(consumer?.gate === "consumer");
  const artifact = await loadRetainedArtifact(join(evidence, `${prefix}-consumer-kello.tgz`), consumer);
  assert(artifact, "The actual tested tarball is required");
  const catalogue: ExtensionSemanticProofInput["baseline"] = baseline.entries.map((entry) => ({
    name: entry.name,
    version: entry.postgres18ListedVersion,
    disposition: v.parse(
      v.picklist(["eligible", "unavailable-pg18", "existing-only", "deprecated", "builtin", "decoder-plugin"]),
      entry.providerStatus === "listed-pg18" ? "eligible" : entry.providerStatus,
    ),
  }));
  const candidates = new Map<string, ExtensionProofDeclaration>();
  for (const name of [
    "citext",
    "cube",
    "autoinc",
    "moddatetime",
    "tsm_system_rows",
    "tsm_system_time",
    "intagg",
    "pgstattuple",
    "pgrowlocks",
    "dict_int",
  ] as const) {
    const proof = wave10CallbackProofs[name];
    const databaseCases = wave10CallbackDatabaseProofCases.filter((definition) =>
      definition.families.some((family) => family.extension === name),
    );
    function gateRequirement(gate: "database" | "unit" | "types" | "generation" | "consumer") {
      const receipt = receipts.find((receipt) => receipt.gate === gate)!;
      return {
        sources: [
          ...new Set([
            ...receipt.sourcesBefore.map((source) => source.file),
            `apps/loom/src/core/extensions/adapters/${wave10AdapterFileName(name)}.ts`,
            `apps/loom/src/tooling/extensions/manifests/${name}.json`,
            "apps/loom/package.json",
            "bun.lock",
            ...cases
              .filter(
                (definition) =>
                  definition.gate === gate && definition.families.some((family) => family.extension === name),
              )
              .map((definition) => definition.file),
          ]),
        ].sort(),
        proofs: cases
          .filter(
            (definition) => definition.gate === gate && definition.families.some((family) => family.extension === name),
          )
          .map((definition) => ({
            caseId: definition.id,
            runId: receipt.runId,
            receiptDigest: extensionProofReceiptDigest(receipt),
          })),
      };
    }
    let members: ExtensionMemberProof[];
    if (name === "citext") members = citextMemberProofs;
    else if (name === "cube") members = cubeMemberProofs;
    else
      members = annotations[name].map((annotation) => ({
        id: annotation.id,
        disposition: annotation.disposition,
        reason: annotation.reason,
        citations: [...annotation.evidence],
        cases: databaseCases.flatMap((definition) =>
          definition.claims
            .filter((claim) => claim.member === annotation.id)
            .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
        ),
        transfers:
          "proofTransfer" in annotation
            ? [
                {
                  from: annotation.proofTransfer.from[0],
                  relation: annotation.proofTransfer.relation,
                  caseId: databaseCases[0]!.id,
                  scenario: databaseCases[0]!.claims.find((claim) => claim.member === annotation.proofTransfer.from[0])!
                    .scenario,
                  basis: annotation.proofTransfer.basis,
                },
              ]
            : [],
      }));
    const declaration: ExtensionProofDeclaration = {
      extension: name,
      state: "candidate",
      family: proof.family,
      schema: proof.schema,
      members,
      gates: {
        database: gateRequirement("database"),
        unit: gateRequirement("unit"),
        types: gateRequirement("types"),
        generation: gateRequirement("generation"),
        consumer: gateRequirement("consumer"),
      },
      catalogueVersionReconciliation: null,
    };
    if (name === "dict_int") {
      declaration.textSearch = {
        file: "apps/loom/src/tooling/extensions/text-search-contracts/dict_int.json",
        capture: v.parse(
          extensionTextSearchCaptureValidator,
          JSON.parse(
            readFileSync(join(root, "apps/loom/src/tooling/extensions/text-search-contracts/dict_int.json"), "utf8"),
          ),
        ),
      };
    }
    candidates.set(name, declaration);
  }
  const paths = [...new Set(receipts.flatMap((receipt) => receipt.sourcesBefore.map((source) => source.file)))];
  const currentSources = paths.map((file) => {
    const physical = realpathSync(join(root, file));
    assert(physical.startsWith(root + sep), "Source escapes checkout");
    return { file, sha256: createHash("sha256").update(readFileSync(physical)).digest("hex") };
  });
  return {
    baseline: catalogue,
    declarations: catalogue.map(
      (entry) =>
        candidates.get(entry.name) ??
        (entry.disposition === "eligible"
          ? { extension: entry.name, state: "pending", prerequisite: "Outside this selected wave10 audit" }
          : { extension: entry.name, state: "excluded", reason: `Dated provider disposition: ${entry.disposition}` }),
    ),
    manifests: [...candidates.keys()].map((name) =>
      JSON.parse(readFileSync(join(root, `apps/loom/src/tooling/extensions/manifests/${name}.json`), "utf8")),
    ),
    cases,
    receipts,
    currentSources,
    artifact,
  };
}

if (import.meta.main) {
  const input = await loadWave10SemanticProofInput(process.argv[2], process.argv[3]);
  const result = validateExtensionSemanticProof(input);
  const families = result.families.filter((family) => Object.hasOwn(wave10CallbackProofs, family.extension));
  console.log(
    JSON.stringify(
      {
        scope: "selected wave10 families; no global ledger mutation",
        allExtensionFamiliesAccepted: false,
        requiredBranchReviewCompleted: false,
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
  if (families.length !== 10 || families.some((family) => family.state !== "accepted")) process.exitCode = 1;
}
