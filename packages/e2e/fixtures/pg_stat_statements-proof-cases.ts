import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { pgStatStatementsAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/pg_stat_statements";
export const pgStatStatementsProofFamily = {
  extension: "pg_stat_statements",
  version: "1.12",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "daba654d231ac86526c1f6feceed3e644d347c25d443b8bb6d2a02f98bdc5eb8",
} as const satisfies ExtensionProofFamily;
export const pgStatStatementsDatabaseProofCase: ExtensionProofCase = {
  id: "pg_stat_statements.native",
  gate: "database",
  families: [pgStatStatementsProofFamily],
  file: "packages/e2e/integration/extensions-pg_stat_statements.test.ts",
  title:
    "pg_stat_statements exact rows/views, role redaction and selective resets require actual shared-state prerequisites",
  claims: [
    {
      family: pgStatStatementsProofFamily,
      member: "routine:$extension:pg_stat_statements.pg_stat_statements_info()",
      scenario: "native-info-values-and-types",
    },
    {
      family: pgStatStatementsProofFamily,
      member:
        "routine:$extension:pg_stat_statements.pg_stat_statements_reset(pg_catalog.oid,pg_catalog.oid,pg_catalog.int8,pg_catalog.bool)",
      scenario: "selective-shared-reset-and-restricted-role",
    },
    {
      family: pgStatStatementsProofFamily,
      member: "routine:$extension:pg_stat_statements.pg_stat_statements(pg_catalog.bool)",
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'rule:"_RETURN" on "$extension:pg_stat_statements".pg_stat_statements',
      scenario: "native-view-rewrite-identity",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'rule:"_RETURN" on "$extension:pg_stat_statements".pg_stat_statements_info',
      scenario: "native-view-rewrite-identity",
    },
    {
      family: pgStatStatementsProofFamily,
      member: "type:$extension:pg_stat_statements._pg_stat_statements",
      scenario: "native-composite-array-null-and-bounds",
    },
    {
      family: pgStatStatementsProofFamily,
      member: "type:$extension:pg_stat_statements._pg_stat_statements_info",
      scenario: "native-composite-array-null-and-bounds",
    },
    {
      family: pgStatStatementsProofFamily,
      member: "type:$extension:pg_stat_statements.pg_stat_statements",
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: "type:$extension:pg_stat_statements.pg_stat_statements_info",
      scenario: "native-info-values-and-types",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements_info.dealloc',
      scenario: "native-info-values-and-types",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements_info.stats_reset',
      scenario: "native-info-values-and-types",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.calls',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.dbid',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_deform_count',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_deform_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_emission_count',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_emission_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_functions',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_generation_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_inlining_count',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_inlining_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_optimization_count',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.jit_optimization_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.local_blk_read_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.local_blk_write_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.local_blks_dirtied',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.local_blks_hit',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.local_blks_read',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.local_blks_written',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.max_exec_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.max_plan_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.mean_exec_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.mean_plan_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.min_exec_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.min_plan_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.minmax_stats_since',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.parallel_workers_launched',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.parallel_workers_to_launch',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.plans',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.query',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.queryid',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.rows',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.shared_blk_read_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.shared_blk_write_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.shared_blks_dirtied',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.shared_blks_hit',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.shared_blks_read',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.shared_blks_written',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.stats_since',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.stddev_exec_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.stddev_plan_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.temp_blk_read_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.temp_blk_write_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.temp_blks_read',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.temp_blks_written',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.toplevel',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.total_exec_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.total_plan_time',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.userid',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.wal_buffers_full',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.wal_bytes',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.wal_fpi',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view column:"$extension:pg_stat_statements".pg_stat_statements.wal_records',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view:"$extension:pg_stat_statements".pg_stat_statements',
      scenario: "native-statement-values-types-and-role-redaction",
    },
    {
      family: pgStatStatementsProofFamily,
      member: 'view:"$extension:pg_stat_statements".pg_stat_statements_info',
      scenario: "native-info-values-and-types",
    },
  ],
};
export const pgStatStatementsDatabaseProofCases: ExtensionProofCase[] = [pgStatStatementsDatabaseProofCase];
export const pgStatStatementsDatabaseFixtureCount = 1;
export const pgStatStatementsDatabaseRoleCount = 1;
export const pgStatStatementsUnitProofCases: ExtensionProofCase[] = [
  "statement statistics cover every captured OUT column, with privileged text/queryid nullable",
  "observations are available without an application reset capability",
  "all 65 captured members have concrete dispositions and reset selectors stay exact",
].map((title, index) => ({
  id: `pg_stat_statements.unit-${index + 1}`,
  gate: "unit",
  families: [pgStatStatementsProofFamily],
  claims: [],
  file: "packages/tests/unit/extensions-pg_stat_statements.test.ts",
  title,
}));
export const pgStatStatementsTypesProofCase: ExtensionProofCase = {
  id: "pg_stat_statements.types",
  gate: "types",
  families: [pgStatStatementsProofFamily],
  claims: [],
  file: "packages/tests/types/extensions-pg_stat_statements.test-d.ts",
  title: "pg_stat_statements exact application and trusted operator type boundaries",
};
export const pgStatStatementsMemberProofs: Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"] =
  pgStatStatementsAnnotations.map((annotation) => ({
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases: pgStatStatementsDatabaseProofCases.flatMap((definition) =>
      definition.claims
        .filter((claim) => claim.member === annotation.id)
        .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
    ),
    transfers: [],
  }));
