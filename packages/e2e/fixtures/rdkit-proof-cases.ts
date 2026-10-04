import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import type { ExtensionMember, ExtensionTypeReference } from "../../../apps/loom/src/core/extensions/contracts";
import {
  rdkitAnnotations,
  rdkitManifest as manifest,
} from "../../../apps/loom/src/tooling/extensions/annotations/rdkit";

export const rdkitProofFamily = {
  extension: "rdkit",
  version: "4.8.0",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "2dcfe3dc27aa808bb3b7ef565a362e829974f39145889aecfb4e73a67c7a0952",
} as const satisfies ExtensionProofFamily;

export const rdkitUnitProofCases = [
  {
    id: "rdkit.unit-contracts",
    title: "rdkit 4.8.0 exact manifest identity and public overload coverage",
  },
  {
    id: "rdkit.unit-transport",
    title: "rdkit native text domains keep mol, qmol, fingerprint and array bounds distinct",
  },
  {
    id: "rdkit.unit-composition",
    title: "rdkit fingerprint and Tanimoto helpers bind captured members without chemistry fallbacks",
  },
  {
    id: "rdkit.unit-internals",
    title: "rdkit internals keep captured parents; unattached gbfp_sortsupport has a native graph case",
  },
].map(
  (entry) =>
    ({
      ...entry,
      file: "packages/tests/unit/extensions-rdkit.test.ts",
      gate: "unit",
      families: [rdkitProofFamily],
      claims: [],
    }) as const,
) satisfies ExtensionProofCase[];

