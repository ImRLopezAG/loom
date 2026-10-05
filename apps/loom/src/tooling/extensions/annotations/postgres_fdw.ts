const evidence = [
  "https://www.postgresql.org/docs/18/postgres-fdw.html",
  "https://www.postgresql.org/docs/18/sql-createforeigndatawrapper.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/postgres_fdw/postgres_fdw.c",
  "packages/tests/unit/extensions-postgres_fdw.test.ts",
  "packages/tests/types/extensions-postgres_fdw.test-d.ts",
  "packages/e2e/integration/extensions-postgres_fdw.test.ts",
  "packages/e2e/integration/extensions-postgres_fdw-generation.test.ts",
  "packages/e2e/integration/packed-postgres_fdw.test.ts",
] as const;
const acceptance = {
  providerAcceptance: "pending",
  nativeAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;
const session = {
  ...acceptance,
  observability: "session",
  live: "Backend-local FDW connection cache is not table-revision backed; automatic subscriptions reject it.",
  rollback:
    "Cached connections survive COMMIT and ROLLBACK on the same backend. Dedicated-session cleanup disconnects idle cache entries and reports cleanup failures.",
} as const;
export const postgresFdwAnnotations = [
  {
    id: "foreign-data wrapper:postgres_fdw",
    disposition: "schema",
    evidence,
    reason:
      "foreignDataWrapper exposes the captured FDW identity, handler and validator members for CREATE SERVER; not a query helper.",
    semantics: {
      ...acceptance,
      authority: "schema",
      limitation:
        "CREATE SERVER, USER MAPPING and FOREIGN TABLE remain PostgreSQL core DDL, not captured extension members.",
    },
  },
  {
    id: "routine:$extension:postgres_fdw.postgres_fdw_disconnect_all()",
    disposition: "tooling",
    evidence,
    reason:
      "withPostgresFdw.disconnectAll: boolean acknowledgement; false when every cached connection is used in the current transaction or the cache is empty.",
    semantics: {
      ...session,
      authority: "session",
      codec: "pg:bool:1",
      privilege: "PUBLIC EXECUTE in the captured contract.",
      limitation:
        "Does not close connections used in the current transaction. Unknown server names are not accepted because this member has no server argument.",
    },
  },
  {
    id: "routine:$extension:postgres_fdw.postgres_fdw_disconnect(pg_catalog.text)",
    disposition: "tooling",
    evidence,
    reason:
      "withPostgresFdw.disconnect: exact server name, boolean acknowledgement; unknown servers raise 42704; in-transaction use returns false.",
    semantics: {
      ...session,
      authority: "session",
      codec: "pg:bool:1",
      nulls: "STRICT: a NULL server name returns NULL and is rejected by the typed operator request.",
      privilege: "PUBLIC EXECUTE in the captured contract.",
      limitation: "Server name must exist in pg_foreign_server. In-transaction connections stay cached.",
    },
  },
  {
    id: "routine:$extension:postgres_fdw.postgres_fdw_get_connections(pg_catalog.bool)",
    disposition: "query",
    evidence,
    reason:
      "connections / sql.functions.postgres_fdw_get_connections: optional check_conn default false and the six captured OUT columns.",
    semantics: {
      ...session,
      authority: "query",
      codec: "pg:composite:1:postgres_fdw_get_connections",
      defaults: "check_conn=false; closed is NULL until check_conn is true",
      nulls: "STRICT: NULL check_conn yields an empty set. user_name and closed are nullable OUT values.",
      privilege: "PUBLIC EXECUTE; results are the current backend cache only.",
    },
  },
  {
    id: "routine:$extension:postgres_fdw.postgres_fdw_handler()",
    disposition: "schema",
    evidence,
    reason:
      "Captured CREATE FOREIGN DATA WRAPPER handler reference. Its fdw_handler pseudotype identifies the native schema callback, not a portable query result.",
    semantics: { ...acceptance, authority: "schema" },
  },
  {
    id: "routine:$extension:postgres_fdw.postgres_fdw_validator(pg_catalog._text,pg_catalog.oid)",
    disposition: "schema",
    evidence,
    reason:
      "Captured CREATE FOREIGN DATA WRAPPER validator reference. Native CREATE SERVER, USER MAPPING and FOREIGN TABLE validate options through this schema callback; direct valid and invalid option calls are retained in its native proof.",
    semantics: { ...acceptance, authority: "schema" },
  },
] as const;
