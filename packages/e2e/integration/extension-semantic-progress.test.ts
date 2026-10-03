import assert from "node:assert/strict";
import { test } from "bun:test";
import { readFile } from "node:fs/promises";
import {
  validateExtensionSemanticProof,
  type ExtensionProofReceipt,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { pgUuidv7SemanticProofInput } from "../fixtures/pg-uuidv7-semantic-proof";

const receiptPath = new URL(
  "../../../docs/architecture/evidence/typed-extension-proof/2026-10-02-pg-uuidv7-database.json",
  import.meta.url,
);

test("retained native UUIDv7 evidence preserves the full catalogue and pending semantic gates", async () => {
  const receipt: ExtensionProofReceipt = JSON.parse(await readFile(receiptPath, "utf8"));
  const input = pgUuidv7SemanticProofInput(receipt, receipt.sourcesBefore);
  const result = validateExtensionSemanticProof(input);
  assert.equal(result.complete, false);
  assert.deepEqual(result.counts, { accepted: 0, pending: 73, restricted: 0, excluded: 12 });
  assert.equal(result.families.length, 85);
  assert.deepEqual(result.families.find((family) => family.extension === "pg_uuidv7")!.blockers, [
    "consumer: missing required proof",
    "generation: missing required proof",
    "types: missing required proof",
    "unit: missing required proof",
  ]);
  assert.equal(receipt.cases.length, 4);
  assert.equal(receipt.cases.flatMap((definition) => definition.witnesses).length, 11);

  // Mutations below are fault injection into retained evidence, never execution receipts.
  // Required sources must not be inferred solely from a receipt that can omit them.
  const omitted = structuredClone(receipt);
  const adapter = "apps/loom/src/core/extensions/adapters/pg-uuidv7.ts";
  omitted.sourcesBefore = omitted.sourcesBefore.filter((source) => source.file !== adapter);
  omitted.sourcesAfter = omitted.sourcesAfter.filter((source) => source.file !== adapter);
  const omittedResult = validateExtensionSemanticProof(pgUuidv7SemanticProofInput(omitted, receipt.sourcesBefore));
  assert(omittedResult.blockers.some((blocker) => blocker.includes("database: missing or stale relevant source")));

  const omittedKernel = structuredClone(receipt);
  const kernel = "apps/loom/src/core/extensions/native-timestamp-codecs.ts";
  omittedKernel.sourcesBefore = omittedKernel.sourcesBefore.filter((source) => source.file !== kernel);
  omittedKernel.sourcesAfter = omittedKernel.sourcesAfter.filter((source) => source.file !== kernel);
  const staleKernel = receipt.sourcesBefore.map((source) =>
    source.file === kernel ? { ...source, sha256: "0".repeat(64) } : source,
  );
  assert(
    validateExtensionSemanticProof(pgUuidv7SemanticProofInput(omittedKernel, staleKernel)).blockers.some((blocker) =>
      blocker.includes("database: missing or stale relevant source"),
    ),
  );

  const stale = receipt.sourcesBefore.map((source) =>
    source.file === adapter ? { ...source, sha256: "0".repeat(64) } : source,
  );
  assert(
    validateExtensionSemanticProof(pgUuidv7SemanticProofInput(receipt, stale)).blockers.some((blocker) =>
      blocker.includes("database: missing or stale relevant source"),
    ),
  );

  const unwitnessed = structuredClone(receipt);
  unwitnessed.cases[0]!.witnesses = [];
  assert(
    validateExtensionSemanticProof(pgUuidv7SemanticProofInput(unwitnessed, receipt.sourcesBefore)).blockers.some(
      (blocker) => blocker.includes("member missing direct witness"),
    ),
  );
  assert.throws(() => validateExtensionSemanticProof({ ...input, baseline: input.baseline.slice(1) }), /baseline/i);
});
