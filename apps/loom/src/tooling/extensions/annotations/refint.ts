const evidence = [
  "https://www.postgresql.org/docs/18/contrib-spi.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/spi/refint.c",
  "packages/tests/unit/extensions-refint.test.ts: all member dispositions, quoted remote SQL identifiers and declared local fields",
  "packages/tests/types/extensions-refint.test-d.ts: key tuple arity/data matching, events/actions and no scalar callbacks",
  "packages/e2e/integration/extensions-refint.test.ts: primary-key existence/NULL checks and all restrict/cascade/setnull actions on UPDATE/DELETE",
] as const;
const semantics = {
  authority: "schema",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
  nativeAcceptance: "pending",
  privilege:
    "PUBLIC EXECUTE, security invoker; SPI SELECT/UPDATE/DELETE uses the firing role's privileges and row policies. DDL remains operator-owned. Secure search_path and an equality operator named '=' are native prerequisites.",
  live: "Trigger declarations are not query expressions. All affected application tables must retain ordinary table-revision tracking, including cross-table cascades.",
  limitation:
    "Legacy SPI example, not built-in declarative foreign keys or deferred constraint/concurrency semantics. PostgreSQL documents removal in PG20; not a reason to omit PG18 coverage. Remote SQL identifiers are quoted; local field names are literal.",
} as const;
export const refintAnnotations = [
  {
    id: "routine:$extension:refint.check_foreign_key()",
    disposition: "schema",
    evidence,
    reason:
      "checkForeignKey() declares AFTER UPDATE and/or DELETE FOR EACH ROW on the referenced table, with one or more declared referencing-table key tuples and explicit restrict/cascade/setnull action.",
    semantics: {
      ...semantics,
      behavior:
        "restrict rejects references to OLD keys; cascade deletes on DELETE and updates to NEW keys on UPDATE; setnull nulls all referencing key fields. Unchanged UPDATE keys skip action using PostgreSQL text output comparison; plans are still prepared.",
      nulls:
        "Any NULL OLD key skips checking/action. Cascade UPDATE propagates NULL NEW keys; setnull may fail the referencing table's NOT NULL constraint.",
    },
  },
  {
    id: "routine:$extension:refint.check_primary_key()",
    disposition: "schema",
    evidence,
    reason:
      "checkPrimaryKey() declares AFTER INSERT and/or UPDATE FOR EACH ROW on the referencing table, with declared local columns, a quoted referenced relation and matching referenced key columns.",
    semantics: {
      ...semantics,
      behavior:
        "SELECT 1 checks that the NEW key tuple exists in the referenced relation; absence aborts the statement. DELETE/BEFORE/statement-level firing is rejected.",
      nulls: "Any NULL NEW key skips the complete existence check (MATCH SIMPLE behavior).",
    },
  },
] as const;
