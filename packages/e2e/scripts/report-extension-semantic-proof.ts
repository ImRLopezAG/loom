import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile, realpath, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  validateExtensionSemanticProof,
  type ExtensionProofReceipt,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { pgUuidv7DatabaseProofSources, pgUuidv7SemanticProofInput } from "../fixtures/pg-uuidv7-semantic-proof";
import { loadRetainedArtifact } from "../fixtures/proof-artifact";
import { registerUnaccentSemanticProof, unaccentSemanticProofSources } from "../fixtures/unaccent-semantic-proof";

const root = await realpath(fileURLToPath(new URL("../../../", import.meta.url)));
const evidence = resolve(root, "docs/architecture/evidence/typed-extension-proof");
const receipt: ExtensionProofReceipt = JSON.parse(
  await readFile(resolve(evidence, "2026-10-02-pg-uuidv7-database.json"), "utf8"),
);
// Only genuine retained host receipts are read. Absent files leave the required gate unfulfilled.
const unaccentReceipts: ExtensionProofReceipt[] = [];
for (const gate of ["unit", "types", "database", "generation", "consumer"] as const) {
  let bytes: string;
  try {
    bytes = await readFile(resolve(evidence, `2026-10-03-unaccent-${gate}.json`), "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") continue;
    throw error;
  }
  const observed: ExtensionProofReceipt = JSON.parse(bytes);
  extensionProofReceiptDigest(observed);
  assert.equal(observed.gate, gate, "Retained Unaccent receipt has the wrong gate");
  unaccentReceipts.push(observed);
}
// The packed consumer artifact is loaded from its retained actual bytes, never inferred from the receipt alone. An
// absent tarball leaves the artifact null, so the validator keeps the consumer gate blocked ("missing or stale packed
// artifact/build sources"); a present but mismatching tarball is corrupt evidence and throws.
const consumerReceipt = unaccentReceipts.find((observed) => observed.gate === "consumer");
const unaccentArtifact =
  consumerReceipt?.gate === "consumer"
    ? await loadRetainedArtifact(resolve(evidence, "2026-10-03-unaccent-consumer-loom.tgz"), consumerReceipt)
    : null;
// Validate normalized source identities before reading them; symlinks must also stay inside this checkout.
for (const observed of [receipt, ...unaccentReceipts]) {
  extensionProofSourcesDigest(observed.sourcesBefore);
  extensionProofReceiptDigest(observed);
}
const currentSources = await Promise.all(
  [
    ...new Set([
      ...pgUuidv7DatabaseProofSources,
      ...unaccentSemanticProofSources,
      ...[receipt, ...unaccentReceipts].flatMap((observed) => observed.sourcesBefore.map(({ file }) => file)),
    ]),
  ].map(async (file) => {
    const path = await realpath(resolve(root, file));
    assert(path.startsWith(root + sep), "Proof source escapes repository checkout");
    return {
      file,
      sha256: createHash("sha256")
        .update(await readFile(path))
        .digest("hex"),
    };
  }),
);
const registered = registerUnaccentSemanticProof(pgUuidv7SemanticProofInput(receipt, currentSources), unaccentReceipts);
const result = validateExtensionSemanticProof({ ...registered, artifact: unaccentArtifact ?? registered.artifact });
const output =
  JSON.stringify(
    {
      format: 1,
      catalogue: "docs/architecture/evidence/neon-extension-capability-map-2026-10-02.json",
      historicalCapture: "docs/architecture/evidence/neon-extension-sql-capture-2026-10-02.json",
      scope:
        "UUIDv7 and Unaccent source-bound gate registration; absent or stale host receipts retain pending dispositions. Packed artifact corroboration remains required.",
      databaseReceiptDigest: extensionProofReceiptDigest(receipt),
      unaccentReceiptDigests: unaccentReceipts.map((observed) => ({
        gate: observed.gate,
        digest: extensionProofReceiptDigest(observed),
      })),
      ...result,
    },
    null,
    2,
  ) + "\n";
const destination = resolve(evidence, "2026-10-02-semantic-progress.json");
if (process.argv.includes("--check")) {
  assert.deepEqual(
    JSON.parse(await readFile(destination, "utf8")),
    JSON.parse(output),
    "Semantic progress is stale; regenerate from current sources",
  );
  console.log("Semantic progress matches current source-bound evidence; catalogue acceptance remains incomplete.");
} else {
  await writeFile(destination, output);
  console.log("Wrote semantic progress from actual retained evidence; pending gates stay pending.");
}
