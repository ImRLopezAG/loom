import * as v from "valibot";
import sourceRegistry from "./semver-proof-sources.json";
import manifestSource from "../../../apps/loom/src/tooling/extensions/manifests/semver.json";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { semverAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/semver";
import {
  extensionProofReceiptDigest,
  extensionProofSourcesDigest,
  type ExtensionProofDeclaration,
  type ExtensionProofReceipt,
  type ExtensionSemanticProofInput,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { semverDatabaseProofCases, semverProofCases, semverProofFamily, semverProofSchema } from "./semver-proof-cases";

// The host reconciles these reviewed paths with each actual import graph and binds bytes before and after execution.
const rosters = v.parse(
  v.strictObject({
    format: v.literal(1),
    entry: v.literal("packages/e2e/integration/extensions-semver.test.ts"),
    sources: v.pipe(v.array(v.string()), v.minLength(1)),
    generationSources: v.pipe(v.array(v.string()), v.minLength(1)),
    consumerSources: v.pipe(v.array(v.string()), v.minLength(1)),
  }),
  sourceRegistry,
);
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, manifestSource));
const common = [
  "apps/loom/package.json",
  "apps/loom/src/core/extensions/adapters/semver.ts",
  "apps/loom/src/core/extensions/adapters/semver-codecs.ts",
  "apps/loom/src/tooling/extensions/annotations/semver.ts",
  "apps/loom/src/tooling/extensions/manifests/semver.json",
  "apps/loom/src/tooling/extensions/semantic-proof.ts",
  "packages/e2e/fixtures/semver-proof-cases.ts",
  "packages/e2e/fixtures/semver-proof-sources.json",
  "packages/e2e/fixtures/semver-semantic-proof.ts",
  "packages/e2e/fixtures/proof-artifact.ts",
  "packages/e2e/scripts/report-extension-semantic-proof.ts",
  "bun.lock",
];
export const semverGateProofSources = {
  database: [...common, ...rosters.sources],
  unit: [...common, "packages/tests/unit/extensions-semver.test.ts", "apps/loom/src/tooling/codegen/extensions.ts"],
  types: [...common, "packages/tests/types/extensions-semver.test-d.ts", "apps/loom/src/tooling/codegen/extensions.ts"],
  generation: [...common, ...rosters.generationSources],
  consumer: [...common, ...rosters.consumerSources],
};
export const semverSemanticProofSources = [...new Set(Object.values(semverGateProofSources).flat())];
extensionProofSourcesDigest(semverSemanticProofSources.map((file) => ({ file, sha256: "0".repeat(64) })));

type Candidate = Extract<ExtensionProofDeclaration, { state: "candidate" }>;
type Transfer = Candidate["members"][number]["transfers"][number];
type Edge = Pick<Transfer, "from" | "relation">;
const members = manifest.contract.members;
const opclasses = members.flatMap((member) => (member.kind === "opclass" ? [member] : []));
const families = members.flatMap((member) => (member.kind === "opfamily" ? [member] : []));
const classOf = (family: string) => opclasses.find((member) => `opfamily:${member.family}` === family)!.id;
const attachment = /^(function|operator) (\d+) \(.*\) of "\$extension:semver"\.(\w+) USING (\w+)$/;

/** Exact captured catalog edges: class families, family rows, storage types, array elements and type I/O slots. */
function capturedEdges(id: string): Edge[] {
  const member = members.find((entry) => entry.id === id)!;
  if (member.kind === "opfamily") return [{ from: classOf(member.id), relation: { kind: "opclass-family" } }];
  if (member.kind === "other") {
    const match = attachment.exec(member.identity);
    const family = match && families.find((entry) => entry.name === match[3] && entry.accessMethod === match[4]);
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
        ? (["input", "output", "receive", "send", "typmodInput", "typmodOutput"] as const)
            .filter((slot) => `routine:${type[slot]}` === member.id)
            .map((slot) => ({ from: type.id, relation: { kind: "type-routine" as const, slot } }))
        : [],
    );
    const estimators = members.flatMap((operator) =>
      operator.kind === "operator"
        ? (["restrict", "join"] as const)
            .filter((slot) => `routine:${operator[slot]}` === member.id)
            .map((slot) => ({ from: operator.id, relation: { kind: "operator-estimator" as const, slot } }))
        : [],
    );
    return [...procedures, ...slots, ...estimators];
  }
  return [];
}
function directCases(id: string) {
  return semverDatabaseProofCases.flatMap((definition) =>
    definition.claims
      .filter((claim) => claim.member === id)
      .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
  );
}
const basis = {
  class:
    "Exact captured operator-class/family/support-row relation, rooted in the parent class's native index construction and scan witness.",
  type: "Exact captured type I/O, private storage, array-element or estimator slot, rooted in the native parent type storage or operator witness.",
};
/** A transfer cites the witnessed native case: the parent's own case, or the case its private parent inherits. */
function witnessed(id: string, seen: readonly string[] = []): { caseId: string; scenario: string }[] {
  const direct = directCases(id);
  if (direct.length) return direct;
  if (seen.includes(id)) throw new Error(`Cyclic semver proof edge: ${id}`);
  return capturedEdges(id)
    .flatMap((edge) => witnessed(edge.from, [...seen, id]))
    .slice(0, 1);
}
export const semverMemberProofs = semverAnnotations.map((annotation) => {
  const edges = annotation.disposition === "internal" ? capturedEdges(annotation.id) : [];
  const cases = directCases(annotation.id);
  if (annotation.disposition === "internal" ? !edges.length : cases.length !== 1)
    throw new Error(`Missing exact semver member proof: ${annotation.id}`);
  return {
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases,
    transfers: edges.flatMap((edge) => {
      const parents = witnessed(edge.from);
      if (parents.length !== 1) throw new Error(`Missing native semver parent witness: ${edge.from}`);
      return parents.map((proof) => ({
        ...edge,
        ...proof,
        basis: edge.from.startsWith("opclass:") ? basis.class : basis.type,
      }));
    }),
  };
});

/** Registration declares requirements; only current host receipts and direct witnesses can satisfy them. */
export function registerSemverSemanticProof(
  input: ExtensionSemanticProofInput,
  receipts: readonly ExtensionProofReceipt[] = [],
): ExtensionSemanticProofInput {
  function requirement(gate: ExtensionProofReceipt["gate"]) {
    const matching = receipts.filter((receipt) => receipt.gate === gate);
    if (matching.length > 1) throw new Error(`Duplicate semver ${gate} receipt`);
    const receipt = matching[0];
    return {
      sources: [
        ...new Set([...semverGateProofSources[gate], ...(receipt?.sourcesBefore.map(({ file }) => file) ?? [])]),
      ],
      proofs: receipt
        ? semverProofCases
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
    extension: "semver",
    state: "candidate",
    family: semverProofFamily,
    schema: semverProofSchema,
    members: semverMemberProofs,
    gates: {
      database: requirement("database"),
      unit: requirement("unit"),
      types: requirement("types"),
      generation: requirement("generation"),
      consumer: requirement("consumer"),
    },
    catalogueVersionReconciliation: null,
  };
  if (!input.declarations.some((entry) => entry.extension === "semver" && entry.state === "pending"))
    throw new Error("semver registration requires its existing pending catalogue declaration");
  return {
    ...input,
    declarations: input.declarations.map((entry) => (entry.extension === "semver" ? candidate : entry)),
    manifests: [...input.manifests, manifest],
    cases: [...input.cases, ...semverProofCases],
    receipts: [...input.receipts, ...receipts],
  };
}
