const evidence = [
  "https://www.postgresql.org/docs/18/contrib-spi.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/spi/insert_username.c",
  "packages/tests/unit/extensions-insert-username.test.ts: exact digest, text/table/event constraints and quoted declaration",
  "packages/tests/types/extensions-insert-username.test-d.ts: text-only declared fields; callback absent from scalar SQL",
  "packages/e2e/integration/extensions-insert-username.test.ts: current_user overwrite, NULL, transaction rollback and native callback rejection",
] as const;
export const insertUsernameAnnotations = [
  {
    id: "routine:$extension:insert_username.insert_username()",
    disposition: "schema",
    evidence,
    reason:
      "trigger() declares BEFORE INSERT and/or UPDATE FOR EACH ROW with one declared text field. The trigger-manager callback is never a scalar SQL or RPC function.",
    semantics: {
      authority: "schema",
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
      nativeAcceptance: "pending",
      behavior:
        "Always overwrites the text field with GetUserNameFromId(GetUserId()), PostgreSQL current_user, including non-NULL caller-supplied values. Does not establish the authenticated application user.",
      nulls: "NULL becomes non-NULL current_user text; the modified row is returned.",
      privilege:
        "PUBLIC EXECUTE; installation/trigger DDL requires operator authority. Runtime assignment uses current_user, including SET ROLE or security-definer context.",
      live: "Not a query expression; ordinary observable table writes participate in table revisions.",
      limitation:
        "C requires TEXTOID exactly: varchar, char, name, citext and domains are rejected. Column names match exactly; DELETE, AFTER and statement-level firing fail.",
    },
  },
] as const;
