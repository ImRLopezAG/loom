const evidence = [
  "https://www.postgresql.org/docs/18/pgrowlocks.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/pgrowlocks/pgrowlocks.c: SELECT privilege or pg_stat_scan_tables required; reads heap tuple xmax without a snapshot",
  "packages/tests/unit/extensions-pgstattuple.test.ts: pgrowlocks member, quoted text binding, named FROM row columns",
  "packages/tests/unit/extensions-pgrowlocks.test.ts: tid/xid codecs and lock row decoding",
  "packages/e2e/integration/extensions-pgstattuple.test.ts: native row-lock ownership, transaction and decoder oracles; source-bound member gates remain required",
] as const;

export const pgrowlocksAnnotations = [
  {
    id: "routine:$extension:pgrowlocks.pgrowlocks(pg_catalog.text)",
    disposition: "query",
    evidence,
    reason:
      "rows(relation) / sql.functions.pgrowlocks: one typed row per locked tuple. Relations bind their quoted schema-qualified name to the only (text) overload; strings pass through for PostgreSQL to parse.",
    semantics: {
      authority: "query",
      observability: "external",
      privilege:
        "EXECUTE granted to PUBLIC; the function itself requires SELECT on the table or pg_stat_scan_tables. Row-level security is not applied; tuple positions of locked rows are exposed.",
      live: "Reflects other sessions' in-progress locks, not table revisions; automatic live subscriptions reject it",
      nulls: "STRICT SETOF; locker/multi non-null, arrays carry PostgreSQL bounds",
      result:
        "{ locked_row: Tid; locker: number; multi: boolean; xids: PostgreSqlArray<number>; modes: PostgreSqlArray<string>; pids: PostgreSqlArray<number> }",
      codec: "pg:composite:1:pgrowlocks",
      limitation:
        "Not a consistent snapshot; takes AccessShareLock and scans the whole table. xid values wrap modulo 2^32. pids omit lockers that already ended.",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
] as const;
