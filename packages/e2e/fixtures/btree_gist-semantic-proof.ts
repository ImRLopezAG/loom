import * as v from "valibot";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/btree_gist.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { btreeGistAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/btree_gist";
import {
  extensionProofReceiptDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import {
  btreeGistNativeProofCase,
  btreeGistProofCases,
  btreeGistProofFamily,
  btreeGistProofSchema,
} from "./btree_gist-proof-cases";

const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "bun.lock",
  "apps/loom/src/core/extensions/adapters/btree_gist.ts",
  "apps/loom/src/core/extensions/adapters/btree_gist-codecs.ts",
  "apps/loom/src/tooling/extensions/annotations/btree_gist.ts",
  "apps/loom/src/tooling/extensions/manifests/btree_gist.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/btree_gist-proof-cases.ts",
  "packages/e2e/fixtures/btree_gist-schema.ts",
  "packages/e2e/fixtures/btree_gist-generated-project.ts",
  "packages/e2e/fixtures/btree_gist-semantic-proof.ts",
];
export const btreeGistGateProofSources = {
  unit: [...common, "packages/tests/unit/extensions-btree_gist.test.ts"],
  types: [
    ...common,
    "packages/tests/types/extensions-btree_gist.test-d.ts",
    "packages/tests/types/btree_gist.tsconfig.json",
  ],
  database: [
    ...common,
    "packages/e2e/integration/extensions-btree_gist.test.ts",
    "packages/e2e/fixtures/extension-database.ts",
    "packages/e2e/fixtures/extension-proof.ts",
    "packages/e2e/fixtures/extension-proof-database.ts",
    "apps/loom/src/core/extensions/fields.ts",
    "apps/loom/src/tooling/migrations/adapter.ts",
  ],
  generation: [
    ...common,
    "packages/e2e/fixtures/btree-gist-generated-runtime.ts",
    "packages/e2e/fixtures/btree-gist-runtime-prepare.mjs.fixture",
    "packages/e2e/fixtures/btree-gist-generated-rpc.mjs.fixture",
    "packages/e2e/integration/extensions-btree_gist-generation.test.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
  consumer: [
    ...common,
    "packages/e2e/fixtures/btree-gist-generated-runtime.ts",
    "packages/e2e/fixtures/btree-gist-runtime-prepare.mjs.fixture",
    "packages/e2e/fixtures/btree-gist-generated-rpc.mjs.fixture",
    "packages/e2e/integration/packed-btree_gist.test.ts",
    "packages/e2e/fixtures/proof-artifact.ts",
    "apps/loom/src/tooling/codegen/extensions.ts",
  ],
};
export const btreeGistSemanticProofSources = [...new Set(Object.values(btreeGistGateProofSources).flat())];

type Candidate = Extract<ExtensionProofDeclaration, { state: "candidate" }>;
type Transfer = Candidate["members"][number]["transfers"][number];
type Edge = Pick<Transfer, "from" | "relation">;
const members = manifest.contract.members;
const opclasses = members.flatMap((member) => (member.kind === "opclass" ? [member] : []));
const families = members.flatMap((member) => (member.kind === "opfamily" ? [member] : []));
const classOf = (family: string) => opclasses.find((member) => `opfamily:${member.family}` === family)!.id;
const attachment = /^(function|operator) (\d+) \(.*\) of "\$extension:btree_gist"\.(\w+) USING gist$/;

/** Exact captured catalog edges: class families, family rows, storage types, array elements and type I/O slots. */
function capturedEdges(id: string): Edge[] {
  const member = members.find((entry) => entry.id === id)!;
  if (member.kind === "opfamily") return [{ from: classOf(member.id), relation: { kind: "opclass-family" } }];
  if (member.kind === "other") {
    const match = attachment.exec(member.identity);
    const family = match && families.find((entry) => entry.name === match[3]);
    if (!match || !family) return [];
    const number = Number(match[2]);
    const rows =
      match[1] === "function"
        ? family.procedures
            .filter((row) => row.number === number)
            .map((row) => ({ kind: "procedure" as const, ...row }))
        : family.operators
            .filter((row) => row.strategy === number)
            .map((row) => ({ kind: "operator" as const, ...row }));
    return rows.map((row) => ({ from: classOf(family.id), relation: { kind: "attachment", family: family.id, row } }));
  }
  if (member.kind === "type") {
    if (member.element) {
      const element = member.element;
      const parent = members.find(
        (entry) => entry.kind === "type" && entry.namespace === element.namespace && entry.name === element.name,
      );
      return parent ? [{ from: parent.id, relation: { kind: "array-element" } }] : [];
    }
    return opclasses
      .filter((entry) => entry.storage?.namespace === member.namespace && entry.storage?.name === member.name)
      .map((entry) => ({ from: entry.id, relation: { kind: "opclass-storage" } }));
  }
  if (member.kind === "routine") {
    const procedures = families.flatMap((family) =>
      family.procedures
        .filter((row) => `routine:${row.procedure}` === member.id)
        .map((row) => ({
          from: classOf(family.id),
          relation: { kind: "family-procedure" as const, family: family.id, ...row },
        })),
    );
    const slots = members.flatMap((type) =>
      type.kind === "type"
        ? (["input", "output"] as const)
            .filter((slot) => `routine:${type[slot]}` === member.id)
            .map((slot) => ({ from: type.id, relation: { kind: "type-routine" as const, slot } }))
        : [],
    );
    return [...procedures, ...slots];
  }
  return [];
}
function directCases(id: string) {
  return btreeGistNativeProofCase.claims
    .filter((claim) => claim.member === id)
    .map((claim) => ({ caseId: btreeGistNativeProofCase.id, scenario: claim.scenario }));
}
const basis = {
  class:
    "Exact captured class/family/support row. The native parent witness migrates and inspects the class, builds and mutates its index, verifies all six strategy scans (and <-> KNN order where captured) against a sequential oracle before and after schema relocation.",
  type: "Exact captured storage/element/I-O slot of a private GiST key type; the native class witness builds indexes that store this key, and direct text input to the key type is natively rejected.",
};
/** A transfer cites the witnessed native case: the parent's own case, or the case its private parent inherits. */
function witnessed(id: string, seen: readonly string[] = []): { caseId: string; scenario: string }[] {
  const direct = directCases(id);
  if (direct.length) return direct;
  if (seen.includes(id)) throw new Error(`Cyclic btree_gist proof edge: ${id}`);
  return capturedEdges(id)
    .flatMap((edge) => witnessed(edge.from, [...seen, id]))
    .slice(0, 1);
}
export const btreeGistMemberProofs = btreeGistAnnotations.map((annotation) => {
  const edges = annotation.disposition === "internal" ? capturedEdges(annotation.id) : [];
  const cases = directCases(annotation.id);
  if (annotation.disposition === "internal" ? !edges.length : cases.length !== 1)
    throw new Error(`Missing exact btree_gist member proof: ${annotation.id}`);
  return {
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases,
    transfers: edges.flatMap((edge) => {
      const parents = witnessed(edge.from);
      if (parents.length !== 1) throw new Error(`Missing native btree_gist parent witness: ${edge.from}`);
      return parents.map((proof) => ({
        ...edge,
        ...proof,
        basis: edge.from.startsWith("opclass:") ? basis.class : basis.type,
      }));
    }),
  };
});

/** Declares candidate coverage only. All five fresh acceptance receipts are owned by the parent host. */
export function registerBtreeGistSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate btree_gist ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...btreeGistGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? btreeGistProofCases
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
    extension: "btree_gist",
    state: "candidate",
    family: btreeGistProofFamily,
    schema: btreeGistProofSchema,
    members: btreeGistMemberProofs,
    gates: {
      unit: requirement("unit"),
      types: requirement("types"),
      database: requirement("database"),
      generation: requirement("generation"),
      consumer: requirement("consumer"),
    },
    catalogueVersionReconciliation: null,
  };
  if (!input.declarations.some((entry) => entry.extension === "btree_gist" && entry.state === "pending"))
    throw new Error("btree_gist registration requires its pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "btree_gist" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...btreeGistProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
