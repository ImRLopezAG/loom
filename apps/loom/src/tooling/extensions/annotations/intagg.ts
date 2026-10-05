const aggregateId = "routine:$extension:intagg.int_array_aggregate(pg_catalog.int4)";
const enumId = "routine:$extension:intagg.int_array_enum(pg_catalog._int4)";
const stateId = "routine:$extension:intagg.int_agg_state(pg_catalog.internal,pg_catalog.int4)";
const finalId = "routine:$extension:intagg.int_agg_final_array(pg_catalog.internal)";
const sources = [
  "https://www.postgresql.org/docs/18/intagg.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/intagg/intagg.c",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/intagg/intagg--1.1.sql",
  "apps/loom/src/tooling/extensions/manifests/intagg.json: captured transition/final linkage on int_array_aggregate",
] as const;
const unit =
  "packages/tests/unit/extensions-intagg.test.ts: exact contract, qualified SQL, aggregate clauses, TVF, native array codec, coverage";
const types =
  "packages/tests/types/extensions-intagg.test-d.ts: nullable int4/_int4 results, rejected internals, exact factory version";
const database =
  "packages/e2e/integration/extensions-intagg.test.ts: native empty/filter/window/TVF/NULL/rollback oracle; source-bound member gates remain required";
const evidence = [...sources, unit, types, database] as const;
const query = {
  authority: "query",
  observability: "tables",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
  nativeAcceptance: "pending",
} as const;

/** Reviewed dispositions; final per-member acceptance requires source-bound gate receipts. */
export const intaggAnnotationContract = {
  extension: "intagg",
  postgresMajor: 18,
  version: "1.1",
  provider: "neon",
  digest: "7e9c80504c50e5a1910b61667a1774d8c1976c676c087c23fd744168986311f1",
  providerAcceptance: "pending",
} as const;

export const intaggAnnotations = [
  {
    id: aggregateId,
    disposition: "query",
    reason:
      "intArrayAggregate / sql.functions.int_array_aggregate binds the captured aggregate; DISTINCT, FILTER, and OVER are SQL clauses on that same member. Empty or all-NULL input returns SQL NULL, not an empty array.",
    evidence,
    semantics: {
      ...query,
      result: "PostgreSqlArray<number> | null",
      codec: "pg:array:1,:,pg:int4:1:nullable",
      nulls: "Transition is not STRICT and skips NULL integers; empty/all-NULL groups finalize to SQL NULL",
    },
  },
  {
    id: enumId,
    disposition: "query",
    reason:
      "intArrayEnum / sql.functions.int_array_enum binds the captured set-returning function. It expands a native _int4 value; it is not a substitute for unnest on other element types.",
    evidence,
    semantics: {
      ...query,
      result: "number | null",
      codec: "pg:int4:1:nullable",
      nulls: "STRICT: SQL NULL array yields zero rows; NULL elements emit NULL int4 rows",
    },
  },
  {
    id: stateId,
    disposition: "internal",
    reason:
      "Captured aggregate.transition for int_array_aggregate; argument and result types are pg_catalog.internal, which SQL cannot construct. PUBLIC EXECUTE does not make the pointer ABI an application helper.",
    evidence,
    parents: [aggregateId],
    proofTransfer: {
      from: [aggregateId],
      relation: { kind: "aggregate-routine", slot: "transition" },
      basis: "Exact captured pg_aggregate transition slot exercised by the aggregate's native oracle",
    },
    semantics: {
      ...query,
      parent: aggregateId,
      slot: "transition",
      result: "internal aggregate state; not a portable request value",
    },
  },
  {
    id: finalId,
    disposition: "internal",
    reason:
      "Captured aggregate.final for int_array_aggregate; the sole argument is pg_catalog.internal. Application results come from the aggregate member, whose _int4 codec is the portable contract.",
    evidence,
    parents: [aggregateId],
    proofTransfer: {
      from: [aggregateId],
      relation: { kind: "aggregate-routine", slot: "final" },
      basis: "Exact captured pg_aggregate final slot exercised by the aggregate's native oracle",
    },
    semantics: {
      ...query,
      parent: aggregateId,
      slot: "final",
      result: "internal-to-_int4 finalizer; not SQL-callable",
    },
  },
] as const;
