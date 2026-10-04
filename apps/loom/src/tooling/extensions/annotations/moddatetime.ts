const evidence = [
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/spi/moddatetime.c",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/spi/moddatetime--1.0.sql",
  "https://www.postgresql.org/docs/18/contrib-spi.html",
  "packages/tests/unit/extensions-moddatetime.test.ts: exact contract gate, quoted DDL, timestamp/table validation, no RPC callable",
  "packages/tests/types/extensions-moddatetime.test-d.ts: timestamp column constraint and frozen declaration shape",
  "packages/e2e/integration/extensions-moddatetime.test.ts: native update/insert-rejection/rollback/quoted-schema oracle; source-bound member gates remain required",
  "packages/e2e/integration/extension-trigger-migrations.test.ts: native schema snapshots, trigger changes, rollback and enabled-state drift",
  "packages/e2e/integration/packed-extension-adapters.test.ts: isolated published declarations and bundled trigger schema compilation",
] as const;

/** Single 1.0 trigger callback; final per-member acceptance requires source-bound gate receipts. */
export const moddatetimeAnnotations = [
  {
    id: "routine:$extension:moddatetime.moddatetime()",
    disposition: "schema",
    reason:
      "Returns pg_catalog.trigger: only valid as BEFORE UPDATE FOR EACH ROW with one timestamp/timestamptz column argument, so it is a typed trigger declaration, never scalar SQL or RPC.",
    evidence,
    semantics: {
      authority: "schema",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      behavior:
        "Overwrites the column with 'now' (transaction start) on every row UPDATE, including caller-supplied values; INSERT, DELETE, AFTER and statement-level firing raise errors.",
      nulls: "Target becomes non-NULL transaction start timestamp",
      live: "Not a query expression; table writes observed by ordinary table revisions",
      limitation:
        "Column name is matched exactly; value is transaction start, identical for all rows in one transaction.",
    },
  },
] as const;
