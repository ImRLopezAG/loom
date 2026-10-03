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

const root = await realpath(fileURLToPath(new URL("../../../", import.meta.url)));
const evidence = resolve(root, "docs/architecture/evidence/typed-extension-proof");
const receipt: ExtensionProofReceipt = JSON.parse(
  await readFile(resolve(evidence, "2026-10-02-pg-uuidv7-database.json"), "utf8"),
);
// Validate normalized source identities before reading them; symlinks must also stay inside this checkout.
extensionProofSourcesDigest(receipt.sourcesBefore);
extensionProofReceiptDigest(receipt);
const currentSources = await Promise.all(
  [...new Set([...pgUuidv7DatabaseProofSources, ...receipt.sourcesBefore.map(({ file }) => file)])].map(
    async (file) => {
      const path = await realpath(resolve(root, file));
      assert(path.startsWith(root + sep), "Proof source escapes repository checkout");
      return {
        file,
        sha256: createHash("sha256")
          .update(await readFile(path))
          .digest("hex"),
      };
    },
  ),
);
const result = validateExtensionSemanticProof(pgUuidv7SemanticProofInput(receipt, currentSources));
const output =
  JSON.stringify(
    {
      format: 1,
      catalogue: "docs/architecture/evidence/neon-extension-capability-map-2026-10-02.json",
      historicalCapture: "docs/architecture/evidence/neon-extension-sql-capture-2026-10-02.json",
      scope: "Executed UUIDv7 database proof; all remaining semantic gates and families retain pending dispositions.",
      databaseReceiptDigest: extensionProofReceiptDigest(receipt),
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
