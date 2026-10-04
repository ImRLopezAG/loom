const evidence = [
  "https://www.postgresql.org/docs/18/lo.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/lo/lo.c",
  "packages/tests/unit/extensions-lo.test.ts",
  "packages/tests/types/extensions-lo.test-d.ts",
  "packages/e2e/integration/extensions-lo.test.ts",
] as const;
const acceptance = {
  providerAcceptance: "pending",
  nativeAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;
export const loAnnotations = [
  {
    id: "routine:$extension:lo.lo_manage()",
    disposition: "schema",
    evidence,
    reason:
      "Typed BEFORE ROW UPDATE/DELETE trigger declaration with one oid/lo column argument; trigger-manager callback, never scalar SQL/RPC.",
    semantics: {
      ...acceptance,
      authority: "schema",
      privilege:
        "Invoker must be permitted to unlink the referenced large object; trigger creation requires table TRIGGER and callback EXECUTE.",
      behavior:
        "UPDATE of the managed column unlinks a non-null old reference when text values differ or new value is NULL; DELETE unlinks a non-null old reference. Transaction rollback restores the large object.",
      limitation:
        "Each managed value must have one reference; DROP/TRUNCATE do not fire the row trigger and can orphan objects. No automatic vacuumlo or reference counting.",
      live: "Table mutations use ordinary table revisions; large-object contents have no revision dependency.",
    },
  },
  {
    id: "routine:$extension:lo.lo_oid($extension:lo.lo)",
    disposition: "query",
    evidence,
    reason: "oid / sql.functions.lo_oid: exact selected domain argument, nullable unsigned 32-bit oid result.",
    semantics: {
      ...acceptance,
      authority: "query",
      observability: "tables",
      nulls: "STRICT, nullable input yields NULL",
      codec: "pg:oid:unsigned32:1:nullable",
      limitation: "OID does not prove object existence, ownership or byte access.",
    },
  },
  {
    id: "type:$extension:lo.lo",
    disposition: "schema",
    evidence,
    reason:
      "field() and codec expose the unconstrained oid domain; explicit withLargeObjects tooling owns create/read/write/unlink workflows on one transaction/backend.",
    semantics: {
      ...acceptance,
      authority: "schema",
      codec: "pg:oid:unsigned32:1",
      result: "number in 0..4294967295",
      live: "Stored references are table-observable; contents are not. Large-object operations are explicit tooling, no descriptors or pool access reach callbacks.",
    },
  },
  {
    id: "type:$extension:lo._lo",
    disposition: "schema",
    evidence,
    reason:
      "arrayField() / arrayCodec preserve rank, PostgreSQL lower bounds and nullable elements through six dimensions; arrays are not supported lo_manage trigger columns.",
    semantics: {
      ...acceptance,
      authority: "schema",
      codec: "pg:array:1:pg:oid:unsigned32:1",
      result: "PostgreSqlArray<number>",
      live: "Stored reference arrays use table dependencies; dereferenced bytes have no table revision.",
    },
  },
] as const;
