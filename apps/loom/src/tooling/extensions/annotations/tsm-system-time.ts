const handlerId = "routine:$extension:tsm_system_time.system_time(pg_catalog.internal)";
const evidence = [
  "https://www.postgresql.org/docs/18/tsm-system-time.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/tsm_system_time/tsm_system_time.c",
  "apps/loom/src/tooling/extensions/manifests/tsm_system_time.json: internal -> tsm_handler, C, strict, volatile",
  "packages/e2e/integration/extensions-tsm-system-time.test.ts: qualified TABLESAMPLE on a relocated quoted schema",
] as const;

/** Reviewed disposition and exact pin; native, generation and provider acceptance remain separate host gates. */
export const tsmSystemTimeAnnotationContract = {
  extension: "tsm_system_time",
  postgresMajor: 18,
  version: "1.0",
  provider: "neon",
  digest: "70720316f9c0607be92e7948af63f27a96da580a8f492ce7a3a7d972b779af1f",
  providerAcceptance: "pending",
} as const;

export const tsmSystemTimeAnnotations = [
  {
    id: handlerId,
    disposition: "schema",
    reason:
      "The tsm_handler routine is the TABLESAMPLE method itself: PostgreSQL resolves it only from a FROM clause, and its internal-pointer argument makes direct calls fail, so it is exposed as a sampled relation source, never a scalar helper.",
    evidence,
    semantics: {
      authority: "query",
      surface: "relation TABLESAMPLE <installation schema>.system_time(<argument>)",
      argument: "float8 milliseconds; NULL, negative and NaN are rejected before SQL, matching native errors",
      repeatable: "unsupported: native rejects REPEATABLE, so no seed option exists",
      relations: "tables, partitioned tables and materialized views; views are rejected natively",
      observability: "external",
      live: "Sampled rows vary per scan; table revisions cannot observe them, so live subscriptions reject this source",
    },
  },
] as const;
