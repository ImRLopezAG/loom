import * as v from "valibot";
import sourceRegistry from "./prefix-proof-sources.json";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/prefix.json";
import { extensionManifestValidator, type ExtensionMember } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { prefixAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/prefix";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { prefixDatabaseProofCases, prefixProofCases, prefixProofFamily, prefixProofSchema } from "./prefix-proof-cases";

// The host reconciles these reviewed paths with each actual import graph and binds bytes before and after execution.
const rosters = v.parse(
  v.strictObject({
    format: v.literal(1),
    entry: v.literal("packages/e2e/integration/extensions-prefix.test.ts"),
    sources: v.pipe(v.array(v.string()), v.minLength(1)),
    generationSources: v.pipe(v.array(v.string()), v.minLength(1)),
    consumerSources: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  sourceRegistry,
);
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const members = new Map(manifest.contract.members.map((member) => [member.id, member]));
const typeSlots = ["input", "output", "receive", "send"] as const;
type Relation = Extract<
  ExtensionProofDeclaration,
  { state: "candidate" }
>["members"][number]["transfers"][number]["relation"];

const common = [
  "apps/loom/package.json",
  "apps/loom/src/core/extensions/adapters/prefix.ts",
  "apps/loom/src/core/extensions/adapters/prefix-codecs.ts",
  "apps/loom/src/tooling/extensions/annotations/prefix.ts",
  "apps/loom/src/tooling/extensions/manifests/prefix.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/prefix-api.ts",
  "packages/e2e/fixtures/prefix-consumer-proof-cases.ts",
  "packages/e2e/fixtures/prefix-proof-cases.ts",
  "packages/e2e/fixtures/prefix-proof-sources.json",
  "packages/e2e/fixtures/prefix-semantic-proof.ts",
  "packages/e2e/fixtures/proof-artifact.ts",
  "packages/e2e/scripts/report-extension-semantic-proof.ts",
  "bun.lock",
];
export const prefixGateProofSources = {
  database: [...common, ...rosters.sources],
  unit: [...common, "packages/tests/unit/extensions-prefix.test.ts", "apps/loom/src/tooling/codegen/extensions.ts"],
  types: [...common, "packages/tests/types/extensions-prefix.test-d.ts", "apps/loom/src/tooling/codegen/extensions.ts"],
  generation: [...common, ...rosters.generationSources],
  consumer: [...common, ...rosters.consumerSources],
};
export const prefixSemanticProofSources = [...new Set(Object.values(prefixGateProofSources).flat())];
extensionProofSourcesDigest(prefixSemanticProofSources.map((file) => ({ file, sha256: "0".repeat(64) })));

function parentMemberId(parent: string) {
  const access = /^"\$extension:prefix"\.([A-Za-z0-9_]+) USING ([a-z]+)$/.exec(parent);
  if (access) return `opclass:$extension:prefix.${access[1]}/${access[2]}`;
  return parent;
}

function familyOf(parent: ExtensionMember) {
  if (parent.kind === "opfamily") return parent;
  if (parent.kind === "opclass") {
    const family = members.get(`opfamily:${parent.family}`);
    if (family?.kind === "opfamily") return family;
  }
  return undefined;
}

function transferRelation(childId: string, parentId: string): Relation | undefined {
  const child = members.get(childId);
  const parent = members.get(parentId);
  if (!child || !parent) throw new Error(`Missing captured prefix members: ${childId} -> ${parentId}`);
  if (parent.kind === "type" && child.kind === "routine") {
    for (const slot of typeSlots) {
      if (parent[slot] && child.id === `routine:${parent[slot]}`) return { kind: "type-routine", slot };
    }
  }
  if (child.kind === "opfamily" && parent.kind === "opclass") return { kind: "opclass-family" };
  const family = familyOf(parent);
  if (family) {
    if (child.kind === "routine") {
      const row = family.procedures.find((entry) => child.id === `routine:${entry.procedure}`);
      if (row)
        return {
          kind: "family-procedure",
          family: family.id,
          left: row.left,
          right: row.right,
          number: row.number,
          procedure: row.procedure,
        };
      // Extra GiST C helpers that are not the registered family procedure row.
      if (child.name.startsWith("gpr_")) return undefined;
    }
    if (child.kind === "other" && child.objectType === "function of access method") {
      const match = /^function (\d+) /.exec(child.identity);
      const row = match && family.procedures.find((entry) => entry.number === Number(match[1]));
      if (row)
        return {
          kind: "attachment",
          family: family.id,
          row: { kind: "procedure", left: row.left, right: row.right, number: row.number, procedure: row.procedure },
        };
    }
    if (child.kind === "other" && child.objectType === "operator of access method") {
      const match = /^operator (\d+) /.exec(child.identity);
      const row = match && family.operators.find((entry) => entry.strategy === Number(match[1]));
      if (row)
        return {
          kind: "attachment",
          family: family.id,
          row: {
            kind: "operator",
            left: row.left,
            right: row.right,
            strategy: row.strategy,
            purpose: row.purpose,
            operator: row.operator,
            sortFamily: row.sortFamily,
          },
        };
    }
  }
  throw new Error(`Unmapped captured prefix transfer: ${childId} -> ${parentId}`);
}

function directCases(id: string) {
  return prefixDatabaseProofCases.flatMap((definition) =>
    definition.claims
      .filter((claim) => claim.member === id)
      .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
  );
}

/** Public members need a direct native witness; internal catalog rows transfer from their exact parent witness. */
export const prefixMemberProofs = prefixAnnotations.map((annotation) => {
  const cases = directCases(annotation.id);
  const parent =
    annotation.disposition === "internal"
      ? parentMemberId(v.parse(v.string(), annotation.semantics.parent))
      : undefined;
  const relation = parent ? transferRelation(annotation.id, parent) : undefined;
  const parentCases = parent && relation ? directCases(parent) : [];
  if (
    annotation.disposition === "internal"
      ? !parent || (relation ? parentCases.length !== 1 : cases.length !== 1)
      : cases.length !== 1
  )
    throw new Error(`Missing exact prefix member proof: ${annotation.id}`);
  return {
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases,
    transfers:
      parent && relation
        ? parentCases.map((proof) => ({
            from: parent,
            relation,
            ...proof,
            basis:
              "Exact captured prefix catalog edge; the parent type or operator-class witness installs, stores, and scans native prefix_range values, executing this support row.",
          }))
        : [],
  };
});

/** Registration declares requirements; only current host receipts and direct witnesses can satisfy them. */
export function registerPrefixSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate prefix ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...prefixGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? prefixProofCases
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
    extension: "prefix",
    state: "candidate",
    family: prefixProofFamily,
    schema: prefixProofSchema,
    members: prefixMemberProofs,
    gates: {
      database: requirement("database"),
      unit: requirement("unit"),
      types: requirement("types"),
      generation: requirement("generation"),
      consumer: requirement("consumer"),
    },
    catalogueVersionReconciliation: null,
  };
  if (!input.declarations.some((entry) => entry.extension === "prefix" && entry.state === "pending"))
    throw new Error("prefix registration requires its existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "prefix" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...prefixProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
