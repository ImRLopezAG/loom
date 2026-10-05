import type {
  ExtensionProofCase,
  ExtensionProofFamily,
  ExtensionProofDeclaration,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { segAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/seg";
export const segProofFamily = {
  extension: "seg",
  version: "1.4",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "bba7c8f626ee6352397bd765ae103231780c7aa366ff9819bcf948ed22bd5fff",
} as const satisfies ExtensionProofFamily;
export const segProofSchema = 'Seg"日本';
const file = "packages/e2e/integration/extensions-seg.test.ts";
export const segOrdinaryProofMembers = [
  "operator:$extension:seg.@>($extension:seg.seg,$extension:seg.seg)",
  "operator:$extension:seg.&&($extension:seg.seg,$extension:seg.seg)",
  "operator:$extension:seg.&<($extension:seg.seg,$extension:seg.seg)",
  "operator:$extension:seg.&>($extension:seg.seg,$extension:seg.seg)",
  "operator:$extension:seg.<($extension:seg.seg,$extension:seg.seg)",
  "operator:$extension:seg.<@($extension:seg.seg,$extension:seg.seg)",
  "operator:$extension:seg.<<($extension:seg.seg,$extension:seg.seg)",
  "operator:$extension:seg.<=($extension:seg.seg,$extension:seg.seg)",
  "operator:$extension:seg.<>($extension:seg.seg,$extension:seg.seg)",
  "operator:$extension:seg.=($extension:seg.seg,$extension:seg.seg)",
  "operator:$extension:seg.>($extension:seg.seg,$extension:seg.seg)",
  "operator:$extension:seg.>=($extension:seg.seg,$extension:seg.seg)",
  "operator:$extension:seg.>>($extension:seg.seg,$extension:seg.seg)",
  "routine:$extension:seg.seg_center($extension:seg.seg)",
  "routine:$extension:seg.seg_cmp($extension:seg.seg,$extension:seg.seg)",
  "routine:$extension:seg.seg_contained($extension:seg.seg,$extension:seg.seg)",
  "routine:$extension:seg.seg_contains($extension:seg.seg,$extension:seg.seg)",
  "routine:$extension:seg.seg_different($extension:seg.seg,$extension:seg.seg)",
  "routine:$extension:seg.seg_ge($extension:seg.seg,$extension:seg.seg)",
  "routine:$extension:seg.seg_gt($extension:seg.seg,$extension:seg.seg)",
  "routine:$extension:seg.seg_inter($extension:seg.seg,$extension:seg.seg)",
  "routine:$extension:seg.seg_le($extension:seg.seg,$extension:seg.seg)",
  "routine:$extension:seg.seg_left($extension:seg.seg,$extension:seg.seg)",
  "routine:$extension:seg.seg_lower($extension:seg.seg)",
  "routine:$extension:seg.seg_lt($extension:seg.seg,$extension:seg.seg)",
  "routine:$extension:seg.seg_over_left($extension:seg.seg,$extension:seg.seg)",
  "routine:$extension:seg.seg_over_right($extension:seg.seg,$extension:seg.seg)",
  "routine:$extension:seg.seg_overlap($extension:seg.seg,$extension:seg.seg)",
  "routine:$extension:seg.seg_right($extension:seg.seg,$extension:seg.seg)",
  "routine:$extension:seg.seg_same($extension:seg.seg,$extension:seg.seg)",
  "routine:$extension:seg.seg_size($extension:seg.seg)",
  "routine:$extension:seg.seg_union($extension:seg.seg,$extension:seg.seg)",
  "routine:$extension:seg.seg_upper($extension:seg.seg)",
] as const;
export const segOrdinaryProofCase = {
  id: "seg.native-ordinary",
  file,
  title: "seg.all33NativeIdentitiesAndStrictNull",
  gate: "database",
  families: [segProofFamily],
  claims: segOrdinaryProofMembers.map((member) => ({
    family: segProofFamily,
    member,
    scenario: "independent-native-sql-and-strict-null",
  })),
} satisfies ExtensionProofCase;
export const segPrecisionProofCase = {
  id: "seg.native-precision",
  file,
  title: "seg.nativePrecisionMarkersOpenBoundsAndOutputOnlyResults",
  gate: "database",
  families: [segProofFamily],
  claims: [
    {
      family: segProofFamily,
      member: "type:$extension:seg.seg",
      scenario: "native-precision-six-digits-float4-markers-open-bounds-deviation-and-inverted-output",
    },
  ],
} satisfies ExtensionProofCase;
export const segSchemaIndexProofCase = {
  id: "seg.native-schema-indexes",
  file,
  title: "seg.nativeFieldsArraysDefaultsSnapshotsAndIndexCallbacks",
  gate: "database",
  families: [segProofFamily],
  claims: [
    "type:$extension:seg._seg",
    "opclass:$extension:seg.seg_ops/btree",
    "opclass:$extension:seg.gist_seg_ops/gist",
  ].map((member) => ({
    family: segProofFamily,
    member,
    scenario: "native-schema-array-six-ranks-and-indexed-versus-sequential-oracles",
  })),
} satisfies ExtensionProofCase;
export const segCompositionProofCase = {
  id: "seg.native-composition",
  file,
  title: "seg.nativeErrorsRollbackAndSQLComposition",
  gate: "database",
  families: [segProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const segDatabaseProofCases = [
  segOrdinaryProofCase,
  segPrecisionProofCase,
  segSchemaIndexProofCase,
  segCompositionProofCase,
] satisfies ExtensionProofCase[];
export const segDatabaseFixtureCount = 4;
export const segDatabaseRoleCount = 0;
export const segUnitProofCase = {
  id: "seg.unit-contracts",
  file: "packages/tests/unit/extensions-seg.test.ts",
  title: "seg.precisionTokensNativeOnlyResultsArrayBoundsAndStrictGrammar",
  gate: "unit",
  families: [segProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const segMembershipUnitProofCase = {
  id: "seg.unit-membership",
  file: "packages/tests/unit/extensions-seg.test.ts",
  title: "seg.exact65Members33CallableIdentitiesAndQualifiedSQL",
  gate: "unit",
  families: [segProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const segDefaultPrecisionUnitProofCase = {
  id: "seg.unit-default-precision",
  file: "packages/tests/unit/extensions-seg-defaults.test.ts",
  title: "segDefaults.normalizesExactNativeScalarLiteralCastWithoutLosingPrecision",
  gate: "unit",
  families: [segProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const segDefaultIdentityUnitProofCase = {
  id: "seg.unit-default-identity",
  file: "packages/tests/unit/extensions-seg-defaults.test.ts",
  title: "segDefaults.preservesOtherExtensionAndVersionCastSpelling",
  gate: "unit",
  families: [segProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const segUnitProofCases = [
  segUnitProofCase,
  segMembershipUnitProofCase,
  segDefaultPrecisionUnitProofCase,
  segDefaultIdentityUnitProofCase,
] satisfies ExtensionProofCase[];
export const segTypesProofCase = {
  id: "seg.types-contracts",
  file: "packages/tests/types/extensions-seg.test-d.ts",
  title: "seg.all33NativeSignaturesAndNegativeContracts",
  gate: "types",
  families: [segProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
type MemberProof = Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"][number];
const segInternalRelations = {
  'function of access method:function 1 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".gist_seg_ops USING gist':
    {
      from: "opclass:$extension:seg.gist_seg_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.gist_seg_ops/gist",
        row: {
          kind: "procedure",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          number: 1,
          procedure:
            "$extension:seg.gseg_consistent(pg_catalog.internal,$extension:seg.seg,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
        },
      },
    },
  'function of access method:function 1 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".seg_ops USING btree':
    {
      from: "opclass:$extension:seg.seg_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.seg_ops/btree",
        row: {
          kind: "procedure",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          number: 1,
          procedure: "$extension:seg.seg_cmp($extension:seg.seg,$extension:seg.seg)",
        },
      },
    },
  'function of access method:function 2 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".gist_seg_ops USING gist':
    {
      from: "opclass:$extension:seg.gist_seg_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.gist_seg_ops/gist",
        row: {
          kind: "procedure",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          number: 2,
          procedure: "$extension:seg.gseg_union(pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  'function of access method:function 5 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".gist_seg_ops USING gist':
    {
      from: "opclass:$extension:seg.gist_seg_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.gist_seg_ops/gist",
        row: {
          kind: "procedure",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          number: 5,
          procedure: "$extension:seg.gseg_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  'function of access method:function 6 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".gist_seg_ops USING gist':
    {
      from: "opclass:$extension:seg.gist_seg_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.gist_seg_ops/gist",
        row: {
          kind: "procedure",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          number: 6,
          procedure: "$extension:seg.gseg_picksplit(pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  'function of access method:function 7 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".gist_seg_ops USING gist':
    {
      from: "opclass:$extension:seg.gist_seg_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.gist_seg_ops/gist",
        row: {
          kind: "procedure",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          number: 7,
          procedure: "$extension:seg.gseg_same($extension:seg.seg,$extension:seg.seg,pg_catalog.internal)",
        },
      },
    },
  'operator of access method:operator 1 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".gist_seg_ops USING gist':
    {
      from: "opclass:$extension:seg.gist_seg_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.gist_seg_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          strategy: 1,
          purpose: "s",
          operator: "$extension:seg.<<($extension:seg.seg,$extension:seg.seg)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 1 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".seg_ops USING btree':
    {
      from: "opclass:$extension:seg.seg_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.seg_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          strategy: 1,
          purpose: "s",
          operator: "$extension:seg.<($extension:seg.seg,$extension:seg.seg)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 2 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".gist_seg_ops USING gist':
    {
      from: "opclass:$extension:seg.gist_seg_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.gist_seg_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          strategy: 2,
          purpose: "s",
          operator: "$extension:seg.&<($extension:seg.seg,$extension:seg.seg)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 2 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".seg_ops USING btree':
    {
      from: "opclass:$extension:seg.seg_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.seg_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          strategy: 2,
          purpose: "s",
          operator: "$extension:seg.<=($extension:seg.seg,$extension:seg.seg)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 3 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".gist_seg_ops USING gist':
    {
      from: "opclass:$extension:seg.gist_seg_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.gist_seg_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          strategy: 3,
          purpose: "s",
          operator: "$extension:seg.&&($extension:seg.seg,$extension:seg.seg)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 3 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".seg_ops USING btree':
    {
      from: "opclass:$extension:seg.seg_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.seg_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          strategy: 3,
          purpose: "s",
          operator: "$extension:seg.=($extension:seg.seg,$extension:seg.seg)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 4 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".gist_seg_ops USING gist':
    {
      from: "opclass:$extension:seg.gist_seg_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.gist_seg_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          strategy: 4,
          purpose: "s",
          operator: "$extension:seg.&>($extension:seg.seg,$extension:seg.seg)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 4 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".seg_ops USING btree':
    {
      from: "opclass:$extension:seg.seg_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.seg_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          strategy: 4,
          purpose: "s",
          operator: "$extension:seg.>=($extension:seg.seg,$extension:seg.seg)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 5 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".gist_seg_ops USING gist':
    {
      from: "opclass:$extension:seg.gist_seg_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.gist_seg_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          strategy: 5,
          purpose: "s",
          operator: "$extension:seg.>>($extension:seg.seg,$extension:seg.seg)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 5 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".seg_ops USING btree':
    {
      from: "opclass:$extension:seg.seg_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.seg_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          strategy: 5,
          purpose: "s",
          operator: "$extension:seg.>($extension:seg.seg,$extension:seg.seg)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 6 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".gist_seg_ops USING gist':
    {
      from: "opclass:$extension:seg.gist_seg_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.gist_seg_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          strategy: 6,
          purpose: "s",
          operator: "$extension:seg.=($extension:seg.seg,$extension:seg.seg)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 7 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".gist_seg_ops USING gist':
    {
      from: "opclass:$extension:seg.gist_seg_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.gist_seg_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          strategy: 7,
          purpose: "s",
          operator: "$extension:seg.@>($extension:seg.seg,$extension:seg.seg)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 8 ("$extension:seg".seg, "$extension:seg".seg) of "$extension:seg".gist_seg_ops USING gist':
    {
      from: "opclass:$extension:seg.gist_seg_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:seg.gist_seg_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:seg",
            name: "seg",
          },
          right: {
            namespace: "$extension:seg",
            name: "seg",
          },
          strategy: 8,
          purpose: "s",
          operator: "$extension:seg.<@($extension:seg.seg,$extension:seg.seg)",
          sortFamily: null,
        },
      },
    },
  "opfamily:$extension:seg.gist_seg_ops/gist": {
    from: "opclass:$extension:seg.gist_seg_ops/gist",
    relation: {
      kind: "opclass-family",
    },
  },
  "opfamily:$extension:seg.seg_ops/btree": {
    from: "opclass:$extension:seg.seg_ops/btree",
    relation: {
      kind: "opclass-family",
    },
  },
  "routine:$extension:seg.gseg_consistent(pg_catalog.internal,$extension:seg.seg,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)":
    {
      from: "opclass:$extension:seg.gist_seg_ops/gist",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:seg.gist_seg_ops/gist",
        left: {
          namespace: "$extension:seg",
          name: "seg",
        },
        right: {
          namespace: "$extension:seg",
          name: "seg",
        },
        number: 1,
        procedure:
          "$extension:seg.gseg_consistent(pg_catalog.internal,$extension:seg.seg,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
      },
    },
  "routine:$extension:seg.gseg_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)": {
    from: "opclass:$extension:seg.gist_seg_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:seg.gist_seg_ops/gist",
      left: {
        namespace: "$extension:seg",
        name: "seg",
      },
      right: {
        namespace: "$extension:seg",
        name: "seg",
      },
      number: 5,
      procedure: "$extension:seg.gseg_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    },
  },
  "routine:$extension:seg.gseg_picksplit(pg_catalog.internal,pg_catalog.internal)": {
    from: "opclass:$extension:seg.gist_seg_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:seg.gist_seg_ops/gist",
      left: {
        namespace: "$extension:seg",
        name: "seg",
      },
      right: {
        namespace: "$extension:seg",
        name: "seg",
      },
      number: 6,
      procedure: "$extension:seg.gseg_picksplit(pg_catalog.internal,pg_catalog.internal)",
    },
  },
  "routine:$extension:seg.gseg_same($extension:seg.seg,$extension:seg.seg,pg_catalog.internal)": {
    from: "opclass:$extension:seg.gist_seg_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:seg.gist_seg_ops/gist",
      left: {
        namespace: "$extension:seg",
        name: "seg",
      },
      right: {
        namespace: "$extension:seg",
        name: "seg",
      },
      number: 7,
      procedure: "$extension:seg.gseg_same($extension:seg.seg,$extension:seg.seg,pg_catalog.internal)",
    },
  },
  "routine:$extension:seg.gseg_union(pg_catalog.internal,pg_catalog.internal)": {
    from: "opclass:$extension:seg.gist_seg_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:seg.gist_seg_ops/gist",
      left: {
        namespace: "$extension:seg",
        name: "seg",
      },
      right: {
        namespace: "$extension:seg",
        name: "seg",
      },
      number: 2,
      procedure: "$extension:seg.gseg_union(pg_catalog.internal,pg_catalog.internal)",
    },
  },
  "routine:$extension:seg.seg_in(pg_catalog.cstring)": {
    from: "type:$extension:seg.seg",
    relation: {
      kind: "type-routine",
      slot: "input",
    },
  },
  "routine:$extension:seg.seg_out($extension:seg.seg)": {
    from: "type:$extension:seg.seg",
    relation: {
      kind: "type-routine",
      slot: "output",
    },
  },
} satisfies Record<string, { from: string; relation: MemberProof["transfers"][number]["relation"] }>;
export const segMemberProofs: MemberProof[] = segAnnotations.map((annotation) => {
  const direct = segDatabaseProofCases.flatMap((definition) =>
    definition.claims
      .filter((claim) => claim.member === annotation.id)
      .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
  );
  const edge = Object.entries(segInternalRelations).find(([id]) => id === annotation.id)?.[1];
  const parent =
    edge &&
    segDatabaseProofCases.flatMap((definition) =>
      definition.claims
        .filter((claim) => claim.member === edge.from)
        .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
    );
  if (annotation.disposition === "internal" && (!edge || !parent || parent.length !== 1))
    throw new Error(`Missing exact Seg internal parent: ${annotation.id}`);
  if (annotation.disposition !== "internal" && direct.length !== 1)
    throw new Error(`Missing executed Seg member case: ${annotation.id}`);
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
              "Exact captured seg graph edge; native type or indexed-versus-sequential parent oracle exercises the attached callback.",
          }))
        : [],
  };
});
