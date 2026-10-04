export const pgroutingAnnotations = [
  {
    id: "routine:$extension:pgrouting._pgr_alphashape(pg_catalog.text,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "0",
      resultColumns: [
        {
          name: "seq1",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "textgeom",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
      ],
      nativeLimitation:
        "Upstream src/alpha_shape/alphaShape.cpp build_best_alpha dereferences min_element on empty triangle maps. Auto-alpha on a four-point square produced a native backend SIGSEGV. Public calls are rejected before SQL construction pending verified native repair; internal native calls are not re-probed. No JS algorithm or input cap.",
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_array_reverse(pg_catalog.anyarray)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_articulationpoints(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0, false, true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_astar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_bdastar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_bddijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_bellmanford(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_betweennesscentrality(pg_catalog.text,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "centrality",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_biconnectedcomponents(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "component",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_bipartite(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "color",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_boost_version()",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_bridges(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_build_type()",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_checkcolumn(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "false, false",
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_checkquery(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_checkverttab(pg_catalog.text,pg_catalog._text,pg_catalog.int4,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "1, '_pgr_checkVertTab'::text",
      resultColumns: [
        {
          name: "sname",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
        {
          name: "vname",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_chinesepostman(pg_catalog.text,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_compilation_date()",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_compiler_version()",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_connectedcomponents(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "component",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_contraction(pg_catalog.text,pg_catalog._int8,pg_catalog.int4,pg_catalog._int8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "1, ARRAY[]::bigint[], true",
      resultColumns: [
        {
          name: "type",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
        {
          name: "id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "contracted_vertices",
          type: {
            namespace: "pg_catalog",
            name: "_int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_contractionhierarchies(pg_catalog.text,pg_catalog._int8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "type",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
        {
          name: "id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "contracted_vertices",
          type: {
            namespace: "pg_catalog",
            name: "_int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "metric",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "vertex_order",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_createindex(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "1, '_pgr_createIndex'::text",
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_createindex(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "1, '_pgr_createIndex'::text",
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_cuthillmckeeordering(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_dagshortestpath(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_depthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.int8)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false, true, 0",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_dijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false, true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_dijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
      nativeLimitation:
        "The upstream 3.8.0 deprecated many-to-many wrapper uses ARRAY[$2] and ARRAY[$3], nesting its input arrays; observed XX000 One dimension expected. No fallback.",
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_dijkstranear(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_dijkstravia(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "route_agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_drivingdistance(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "from_v",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_drivingdistancev4(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_edgecoloring(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "edge_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "color_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_edwardmoore(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_endpoint($extension:postgis.geometry)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_floydwarshall(pg_catalog.text,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_get_statement(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_getcolumnname(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "1, '_pgr_getColumnName'::text",
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_getcolumnname(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "1, '_pgr_getColumnName'::text",
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_getcolumntype(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "0, '_pgr_getColumnType'::text",
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_getcolumntype(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "0, '_pgr_getColumnType'::text",
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_gettablename(pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "0, '_pgr_getTableName'::text",
      resultColumns: [
        {
          name: "sname",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
        {
          name: "tname",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_git_hash()",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_hawickcircuits(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_iscolumnindexed(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "1, '_pgr_isColumnIndexed'::text",
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_iscolumnindexed(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "1, '_pgr_isColumnIndexed'::text",
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_iscolumnintable(pg_catalog.text,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_isplanar(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_johnson(pg_catalog.text,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_kruskal(pg_catalog.text,pg_catalog.anyarray,pg_catalog.text,pg_catalog.int8,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_kruskalv4(pg_catalog.text,pg_catalog.anyarray,pg_catalog.text,pg_catalog.int8,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_ksp(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_lengauertarjandominatortree(pg_catalog.text,pg_catalog.int8)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "idom",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_lib_version()",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_linegraph(pg_catalog.text,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "reverse_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_linegraphfull(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_makeconnected(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_maxcardinalitymatch(pg_catalog.text,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_maxflow(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "1, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_maxflow(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "1, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_maxflowmincost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_msg(pg_catalog.int4,pg_catalog.text,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "'---->OK'::text",
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_onerror(pg_catalog.bool,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "'No hint'::text, 'OK'::text",
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_operating_system()",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_parameter_check(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: "false",
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_pgsql_version()",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_pickdeliver(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "1, 10, 4",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "vehicle_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "vehicle_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "stop_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "stop_type",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "stop_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "order_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cargo",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "travel_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "arrival_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "wait_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "service_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "departure_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_pickdelivereuclidean(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "1, 10, 4",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "vehicle_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "vehicle_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "stop_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "stop_type",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "order_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cargo",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "travel_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "arrival_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "wait_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "service_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "departure_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_pointtoid($extension:postgis.geometry,pg_catalog.float8,pg_catalog.text,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_prim(pg_catalog.text,pg_catalog.anyarray,pg_catalog.text,pg_catalog.int8,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_primv4(pg_catalog.text,pg_catalog.anyarray,pg_catalog.text,pg_catalog.int8,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_quote_ident(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_sequentialvertexcoloring(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "vertex_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "color_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_startpoint($extension:postgis.geometry)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_stoerwagner(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "mincut",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_strongcomponents(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "component",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_topologicalsort(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "sorted_v",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_transitiveclosure(pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target_array",
          type: {
            namespace: "pg_catalog",
            name: "_int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "departure",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "departure",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: "NULL::text",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "id1",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "id2",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_trspv4(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_trspv4(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_trspvia_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "route_agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_trspvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "route_agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_trspviavertices(pg_catalog.text,pg_catalog._int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: "NULL::text",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "id1",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "id2",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "id3",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_tsp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "0, 0, 'Infinity'::double precision, 500, 60, 100, 100, 0.1, 0.9, true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_tspeuclidean(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "0, 0, 'Infinity'::double precision, 500, 60, 100, 100, 0.1, 0.9, true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_turnrestrictedpath(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_versionless(pg_catalog.text,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_vrponedepot(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "vehicle_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "vehicle_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "stop_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "stop_type",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "stop_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "order_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cargo",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "travel_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "arrival_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "wait_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "service_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "departure_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: "false, true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'b'::bpchar, false, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_withpointsddv4(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_withpointsvia(pg_catalog.text,pg_catalog._int8,pg_catalog._float8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "route_agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._pgr_withpointsvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "route_agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._v4trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting._v4trsp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Native implementation/support routine; witnessed directly in the exact local native oracle, not exported as an application helper.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "internal",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_alphashape($extension:postgis.geometry,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "0",
      resultColumns: [],
      nativeLimitation:
        "Upstream src/alpha_shape/alphaShape.cpp build_best_alpha dereferences min_element on empty triangle maps. Auto-alpha on a four-point square produced a native backend SIGSEGV. Public calls are rejected before SQL construction pending verified native repair; internal native calls are not re-probed. No JS algorithm or input cap.",
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_analyzegraph(pg_catalog.text,pg_catalog.float8,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "tooling",
    reason:
      "Explicit owned operator transaction; native table/topology mutations are absent from invocation query bindings.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "operator",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "'the_geom'::text, 'id'::text, 'source'::text, 'target'::text, 'true'::text",
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_analyzeoneway(pg_catalog.text,pg_catalog._text,pg_catalog._text,pg_catalog._text,pg_catalog._text,pg_catalog.bool,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "tooling",
    reason:
      "Explicit owned operator transaction; native table/topology mutations are absent from invocation query bindings.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "operator",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'oneway'::text, 'source'::text, 'target'::text",
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_articulationpoints(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_astar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_astarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_astarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bdastar(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bdastarcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bdastarcostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int4,pg_catalog.numeric,pg_catalog.numeric)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: "true, 5, 1.0, 1.0",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bddijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bddijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bddijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: "true",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bellmanford(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_betweennesscentrality(pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "centrality",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_biconnectedcomponents(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "component",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_binarybreadthfirstsearch(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bipartite(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "vertex_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "color_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_boykovkolmogorov(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "'9223372036854775807'::bigint, true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_breadthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "'9223372036854775807'::bigint, true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_bridges(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_chinesepostman(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_chinesepostmancost(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_connectedcomponents(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "component",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog._int8,pg_catalog.int4,pg_catalog._int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "1, ARRAY[]::bigint[], true",
      resultColumns: [
        {
          name: "type",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
        {
          name: "id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "contracted_vertices",
          type: {
            namespace: "pg_catalog",
            name: "_int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_contraction(pg_catalog.text,pg_catalog.bool,pg_catalog._int4,pg_catalog.int4,pg_catalog._int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, ARRAY[1, 2], 1, ARRAY[]::bigint[]",
      resultColumns: [
        {
          name: "type",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
        {
          name: "id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "contracted_vertices",
          type: {
            namespace: "pg_catalog",
            name: "_int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_contractiondeadend(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, ARRAY[]::bigint[]",
      resultColumns: [
        {
          name: "type",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
        {
          name: "id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "contracted_vertices",
          type: {
            namespace: "pg_catalog",
            name: "_int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_contractionhierarchies(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, ARRAY[]::bigint[]",
      resultColumns: [
        {
          name: "type",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
        {
          name: "id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "contracted_vertices",
          type: {
            namespace: "pg_catalog",
            name: "_int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "metric",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "vertex_order",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_contractionlinear(pg_catalog.text,pg_catalog.bool,pg_catalog._int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, ARRAY[]::bigint[]",
      resultColumns: [
        {
          name: "type",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
        {
          name: "id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "contracted_vertices",
          type: {
            namespace: "pg_catalog",
            name: "_int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_createtopology(pg_catalog.text,pg_catalog.float8,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "tooling",
    reason:
      "Explicit owned operator transaction; native table/topology mutations are absent from invocation query bindings.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "operator",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "'the_geom'::text, 'id'::text, 'source'::text, 'target'::text, 'true'::text, false",
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_createverticestable(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "tooling",
    reason:
      "Explicit owned operator transaction; native table/topology mutations are absent from invocation query bindings.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "operator",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "'the_geom'::text, 'source'::text, 'target'::text, 'true'::text",
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_cuthillmckeeordering(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dagshortestpath(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "false",
      resultColumns: [
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "degree",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_degree(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "false",
      resultColumns: [
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "degree",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, '9223372036854775807'::bigint",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_depthfirstsearch(pg_catalog.text,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, '9223372036854775807'::bigint",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstra(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstracost(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstracostmatrix(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 1, true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 1",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 1",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstranear(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 1, true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 1, true",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 1",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 1",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstranearcost(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 1, true",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_dijkstravia(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false, true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "route_agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_drivingdistance(pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_edgecoloring(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "edge_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "color_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_edgedisjointpaths(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_edmondskarp(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_edwardmoore(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_extractvertices(pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "false",
      resultColumns: [
        {
          name: "id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "in_edges",
          type: {
            namespace: "pg_catalog",
            name: "_int8",
          },
        },
        {
          name: "out_edges",
          type: {
            namespace: "pg_catalog",
            name: "_int8",
          },
        },
        {
          name: "x",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "y",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "geom",
          type: {
            namespace: "$extension:postgis",
            name: "geometry",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "edge_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "fraction",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "side",
          type: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
        },
        {
          name: "distance",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "geom",
          type: {
            namespace: "$extension:postgis",
            name: "geometry",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "$extension:postgis",
            name: "geometry",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis._geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "1, false",
      resultColumns: [
        {
          name: "edge_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "fraction",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "side",
          type: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
        },
        {
          name: "distance",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "geom",
          type: {
            namespace: "$extension:postgis",
            name: "geometry",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "$extension:postgis",
            name: "geometry",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "edge_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "fraction",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "side",
          type: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
        },
        {
          name: "distance",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "geom",
          type: {
            namespace: "$extension:postgis",
            name: "geometry",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "$extension:postgis",
            name: "geometry",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_findcloseedges(pg_catalog.text,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "1, false",
      resultColumns: [
        {
          name: "edge_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "fraction",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "side",
          type: {
            namespace: "pg_catalog",
            name: "bpchar",
          },
        },
        {
          name: "distance",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "geom",
          type: {
            namespace: "$extension:postgis",
            name: "geometry",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "$extension:postgis",
            name: "geometry",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_floydwarshall(pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_full_version()",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: null,
      resultColumns: [
        {
          name: "version",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
        {
          name: "build_type",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
        {
          name: "compile_date",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
        {
          name: "library",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
        {
          name: "system",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
        {
          name: "postgresql",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
        {
          name: "compiler",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
        {
          name: "boost",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
        {
          name: "hash",
          type: {
            namespace: "pg_catalog",
            name: "text",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_hawickcircuits(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_isplanar(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_johnson(pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_kruskal(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "'9223372036854775807'::bigint",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_kruskalbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "'9223372036854775807'::bigint",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_kruskaldd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "'9223372036854775807'::bigint",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_kruskaldfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "'9223372036854775807'::bigint",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_ksp(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_lengauertarjandominatortree(pg_catalog.text,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "vertex_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "idom",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_linegraph(pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "reverse_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_linegraphfull(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_makeconnected(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_maxcardinalitymatch(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_maxflow(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_maxflowmincost_cost(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_maxflowmincost(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "source",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_nodenetwork(pg_catalog.text,pg_catalog.float8,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "tooling",
    reason:
      "Explicit owned operator transaction; native table/topology mutations are absent from invocation query bindings.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "operator",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "'id'::text, 'the_geom'::text, 'noded'::text, ''::text, false",
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_pickdeliver(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "1, 10, 4",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "vehicle_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "vehicle_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "stop_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "stop_type",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "stop_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "order_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cargo",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "travel_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "arrival_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "wait_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "service_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "departure_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_pickdelivereuclidean(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "1, 10, 4",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "vehicle_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "vehicle_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "stop_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "stop_type",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "order_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cargo",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "travel_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "arrival_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "wait_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "service_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "departure_time",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_prim(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "'9223372036854775807'::bigint",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_primbfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "'9223372036854775807'::bigint",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.anyarray,pg_catalog.numeric)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_primdd(pg_catalog.text,pg_catalog.int8,pg_catalog.numeric)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "'9223372036854775807'::bigint",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_primdfs(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "'9223372036854775807'::bigint",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_pushrelabel(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "flow",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "residual_capacity",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_separatecrossing(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "0.01, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "sub_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "geom",
          type: {
            namespace: "$extension:postgis",
            name: "geometry",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_separatetouching(pg_catalog.text,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "0.01, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "sub_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "geom",
          type: {
            namespace: "$extension:postgis",
            name: "geometry",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_sequentialvertexcoloring(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "vertex_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "color_id",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_stoerwagner(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "mincut",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_strongcomponents(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "component",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_topologicalsort(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "sorted_v",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_transitiveclosure(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "target_array",
          type: {
            namespace: "pg_catalog",
            name: "_int8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'r'::bpchar, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'r'::bpchar, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'r'::bpchar, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'r'::bpchar, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_trsp_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'r'::bpchar, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: "NULL::text",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "id1",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "id2",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: "NULL::text",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "id1",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "id2",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_trsp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_trspvia_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false, true, 'r'::bpchar, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "route_agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_trspvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false, true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "route_agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_trspviaedges(pg_catalog.text,pg_catalog._int4,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: "NULL::text",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "id1",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "id2",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "id3",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_trspviavertices(pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: "NULL::text",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "id1",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "id2",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "id3",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_tsp(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "0, 0, 'Infinity'::double precision, 500, 60, 100, 100, 0.1, 0.9, true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_tspeuclidean(pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "0, 0, 'Infinity'::double precision, 500, 60, 100, 100, 0.1, 0.9, true",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_turnrestrictedpath(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false, true, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_version()",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "Native non-STRICT behavior; arguments and nullable outputs retain SQL NULL",
      defaults: null,
      resultColumns: [],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_vrponedepot(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: null,
      resultColumns: [
        {
          name: "oid",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "opos",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "vid",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "tarrival",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "tdepart",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'b'::bpchar, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'b'::bpchar, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'b'::bpchar, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "end_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'b'::bpchar, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpoints(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'b'::bpchar, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'b'::bpchar",
      resultColumns: [
        {
          name: "start_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'b'::bpchar",
      resultColumns: [
        {
          name: "start_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'b'::bpchar",
      resultColumns: [
        {
          name: "start_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.bool,pg_catalog.bpchar)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'b'::bpchar",
      resultColumns: [
        {
          name: "start_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpointscost(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.bpchar)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'b'::bpchar",
      resultColumns: [
        {
          name: "start_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_pid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpointscostmatrix(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bpchar)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'b'::bpchar",
      resultColumns: [
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'b'::bpchar, false, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, 'b'::bpchar, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpointsdd(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.float8,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "depth",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "pred",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.anyarray,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false, 'b'::bpchar, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpointsksp(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bpchar,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
  {
    id: "routine:$extension:pgrouting.pgr_withpointsvia(pg_catalog.text,pg_catalog.text,pg_catalog.anyarray,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bpchar,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact captured public routine with managed nested-query text, captured OUT order, qualified arguments and native decoder.",
    evidence: [
      "https://github.com/pgRouting/pgrouting/releases/tag/v3.8.0",
      "apps/loom/src/tooling/extensions/manifests/pgrouting.json",
      "packages/e2e/fixtures/pgrouting-native-cases.json",
      "packages/e2e/scripts/pgrouting-native-characterization.ts",
    ],
    semantics: {
      authority: "query",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      nulls: "PostgreSQL STRICT NULL propagation",
      defaults: "true, false, true, 'b'::bpchar, false",
      resultColumns: [
        {
          name: "seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_id",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "path_seq",
          type: {
            namespace: "pg_catalog",
            name: "int4",
          },
        },
        {
          name: "start_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "end_vid",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "node",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "edge",
          type: {
            namespace: "pg_catalog",
            name: "int8",
          },
        },
        {
          name: "cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
        {
          name: "route_agg_cost",
          type: {
            namespace: "pg_catalog",
            name: "float8",
          },
        },
      ],
    },
  },
] as const;