export const rdkitTypesProofCase = {
  id: "rdkit.types-contracts",
  file: "packages/tests/types/extensions-rdkit.test-d.ts",
  title: "rdkit public exact-version molecular, query-molecule, fingerprint and Tanimoto declarations",
  gate: "types",
  families: [rdkitProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

const nativeFile = "packages/e2e/integration/extensions-rdkit.test.ts";
export const rdkitOrdinaryProofCase = {
  id: "rdkit.native-ordinary",
  file: nativeFile,
  title: "rdkit.all221PublicOverloadsAnd3CastsAgainstIndependentNativeSql",
  gate: "database",
  families: [rdkitProofFamily],
  claims: rdkitAnnotations
    .filter((row) => row.disposition === "query")
    .map((row) => ({
      family: rdkitProofFamily,
      member: row.id,
      scenario: "independent-native-sql-and-strict-null",
    })),
} satisfies ExtensionProofCase;

export const rdkitSchemaProofCase = {
  id: "rdkit.native-schema",
  file: nativeFile,
  title: "rdkit.sixChemistryTypesArraysAndThirteenIndexClasses",
  gate: "database",
  families: [rdkitProofFamily],
  claims: manifest.contract.members
    .filter((row) => row.kind === "type" || row.kind === "opclass")
    .map((row) => ({
      family: rdkitProofFamily,
      member: row.id,
      scenario: "stored-type-array-bounds-and-indexed-versus-sequential-oracle",
    })),
} satisfies ExtensionProofCase;

const sortsupport = "routine:$extension:rdkit.gbfp_sortsupport(pg_catalog.internal)";
const reactionSearch =
  "routine:$extension:rdkit.has_reaction_substructmatch(pg_catalog.bpchar,pg_catalog.regclass,pg_catalog.text)";
export const rdkitGraphProofCase = {
  id: "rdkit.native-graph",
  file: nativeFile,
  title: "rdkit.unattachedGbfpSortsupportUnderDefaultBuildOption",
  gate: "database",
  families: [rdkitProofFamily],
  claims: [{ family: rdkitProofFamily, member: sortsupport, scenario: "extension-member-without-catalog-owner" }],
} satisfies ExtensionProofCase;

export const rdkitToolingProofCase = {
  id: "rdkit.native-tooling",
  file: nativeFile,
  title: "rdkit.reactionTableSearchIsOperatorOnly",
  gate: "database",
  families: [rdkitProofFamily],
  claims: [{ family: rdkitProofFamily, member: reactionSearch, scenario: "dedicated-operator-session" }],
} satisfies ExtensionProofCase;

export const rdkitGenerationProofCase = {
  id: "rdkit.generation",
  file: "packages/e2e/integration/extensions-rdkit-generated.test.ts",
  title: "rdkit first-load and disk generation preserve the exact selected 4.8.0 adapter",
  gate: "generation",
  families: [rdkitProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const rdkitConsumerProofCase = {
  id: "rdkit.consumer",
  file: "packages/e2e/integration/packed-rdkit.test.ts",
  title: "packed rdkit compiles public identities and executes native public APIs on Node 24",
  gate: "consumer",
  families: [rdkitProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const rdkitProofCases = [
  ...rdkitUnitProofCases,
  rdkitTypesProofCase,
  rdkitOrdinaryProofCase,
  rdkitSchemaProofCase,
  rdkitGraphProofCase,
  rdkitToolingProofCase,
  rdkitGenerationProofCase,
  rdkitConsumerProofCase,
];

type MemberProof = Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"][number];
const citations = [
  "apps/loom/src/tooling/extensions/manifests/rdkit.json",
  "https://www.rdkit.org/docs/Cartridge.html",
  "apps/loom/src/core/extensions/adapters/rdkit.ts",
  "apps/loom/src/core/extensions/adapters/rdkit-codecs.ts",
  "packages/e2e/integration/extensions-rdkit.test.ts",
] as const;

/** Proposed family-local dispositions. Definitions alone confer no five-gate acceptance. */
export const rdkitMemberProofs: MemberProof[] = rdkitAnnotations.map((annotation) => {
  const captured = manifest.contract.members.find((row) => row.id === annotation.id);
  if (!captured) throw new Error(`Missing captured rdkit member: ${annotation.id}`);
  const none: MemberProof["cases"] = [];
  const common = { id: annotation.id, citations: [...citations], cases: none };
  if (annotation.disposition === "query") {
    return {
      ...common,
      disposition: "query",
      reason: annotation.reason,
      cases: [{ caseId: rdkitOrdinaryProofCase.id, scenario: "independent-native-sql-and-strict-null" }],
      transfers: [],
    };
  }
  if (annotation.disposition === "schema") {
    return {
      ...common,
      disposition: "schema",
      reason: annotation.reason,
      cases: [
        { caseId: rdkitSchemaProofCase.id, scenario: "stored-type-array-bounds-and-indexed-versus-sequential-oracle" },
      ],
      transfers: [],
    };
  }
  if (annotation.disposition === "tooling") {
    return {
      ...common,
      disposition: "tooling",
      reason: annotation.reason,
      cases: [{ caseId: rdkitToolingProofCase.id, scenario: "dedicated-operator-session" }],
      transfers: [],
    };
  }
  if (annotation.id === sortsupport) {
    return {
      ...common,
      disposition: "internal",
      reason: annotation.reason,
      cases: [{ caseId: rdkitGraphProofCase.id, scenario: "extension-member-without-catalog-owner" }],
      transfers: [],
    };
  }
  const parent = "parent" in annotation.semantics ? annotation.semantics.parent : "";
  if (!parent) throw new Error(`rdkit internal missing parent: ${annotation.id}`);
  const rootedAtSchema = parent.startsWith("type:") || parent.startsWith("opclass:") || parent.startsWith("opfamily:");
  const parentCase = rootedAtSchema
    ? { caseId: rdkitSchemaProofCase.id, scenario: "stored-type-array-bounds-and-indexed-versus-sequential-oracle" }
    : { caseId: rdkitOrdinaryProofCase.id, scenario: "independent-native-sql-and-strict-null" };
  return {
    ...common,
    disposition: "internal",
    reason: annotation.reason,
    transfers: [
      {
        from: parent,
        relation: transferRelation(captured, parent),
        ...parentCase,
        basis: "Exact captured type/callback, aggregate slot, family procedure, or access-method attachment edge.",
      },
    ],
  };
});

function transferRelation(member: ExtensionMember, parent: string): MemberProof["transfers"][number]["relation"] {
  if (member.kind === "opfamily") return { kind: "opclass-family" };
  if (member.kind === "other") {
    const owner = manifest.contract.members.find(
      (row) => row.kind === "opfamily" && parent === `opclass:$extension:rdkit.${row.name}/${row.accessMethod}`,
    );
    if (!owner || owner.kind !== "opfamily") throw new Error(`Missing rdkit family for ${member.id}`);
    const match = /^(function|operator) (\d+) /.exec(member.identity);
    if (!match) throw new Error(`Unknown rdkit attachment: ${member.id}`);
    const number = Number(match[2]);
    const attachmentIdentity = member.identity;
    const attachmentLabel = match[1];
    const ownerName = owner.name;
    const accessMethod = owner.accessMethod;
    function exactAttachment(left: ExtensionTypeReference, right: ExtensionTypeReference) {
      return (
        attachmentIdentity ===
        `${attachmentLabel} ${number} (${attachmentType(left)}, ${attachmentType(right)}) of "$extension:rdkit".${ownerName} USING ${accessMethod}`
      );
    }
    if (match[1] === "function") {
      const row = owner.procedures.find((entry) => entry.number === number && exactAttachment(entry.left, entry.right));
      if (!row) throw new Error(`Missing rdkit family procedure ${number} for ${member.id}`);
      return { kind: "attachment", family: owner.id, row: { kind: "procedure", ...row } };
    }
    const row = owner.operators.find((entry) => entry.strategy === number && exactAttachment(entry.left, entry.right));
    if (!row) throw new Error(`Missing rdkit family operator ${number} for ${member.id}`);
    return { kind: "attachment", family: owner.id, row: { kind: "operator", ...row } };
  }
  if (member.kind !== "routine") throw new Error(`Unimplemented rdkit transfer: ${member.id}`);
  const type = manifest.contract.members.find((row) => row.kind === "type" && row.id === parent);
  if (type && type.kind === "type") {
    const identity = member.id.slice(8);
    const slot = (["input", "output", "receive", "send", "typmodInput", "typmodOutput"] as const).find(
      (name) => type[name] === identity,
    );
    if (!slot) throw new Error(`Missing rdkit type slot for ${member.id}`);
    return { kind: "type-routine", slot };
  }
  const aggregate = manifest.contract.members.find((row) => row.id === parent);
  if (aggregate && aggregate.kind === "routine" && aggregate.routineKind === "aggregate" && aggregate.aggregate) {
    const identity = member.id.slice(8);
    const slot = (
      [
        "transition",
        "final",
        "combine",
        "serial",
        "deserial",
        "movingTransition",
        "movingInverse",
        "movingFinal",
      ] as const
    ).find((name) => aggregate.aggregate?.[name] === identity);
    if (!slot) throw new Error(`Missing rdkit aggregate slot for ${member.id}`);
    return { kind: "aggregate-routine", slot };
  }
  const family = manifest.contract.members.find((row) => row.id === parent);
  if (family && family.kind === "opfamily") {
    const row = family.procedures.find((entry) => member.id === `routine:${entry.procedure}`);
    if (!row) throw new Error(`Missing rdkit family procedure for ${member.id}`);
    return { kind: "family-procedure", family: family.id, ...row };
  }
  throw new Error(`Unowned rdkit transfer: ${member.id} -> ${parent}`);
}

function attachmentType(type: ExtensionTypeReference): string {
  if (type.namespace === "$extension:rdkit" && ["mol", "qmol", "bfp", "sfp", "reaction"].includes(type.name))
    return `"$extension:rdkit".${type.name}`;
  if (type.namespace === "pg_catalog" && type.name === "internal") return "pg_catalog.internal";
  throw new Error(`Unsupported RDKit attachment type: ${type.namespace}.${type.name}`);
}
