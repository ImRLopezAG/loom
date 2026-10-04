/** Exact h3 4.2.3 dispositions; acceptance remains pending until host native and isolated-consumer proofs. */
export const h3Annotations = [
  {
    "id": "cast:$extension:h3.h3index->pg_catalog.int8",
    "disposition": "query",
    "reason": "Exact captured cast cast:$extension:h3.h3index->pg_catalog.int8; H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "cast:$extension:h3.h3index->pg_catalog.point",
    "disposition": "query",
    "reason": "Exact captured cast cast:$extension:h3.h3index->pg_catalog.point; H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "cast:pg_catalog.int8->$extension:h3.h3index",
    "disposition": "query",
    "reason": "Exact captured cast cast:pg_catalog.int8->$extension:h3.h3index; H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "function of access method:function 1 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin",
    "disposition": "internal",
    "reason": "Captured function of access method:function 1 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "function of access method:function 1 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING btree",
    "disposition": "internal",
    "reason": "Captured function of access method:function 1 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING btree is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "function of access method:function 1 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING hash",
    "disposition": "internal",
    "reason": "Captured function of access method:function 1 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING hash is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "function of access method:function 1 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops_experimental USING spgist",
    "disposition": "internal",
    "reason": "Captured function of access method:function 1 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops_experimental USING spgist is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "function of access method:function 2 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin",
    "disposition": "internal",
    "reason": "Captured function of access method:function 2 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "function of access method:function 2 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING btree",
    "disposition": "internal",
    "reason": "Captured function of access method:function 2 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING btree is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "function of access method:function 2 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING hash",
    "disposition": "internal",
    "reason": "Captured function of access method:function 2 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING hash is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "function of access method:function 2 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops_experimental USING spgist",
    "disposition": "internal",
    "reason": "Captured function of access method:function 2 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops_experimental USING spgist is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "function of access method:function 3 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin",
    "disposition": "internal",
    "reason": "Captured function of access method:function 3 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "function of access method:function 3 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops_experimental USING spgist",
    "disposition": "internal",
    "reason": "Captured function of access method:function 3 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops_experimental USING spgist is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "function of access method:function 4 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin",
    "disposition": "internal",
    "reason": "Captured function of access method:function 4 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "function of access method:function 4 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops_experimental USING spgist",
    "disposition": "internal",
    "reason": "Captured function of access method:function 4 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops_experimental USING spgist is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "function of access method:function 5 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops_experimental USING spgist",
    "disposition": "internal",
    "reason": "Captured function of access method:function 5 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops_experimental USING spgist is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "opclass:$extension:h3.h3index_minmax_ops/brin",
    "disposition": "schema",
    "reason": "Exact captured opclass opclass:$extension:h3.h3index_minmax_ops/brin; exposed as a field or index contract bound to the installation schema.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "opclass:$extension:h3.h3index_ops/btree",
    "disposition": "schema",
    "reason": "Exact captured opclass opclass:$extension:h3.h3index_ops/btree; exposed as a field or index contract bound to the installation schema.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "opclass:$extension:h3.h3index_ops/hash",
    "disposition": "schema",
    "reason": "Exact captured opclass opclass:$extension:h3.h3index_ops/hash; exposed as a field or index contract bound to the installation schema.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "opclass:$extension:h3.h3index_ops_experimental/spgist",
    "disposition": "schema",
    "reason": "Exact captured opclass opclass:$extension:h3.h3index_ops_experimental/spgist; exposed as a field or index contract bound to the installation schema.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator of access method:operator 1 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin",
    "disposition": "internal",
    "reason": "Captured operator of access method:operator 1 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator of access method:operator 1 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING btree",
    "disposition": "internal",
    "reason": "Captured operator of access method:operator 1 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING btree is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator of access method:operator 1 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING hash",
    "disposition": "internal",
    "reason": "Captured operator of access method:operator 1 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING hash is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator of access method:operator 2 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin",
    "disposition": "internal",
    "reason": "Captured operator of access method:operator 2 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator of access method:operator 2 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING btree",
    "disposition": "internal",
    "reason": "Captured operator of access method:operator 2 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING btree is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator of access method:operator 3 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin",
    "disposition": "internal",
    "reason": "Captured operator of access method:operator 3 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator of access method:operator 3 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING btree",
    "disposition": "internal",
    "reason": "Captured operator of access method:operator 3 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING btree is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator of access method:operator 4 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin",
    "disposition": "internal",
    "reason": "Captured operator of access method:operator 4 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator of access method:operator 4 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING btree",
    "disposition": "internal",
    "reason": "Captured operator of access method:operator 4 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING btree is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator of access method:operator 5 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin",
    "disposition": "internal",
    "reason": "Captured operator of access method:operator 5 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_minmax_ops USING brin is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator of access method:operator 5 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING btree",
    "disposition": "internal",
    "reason": "Captured operator of access method:operator 5 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops USING btree is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator of access method:operator 6 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops_experimental USING spgist",
    "disposition": "internal",
    "reason": "Captured operator of access method:operator 6 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops_experimental USING spgist is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator of access method:operator 7 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops_experimental USING spgist",
    "disposition": "internal",
    "reason": "Captured operator of access method:operator 7 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops_experimental USING spgist is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator of access method:operator 8 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops_experimental USING spgist",
    "disposition": "internal",
    "reason": "Captured operator of access method:operator 8 (\"$extension:h3\".h3index, \"$extension:h3\".h3index) of \"$extension:h3\".h3index_ops_experimental USING spgist is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator:$extension:h3.&&($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured operator operator:$extension:h3.&&($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator:$extension:h3.<($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured operator operator:$extension:h3.<($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator:$extension:h3.<->($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured operator operator:$extension:h3.<->($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator:$extension:h3.<=($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured operator operator:$extension:h3.<=($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator:$extension:h3.<>($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured operator operator:$extension:h3.<>($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator:$extension:h3.<@($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured operator operator:$extension:h3.<@($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator:$extension:h3.=($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured operator operator:$extension:h3.=($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator:$extension:h3.>($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured operator operator:$extension:h3.>($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator:$extension:h3.>=($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured operator operator:$extension:h3.>=($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "operator:$extension:h3.@>($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured operator operator:$extension:h3.@>($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "opfamily:$extension:h3.h3index_minmax_ops/brin",
    "disposition": "internal",
    "reason": "Captured opfamily:$extension:h3.h3index_minmax_ops/brin is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "opfamily:$extension:h3.h3index_ops/btree",
    "disposition": "internal",
    "reason": "Captured opfamily:$extension:h3.h3index_ops/btree is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "opfamily:$extension:h3.h3index_ops/hash",
    "disposition": "internal",
    "reason": "Captured opfamily:$extension:h3.h3index_ops/hash is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "opfamily:$extension:h3.h3index_ops_experimental/spgist",
    "disposition": "internal",
    "reason": "Captured opfamily:$extension:h3.h3index_ops_experimental/spgist is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.__h3_cell_to_children_aux($extension:h3.h3index,pg_catalog.int4,pg_catalog.int4)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.__h3_cell_to_children_aux($extension:h3.h3index,pg_catalog.int4,pg_catalog.int4); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.bigint_to_h3index(pg_catalog.int8)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.bigint_to_h3index(pg_catalog.int8); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_are_neighbor_cells($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_are_neighbor_cells($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cell_area($extension:h3.h3index,pg_catalog.text)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cell_area($extension:h3.h3index,pg_catalog.text); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cell_to_boundary($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cell_to_boundary($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cell_to_boundary($extension:h3.h3index,pg_catalog.bool)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cell_to_boundary($extension:h3.h3index,pg_catalog.bool); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cell_to_center_child($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cell_to_center_child($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cell_to_center_child($extension:h3.h3index,pg_catalog.int4)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cell_to_center_child($extension:h3.h3index,pg_catalog.int4); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cell_to_child_pos($extension:h3.h3index,pg_catalog.int4)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cell_to_child_pos($extension:h3.h3index,pg_catalog.int4); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cell_to_children($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cell_to_children($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cell_to_children($extension:h3.h3index,pg_catalog.int4)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cell_to_children($extension:h3.h3index,pg_catalog.int4); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cell_to_children_slow($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cell_to_children_slow($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cell_to_children_slow($extension:h3.h3index,pg_catalog.int4)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cell_to_children_slow($extension:h3.h3index,pg_catalog.int4); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cell_to_lat_lng($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cell_to_lat_lng($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cell_to_latlng($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cell_to_latlng($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cell_to_local_ij($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cell_to_local_ij($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cell_to_parent($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cell_to_parent($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cell_to_parent($extension:h3.h3index,pg_catalog.int4)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cell_to_parent($extension:h3.h3index,pg_catalog.int4); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cell_to_vertex($extension:h3.h3index,pg_catalog.int4)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cell_to_vertex($extension:h3.h3index,pg_catalog.int4); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cell_to_vertexes($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cell_to_vertexes($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cells_to_directed_edge($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cells_to_directed_edge($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_cells_to_multi_polygon($extension:h3._h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_cells_to_multi_polygon($extension:h3._h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_child_pos_to_cell(pg_catalog.int8,$extension:h3.h3index,pg_catalog.int4)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_child_pos_to_cell(pg_catalog.int8,$extension:h3.h3index,pg_catalog.int4); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_compact_cells($extension:h3._h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_compact_cells($extension:h3._h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_directed_edge_to_boundary($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_directed_edge_to_boundary($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_directed_edge_to_cells($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_directed_edge_to_cells($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_edge_length($extension:h3.h3index,pg_catalog.text)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_edge_length($extension:h3.h3index,pg_catalog.text); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_get_base_cell_number($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_get_base_cell_number($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_get_directed_edge_destination($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_get_directed_edge_destination($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_get_directed_edge_origin($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_get_directed_edge_origin($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_get_extension_version()",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_get_extension_version(); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_get_hexagon_area_avg(pg_catalog.int4,pg_catalog.text)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_get_hexagon_area_avg(pg_catalog.int4,pg_catalog.text); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_get_hexagon_edge_length_avg(pg_catalog.int4,pg_catalog.text)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_get_hexagon_edge_length_avg(pg_catalog.int4,pg_catalog.text); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_get_icosahedron_faces($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_get_icosahedron_faces($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_get_num_cells(pg_catalog.int4)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_get_num_cells(pg_catalog.int4); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_get_pentagons(pg_catalog.int4)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_get_pentagons(pg_catalog.int4); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_get_res_0_cells()",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_get_res_0_cells(); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_get_resolution($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_get_resolution($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_great_circle_distance(pg_catalog.point,pg_catalog.point,pg_catalog.text)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_great_circle_distance(pg_catalog.point,pg_catalog.point,pg_catalog.text); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_grid_disk($extension:h3.h3index,pg_catalog.int4)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_grid_disk($extension:h3.h3index,pg_catalog.int4); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_grid_disk_distances($extension:h3.h3index,pg_catalog.int4)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_grid_disk_distances($extension:h3.h3index,pg_catalog.int4); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_grid_distance($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_grid_distance($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_grid_path_cells($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_grid_path_cells($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_grid_ring_unsafe($extension:h3.h3index,pg_catalog.int4)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_grid_ring_unsafe($extension:h3.h3index,pg_catalog.int4); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_is_pentagon($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_is_pentagon($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_is_res_class_iii($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_is_res_class_iii($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_is_valid_cell($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_is_valid_cell($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_is_valid_directed_edge($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_is_valid_directed_edge($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_is_valid_vertex($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_is_valid_vertex($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_lat_lng_to_cell(pg_catalog.point,pg_catalog.int4)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_lat_lng_to_cell(pg_catalog.point,pg_catalog.int4); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_latlng_to_cell(pg_catalog.point,pg_catalog.int4)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_latlng_to_cell(pg_catalog.point,pg_catalog.int4); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_local_ij_to_cell($extension:h3.h3index,pg_catalog.point)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_local_ij_to_cell($extension:h3.h3index,pg_catalog.point); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_origin_to_directed_edges($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_origin_to_directed_edges($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_pg_migrate_pass_by_reference($extension:h3.h3index)",
    "disposition": "tooling",
    "reason": "Captured h3_pg_migrate_pass_by_reference rewrites stored pass-by-reference values during a 3.x upgrade and dereferences its argument as a pointer; it is an upgrade tool, not a query helper.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_polygon_to_cells(pg_catalog.polygon,pg_catalog._polygon,pg_catalog.int4)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_polygon_to_cells(pg_catalog.polygon,pg_catalog._polygon,pg_catalog.int4); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_polygon_to_cells_experimental(pg_catalog.polygon,pg_catalog._polygon,pg_catalog.int4,pg_catalog.text)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_polygon_to_cells_experimental(pg_catalog.polygon,pg_catalog._polygon,pg_catalog.int4,pg_catalog.text); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_uncompact_cells($extension:h3._h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_uncompact_cells($extension:h3._h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_uncompact_cells($extension:h3._h3index,pg_catalog.int4)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_uncompact_cells($extension:h3._h3index,pg_catalog.int4); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_vertex_to_lat_lng($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_vertex_to_lat_lng($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3_vertex_to_latlng($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3_vertex_to_latlng($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_cmp($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3index_cmp($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_contained_by($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3index_contained_by($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_contains($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3index_contains($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_distance($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3index_distance($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_eq($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3index_eq($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_ge($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3index_ge($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_gt($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3index_gt($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_hash($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3index_hash($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_hash_extended($extension:h3.h3index,pg_catalog.int8)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3index_hash_extended($extension:h3.h3index,pg_catalog.int8); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_in(pg_catalog.cstring)",
    "disposition": "internal",
    "reason": "Captured routine:$extension:h3.h3index_in(pg_catalog.cstring) is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_le($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3index_le($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_lt($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3index_lt($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_ne($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3index_ne($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_out($extension:h3.h3index)",
    "disposition": "internal",
    "reason": "Captured routine:$extension:h3.h3index_out($extension:h3.h3index) is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_overlaps($extension:h3.h3index,$extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3index_overlaps($extension:h3.h3index,$extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_recv(pg_catalog.internal)",
    "disposition": "internal",
    "reason": "Captured routine:$extension:h3.h3index_recv(pg_catalog.internal) is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_send($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3index_send($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_sortsupport(pg_catalog.internal)",
    "disposition": "internal",
    "reason": "Captured routine:$extension:h3.h3index_sortsupport(pg_catalog.internal) is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_spgist_choose(pg_catalog.internal,pg_catalog.internal)",
    "disposition": "internal",
    "reason": "Captured routine:$extension:h3.h3index_spgist_choose(pg_catalog.internal,pg_catalog.internal) is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_spgist_config(pg_catalog.internal,pg_catalog.internal)",
    "disposition": "internal",
    "reason": "Captured routine:$extension:h3.h3index_spgist_config(pg_catalog.internal,pg_catalog.internal) is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_spgist_inner_consistent(pg_catalog.internal,pg_catalog.internal)",
    "disposition": "internal",
    "reason": "Captured routine:$extension:h3.h3index_spgist_inner_consistent(pg_catalog.internal,pg_catalog.internal) is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_spgist_leaf_consistent(pg_catalog.internal,pg_catalog.internal)",
    "disposition": "internal",
    "reason": "Captured routine:$extension:h3.h3index_spgist_leaf_consistent(pg_catalog.internal,pg_catalog.internal) is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_spgist_picksplit(pg_catalog.internal,pg_catalog.internal)",
    "disposition": "internal",
    "reason": "Captured routine:$extension:h3.h3index_spgist_picksplit(pg_catalog.internal,pg_catalog.internal) is a native type, access-method or opfamily support object that PostgreSQL invokes internally.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "routine:$extension:h3.h3index_to_bigint($extension:h3.h3index)",
    "disposition": "query",
    "reason": "Exact captured routine routine:$extension:h3.h3index_to_bigint($extension:h3.h3index); H3 computation is executed by PostgreSQL.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "type:$extension:h3._h3index",
    "disposition": "schema",
    "reason": "Exact captured type type:$extension:h3._h3index; exposed as a field or index contract bound to the installation schema.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  },
  {
    "id": "type:$extension:h3.h3index",
    "disposition": "schema",
    "reason": "Exact captured type type:$extension:h3.h3index; exposed as a field or index contract bound to the installation schema.",
    "evidence": [
      "apps/loom/src/tooling/extensions/manifests/h3.json",
      "https://github.com/zachasme/h3-pg/tree/v4.2.3",
      "apps/loom/src/core/extensions/adapters/h3.ts",
      "packages/tests/unit/extensions-h3.test.ts",
      "packages/tests/types/extensions-h3.test-d.ts",
      "packages/e2e/integration/extensions-h3.test.ts"
    ],
    "semantics": {
      "providerAcceptance": "pending",
      "publicExportAcceptance": "pending"
    }
  }
] as const;
