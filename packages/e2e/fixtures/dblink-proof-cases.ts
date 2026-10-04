import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import { dblinkAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/dblink";
import source from "../../../apps/loom/src/tooling/extensions/manifests/dblink.json";

export const dblinkProofFamily = {
  extension: "dblink",
  version: "1.2",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "b713a9ca7a0e00853d0346b44e021c8c48372b5164b4b3f533c2b5022e37eba6",
} as const satisfies ExtensionProofFamily;

const scenarios: Record<string, string> = {
  'composite type:"$extension:dblink".dblink_pkey_results': "captured-pkey-composite-and-array",
  "foreign-data wrapper:dblink_fdw": "captured-fdw-null-handler-validator",
  "routine:$extension:dblink.dblink_build_sql_delete(pg_catalog.text,pg_catalog.int2vector,pg_catalog.int4,pg_catalog._text)":
    "local-pkey-and-build-sql",
  "routine:$extension:dblink.dblink_build_sql_insert(pg_catalog.text,pg_catalog.int2vector,pg_catalog.int4,pg_catalog._text,pg_catalog._text)":
    "local-pkey-and-build-sql",
  "routine:$extension:dblink.dblink_build_sql_update(pg_catalog.text,pg_catalog.int2vector,pg_catalog.int4,pg_catalog._text,pg_catalog._text)":
    "local-pkey-and-build-sql",
  "routine:$extension:dblink.dblink_cancel_query(pg_catalog.text)": "cancel-and-error-message",
  "routine:$extension:dblink.dblink_close(pg_catalog.text,pg_catalog.bool)": "cursor-open-fetch-close",
  "routine:$extension:dblink.dblink_close(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": "cursor-open-fetch-close",
  "routine:$extension:dblink.dblink_close(pg_catalog.text,pg_catalog.text)": "cursor-open-fetch-close",
  "routine:$extension:dblink.dblink_close(pg_catalog.text)": "cursor-open-fetch-close",
  "routine:$extension:dblink.dblink_connect_u(pg_catalog.text,pg_catalog.text)": "connect-u-privileged",
  "routine:$extension:dblink.dblink_connect_u(pg_catalog.text)": "connect-u-privileged",
  "routine:$extension:dblink.dblink_connect(pg_catalog.text,pg_catalog.text)": "connect-named-unnamed",
  "routine:$extension:dblink.dblink_connect(pg_catalog.text)": "connect-named-unnamed",
  "routine:$extension:dblink.dblink_current_query()": "session-current-query",
  "routine:$extension:dblink.dblink_disconnect()": "disconnect-named-unnamed-missing",
  "routine:$extension:dblink.dblink_disconnect(pg_catalog.text)": "disconnect-named-unnamed-missing",
  "routine:$extension:dblink.dblink_error_message(pg_catalog.text)": "cancel-and-error-message",
  "routine:$extension:dblink.dblink_exec(pg_catalog.text,pg_catalog.bool)": "exec-named-unnamed",
  "routine:$extension:dblink.dblink_exec(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": "exec-named-unnamed",
  "routine:$extension:dblink.dblink_exec(pg_catalog.text,pg_catalog.text)": "exec-named-unnamed",
  "routine:$extension:dblink.dblink_exec(pg_catalog.text)": "exec-named-unnamed",
  "routine:$extension:dblink.dblink_fdw_validator(pg_catalog._text,pg_catalog.oid)":
    "captured-fdw-null-handler-validator",
  "routine:$extension:dblink.dblink_fetch(pg_catalog.text,pg_catalog.int4,pg_catalog.bool)": "cursor-open-fetch-close",
  "routine:$extension:dblink.dblink_fetch(pg_catalog.text,pg_catalog.int4)": "cursor-open-fetch-close",
  "routine:$extension:dblink.dblink_fetch(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool)":
    "cursor-open-fetch-close",
  "routine:$extension:dblink.dblink_fetch(pg_catalog.text,pg_catalog.text,pg_catalog.int4)": "cursor-open-fetch-close",
  "routine:$extension:dblink.dblink_get_connections()": "session-get-connections-null-and-named",
  "routine:$extension:dblink.dblink_get_notify()": "notify-empty-and-listen",
  "routine:$extension:dblink.dblink_get_notify(pg_catalog.text)": "notify-empty-and-listen",
  "routine:$extension:dblink.dblink_get_pkey(pg_catalog.text)": "local-pkey-and-build-sql",
  "routine:$extension:dblink.dblink_get_result(pg_catalog.text,pg_catalog.bool)": "async-send-get-result-busy",
  "routine:$extension:dblink.dblink_get_result(pg_catalog.text)": "async-send-get-result-busy",
  "routine:$extension:dblink.dblink_is_busy(pg_catalog.text)": "async-send-get-result-busy",
  "routine:$extension:dblink.dblink_open(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": "cursor-open-fetch-close",
  "routine:$extension:dblink.dblink_open(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)":
    "cursor-open-fetch-close",
  "routine:$extension:dblink.dblink_open(pg_catalog.text,pg_catalog.text,pg_catalog.text)": "cursor-open-fetch-close",
  "routine:$extension:dblink.dblink_open(pg_catalog.text,pg_catalog.text)": "cursor-open-fetch-close",
  "routine:$extension:dblink.dblink_send_query(pg_catalog.text,pg_catalog.text)": "async-send-get-result-busy",
  "routine:$extension:dblink.dblink(pg_catalog.text,pg_catalog.bool)": "query-named-unnamed",
  "routine:$extension:dblink.dblink(pg_catalog.text,pg_catalog.text,pg_catalog.bool)": "query-named-unnamed",
  "routine:$extension:dblink.dblink(pg_catalog.text,pg_catalog.text)": "query-named-unnamed",
  "routine:$extension:dblink.dblink(pg_catalog.text)": "query-named-unnamed",
  "type:$extension:dblink._dblink_pkey_results": "captured-pkey-composite-and-array",
  "type:$extension:dblink.dblink_pkey_results": "captured-pkey-composite-and-array",
};

export const dblinkDatabaseProofCase: ExtensionProofCase = {
  id: "dblink.native",
  gate: "database",
  families: [dblinkProofFamily],
  file: "packages/e2e/integration/extensions-dblink.test.ts",
  title:
    "dblink 1.2 local helpers, session connections, typed remote I/O and FDW identity match native PostgreSQL 18",
  claims: source.contract.members.map((entry) => ({
    family: dblinkProofFamily,
    member: entry.id,
    scenario: scenarios[entry.id] ?? "missing-scenario",
  })),
};

export const dblinkDatabaseProofCases: ExtensionProofCase[] = [dblinkDatabaseProofCase];
export const dblinkDatabaseFixtureCount = 2;
export const dblinkDatabaseRoleCount = 0;

export const dblinkUnitProofCases: ExtensionProofCase[] = [
  "dblink remote I/O is absent from application SQL",
  "dblink dispositions bind native session semantics and member proofs",
  "dblink codecs preserve pkey, notify, int2vector and text[] order",
  "dblink cancellation before acquisition preserves the exact reason without admitting a callback",
].map((title, index) => ({
  id: `dblink.unit-${index + 1}`,
  gate: "unit",
  families: [dblinkProofFamily],
  claims: [],
  file: "packages/tests/unit/extensions-dblink.test.ts",
  title,
}));

export const dblinkTypesProofCase: ExtensionProofCase = {
  id: "dblink.types",
  gate: "types",
  families: [dblinkProofFamily],
  claims: [],
  file: "packages/tests/types/extensions-dblink.test-d.ts",
  title: "dblink exact application observation and trusted operator type boundaries",
};

export const dblinkGenerationProofCase: ExtensionProofCase = {
  id: "dblink.generation",
  gate: "generation",
  families: [dblinkProofFamily],
  claims: [],
  file: "packages/e2e/integration/extensions-dblink-generation.test.ts",
  title: "dblink first-load, disk, RPC, Effect, empty, future, absent and selected component bindings",
};

export const dblinkConsumerProofCase: ExtensionProofCase = {
  id: "dblink.consumer",
  gate: "consumer",
  families: [dblinkProofFamily],
  claims: [],
  file: "packages/e2e/integration/packed-dblink.test.ts",
  title: "dblink isolated frozen tarball consumer requires packed adapter and tooling exports",
};

export const dblinkMemberProofs: Extract<ExtensionProofDeclaration, { state: "candidate" }>["members"] =
  dblinkAnnotations.map((annotation) => ({
    id: annotation.id,
    disposition: annotation.disposition,
    reason: annotation.reason,
    citations: [...annotation.evidence],
    cases: dblinkDatabaseProofCases.flatMap((definition) =>
      definition.claims
        .filter((claim) => claim.member === annotation.id)
        .map((claim) => ({ caseId: definition.id, scenario: claim.scenario })),
    ),
    transfers: [],
  }));
