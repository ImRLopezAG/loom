export const postgisRasterAnnotations = [
  {
    id: "cast:$extension:postgis_raster.raster->$extension:postgis.box3d",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "cast:$extension:postgis_raster.raster->$extension:postgis.geometry",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "cast:$extension:postgis_raster.raster->pg_catalog.bytea",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'composite type:"$extension:postgis_raster".addbandarg',
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'composite type:"$extension:postgis_raster".agg_count',
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'composite type:"$extension:postgis_raster".agg_samealignment',
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'composite type:"$extension:postgis_raster".geomval',
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'composite type:"$extension:postgis_raster".rastbandarg',
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'composite type:"$extension:postgis_raster".reclassarg',
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'composite type:"$extension:postgis_raster".summarystats',
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'composite type:"$extension:postgis_raster".unionarg',
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'function of access method:function 1 ("$extension:postgis_raster".raster, "$extension:postgis_raster".raster) of "$extension:postgis_raster".hash_raster_ops USING hash',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "opclass:$extension:postgis_raster.hash_raster_ops/hash",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'operator of access method:operator 1 ("$extension:postgis_raster".raster, "$extension:postgis_raster".raster) of "$extension:postgis_raster".hash_raster_ops USING hash',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "operator:$extension:postgis_raster.@($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.@($extension:postgis_raster.raster,$extension:postgis.geometry)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.@($extension:postgis.geometry,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.&&($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.&&($extension:postgis_raster.raster,$extension:postgis.geometry)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.&&($extension:postgis.geometry,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.&<($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.&<|($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.&>($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.<<($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.<<|($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.=($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.>>($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.|&>($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.|>>($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.~($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.~($extension:postgis_raster.raster,$extension:postgis.geometry)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.~($extension:postgis.geometry,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "operator:$extension:postgis_raster.~=($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "opfamily:$extension:postgis_raster.hash_raster_ops/hash",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster.__st_countagg_transfn($extension:postgis_raster.agg_count,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._add_overview_constraint(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._add_raster_constraint_alignment(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._add_raster_constraint_blocksize(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._add_raster_constraint_coverage_tile(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._add_raster_constraint_extent(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._add_raster_constraint_nodata_values(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._add_raster_constraint_num_bands(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._add_raster_constraint_out_db(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._add_raster_constraint_pixel_types(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._add_raster_constraint_scale(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.bpchar)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._add_raster_constraint_spatially_unique(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._add_raster_constraint_srid(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._add_raster_constraint(pg_catalog.name,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._drop_overview_constraint(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._drop_raster_constraint_alignment(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._drop_raster_constraint_blocksize(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._drop_raster_constraint_coverage_tile(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._drop_raster_constraint_extent(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._drop_raster_constraint_nodata_values(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._drop_raster_constraint_num_bands(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._drop_raster_constraint_out_db(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._drop_raster_constraint_pixel_types(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._drop_raster_constraint_regular_blocking(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._drop_raster_constraint_scale(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.bpchar)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._drop_raster_constraint_spatially_unique(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._drop_raster_constraint_srid(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._drop_raster_constraint(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._overview_constraint_info(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._overview_constraint($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._raster_constraint_info_alignment(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._raster_constraint_info_blocksize(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._raster_constraint_info_coverage_tile(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._raster_constraint_info_extent(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._raster_constraint_info_index(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._raster_constraint_info_nodata_values(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._raster_constraint_info_num_bands(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._raster_constraint_info_out_db(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._raster_constraint_info_pixel_types(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._raster_constraint_info_regular_blocking(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._raster_constraint_info_scale(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.bpchar)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._raster_constraint_info_spatially_unique(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._raster_constraint_info_srid(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._raster_constraint_nodata_values($extension:postgis_raster.raster)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._raster_constraint_out_db($extension:postgis_raster.raster)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._raster_constraint_pixel_types($extension:postgis_raster.raster)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_aspect4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_asrasteragg_finalfn($extension:postgis_raster.raster)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_asrasteragg_transfn($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.float8,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.text,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_clip($extension:postgis_raster.raster,pg_catalog._int4,$extension:postgis.geometry,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_colormap($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_contains($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_containsproperly($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_convertarray4ma(pg_catalog._float8)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_count($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_countagg_finalfn($extension:postgis_raster.agg_count)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_countagg_transfn($extension:postgis_raster.agg_count,$extension:postgis_raster.raster,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_countagg_transfn($extension:postgis_raster.agg_count,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_countagg_transfn($extension:postgis_raster.agg_count,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_coveredby($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_covers($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_dfullywithin($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_dwithin($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_gdalwarp($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_grayscale4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_hillshade4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_intersects($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_intersects($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_mapalgebra($extension:postgis_raster._rastbandarg,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.bool,pg_catalog._text)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_mapalgebra($extension:postgis_raster._rastbandarg,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_neighborhood($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_overlaps($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_pixelascentroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_pixelaspolygons($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog._float8)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_rastertoworldcoord($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_reclass($extension:postgis_raster.raster,$extension:postgis_raster._reclassarg)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_roughness4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_samealignment_finalfn($extension:postgis_raster.agg_samealignment)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_samealignment_transfn($extension:postgis_raster.agg_samealignment,$extension:postgis_raster.raster)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog._bool,pg_catalog.bool,pg_catalog.float8,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_slope4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_summarystats_finalfn(pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_summarystats_transfn(pg_catalog.internal,$extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_summarystats_transfn(pg_catalog.internal,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_summarystats_transfn(pg_catalog.internal,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_summarystats($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_tile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._int4,pg_catalog.bool,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_touches($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_tpi4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_tri4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_union_finalfn(pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_union_transfn(pg_catalog.internal,$extension:postgis_raster.raster,$extension:postgis_raster._unionarg)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_union_transfn(pg_catalog.internal,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_union_transfn(pg_catalog.internal,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_union_transfn(pg_catalog.internal,$extension:postgis_raster.raster,pg_catalog.text)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_union_transfn(pg_catalog.internal,$extension:postgis_raster.raster)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_within($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._st_worldtorastercoord($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster._updaterastersrid(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.int4)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster.addoverviewconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.int4)",
    disposition: "tooling",
    reason:
      "Captured DDL/constraint/overview operation requires explicit owned migration/operator execution; absent from application query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.addoverviewconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.int4)",
    disposition: "tooling",
    reason:
      "Captured DDL/constraint/overview operation requires explicit owned migration/operator execution; absent from application query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.addrasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog._text)",
    disposition: "tooling",
    reason:
      "Captured DDL/constraint/overview operation requires explicit owned migration/operator execution; absent from application query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.addrasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "tooling",
    reason:
      "Captured DDL/constraint/overview operation requires explicit owned migration/operator execution; absent from application query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.addrasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog._text)",
    disposition: "tooling",
    reason:
      "Captured DDL/constraint/overview operation requires explicit owned migration/operator execution; absent from application query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.addrasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "tooling",
    reason:
      "Captured DDL/constraint/overview operation requires explicit owned migration/operator execution; absent from application query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.box3d($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.bytea($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.dropoverviewconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    disposition: "tooling",
    reason:
      "Captured DDL/constraint/overview operation requires explicit owned migration/operator execution; absent from application query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.dropoverviewconstraints(pg_catalog.name,pg_catalog.name)",
    disposition: "tooling",
    reason:
      "Captured DDL/constraint/overview operation requires explicit owned migration/operator execution; absent from application query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.droprasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog._text)",
    disposition: "tooling",
    reason:
      "Captured DDL/constraint/overview operation requires explicit owned migration/operator execution; absent from application query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.droprasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "tooling",
    reason:
      "Captured DDL/constraint/overview operation requires explicit owned migration/operator execution; absent from application query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.droprasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog._text)",
    disposition: "tooling",
    reason:
      "Captured DDL/constraint/overview operation requires explicit owned migration/operator execution; absent from application query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.droprasterconstraints(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "tooling",
    reason:
      "Captured DDL/constraint/overview operation requires explicit owned migration/operator execution; absent from application query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.geometry_contained_by_raster($extension:postgis.geometry,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.geometry_raster_contain($extension:postgis.geometry,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.geometry_raster_overlap($extension:postgis.geometry,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.postgis_gdal_version()",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.postgis_noop($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.postgis_raster_lib_build_date()",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.postgis_raster_lib_version()",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.postgis_raster_scripts_installed()",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_above($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_below($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_contain($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_contained_by_geometry($extension:postgis_raster.raster,$extension:postgis.geometry)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_contained($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_eq($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_geometry_contain($extension:postgis_raster.raster,$extension:postgis.geometry)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_geometry_overlap($extension:postgis_raster.raster,$extension:postgis.geometry)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_hash($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_in(pg_catalog.cstring)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_left($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_out($extension:postgis_raster.raster)",
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_overabove($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_overbelow($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_overlap($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_overleft($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_overright($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_right($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.raster_same($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,$extension:postgis_raster._addbandarg)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,$extension:postgis_raster._raster,pg_catalog.int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog._int4,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.text,pg_catalog._int4,pg_catalog.int4,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_addband($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxcount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxhistogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog._float8)",
    disposition: "query",
    reason:
      "Captured typed overload retained but rejected before SQL submission: fixed 0.1 native sampling overflows its value allocation on the retained valid 2x3 raster; verified native repair required.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
      "packages/e2e/fixtures/postgis-raster-native-safety-evidence.json",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      safetyDisposition: "safety-rejected",
      nativeRepairAcceptance: "pending",
      nativeSymbol: "RASTER_quantile",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Captured typed overload retained but rejected before SQL submission: fixed 0.1 native sampling overflows its value allocation on the retained valid 2x3 raster; verified native repair required.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
      "packages/e2e/fixtures/postgis-raster-native-safety-evidence.json",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      safetyDisposition: "safety-rejected",
      nativeRepairAcceptance: "pending",
      nativeSymbol: "RASTER_quantile",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog._float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog._float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog._float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxquantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_approxsummarystats($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asbinary($extension:postgis_raster.raster,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asgdalraster($extension:postgis_raster.raster,pg_catalog.text,pg_catalog._text,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_ashexwkb($extension:postgis_raster.raster,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asjpeg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_aspect($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_aspect($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_aspng($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog._text,pg_catalog._float8,pg_catalog._float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asraster($extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_asrasteragg($extension:postgis.geometry,pg_catalog.float8,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog._text,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.text,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog._text,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_astiff($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_aswkb($extension:postgis_raster.raster,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_band($extension:postgis_raster.raster,pg_catalog._int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_band($extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_band($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bpchar)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_bandfilesize($extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_bandfiletimestamp($extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_bandisnodata($extension:postgis_raster.raster,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_bandisnodata($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog._int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_bandmetadata($extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_bandnodatavalue($extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_bandpath($extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_bandpixeltype($extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,pg_catalog._int4,$extension:postgis.geometry,pg_catalog._float8,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_clip($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_colormap($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_colormap($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_contains($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_contains($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_containsproperly($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_containsproperly($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_contour($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog._float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_convexhull($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_count($extension:postgis_raster.raster,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_count($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_countagg($extension:postgis_raster.raster,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_countagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_countagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_coveredby($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_coveredby($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_covers($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_covers($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_createoverview(pg_catalog.regclass,pg_catalog.name,pg_catalog.int4,pg_catalog.text)",
    disposition: "tooling",
    reason:
      "Captured DDL/constraint/overview operation requires explicit owned migration/operator execution; absent from application query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_dfullywithin($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_dfullywithin($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_disjoint($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_disjoint($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_distinct4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_distinct4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_dumpaspolygons($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_dumpvalues($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_dumpvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_dwithin($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_dwithin($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_envelope($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_fromgdalraster(pg_catalog.bytea,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_gdaldrivers()",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_georeference($extension:postgis_raster.raster,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_geotransform($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_grayscale($extension:postgis_raster._rastbandarg,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_grayscale($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_hasnoband($extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_height($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_hillshade($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_hillshade($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_histogram($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_interpolateraster($extension:postgis.geometry,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog._float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog._float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,$extension:postgis.geometry)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog._float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_intersection($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_intersection($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_intersectionfractions($extension:postgis_raster.raster,$extension:postgis.geometry)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_intersects($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_intersects($extension:postgis.geometry,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_invdistweight4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_iscoveragetile($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_isempty($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_makeemptycoverage(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_makeemptyraster($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_makeemptyraster(pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_makeemptyraster(pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster._rastbandarg,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog._float8,pg_catalog.bool,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebra($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebraexpr($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog.text,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.regprocedure)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.regprocedure,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.regprocedure)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.regprocedure,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.regprocedure)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.regprocedure,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebrafct($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.regprocedure)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mapalgebrafctngb($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.regprocedure,pg_catalog.text,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_max4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_max4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mean4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mean4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_memsize($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_metadata($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_min4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_min4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_minconvexhull($extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_mindist4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_minpossiblevalue(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_nearestvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_neighborhood($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_notsamealignmentreason($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_numbands($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_overlaps($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_overlaps($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_pixelascentroid($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_pixelascentroids($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_pixelaspoint($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_pixelaspoints($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_pixelaspolygon($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_pixelaspolygons($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_pixelheight($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_pixelofvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_pixelwidth($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_polygon($extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog._float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_quantile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_range4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_range4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_rastertoworldcoord($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_rastertoworldcoordx($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_rastertoworldcoordx($extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_rastertoworldcoordy($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_rastertoworldcoordy($extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_rastfromhexwkb(pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_rastfromwkb(pg_catalog.bytea)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_reclass($extension:postgis_raster.raster,$extension:postgis_raster._reclassarg)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_reclass($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_reclass($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_reclassexact($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog._float8,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_resample($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_rescale($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_rescale($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_resize($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_resize($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_resize($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_reskew($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_reskew($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_retile(pg_catalog.regclass,pg_catalog.name,$extension:postgis.geometry,pg_catalog.float8,pg_catalog.float8,pg_catalog.int4,pg_catalog.int4,pg_catalog.text)",
    disposition: "tooling",
    reason:
      "Captured DDL/constraint/overview operation requires explicit owned migration/operator execution; absent from application query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_rotation($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_roughness($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_roughness($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_samealignment($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_samealignment($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_samealignment(pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_scalex($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_scaley($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setbandindex($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setbandisnodata($extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setbandnodatavalue($extension:postgis_raster.raster,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setbandnodatavalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setbandpath($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setgeoreference($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setgeoreference($extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setgeotransform($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact captured signature retained but safety-rejected pending verified native repair. RASTER_setGeotransform deserializes only the header then serializes retained nonzero numBands with NULL bands; valid banded inputs crash the selected 3.6.4 binary before returning.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
      "packages/e2e/fixtures/postgis-raster-native-safety-evidence.json",
    ],
    semantics: {
      safetyDisposition: "safety-rejected",
      nativeRepairAcceptance: "pending",
      nativeSymbol: "RASTER_setGeotransform",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setm($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setrotation($extension:postgis_raster.raster,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setscale($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setscale($extension:postgis_raster.raster,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setskew($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setskew($extension:postgis_raster.raster,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setsrid($extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setupperleft($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setvalue($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster._geomval,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog._bool,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setvalues($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_setz($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.text,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_skewx($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_skewy($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_slope($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_slope($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_snaptogrid($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_snaptogrid($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_snaptogrid($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_srid($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_stddev4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_stddev4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_sum4ma(pg_catalog._float8,pg_catalog._int4,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_sum4ma(pg_catalog._float8,pg_catalog.text,pg_catalog._text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_summary($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_summarystats($extension:postgis_raster.raster,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_summarystats($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_summarystatsagg($extension:postgis_raster.raster,pg_catalog.bool,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_summarystatsagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_summarystatsagg($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_tile($extension:postgis_raster.raster,pg_catalog._int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_tile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_tile($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_touches($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_touches($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_tpi($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_tpi($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.text,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_transform($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.float8,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_tri($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_tri($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,$extension:postgis_raster._unionarg)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_union($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_upperleftx($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_upperlefty($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,$extension:postgis.geometry,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.text)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_value($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuecount($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuecount(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog._float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuepercent($extension:postgis_raster.raster,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog._float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog._float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog._float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_valuepercent(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_width($extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_within($extension:postgis_raster.raster,$extension:postgis_raster.raster)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_within($extension:postgis_raster.raster,pg_catalog.int4,$extension:postgis_raster.raster,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_worldtorastercoord($extension:postgis_raster.raster,$extension:postgis.geometry)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_worldtorastercoord($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_worldtorastercoordx($extension:postgis_raster.raster,$extension:postgis.geometry)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_worldtorastercoordx($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_worldtorastercoordx($extension:postgis_raster.raster,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_worldtorastercoordy($extension:postgis_raster.raster,$extension:postgis.geometry)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_worldtorastercoordy($extension:postgis_raster.raster,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.st_worldtorastercoordy($extension:postgis_raster.raster,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact SQL-callable captured signature with native result codec and qualified selected namespace. PostgreSQL evaluates the raster operation.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.updaterastersrid(pg_catalog.name,pg_catalog.name,pg_catalog.int4)",
    disposition: "tooling",
    reason:
      "Captured DDL/constraint/overview operation requires explicit owned migration/operator execution; absent from application query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "routine:$extension:postgis_raster.updaterastersrid(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.int4)",
    disposition: "tooling",
    reason:
      "Captured DDL/constraint/overview operation requires explicit owned migration/operator execution; absent from application query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'rule:"_RETURN" on "$extension:postgis_raster".raster_columns',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'rule:"_RETURN" on "$extension:postgis_raster".raster_overviews',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: "type:$extension:postgis_raster._addbandarg",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster._agg_count",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster._agg_samealignment",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster._geomval",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster._rastbandarg",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster._raster",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster._raster_columns",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster._raster_overviews",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster._reclassarg",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster._summarystats",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster._unionarg",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster.addbandarg",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster.agg_count",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster.agg_samealignment",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster.geomval",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster.rastbandarg",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster.raster",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster.raster_columns",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster.raster_overviews",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster.reclassarg",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster.summarystats",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:postgis_raster.unionarg",
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_columns.blocksize_x',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_columns.blocksize_y',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_columns.extent',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_columns.nodata_values',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_columns.num_bands',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_columns.out_db',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_columns.pixel_types',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_columns.r_raster_column',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_columns.r_table_catalog',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_columns.r_table_name',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_columns.r_table_schema',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_columns.regular_blocking',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_columns.same_alignment',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_columns.scale_x',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_columns.scale_y',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_columns.spatial_index',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_columns.srid',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_overviews.o_raster_column',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_overviews.o_table_catalog',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_overviews.o_table_name',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_overviews.o_table_schema',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_overviews.overview_factor',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_overviews.r_raster_column',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_overviews.r_table_catalog',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_overviews.r_table_name',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view column:"$extension:postgis_raster".raster_overviews.r_table_schema',
    disposition: "internal",
    reason:
      "Requires its specific captured type/aggregate/access-method/catalog graph transfer and actual native observation; no JavaScript raster algorithm is inferred.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeGraphTransfer: "unresolved",
    },
  },
  {
    id: 'view:"$extension:postgis_raster".raster_columns',
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'view:"$extension:postgis_raster".raster_overviews',
    disposition: "schema",
    reason: "Captured native type/relation/index declaration with exact namespace and identity.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/postgis_raster.json",
      "https://postgis.net/docs/manual-3.6/RT_reference.html",
      "apps/loom/src/core/extensions/adapters/postgis-raster.ts",
      "packages/tests/unit/extensions-postgis-raster.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
] as const;
