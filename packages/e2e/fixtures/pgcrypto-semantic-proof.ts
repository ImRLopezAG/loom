import * as v from "valibot";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/pgcrypto.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { pgcryptoAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pgcrypto";
import {
  extensionProofReceiptDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  pgcryptoConsumerProofCase,
  pgcryptoGenerationProofCase,
  pgcryptoMemberProofs,
  pgcryptoNativeProofCases,
  pgcryptoPgpAdmissionUnitProofCase,
  pgcryptoProofFamily,
  pgcryptoTypesProofCases,
  pgcryptoUnitProofCases,
} from "./pgcrypto-proof-cases";

/** Every direct native case installs pgcrypto in this quoted schema inside its own disposable database. */
export const pgcryptoProofSchema = 'crypto"proof';
export const pgcryptoProofCases = [
  ...pgcryptoUnitProofCases,
  pgcryptoPgpAdmissionUnitProofCase,
  ...pgcryptoTypesProofCases,
  ...Object.values(pgcryptoNativeProofCases),
  pgcryptoGenerationProofCase,
  pgcryptoConsumerProofCase,
];

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/vite.config.ts",
  "bun.lock",
  "apps/loom/src/core/extensions/adapters/pgcrypto.ts",
  "apps/loom/src/core/extensions/pgcrypto-pgp-admission.ts",
  "apps/loom/src/core/extensions/native-codecs.ts",
  "apps/loom/src/core/extensions/codecs.ts",
  "apps/loom/src/core/extensions/sql.ts",
  "apps/loom/src/tooling/extensions/annotations/pgcrypto.ts",
  "apps/loom/src/tooling/extensions/manifests/pgcrypto.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/pgcrypto-proof-cases.ts",
  "packages/e2e/fixtures/pgcrypto-semantic-proof.ts",
  "packages/e2e/scripts/run-pgcrypto-unit-types-proof.ts",
  "packages/e2e/fixtures/proof-source-snapshot.ts",
  "packages/e2e/scripts/report-pgcrypto-proof.ts",
];
const generated = [
  "apps/loom/src/core/server/database/connection.ts",
  "apps/loom/src/tooling/codegen/extensions.ts",
  "packages/e2e/scripts/run-pgcrypto-composition-proof.ts",
  "packages/e2e/fixtures/pgcrypto-generated-project.ts",
  "packages/e2e/fixtures/pgcrypto-generated-runtime.ts",
  "packages/e2e/fixtures/pgcrypto-runtime-prepare.mjs.fixture",
  "packages/e2e/fixtures/pgcrypto-generated-rpc.mjs.fixture",
  "packages/e2e/fixtures/pgcrypto-pgp.ts",
  "packages/e2e/fixtures/extension-database.ts",
];
export const pgcryptoGateProofSources = {
  unit: [
    ...common,
    ...pgcryptoUnitProofCases.map(({ file }) => file),
    pgcryptoPgpAdmissionUnitProofCase.file,
    "packages/e2e/fixtures/extension-proof-unit.ts",
  ],
  types: [...common, ...pgcryptoTypesProofCases.map(({ file }) => file)],
  database: [
    ...common,
    "apps/loom/src/core/server/database/connection.ts",
    "packages/e2e/scripts/run-pgcrypto-database-proof.ts",
    ...Object.values(pgcryptoNativeProofCases).map(({ file }) => file),
    "packages/e2e/fixtures/pgcrypto-formatting.ts",
    "packages/e2e/fixtures/pgcrypto-pgp.ts",
    "packages/e2e/fixtures/extension-database.ts",
    "packages/e2e/fixtures/extension-proof.ts",
    "packages/e2e/fixtures/extension-proof-database.ts",
    "apps/loom/src/tooling/extensions/capture.ts",
  ],
  generation: [...common, ...generated, pgcryptoGenerationProofCase.file],
  consumer: [...common, ...generated, pgcryptoConsumerProofCase.file, "packages/e2e/fixtures/proof-artifact.ts"],
};
export const pgcryptoSemanticProofSources = [...new Set(Object.values(pgcryptoGateProofSources).flat())];

/** Family-local candidate registration. Definitions and local tests confer no canonical gate acceptance. */
export function registerPgcryptoSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw Error(`Duplicate pgcrypto ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...pgcryptoGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? pgcryptoProofCases
            .filter((proof) => proof.gate === gate)
            .map((proof) => ({
              caseId: proof.id,
              runId: receipt.runId,
              receiptDigest: extensionProofReceiptDigest(receipt),
            }))
        : [],
    };
  }
  const candidate: ExtensionProofDeclaration = {
    extension: "pgcrypto",
    state: "candidate",
    family: pgcryptoProofFamily,
    schema: pgcryptoProofSchema,
    members: pgcryptoAnnotations.map((annotation) => {
      const proof = pgcryptoMemberProofs.find((entry) => entry.id === annotation.id);
      if (!proof || proof.disposition !== annotation.disposition)
        throw Error(`pgcrypto annotation/proof mismatch: ${annotation.id}`);
      return {
        ...proof,
        reason: annotation.reason,
        citations: [...new Set([...annotation.evidence, ...proof.citations])],
      };
    }),
    gates: {
      unit: requirement("unit"),
      types: requirement("types"),
      database: requirement("database"),
      generation: requirement("generation"),
      consumer: requirement("consumer"),
    },
    catalogueVersionReconciliation: null,
  };
  if (pgcryptoMemberProofs.length !== candidate.members.length)
    throw Error("pgcrypto member proofs and annotations differ");
  if (!input.declarations.some((entry) => entry.extension === "pgcrypto" && entry.state === "pending"))
    throw Error("pgcrypto registration requires the existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "pgcrypto" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...pgcryptoProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
