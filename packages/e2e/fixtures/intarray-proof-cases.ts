import type {
  ExtensionProofCase,
  ExtensionProofFamily,
  ExtensionProofRelation,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const intarrayProofFamily = {
  extension: "intarray",
  version: "1.5",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "c71054bd4b390e4e0457bb83bbaeaaef426319c14d6f0563fecfb8758d3224f2",
} satisfies ExtensionProofFamily;
export const intarrayProofSchema = 'custom"int日';
const array = "pg_catalog._int4";
const queryType = "$extension:intarray.query_int";
const claim = (member: string, scenario: string) => ({ family: intarrayProofFamily, member, scenario });
/** One claim per callable member; every claim is witnessed against PostgreSQL's own SQL result. */
export const intarrayNativeProofClaims = [
  claim("type:$extension:intarray.query_int", "native-query-int-parser-normalization-and-array-io"),
  claim("type:$extension:intarray._query_int", "native-query-int-array-bounds-null-and-normalized-io"),
  claim(`operator:$extension:intarray.-(${array},${array})`, "sorted-distinct-difference-and-strict-null"),
  claim(`operator:$extension:intarray.-(${array},pg_catalog.int4)`, "remove-every-occurrence-keeps-bounds"),
  claim(`operator:$extension:intarray.@@(${array},${queryType})`, "query-int-match-and-strict-null"),
  claim(`operator:$extension:intarray.@>(${array},${array})`, "containment-empty-and-strict-null"),
  claim(`operator:$extension:intarray.&(${array},${array})`, "sorted-distinct-intersection"),
  claim(`operator:$extension:intarray.&&(${array},${array})`, "overlap-empty-false-and-strict-null"),
  claim(`operator:$extension:intarray.#(,${array})`, "prefix-count-multidimensional"),
  claim(`operator:$extension:intarray.#(${array},pg_catalog.int4)`, "first-position-or-zero"),
  claim(`operator:$extension:intarray.+(${array},${array})`, "unsorted-concatenation"),
  claim(`operator:$extension:intarray.+(${array},pg_catalog.int4)`, "push-element-flattens-and-rebases"),
  claim(`operator:$extension:intarray.<@(${array},${array})`, "contained-by-and-strict-null"),
  claim(`operator:$extension:intarray.|(${array},${array})`, "sorted-distinct-union"),
  claim(`operator:$extension:intarray.|(${array},pg_catalog.int4)`, "sorted-distinct-element-union"),
  claim(`operator:$extension:intarray.~~(${queryType},${array})`, "commuted-query-int-match"),
  claim(`routine:$extension:intarray._int_contained(${array},${array})`, "contained-procedure"),
  claim(`routine:$extension:intarray._int_contains(${array},${array})`, "contains-procedure"),
  claim(`routine:$extension:intarray._int_different(${array},${array})`, "duplicate-count-inequality"),
  claim(`routine:$extension:intarray._int_inter(${array},${array})`, "intersection-procedure"),
  claim(`routine:$extension:intarray._int_overlap(${array},${array})`, "overlap-procedure"),
  claim(
    `routine:$extension:intarray._int_same(${array},${array})`,
    "order-insensitive-equality-keeps-duplicate-counts",
  ),
  claim(`routine:$extension:intarray._int_union(${array},${array})`, "union-procedure"),
  claim(`routine:$extension:intarray.boolop(${array},${queryType})`, "query-int-procedure"),
  claim(`routine:$extension:intarray.rboolop(${queryType},${array})`, "commuted-query-int-procedure"),
  claim(`routine:$extension:intarray.icount(${array})`, "count-includes-null-elements"),
  claim(`routine:$extension:intarray.idx(${array},pg_catalog.int4)`, "position-procedure"),
  claim(`routine:$extension:intarray.intarray_del_elem(${array},pg_catalog.int4)`, "remove-procedure"),
  claim(`routine:$extension:intarray.intarray_push_array(${array},${array})`, "concatenate-procedure"),
  claim(`routine:$extension:intarray.intarray_push_elem(${array},pg_catalog.int4)`, "push-procedure"),
  claim(`routine:$extension:intarray.intset_subtract(${array},${array})`, "difference-procedure"),
  claim(`routine:$extension:intarray.intset_union_elem(${array},pg_catalog.int4)`, "element-union-procedure"),
  claim("routine:$extension:intarray.intset(pg_catalog.int4)", "one-element-array"),
  claim(`routine:$extension:intarray.querytree(${queryType})`, "native-not-implemented-error"),
  claim(`routine:$extension:intarray.sort_asc(${array})`, "ascending-sort"),
  claim(`routine:$extension:intarray.sort_desc(${array})`, "descending-sort"),
  claim(`routine:$extension:intarray.sort(${array},pg_catalog.text)`, "directed-sort-case-insensitive"),
  claim(`routine:$extension:intarray.sort(${array})`, "default-sort-keeps-shape"),
  claim(`routine:$extension:intarray.subarray(${array},pg_catalog.int4,pg_catalog.int4)`, "negative-length-slice"),
  claim(`routine:$extension:intarray.subarray(${array},pg_catalog.int4)`, "negative-start-slice"),
  claim(`routine:$extension:intarray.uniq(${array})`, "adjacent-duplicates-only"),
];
export const intarrayNativeProofCase = {
  id: "intarray.native-semantics",
  file: "packages/e2e/integration/extensions-intarray.test.ts",
  title: "intarray all thirty-nine callable members decode and compose inside a Kello transaction",
  gate: "database",
  families: [intarrayProofFamily],
  claims: intarrayNativeProofClaims,
} satisfies ExtensionProofCase;
export const intarrayIndexProofClaims = [
  claim("opclass:$extension:intarray.gin__int_ops/gin", "gin-bitmap-index-serves-containment-and-query"),
  claim("opclass:$extension:intarray.gist__int_ops/gist", "default-gist-numranges-index-serves-overlap"),
  claim("opclass:$extension:intarray.gist__intbig_ops/gist", "signature-gist-siglen-index-serves-containment"),
];
export const intarrayIndexProofCase = {
  id: "intarray.index-classes",
  file: "packages/e2e/integration/extensions-intarray.test.ts",
  title: "intarray operator classes build with exact options and serve indexed matches",
  gate: "database",
  families: [intarrayProofFamily],
  claims: intarrayIndexProofClaims,
} satisfies ExtensionProofCase;
export const intarrayEstimatorProofClaims = [
  claim(`operator:$extension:intarray.&&(${array},${array})`, "native-where-restrict-planning-and-filtered-results"),
  claim(`operator:$extension:intarray.@>(${array},${array})`, "native-where-restrict-planning-and-filtered-results"),
  claim(`operator:$extension:intarray.<@(${array},${array})`, "native-where-restrict-planning-and-filtered-results"),
  claim(
    `operator:$extension:intarray.@@(${array},${queryType})`,
    "native-where-restrict-planning-and-filtered-results",
  ),
  claim(`operator:$extension:intarray.&&(${array},${array})`, "native-join-planning-and-matched-pairs"),
  claim(`operator:$extension:intarray.@>(${array},${array})`, "native-join-planning-and-matched-pairs"),
  claim(`operator:$extension:intarray.<@(${array},${array})`, "native-join-planning-and-matched-pairs"),
];
export const intarrayEstimatorProofCase = {
  id: "intarray.operator-estimators",
  file: "packages/e2e/integration/extensions-intarray.test.ts",
  title: "intarray captured restriction and join estimators plan native WHERE and JOIN predicates",
  gate: "database",
  families: [intarrayProofFamily],
  claims: intarrayEstimatorProofClaims,
} satisfies ExtensionProofCase;
export const intarrayDatabaseProofCases = [intarrayNativeProofCase, intarrayIndexProofCase, intarrayEstimatorProofCase];
export const intarrayUnitProofCase = {
  id: "intarray.unit-contracts",
  file: "packages/tests/unit/extensions-intarray.test.ts",
  title: "intarray exact pin, member dispositions, query_int grammar and index contracts",
  gate: "unit",
  families: [intarrayProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const intarrayTypesProofCase = {
  id: "intarray.types-contracts",
  file: "packages/tests/types/extensions-intarray.test-d.ts",
  title: "intarray exact overloads, nullable arrays and query_int declarations",
  gate: "types",
  families: [intarrayProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const intarrayGenerationProofCase = {
  id: "intarray.generation-contracts",
  file: "packages/e2e/integration/extension-intarray-codegen.test.ts",
  title: "intarray first load and disk generation bind exact selected and component APIs",
  gate: "generation",
  families: [intarrayProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const intarrayConsumerProofCase = {
  id: "intarray.consumer-contracts",
  file: "packages/e2e/integration/packed-intarray.test.ts",
  title: "intarray isolated packed overloads, native RPC and selected bundles",
  gate: "consumer",
  families: [intarrayProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const intarrayProofCases = [
  ...intarrayDatabaseProofCases,
  intarrayUnitProofCase,
  intarrayTypesProofCase,
  intarrayGenerationProofCase,
  intarrayConsumerProofCase,
];

/** Exact captured catalog edges; the host verifier re-matches every row before allowing transfer. */
export const intarrayInternalRelations = {
  "routine:$extension:intarray._int_overlap_sel(pg_catalog.internal,pg_catalog.oid,pg_catalog.internal,pg_catalog.int4)":
    {
      from: `operator:$extension:intarray.&&(${array},${array})`,
      relation: { kind: "operator-estimator", slot: "restrict" },
    },
  "routine:$extension:intarray._int_overlap_joinsel(pg_catalog.internal,pg_catalog.oid,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal)":
    {
      from: `operator:$extension:intarray.&&(${array},${array})`,
      relation: { kind: "operator-estimator", slot: "join" },
    },
  "routine:$extension:intarray._int_contains_sel(pg_catalog.internal,pg_catalog.oid,pg_catalog.internal,pg_catalog.int4)":
    {
      from: `operator:$extension:intarray.@>(${array},${array})`,
      relation: { kind: "operator-estimator", slot: "restrict" },
    },
  "routine:$extension:intarray._int_contains_joinsel(pg_catalog.internal,pg_catalog.oid,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal)":
    {
      from: `operator:$extension:intarray.@>(${array},${array})`,
      relation: { kind: "operator-estimator", slot: "join" },
    },
  "routine:$extension:intarray._int_contained_sel(pg_catalog.internal,pg_catalog.oid,pg_catalog.internal,pg_catalog.int4)":
    {
      from: `operator:$extension:intarray.<@(${array},${array})`,
      relation: { kind: "operator-estimator", slot: "restrict" },
    },
  "routine:$extension:intarray._int_contained_joinsel(pg_catalog.internal,pg_catalog.oid,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal)":
    {
      from: `operator:$extension:intarray.<@(${array},${array})`,
      relation: { kind: "operator-estimator", slot: "join" },
    },
  "routine:$extension:intarray._int_matchsel(pg_catalog.internal,pg_catalog.oid,pg_catalog.internal,pg_catalog.int4)": {
    from: `operator:$extension:intarray.@@(${array},${queryType})`,
    relation: { kind: "operator-estimator", slot: "restrict" },
  },
  "opfamily:$extension:intarray.gin__int_ops/gin": {
    from: "opclass:$extension:intarray.gin__int_ops/gin",
    relation: {
      kind: "opclass-family",
    },
  },
  'function of access method:function 1 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin': {
    from: "opclass:$extension:intarray.gin__int_ops/gin",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gin__int_ops/gin",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 1,
        procedure: "pg_catalog.btint4cmp(pg_catalog.int4,pg_catalog.int4)",
      },
    },
  },
  'function of access method:function 2 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin': {
    from: "opclass:$extension:intarray.gin__int_ops/gin",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gin__int_ops/gin",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 2,
        procedure: "pg_catalog.ginarrayextract(pg_catalog.anyarray,pg_catalog.internal,pg_catalog.internal)",
      },
    },
  },
  'function of access method:function 3 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin': {
    from: "opclass:$extension:intarray.gin__int_ops/gin",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gin__int_ops/gin",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 3,
        procedure:
          "$extension:intarray.ginint4_queryextract(pg_catalog._int4,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.ginint4_queryextract(pg_catalog._int4,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)":
    {
      from: "opclass:$extension:intarray.gin__int_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:intarray.gin__int_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 3,
        procedure:
          "$extension:intarray.ginint4_queryextract(pg_catalog._int4,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
      },
    },
  'function of access method:function 4 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin': {
    from: "opclass:$extension:intarray.gin__int_ops/gin",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gin__int_ops/gin",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 4,
        procedure:
          "$extension:intarray.ginint4_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog._int4,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.ginint4_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog._int4,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)":
    {
      from: "opclass:$extension:intarray.gin__int_ops/gin",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:intarray.gin__int_ops/gin",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 4,
        procedure:
          "$extension:intarray.ginint4_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog._int4,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
      },
    },
  'operator of access method:operator 20 (integer[], "$extension:intarray".query_int) of "$extension:intarray".gin__int_ops USING gin':
    {
      from: "opclass:$extension:intarray.gin__int_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:intarray.gin__int_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "_int4",
          },
          right: {
            namespace: "$extension:intarray",
            name: "query_int",
          },
          strategy: 20,
          purpose: "s",
          operator: "$extension:intarray.@@(pg_catalog._int4,$extension:intarray.query_int)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 3 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin': {
    from: "opclass:$extension:intarray.gin__int_ops/gin",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gin__int_ops/gin",
      row: {
        kind: "operator",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        strategy: 3,
        purpose: "s",
        operator: "$extension:intarray.&&(pg_catalog._int4,pg_catalog._int4)",
        sortFamily: null,
      },
    },
  },
  'operator of access method:operator 7 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin': {
    from: "opclass:$extension:intarray.gin__int_ops/gin",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gin__int_ops/gin",
      row: {
        kind: "operator",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        strategy: 7,
        purpose: "s",
        operator: "$extension:intarray.@>(pg_catalog._int4,pg_catalog._int4)",
        sortFamily: null,
      },
    },
  },
  'operator of access method:operator 8 (integer[], integer[]) of "$extension:intarray".gin__int_ops USING gin': {
    from: "opclass:$extension:intarray.gin__int_ops/gin",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gin__int_ops/gin",
      row: {
        kind: "operator",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        strategy: 8,
        purpose: "s",
        operator: "$extension:intarray.<@(pg_catalog._int4,pg_catalog._int4)",
        sortFamily: null,
      },
    },
  },
  'operator of access method:operator 6 (pg_catalog.anyarray, pg_catalog.anyarray) of "$extension:intarray".gin__int_ops USING gin':
    {
      from: "opclass:$extension:intarray.gin__int_ops/gin",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:intarray.gin__int_ops/gin",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "anyarray",
          },
          right: {
            namespace: "pg_catalog",
            name: "anyarray",
          },
          strategy: 6,
          purpose: "s",
          operator: "pg_catalog.=(pg_catalog.anyarray,pg_catalog.anyarray)",
          sortFamily: null,
        },
      },
    },
  "opfamily:$extension:intarray.gist__int_ops/gist": {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "opclass-family",
    },
  },
  'function of access method:function 1 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist': {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__int_ops/gist",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 1,
        procedure:
          "$extension:intarray.g_int_consistent(pg_catalog.internal,pg_catalog._int4,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.g_int_consistent(pg_catalog.internal,pg_catalog._int4,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)":
    {
      from: "opclass:$extension:intarray.gist__int_ops/gist",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:intarray.gist__int_ops/gist",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 1,
        procedure:
          "$extension:intarray.g_int_consistent(pg_catalog.internal,pg_catalog._int4,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
      },
    },
  'function of access method:function 10 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist': {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__int_ops/gist",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 10,
        procedure: "$extension:intarray.g_int_options(pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.g_int_options(pg_catalog.internal)": {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:intarray.gist__int_ops/gist",
      left: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      right: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      number: 10,
      procedure: "$extension:intarray.g_int_options(pg_catalog.internal)",
    },
  },
  'function of access method:function 2 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist': {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__int_ops/gist",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 2,
        procedure: "$extension:intarray.g_int_union(pg_catalog.internal,pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.g_int_union(pg_catalog.internal,pg_catalog.internal)": {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:intarray.gist__int_ops/gist",
      left: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      right: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      number: 2,
      procedure: "$extension:intarray.g_int_union(pg_catalog.internal,pg_catalog.internal)",
    },
  },
  'function of access method:function 3 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist': {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__int_ops/gist",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 3,
        procedure: "$extension:intarray.g_int_compress(pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.g_int_compress(pg_catalog.internal)": {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:intarray.gist__int_ops/gist",
      left: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      right: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      number: 3,
      procedure: "$extension:intarray.g_int_compress(pg_catalog.internal)",
    },
  },
  'function of access method:function 4 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist': {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__int_ops/gist",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 4,
        procedure: "$extension:intarray.g_int_decompress(pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.g_int_decompress(pg_catalog.internal)": {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:intarray.gist__int_ops/gist",
      left: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      right: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      number: 4,
      procedure: "$extension:intarray.g_int_decompress(pg_catalog.internal)",
    },
  },
  'function of access method:function 5 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist': {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__int_ops/gist",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 5,
        procedure: "$extension:intarray.g_int_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.g_int_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)": {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:intarray.gist__int_ops/gist",
      left: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      right: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      number: 5,
      procedure: "$extension:intarray.g_int_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    },
  },
  'function of access method:function 6 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist': {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__int_ops/gist",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 6,
        procedure: "$extension:intarray.g_int_picksplit(pg_catalog.internal,pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.g_int_picksplit(pg_catalog.internal,pg_catalog.internal)": {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:intarray.gist__int_ops/gist",
      left: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      right: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      number: 6,
      procedure: "$extension:intarray.g_int_picksplit(pg_catalog.internal,pg_catalog.internal)",
    },
  },
  'function of access method:function 7 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist': {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__int_ops/gist",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 7,
        procedure: "$extension:intarray.g_int_same(pg_catalog._int4,pg_catalog._int4,pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.g_int_same(pg_catalog._int4,pg_catalog._int4,pg_catalog.internal)": {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:intarray.gist__int_ops/gist",
      left: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      right: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      number: 7,
      procedure: "$extension:intarray.g_int_same(pg_catalog._int4,pg_catalog._int4,pg_catalog.internal)",
    },
  },
  'operator of access method:operator 20 (integer[], "$extension:intarray".query_int) of "$extension:intarray".gist__int_ops USING gist':
    {
      from: "opclass:$extension:intarray.gist__int_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:intarray.gist__int_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "_int4",
          },
          right: {
            namespace: "$extension:intarray",
            name: "query_int",
          },
          strategy: 20,
          purpose: "s",
          operator: "$extension:intarray.@@(pg_catalog._int4,$extension:intarray.query_int)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 3 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist': {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__int_ops/gist",
      row: {
        kind: "operator",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        strategy: 3,
        purpose: "s",
        operator: "$extension:intarray.&&(pg_catalog._int4,pg_catalog._int4)",
        sortFamily: null,
      },
    },
  },
  'operator of access method:operator 7 (integer[], integer[]) of "$extension:intarray".gist__int_ops USING gist': {
    from: "opclass:$extension:intarray.gist__int_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__int_ops/gist",
      row: {
        kind: "operator",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        strategy: 7,
        purpose: "s",
        operator: "$extension:intarray.@>(pg_catalog._int4,pg_catalog._int4)",
        sortFamily: null,
      },
    },
  },
  'operator of access method:operator 6 (pg_catalog.anyarray, pg_catalog.anyarray) of "$extension:intarray".gist__int_ops USING gist':
    {
      from: "opclass:$extension:intarray.gist__int_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:intarray.gist__int_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "anyarray",
          },
          right: {
            namespace: "pg_catalog",
            name: "anyarray",
          },
          strategy: 6,
          purpose: "s",
          operator: "pg_catalog.=(pg_catalog.anyarray,pg_catalog.anyarray)",
          sortFamily: null,
        },
      },
    },
  "opfamily:$extension:intarray.gist__intbig_ops/gist": {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "opclass-family",
    },
  },
  'function of access method:function 1 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist': {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 1,
        procedure:
          "$extension:intarray.g_intbig_consistent(pg_catalog.internal,pg_catalog._int4,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.g_intbig_consistent(pg_catalog.internal,pg_catalog._int4,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)":
    {
      from: "opclass:$extension:intarray.gist__intbig_ops/gist",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 1,
        procedure:
          "$extension:intarray.g_intbig_consistent(pg_catalog.internal,pg_catalog._int4,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
      },
    },
  'function of access method:function 10 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist': {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 10,
        procedure: "$extension:intarray.g_intbig_options(pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.g_intbig_options(pg_catalog.internal)": {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
      left: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      right: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      number: 10,
      procedure: "$extension:intarray.g_intbig_options(pg_catalog.internal)",
    },
  },
  'function of access method:function 2 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist': {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 2,
        procedure: "$extension:intarray.g_intbig_union(pg_catalog.internal,pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.g_intbig_union(pg_catalog.internal,pg_catalog.internal)": {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
      left: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      right: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      number: 2,
      procedure: "$extension:intarray.g_intbig_union(pg_catalog.internal,pg_catalog.internal)",
    },
  },
  'function of access method:function 3 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist': {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 3,
        procedure: "$extension:intarray.g_intbig_compress(pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.g_intbig_compress(pg_catalog.internal)": {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
      left: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      right: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      number: 3,
      procedure: "$extension:intarray.g_intbig_compress(pg_catalog.internal)",
    },
  },
  'function of access method:function 4 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist': {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 4,
        procedure: "$extension:intarray.g_intbig_decompress(pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.g_intbig_decompress(pg_catalog.internal)": {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
      left: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      right: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      number: 4,
      procedure: "$extension:intarray.g_intbig_decompress(pg_catalog.internal)",
    },
  },
  'function of access method:function 5 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist': {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 5,
        procedure: "$extension:intarray.g_intbig_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.g_intbig_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)": {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
      left: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      right: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      number: 5,
      procedure: "$extension:intarray.g_intbig_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    },
  },
  'function of access method:function 6 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist': {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 6,
        procedure: "$extension:intarray.g_intbig_picksplit(pg_catalog.internal,pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.g_intbig_picksplit(pg_catalog.internal,pg_catalog.internal)": {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "family-procedure",
      family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
      left: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      right: {
        namespace: "pg_catalog",
        name: "_int4",
      },
      number: 6,
      procedure: "$extension:intarray.g_intbig_picksplit(pg_catalog.internal,pg_catalog.internal)",
    },
  },
  'function of access method:function 7 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist': {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
      row: {
        kind: "procedure",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 7,
        procedure:
          "$extension:intarray.g_intbig_same($extension:intarray.intbig_gkey,$extension:intarray.intbig_gkey,pg_catalog.internal)",
      },
    },
  },
  "routine:$extension:intarray.g_intbig_same($extension:intarray.intbig_gkey,$extension:intarray.intbig_gkey,pg_catalog.internal)":
    {
      from: "opclass:$extension:intarray.gist__intbig_ops/gist",
      relation: {
        kind: "family-procedure",
        family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        number: 7,
        procedure:
          "$extension:intarray.g_intbig_same($extension:intarray.intbig_gkey,$extension:intarray.intbig_gkey,pg_catalog.internal)",
      },
    },
  'operator of access method:operator 20 (integer[], "$extension:intarray".query_int) of "$extension:intarray".gist__intbig_ops USING gist':
    {
      from: "opclass:$extension:intarray.gist__intbig_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "_int4",
          },
          right: {
            namespace: "$extension:intarray",
            name: "query_int",
          },
          strategy: 20,
          purpose: "s",
          operator: "$extension:intarray.@@(pg_catalog._int4,$extension:intarray.query_int)",
          sortFamily: null,
        },
      },
    },
  'operator of access method:operator 3 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist': {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
      row: {
        kind: "operator",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        strategy: 3,
        purpose: "s",
        operator: "$extension:intarray.&&(pg_catalog._int4,pg_catalog._int4)",
        sortFamily: null,
      },
    },
  },
  'operator of access method:operator 7 (integer[], integer[]) of "$extension:intarray".gist__intbig_ops USING gist': {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
      row: {
        kind: "operator",
        left: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        right: {
          namespace: "pg_catalog",
          name: "_int4",
        },
        strategy: 7,
        purpose: "s",
        operator: "$extension:intarray.@>(pg_catalog._int4,pg_catalog._int4)",
        sortFamily: null,
      },
    },
  },
  'operator of access method:operator 6 (pg_catalog.anyarray, pg_catalog.anyarray) of "$extension:intarray".gist__intbig_ops USING gist':
    {
      from: "opclass:$extension:intarray.gist__intbig_ops/gist",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:intarray.gist__intbig_ops/gist",
        row: {
          kind: "operator",
          left: {
            namespace: "pg_catalog",
            name: "anyarray",
          },
          right: {
            namespace: "pg_catalog",
            name: "anyarray",
          },
          strategy: 6,
          purpose: "s",
          operator: "pg_catalog.=(pg_catalog.anyarray,pg_catalog.anyarray)",
          sortFamily: null,
        },
      },
    },
  "type:$extension:intarray.intbig_gkey": {
    from: "opclass:$extension:intarray.gist__intbig_ops/gist",
    relation: {
      kind: "opclass-storage",
    },
  },
  "type:$extension:intarray._intbig_gkey": {
    from: "type:$extension:intarray.intbig_gkey",
    relation: {
      kind: "array-element",
    },
  },
  "routine:$extension:intarray._intbig_in(pg_catalog.cstring)": {
    from: "type:$extension:intarray.intbig_gkey",
    relation: {
      kind: "type-routine",
      slot: "input",
    },
  },
  "routine:$extension:intarray._intbig_out($extension:intarray.intbig_gkey)": {
    from: "type:$extension:intarray.intbig_gkey",
    relation: {
      kind: "type-routine",
      slot: "output",
    },
  },
  "routine:$extension:intarray.bqarr_in(pg_catalog.cstring)": {
    from: "type:$extension:intarray.query_int",
    relation: {
      kind: "type-routine",
      slot: "input",
    },
  },
  "routine:$extension:intarray.bqarr_out($extension:intarray.query_int)": {
    from: "type:$extension:intarray.query_int",
    relation: {
      kind: "type-routine",
      slot: "output",
    },
  },
} satisfies Record<string, { from: string; relation: ExtensionProofRelation }>;
