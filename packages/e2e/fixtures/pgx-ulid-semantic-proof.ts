import * as v from "valibot";
import sourceRegistry from "./pgx-ulid-proof-sources.json";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/pgx_ulid.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { pgxUlidAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pgx-ulid";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  pgxUlidProofCases,
  pgxUlidAllGateProofCases,
  pgxUlidProofFamily,
  pgxUlidProofSchema,
} from "./pgx-ulid-proof-cases";

// Source-only bun metafile graphs; the host adds built kello dist entries, reconciles each actual import graph and binds bytes.
const rosters = v.parse(
  v.strictObject({
    format: v.literal(1),
    entry: v.literal("packages/e2e/integration/extensions-pgx-ulid.test.ts"),
    sources: v.pipe(v.array(v.string()), v.minLength(1)),
    generationSources: v.pipe(v.array(v.string()), v.minLength(1)),
    consumerSources: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  sourceRegistry,
);
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/src/core/extensions/adapters/pgx-ulid.ts",
  "apps/loom/src/core/extensions/adapters/pgx-ulid-codecs.ts",
  "apps/loom/src/tooling/extensions/annotations/pgx-ulid.ts",
  "apps/loom/src/tooling/extensions/manifests/pgx_ulid.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/pgx-ulid-proof-cases.ts",
  "packages/e2e/fixtures/pgx-ulid-proof-sources.json",
  "packages/e2e/fixtures/pgx-ulid-semantic-proof.ts",
  "packages/e2e/fixtures/proof-artifact.ts",
  "packages/e2e/scripts/report-extension-semantic-proof.ts",
  "bun.lock",
];
export const pgxUlidGateProofSources = {
  database: [...common, ...rosters.sources],
  unit: [...common, "packages/tests/unit/extensions-pgx-ulid.test.ts", "apps/loom/src/tooling/codegen/extensions.ts"],
  types: [
    ...common,
    "packages/tests/types/extensions-pgx-ulid.test-d.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  generation: [
    ...common,
    ...rosters.generationSources,
    "packages/e2e/fixtures/pgx-ulid-generated-project.ts",
    "packages/e2e/fixtures/pgx-ulid-generated-runtime.ts",
    "packages/e2e/fixtures/pgx-ulid-runtime-prepare.mjs.fixture",
    "packages/e2e/fixtures/pgx-ulid-generated-rpc.mjs.fixture",
  ],
  consumer: [
    ...common,
    ...rosters.consumerSources,
    "packages/e2e/fixtures/pgx-ulid-generated-project.ts",
    "packages/e2e/fixtures/pgx-ulid-generated-runtime.ts",
    "packages/e2e/fixtures/pgx-ulid-runtime-prepare.mjs.fixture",
    "packages/e2e/fixtures/pgx-ulid-generated-rpc.mjs.fixture",
  ],
};
export const pgxUlidSemanticProofSources = [...new Set(Object.values(pgxUlidGateProofSources).flat())];
extensionProofSourcesDigest(pgxUlidSemanticProofSources.map((file) => ({ file, sha256: "0".repeat(64) })));

type Relation = Extract<
  ExtensionProofDeclaration,
  { state: "candidate" }
>["members"][number]["transfers"][number]["relation"];
const ulidType = { namespace: "$extension:pgx_ulid", name: "ulid" };
const pair = "$extension:pgx_ulid.ulid,$extension:pgx_ulid.ulid";
const attachment = (method: "btree" | "hash", kind: "function" | "operator", number: number, routine: string) => ({
  id: `${kind} of access method:${kind} ${number} ("$extension:pgx_ulid".ulid, "$extension:pgx_ulid".ulid) of "$extension:pgx_ulid".ulid_${method}_ops USING ${method}`,
  from: `opclass:$extension:pgx_ulid.ulid_${method}_ops/${method}`,
  relation: {
    kind: "attachment",
    family: `opfamily:$extension:pgx_ulid.ulid_${method}_ops/${method}`,
    row:
      kind === "function"
        ? { kind: "procedure", left: ulidType, right: ulidType, number, procedure: routine }
        : {
            kind: "operator",
            left: ulidType,
            right: ulidType,
            strategy: number,
            purpose: "s",
            operator: routine,
            sortFamily: null,
          },
  } satisfies Relation,
});
// Exact rows from the pinned manifest; the verifier re-matches each against the captured family.
export const pgxUlidInternalRelations = [
  attachment("btree", "function", 1, `$extension:pgx_ulid.ulid_cmp(${pair})`),
  attachment("btree", "operator", 1, `$extension:pgx_ulid.<(${pair})`),
  attachment("btree", "operator", 2, `$extension:pgx_ulid.<=(${pair})`),
  attachment("btree", "operator", 3, `$extension:pgx_ulid.=(${pair})`),
  attachment("btree", "operator", 4, `$extension:pgx_ulid.>=(${pair})`),
  attachment("btree", "operator", 5, `$extension:pgx_ulid.>(${pair})`),
  attachment("hash", "function", 1, "$extension:pgx_ulid.ulid_hash($extension:pgx_ulid.ulid)"),
  attachment("hash", "operator", 1, `$extension:pgx_ulid.=(${pair})`),
  ...(["btree", "hash"] as const).map((method) => ({
    id: `opfamily:$extension:pgx_ulid.ulid_${method}_ops/${method}`,
    from: `opclass:$extension:pgx_ulid.ulid_${method}_ops/${method}`,
    relation: { kind: "opclass-family" } satisfies Relation,
  })),
  ...(["input", "output"] as const).map((slot) => ({
    id:
      slot === "input"
        ? "routine:$extension:pgx_ulid.ulid_in(pg_catalog.cstring)"
        : "routine:$extension:pgx_ulid.ulid_out($extension:pgx_ulid.ulid)",
    from: "type:$extension:pgx_ulid.ulid",
    relation: { kind: "type-routine", slot } satisfies Relation,
  })),
];
const transferBasis = {
  "opclass-family":
    "Exact captured opclass family; the parent class witness builds and scans a native index through this family.",
  attachment:
    "Exact captured family row; the parent class witness scans a native index whose ordering or equality results match an independent oracle, executing this row.",
  "type-routine":
    "Exact captured type IO slot; every text parameter and native ULID result in the parent type witness executes this callback.",
} satisfies Partial<Record<Relation["kind"], string>>;

function directCases(id: string) {
  return pgxUlidProofCases.flatMap((definition) =>
    definition.claims
      .filter((claim) => claim.member === id)
      .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
  );
}

/** Public members and ulid_recv need a direct native witness; other internal rows transfer from their exact parent. */
export const pgxUlidMemberProofs = pgxUlidAnnotations.map((annotation) => {
  const cases = directCases(annotation.id);
  const edge = pgxUlidInternalRelations.find((entry) => entry.id === annotation.id);
  const parent = edge ? directCases(edge.from) : [];
  if (edge ? annotation.disposition !== "internal" || cases.length || parent.length !== 1 : cases.length !== 1)
    throw new Error(`Missing exact pgx_ulid member proof: ${annotation.id}`);
  return {
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence, "packages/e2e/integration/extensions-pgx-ulid.test.ts"],
    cases,
    transfers: edge
      ? parent.map((proof) => ({
          from: edge.from,
          relation: edge.relation,
          ...proof,
          basis: transferBasis[edge.relation.kind],
        }))
      : [],
  };
});

/** Registration declares requirements; only current host receipts and direct witnesses can satisfy them. */
export function registerPgxUlidSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate pgx_ulid ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...pgxUlidGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? pgxUlidAllGateProofCases
            .filter((definition) => definition.gate === gate)
            .map((definition) => ({
              caseId: definition.id,
              runId: receipt.runId,
              receiptDigest: extensionProofReceiptDigest(receipt),
            }))
        : [],
    };
  }
  const candidate: ExtensionProofDeclaration = {
    extension: "pgx_ulid",
    state: "candidate",
    family: pgxUlidProofFamily,
    schema: pgxUlidProofSchema,
    members: pgxUlidMemberProofs,
    gates: {
      database: requirement("database"),
      unit: requirement("unit"),
      types: requirement("types"),
      generation: requirement("generation"),
      consumer: requirement("consumer"),
    },
    catalogueVersionReconciliation: null,
  };
  if (!input.declarations.some((entry) => entry.extension === "pgx_ulid" && entry.state === "pending"))
    throw new Error("pgx_ulid registration requires its existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "pgx_ulid" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...pgxUlidAllGateProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
