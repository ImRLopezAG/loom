import {
  registerFuzzystrmatchSemanticProof,
  fuzzystrmatchSemanticProofSources,
} from "../fixtures/fuzzystrmatch-semantic-proof";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { access, readFile, realpath, writeFile } from "node:fs/promises";
import { resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  validateExtensionSemanticProof,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  pgUuidv7DatabaseProofSources,
  pgUuidv7SemanticProofInput,
  pgUuidv7SemanticProofSources,
  registerPgUuidv7SemanticProof,
} from "../fixtures/pg-uuidv7-semantic-proof";
import { loadRetainedArtifact } from "../fixtures/proof-artifact";
import { loadWave20SemanticProofInput } from "./report-wave20-proof";
import { loadWave10SemanticProofInput } from "./report-wave10-callback-proof";
import { loadRdkitSemanticProofInput } from "./report-rdkit-proof";
import { loadBloomSemanticProofInput } from "./report-bloom-proof";
import { loadWave40SemanticProofInput } from "./report-wave40-proof";
import { loadWave50SemanticProofInput } from "./report-wave50-proof";
import { loadWave60SemanticProofInput } from "./report-wave60-proof";
import { loadWave30SemanticProofInput } from "./report-wave30-proof";
import { registerUnaccentSemanticProof, unaccentSemanticProofSources } from "../fixtures/unaccent-semantic-proof";
import { registerUuidOsspSemanticProof, uuidOsspSemanticProofSources } from "../fixtures/uuid-ossp-semantic-proof";

import {
  registerPgJsonschemaSemanticProof,
  pgJsonschemaSemanticProofSources,
} from "../fixtures/pg-jsonschema-semantic-proof";
import {
  registerLakebaseTokenizerSemanticProof,
  lakebaseTokenizerSemanticProofSources,
} from "../fixtures/lakebase-tokenizer-semantic-proof";

