const evidence = [
  "https://github.com/ossc-db/pg_hint_plan/blob/REL18_1_8_0/pg_hint_plan.control",
  "https://github.com/ossc-db/pg_hint_plan/blob/REL18_1_8_0/pg_hint_plan--1.3.0.sql",
  "https://github.com/ossc-db/pg_hint_plan/blob/REL18_1_8_0/pg_hint_plan--1.7.1--1.8.0.sql",
  "https://github.com/ossc-db/pg_hint_plan/blob/REL18_1_8_0/docs/hint_table.md",
  "https://neon.com/docs/extensions/pg-extensions",
  "packages/e2e/scripts/run-pg_hint_plan-native-characterization.ts",
  "packages/tests/unit/extensions-pg_hint_plan.test.ts",
  "packages/tests/types/extensions-pg_hint_plan.test-d.ts",
  "packages/e2e/integration/extensions-pg_hint_plan.test.ts",
] as const;
const acceptance = {
  providerAcceptance: "pending",
  nativeAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;
const table = {
  ...acceptance,
  authority: "query",
  observability: "external",
  live: "Server-wide planner configuration is not an application table revision; automatic live queries reject it.",
  privilege:
    "PUBLIC SELECT and schema USAGE; INSERT/UPDATE/DELETE require explicit table privileges (42501 otherwise).",
  prerequisite:
    "Hints apply only when the module is loaded (startup or session preload) and pg_hint_plan.enable_hint_table is on; matching requires compute_query_id.",
} as const;
const internal = { ...acceptance, authority: "internal", observability: "external" } as const;
const column = (name: string, codec: string, note: string) =>
  ({
    id: `table column:"$extension:pg_hint_plan".hints.${name}`,
    disposition: "query",
    evidence,
    reason: `hintRows().columns.${name} / rowCodec.${name}; withPgHintPlan.hints/upsertHint/deleteHint decode it through pgHintPlanHintFields.${name}. ${note}`,
    semantics: { ...table, codec, nulls: "Captured NOT NULL; native writes of NULL raise 23502." },
  }) as const;
const constraint = (name: string, reason: string) =>
  ({
    id: `table constraint:${name} on "$extension:pg_hint_plan".hints`,
    disposition: "internal",
    evidence,
    reason,
    semantics: internal,
  }) as const;
const sequenceColumn = (name: string) =>
  ({
    id: `sequence column:"$extension:pg_hint_plan".hints_id_seq.${name}`,
    disposition: "internal",
    evidence,
    reason: "Identity sequence state for hints.id; observed only through the native id assigned by upsertHint.",
    semantics: { ...internal, rollback: "Sequence consumption is not rolled back with the operation transaction." },
  }) as const;

/** Complete captured PostgreSQL 18 / pg_hint_plan 1.8.0 member dispositions; target acceptance remains pending. */
export const pgHintPlanAnnotations = [
  {
    id: 'index:"$extension:pg_hint_plan".hints_id_and_app',
    disposition: "internal",
    evidence,
    reason:
      "UNIQUE (query_id, application_name) index pg_hint_plan probes while planning; upsertHint uses it as the native ON CONFLICT target and duplicates raise 23505.",
    semantics: internal,
  },
  {
    id: 'index:"$extension:pg_hint_plan".hints_pkey',
    disposition: "internal",
    evidence,
    reason:
      "Primary-key index enforcing hints.id uniqueness; maintained natively, never an application index declaration.",
    semantics: internal,
  },
  {
    id: 'index:pg_toast."$toast-index:hints"',
    disposition: "internal",
    evidence,
    reason: "PostgreSQL-owned TOAST index for long hint text; storage detail with no application surface.",
    semantics: internal,
  },
  sequenceColumn("is_called"),
  sequenceColumn("last_value"),
  sequenceColumn("log_cnt"),
  {
    id: 'sequence:"$extension:pg_hint_plan".hints_id_seq',
    disposition: "internal",
    evidence,
    reason: "Identity sequence assigning hints.id; upsertHint returns the native assigned id.",
    semantics: { ...internal, rollback: "nextval is not rolled back with the operation transaction." },
  },
  column(
    "application_name",
    "pg:text:1",
    "'' matches every application; an exact application_name row takes precedence.",
  ),
  column(
    "hints",
    "pg:text:1",
    "Native hint text parsed by pg_hint_plan at planning time; parse errors are messages, not SQL errors.",
  ),
  column("id", "pg:int4:1", "Identity value assigned natively."),
  column(
    "query_id",
    "pg:int8:1",
    "Native int64 query identifier; withPgHintPlan.queryId reads it from EXPLAIN VERBOSE without JS rounding.",
  ),
  constraint(
    "hints_application_name_not_null",
    "Native NOT NULL constraint on application_name (23502); reflected by non-null rowCodec fields.",
  ),
  constraint(
    "hints_hints_not_null",
    "Native NOT NULL constraint on hints (23502); reflected by non-null rowCodec fields.",
  ),
  constraint("hints_id_not_null", "Native NOT NULL constraint on id (23502); reflected by non-null rowCodec fields."),
  constraint("hints_pkey", "Native PRIMARY KEY (id) constraint backed by hints_pkey."),
  constraint(
    "hints_query_id_not_null",
    "Native NOT NULL constraint on query_id (23502); reflected by non-null rowCodec fields.",
  ),
  {
    id: 'table:"$extension:pg_hint_plan".hints',
    disposition: "query",
    evidence,
    reason:
      "hintTable / hintRows read the fixed hint_plan.hints relation; withPgHintPlan.upsertHint/deleteHint are the only writers, and explain/queryId observe the planner effect natively.",
    semantics: table,
  },
  {
    id: 'toast table:pg_toast."$toast:hints"',
    disposition: "internal",
    evidence,
    reason: "PostgreSQL-owned TOAST relation for hint text; storage detail with no application surface.",
    semantics: internal,
  },
  {
    id: "type:$extension:pg_hint_plan._hints",
    disposition: "query",
    evidence,
    reason: "arrayCodec for hint_plan.hints[]; preserves rank, bounds, NULL elements and nullable attributes.",
    semantics: { ...table, codec: "arrayCodec" },
  },
  {
    id: "type:$extension:pg_hint_plan.hints",
    disposition: "query",
    evidence,
    reason:
      "Qualified composite codec in captured attribute order; SQL-built composites do not enforce table NOT NULL, so attributes decode nullable while rowCodec stays strict for table rows.",
    semantics: { ...table, codec: "codec" },
  },
] as const;
