/** Exact 15-member dispositions. Native and public consumer acceptance remain pending. */
export const earthdistanceAnnotations = [
  {
    id: 'domain constraint:not_3d on "$extension:earthdistance".earth',
    disposition: "internal",
    reason:
      'Captured not_3d on "$extension:earthdistance".earth belongs to type:$extension:earthdistance.earth and is enforced when PostgreSQL casts/inserts the domain; not an independently callable query. CHECK ("$extension:cube".cube_dim(VALUE) <= 3)',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/earthdistance.json",
      "https://www.postgresql.org/docs/18/earthdistance.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance--1.1--1.2.sql",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance.c",
      "apps/loom/src/core/extensions/adapters/earthdistance.ts",
      "packages/tests/unit/extensions-earthdistance.test.ts",
      "packages/tests/types/extensions-earthdistance.test-d.ts",
      "packages/e2e/integration/extensions-earthdistance.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: "type:$extension:earthdistance.earth",
    },
  },
  {
    id: 'domain constraint:not_point on "$extension:earthdistance".earth',
    disposition: "internal",
    reason:
      'Captured not_point on "$extension:earthdistance".earth belongs to type:$extension:earthdistance.earth and is enforced when PostgreSQL casts/inserts the domain; not an independently callable query. CHECK ("$extension:cube".cube_is_point(VALUE))',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/earthdistance.json",
      "https://www.postgresql.org/docs/18/earthdistance.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance--1.1--1.2.sql",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance.c",
      "apps/loom/src/core/extensions/adapters/earthdistance.ts",
      "packages/tests/unit/extensions-earthdistance.test.ts",
      "packages/tests/types/extensions-earthdistance.test-d.ts",
      "packages/e2e/integration/extensions-earthdistance.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: "type:$extension:earthdistance.earth",
    },
  },
  {
    id: 'domain constraint:on_surface on "$extension:earthdistance".earth',
    disposition: "internal",
    reason:
      'Captured on_surface on "$extension:earthdistance".earth belongs to type:$extension:earthdistance.earth and is enforced when PostgreSQL casts/inserts the domain; not an independently callable query. CHECK (abs("$extension:cube".cube_distance(VALUE, \'(0)\'::"$extension:cube".cube) / "$extension:earthdistance".earth() - \'1\'::double precision) < \'1e-06\'::double precision)',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/earthdistance.json",
      "https://www.postgresql.org/docs/18/earthdistance.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance--1.1--1.2.sql",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance.c",
      "apps/loom/src/core/extensions/adapters/earthdistance.ts",
      "packages/tests/unit/extensions-earthdistance.test.ts",
      "packages/tests/types/extensions-earthdistance.test-d.ts",
      "packages/e2e/integration/extensions-earthdistance.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: "type:$extension:earthdistance.earth",
    },
  },
  {
    id: "operator:$extension:earthdistance.<@>(pg_catalog.point,pg_catalog.point)",
    disposition: "query",
    reason:
      "Exact sql.overloads[operator:$extension:earthdistance.<@>(pg_catalog.point,pg_catalog.point)] binds captured argument and result codecs.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/earthdistance.json",
      "https://www.postgresql.org/docs/18/earthdistance.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance--1.1--1.2.sql",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance.c",
      "apps/loom/src/core/extensions/adapters/earthdistance.ts",
      "packages/tests/unit/extensions-earthdistance.test.ts",
      "packages/tests/types/extensions-earthdistance.test-d.ts",
      "packages/e2e/integration/extensions-earthdistance.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "Strict routines and operator propagate SQL NULL; earth() has no arguments.",
      units:
        "Point geo_distance and <@> use hardwired statute miles with longitude first; cube/domain functions use the earth() radius, meters in the captured contract. Latitude and longitude are degrees.",
      transport:
        "Earth domain inherits cube text/binary transfer. earth_box returns the cube dependency type and is only a candidate filter; apply earth_distance for exact radius.",
    },
  },
  {
    id: "routine:$extension:earthdistance.earth_box($extension:earthdistance.earth,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:earthdistance.earth_box($extension:earthdistance.earth,pg_catalog.float8)] binds captured argument and result codecs.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/earthdistance.json",
      "https://www.postgresql.org/docs/18/earthdistance.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance--1.1--1.2.sql",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance.c",
      "apps/loom/src/core/extensions/adapters/earthdistance.ts",
      "packages/tests/unit/extensions-earthdistance.test.ts",
      "packages/tests/types/extensions-earthdistance.test-d.ts",
      "packages/e2e/integration/extensions-earthdistance.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "Strict routines and operator propagate SQL NULL; earth() has no arguments.",
      units:
        "Point geo_distance and <@> use hardwired statute miles with longitude first; cube/domain functions use the earth() radius, meters in the captured contract. Latitude and longitude are degrees.",
      transport:
        "Earth domain inherits cube text/binary transfer. earth_box returns the cube dependency type and is only a candidate filter; apply earth_distance for exact radius.",
    },
  },
  {
    id: "routine:$extension:earthdistance.earth_distance($extension:earthdistance.earth,$extension:earthdistance.earth)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:earthdistance.earth_distance($extension:earthdistance.earth,$extension:earthdistance.earth)] binds captured argument and result codecs.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/earthdistance.json",
      "https://www.postgresql.org/docs/18/earthdistance.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance--1.1--1.2.sql",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance.c",
      "apps/loom/src/core/extensions/adapters/earthdistance.ts",
      "packages/tests/unit/extensions-earthdistance.test.ts",
      "packages/tests/types/extensions-earthdistance.test-d.ts",
      "packages/e2e/integration/extensions-earthdistance.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "Strict routines and operator propagate SQL NULL; earth() has no arguments.",
      units:
        "Point geo_distance and <@> use hardwired statute miles with longitude first; cube/domain functions use the earth() radius, meters in the captured contract. Latitude and longitude are degrees.",
      transport:
        "Earth domain inherits cube text/binary transfer. earth_box returns the cube dependency type and is only a candidate filter; apply earth_distance for exact radius.",
    },
  },
  {
    id: "routine:$extension:earthdistance.earth()",
    disposition: "query",
    reason: "Exact sql.overloads[routine:$extension:earthdistance.earth()] binds captured argument and result codecs.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/earthdistance.json",
      "https://www.postgresql.org/docs/18/earthdistance.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance--1.1--1.2.sql",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance.c",
      "apps/loom/src/core/extensions/adapters/earthdistance.ts",
      "packages/tests/unit/extensions-earthdistance.test.ts",
      "packages/tests/types/extensions-earthdistance.test-d.ts",
      "packages/e2e/integration/extensions-earthdistance.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "Strict routines and operator propagate SQL NULL; earth() has no arguments.",
      units:
        "Point geo_distance and <@> use hardwired statute miles with longitude first; cube/domain functions use the earth() radius, meters in the captured contract. Latitude and longitude are degrees.",
      transport:
        "Earth domain inherits cube text/binary transfer. earth_box returns the cube dependency type and is only a candidate filter; apply earth_distance for exact radius.",
    },
  },
  {
    id: "routine:$extension:earthdistance.gc_to_sec(pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:earthdistance.gc_to_sec(pg_catalog.float8)] binds captured argument and result codecs.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/earthdistance.json",
      "https://www.postgresql.org/docs/18/earthdistance.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance--1.1--1.2.sql",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance.c",
      "apps/loom/src/core/extensions/adapters/earthdistance.ts",
      "packages/tests/unit/extensions-earthdistance.test.ts",
      "packages/tests/types/extensions-earthdistance.test-d.ts",
      "packages/e2e/integration/extensions-earthdistance.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "Strict routines and operator propagate SQL NULL; earth() has no arguments.",
      units:
        "Point geo_distance and <@> use hardwired statute miles with longitude first; cube/domain functions use the earth() radius, meters in the captured contract. Latitude and longitude are degrees.",
      transport:
        "Earth domain inherits cube text/binary transfer. earth_box returns the cube dependency type and is only a candidate filter; apply earth_distance for exact radius.",
    },
  },
  {
    id: "routine:$extension:earthdistance.geo_distance(pg_catalog.point,pg_catalog.point)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:earthdistance.geo_distance(pg_catalog.point,pg_catalog.point)] binds captured argument and result codecs.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/earthdistance.json",
      "https://www.postgresql.org/docs/18/earthdistance.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance--1.1--1.2.sql",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance.c",
      "apps/loom/src/core/extensions/adapters/earthdistance.ts",
      "packages/tests/unit/extensions-earthdistance.test.ts",
      "packages/tests/types/extensions-earthdistance.test-d.ts",
      "packages/e2e/integration/extensions-earthdistance.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "Strict routines and operator propagate SQL NULL; earth() has no arguments.",
      units:
        "Point geo_distance and <@> use hardwired statute miles with longitude first; cube/domain functions use the earth() radius, meters in the captured contract. Latitude and longitude are degrees.",
      transport:
        "Earth domain inherits cube text/binary transfer. earth_box returns the cube dependency type and is only a candidate filter; apply earth_distance for exact radius.",
    },
  },
  {
    id: "routine:$extension:earthdistance.latitude($extension:earthdistance.earth)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:earthdistance.latitude($extension:earthdistance.earth)] binds captured argument and result codecs.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/earthdistance.json",
      "https://www.postgresql.org/docs/18/earthdistance.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance--1.1--1.2.sql",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance.c",
      "apps/loom/src/core/extensions/adapters/earthdistance.ts",
      "packages/tests/unit/extensions-earthdistance.test.ts",
      "packages/tests/types/extensions-earthdistance.test-d.ts",
      "packages/e2e/integration/extensions-earthdistance.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "Strict routines and operator propagate SQL NULL; earth() has no arguments.",
      units:
        "Point geo_distance and <@> use hardwired statute miles with longitude first; cube/domain functions use the earth() radius, meters in the captured contract. Latitude and longitude are degrees.",
      transport:
        "Earth domain inherits cube text/binary transfer. earth_box returns the cube dependency type and is only a candidate filter; apply earth_distance for exact radius.",
    },
  },
  {
    id: "routine:$extension:earthdistance.ll_to_earth(pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:earthdistance.ll_to_earth(pg_catalog.float8,pg_catalog.float8)] binds captured argument and result codecs.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/earthdistance.json",
      "https://www.postgresql.org/docs/18/earthdistance.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance--1.1--1.2.sql",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance.c",
      "apps/loom/src/core/extensions/adapters/earthdistance.ts",
      "packages/tests/unit/extensions-earthdistance.test.ts",
      "packages/tests/types/extensions-earthdistance.test-d.ts",
      "packages/e2e/integration/extensions-earthdistance.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "Strict routines and operator propagate SQL NULL; earth() has no arguments.",
      units:
        "Point geo_distance and <@> use hardwired statute miles with longitude first; cube/domain functions use the earth() radius, meters in the captured contract. Latitude and longitude are degrees.",
      transport:
        "Earth domain inherits cube text/binary transfer. earth_box returns the cube dependency type and is only a candidate filter; apply earth_distance for exact radius.",
    },
  },
  {
    id: "routine:$extension:earthdistance.longitude($extension:earthdistance.earth)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:earthdistance.longitude($extension:earthdistance.earth)] binds captured argument and result codecs.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/earthdistance.json",
      "https://www.postgresql.org/docs/18/earthdistance.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance--1.1--1.2.sql",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance.c",
      "apps/loom/src/core/extensions/adapters/earthdistance.ts",
      "packages/tests/unit/extensions-earthdistance.test.ts",
      "packages/tests/types/extensions-earthdistance.test-d.ts",
      "packages/e2e/integration/extensions-earthdistance.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "Strict routines and operator propagate SQL NULL; earth() has no arguments.",
      units:
        "Point geo_distance and <@> use hardwired statute miles with longitude first; cube/domain functions use the earth() radius, meters in the captured contract. Latitude and longitude are degrees.",
      transport:
        "Earth domain inherits cube text/binary transfer. earth_box returns the cube dependency type and is only a candidate filter; apply earth_distance for exact radius.",
    },
  },
  {
    id: "routine:$extension:earthdistance.sec_to_gc(pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:earthdistance.sec_to_gc(pg_catalog.float8)] binds captured argument and result codecs.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/earthdistance.json",
      "https://www.postgresql.org/docs/18/earthdistance.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance--1.1--1.2.sql",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance.c",
      "apps/loom/src/core/extensions/adapters/earthdistance.ts",
      "packages/tests/unit/extensions-earthdistance.test.ts",
      "packages/tests/types/extensions-earthdistance.test-d.ts",
      "packages/e2e/integration/extensions-earthdistance.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "Strict routines and operator propagate SQL NULL; earth() has no arguments.",
      units:
        "Point geo_distance and <@> use hardwired statute miles with longitude first; cube/domain functions use the earth() radius, meters in the captured contract. Latitude and longitude are degrees.",
      transport:
        "Earth domain inherits cube text/binary transfer. earth_box returns the cube dependency type and is only a candidate filter; apply earth_distance for exact radius.",
    },
  },
  {
    id: "type:$extension:earthdistance._earth",
    disposition: "schema",
    reason:
      "Native earth domain or its array field uses the cube codec with the exact earth SQL identity. PostgreSQL enforces domain constraints, including lower-dimensional zero padding and equal-corner point compression.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/earthdistance.json",
      "https://www.postgresql.org/docs/18/earthdistance.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance--1.1--1.2.sql",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance.c",
      "apps/loom/src/core/extensions/adapters/earthdistance.ts",
      "packages/tests/unit/extensions-earthdistance.test.ts",
      "packages/tests/types/extensions-earthdistance.test-d.ts",
      "packages/e2e/integration/extensions-earthdistance.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transport:
        "Domain input/receive use pg_catalog.domain_in/domain_recv. Domain output/send delegate to cube_out/cube_send from the required cube extension; array transfer uses pg_catalog.array_in/out/recv/send and preserves six ranks, lower bounds and NULL elements.",
    },
  },
  {
    id: "type:$extension:earthdistance.earth",
    disposition: "schema",
    reason:
      "Native earth domain or its array field uses the cube codec with the exact earth SQL identity. PostgreSQL enforces domain constraints, including lower-dimensional zero padding and equal-corner point compression.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/earthdistance.json",
      "https://www.postgresql.org/docs/18/earthdistance.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance--1.1--1.2.sql",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/earthdistance/earthdistance.c",
      "apps/loom/src/core/extensions/adapters/earthdistance.ts",
      "packages/tests/unit/extensions-earthdistance.test.ts",
      "packages/tests/types/extensions-earthdistance.test-d.ts",
      "packages/e2e/integration/extensions-earthdistance.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transport:
        "Domain input/receive use pg_catalog.domain_in/domain_recv. Domain output/send delegate to cube_out/cube_send from the required cube extension; array transfer uses pg_catalog.array_in/out/recv/send and preserves six ranks, lower bounds and NULL elements.",
    },
  },
] as const;
