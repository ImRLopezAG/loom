const evidence = [
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/spi/autoinc.c",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/spi/autoinc--1.0.sql",
  "https://www.postgresql.org/docs/18/contrib-spi.html",
  "packages/tests/unit/extensions-autoinc.test.ts: exact contract gate, quoted DDL, int4/table/event validation, no RPC callable",
  "packages/tests/types/extensions-autoinc.test-d.ts: int4 column constraint and frozen declaration shape",
  "packages/e2e/integration/extensions-autoinc.test.ts: native insert/update/NULL/zero/rollback/quoted-schema oracle; source-bound member gates remain required",
  "packages/e2e/integration/extension-trigger-migrations.test.ts: native schema snapshots, trigger changes, rollback and session-independent argument escaping",
  "packages/e2e/integration/packed-extension-adapters.test.ts: isolated published declarations and bundled trigger schema compilation",
] as const;

/** Single 1.0 trigger callback; final per-member acceptance requires source-bound gate receipts. */
export const autoincAnnotations = [
  {
    id: "routine:$extension:autoinc.autoinc()",
    disposition: "schema",
    reason:
      "Returns pg_catalog.trigger: only callable by the trigger manager as BEFORE ROW on INSERT/UPDATE with (int4 column, sequence) argument pairs, so it is a typed trigger declaration, never scalar SQL or RPC.",
    evidence,
    semantics: {
      authority: "schema",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      behavior:
        "For each pair, NULL or 0 is replaced with nextval(sequence); a nextval result of 0 is retried once. Non-zero values are kept. Sequence USAGE/UPDATE is checked with the invoking role's privileges.",
      nulls: "NULL target becomes nextval; trigger itself never returns NULL row",
      live: "Not a query expression; table writes observed by ordinary table revisions",
      limitation:
        "Column names are matched exactly (no case folding); sequence text is parsed by nextval(text), so the adapter emits quoted qualified names.",
    },
  },
] as const;
