const evidence = [
  "https://www.postgresql.org/docs/18/dblink.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/dblink/dblink.c",
  "packages/tests/unit/extensions-dblink.test.ts",
  "packages/tests/types/extensions-dblink.test-d.ts",
  "packages/e2e/integration/extensions-dblink.test.ts",
  "packages/e2e/integration/extensions-dblink-generation.test.ts",
  "packages/e2e/integration/packed-dblink.test.ts",
] as const;
const acceptance = {
  providerAcceptance: "pending",
  nativeAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;
const session = {
  ...acceptance,
  observability: "session",
  live: "Backend-local dblink connections are not table-revision backed; automatic subscriptions reject them.",
  rollback:
    "Named and unnamed connections survive COMMIT and ROLLBACK on the same backend. Dedicated-session cleanup disconnects leftovers and reports cleanup failures.",
} as const;
const query = {
  ...acceptance,
  observability: "tables",
  live: "Local catalogue helpers read the current backend's relations; they are not remote result sets.",
} as const;
function member(
  id: string,
  disposition: "query" | "tooling" | "schema" | "internal",
  reason: string,
  semantics: Record<string, unknown>,
) {
  return { id, disposition, evidence, reason, semantics } as const;
}

export const dblinkAnnotations = [
  member(
    'composite type:"$extension:dblink".dblink_pkey_results',
    "schema",
    "Captured composite identity for dblink_get_pkey OUT columns position and colname.",
    { ...acceptance, authority: "schema", codec: "pg:composite:1:dblink_pkey_results" },
  ),
  member(
    "foreign-data wrapper:dblink_fdw",
    "schema",
    "foreignDataWrapper exposes dblink_fdw with a null handler and dblink_fdw_validator; CREATE SERVER remains core DDL.",
    {
      ...acceptance,
      authority: "schema",
      limitation: "Native handler is 0 (NULL). Validator is the only attached FDW callback.",
    },
  ),
  member(
    "routine:$extension:dblink.dblink_build_sql_delete(pg_catalog.text,pg_catalog.int2vector,pg_catalog.int4,pg_catalog._text)",
    "query",
    "buildSqlDelete / sql.functions.dblink_build_sql_delete: local relation + PK attnums emit DELETE text.",
    { ...query, authority: "query", codec: "pg:text:1", nulls: "STRICT" },
  ),
  member(
    "routine:$extension:dblink.dblink_build_sql_insert(pg_catalog.text,pg_catalog.int2vector,pg_catalog.int4,pg_catalog._text,pg_catalog._text)",
    "query",
    "buildSqlInsert / sql.functions.dblink_build_sql_insert: local relation + PK attnums emit INSERT text.",
    { ...query, authority: "query", codec: "pg:text:1", nulls: "STRICT" },
  ),
  member(
    "routine:$extension:dblink.dblink_build_sql_update(pg_catalog.text,pg_catalog.int2vector,pg_catalog.int4,pg_catalog._text,pg_catalog._text)",
    "query",
    "buildSqlUpdate / sql.functions.dblink_build_sql_update: local relation + PK attnums emit UPDATE text.",
    { ...query, authority: "query", codec: "pg:text:1", nulls: "STRICT" },
  ),
  member(
    "routine:$extension:dblink.dblink_cancel_query(pg_catalog.text)",
    "tooling",
    "withDblink.cancelQuery: named-connection cancel acknowledgement; idle connections still return OK.",
    { ...session, authority: "session", codec: "pg:text:1", privilege: "PUBLIC EXECUTE in the captured contract." },
  ),
  member(
    "routine:$extension:dblink.dblink_close(pg_catalog.text,pg_catalog.bool)",
    "tooling",
    "withDblink.close unnamed + failOnError: closes a cursor on the unnamed connection.",
    { ...session, authority: "session", codec: "pg:text:1" },
  ),
  member(
    "routine:$extension:dblink.dblink_close(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    "tooling",
    "withDblink.close named + failOnError: closes a cursor on a named connection.",
    { ...session, authority: "session", codec: "pg:text:1" },
  ),
  member(
    "routine:$extension:dblink.dblink_close(pg_catalog.text,pg_catalog.text)",
    "tooling",
    "withDblink.close named: closes a cursor on a named connection.",
    { ...session, authority: "session", codec: "pg:text:1" },
  ),
  member(
    "routine:$extension:dblink.dblink_close(pg_catalog.text)",
    "tooling",
    "withDblink.close unnamed: closes a cursor on the unnamed connection.",
    { ...session, authority: "session", codec: "pg:text:1" },
  ),
  member(
    "routine:$extension:dblink.dblink_connect_u(pg_catalog.text,pg_catalog.text)",
    "tooling",
    "withDblink.connectU named: security-definer connect; PUBLIC EXECUTE is false in the captured contract.",
    {
      ...session,
      authority: "session",
      privilege: "security definer; publicExecute false",
      limitation: "Ordinary RPC never accepts a connection string.",
    },
  ),
  member(
    "routine:$extension:dblink.dblink_connect_u(pg_catalog.text)",
    "tooling",
    "withDblink.connectU unnamed: security-definer connect; unnamed leftovers are not listed by get_connections.",
    {
      ...session,
      authority: "session",
      privilege: "security definer; publicExecute false",
      limitation: "Ordinary RPC never accepts a connection string.",
    },
  ),
  member(
    "routine:$extension:dblink.dblink_connect(pg_catalog.text,pg_catalog.text)",
    "tooling",
    "withDblink.connect named: session-owned remote connect; connstr is accepted as native text and never recorded.",
    { ...session, authority: "session", nulls: "STRICT: NULL connstr returns NULL and is rejected by the typed request." },
  ),
  member(
    "routine:$extension:dblink.dblink_connect(pg_catalog.text)",
    "tooling",
    "withDblink.connect unnamed: session-owned remote connect; unnamed connections are absent from get_connections.",
    { ...session, authority: "session", nulls: "STRICT" },
  ),
  member(
    "routine:$extension:dblink.dblink_current_query()",
    "query",
    "currentQuery / sql.functions.dblink_current_query: nullable text of the current backend query.",
    { ...session, authority: "query", codec: "pg:text:1", observability: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink_disconnect()",
    "tooling",
    "withDblink.disconnect unnamed: drops the unnamed connection; missing unnamed raises connection not available.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink_disconnect(pg_catalog.text)",
    "tooling",
    "withDblink.disconnect named: missing names raise connection \"name\" not available.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink_error_message(pg_catalog.text)",
    "tooling",
    "withDblink.errorMessage: last error text for a named connection.",
    { ...session, authority: "session", codec: "pg:text:1" },
  ),
  member(
    "routine:$extension:dblink.dblink_exec(pg_catalog.text,pg_catalog.bool)",
    "tooling",
    "withDblink.exec unnamed + failOnError: remote write command tag; not an ordinary RPC mutation.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink_exec(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    "tooling",
    "withDblink.exec named + failOnError: remote write command tag.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink_exec(pg_catalog.text,pg_catalog.text)",
    "tooling",
    "withDblink.exec named: remote write command tag.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink_exec(pg_catalog.text)",
    "tooling",
    "withDblink.exec unnamed: remote write command tag.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink_fdw_validator(pg_catalog._text,pg_catalog.oid)",
    "internal",
    "FDW option validator for wrapper/server catalogs; never an application helper.",
    { ...acceptance, authority: "internal" },
  ),
  member(
    "routine:$extension:dblink.dblink_fetch(pg_catalog.text,pg_catalog.int4,pg_catalog.bool)",
    "tooling",
    "withDblink.fetch unnamed + failOnError: typed SETOF record witness required.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink_fetch(pg_catalog.text,pg_catalog.int4)",
    "tooling",
    "withDblink.fetch unnamed: typed SETOF record witness required.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink_fetch(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool)",
    "tooling",
    "withDblink.fetch named + failOnError: typed SETOF record witness required.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink_fetch(pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
    "tooling",
    "withDblink.fetch named: typed SETOF record witness required.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink_get_connections()",
    "query",
    "connections / sql.functions.dblink_get_connections: nullable text[]; empty cache is NULL, not {}.",
    {
      ...session,
      authority: "query",
      codec: "pg:array:1:,:pg:text:1",
      nulls: "Empty named cache is SQL NULL. Unnamed connections are never listed.",
    },
  ),
  member(
    "routine:$extension:dblink.dblink_get_notify()",
    "tooling",
    "withDblink.getNotify unnamed: OUT notify_name, be_pid, extra; empty unless the remote session LISTENed.",
    { ...session, authority: "session", codec: "pg:composite:1:dblink_get_notify" },
  ),
  member(
    "routine:$extension:dblink.dblink_get_notify(pg_catalog.text)",
    "tooling",
    "withDblink.getNotify named: OUT notify_name, be_pid, extra after remote LISTEN plus a later NOTIFY.",
    { ...session, authority: "session", codec: "pg:composite:1:dblink_get_notify" },
  ),
  member(
    "routine:$extension:dblink.dblink_get_pkey(pg_catalog.text)",
    "query",
    "getPkey / sql.functions.dblink_get_pkey: SETOF dblink_pkey_results for a local relation.",
    { ...query, authority: "query", codec: "pg:composite:1:dblink_pkey_results" },
  ),
  member(
    "routine:$extension:dblink.dblink_get_result(pg_catalog.text,pg_catalog.bool)",
    "tooling",
    "withDblink.getResult + failOnError: drain one async result; typed record witness required.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink_get_result(pg_catalog.text)",
    "tooling",
    "withDblink.getResult: drain one async result; a second call yields an empty set.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink_is_busy(pg_catalog.text)",
    "tooling",
    "withDblink.isBusy: 1 while an async query is outstanding, otherwise 0.",
    { ...session, authority: "session", codec: "pg:int4:1" },
  ),
  member(
    "routine:$extension:dblink.dblink_open(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    "tooling",
    "withDblink.open unnamed + failOnError: opens a remote cursor.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink_open(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    "tooling",
    "withDblink.open named + failOnError: opens a remote cursor.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink_open(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
    "tooling",
    "withDblink.open named: opens a remote cursor.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink_open(pg_catalog.text,pg_catalog.text)",
    "tooling",
    "withDblink.open unnamed: opens a remote cursor.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink_send_query(pg_catalog.text,pg_catalog.text)",
    "tooling",
    "withDblink.sendQuery: async send; 1 means accepted. SQL text is never recorded in effects.",
    { ...session, authority: "session", codec: "pg:int4:1" },
  ),
  member(
    "routine:$extension:dblink.dblink(pg_catalog.text,pg_catalog.bool)",
    "tooling",
    "withDblink.query unnamed + failOnError: remote SELECT with a typed SETOF record witness.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
    "tooling",
    "withDblink.query named + failOnError: remote SELECT with a typed SETOF record witness.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink(pg_catalog.text,pg_catalog.text)",
    "tooling",
    "withDblink.query named: remote SELECT with a typed SETOF record witness.",
    { ...session, authority: "session" },
  ),
  member(
    "routine:$extension:dblink.dblink(pg_catalog.text)",
    "tooling",
    "withDblink.query unnamed: remote SELECT with a typed SETOF record witness.",
    { ...session, authority: "session" },
  ),
  member(
    "type:$extension:dblink._dblink_pkey_results",
    "schema",
    "arrayField: array of captured dblink_pkey_results.",
    { ...acceptance, authority: "schema" },
  ),
  member(
    "type:$extension:dblink.dblink_pkey_results",
    "schema",
    "field: captured dblink_pkey_results composite type.",
    { ...acceptance, authority: "schema" },
  ),
] as const;
