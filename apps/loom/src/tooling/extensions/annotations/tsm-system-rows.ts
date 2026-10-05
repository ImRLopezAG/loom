const handlerId = "routine:$extension:tsm_system_rows.system_rows(pg_catalog.internal)";
const evidence = [
  "https://www.postgresql.org/docs/18/tsm-system-rows.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/tsm_system_rows/tsm_system_rows.c",
  "apps/loom/src/tooling/extensions/manifests/tsm_system_rows.json: internal -> tsm_handler, C, strict, volatile",
  "packages/e2e/integration/extensions-tsm-system-rows.test.ts: qualified TABLESAMPLE on a relocated quoted schema",
] as const;

/** Reviewed disposition and exact pin; native, generation and provider acceptance remain separate host gates. */
export const tsmSystemRowsAnnotationContract = {
  extension: "tsm_system_rows",
  postgresMajor: 18,
  version: "1.0",
  provider: "neon",
  digest: "cb606ea0ec43b299ed4776aaeb12126165f751dbf9c5d40a974df6a8a7067eec",
  providerAcceptance: "pending",
} as const;

export const tsmSystemRowsAnnotations = [
  {
    id: handlerId,
    disposition: "schema",
    reason:
      "The tsm_handler routine is the TABLESAMPLE method itself: PostgreSQL resolves it only from a FROM clause, and its internal-pointer argument makes direct calls fail, so it is exposed as a sampled relation source, never a scalar helper.",
    evidence,
    semantics: {
      authority: "query",
      surface: "relation TABLESAMPLE <installation schema>.system_rows(<argument>)",
      argument: "int8 row count; NULL, negative and NaN are rejected before SQL, matching native errors",
      repeatable: "unsupported: native rejects REPEATABLE, so no seed option exists",
      relations: "tables, partitioned tables and materialized views; views are rejected natively",
      observability: "external",
      live: "Sampled rows vary per scan; table revisions cannot observe them, so live subscriptions reject this source",
    },
  },
] as const;
