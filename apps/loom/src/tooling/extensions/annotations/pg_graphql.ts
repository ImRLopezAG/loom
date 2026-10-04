const sources = [
  "https://neon.com/docs/extensions/pg_graphql",
  "https://supabase.github.io/pg_graphql/",
  "apps/loom/src/tooling/extensions/manifests/pg_graphql.json",
  "apps/loom/src/core/extensions/adapters/pg_graphql.ts",
  "packages/e2e/scripts/run-pg_graphql-native-characterization.ts",
] as const;
const unit =
  "packages/tests/unit/extensions-pg_graphql.test.ts: exact 1.5.12 digest, qualified resolve SQL, jsonb text codecs, omitted defaults";
const types =
  "packages/tests/types/extensions-pg_graphql.test-d.ts: jsonb documents, omitted defaults, rejected JS GraphQL values and trigger-only callables";
const database =
  "packages/e2e/integration/extensions-pg_graphql.test.ts: native jsonb text, session privileges, trigger-only increment, ordinary SQL transaction boundary";
const evidence = [...sources, unit, types, database] as const;
const pending = {
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
  nativeAcceptance: "pending",
} as const;
const query = {
  authority: "query",
  ...pending,
} as const;

/** Reviewed dispositions for captured pg_graphql 1.5.12. Increment is trigger-only (native 0A000). */
export const pgGraphqlAnnotationContract = {
  extension: "pg_graphql",
  postgresMajor: 18,
  version: "1.5.12",
  provider: "neon",
  digest: "a64a8bd702ab1dad6e9b171e6f5cc61ec54c2e31411da5d7c6aec86933538d5f",
  providerAcceptance: "pending",
} as const;

export const pgGraphqlAnnotations = [
  {
    id: "event trigger:graphql_watch_ddl",
    disposition: "schema",
    reason:
      "Extension-owned ddl_command_end watcher. It is the only supported caller of increment_schema_version after CREATE/ALTER.",
    evidence,
    semantics: {
      authority: "schema",
      observability: "external",
      live: "Event-trigger catalog work is not an automatic table-revision live query.",
      ...pending,
    },
  },
  {
    id: "event trigger:graphql_watch_drop",
    disposition: "schema",
    reason: "Extension-owned sql_drop watcher. It is the only supported caller of increment_schema_version after DROP.",
    evidence,
    semantics: {
      authority: "schema",
      observability: "external",
      live: "Event-trigger catalog work is not an automatic table-revision live query.",
      ...pending,
    },
  },
  {
    id: "routine:$extension:pg_graphql._internal_resolve(pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.jsonb)",
    disposition: "query",
    reason:
      "Captured SQL-callable C backend exposed as internalResolve and the exact _internal_resolve alias. A NULL query preserves native XX000 instead of a GraphQL error envelope; no JS executor.",
    evidence,
    semantics: {
      authority: "query",
      observability: "external",
      result: "JsonbDocument",
      codec: "pg:jsonb:text:1",
      nulls: "Not STRICT; NULL query is a SQL error, unlike resolve.",
      ...pending,
    },
  },
  {
    id: "routine:$extension:pg_graphql.comment_directive(pg_catalog.text)",
    disposition: "query",
    reason:
      "commentDirective extracts the first @graphql({...}) JSON object from a comment. Plain text and SQL NULL return jsonb {}.",
    evidence,
    semantics: {
      ...query,
      observability: "tables",
      result: "JsonbDocument",
      codec: "pg:jsonb:text:1",
      nulls:
        "Not STRICT; SQL NULL and comments without a directive return jsonb {}, never SQL NULL. Invalid JSON raises 22P02.",
    },
  },
  {
    id: "routine:$extension:pg_graphql.exception(pg_catalog.text)",
    disposition: "query",
    reason:
      "Captured SQL-callable plpgsql exception routine. The typed expression preserves native 22000 for a message and 22004 for NULL; it never fabricates a successful return.",
    evidence,
    semantics: {
      authority: "query",
      observability: "tables",
      result: "never returns",
      nulls: "NULL raises 22004.",
      ...pending,
    },
  },
  {
    id: "routine:$extension:pg_graphql.get_schema_version()",
    disposition: "query",
    reason:
      "getSchemaVersion reads the extension sequence as int4. SECURITY DEFINER does not grant table access. Sequence nextval is not rolled back.",
    evidence,
    semantics: {
      ...query,
      observability: "external",
      result: "number",
      codec: "pg:int4:1",
      live: "Catalog sequence state cannot qualify as an automatic table-revision live query.",
      privilege: "SECURITY DEFINER; PUBLIC EXECUTE.",
    },
  },
  {
    id: "routine:$extension:pg_graphql.increment_schema_version()",
    disposition: "internal",
    reason:
      "Event-trigger function returning event_trigger. Native SELECT raises 0A000. No operator SQL wrapper is exported because the call is trigger-only.",
    evidence,
    semantics: {
      authority: "schema",
      observability: "external",
      result: "event_trigger",
      limitation:
        "PostgreSQL rejects ordinary SQL calls (0A000). graphql_watch_ddl and graphql_watch_drop are the only callers.",
      ...pending,
    },
  },
  {
    id: "routine:$extension:pg_graphql.resolve(pg_catalog.text,pg_catalog.jsonb,pg_catalog.text,pg_catalog.jsonb)",
    disposition: "query",
    reason:
      "resolve is the captured GraphQL SQL member. Query text is GraphQL, not NestedQuery SQL. Results are jsonb text. Writes use the caller transaction and privileges. No JS GraphQL executor.",
    evidence,
    semantics: {
      ...query,
      observability: "external",
      result: "JsonbDocument",
      codec: "pg:jsonb:text:1",
      defaults: "'{}'::jsonb, NULL::text, NULL::jsonb",
      nulls:
        "Not STRICT; NULL query returns a GraphQL error envelope. NULL variables behave like the empty default. GraphQL errors are jsonb results and do not abort the SQL transaction.",
      nested:
        "GraphQL document text plus jsonb variables/extensions. Table dependencies are not inferred; live subscriptions stay rejected.",
      live: "Unobservable GraphQL text cannot opt into table-revision live queries.",
      privilege: "INVOKER; unknown fields when the role lacks table privilege.",
      writes: "Mutations execute as ordinary SQL under the current transaction isolation and read-only mode.",
    },
  },
  {
    id: 'sequence column:"$extension:pg_graphql".seq_schema_version.is_called',
    disposition: "internal",
    reason: "Sequence column owned by seq_schema_version. Observed through get_schema_version, not as a public field.",
    evidence,
    semantics: { authority: "schema", ...pending },
  },
  {
    id: 'sequence column:"$extension:pg_graphql".seq_schema_version.last_value',
    disposition: "internal",
    reason: "Sequence column owned by seq_schema_version. Observed through get_schema_version, not as a public field.",
    evidence,
    semantics: { authority: "schema", ...pending },
  },
  {
    id: 'sequence column:"$extension:pg_graphql".seq_schema_version.log_cnt',
    disposition: "internal",
    reason: "Sequence column owned by seq_schema_version. Observed through get_schema_version, not as a public field.",
    evidence,
    semantics: { authority: "schema", ...pending },
  },
  {
    id: 'sequence:"$extension:pg_graphql".seq_schema_version',
    disposition: "internal",
    reason:
      "Extension-owned schema version sequence. nextval from event triggers is not rolled back with the triggering DDL transaction.",
    evidence,
    semantics: { authority: "schema", observability: "external", ...pending },
  },
] as const;
