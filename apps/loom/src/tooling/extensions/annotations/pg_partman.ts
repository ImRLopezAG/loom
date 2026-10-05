const evidence = [
  "https://github.com/pgpartman/pg_partman/tree/v5.1.0",
  "packages/e2e/fixtures/pg_partman-native-characterization.json",
  "packages/tests/unit/extensions-pg_partman.test.ts",
  "packages/e2e/integration/extensions-pg_partman.test.ts",
] as const;
export const pgPartmanAnnotations = [
  {
    id: 'composite type:"$extension:pg_partman".check_default_table',
    disposition: "schema",
    reason: "Native check_default result composite and storage field.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config_sub.sub_automatic_maintenance',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config_sub.sub_constraint_valid',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config_sub.sub_default_table',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config_sub.sub_epoch',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config_sub.sub_ignore_default_data',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config_sub.sub_infinite_time_partitions',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config_sub.sub_inherit_privileges',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config_sub.sub_jobmon',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config_sub.sub_optimize_constraint',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config_sub.sub_premake',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config_sub.sub_retention_keep_index',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config_sub.sub_retention_keep_publication',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config_sub.sub_retention_keep_table',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config.automatic_maintenance',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config.constraint_valid',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config.default_table',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config.epoch',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config.ignore_default_data',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config.infinite_time_partitions',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config.inherit_privileges',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config.jobmon',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config.optimize_constraint',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config.premake',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config.retention_keep_index',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config.retention_keep_publication',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config.retention_keep_table',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config.sub_partition_set_full',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'default value:for "$extension:pg_partman".part_config.undo_in_progress',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'index:"$extension:pg_partman".part_config_parent_table_pkey',
    disposition: "internal",
    reason:
      "PostgreSQL-owned constraint trigger enforcing the part_config_sub foreign key; not independently SQL-callable.",
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'index:"$extension:pg_partman".part_config_sub_pkey',
    disposition: "internal",
    reason:
      "PostgreSQL-owned constraint trigger enforcing the part_config_sub foreign key; not independently SQL-callable.",
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'index:"$extension:pg_partman".part_config_type_idx',
    disposition: "internal",
    reason:
      "PostgreSQL-owned constraint trigger enforcing the part_config_sub foreign key; not independently SQL-callable.",
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'index:pg_toast."$toast-index:part_config_sub"',
    disposition: "internal",
    reason:
      "PostgreSQL-owned constraint trigger enforcing the part_config_sub foreign key; not independently SQL-callable.",
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'index:pg_toast."$toast-index:part_config"',
    disposition: "internal",
    reason:
      "PostgreSQL-owned constraint trigger enforcing the part_config_sub foreign key; not independently SQL-callable.",
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.apply_cluster(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "tooling",
    reason: "withPgPartman.apply_cluster; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.apply_constraints(pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.int8)",
    disposition: "tooling",
    reason: "withPgPartman.apply_constraints; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.apply_privileges(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int8)",
    disposition: "tooling",
    reason: "withPgPartman.apply_privileges; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.autovacuum_off(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "tooling",
    reason: "withPgPartman.autovacuum_off; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.autovacuum_reset(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "tooling",
    reason: "withPgPartman.autovacuum_reset; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.calculate_time_partition_info(pg_catalog.interval,pg_catalog.timestamptz,pg_catalog.text)",
    disposition: "query",
    reason:
      "createPgPartman_5_1_0.sql.functions.calculate_time_partition_info; exact nullable scalar/OUT codec and named defaults.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.check_automatic_maintenance_value(pg_catalog.text)",
    disposition: "query",
    reason:
      "createPgPartman_5_1_0.sql.functions.check_automatic_maintenance_value; exact nullable scalar/OUT codec and named defaults.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.check_control_type(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "createPgPartman_5_1_0.sql.functions.check_control_type; exact nullable scalar/OUT codec and named defaults.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.check_default(pg_catalog.bool)",
    disposition: "query",
    reason: "createPgPartman_5_1_0.sql.functions.check_default; exact nullable scalar/OUT codec and named defaults.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.check_epoch_type(pg_catalog.text)",
    disposition: "query",
    reason: "createPgPartman_5_1_0.sql.functions.check_epoch_type; exact nullable scalar/OUT codec and named defaults.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.check_name_length(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "createPgPartman_5_1_0.sql.functions.check_name_length; exact nullable scalar/OUT codec and named defaults.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.check_partition_type(pg_catalog.text)",
    disposition: "query",
    reason:
      "createPgPartman_5_1_0.sql.functions.check_partition_type; exact nullable scalar/OUT codec and named defaults.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.check_subpart_sameconfig(pg_catalog.text)",
    disposition: "query",
    reason:
      "createPgPartman_5_1_0.sql.functions.check_subpart_sameconfig; exact nullable scalar/OUT codec and named defaults.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.check_subpartition_limits(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "createPgPartman_5_1_0.sql.functions.check_subpartition_limits; exact nullable scalar/OUT codec and named defaults.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.create_parent(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text,pg_catalog.bool,pg_catalog.text,pg_catalog._text,pg_catalog.text,pg_catalog.bool,pg_catalog.text)",
    disposition: "tooling",
    reason: "withPgPartman.create_parent; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.create_partition_id(pg_catalog.text,pg_catalog._int8,pg_catalog.text)",
    disposition: "tooling",
    reason: "withPgPartman.create_partition_id; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.create_partition_time(pg_catalog.text,pg_catalog._timestamptz,pg_catalog.text)",
    disposition: "tooling",
    reason:
      "withPgPartman.create_partition_time; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.create_sub_parent(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.text,pg_catalog._text,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog.bool,pg_catalog.text)",
    disposition: "tooling",
    reason: "withPgPartman.create_sub_parent; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.drop_constraints(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "tooling",
    reason: "withPgPartman.drop_constraints; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.drop_partition_id(pg_catalog.text,pg_catalog.int8,pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
    disposition: "tooling",
    reason: "withPgPartman.drop_partition_id; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.drop_partition_time(pg_catalog.text,pg_catalog.interval,pg_catalog.bool,pg_catalog.bool,pg_catalog.text,pg_catalog.timestamptz)",
    disposition: "tooling",
    reason: "withPgPartman.drop_partition_time; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.dump_partitioned_table_definition(pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason:
      "createPgPartman_5_1_0.sql.functions.dump_partitioned_table_definition; exact nullable scalar/OUT codec and named defaults.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.inherit_replica_identity(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "tooling",
    reason:
      "withPgPartman.inherit_replica_identity; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.inherit_template_properties(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "tooling",
    reason:
      "withPgPartman.inherit_template_properties; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.partition_data_id(pg_catalog.text,pg_catalog.int4,pg_catalog.int8,pg_catalog.numeric,pg_catalog.text,pg_catalog.bool,pg_catalog.text,pg_catalog._text)",
    disposition: "tooling",
    reason: "withPgPartman.partition_data_id; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.partition_data_proc(pg_catalog.text,pg_catalog.int4,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.text,pg_catalog.text,pg_catalog._text,pg_catalog.bool)",
    disposition: "tooling",
    reason:
      "executePgPartmanProcedure(partition_data_proc); dedicated top-level CALL with native non-atomic batch commits.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "top-level non-atomic CALL; native COMMIT boundaries",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.partition_data_time(pg_catalog.text,pg_catalog.int4,pg_catalog.interval,pg_catalog.numeric,pg_catalog.text,pg_catalog.bool,pg_catalog.text,pg_catalog._text)",
    disposition: "tooling",
    reason: "withPgPartman.partition_data_time; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.partition_gap_fill(pg_catalog.text)",
    disposition: "tooling",
    reason: "withPgPartman.partition_gap_fill; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.reapply_constraints_proc(pg_catalog.text,pg_catalog.bool,pg_catalog.bool,pg_catalog.int4,pg_catalog.bool)",
    disposition: "tooling",
    reason:
      "executePgPartmanProcedure(reapply_constraints_proc); dedicated top-level CALL with native non-atomic batch commits.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "top-level non-atomic CALL; native COMMIT boundaries",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.reapply_privileges(pg_catalog.text)",
    disposition: "tooling",
    reason: "withPgPartman.reapply_privileges; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.run_analyze(pg_catalog.bool,pg_catalog.bool,pg_catalog.text)",
    disposition: "tooling",
    reason: "executePgPartmanProcedure(run_analyze); dedicated top-level CALL with native non-atomic batch commits.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "top-level non-atomic CALL; native COMMIT boundaries",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.run_maintenance_proc(pg_catalog.int4,pg_catalog.bool,pg_catalog.bool)",
    disposition: "tooling",
    reason:
      "executePgPartmanProcedure(run_maintenance_proc); dedicated top-level CALL with native non-atomic batch commits.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "top-level non-atomic CALL; native COMMIT boundaries",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.run_maintenance(pg_catalog.text,pg_catalog.bool,pg_catalog.bool)",
    disposition: "tooling",
    reason: "withPgPartman.run_maintenance; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.show_partition_info(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "createPgPartman_5_1_0.sql.functions.show_partition_info; exact nullable scalar/OUT codec and named defaults.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.show_partition_name(pg_catalog.text,pg_catalog.text)",
    disposition: "query",
    reason:
      "createPgPartman_5_1_0.sql.functions.show_partition_name; exact nullable scalar/OUT codec and named defaults.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.show_partitions(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    disposition: "query",
    reason: "createPgPartman_5_1_0.sql.functions.show_partitions; exact nullable scalar/OUT codec and named defaults.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.stop_sub_partition(pg_catalog.text,pg_catalog.bool)",
    disposition: "tooling",
    reason: "withPgPartman.stop_sub_partition; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.undo_partition_proc(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog._text,pg_catalog.bool,pg_catalog.bool)",
    disposition: "tooling",
    reason:
      "executePgPartmanProcedure(undo_partition_proc); dedicated top-level CALL with native non-atomic batch commits.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "top-level non-atomic CALL; native COMMIT boundaries",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "routine:$extension:pg_partman.undo_partition(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.text,pg_catalog.bool,pg_catalog.numeric,pg_catalog._text,pg_catalog.bool)",
    disposition: "tooling",
    reason: "withPgPartman.undo_partition; typed operator request and decoded native result in owned transaction.",
    semantics: {
      authority: "operator",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'rule:"_RETURN" on "$extension:pg_partman".table_privs',
    disposition: "schema",
    reason: "Native table_privs view rewrite rule; table_privsRows exposes the view with exact decoded columns.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_automatic_maintenance',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_constraint_cols',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_constraint_valid',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_control',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_date_trunc_interval',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_default_table',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_epoch',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_ignore_default_data',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_infinite_time_partitions',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_inherit_privileges',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_jobmon',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_maintenance_order',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_optimize_constraint',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_parent',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_partition_interval',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_partition_type',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_premake',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_retention',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_retention_keep_index',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_retention_keep_publication',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_retention_keep_table',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_retention_schema',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config_sub.sub_template_table',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.automatic_maintenance',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.constraint_cols',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.constraint_valid',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.control',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.date_trunc_interval',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.datetime_string',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.default_table',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.epoch',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.ignore_default_data',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.infinite_time_partitions',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.inherit_privileges',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.jobmon',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.maintenance_last_run',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.maintenance_order',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.optimize_constraint',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.parent_table',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.partition_interval',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.partition_type',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.premake',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.retention',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.retention_keep_index',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.retention_keep_publication',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.retention_keep_table',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.retention_schema',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.sub_partition_set_full',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.template_table',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table column:"$extension:pg_partman".part_config.undo_in_progress',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:control_constraint_col_chk on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:control_constraint_col_chk on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_automatic_maintenance_check on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_automatic_maintenance_not_null on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_constraint_valid_not_null on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_control_not_null on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_epoch_check on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_epoch_not_null on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_ignore_default_data_not_null on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_infinite_time_partitions_not_null on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_jobmon_not_null on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_optimize_constraint_not_null on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_parent_table_not_null on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_parent_table_pkey on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_partition_interval_not_null on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_partition_type_not_null on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_premake_not_null on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_retention_keep_index_not_null on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_retention_keep_publication_not_null on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_retention_keep_table_not_null on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_automatic_maintenance_check on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_epoch_check on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_partition_set_full_not_null on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_pkey on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_sub_automatic_maintenance_not_null on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_sub_constraint_valid_not_null on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_sub_control_not_null on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_sub_epoch_not_null on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_sub_ignore_default_data_not_null on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_sub_infinite_time_partitions_not_null on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_sub_jobmon_not_null on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_sub_optimize_constraint_not_null on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_sub_parent_fkey on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_sub_parent_not_null on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_sub_partition_interval_not_null on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_sub_partition_type_not_null on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_sub_premake_not_null on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_sub_retention_keep_index_not_null on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_sub_retention_keep_publication_not_null on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_sub_retention_keep_table_not_null on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_sub_type_check on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_type_check on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:part_config_undo_in_progress_not_null on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:positive_premake_check on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:positive_premake_check on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:retention_schema_not_empty_chk on "$extension:pg_partman".part_config',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table constraint:retention_schema_not_empty_chk on "$extension:pg_partman".part_config_sub',
    disposition: "schema",
    reason:
      "Native configuration-table constraint/default, preserved by PostgreSQL-owned configuration DDL; no application DDL.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table:"$extension:pg_partman".part_config',
    disposition: "query",
    reason: "part_configRows and withPgPartman configuration observation/update; external observability.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'table:"$extension:pg_partman".part_config_sub',
    disposition: "query",
    reason: "part_config_subRows and withPgPartman configuration observation/update; external observability.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'toast table:pg_toast."$toast:part_config_sub"',
    disposition: "internal",
    reason:
      "PostgreSQL-owned constraint trigger enforcing the part_config_sub foreign key; not independently SQL-callable.",
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'toast table:pg_toast."$toast:part_config"',
    disposition: "internal",
    reason:
      "PostgreSQL-owned constraint trigger enforcing the part_config_sub foreign key; not independently SQL-callable.",
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'trigger:"$fk-trigger:part_config_sub_sub_parent_fkey on ""$extension:pg_partman"".part_config_sub:9:RI_FKey_cascade_del" on "$extension:pg_partman".part_config',
    disposition: "internal",
    reason:
      "PostgreSQL-owned constraint trigger enforcing the part_config_sub foreign key; not independently SQL-callable.",
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'trigger:"$fk-trigger:part_config_sub_sub_parent_fkey on ""$extension:pg_partman"".part_config_sub:17:RI_FKey_cascade_upd" on "$extension:pg_partman".part_config',
    disposition: "internal",
    reason:
      "PostgreSQL-owned constraint trigger enforcing the part_config_sub foreign key; not independently SQL-callable.",
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'trigger:"$fk-trigger:part_config_sub_sub_parent_fkey on ""$extension:pg_partman"".part_config_sub:5:RI_FKey_check_ins" on "$extension:pg_partman".part_config_sub',
    disposition: "internal",
    reason:
      "PostgreSQL-owned constraint trigger enforcing the part_config_sub foreign key; not independently SQL-callable.",
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'trigger:"$fk-trigger:part_config_sub_sub_parent_fkey on ""$extension:pg_partman"".part_config_sub:17:RI_FKey_check_upd" on "$extension:pg_partman".part_config_sub',
    disposition: "internal",
    reason:
      "PostgreSQL-owned constraint trigger enforcing the part_config_sub foreign key; not independently SQL-callable.",
    semantics: {
      authority: "internal",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "type:$extension:pg_partman._check_default_table",
    disposition: "schema",
    reason:
      "Native composite/array codec and check_default_tableArrayField; array bounds and nullable composite attributes preserved.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "type:$extension:pg_partman._part_config",
    disposition: "schema",
    reason:
      "Native composite/array codec and part_configArrayField; array bounds and nullable composite attributes preserved.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "type:$extension:pg_partman._part_config_sub",
    disposition: "schema",
    reason:
      "Native composite/array codec and part_config_subArrayField; array bounds and nullable composite attributes preserved.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "type:$extension:pg_partman._table_privs",
    disposition: "schema",
    reason:
      "Native composite/array codec and table_privsArrayField; array bounds and nullable composite attributes preserved.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "type:$extension:pg_partman.check_default_table",
    disposition: "schema",
    reason:
      "Native composite/array codec and check_default_tableField; array bounds and nullable composite attributes preserved.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "type:$extension:pg_partman.part_config",
    disposition: "schema",
    reason:
      "Native composite/array codec and part_configField; array bounds and nullable composite attributes preserved.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "type:$extension:pg_partman.part_config_sub",
    disposition: "schema",
    reason:
      "Native composite/array codec and part_config_subField; array bounds and nullable composite attributes preserved.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: "type:$extension:pg_partman.table_privs",
    disposition: "schema",
    reason:
      "Native composite/array codec and table_privsField; array bounds and nullable composite attributes preserved.",
    semantics: {
      authority: "schema",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'view column:"$extension:pg_partman".table_privs.grantee',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'view column:"$extension:pg_partman".table_privs.grantor',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'view column:"$extension:pg_partman".table_privs.privilege_type',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'view column:"$extension:pg_partman".table_privs.table_name',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'view column:"$extension:pg_partman".table_privs.table_schema',
    disposition: "query",
    reason:
      "Captured catalog column is decoded by the corresponding exact relation codec and Rows surface; configuration table columns are operator-editable.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
  {
    id: 'view:"$extension:pg_partman".table_privs',
    disposition: "query",
    reason: "table_privsRows and withPgPartman configuration observation/update; external observability.",
    semantics: {
      authority: "query",
      observability: "external",
      nativeAcceptance: "pending",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      transaction: "ordinary caller/owned operator transaction",
      privilege: "PUBLIC EXECUTE for captured routines; underlying relation ownership/DDL privileges remain native",
      limitation:
        "Native upstream limitations retained; apply_cluster excludes native partition parents; autovacuum helpers require ordinary configured tables. No scheduler is installed or enabled by these APIs.",
    },
    evidence,
  },
] as const;
