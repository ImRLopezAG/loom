const evidence = [
  "https://www.postgresql.org/docs/18/pgstatstatements.html",
  "https://neon.com/docs/extensions/pg_stat_statements",
  "packages/tests/unit/extensions-pg_stat_statements.test.ts",
  "packages/tests/types/extensions-pg_stat_statements.test-d.ts",
  "packages/e2e/integration/extensions-pg_stat_statements.test.ts",
] as const;
const acceptance = {
  providerAcceptance: "pending",
  nativeAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;
const observation = {
  ...acceptance,
  authority: "query",
  observability: "external",
  live: "Shared server/backend state is not table-revision backed; automatic subscriptions reject it.",
  prerequisite:
    "Server startup must load pg_stat_statements and query identifiers must be enabled. Installing the extension does not initialize shared state.",
} as const;
const redaction =
  "Other users queryid is NULL and requested query text is <insufficient privilege>; showtext=false returns NULL query text for all rows, and discarded query text can also be NULL. Other native counters are non-null.";
const privilege =
  "PUBLIC EXECUTE; only superusers and pg_read_all_stats can see other users query text/queryid. Other statistics remain visible.";
/** Complete captured PostgreSQL 18 / 1.12 member dispositions; target acceptance remains pending. */
export const pgStatStatementsAnnotations = [
  {
    id: "routine:$extension:pg_stat_statements.pg_stat_statements_info()",
    disposition: "query",
    evidence,
    reason: "info / infoRows / sql.functions.pg_stat_statements_info: dealloc bigint and exact stats_reset timestamp.",
    semantics: {
      ...observation,
      privilege: "PUBLIC EXECUTE; global deallocation count and last full reset time.",
      nulls: "Native OUT values are non-null.",
    },
  },
  {
    id: "routine:$extension:pg_stat_statements.pg_stat_statements_reset(pg_catalog.oid,pg_catalog.oid,pg_catalog.int8,pg_catalog.bool)",
    disposition: "tooling",
    evidence,
    reason:
      "withPgStatStatements.reset: exact oid/oid/int8/bool selectors and defaults, microsecond-preserving timestamp acknowledgement; structured effects distinguish shared reset from SQL transaction rollback.",
    semantics: {
      ...acceptance,
      authority: "operator",
      observability: "external",
      codec: "pg:timestamptz:1",
      privilege: "EXECUTE revoked from PUBLIC; superuser or an explicitly granted execution privilege is required.",
      rollback:
        "Shared across server databases; reset is not transactional. Lost/failed replies remain unknown and are never retried.",
      defaults:
        "0/0/0/false: zero selectors are wildcards; minmaxOnly resets only min/max counters for matching entries.",
    },
  },
  {
    id: "routine:$extension:pg_stat_statements.pg_stat_statements(pg_catalog.bool)",
    disposition: "query",
    evidence,
    reason:
      "statements / statementRows / sql.functions.pg_stat_statements: bool showtext and all 52 captured OUT columns.",
    semantics: { ...observation, privilege, nulls: redaction },
  },
  {
    id: 'rule:"_RETURN" on "$extension:pg_stat_statements".pg_stat_statements',
    disposition: "internal",
    evidence,
    reason:
      "PostgreSQL-owned _RETURN rewrite rule implements the verified statistics view; emitted through native view definition, never an application callback.",
    semantics: { ...acceptance, authority: "internal" },
  },
  {
    id: 'rule:"_RETURN" on "$extension:pg_stat_statements".pg_stat_statements_info',
    disposition: "internal",
    evidence,
    reason:
      "PostgreSQL-owned _RETURN rewrite rule implements the verified statistics view; emitted through native view definition, never an application callback.",
    semantics: { ...acceptance, authority: "internal" },
  },
  {
    id: "type:$extension:pg_stat_statements._pg_stat_statements",
    disposition: "query",
    evidence,
    reason:
      "Array codec for named view row type; preserves rank, bounds and nullable elements; no stored statistics schema field.",
    semantics: { ...observation, codec: "arrayCodec" },
  },
  {
    id: "type:$extension:pg_stat_statements._pg_stat_statements_info",
    disposition: "query",
    evidence,
    reason:
      "Array codec for named view row type; preserves rank, bounds and nullable elements; no stored statistics schema field.",
    semantics: { ...observation, codec: "infoArrayCodec" },
  },
  {
    id: "type:$extension:pg_stat_statements.pg_stat_statements",
    disposition: "query",
    evidence,
    reason:
      "Qualified named composite result codec; all captured attributes decoded in exact order; no stored statistics schema field.",
    semantics: { ...observation, codec: "codec" },
  },
  {
    id: "type:$extension:pg_stat_statements.pg_stat_statements_info",
    disposition: "query",
    evidence,
    reason:
      "Qualified named composite result codec; all captured attributes decoded in exact order; no stored statistics schema field.",
    semantics: { ...observation, codec: "infoCodec" },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements_info.dealloc',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements_info.dealloc: decoded through statementInfoFields.dealloc; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements_info.stats_reset',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements_info.stats_reset: decoded through statementInfoFields.stats_reset; exact captured timestamptz column and row order.",
    semantics: {
      ...observation,
      codec: "pg:timestamptz:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.calls',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.calls: decoded through statementFields.calls; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.dbid',
    disposition: "query",
    evidence,
    reason: "pg_stat_statements.dbid: decoded through statementFields.dbid; exact captured oid column and row order.",
    semantics: {
      ...observation,
      codec: "pg:oid:unsigned32:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_deform_count',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.jit_deform_count: decoded through statementFields.jit_deform_count; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_deform_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.jit_deform_time: decoded through statementFields.jit_deform_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_emission_count',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.jit_emission_count: decoded through statementFields.jit_emission_count; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_emission_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.jit_emission_time: decoded through statementFields.jit_emission_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_functions',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.jit_functions: decoded through statementFields.jit_functions; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_generation_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.jit_generation_time: decoded through statementFields.jit_generation_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_inlining_count',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.jit_inlining_count: decoded through statementFields.jit_inlining_count; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_inlining_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.jit_inlining_time: decoded through statementFields.jit_inlining_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_optimization_count',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.jit_optimization_count: decoded through statementFields.jit_optimization_count; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_optimization_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.jit_optimization_time: decoded through statementFields.jit_optimization_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.local_blk_read_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.local_blk_read_time: decoded through statementFields.local_blk_read_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.local_blk_write_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.local_blk_write_time: decoded through statementFields.local_blk_write_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.local_blks_dirtied',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.local_blks_dirtied: decoded through statementFields.local_blks_dirtied; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.local_blks_hit',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.local_blks_hit: decoded through statementFields.local_blks_hit; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.local_blks_read',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.local_blks_read: decoded through statementFields.local_blks_read; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.local_blks_written',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.local_blks_written: decoded through statementFields.local_blks_written; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.max_exec_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.max_exec_time: decoded through statementFields.max_exec_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.max_plan_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.max_plan_time: decoded through statementFields.max_plan_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.mean_exec_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.mean_exec_time: decoded through statementFields.mean_exec_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.mean_plan_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.mean_plan_time: decoded through statementFields.mean_plan_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.min_exec_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.min_exec_time: decoded through statementFields.min_exec_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.min_plan_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.min_plan_time: decoded through statementFields.min_plan_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.minmax_stats_since',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.minmax_stats_since: decoded through statementFields.minmax_stats_since; exact captured timestamptz column and row order.",
    semantics: {
      ...observation,
      codec: "pg:timestamptz:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.parallel_workers_launched',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.parallel_workers_launched: decoded through statementFields.parallel_workers_launched; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.parallel_workers_to_launch',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.parallel_workers_to_launch: decoded through statementFields.parallel_workers_to_launch; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.plans',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.plans: decoded through statementFields.plans; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.query',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.query: decoded through statementFields.query; exact captured text column and row order.",
    semantics: {
      ...observation,
      codec: "pg:text:1:nullable",
      nulls: "Role/showtext/native-text redaction is supported.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.queryid',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.queryid: decoded through statementFields.queryid; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1:nullable",
      nulls: "Role/showtext/native-text redaction is supported.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.rows',
    disposition: "query",
    evidence,
    reason: "pg_stat_statements.rows: decoded through statementFields.rows; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.shared_blk_read_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.shared_blk_read_time: decoded through statementFields.shared_blk_read_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.shared_blk_write_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.shared_blk_write_time: decoded through statementFields.shared_blk_write_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.shared_blks_dirtied',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.shared_blks_dirtied: decoded through statementFields.shared_blks_dirtied; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.shared_blks_hit',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.shared_blks_hit: decoded through statementFields.shared_blks_hit; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.shared_blks_read',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.shared_blks_read: decoded through statementFields.shared_blks_read; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.shared_blks_written',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.shared_blks_written: decoded through statementFields.shared_blks_written; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.stats_since',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.stats_since: decoded through statementFields.stats_since; exact captured timestamptz column and row order.",
    semantics: {
      ...observation,
      codec: "pg:timestamptz:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.stddev_exec_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.stddev_exec_time: decoded through statementFields.stddev_exec_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.stddev_plan_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.stddev_plan_time: decoded through statementFields.stddev_plan_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.temp_blk_read_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.temp_blk_read_time: decoded through statementFields.temp_blk_read_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.temp_blk_write_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.temp_blk_write_time: decoded through statementFields.temp_blk_write_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.temp_blks_read',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.temp_blks_read: decoded through statementFields.temp_blks_read; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.temp_blks_written',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.temp_blks_written: decoded through statementFields.temp_blks_written; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.toplevel',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.toplevel: decoded through statementFields.toplevel; exact captured bool column and row order.",
    semantics: {
      ...observation,
      codec: "pg:bool:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.total_exec_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.total_exec_time: decoded through statementFields.total_exec_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.total_plan_time',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.total_plan_time: decoded through statementFields.total_plan_time; exact captured float8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:float8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.userid',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.userid: decoded through statementFields.userid; exact captured oid column and row order.",
    semantics: {
      ...observation,
      codec: "pg:oid:unsigned32:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.wal_buffers_full',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.wal_buffers_full: decoded through statementFields.wal_buffers_full; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.wal_bytes',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.wal_bytes: decoded through statementFields.wal_bytes; exact captured numeric column and row order.",
    semantics: {
      ...observation,
      codec: "pg:numeric:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.wal_fpi',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.wal_fpi: decoded through statementFields.wal_fpi; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view column:"$extension:pg_stat_statements".pg_stat_statements.wal_records',
    disposition: "query",
    evidence,
    reason:
      "pg_stat_statements.wal_records: decoded through statementFields.wal_records; exact captured int8 column and row order.",
    semantics: {
      ...observation,
      codec: "pg:int8:1",
      nulls:
        "Native counter/timestamp is non-null; captured catalogue view nullability remains part of release verification.",
    },
  },
  {
    id: 'view:"$extension:pg_stat_statements".pg_stat_statements',
    disposition: "query",
    evidence,
    reason:
      "Typed statementView helpers preserve the captured function-backed view projection; explicit tooling also reads the actual qualified view.",
    semantics: {
      ...observation,
      privilege: "Native view delegates to routine privileges/redaction; no SECURITY DEFINER escalation.",
    },
  },
  {
    id: 'view:"$extension:pg_stat_statements".pg_stat_statements_info',
    disposition: "query",
    evidence,
    reason:
      "Typed infoView helpers preserve the captured function-backed view projection; explicit tooling also reads the actual qualified view.",
    semantics: {
      ...observation,
      privilege: "Native view delegates to routine privileges/redaction; no SECURITY DEFINER escalation.",
    },
  },
] as const;
