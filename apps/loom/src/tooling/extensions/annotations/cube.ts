/** Exact member dispositions. Acceptance stays pending until native and isolated-consumer host proofs. */
export const cubeAnnotations = [
  {
    id: 'function of access method:function 1 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree',
    disposition: "internal",
    reason:
      'Captured access-method attachment function 1 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree; linked to "$extension:cube".cube_ops USING btree. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".cube_ops USING btree',
    },
  },
  {
    id: 'function of access method:function 1 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment function 1 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist; linked to "$extension:cube".gist_cube_ops USING gist. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".gist_cube_ops USING gist',
    },
  },
  {
    id: 'function of access method:function 2 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment function 2 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist; linked to "$extension:cube".gist_cube_ops USING gist. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".gist_cube_ops USING gist',
    },
  },
  {
    id: 'function of access method:function 5 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment function 5 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist; linked to "$extension:cube".gist_cube_ops USING gist. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".gist_cube_ops USING gist',
    },
  },
  {
    id: 'function of access method:function 6 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment function 6 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist; linked to "$extension:cube".gist_cube_ops USING gist. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".gist_cube_ops USING gist',
    },
  },
  {
    id: 'function of access method:function 7 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment function 7 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist; linked to "$extension:cube".gist_cube_ops USING gist. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".gist_cube_ops USING gist',
    },
  },
  {
    id: 'function of access method:function 8 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment function 8 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist; linked to "$extension:cube".gist_cube_ops USING gist. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".gist_cube_ops USING gist',
    },
  },
  {
    id: "opclass:$extension:cube.cube_ops/btree",
    disposition: "schema",
    reason: "Native captured btree index class with qualified schema and native cube storage metadata.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "opclass:$extension:cube.gist_cube_ops/gist",
    disposition: "schema",
    reason: "Native captured gist index class with qualified schema and native cube storage metadata.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: 'operator of access method:operator 1 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator 1 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree; linked to "$extension:cube".cube_ops USING btree. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".cube_ops USING btree',
    },
  },
  {
    id: 'operator of access method:operator 15 ("$extension:cube".cube, integer) of "$extension:cube".gist_cube_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator 15 ("$extension:cube".cube, integer) of "$extension:cube".gist_cube_ops USING gist; linked to "$extension:cube".gist_cube_ops USING gist. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".gist_cube_ops USING gist',
    },
  },
  {
    id: 'operator of access method:operator 16 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator 16 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist; linked to "$extension:cube".gist_cube_ops USING gist. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".gist_cube_ops USING gist',
    },
  },
  {
    id: 'operator of access method:operator 17 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator 17 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist; linked to "$extension:cube".gist_cube_ops USING gist. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".gist_cube_ops USING gist',
    },
  },
  {
    id: 'operator of access method:operator 18 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator 18 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist; linked to "$extension:cube".gist_cube_ops USING gist. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".gist_cube_ops USING gist',
    },
  },
  {
    id: 'operator of access method:operator 2 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator 2 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree; linked to "$extension:cube".cube_ops USING btree. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".cube_ops USING btree',
    },
  },
  {
    id: 'operator of access method:operator 3 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator 3 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree; linked to "$extension:cube".cube_ops USING btree. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".cube_ops USING btree',
    },
  },
  {
    id: 'operator of access method:operator 3 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator 3 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist; linked to "$extension:cube".gist_cube_ops USING gist. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".gist_cube_ops USING gist',
    },
  },
  {
    id: 'operator of access method:operator 4 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator 4 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree; linked to "$extension:cube".cube_ops USING btree. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".cube_ops USING btree',
    },
  },
  {
    id: 'operator of access method:operator 5 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator 5 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".cube_ops USING btree; linked to "$extension:cube".cube_ops USING btree. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".cube_ops USING btree',
    },
  },
  {
    id: 'operator of access method:operator 6 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator 6 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist; linked to "$extension:cube".gist_cube_ops USING gist. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".gist_cube_ops USING gist',
    },
  },
  {
    id: 'operator of access method:operator 7 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator 7 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist; linked to "$extension:cube".gist_cube_ops USING gist. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".gist_cube_ops USING gist',
    },
  },
  {
    id: 'operator of access method:operator 8 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist',
    disposition: "internal",
    reason:
      'Captured access-method attachment operator 8 ("$extension:cube".cube, "$extension:cube".cube) of "$extension:cube".gist_cube_ops USING gist; linked to "$extension:cube".gist_cube_ops USING gist. It is catalog wiring, not a separate ordinary SQL routine.',
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: '"$extension:cube".gist_cube_ops USING gist',
    },
  },
  {
    id: "operator:$extension:cube.->($extension:cube.cube,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact sql.overloads[operator:$extension:cube.->($extension:cube.cube,pg_catalog.int4)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "operator:$extension:cube.@>($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[operator:$extension:cube.@>($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "operator:$extension:cube.&&($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[operator:$extension:cube.&&($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "operator:$extension:cube.<->($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[operator:$extension:cube.<->($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "operator:$extension:cube.<($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[operator:$extension:cube.<($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "operator:$extension:cube.<@($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[operator:$extension:cube.<@($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "operator:$extension:cube.<#>($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[operator:$extension:cube.<#>($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "operator:$extension:cube.<=($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[operator:$extension:cube.<=($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "operator:$extension:cube.<=>($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[operator:$extension:cube.<=>($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "operator:$extension:cube.<>($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[operator:$extension:cube.<>($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "operator:$extension:cube.=($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[operator:$extension:cube.=($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "operator:$extension:cube.>($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[operator:$extension:cube.>($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "operator:$extension:cube.>=($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[operator:$extension:cube.>=($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "operator:$extension:cube.~>($extension:cube.cube,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact sql.overloads[operator:$extension:cube.~>($extension:cube.cube,pg_catalog.int4)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "opfamily:$extension:cube.cube_ops/btree",
    disposition: "internal",
    reason:
      "Catalog linkage backing the selected index class; not a separately callable query. Captured strategies and support procedures are preserved under the parent class.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: "opclass:$extension:cube.cube_ops/btree",
    },
  },
  {
    id: "opfamily:$extension:cube.gist_cube_ops/gist",
    disposition: "internal",
    reason:
      "Catalog linkage backing the selected index class; not a separately callable query. Captured strategies and support procedures are preserved under the parent class.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: "opclass:$extension:cube.gist_cube_ops/gist",
    },
  },
  {
    id: "routine:$extension:cube.cube_cmp($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_cmp($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_contained($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_contained($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_contains($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_contains($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_coord_llur($extension:cube.cube,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_coord_llur($extension:cube.cube,pg_catalog.int4)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_coord($extension:cube.cube,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_coord($extension:cube.cube,pg_catalog.int4)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_dim($extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_dim($extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_distance($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_distance($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_enlarge($extension:cube.cube,pg_catalog.float8,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_enlarge($extension:cube.cube,pg_catalog.float8,pg_catalog.int4)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_eq($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_eq($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_ge($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_ge($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_gt($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_gt($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_in(pg_catalog.cstring)",
    disposition: "internal",
    reason:
      "Backend callback requires cstring; exact captured linkage: type:$extension:cube.cube input. SQL pseudo-types cannot be bound as application values. Native callback proof remains pending.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: "type:$extension:cube.cube input",
    },
  },
  {
    id: "routine:$extension:cube.cube_inter($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_inter($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_is_point($extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_is_point($extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_le($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_le($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_ll_coord($extension:cube.cube,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_ll_coord($extension:cube.cube,pg_catalog.int4)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_lt($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_lt($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_ne($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_ne($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_out($extension:cube.cube)",
    disposition: "internal",
    reason:
      "Backend callback requires cstring result; exact captured linkage: type:$extension:cube.cube output. SQL pseudo-types cannot be bound as application values. Native callback proof remains pending.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: "type:$extension:cube.cube output",
    },
  },
  {
    id: "routine:$extension:cube.cube_overlap($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_overlap($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_recv(pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Backend callback requires internal; exact captured linkage: type:$extension:cube.cube receive. SQL pseudo-types cannot be bound as application values. Native callback proof remains pending.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: "type:$extension:cube.cube receive",
    },
  },
  {
    id: "routine:$extension:cube.cube_send($extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_send($extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_size($extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_size($extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_subset($extension:cube.cube,pg_catalog._int4)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_subset($extension:cube.cube,pg_catalog._int4)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_union($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_union($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube_ur_coord($extension:cube.cube,pg_catalog.int4)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube_ur_coord($extension:cube.cube,pg_catalog.int4)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube($extension:cube.cube,pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube($extension:cube.cube,pg_catalog.float8,pg_catalog.float8)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube($extension:cube.cube,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube($extension:cube.cube,pg_catalog.float8)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube(pg_catalog._float8,pg_catalog._float8)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube(pg_catalog._float8,pg_catalog._float8)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube(pg_catalog._float8)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube(pg_catalog._float8)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube(pg_catalog.float8,pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube(pg_catalog.float8,pg_catalog.float8)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.cube(pg_catalog.float8)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.cube(pg_catalog.float8)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.distance_chebyshev($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.distance_chebyshev($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.distance_taxicab($extension:cube.cube,$extension:cube.cube)",
    disposition: "query",
    reason:
      "Exact sql.overloads[routine:$extension:cube.distance_taxicab($extension:cube.cube,$extension:cube.cube)] binds the captured function/operator and its paired argument/result codecs; ordinary C routines remain public query helpers.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      authority: "query",
      observability: "tables",
      nulls: "SQL NULL propagates; cube arrays retain NULL elements, dimensions and bounds.",
      transport:
        "Native cube corners and point shape; float8 nonfinite values use explicit wire objects. PostgreSQL owns ordering, compression, missing dimensions and geometric semantics.",
    },
  },
  {
    id: "routine:$extension:cube.g_cube_consistent(pg_catalog.internal,$extension:cube.cube,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Backend callback requires internal; exact captured linkage: opfamily:$extension:cube.gist_cube_ops/gist support 1. SQL pseudo-types cannot be bound as application values. Native callback proof remains pending.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: "opfamily:$extension:cube.gist_cube_ops/gist support 1",
    },
  },
  {
    id: "routine:$extension:cube.g_cube_distance(pg_catalog.internal,$extension:cube.cube,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Backend callback requires internal; exact captured linkage: opfamily:$extension:cube.gist_cube_ops/gist support 8. SQL pseudo-types cannot be bound as application values. Native callback proof remains pending.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: "opfamily:$extension:cube.gist_cube_ops/gist support 8",
    },
  },
  {
    id: "routine:$extension:cube.g_cube_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Backend callback requires internal; exact captured linkage: opfamily:$extension:cube.gist_cube_ops/gist support 5. SQL pseudo-types cannot be bound as application values. Native callback proof remains pending.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: "opfamily:$extension:cube.gist_cube_ops/gist support 5",
    },
  },
  {
    id: "routine:$extension:cube.g_cube_picksplit(pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Backend callback requires internal; exact captured linkage: opfamily:$extension:cube.gist_cube_ops/gist support 6. SQL pseudo-types cannot be bound as application values. Native callback proof remains pending.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: "opfamily:$extension:cube.gist_cube_ops/gist support 6",
    },
  },
  {
    id: "routine:$extension:cube.g_cube_same($extension:cube.cube,$extension:cube.cube,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Backend callback requires internal; exact captured linkage: opfamily:$extension:cube.gist_cube_ops/gist support 7. SQL pseudo-types cannot be bound as application values. Native callback proof remains pending.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: "opfamily:$extension:cube.gist_cube_ops/gist support 7",
    },
  },
  {
    id: "routine:$extension:cube.g_cube_union(pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "Backend callback requires internal; exact captured linkage: opfamily:$extension:cube.gist_cube_ops/gist support 2. SQL pseudo-types cannot be bound as application values. Native callback proof remains pending.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      parent: "opfamily:$extension:cube.gist_cube_ops/gist support 2",
    },
  },
  {
    id: "type:$extension:cube._cube",
    disposition: "schema",
    reason: "Native scalar/array field with exact type identity and paired cube codec.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
  {
    id: "type:$extension:cube.cube",
    disposition: "schema",
    reason: "Native scalar/array field with exact type identity and paired cube codec.",
    evidence: [
      "apps/loom/src/tooling/extensions/manifests/cube.json",
      "https://www.postgresql.org/docs/18/cube.html",
      "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/cube/cube.c",
      "apps/loom/src/core/extensions/adapters/cube.ts",
      "packages/tests/unit/extensions-cube.test.ts",
      "packages/tests/types/extensions-cube.test-d.ts",
      "packages/e2e/integration/extensions-cube.test.ts",
    ],
    semantics: {
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
] as const;
