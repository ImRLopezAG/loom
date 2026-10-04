import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { hllAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/hll";

export const hllProofFamily = {
  extension: "hll",
  version: "2.21",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "44f6623b1b7a463ea7cb26fcd02b434cb33c36a4bd9edfe0397e2536f66f6b19",
} as const satisfies ExtensionProofFamily;
/** Query and operator proofs exercise the same exact quoted installation schema. */
export const hllProofSchema = 'Hll"日本';
export const hllToolingSchema = hllProofSchema;
const file = "packages/e2e/integration/extensions-hll.test.ts";
const hll = "$extension:hll.hll",
  hashval = "$extension:hll.hll_hashval";
type Disposition = (typeof hllAnnotations)[number]["disposition"];
const ids = (disposition: Disposition, test: (id: string) => boolean) =>
  hllAnnotations.filter((entry) => entry.disposition === disposition && test(entry.id)).map((entry) => entry.id);
const aggregate = (id: string) => /\.hll_(add|union)_agg\(/.test(id);
export const hllScalarProofMembers = ids("query", (id) => !aggregate(id));
export const hllAggregateProofMembers = ids("query", aggregate);
export const hllSettingProofMembers = ids("tooling", (id) => id.includes(".hll_set_"));
export const hllUnpackedProofMembers = ids("internal", (id) => id.includes("_unpacked("));
export const hllTypeProofMembers = ids("schema", () => true);
const claims = (members: readonly string[], scenario: string) =>
  members.map((member) => ({ family: hllProofFamily, member, scenario }));

export const hllScalarProofCase = {
  id: "hll.native-scalar",
  file,
  title: "hll.allScalarOperatorCastAndRoutineIdentitiesAgainstNativeSqlAndStrictNull",
  gate: "database",
  families: [hllProofFamily],
  claims: claims(hllScalarProofMembers, "independent-native-sql-and-strict-null"),
} satisfies ExtensionProofCase;
export const hllAggregateProofCase = {
  id: "hll.native-aggregates",
  file,
  title: "hll.allAggregatesSerialParallelPartialEmptyAndNullGroups",
  gate: "database",
  families: [hllProofFamily],
  claims: claims(hllAggregateProofMembers, "serial-and-parallel-partial-aggregation-empty-and-null-groups"),
} satisfies ExtensionProofCase;
export const hllSchemaProofCase = {
  id: "hll.native-schema",
  file,
  title: "hll.nativeFieldsModifiersArraysAndTextIo",
  gate: "database",
  families: [hllProofFamily],
  claims: claims(hllTypeProofMembers, "native-fields-typmods-arrays-and-text-io"),
} satisfies ExtensionProofCase;
export const hllToolingProofCase = {
  id: "hll.native-tooling",
  file,
  title: "hll.ownedBackendSettersAndUnconstructibleInternalRoutines",
  gate: "database",
  families: [hllProofFamily],
  claims: [
    ...claims(hllSettingProofMembers, "owned-backend-previous-values-and-no-leak"),
    ...claims(hllUnpackedProofMembers, "unreferenced-unconstructible-internal-argument"),
  ],
} satisfies ExtensionProofCase;
export const hllDatabaseProofCases = [
  hllScalarProofCase,
  hllAggregateProofCase,
  hllSchemaProofCase,
  hllToolingProofCase,
] satisfies ExtensionProofCase[];
export const hllUnitProofCase = {
  id: "hll.unit-contracts",
  file: "packages/tests/unit/extensions-hll.test.ts",
  title: "hll.exactContractMembershipCodecsAndQualifiedSql",
  gate: "unit",
  families: [hllProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const hllTypesProofCase = {
  id: "hll.types-contracts",
  file: "packages/tests/types/extensions-hll.test-d.ts",
  title: "hll.nativeSignaturesAndNegativeContracts",
  gate: "types",
  families: [hllProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const hllGenerationProofCase = {
  id: "hll.generation-contracts",
  file: "packages/e2e/integration/extension-hll-codegen.test.ts",
  title: "hll.firstLoadDiskGenerationSelectedBindingsMountedComponentAndNativeRpc",
  gate: "generation",
  families: [hllProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const hllConsumerProofCase = {
  id: "hll.consumer-contracts",
  file: "packages/e2e/integration/packed-hll.test.ts",
  title: "hll.isolatedPackedConsumerSelectedBundlesNativeRpcAndOperatorSession",
  gate: "consumer",
  families: [hllProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const hllProofCases = [
  ...hllDatabaseProofCases,
  hllUnitProofCase,
  hllTypesProofCase,
  hllGenerationProofCase,
  hllConsumerProofCase,
] satisfies ExtensionProofCase[];

type MemberProof = Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"][number];
type Relation = MemberProof["transfers"][number]["relation"];
const addAgg = (signature: string) => `routine:$extension:hll.hll_add_agg(${hashval}${signature})`;
export const hllInternalRelations = {
  [`routine:$extension:hll.hll_add_trans0(pg_catalog.internal,${hashval})`]: {
    from: addAgg(""),
    relation: { kind: "aggregate-routine", slot: "transition" },
  },
  [`routine:$extension:hll.hll_add_trans1(pg_catalog.internal,${hashval},pg_catalog.int4)`]: {
    from: addAgg(",pg_catalog.int4"),
    relation: { kind: "aggregate-routine", slot: "transition" },
  },
  [`routine:$extension:hll.hll_add_trans2(pg_catalog.internal,${hashval},pg_catalog.int4,pg_catalog.int4)`]: {
    from: addAgg(",pg_catalog.int4,pg_catalog.int4"),
    relation: { kind: "aggregate-routine", slot: "transition" },
  },
  [`routine:$extension:hll.hll_add_trans3(pg_catalog.internal,${hashval},pg_catalog.int4,pg_catalog.int4,pg_catalog.int8)`]:
    {
      from: addAgg(",pg_catalog.int4,pg_catalog.int4,pg_catalog.int8"),
      relation: { kind: "aggregate-routine", slot: "transition" },
    },
  [`routine:$extension:hll.hll_add_trans4(pg_catalog.internal,${hashval},pg_catalog.int4,pg_catalog.int4,pg_catalog.int8,pg_catalog.int4)`]:
    {
      from: addAgg(",pg_catalog.int4,pg_catalog.int4,pg_catalog.int8,pg_catalog.int4"),
      relation: { kind: "aggregate-routine", slot: "transition" },
    },
  [`routine:$extension:hll.hll_union_trans(pg_catalog.internal,${hll})`]: {
    from: `routine:$extension:hll.hll_union_agg(${hll})`,
    relation: { kind: "aggregate-routine", slot: "transition" },
  },
  "routine:$extension:hll.hll_pack(pg_catalog.internal)": {
    from: addAgg(""),
    relation: { kind: "aggregate-routine", slot: "final" },
  },
  "routine:$extension:hll.hll_union_internal(pg_catalog.internal,pg_catalog.internal)": {
    from: addAgg(""),
    relation: { kind: "aggregate-routine", slot: "combine" },
  },
  "routine:$extension:hll.hll_serialize(pg_catalog.internal)": {
    from: addAgg(""),
    relation: { kind: "aggregate-routine", slot: "serial" },
  },
  "routine:$extension:hll.hll_deserialize(pg_catalog.bytea,pg_catalog.internal)": {
    from: addAgg(""),
    relation: { kind: "aggregate-routine", slot: "deserial" },
  },
  "routine:$extension:hll.hll_in(pg_catalog.cstring,pg_catalog.oid,pg_catalog.int4)": {
    from: `type:${hll}`,
    relation: { kind: "type-routine", slot: "input" },
  },
  [`routine:$extension:hll.hll_out(${hll})`]: {
    from: `type:${hll}`,
    relation: { kind: "type-routine", slot: "output" },
  },
  "routine:$extension:hll.hll_recv(pg_catalog.internal)": {
    from: `type:${hll}`,
    relation: { kind: "type-routine", slot: "receive" },
  },
  "routine:$extension:hll.hll_typmod_out(pg_catalog.int4)": {
    from: `type:${hll}`,
    relation: { kind: "type-routine", slot: "typmodOutput" },
  },
  "routine:$extension:hll.hll_hashval_in(pg_catalog.cstring,pg_catalog.oid,pg_catalog.int4)": {
    from: `type:${hashval}`,
    relation: { kind: "type-routine", slot: "input" },
  },
  [`routine:$extension:hll.hll_hashval_out(${hashval})`]: {
    from: `type:${hashval}`,
    relation: { kind: "type-routine", slot: "output" },
  },
} satisfies Record<string, { from: string; relation: Relation }>;
const caseClaims = (member: string) =>
  hllDatabaseProofCases.flatMap((definition) =>
    definition.claims
      .filter((claim) => claim.member === member)
      .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
  );
export const hllMemberProofs: MemberProof[] = hllAnnotations.map((annotation) => {
  const direct = caseClaims(annotation.id);
  const edge = Object.entries(hllInternalRelations).find(([id]) => id === annotation.id)?.[1];
  const parent = edge && caseClaims(edge.from);
  // Unreferenced internal-argument routines have no captured slot to inherit proof from; their case proves the absence.
  const unreferenced = hllUnpackedProofMembers.includes(annotation.id);
  if (annotation.disposition === "internal" && !unreferenced && (!edge || !parent || parent.length !== 1))
    throw new Error(`Missing exact hll internal parent: ${annotation.id}`);
  if ((annotation.disposition !== "internal" || unreferenced) && direct.length !== 1)
    throw new Error(`Missing executed hll member case: ${annotation.id}`);
  return {
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases: direct,
    transfers:
      edge && parent
        ? parent.map((proof) => ({
            ...edge,
            ...proof,
            basis:
              "Exact captured hll aggregate or type slot; the parent's native serial, parallel-partial or text/field oracle executes the slot.",
          }))
        : [],
  };
});
