import type {
  ExtensionProofCase,
  ExtensionProofFamily,
  ExtensionProofDeclaration,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { cubeAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/cube";

export const cubeProofFamily = {
  extension: "cube",
  version: "1.5",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "205421c1cacc198ba7088c60ec4f76b0a8e7adec18be87d17a8082dd7b0515e2",
} as const satisfies ExtensionProofFamily;
export const cubeProofSchema = 'Cube"日本';
const file = "packages/e2e/integration/extensions-cube.test.ts";
export const cubeOrdinaryProofMembers = [
  "operator:$extension:cube.->($extension:cube.cube,pg_catalog.int4)",
  "operator:$extension:cube.@>($extension:cube.cube,$extension:cube.cube)",
  "operator:$extension:cube.&&($extension:cube.cube,$extension:cube.cube)",
  "operator:$extension:cube.<->($extension:cube.cube,$extension:cube.cube)",
  "operator:$extension:cube.<($extension:cube.cube,$extension:cube.cube)",
  "operator:$extension:cube.<@($extension:cube.cube,$extension:cube.cube)",
  "operator:$extension:cube.<#>($extension:cube.cube,$extension:cube.cube)",
  "operator:$extension:cube.<=($extension:cube.cube,$extension:cube.cube)",
  "operator:$extension:cube.<=>($extension:cube.cube,$extension:cube.cube)",
  "operator:$extension:cube.<>($extension:cube.cube,$extension:cube.cube)",
  "operator:$extension:cube.=($extension:cube.cube,$extension:cube.cube)",
  "operator:$extension:cube.>($extension:cube.cube,$extension:cube.cube)",
  "operator:$extension:cube.>=($extension:cube.cube,$extension:cube.cube)",
  "operator:$extension:cube.~>($extension:cube.cube,pg_catalog.int4)",
  "routine:$extension:cube.cube_cmp($extension:cube.cube,$extension:cube.cube)",
  "routine:$extension:cube.cube_contained($extension:cube.cube,$extension:cube.cube)",
  "routine:$extension:cube.cube_contains($extension:cube.cube,$extension:cube.cube)",
  "routine:$extension:cube.cube_coord_llur($extension:cube.cube,pg_catalog.int4)",
  "routine:$extension:cube.cube_coord($extension:cube.cube,pg_catalog.int4)",
  "routine:$extension:cube.cube_dim($extension:cube.cube)",
  "routine:$extension:cube.cube_distance($extension:cube.cube,$extension:cube.cube)",
  "routine:$extension:cube.cube_enlarge($extension:cube.cube,pg_catalog.float8,pg_catalog.int4)",
  "routine:$extension:cube.cube_eq($extension:cube.cube,$extension:cube.cube)",
  "routine:$extension:cube.cube_ge($extension:cube.cube,$extension:cube.cube)",
  "routine:$extension:cube.cube_gt($extension:cube.cube,$extension:cube.cube)",
  "routine:$extension:cube.cube_inter($extension:cube.cube,$extension:cube.cube)",
  "routine:$extension:cube.cube_is_point($extension:cube.cube)",
  "routine:$extension:cube.cube_le($extension:cube.cube,$extension:cube.cube)",
  "routine:$extension:cube.cube_ll_coord($extension:cube.cube,pg_catalog.int4)",
  "routine:$extension:cube.cube_lt($extension:cube.cube,$extension:cube.cube)",
  "routine:$extension:cube.cube_ne($extension:cube.cube,$extension:cube.cube)",
  "routine:$extension:cube.cube_overlap($extension:cube.cube,$extension:cube.cube)",
  "routine:$extension:cube.cube_send($extension:cube.cube)",
  "routine:$extension:cube.cube_size($extension:cube.cube)",
  "routine:$extension:cube.cube_subset($extension:cube.cube,pg_catalog._int4)",
  "routine:$extension:cube.cube_union($extension:cube.cube,$extension:cube.cube)",
  "routine:$extension:cube.cube_ur_coord($extension:cube.cube,pg_catalog.int4)",
  "routine:$extension:cube.cube($extension:cube.cube,pg_catalog.float8,pg_catalog.float8)",
  "routine:$extension:cube.cube($extension:cube.cube,pg_catalog.float8)",
  "routine:$extension:cube.cube(pg_catalog._float8,pg_catalog._float8)",
  "routine:$extension:cube.cube(pg_catalog._float8)",
  "routine:$extension:cube.cube(pg_catalog.float8,pg_catalog.float8)",
  "routine:$extension:cube.cube(pg_catalog.float8)",
  "routine:$extension:cube.distance_chebyshev($extension:cube.cube,$extension:cube.cube)",
  "routine:$extension:cube.distance_taxicab($extension:cube.cube,$extension:cube.cube)",
] as const;
export const cubeOrdinaryProofCase = {
  id: "cube.native-ordinary",
  file,
  title: "cube.all45OrdinaryNativeIdentitiesAndNull",
  gate: "database",
  families: [cubeProofFamily],
  claims: cubeOrdinaryProofMembers.map((member) => ({
    family: cubeProofFamily,
    member,
    scenario: "native-independent-sql-value-and-strict-null",
  })),
} satisfies ExtensionProofCase;
export const cubeBinaryProofCase = {
  id: "cube.native-binary",
  file,
  title: "cube.nativeBinaryOracleDimensionsNonfiniteAndConstructorArrays",
  gate: "database",
  families: [cubeProofFamily],
  claims: [
    {
      family: cubeProofFamily,
      member: "type:$extension:cube.cube",
      scenario: "native-text-and-binary-wire-dimensions-nonfinite-and-array-constructors",
    },
  ],
} satisfies ExtensionProofCase;
export const cubeSchemaIndexProofCase = {
  id: "cube.native-schema-indexes",
  file,
  title: "cube.nativeFieldsArraysDefaultsQuotedClassSnapshotsAndIndexCallbacks",
  gate: "database",
  families: [cubeProofFamily],
  claims: [
    "type:$extension:cube._cube",
    "opclass:$extension:cube.cube_ops/btree",
    "opclass:$extension:cube.gist_cube_ops/gist",
  ].map((member) => ({
    family: cubeProofFamily,
    member,
    scenario: "native-field-array-default-snapshot-btree-gist-split-and-knn-oracles",
  })),
} satisfies ExtensionProofCase;
export const cubeCompositionProofCase = {
  id: "cube.native-composition",
  file,
  title: "cube.nativeErrorsRollbackAndSQLComposition",
  gate: "database",
  families: [cubeProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const cubeDatabaseProofCases = [
  cubeOrdinaryProofCase,
  cubeBinaryProofCase,
  cubeSchemaIndexProofCase,
  cubeCompositionProofCase,
] satisfies ExtensionProofCase[];
export const cubeDatabaseFixtureCount = 4;
export const cubeDatabaseRoleCount = 0;

type MemberProof = Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"][number];
// These exact rows come from the pinned cube manifest. Each transfer still needs its
// declared parent witness and independently captured native manifest at verification.
const cubeInternalRelations = {
  'function of access method:function 1 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree':
    {
      from: "opclass:$extension:cube.cube_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.cube_ops/btree",
        row: {
          kind: "procedure",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          number: 1,
          procedure: "$extension:cube.cube_cmp($extension:cube.cube,$extension:cube.cube)",
        },
      },
    },
  'function of access method:function 1 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist':
    {
      from: "opclass:$extension:cube.gist_cube_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.gist_cube_ops/gist",
        row: {
          kind: "procedure",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          number: 1,
          procedure:
            "$extension:cube.g_cube_consistent(pg_catalog.internal,$extension:cube.cube,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
        },
      },
    },
  'function of access method:function 2 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist':
    {
      from: "opclass:$extension:cube.gist_cube_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.gist_cube_ops/gist",
        row: {
          kind: "procedure",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          number: 2,
          procedure: "$extension:cube.g_cube_union(pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  'function of access method:function 5 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist':
    {
      from: "opclass:$extension:cube.gist_cube_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.gist_cube_ops/gist",
        row: {
          kind: "procedure",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          number: 5,
          procedure: "$extension:cube.g_cube_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  'function of access method:function 6 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist':
    {
      from: "opclass:$extension:cube.gist_cube_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.gist_cube_ops/gist",
        row: {
          kind: "procedure",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          number: 6,
          procedure: "$extension:cube.g_cube_picksplit(pg_catalog.internal,pg_catalog.internal)",
        },
      },
    },
  'function of access method:function 7 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist':
    {
      from: "opclass:$extension:cube.gist_cube_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.gist_cube_ops/gist",
        row: {
          kind: "procedure",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          number: 7,
          procedure: "$extension:cube.g_cube_same($extension:cube.cube,$extension:cube.cube,pg_catalog.internal)",
        },
      },
    },
  'function of access method:function 8 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist':
    {
      from: "opclass:$extension:cube.gist_cube_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.gist_cube_ops/gist",
        row: {
          kind: "procedure",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          number: 8,
          procedure:
            "$extension:cube.g_cube_distance(pg_catalog.internal,$extension:cube.cube,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
        },
      },
    },
  'operator of access method:operator 1 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree':
    {
      from: "opclass:$extension:cube.cube_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.cube_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          strategy: 1,
          purpose: "s",
          operator: "$extension:cube.<($extension:cube.cube,$extension:cube.cube)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 15 ("$extension:cube".cube, integer) of "$extension:cube".gist_cube_ops USING gist':
    {
      from: "opclass:$extension:cube.gist_cube_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.gist_cube_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "pg_catalog",
            name: "int4",
          },
          strategy: 15,
          purpose: "o",
          operator: "$extension:cube.~>($extension:cube.cube,pg_catalog.int4)",
          sortFamily: "pg_catalog.float_ops/btree",
        },
      },
    },
  'operator of access method:operator 16 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist':
    {
      from: "opclass:$extension:cube.gist_cube_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.gist_cube_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          strategy: 16,
          purpose: "o",
          operator: "$extension:cube.<#>($extension:cube.cube,$extension:cube.cube)",
          sortFamily: "pg_catalog.float_ops/btree",
        },
      },
    },
  'operator of access method:operator 17 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist':
    {
      from: "opclass:$extension:cube.gist_cube_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.gist_cube_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          strategy: 17,
          purpose: "o",
          operator: "$extension:cube.<->($extension:cube.cube,$extension:cube.cube)",
          sortFamily: "pg_catalog.float_ops/btree",
        },
      },
    },
  'operator of access method:operator 18 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist':
    {
      from: "opclass:$extension:cube.gist_cube_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.gist_cube_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          strategy: 18,
          purpose: "o",
          operator: "$extension:cube.<=>($extension:cube.cube,$extension:cube.cube)",
          sortFamily: "pg_catalog.float_ops/btree",
        },
      },
    },
  'operator of access method:operator 2 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree':
    {
      from: "opclass:$extension:cube.cube_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.cube_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          strategy: 2,
          purpose: "s",
          operator: "$extension:cube.<=($extension:cube.cube,$extension:cube.cube)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 3 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree':
    {
      from: "opclass:$extension:cube.cube_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.cube_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          strategy: 3,
          purpose: "s",
          operator: "$extension:cube.=($extension:cube.cube,$extension:cube.cube)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 3 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist':
    {
      from: "opclass:$extension:cube.gist_cube_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.gist_cube_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          strategy: 3,
          purpose: "s",
          operator: "$extension:cube.&&($extension:cube.cube,$extension:cube.cube)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 4 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree':
    {
      from: "opclass:$extension:cube.cube_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.cube_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          strategy: 4,
          purpose: "s",
          operator: "$extension:cube.>=($extension:cube.cube,$extension:cube.cube)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 5 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree':
    {
      from: "opclass:$extension:cube.cube_ops/btree",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.cube_ops/btree",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          strategy: 5,
          purpose: "s",
          operator: "$extension:cube.>($extension:cube.cube,$extension:cube.cube)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 6 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist':
    {
      from: "opclass:$extension:cube.gist_cube_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.gist_cube_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          strategy: 6,
          purpose: "s",
          operator: "$extension:cube.=($extension:cube.cube,$extension:cube.cube)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 7 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist':
    {
      from: "opclass:$extension:cube.gist_cube_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.gist_cube_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          strategy: 7,
          purpose: "s",
          operator: "$extension:cube.@>($extension:cube.cube,$extension:cube.cube)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 8 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist':
    {
      from: "opclass:$extension:cube.gist_cube_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:cube.gist_cube_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "$extension:cube",
            name: "cube",
          },
          right: {
            namespace: "$extension:cube",
            name: "cube",
          },
          strategy: 8,
          purpose: "s",
          operator: "$extension:cube.<@($extension:cube.cube,$extension:cube.cube)",
          sortFamily: null,
        },
      },
    },
  "opfamily:$extension:cube.cube_ops/btree": {
    from: "opclass:$extension:cube.cube_ops/btree",
    relation: {
      kind: "opclass-family",
    },
  },
  "opfamily:$extension:cube.gist_cube_ops/gist": {
    from: "opclass:$extension:cube.gist_cube_ops/gist",
    relation: {
      kind: "opclass-family",
    },
  },
  "routine:$extension:cube.cube_in(pg_catalog.cstring)": {
    from: "type:$extension:cube.cube",
    relation: {
      kind: "type-routine",
      slot: "input",
    },
  },
  "routine:$extension:cube.cube_out($extension:cube.cube)": {
    from: "type:$extension:cube.cube",
    relation: {
      kind: "type-routine",
      slot: "output",
    },
  },
  "routine:$extension:cube.cube_recv(pg_catalog.internal)": {
    from: "type:$extension:cube.cube",
    relation: {
      kind: "type-routine",
      slot: "receive",
    },
  },
  "routine:$extension:cube.g_cube_consistent(pg_catalog.internal,$extension:cube.cube,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)":
    {
      from: "opclass:$extension:cube.gist_cube_ops/gist",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:cube.gist_cube_ops/gist",
        left: {
          namespace: "$extension:cube",
          name: "cube",
        },
        right: {
          namespace: "$extension:cube",
          name: "cube",
        },
        number: 1,
        procedure:
          "$extension:cube.g_cube_consistent(pg_catalog.internal,$extension:cube.cube,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
      },
    },
  "routine:$extension:cube.g_cube_distance(pg_catalog.internal,$extension:cube.cube,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)":
    {
      from: "opclass:$extension:cube.gist_cube_ops/gist",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:cube.gist_cube_ops/gist",
        left: {
          namespace: "$extension:cube",
          name: "cube",
        },
        right: {
          namespace: "$extension:cube",
          name: "cube",
        },
        number: 8,
        procedure:
          "$extension:cube.g_cube_distance(pg_catalog.internal,$extension:cube.cube,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
      },
    },
  "routine:$extension:cube.g_cube_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)": {
    from: "opclass:$extension:cube.gist_cube_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:cube.gist_cube_ops/gist",
      left: {
        namespace: "$extension:cube",
        name: "cube",
      },
      right: {
        namespace: "$extension:cube",
        name: "cube",
      },
      number: 5,
      procedure: "$extension:cube.g_cube_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    },
  },
  "routine:$extension:cube.g_cube_picksplit(pg_catalog.internal,pg_catalog.internal)": {
    from: "opclass:$extension:cube.gist_cube_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:cube.gist_cube_ops/gist",
      left: {
        namespace: "$extension:cube",
        name: "cube",
      },
      right: {
        namespace: "$extension:cube",
        name: "cube",
      },
      number: 6,
      procedure: "$extension:cube.g_cube_picksplit(pg_catalog.internal,pg_catalog.internal)",
    },
  },
  "routine:$extension:cube.g_cube_same($extension:cube.cube,$extension:cube.cube,pg_catalog.internal)": {
    from: "opclass:$extension:cube.gist_cube_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:cube.gist_cube_ops/gist",
      left: {
        namespace: "$extension:cube",
        name: "cube",
      },
      right: {
        namespace: "$extension:cube",
        name: "cube",
      },
      number: 7,
      procedure: "$extension:cube.g_cube_same($extension:cube.cube,$extension:cube.cube,pg_catalog.internal)",
    },
  },
  "routine:$extension:cube.g_cube_union(pg_catalog.internal,pg_catalog.internal)": {
    from: "opclass:$extension:cube.gist_cube_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:cube.gist_cube_ops/gist",
      left: {
        namespace: "$extension:cube",
        name: "cube",
      },
      right: {
        namespace: "$extension:cube",
        name: "cube",
      },
      number: 2,
      procedure: "$extension:cube.g_cube_union(pg_catalog.internal,pg_catalog.internal)",
    },
  },
} satisfies Record<string, { from: string; relation: MemberProof["transfers"][number]["relation"] }>;
export const cubeMemberProofs: MemberProof[] = cubeAnnotations.map((annotation) => {
  const direct = cubeDatabaseProofCases.flatMap((definition) =>
    definition.claims
      .filter((claim) => claim.member === annotation.id)
      .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
  );
  const edge = Object.entries(cubeInternalRelations).find(([id]) => id === annotation.id)?.[1];
  const parent =
    edge &&
    cubeDatabaseProofCases.flatMap((definition) =>
      definition.claims
        .filter((claim) => claim.member === edge.from)
        .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
    );
  if (annotation.disposition === "internal" && (!edge || !parent || parent.length !== 1))
    throw new Error(`Missing exact Cube internal parent: ${annotation.id}`);
  if (annotation.disposition !== "internal" && direct.length !== 1)
    throw new Error(`Missing executed Cube member case: ${annotation.id}`);
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
              "Exact captured Cube graph edge; native binary or indexed-versus-sequential parent oracle executes this backend attachment.",
          }))
        : [],
  };
});
