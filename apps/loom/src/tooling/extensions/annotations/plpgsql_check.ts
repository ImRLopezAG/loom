const evidence = [
  "https://github.com/okbob/plpgsql_check/blob/v2.8.2/README.md",
  "https://github.com/okbob/plpgsql_check/blob/v2.8.2/plpgsql_check--2.8.sql",
  "packages/tests/unit/extensions-plpgsql_check.test.ts",
  "packages/tests/types/extensions-plpgsql_check.test-d.ts",
  "packages/e2e/integration/extensions-plpgsql_check.test.ts",
] as const;
const common = {
  authority: "operator",
  observability: "external",
  live: "No application SQL or automatic live-query binding",
  rollback: "Analysis is read-only; session settings roll back with the owned transaction and end with its backend.",
  providerAcceptance: "pending",
  nativeAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;
export const plpgsqlCheckAnnotations = [
  {
    id: "routine:$extension:plpgsql_check.__plpgsql_show_dependency_tb(pg_catalog.regprocedure,pg_catalog.regclass,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype)",
    disposition: "tooling",
    evidence,
    reason:
      "withPlpgsqlCheck.nativeDependencies: the C dependency scan without the wrapper ordering, for either routine overload.",
    semantics: {
      ...common,
      codec: "plpgsql_check:2.8:dependency",
      nulls: "All output columns nullable",
      privilege: "PUBLIC EXECUTE; extension-internal naming but SQL-callable, so it is not reclassified internal.",
      limitation: "Row order is the native scan order, not a sorted contract.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.__plpgsql_show_dependency_tb(pg_catalog.text,pg_catalog.regclass,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype)",
    disposition: "tooling",
    evidence,
    reason:
      "withPlpgsqlCheck.nativeDependencies: the C dependency scan without the wrapper ordering, for either routine overload.",
    semantics: {
      ...common,
      codec: "plpgsql_check:2.8:dependency",
      nulls: "All output columns nullable",
      privilege: "PUBLIC EXECUTE; extension-internal naming but SQL-callable, so it is not reclassified internal.",
      limitation: "Row order is the native scan order, not a sorted contract.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_check_function(pg_catalog.regprocedure,pg_catalog.regclass,pg_catalog.text,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.name,pg_catalog.name,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "tooling",
    evidence,
    reason:
      "withPlpgsqlCheck.check: native text/json/xml diagnostic lines for a signature (regprocedure) or name (text) routine; omitted options keep captured defaults.",
    semantics: {
      ...common,
      codec: "pg:text:1",
      nulls: "NULL funcoid/name, relid and flags are native errors; only oldtable/newtable accept NULL",
      privilege: "PUBLIC EXECUTE; analysis compiles the target with caller catalog privileges and does not execute it.",
      limitation:
        "Format names are case-insensitive natively; ambiguous names, non-PL/pgSQL routines and trigger routines without a relation are native errors.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_check_function(pg_catalog.text,pg_catalog.regclass,pg_catalog.text,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.name,pg_catalog.name,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "tooling",
    evidence,
    reason:
      "withPlpgsqlCheck.check: native text/json/xml diagnostic lines for a signature (regprocedure) or name (text) routine; omitted options keep captured defaults.",
    semantics: {
      ...common,
      codec: "pg:text:1",
      nulls: "NULL funcoid/name, relid and flags are native errors; only oldtable/newtable accept NULL",
      privilege: "PUBLIC EXECUTE; analysis compiles the target with caller catalog privileges and does not execute it.",
      limitation:
        "Format names are case-insensitive natively; ambiguous names, non-PL/pgSQL routines and trigger routines without a relation are native errors.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_check_function_tb(pg_catalog.regprocedure,pg_catalog.regclass,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.name,pg_catalog.name,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "tooling",
    evidence,
    reason:
      "withPlpgsqlCheck.checkTable: decoded nullable issue rows (regproc text, int4 line/position) for either routine overload.",
    semantics: {
      ...common,
      codec: "plpgsql_check:2.8:issue",
      nulls: "Every RETURNS TABLE column is nullable; NULL target is a native error",
      privilege: "PUBLIC EXECUTE; static analysis without execution.",
      limitation: "functionid is search_path-relative regproc text; warnings classes follow native flags.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_check_function_tb(pg_catalog.text,pg_catalog.regclass,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.name,pg_catalog.name,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool,pg_catalog.bool)",
    disposition: "tooling",
    evidence,
    reason:
      "withPlpgsqlCheck.checkTable: decoded nullable issue rows (regproc text, int4 line/position) for either routine overload.",
    semantics: {
      ...common,
      codec: "plpgsql_check:2.8:issue",
      nulls: "Every RETURNS TABLE column is nullable; NULL target is a native error",
      privilege: "PUBLIC EXECUTE; static analysis without execution.",
      limitation: "functionid is search_path-relative regproc text; warnings classes follow native flags.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_check_pragma(pg_catalog._text)",
    disposition: "tooling",
    evidence,
    reason:
      "withPlpgsqlCheck.pragma: native int4 acknowledgement of VARIADIC pragma text; directives affect checks only when written inside a PL/pgSQL body.",
    semantics: {
      ...common,
      codec: "pg:int4:1",
      nulls: "NULL VARIADIC array returns 0; empty array returns 1",
      privilege: "PUBLIC EXECUTE; runtime no-op.",
      limitation: "Calling it from the operator session never changes later checks.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_check_profiler(pg_catalog.bool)",
    disposition: "tooling",
    evidence,
    reason:
      "withPlpgsqlCheck.profiler: sets or (NULL/omitted) reads plpgsql_check.profiler for the owned transaction and returns the native boolean.",
    semantics: {
      ...common,
      codec: "pg:bool:1",
      nulls: "NULL/omitted reads state without changing it",
      privilege: "PUBLIC EXECUTE; user-settable GUC.",
      limitation:
        "The setting rolls back with the owned transaction and ends with the dedicated operator backend; application sessions are not enabled.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_check_tracer(pg_catalog.bool,pg_catalog.text)",
    disposition: "tooling",
    evidence,
    reason:
      "withPlpgsqlCheck.tracer: sets or reads plpgsql_check.tracer and verbosity (terse/default/verbose) for the owned transaction; returns the native boolean.",
    semantics: {
      ...common,
      codec: "pg:bool:1",
      nulls: "NULL enable/verbosity read or keep current values",
      privilege: "PUBLIC EXECUTE, but trace output stays blocked unless a superuser set plpgsql_check.enable_tracer.",
      limitation: "Trace output is NOTICE traffic of this backend only; invalid verbosity is a native error.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_coverage_branches(pg_catalog.regprocedure)",
    disposition: "tooling",
    evidence,
    reason: "withPlpgsqlCheck.branchCoverage: native float8 branch coverage ratio for either routine overload.",
    semantics: {
      ...common,
      codec: "pg:float8:1",
      nulls: "NULL target is native NULL handling",
      privilege: "PUBLIC EXECUTE.",
      limitation: "An unprofiled routine reports 0.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_coverage_branches(pg_catalog.text)",
    disposition: "tooling",
    evidence,
    reason: "withPlpgsqlCheck.branchCoverage: native float8 branch coverage ratio for either routine overload.",
    semantics: {
      ...common,
      codec: "pg:float8:1",
      nulls: "NULL target is native NULL handling",
      privilege: "PUBLIC EXECUTE.",
      limitation: "An unprofiled routine reports 0.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_coverage_statements(pg_catalog.regprocedure)",
    disposition: "tooling",
    evidence,
    reason: "withPlpgsqlCheck.statementCoverage: native float8 statement coverage ratio for either routine overload.",
    semantics: {
      ...common,
      codec: "pg:float8:1",
      nulls: "NULL target is native NULL handling",
      privilege: "PUBLIC EXECUTE.",
      limitation: "An unprofiled routine reports 0; non-PL/pgSQL targets are native errors.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_coverage_statements(pg_catalog.text)",
    disposition: "tooling",
    evidence,
    reason: "withPlpgsqlCheck.statementCoverage: native float8 statement coverage ratio for either routine overload.",
    semantics: {
      ...common,
      codec: "pg:float8:1",
      nulls: "NULL target is native NULL handling",
      privilege: "PUBLIC EXECUTE.",
      limitation: "An unprofiled routine reports 0; non-PL/pgSQL targets are native errors.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_profiler_function_statements_tb(pg_catalog.regprocedure)",
    disposition: "tooling",
    evidence,
    reason: "withPlpgsqlCheck.profileStatements: decoded per-statement profile tree rows for either routine overload.",
    semantics: {
      ...common,
      codec: "plpgsql_check:2.8:profile-statement",
      nulls: "STRICT; columns nullable",
      privilege: "PUBLIC EXECUTE.",
      limitation: "Backend-local unless preloaded.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_profiler_function_statements_tb(pg_catalog.text)",
    disposition: "tooling",
    evidence,
    reason: "withPlpgsqlCheck.profileStatements: decoded per-statement profile tree rows for either routine overload.",
    semantics: {
      ...common,
      codec: "plpgsql_check:2.8:profile-statement",
      nulls: "STRICT; columns nullable",
      privilege: "PUBLIC EXECUTE.",
      limitation: "Backend-local unless preloaded.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_profiler_function_tb(pg_catalog.regprocedure)",
    disposition: "tooling",
    evidence,
    reason:
      "withPlpgsqlCheck.profile: decoded per-line profile rows with native int8/float8 arrays for either routine overload.",
    semantics: {
      ...common,
      codec: "plpgsql_check:2.8:profile-line",
      nulls: "STRICT; columns nullable",
      privilege: "PUBLIC EXECUTE.",
      limitation:
        "Without plpgsql_check in shared_preload_libraries the profile is backend-local to the operator session; preloaded profiles are shared server state.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_profiler_function_tb(pg_catalog.text)",
    disposition: "tooling",
    evidence,
    reason:
      "withPlpgsqlCheck.profile: decoded per-line profile rows with native int8/float8 arrays for either routine overload.",
    semantics: {
      ...common,
      codec: "plpgsql_check:2.8:profile-line",
      nulls: "STRICT; columns nullable",
      privilege: "PUBLIC EXECUTE.",
      limitation:
        "Without plpgsql_check in shared_preload_libraries the profile is backend-local to the operator session; preloaded profiles are shared server state.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_profiler_functions_all()",
    disposition: "tooling",
    evidence,
    reason: "withPlpgsqlCheck.profiledFunctions: decoded profiled routine totals with regprocedure text identity.",
    semantics: {
      ...common,
      codec: "plpgsql_check:2.8:profiled-function",
      nulls: "Columns nullable",
      privilege: "PUBLIC EXECUTE.",
      limitation: "Backend-local unless preloaded.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_profiler_install_fake_queryid_hook()",
    disposition: "tooling",
    evidence,
    reason:
      "withPlpgsqlCheck.installFakeQueryIdHook: installs the backend-local planner hook used for profiler query IDs.",
    semantics: {
      ...common,
      privilege: "PUBLIC EXECUTE.",
      rollback: "Process-local hook is not transactional; it ends with the dedicated operator backend.",
      limitation: "Does not affect application backends.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_profiler_remove_fake_queryid_hook()",
    disposition: "tooling",
    evidence,
    reason: "withPlpgsqlCheck.removeFakeQueryIdHook: removes the backend-local planner hook.",
    semantics: {
      ...common,
      privilege: "PUBLIC EXECUTE.",
      rollback: "Process-local hook is not transactional.",
      limitation: "Does not affect application backends.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_profiler_reset(pg_catalog.regprocedure)",
    disposition: "tooling",
    evidence,
    reason: "withPlpgsqlCheck.resetProfile: clears one regprocedure profile and journals the non-transactional effect.",
    semantics: {
      ...common,
      nulls: "STRICT",
      privilege: "PUBLIC EXECUTE.",
      rollback: "Profile clearing is not transactional and survives the owned transaction rollback.",
      limitation: "Preloaded profiles are cleared for every session on the server.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_profiler_reset_all()",
    disposition: "tooling",
    evidence,
    reason:
      "withPlpgsqlCheck.resetAllProfiles: clears every profile visible to this backend and journals the non-transactional effect.",
    semantics: {
      ...common,
      privilege: "PUBLIC EXECUTE.",
      rollback: "Profile clearing is not transactional and survives the owned transaction rollback.",
      limitation: "Preloaded profiles are shared server state.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_show_dependency_tb(pg_catalog.regprocedure,pg_catalog.regclass,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype)",
    disposition: "tooling",
    evidence,
    reason:
      "withPlpgsqlCheck.dependencies: SQL wrapper rows ordered natively by type, schema and name for either routine overload.",
    semantics: {
      ...common,
      codec: "plpgsql_check:2.8:dependency",
      nulls: "All output columns nullable; oid is unsigned 32-bit",
      privilege: "PUBLIC EXECUTE; SQL wrapper over the C dependency scan.",
      limitation: "Only relations and routines referenced by statically analysed SQL are reported.",
    },
  },
  {
    id: "routine:$extension:plpgsql_check.plpgsql_show_dependency_tb(pg_catalog.text,pg_catalog.regclass,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype,pg_catalog.regtype)",
    disposition: "tooling",
    evidence,
    reason:
      "withPlpgsqlCheck.dependencies: SQL wrapper rows ordered natively by type, schema and name for either routine overload.",
    semantics: {
      ...common,
      codec: "plpgsql_check:2.8:dependency",
      nulls: "All output columns nullable; oid is unsigned 32-bit",
      privilege: "PUBLIC EXECUTE; SQL wrapper over the C dependency scan.",
      limitation: "Only relations and routines referenced by statically analysed SQL are reported.",
    },
  },
] as const;
