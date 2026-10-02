/** Immutable capture and reviewed semantic dispositions remain distinct. Neon/public-package acceptance belongs to the host. */
export const pgTrgmAnnotationContract = {
  extension: "pg_trgm",
  postgresMajor: 18,
  version: "1.6",
  provider: "neon",
  digest: "88e35b55b09e58d6a59847390006ca73483bdb4444346474beb644c63adcbe66",
  providerAcceptance: "passed",
  providerReceipt: "docs/validation/2026-10-02-typed-extensions-pg-trgm.md",
  publicExportAcceptance: "pending",
} as const;

export const pgTrgmAnnotations = [
  {
    id: 'function of access method:function 1 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gin_trgm_ops USING gin',
    disposition: "internal",
    reason:
      "Subordinate gin function registration 1 resolves to pg_catalog.btint4cmp(pg_catalog.int4,pg_catalog.int4) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin", "opfamily:$extension:pg_trgm.gin_trgm_ops/gin"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin function 1",
      },
    ],
    sqlDependency: "pg_catalog.btint4cmp(pg_catalog.int4,pg_catalog.int4)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'function of access method:function 1 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist function registration 1 resolves to $extension:pg_trgm.gtrgm_consistent(pg_catalog.internal,pg_catalog.text,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
      "opfamily:$extension:pg_trgm.gist_trgm_ops/gist",
      "routine:$extension:pg_trgm.gtrgm_consistent(pg_catalog.internal,pg_catalog.text,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist function 1",
      },
    ],
    sqlDependency:
      "$extension:pg_trgm.gtrgm_consistent(pg_catalog.internal,pg_catalog.text,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'function of access method:function 10 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist function registration 10 resolves to $extension:pg_trgm.gtrgm_options(pg_catalog.internal) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
      "opfamily:$extension:pg_trgm.gist_trgm_ops/gist",
      "routine:$extension:pg_trgm.gtrgm_options(pg_catalog.internal)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist function 10",
      },
    ],
    sqlDependency: "$extension:pg_trgm.gtrgm_options(pg_catalog.internal)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'function of access method:function 2 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gin_trgm_ops USING gin',
    disposition: "internal",
    reason:
      "Subordinate gin function registration 2 resolves to $extension:pg_trgm.gin_extract_value_trgm(pg_catalog.text,pg_catalog.internal) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gin_trgm_ops/gin",
      "opfamily:$extension:pg_trgm.gin_trgm_ops/gin",
      "routine:$extension:pg_trgm.gin_extract_value_trgm(pg_catalog.text,pg_catalog.internal)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin function 2",
      },
    ],
    sqlDependency: "$extension:pg_trgm.gin_extract_value_trgm(pg_catalog.text,pg_catalog.internal)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'function of access method:function 2 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist function registration 2 resolves to $extension:pg_trgm.gtrgm_union(pg_catalog.internal,pg_catalog.internal) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
      "opfamily:$extension:pg_trgm.gist_trgm_ops/gist",
      "routine:$extension:pg_trgm.gtrgm_union(pg_catalog.internal,pg_catalog.internal)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist function 2",
      },
    ],
    sqlDependency: "$extension:pg_trgm.gtrgm_union(pg_catalog.internal,pg_catalog.internal)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'function of access method:function 3 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gin_trgm_ops USING gin',
    disposition: "internal",
    reason:
      "Subordinate gin function registration 3 resolves to $extension:pg_trgm.gin_extract_query_trgm(pg_catalog.text,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gin_trgm_ops/gin",
      "opfamily:$extension:pg_trgm.gin_trgm_ops/gin",
      "routine:$extension:pg_trgm.gin_extract_query_trgm(pg_catalog.text,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin function 3",
      },
    ],
    sqlDependency:
      "$extension:pg_trgm.gin_extract_query_trgm(pg_catalog.text,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'function of access method:function 3 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist function registration 3 resolves to $extension:pg_trgm.gtrgm_compress(pg_catalog.internal) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
      "opfamily:$extension:pg_trgm.gist_trgm_ops/gist",
      "routine:$extension:pg_trgm.gtrgm_compress(pg_catalog.internal)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist function 3",
      },
    ],
    sqlDependency: "$extension:pg_trgm.gtrgm_compress(pg_catalog.internal)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'function of access method:function 4 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gin_trgm_ops USING gin',
    disposition: "internal",
    reason:
      "Subordinate gin function registration 4 resolves to $extension:pg_trgm.gin_trgm_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.text,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gin_trgm_ops/gin",
      "opfamily:$extension:pg_trgm.gin_trgm_ops/gin",
      "routine:$extension:pg_trgm.gin_trgm_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.text,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin function 4",
      },
    ],
    sqlDependency:
      "$extension:pg_trgm.gin_trgm_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.text,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'function of access method:function 4 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist function registration 4 resolves to $extension:pg_trgm.gtrgm_decompress(pg_catalog.internal) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
      "opfamily:$extension:pg_trgm.gist_trgm_ops/gist",
      "routine:$extension:pg_trgm.gtrgm_decompress(pg_catalog.internal)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist function 4",
      },
    ],
    sqlDependency: "$extension:pg_trgm.gtrgm_decompress(pg_catalog.internal)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'function of access method:function 5 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist function registration 5 resolves to $extension:pg_trgm.gtrgm_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
      "opfamily:$extension:pg_trgm.gist_trgm_ops/gist",
      "routine:$extension:pg_trgm.gtrgm_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist function 5",
      },
    ],
    sqlDependency: "$extension:pg_trgm.gtrgm_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'function of access method:function 6 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gin_trgm_ops USING gin',
    disposition: "internal",
    reason:
      "Subordinate gin function registration 6 resolves to $extension:pg_trgm.gin_trgm_triconsistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.text,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gin_trgm_ops/gin",
      "opfamily:$extension:pg_trgm.gin_trgm_ops/gin",
      "routine:$extension:pg_trgm.gin_trgm_triconsistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.text,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin function 6",
      },
    ],
    sqlDependency:
      "$extension:pg_trgm.gin_trgm_triconsistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.text,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'function of access method:function 6 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist function registration 6 resolves to $extension:pg_trgm.gtrgm_picksplit(pg_catalog.internal,pg_catalog.internal) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
      "opfamily:$extension:pg_trgm.gist_trgm_ops/gist",
      "routine:$extension:pg_trgm.gtrgm_picksplit(pg_catalog.internal,pg_catalog.internal)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist function 6",
      },
    ],
    sqlDependency: "$extension:pg_trgm.gtrgm_picksplit(pg_catalog.internal,pg_catalog.internal)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'function of access method:function 7 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist function registration 7 resolves to $extension:pg_trgm.gtrgm_same($extension:pg_trgm.gtrgm,$extension:pg_trgm.gtrgm,pg_catalog.internal) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
      "opfamily:$extension:pg_trgm.gist_trgm_ops/gist",
      "routine:$extension:pg_trgm.gtrgm_same($extension:pg_trgm.gtrgm,$extension:pg_trgm.gtrgm,pg_catalog.internal)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist function 7",
      },
    ],
    sqlDependency:
      "$extension:pg_trgm.gtrgm_same($extension:pg_trgm.gtrgm,$extension:pg_trgm.gtrgm,pg_catalog.internal)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'function of access method:function 8 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist function registration 8 resolves to $extension:pg_trgm.gtrgm_distance(pg_catalog.internal,pg_catalog.text,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
      "opfamily:$extension:pg_trgm.gist_trgm_ops/gist",
      "routine:$extension:pg_trgm.gtrgm_distance(pg_catalog.internal,pg_catalog.text,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist function 8",
      },
    ],
    sqlDependency:
      "$extension:pg_trgm.gtrgm_distance(pg_catalog.internal,pg_catalog.text,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "opclass:$extension:pg_trgm.gin_trgm_ops/gin",
    disposition: "schema",
    reason:
      "Public gin native pg_catalog.text operator-class contract retains selected schema/member/digest independently of field ownership; GIN supports captured filtering strategies and has no KNN ordering capability.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: "indexes.gin()",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.exactContractAndNativeIndexes",
        fixture: "gin",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gin",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin",
      },
    ],
    surface: "indexes.gin()",
    semantics: {
      authority: "schema",
      input: {
        namespace: "pg_catalog",
        name: "text",
      },
      storage: {
        namespace: "pg_catalog",
        name: "int4",
      },
      isDefault: false,
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
    disposition: "schema",
    reason:
      "Public gist native pg_catalog.text operator-class contract retains selected schema/member/digest independently of field ownership; supports validated siglen integer 1..2024 and KNN ordering.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: "indexes.gist()",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.exactContractAndNativeIndexes",
        fixture: "gist",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gist",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist",
      },
    ],
    surface: "indexes.gist()",
    semantics: {
      authority: "schema",
      input: {
        namespace: "pg_catalog",
        name: "text",
      },
      storage: {
        namespace: "$extension:pg_trgm",
        name: "gtrgm",
      },
      isDefault: false,
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 1 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gin_trgm_ops USING gin',
    disposition: "internal",
    reason:
      "Subordinate gin operator registration 1 resolves to $extension:pg_trgm.%(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gin_trgm_ops/gin",
      "opfamily:$extension:pg_trgm.gin_trgm_ops/gin",
      "operator:$extension:pg_trgm.%(pg_catalog.text,pg_catalog.text)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin operator 1",
      },
    ],
    sqlDependency: "$extension:pg_trgm.%(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 1 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist operator registration 1 resolves to $extension:pg_trgm.%(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
      "opfamily:$extension:pg_trgm.gist_trgm_ops/gist",
      "operator:$extension:pg_trgm.%(pg_catalog.text,pg_catalog.text)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist operator 1",
      },
    ],
    sqlDependency: "$extension:pg_trgm.%(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 10 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist operator registration 10 resolves to $extension:pg_trgm.<->>>(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
      "opfamily:$extension:pg_trgm.gist_trgm_ops/gist",
      "operator:$extension:pg_trgm.<->>>(pg_catalog.text,pg_catalog.text)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist operator 10",
      },
    ],
    sqlDependency: "$extension:pg_trgm.<->>>(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 11 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gin_trgm_ops USING gin',
    disposition: "internal",
    reason:
      "Subordinate gin operator registration 11 resolves to pg_catalog.=(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin", "opfamily:$extension:pg_trgm.gin_trgm_ops/gin"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin operator 11",
      },
    ],
    sqlDependency: "pg_catalog.=(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 11 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist operator registration 11 resolves to pg_catalog.=(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist", "opfamily:$extension:pg_trgm.gist_trgm_ops/gist"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist operator 11",
      },
    ],
    sqlDependency: "pg_catalog.=(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 2 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist operator registration 2 resolves to $extension:pg_trgm.<->(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
      "opfamily:$extension:pg_trgm.gist_trgm_ops/gist",
      "operator:$extension:pg_trgm.<->(pg_catalog.text,pg_catalog.text)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist operator 2",
      },
    ],
    sqlDependency: "$extension:pg_trgm.<->(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 3 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gin_trgm_ops USING gin',
    disposition: "internal",
    reason:
      "Subordinate gin operator registration 3 resolves to pg_catalog.~~(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin", "opfamily:$extension:pg_trgm.gin_trgm_ops/gin"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin operator 3",
      },
    ],
    sqlDependency: "pg_catalog.~~(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 3 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist operator registration 3 resolves to pg_catalog.~~(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist", "opfamily:$extension:pg_trgm.gist_trgm_ops/gist"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist operator 3",
      },
    ],
    sqlDependency: "pg_catalog.~~(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 4 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gin_trgm_ops USING gin',
    disposition: "internal",
    reason:
      "Subordinate gin operator registration 4 resolves to pg_catalog.~~*(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin", "opfamily:$extension:pg_trgm.gin_trgm_ops/gin"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin operator 4",
      },
    ],
    sqlDependency: "pg_catalog.~~*(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 4 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist operator registration 4 resolves to pg_catalog.~~*(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist", "opfamily:$extension:pg_trgm.gist_trgm_ops/gist"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist operator 4",
      },
    ],
    sqlDependency: "pg_catalog.~~*(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 5 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gin_trgm_ops USING gin',
    disposition: "internal",
    reason:
      "Subordinate gin operator registration 5 resolves to pg_catalog.~(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin", "opfamily:$extension:pg_trgm.gin_trgm_ops/gin"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin operator 5",
      },
    ],
    sqlDependency: "pg_catalog.~(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 5 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist operator registration 5 resolves to pg_catalog.~(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist", "opfamily:$extension:pg_trgm.gist_trgm_ops/gist"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist operator 5",
      },
    ],
    sqlDependency: "pg_catalog.~(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 6 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gin_trgm_ops USING gin',
    disposition: "internal",
    reason:
      "Subordinate gin operator registration 6 resolves to pg_catalog.~*(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin", "opfamily:$extension:pg_trgm.gin_trgm_ops/gin"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin operator 6",
      },
    ],
    sqlDependency: "pg_catalog.~*(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 6 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist operator registration 6 resolves to pg_catalog.~*(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist", "opfamily:$extension:pg_trgm.gist_trgm_ops/gist"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist operator 6",
      },
    ],
    sqlDependency: "pg_catalog.~*(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 7 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gin_trgm_ops USING gin',
    disposition: "internal",
    reason:
      "Subordinate gin operator registration 7 resolves to $extension:pg_trgm.%>(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gin_trgm_ops/gin",
      "opfamily:$extension:pg_trgm.gin_trgm_ops/gin",
      "operator:$extension:pg_trgm.%>(pg_catalog.text,pg_catalog.text)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin operator 7",
      },
    ],
    sqlDependency: "$extension:pg_trgm.%>(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 7 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist operator registration 7 resolves to $extension:pg_trgm.%>(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
      "opfamily:$extension:pg_trgm.gist_trgm_ops/gist",
      "operator:$extension:pg_trgm.%>(pg_catalog.text,pg_catalog.text)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist operator 7",
      },
    ],
    sqlDependency: "$extension:pg_trgm.%>(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 8 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist operator registration 8 resolves to $extension:pg_trgm.<->>(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
      "opfamily:$extension:pg_trgm.gist_trgm_ops/gist",
      "operator:$extension:pg_trgm.<->>(pg_catalog.text,pg_catalog.text)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist operator 8",
      },
    ],
    sqlDependency: "$extension:pg_trgm.<->>(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 9 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gin_trgm_ops USING gin',
    disposition: "internal",
    reason:
      "Subordinate gin operator registration 9 resolves to $extension:pg_trgm.%>>(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gin_trgm_ops/gin",
      "opfamily:$extension:pg_trgm.gin_trgm_ops/gin",
      "operator:$extension:pg_trgm.%>>(pg_catalog.text,pg_catalog.text)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin operator 9",
      },
    ],
    sqlDependency: "$extension:pg_trgm.%>>(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: 'operator of access method:operator 9 (pg_catalog.text, pg_catalog.text) of "$extension:pg_trgm".gist_trgm_ops USING gist',
    disposition: "internal",
    reason:
      "Subordinate gist operator registration 9 resolves to $extension:pg_trgm.%>>(pg_catalog.text,pg_catalog.text) in the captured parent family; consumed by the selected public operator class, not an independent API.",
    parents: [
      "opclass:$extension:pg_trgm.gist_trgm_ops/gist",
      "opfamily:$extension:pg_trgm.gist_trgm_ops/gist",
      "operator:$extension:pg_trgm.%>>(pg_catalog.text,pg_catalog.text)",
    ],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist operator 9",
      },
    ],
    sqlDependency: "$extension:pg_trgm.%>>(pg_catalog.text,pg_catalog.text)",
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Exact captured strategy/procedure registration is subordinate to the parent class; all registered filter/ordering strategies are exercised using its actual native index.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "operator:$extension:pg_trgm.%(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public % operator delegates to $extension:pg_trgm.similarity_op(pg_catalog.text,pg_catalog.text) with captured left/right text orientation; session threshold predicate rejects automatic live subscriptions.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: 'sql.operators["%"]',
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "%",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "%",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "%",
      },
    ],
    surface: 'sql.operators["%"]',
    semantics: {
      authority: "query",
      observability: "session",
      codec: "pg:bool:1:nullable",
      nulls: "NULL if either operand is NULL; total for non-NULL text",
      procedure: "$extension:pg_trgm.similarity_op(pg_catalog.text,pg_catalog.text)",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "operator:$extension:pg_trgm.%>(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public %> operator delegates to $extension:pg_trgm.word_similarity_commutator_op(pg_catalog.text,pg_catalog.text) with captured left/right text orientation; session threshold predicate rejects automatic live subscriptions.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: 'sql.operators["%>"]',
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "%>",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "%>",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "%>",
      },
    ],
    surface: 'sql.operators["%>"]',
    semantics: {
      authority: "query",
      observability: "session",
      codec: "pg:bool:1:nullable",
      nulls: "NULL if either operand is NULL; total for non-NULL text",
      procedure: "$extension:pg_trgm.word_similarity_commutator_op(pg_catalog.text,pg_catalog.text)",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "operator:$extension:pg_trgm.%>>(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public %>> operator delegates to $extension:pg_trgm.strict_word_similarity_commutator_op(pg_catalog.text,pg_catalog.text) with captured left/right text orientation; session threshold predicate rejects automatic live subscriptions.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: 'sql.operators["%>>"]',
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "%>>",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "%>>",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "%>>",
      },
    ],
    surface: 'sql.operators["%>>"]',
    semantics: {
      authority: "query",
      observability: "session",
      codec: "pg:bool:1:nullable",
      nulls: "NULL if either operand is NULL; total for non-NULL text",
      procedure: "$extension:pg_trgm.strict_word_similarity_commutator_op(pg_catalog.text,pg_catalog.text)",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "operator:$extension:pg_trgm.<->(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public <-> operator delegates to $extension:pg_trgm.similarity_dist(pg_catalog.text,pg_catalog.text) with captured left/right text orientation; deterministic finite float4 distance, preserving commutator orientation.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: 'sql.operators["<->"]',
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "<->",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "<->",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "<->",
      },
    ],
    surface: 'sql.operators["<->"]',
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg_trgm:float4:unit-interval:1:nullable",
      nulls: "NULL if either operand is NULL; total for non-NULL text",
      procedure: "$extension:pg_trgm.similarity_dist(pg_catalog.text,pg_catalog.text)",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "operator:$extension:pg_trgm.<->>(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public <->> operator delegates to $extension:pg_trgm.word_similarity_dist_commutator_op(pg_catalog.text,pg_catalog.text) with captured left/right text orientation; deterministic finite float4 distance, preserving commutator orientation.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: 'sql.operators["<->>"]',
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "<->>",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "<->>",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "<->>",
      },
    ],
    surface: 'sql.operators["<->>"]',
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg_trgm:float4:unit-interval:1:nullable",
      nulls: "NULL if either operand is NULL; total for non-NULL text",
      procedure: "$extension:pg_trgm.word_similarity_dist_commutator_op(pg_catalog.text,pg_catalog.text)",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "operator:$extension:pg_trgm.<->>>(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public <->>> operator delegates to $extension:pg_trgm.strict_word_similarity_dist_commutator_op(pg_catalog.text,pg_catalog.text) with captured left/right text orientation; deterministic finite float4 distance, preserving commutator orientation.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: 'sql.operators["<->>>"]',
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "<->>>",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "<->>>",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "<->>>",
      },
    ],
    surface: 'sql.operators["<->>>"]',
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg_trgm:float4:unit-interval:1:nullable",
      nulls: "NULL if either operand is NULL; total for non-NULL text",
      procedure: "$extension:pg_trgm.strict_word_similarity_dist_commutator_op(pg_catalog.text,pg_catalog.text)",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "operator:$extension:pg_trgm.<%(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public <% operator delegates to $extension:pg_trgm.word_similarity_op(pg_catalog.text,pg_catalog.text) with captured left/right text orientation; session threshold predicate rejects automatic live subscriptions.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: 'sql.operators["<%"]',
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "<%",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "<%",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "<%",
      },
    ],
    surface: 'sql.operators["<%"]',
    semantics: {
      authority: "query",
      observability: "session",
      codec: "pg:bool:1:nullable",
      nulls: "NULL if either operand is NULL; total for non-NULL text",
      procedure: "$extension:pg_trgm.word_similarity_op(pg_catalog.text,pg_catalog.text)",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "operator:$extension:pg_trgm.<<->(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public <<-> operator delegates to $extension:pg_trgm.word_similarity_dist_op(pg_catalog.text,pg_catalog.text) with captured left/right text orientation; deterministic finite float4 distance, preserving commutator orientation.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: 'sql.operators["<<->"]',
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "<<->",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "<<->",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "<<->",
      },
    ],
    surface: 'sql.operators["<<->"]',
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg_trgm:float4:unit-interval:1:nullable",
      nulls: "NULL if either operand is NULL; total for non-NULL text",
      procedure: "$extension:pg_trgm.word_similarity_dist_op(pg_catalog.text,pg_catalog.text)",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "operator:$extension:pg_trgm.<<%(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public <<% operator delegates to $extension:pg_trgm.strict_word_similarity_op(pg_catalog.text,pg_catalog.text) with captured left/right text orientation; session threshold predicate rejects automatic live subscriptions.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: 'sql.operators["<<%"]',
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "<<%",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "<<%",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "<<%",
      },
    ],
    surface: 'sql.operators["<<%"]',
    semantics: {
      authority: "query",
      observability: "session",
      codec: "pg:bool:1:nullable",
      nulls: "NULL if either operand is NULL; total for non-NULL text",
      procedure: "$extension:pg_trgm.strict_word_similarity_op(pg_catalog.text,pg_catalog.text)",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "operator:$extension:pg_trgm.<<<->(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public <<<-> operator delegates to $extension:pg_trgm.strict_word_similarity_dist_op(pg_catalog.text,pg_catalog.text) with captured left/right text orientation; deterministic finite float4 distance, preserving commutator orientation.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: 'sql.operators["<<<->"]',
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "<<<->",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "<<<->",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "<<<->",
      },
    ],
    surface: 'sql.operators["<<<->"]',
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg_trgm:float4:unit-interval:1:nullable",
      nulls: "NULL if either operand is NULL; total for non-NULL text",
      procedure: "$extension:pg_trgm.strict_word_similarity_dist_op(pg_catalog.text,pg_catalog.text)",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "opfamily:$extension:pg_trgm.gin_trgm_ops/gin",
    disposition: "internal",
    reason:
      "Captured gin operator-family strategy and support-procedure relationships supporting the public selected native-text operator class; not a separate application expression.",
    parents: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin",
      },
    ],
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "opfamily:$extension:pg_trgm.gist_trgm_ops/gist",
    disposition: "internal",
    reason:
      "Captured gist operator-family strategy and support-procedure relationships supporting the public selected native-text operator class; not a separate application expression.",
    parents: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist",
      },
    ],
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.gin_extract_query_trgm(pg_catalog.text,pg_catalog.internal,pg_catalog.int2,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "GIN query-trigram extraction callback using internal query keys and strategy; not an ordinary text-query callable API.",
    parents: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin_extract_query_trgm",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gin_extract_query_trgm",
      },
    ],
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
      basis:
        "Captured storage/procedure relationship; native index creation, insertion, all registered filtering and GiST ordering strategies, and introspection prove the supported parent capability.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.nativeIndexesAndNamespaces (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.gin_extract_value_trgm(pg_catalog.text,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "GIN stored-text trigram extraction callback using internal output pointers; not an ordinary text-query callable API.",
    parents: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin_extract_value_trgm",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gin_extract_value_trgm",
      },
    ],
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
      basis:
        "Captured storage/procedure relationship; native index creation, insertion, all registered filtering and GiST ordering strategies, and introspection prove the supported parent capability.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.nativeIndexesAndNamespaces (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.gin_trgm_consistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.text,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "GIN boolean consistency callback using internal match/recheck state; not an ordinary text-query callable API.",
    parents: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin_trgm_consistent",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gin_trgm_consistent",
      },
    ],
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
      basis:
        "Captured storage/procedure relationship; native index creation, insertion, all registered filtering and GiST ordering strategies, and introspection prove the supported parent capability.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.nativeIndexesAndNamespaces (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.gin_trgm_triconsistent(pg_catalog.internal,pg_catalog.int2,pg_catalog.text,pg_catalog.int4,pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "GIN ternary consistency callback using internal match/recheck state; not an ordinary text-query callable API.",
    parents: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gin_trgm_triconsistent",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gin_trgm_triconsistent",
      },
    ],
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gin_trgm_ops/gin"],
      basis:
        "Captured storage/procedure relationship; native index creation, insertion, all registered filtering and GiST ordering strategies, and introspection prove the supported parent capability.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.nativeIndexesAndNamespaces (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.gtrgm_compress(pg_catalog.internal)",
    disposition: "internal",
    reason: "GiST text-to-gtrgm signature compression callback; not an ordinary text-query callable API.",
    parents: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gtrgm_compress",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gtrgm_compress",
      },
    ],
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Captured storage/procedure relationship; native index creation, insertion, all registered filtering and GiST ordering strategies, and introspection prove the supported parent capability.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.nativeIndexesAndNamespaces (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.gtrgm_consistent(pg_catalog.internal,pg_catalog.text,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
    disposition: "internal",
    reason: "GiST signature strategy/recheck consistency callback; not an ordinary text-query callable API.",
    parents: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gtrgm_consistent",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gtrgm_consistent",
      },
    ],
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Captured storage/procedure relationship; native index creation, insertion, all registered filtering and GiST ordering strategies, and introspection prove the supported parent capability.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.nativeIndexesAndNamespaces (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.gtrgm_decompress(pg_catalog.internal)",
    disposition: "internal",
    reason: "GiST internal entry decompression callback; not an ordinary text-query callable API.",
    parents: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gtrgm_decompress",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gtrgm_decompress",
      },
    ],
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Captured storage/procedure relationship; native index creation, insertion, all registered filtering and GiST ordering strategies, and introspection prove the supported parent capability.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.nativeIndexesAndNamespaces (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.gtrgm_distance(pg_catalog.internal,pg_catalog.text,pg_catalog.int2,pg_catalog.oid,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "GiST signature lower-bound KNN distance/recheck callback, distinct from public text distances; not an ordinary text-query callable API.",
    parents: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gtrgm_distance",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gtrgm_distance",
      },
    ],
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Captured storage/procedure relationship; native index creation, insertion, all registered filtering and GiST ordering strategies, and introspection prove the supported parent capability.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.nativeIndexesAndNamespaces (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.gtrgm_in(pg_catalog.cstring)",
    disposition: "internal",
    reason:
      "Input routine for the internal GiST gtrgm signature storage type; not an ordinary text-query callable API.",
    parents: ["type:$extension:pg_trgm.gtrgm"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gtrgm_in",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gtrgm_in",
      },
    ],
    proofTransfer: {
      from: ["type:$extension:pg_trgm.gtrgm"],
      basis:
        "Captured storage/procedure relationship; native index creation, insertion, all registered filtering and GiST ordering strategies, and introspection prove the supported parent capability.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.nativeIndexesAndNamespaces (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.gtrgm_options(pg_catalog.internal)",
    disposition: "internal",
    reason:
      "GiST siglen operator-class options callback using internal options state; not an ordinary text-query callable API.",
    parents: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gtrgm_options",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gtrgm_options",
      },
    ],
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Captured storage/procedure relationship; native index creation, insertion, all registered filtering and GiST ordering strategies, and introspection prove the supported parent capability.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.nativeIndexesAndNamespaces (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.gtrgm_out($extension:pg_trgm.gtrgm)",
    disposition: "internal",
    reason:
      "Output routine for the internal GiST gtrgm signature storage type; not an ordinary text-query callable API.",
    parents: ["type:$extension:pg_trgm.gtrgm"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gtrgm_out",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gtrgm_out",
      },
    ],
    proofTransfer: {
      from: ["type:$extension:pg_trgm.gtrgm"],
      basis:
        "Captured storage/procedure relationship; native index creation, insertion, all registered filtering and GiST ordering strategies, and introspection prove the supported parent capability.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.nativeIndexesAndNamespaces (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.gtrgm_penalty(pg_catalog.internal,pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "GiST signature insertion penalty callback using internal tree entries; not an ordinary text-query callable API.",
    parents: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gtrgm_penalty",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gtrgm_penalty",
      },
    ],
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Captured storage/procedure relationship; native index creation, insertion, all registered filtering and GiST ordering strategies, and introspection prove the supported parent capability.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.nativeIndexesAndNamespaces (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.gtrgm_picksplit(pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason: "GiST signature page-split callback using internal tree entries; not an ordinary text-query callable API.",
    parents: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gtrgm_picksplit",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gtrgm_picksplit",
      },
    ],
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Captured storage/procedure relationship; native index creation, insertion, all registered filtering and GiST ordering strategies, and introspection prove the supported parent capability.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.nativeIndexesAndNamespaces (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.gtrgm_same($extension:pg_trgm.gtrgm,$extension:pg_trgm.gtrgm,pg_catalog.internal)",
    disposition: "internal",
    reason:
      "GiST internal gtrgm signature equivalence callback writing an internal boolean pointer; not an ordinary text-query callable API.",
    parents: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gtrgm_same",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gtrgm_same",
      },
    ],
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Captured storage/procedure relationship; native index creation, insertion, all registered filtering and GiST ordering strategies, and introspection prove the supported parent capability.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.nativeIndexesAndNamespaces (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.gtrgm_union(pg_catalog.internal,pg_catalog.internal)",
    disposition: "internal",
    reason: "GiST internal gtrgm signature union callback; not an ordinary text-query callable API.",
    parents: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gtrgm_union",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gtrgm_union",
      },
    ],
    proofTransfer: {
      from: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
      basis:
        "Captured storage/procedure relationship; native index creation, insertion, all registered filtering and GiST ordering strategies, and introspection prove the supported parent capability.",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.nativeIndexesAndNamespaces (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.set_limit(pg_catalog.float4)",
    disposition: "tooling",
    reason:
      "Deprecated public threshold setter executed only on an owned dedicated operator backend; captured float4 parameter remains bound; original settings restored or backend terminated on abort.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/tooling/extensions/pg-trgm.ts",
        case: "withPgTrgmThresholds",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.parametersAndObservability",
        fixture: "no RPC setter",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.thresholdLifetimeSuccessErrorAbort",
        fixture: "NULL/no-change, success, thrown failure, active-query abort",
      },
    ],
    surface: "withPgTrgmThresholds.session.setLimit",
    semantics: {
      authority: "session",
      observability: "session",
      codec: "pg_trgm:float4:unit-interval:1:nullable",
      nulls: "NULL input returns NULL without changing threshold",
      parameter: "finite float4 0..1",
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.thresholdLifetimeSuccessErrorAbort (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.show_limit()",
    disposition: "query",
    reason:
      "Public captured show_limit routine with exact 0-argument contract; reads session thresholds and rejects automatic live subscription.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: "sql.functions.show_limit",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "show_limit",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "show_limit",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "show_limit",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.liveTableInvalidationAndSessionRejection",
        fixture: "show_limit",
      },
    ],
    surface: "sql.functions.show_limit",
    semantics: {
      authority: "query",
      observability: "session",
      codec: "pg_trgm:float4:unit-interval:1",
      nulls: "non-NULL threshold",
      sqlResult: {
        namespace: "pg_catalog",
        name: "float4",
      },
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.liveTableInvalidationAndSessionRejection (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.show_trgm(pg_catalog.text)",
    disposition: "query",
    reason:
      "Public captured show_trgm routine with exact 1-argument contract; deterministic text score, distance or trigram extraction with table-observable inputs.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: "sql.functions.show_trgm",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "show_trgm",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "show_trgm",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "show_trgm",
      },
    ],
    surface: "sql.functions.show_trgm",
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg_trgm:show_trgm:text-array:1:nullable",
      nulls: "NULL for any NULL text argument; total for non-NULL text",
      sqlResult: {
        namespace: "pg_catalog",
        name: "_text",
      },
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.similarity_dist(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public captured similarity_dist routine with exact 2-argument contract; deterministic text score, distance or trigram extraction with table-observable inputs.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: "sql.functions.similarity_dist",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "similarity_dist",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "similarity_dist",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "similarity_dist",
      },
    ],
    surface: "sql.functions.similarity_dist",
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg_trgm:float4:unit-interval:1:nullable",
      nulls: "NULL for any NULL text argument; total for non-NULL text",
      sqlResult: {
        namespace: "pg_catalog",
        name: "float4",
      },
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.similarity_op(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public captured similarity_op routine with exact 2-argument contract; reads session thresholds and rejects automatic live subscription.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: "sql.functions.similarity_op",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "similarity_op",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "similarity_op",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "similarity_op",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.liveTableInvalidationAndSessionRejection",
        fixture: "similarity_op",
      },
    ],
    surface: "sql.functions.similarity_op",
    semantics: {
      authority: "query",
      observability: "session",
      codec: "pg:bool:1:nullable",
      nulls: "NULL for any NULL text argument; total for non-NULL text",
      sqlResult: {
        namespace: "pg_catalog",
        name: "bool",
      },
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.liveTableInvalidationAndSessionRejection (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.similarity(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public captured similarity routine with exact 2-argument contract; deterministic text score, distance or trigram extraction with table-observable inputs.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: "sql.functions.similarity",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "similarity",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "similarity",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "similarity",
      },
    ],
    surface: "sql.functions.similarity",
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg_trgm:float4:unit-interval:1:nullable",
      nulls: "NULL for any NULL text argument; total for non-NULL text",
      sqlResult: {
        namespace: "pg_catalog",
        name: "float4",
      },
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.strict_word_similarity_commutator_op(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public captured strict_word_similarity_commutator_op routine with exact 2-argument contract; reads session thresholds and rejects automatic live subscription.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: "sql.functions.strict_word_similarity_commutator_op",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "strict_word_similarity_commutator_op",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "strict_word_similarity_commutator_op",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "strict_word_similarity_commutator_op",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.liveTableInvalidationAndSessionRejection",
        fixture: "strict_word_similarity_commutator_op",
      },
    ],
    surface: "sql.functions.strict_word_similarity_commutator_op",
    semantics: {
      authority: "query",
      observability: "session",
      codec: "pg:bool:1:nullable",
      nulls: "NULL for any NULL text argument; total for non-NULL text",
      sqlResult: {
        namespace: "pg_catalog",
        name: "bool",
      },
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.liveTableInvalidationAndSessionRejection (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.strict_word_similarity_dist_commutator_op(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public captured strict_word_similarity_dist_commutator_op routine with exact 2-argument contract; deterministic text score, distance or trigram extraction with table-observable inputs.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: "sql.functions.strict_word_similarity_dist_commutator_op",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "strict_word_similarity_dist_commutator_op",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "strict_word_similarity_dist_commutator_op",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "strict_word_similarity_dist_commutator_op",
      },
    ],
    surface: "sql.functions.strict_word_similarity_dist_commutator_op",
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg_trgm:float4:unit-interval:1:nullable",
      nulls: "NULL for any NULL text argument; total for non-NULL text",
      sqlResult: {
        namespace: "pg_catalog",
        name: "float4",
      },
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.strict_word_similarity_dist_op(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public captured strict_word_similarity_dist_op routine with exact 2-argument contract; deterministic text score, distance or trigram extraction with table-observable inputs.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: "sql.functions.strict_word_similarity_dist_op",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "strict_word_similarity_dist_op",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "strict_word_similarity_dist_op",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "strict_word_similarity_dist_op",
      },
    ],
    surface: "sql.functions.strict_word_similarity_dist_op",
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg_trgm:float4:unit-interval:1:nullable",
      nulls: "NULL for any NULL text argument; total for non-NULL text",
      sqlResult: {
        namespace: "pg_catalog",
        name: "float4",
      },
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.strict_word_similarity_op(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public captured strict_word_similarity_op routine with exact 2-argument contract; reads session thresholds and rejects automatic live subscription.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: "sql.functions.strict_word_similarity_op",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "strict_word_similarity_op",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "strict_word_similarity_op",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "strict_word_similarity_op",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.liveTableInvalidationAndSessionRejection",
        fixture: "strict_word_similarity_op",
      },
    ],
    surface: "sql.functions.strict_word_similarity_op",
    semantics: {
      authority: "query",
      observability: "session",
      codec: "pg:bool:1:nullable",
      nulls: "NULL for any NULL text argument; total for non-NULL text",
      sqlResult: {
        namespace: "pg_catalog",
        name: "bool",
      },
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.liveTableInvalidationAndSessionRejection (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.strict_word_similarity(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public captured strict_word_similarity routine with exact 2-argument contract; deterministic text score, distance or trigram extraction with table-observable inputs.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: "sql.functions.strict_word_similarity",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "strict_word_similarity",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "strict_word_similarity",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "strict_word_similarity",
      },
    ],
    surface: "sql.functions.strict_word_similarity",
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg_trgm:float4:unit-interval:1:nullable",
      nulls: "NULL for any NULL text argument; total for non-NULL text",
      sqlResult: {
        namespace: "pg_catalog",
        name: "float4",
      },
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.word_similarity_commutator_op(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public captured word_similarity_commutator_op routine with exact 2-argument contract; reads session thresholds and rejects automatic live subscription.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: "sql.functions.word_similarity_commutator_op",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "word_similarity_commutator_op",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "word_similarity_commutator_op",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "word_similarity_commutator_op",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.liveTableInvalidationAndSessionRejection",
        fixture: "word_similarity_commutator_op",
      },
    ],
    surface: "sql.functions.word_similarity_commutator_op",
    semantics: {
      authority: "query",
      observability: "session",
      codec: "pg:bool:1:nullable",
      nulls: "NULL for any NULL text argument; total for non-NULL text",
      sqlResult: {
        namespace: "pg_catalog",
        name: "bool",
      },
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.liveTableInvalidationAndSessionRejection (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.word_similarity_dist_commutator_op(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public captured word_similarity_dist_commutator_op routine with exact 2-argument contract; deterministic text score, distance or trigram extraction with table-observable inputs.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: "sql.functions.word_similarity_dist_commutator_op",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "word_similarity_dist_commutator_op",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "word_similarity_dist_commutator_op",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "word_similarity_dist_commutator_op",
      },
    ],
    surface: "sql.functions.word_similarity_dist_commutator_op",
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg_trgm:float4:unit-interval:1:nullable",
      nulls: "NULL for any NULL text argument; total for non-NULL text",
      sqlResult: {
        namespace: "pg_catalog",
        name: "float4",
      },
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.word_similarity_dist_op(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public captured word_similarity_dist_op routine with exact 2-argument contract; deterministic text score, distance or trigram extraction with table-observable inputs.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: "sql.functions.word_similarity_dist_op",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "word_similarity_dist_op",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "word_similarity_dist_op",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "word_similarity_dist_op",
      },
    ],
    surface: "sql.functions.word_similarity_dist_op",
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg_trgm:float4:unit-interval:1:nullable",
      nulls: "NULL for any NULL text argument; total for non-NULL text",
      sqlResult: {
        namespace: "pg_catalog",
        name: "float4",
      },
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.word_similarity_op(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public captured word_similarity_op routine with exact 2-argument contract; reads session thresholds and rejects automatic live subscription.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: "sql.functions.word_similarity_op",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "word_similarity_op",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "word_similarity_op",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "word_similarity_op",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.liveTableInvalidationAndSessionRejection",
        fixture: "word_similarity_op",
      },
    ],
    surface: "sql.functions.word_similarity_op",
    semantics: {
      authority: "query",
      observability: "session",
      codec: "pg:bool:1:nullable",
      nulls: "NULL for any NULL text argument; total for non-NULL text",
      sqlResult: {
        namespace: "pg_catalog",
        name: "bool",
      },
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.liveTableInvalidationAndSessionRejection (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "routine:$extension:pg_trgm.word_similarity(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "Public captured word_similarity routine with exact 2-argument contract; deterministic text score, distance or trigram extraction with table-observable inputs.",
    parents: [],
    proofs: [
      {
        kind: "source",
        file: "apps/loom/src/core/extensions/adapters/pg-trgm.ts",
        case: "createPgTrgm_1_6",
        fixture: "sql.functions.word_similarity",
      },
      {
        kind: "unit",
        file: "packages/tests/unit/extensions-pg-trgm.test.ts",
        case: "pg_trgm.completeCanonicalSurface",
        fixture: "word_similarity",
      },
      {
        kind: "type",
        file: "packages/tests/types/extensions-pg-trgm.test-d.ts",
        case: "pg_trgm.canonicalTypes",
        fixture: "word_similarity",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.everyPublicRoutineOperatorAndNull",
        fixture: "word_similarity",
      },
    ],
    surface: "sql.functions.word_similarity",
    semantics: {
      authority: "query",
      observability: "tables",
      codec: "pg_trgm:float4:unit-interval:1:nullable",
      nulls: "NULL for any NULL text argument; total for non-NULL text",
      sqlResult: {
        namespace: "pg_catalog",
        name: "float4",
      },
    },
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.everyPublicRoutineOperatorAndNull (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "type:$extension:pg_trgm._gtrgm",
    disposition: "internal",
    reason:
      "Captured array-of-gtrgm type linked by its explicit element relationship to the internal GiST storage key; not a public stored text-array type.",
    parents: ["type:$extension:pg_trgm.gtrgm"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gist actual storage/input identity",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist insertion and queries",
      },
    ],
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
  {
    id: "type:$extension:pg_trgm.gtrgm",
    disposition: "internal",
    reason:
      "Internal GiST bitmap-signature storage key selected by the captured gist_trgm_ops storage relationship; not a public text field or wire codec.",
    parents: ["opclass:$extension:pg_trgm.gist_trgm_ops/gist"],
    proofs: [
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.nativeIndexesAndNamespaces",
        fixture: "gist actual storage/input identity",
      },
      {
        kind: "database",
        file: "packages/e2e/integration/extensions-pg-trgm.test.ts",
        case: "pg_trgm.indexStrategyExecution",
        fixture: "gist insertion and queries",
      },
    ],
    evidence: [
      "https://www.postgresql.org/docs/18/pgtrgm.html",
      "https://github.com/postgres/postgres/tree/REL_18_STABLE/contrib/pg_trgm",
      "packages/e2e/integration/extensions-pg-trgm.test.ts: pg_trgm.indexStrategyExecution (local and Neon PostgreSQL 18 witnessed; receipt docs/validation/2026-10-02-typed-extensions-pg-trgm.md)",
    ],
  },
] as const;
