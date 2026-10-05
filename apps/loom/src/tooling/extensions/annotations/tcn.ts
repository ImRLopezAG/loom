const evidence = [
  "https://www.postgresql.org/docs/18/tcn.html",
  "https://www.postgresql.org/docs/18/sql-listen.html",
  "https://www.postgresql.org/docs/18/sql-notify.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/tcn/tcn.c",
  "packages/tests/unit/extensions-tcn.test.ts: primary-key/event declarations and dedicated-session notification metadata",
  "packages/tests/unit/extensions-tcn-session.test.ts: payload text decoding, session admission/revocation, cancellation and cleanup failure reporting",
  "packages/tests/types/extensions-tcn.test-d.ts: schema declaration and closed notification result types; no scalar callback",
  "packages/e2e/integration/extensions-tcn.test.ts: committed notification delivery, UPDATE OLD keys, rollback silence and native invalid-trigger rejection",
] as const;
export const tcnAnnotations = [
  {
    id: "routine:$extension:tcn.triggered_change_notification()",
    disposition: "schema",
    evidence,
    reason:
      "trigger() declares AFTER INSERT/UPDATE/DELETE FOR EACH ROW on a table with a declared primary key, optionally supplying a channel. Notification consumption is explicit direct-session tooling, never scalar SQL or RPC.",
    semantics: {
      authority: "schema",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      behavior:
        "Payload contains unqualified table name, I/U/D, and primary-key column/output-text pairs. INSERT uses the inserted tuple; UPDATE and DELETE use OLD keys. Quotes are doubled. AFTER return NULL is ignored.",
      nulls:
        "Native valid primary keys cannot contain NULL. Missing or invalid primary key raises a trigger protocol error.",
      privilege:
        "PUBLIC EXECUTE, security invoker. LISTEN/NOTIFY channels have no per-channel authentication: payloads are database-wide notifications available to any connected listener; not tenant-authorized row streams.",
      live: "LISTEN belongs to one direct dedicated connection; delivery follows commit, rollback emits nothing, duplicates may coalesce. No durable replay, initial snapshot or invocation identity; automatic table-revision subscriptions are absent and rejected for this session state.",
      limitation:
        "Payload lacks schema identity and values remain PostgreSQL output text. Native NOTIFY payload limit applies. Listener starts after LISTEN acknowledgement and closes after callback success/failure/cancellation; no automatic retry.",
    },
  },
] as const;
