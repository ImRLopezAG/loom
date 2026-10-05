const evidence = [
  "https://www.postgresql.org/docs/18/pgstattuple.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/pgstattuple/pgstattuple--1.4--1.5.sql: REVOKE EXECUTE FROM PUBLIC; GRANT to pg_stat_scan_tables",
  "packages/tests/unit/extensions-pgstattuple.test.ts: exact members, quoted regclass/text overloads, external observability, record codecs",
  "packages/tests/types/extensions-pgstattuple.test-d.ts: relation inputs and exact bigint/number/nonfinite row fields",
  "packages/e2e/integration/extensions-pgstattuple.test.ts: native PostgreSQL 18 and Neon statistics, privilege and row-lock oracles; source-bound member gates remain required",
] as const;
const common = {
  authority: "query",
  observability: "external",
  privilege:
    "EXECUTE revoked from PUBLIC (manifest publicExecute=false); requires superuser or pg_stat_scan_tables. Row-level security is not applied to aggregate page/tuple counts.",
  live: "Physical storage state is not a table revision; automatic live subscriptions reject it",
  nulls: "STRICT; relation inputs are non-null",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;
const row = (codec: string) => ({ ...common, result: "record", codec: `pg:composite:1:${codec}` });
const regclass = "Relation input binds a quoted schema-qualified name cast to regclass; relocated schemas stay quoted.";
const text =
  "String input selects the captured text overload; PostgreSQL parses a possibly-qualified, quote-aware name at execution (no static dependency).";

/** Read-only storage diagnostics; no administrative mutations exist in 1.5. */
export const pgstattupleAnnotations = [
  {
    id: "routine:$extension:pgstattuple.pg_relpages(pg_catalog.regclass)",
    disposition: "query",
    evidence,
    reason: `relationPages / sql.functions.pg_relpages(relation): page count as bigint. ${regclass}`,
    semantics: { ...common, result: "bigint", codec: "pg:int8:1" },
  },
  {
    id: "routine:$extension:pgstattuple.pg_relpages(pg_catalog.text)",
    disposition: "query",
    evidence,
    reason: `sql.functions.pg_relpages(name: string). ${text}`,
    semantics: { ...common, result: "bigint", codec: "pg:int8:1" },
  },
  {
    id: "routine:$extension:pgstattuple.pgstattuple(pg_catalog.regclass)",
    disposition: "query",
    evidence,
    reason: `tuple / tupleRows / sql.functions.pgstattuple(relation): full scan of live/dead tuples and free space. ${regclass}`,
    semantics: {
      ...row("pgstattuple"),
      limitation: "Full relation scan under AccessShareLock; cost proportional to size.",
    },
  },
  {
    id: "routine:$extension:pgstattuple.pgstattuple(pg_catalog.text)",
    disposition: "query",
    evidence,
    reason: `sql.functions.pgstattuple(name: string). ${text}`,
    semantics: row("pgstattuple"),
  },
  {
    id: "routine:$extension:pgstattuple.pgstattuple_approx(pg_catalog.regclass)",
    disposition: "query",
    evidence,
    reason: `tupleApprox / tupleApproxRows: visibility-map assisted estimate. ${regclass}`,
    semantics: {
      ...row("pgstattuple_approx"),
      limitation: "Tables and materialized views only; estimates, not exact counts.",
    },
  },
  {
    id: "routine:$extension:pgstattuple.pgstatindex(pg_catalog.regclass)",
    disposition: "query",
    evidence,
    reason: `btreeIndex / btreeIndexRows: B-tree statistics. ${regclass}`,
    semantics: {
      ...row("pgstatindex"),
      limitation: "B-tree only; other access methods raise. avg_leaf_density/leaf_fragmentation may be NaN.",
    },
  },
  {
    id: "routine:$extension:pgstattuple.pgstatindex(pg_catalog.text)",
    disposition: "query",
    evidence,
    reason: `sql.functions.pgstatindex(name: string). ${text}`,
    semantics: row("pgstatindex"),
  },
  {
    id: "routine:$extension:pgstattuple.pgstatginindex(pg_catalog.regclass)",
    disposition: "query",
    evidence,
    reason: `ginIndex / ginIndexRows: GIN pending-list statistics. ${regclass}`,
    semantics: { ...row("pgstatginindex"), limitation: "GIN only." },
  },
  {
    id: "routine:$extension:pgstattuple.pgstathashindex(pg_catalog.regclass)",
    disposition: "query",
    evidence,
    reason: `hashIndex / hashIndexRows: hash index page/item statistics. ${regclass}`,
    semantics: { ...row("pgstathashindex"), limitation: "Hash only; free_percent may be NaN." },
  },
] as const;