const root = await realpath(fileURLToPath(new URL("../../../", import.meta.url)));
const evidence = resolve(root, "docs/architecture/evidence/typed-extension-proof");
async function hasFiveGates(prefix: string) {
  const present = await Promise.all(
    (["database", "unit", "types", "generation", "consumer"] as const).map(async (gate) => {
      try {
        await access(resolve(evidence, `${prefix}-${gate}.json`));
        return true;
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
        throw error;
      }
    }),
  );
  return present.every(Boolean);
}
const batches = (
  await Promise.all([
    Promise.all(
      ["unit", "types"].map(async (gate) => {
        try {
          await access(resolve(evidence, `2026-10-04-wave60-${gate}.json`));
          return true;
        } catch (error) {
          if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
          throw error;
        }
      }),
    ).then((present) => (present.every(Boolean) ? loadWave60SemanticProofInput(evidence) : null)),
    Promise.all(
      ["unit", "types"].map(async (gate) => {
        try {
          await access(resolve(evidence, `2026-10-04-wave50-${gate}.json`));
          return true;
        } catch (error) {
          if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
          throw error;
        }
      }),
    ).then((present) => (present.every(Boolean) ? loadWave50SemanticProofInput(evidence) : null)),
    Promise.all(
      ["unit", "types"].map(async (gate) => {
        try {
          await access(resolve(evidence, `2026-10-04-wave40-${gate}.json`));
          return true;
        } catch (error) {
          if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
          throw error;
        }
      }),
    ).then((present) => (present.every(Boolean) ? loadWave40SemanticProofInput(evidence) : null)),
    hasFiveGates("2026-10-04-wave20").then((present) => (present ? loadWave20SemanticProofInput(evidence) : null)),
    hasFiveGates("2026-10-04-wave10-callback").then((present) =>
      present ? loadWave10SemanticProofInput(evidence) : null,
    ),
    hasFiveGates("2026-10-04-rdkit").then((present) => (present ? loadRdkitSemanticProofInput(evidence) : null)),
    hasFiveGates("2026-10-04-bloom").then((present) => (present ? loadBloomSemanticProofInput(evidence) : null)),
    Promise.all(
      ["unit", "types"].map(async (gate) => {
        try {
          await access(resolve(evidence, `2026-10-04-wave30-${gate}.json`));
          return true;
        } catch (error) {
          if (error instanceof Error && "code" in error && error.code === "ENOENT") return false;
          throw error;
        }
      }),
    ).then((present) => (present.every(Boolean) ? loadWave30SemanticProofInput(evidence) : null)),
  ])
).filter((batch) => batch !== null);
async function retainedScalarEvidence(name: string) {
  const current = resolve(evidence, `2026-10-04-${name}`);
  try {
    await access(current);
    return current;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      return resolve(evidence, `2026-10-03-${name}`);
    throw error;
  }
}
const receipt: ExtensionProofReceipt = JSON.parse(
  await readFile(resolve(evidence, "2026-10-02-pg-uuidv7-database.json"), "utf8"),
);
// Only genuine retained host receipts are read. Absent files leave the required gate unfulfilled.
const unaccentReceipts: ExtensionProofReceipt[] = [];
for (const gate of ["unit", "types", "database", "generation", "consumer"] as const) {
  let bytes: string;
  try {
    bytes = await readFile(await retainedScalarEvidence(`unaccent-${gate}.json`), "utf8");
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
    ? await loadRetainedArtifact(await retainedScalarEvidence("unaccent-consumer-kello.tgz"), consumerReceipt)
    : null;
const uuidOsspReceipts: ExtensionProofReceipt[] = [];
for (const gate of ["unit", "types", "database", "generation", "consumer"] as const) {
  let bytes: string;
  try {
    bytes = await readFile(await retainedScalarEvidence(`uuid-ossp-${gate}.json`), "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") continue;
    throw error;
  }
  const observed: ExtensionProofReceipt = JSON.parse(bytes);
  extensionProofReceiptDigest(observed);
  assert.equal(observed.gate, gate, "Retained UUID-OSSP receipt has the wrong gate");
  uuidOsspReceipts.push(observed);
}
const uuidOsspConsumer = uuidOsspReceipts.find((observed) => observed.gate === "consumer");
const uuidOsspArtifact =
  uuidOsspConsumer?.gate === "consumer"
    ? await loadRetainedArtifact(await retainedScalarEvidence("uuid-ossp-consumer-kello.tgz"), uuidOsspConsumer)
    : null;
const pgUuidv7Receipts: ExtensionProofReceipt[] = [];
for (const gate of ["unit", "types", "database", "generation", "consumer"] as const) {
  let bytes: string;
  try {
    bytes = await readFile(await retainedScalarEvidence(`pg-uuidv7-${gate}.json`), "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") continue;
    throw error;
  }
  const observed: ExtensionProofReceipt = JSON.parse(bytes);
  extensionProofReceiptDigest(observed);
  assert.equal(observed.gate, gate, "Retained UUIDv7 receipt has the wrong gate");
  pgUuidv7Receipts.push(observed);
}
const pgUuidv7Consumer = pgUuidv7Receipts.find((observed) => observed.gate === "consumer");
const pgUuidv7Artifact =
  pgUuidv7Consumer?.gate === "consumer"
    ? await loadRetainedArtifact(await retainedScalarEvidence("pg-uuidv7-consumer-kello.tgz"), pgUuidv7Consumer)
    : null;
const pgJsonschemaReceipts: ExtensionProofReceipt[] = [];
for (const gate of ["unit", "types", "database", "generation", "consumer"] as const) {
  let bytes: string;
  try {
    bytes = await readFile(await retainedScalarEvidence(`pg-jsonschema-${gate}.json`), "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") continue;
    throw error;
  }
  const observed: ExtensionProofReceipt = JSON.parse(bytes);
  extensionProofReceiptDigest(observed);
  assert.equal(observed.gate, gate, "Retained pg_jsonschema receipt has the wrong gate");
  pgJsonschemaReceipts.push(observed);
}
const pgJsonschemaConsumer = pgJsonschemaReceipts.find((observed) => observed.gate === "consumer");
const pgJsonschemaArtifact =
  pgJsonschemaConsumer?.gate === "consumer"
    ? await loadRetainedArtifact(await retainedScalarEvidence("pg-jsonschema-consumer-kello.tgz"), pgJsonschemaConsumer)
    : null;
const fuzzystrmatchReceipts: ExtensionProofReceipt[] = [];
for (const gate of ["unit", "types", "database", "generation", "consumer"] as const) {
  let bytes: string;
  try {
    bytes = await readFile(await retainedScalarEvidence(`fuzzystrmatch-${gate}.json`), "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") continue;
    throw error;
  }
  const observed: ExtensionProofReceipt = JSON.parse(bytes);
  extensionProofReceiptDigest(observed);
  assert.equal(observed.gate, gate, "Retained fuzzystrmatch receipt has the wrong gate");
  fuzzystrmatchReceipts.push(observed);
}
const fuzzystrmatchConsumer = fuzzystrmatchReceipts.find((observed) => observed.gate === "consumer");
const fuzzystrmatchArtifact =
  fuzzystrmatchConsumer?.gate === "consumer"
    ? await loadRetainedArtifact(
        await retainedScalarEvidence("fuzzystrmatch-consumer-kello.tgz"),
        fuzzystrmatchConsumer,
      )
    : null;
const lakebaseTokenizerReceipts: ExtensionProofReceipt[] = [];
for (const gate of ["unit", "types", "database", "generation", "consumer"] as const) {
  let bytes: string;
  try {
    bytes = await readFile(resolve(evidence, `2026-10-04-lakebase-tokenizer-${gate}.json`), "utf8");
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") continue;
    throw error;
  }
  const observed: ExtensionProofReceipt = JSON.parse(bytes);
  extensionProofReceiptDigest(observed);
  assert.equal(observed.gate, gate, "Retained Tokenizer receipt has the wrong gate");
  lakebaseTokenizerReceipts.push(observed);
}
const lakebaseTokenizerConsumer = lakebaseTokenizerReceipts.find((observed) => observed.gate === "consumer");
const lakebaseTokenizerArtifact =
  lakebaseTokenizerConsumer?.gate === "consumer"
    ? await loadRetainedArtifact(
        resolve(evidence, "2026-10-04-lakebase-tokenizer-consumer-kello.tgz"),
        lakebaseTokenizerConsumer,
      )
    : null;
// Validate normalized source identities before reading them; symlinks must also stay inside this checkout.
for (const observed of [
  receipt,
  ...unaccentReceipts,
  ...uuidOsspReceipts,
  ...pgUuidv7Receipts,
  ...pgJsonschemaReceipts,
  ...fuzzystrmatchReceipts,
  ...lakebaseTokenizerReceipts,
]) {
  extensionProofSourcesDigest(observed.sourcesBefore);
  extensionProofReceiptDigest(observed);
}
const currentSourceGroups = await Promise.all(
  [
    ...new Set([
      ...pgUuidv7DatabaseProofSources,
      ...unaccentSemanticProofSources,
      ...uuidOsspSemanticProofSources,
      ...pgUuidv7SemanticProofSources,
      ...pgJsonschemaSemanticProofSources,
      ...fuzzystrmatchSemanticProofSources,
      ...lakebaseTokenizerSemanticProofSources,
      ...batches.flatMap((batch) => batch.currentSources.map(({ file }) => file)),
      ...[
        receipt,
        ...unaccentReceipts,
        ...uuidOsspReceipts,
        ...pgUuidv7Receipts,
        ...pgJsonschemaReceipts,
        ...fuzzystrmatchReceipts,
        ...lakebaseTokenizerReceipts,
      ].flatMap((observed) => observed.sourcesBefore.map(({ file }) => file)),
    ]),
  ].map(async (file) => {
    try {
      const path = await realpath(resolve(root, file));
      assert(path.startsWith(root + sep), "Proof source escapes repository checkout");
      return [
        {
          file,
          sha256: createHash("sha256")
            .update(await readFile(path))
            .digest("hex"),
        },
      ];
    } catch (error) {
      // A removed build chunk makes its old receipt stale; it must not abort reconciliation or acquire a fake hash.
      if (error instanceof Error && "code" in error && error.code === "ENOENT") return [];
      throw error;
    }
  }),
);
const currentSources = currentSourceGroups.flat();
const registered = registerUnaccentSemanticProof(pgUuidv7SemanticProofInput(receipt, currentSources), unaccentReceipts);
const scalarRegistration = {
  ...registerLakebaseTokenizerSemanticProof(
    registerFuzzystrmatchSemanticProof(
      registerPgJsonschemaSemanticProof(
        registerPgUuidv7SemanticProof(registerUuidOsspSemanticProof(registered, uuidOsspReceipts), pgUuidv7Receipts),
        pgJsonschemaReceipts,
      ),
      fuzzystrmatchReceipts,
    ),
    lakebaseTokenizerReceipts,
  ),
  artifact: unaccentArtifact ?? registered.artifact,
  artifacts: [
    uuidOsspArtifact,
    pgUuidv7Artifact,
    pgJsonschemaArtifact,
    fuzzystrmatchArtifact,
    lakebaseTokenizerArtifact,
  ].filter((artifact) => artifact !== null),
};
const batchCandidates = new Map<string, ExtensionProofDeclaration>();
for (const batch of batches) {
  assert.deepEqual(batch.baseline, scalarRegistration.baseline);
  for (const declaration of batch.declarations) {
    if (declaration.state !== "candidate") continue;
    assert(!batchCandidates.has(declaration.extension), "Family registered by two proof batches");
    batchCandidates.set(declaration.extension, declaration);
  }
}
for (const declaration of scalarRegistration.declarations)
  assert(
    !batchCandidates.has(declaration.extension) || declaration.state === "pending",
    "Family registered by two proof batches",
  );
const result = validateExtensionSemanticProof({
  ...scalarRegistration,
  declarations: scalarRegistration.declarations.map(
    (declaration) => batchCandidates.get(declaration.extension) ?? declaration,
  ),
  manifests: [...scalarRegistration.manifests, ...batches.flatMap((batch) => batch.manifests)],
  cases: [...scalarRegistration.cases, ...batches.flatMap((batch) => batch.cases)],
  receipts: [...scalarRegistration.receipts, ...batches.flatMap((batch) => batch.receipts)],
  artifacts: [
    ...scalarRegistration.artifacts,
    ...batches.flatMap((batch) => [...(batch.artifact ? [batch.artifact] : []), ...(batch.artifacts ?? [])]),
  ],
});
const output =
  JSON.stringify(
    {
      format: 1,
      catalogue: "apps/loom/src/tooling/extensions/catalogue.json",
      historicalCapture: "docs/architecture/evidence/neon-extension-sql-capture-2026-10-02.json",
      scope:
        "Scalar, tokenizer, wave10, wave20, wave30, wave40, wave50, wave60, RDKit and Bloom source-bound gate registration; absent or stale host receipts retain pending dispositions. Packed artifact corroboration remains required.",
      databaseReceiptDigest: extensionProofReceiptDigest(receipt),
      unaccentReceiptDigests: unaccentReceipts.map((observed) => ({
        gate: observed.gate,
        digest: extensionProofReceiptDigest(observed),
      })),
      uuidOsspReceiptDigests: uuidOsspReceipts.map((observed) => ({
        gate: observed.gate,
        digest: extensionProofReceiptDigest(observed),
      })),
      pgUuidv7ReceiptDigests: pgUuidv7Receipts.map((observed) => ({
        gate: observed.gate,
        digest: extensionProofReceiptDigest(observed),
      })),
      pgJsonschemaReceiptDigests: pgJsonschemaReceipts.map((observed) => ({
        gate: observed.gate,
        digest: extensionProofReceiptDigest(observed),
      })),
      fuzzystrmatchReceiptDigests: fuzzystrmatchReceipts.map((observed) => ({
        gate: observed.gate,
        digest: extensionProofReceiptDigest(observed),
      })),
      lakebaseTokenizerReceiptDigests: lakebaseTokenizerReceipts.map((observed) => ({
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
