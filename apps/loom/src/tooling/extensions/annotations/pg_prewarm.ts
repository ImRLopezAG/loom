const evidence = [
  "https://www.postgresql.org/docs/18/pgprewarm.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/pg_prewarm/pg_prewarm.c",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/pg_prewarm/autoprewarm.c",
  "packages/tests/unit/extensions-pg_prewarm.test.ts",
  "packages/tests/types/extensions-pg_prewarm.test-d.ts",
  "packages/e2e/integration/extensions-pg_prewarm.test.ts",
] as const;
const common = {
  authority: "operator",
  observability: "external",
  nulls: "No nullable relation/mode/fork inputs",
  live: "No application SQL or automatic live-query binding",
  rollback:
    "Cache, background worker and server file effects are not transactional; acknowledgements and unknown writes survive a rolled-back SQL transaction.",
  providerAcceptance: "pending",
  nativeAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;
export const pgPrewarmAnnotations = [
  {
    id: "routine:$extension:pg_prewarm.pg_prewarm(pg_catalog.regclass,pg_catalog.text,pg_catalog.text,pg_catalog.int8,pg_catalog.int8)",
    disposition: "tooling",
    evidence,
    reason:
      "withPgPrewarm.prewarm: typed qualified relation, mode/fork and optional bigint block bounds, returns bigint blocks processed without a cache-residency claim.",
    semantics: {
      ...common,
      codec: "pg:int8:1",
      defaults: "buffer/main/NULL/NULL; NULL first means 0, NULL last means last relation block",
      privilege:
        "PUBLIC EXECUTE but requires SELECT on relation, or parent table for an index. Missing storage/fork and unsupported prefetch surface native errors.",
      limitation:
        "Prewarming can evict other blocks and is not protected against immediate eviction; native checks actual relation bounds; valid reversed endpoints process zero blocks.",
    },
  },
  {
    id: "routine:$extension:pg_prewarm.autoprewarm_start_worker()",
    disposition: "tooling",
    evidence,
    reason:
      "withPgPrewarm.startWorker: void SQL acknowledgement with explicit nontransactional completion; duplicate worker and unavailable backend prerequisites remain errors.",
    semantics: {
      ...common,
      privilege:
        "PUBLIC EXECUTE in captured contract; server background-worker resources and autoprewarm configuration govern ability to start.",
      prerequisite:
        "Shared server state, not a fixture-local worker; no configuration edits or restarts. Native dynamic initialization is supported upstream and provider acceptance must verify it.",
      limitation: "Dedicated SQL connection cleanup does not stop the shared autoprewarm worker.",
    },
  },
  {
    id: "routine:$extension:pg_prewarm.autoprewarm_dump_now()",
    disposition: "tooling",
    evidence,
    reason:
      "withPgPrewarm.dump: returns bigint records written to shared autoprewarm.blocks; file write is outside transaction rollback.",
    semantics: {
      ...common,
      codec: "pg:int8:1",
      privilege:
        "PUBLIC EXECUTE in captured contract; native shared-memory/file access restrictions and provider behavior surface as errors.",
      prerequisite:
        "Server shared state/file, not database-local state; unavailable target prerequisites are acceptance blockers.",
    },
  },
] as const;
