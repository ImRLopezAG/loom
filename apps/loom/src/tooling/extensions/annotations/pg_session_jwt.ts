const evidence = [
  "https://neon.com/docs/extensions/pg_session_jwt",
  "https://github.com/neondatabase/pg_session_jwt/blob/v0.5.0/src/lib.rs",
  "packages/tests/unit/extensions-pg_session_jwt.test.ts",
  "packages/tests/types/extensions-pg_session_jwt.test-d.ts",
  "packages/e2e/integration/extensions-pg_session_jwt.test.ts",
] as const;
const query = {
  authority: "query",
  observability: "session",
  live: "Session GUC, JWK-validated JWT and transaction-time nbf/exp cannot qualify as automatic table-revision live queries.",
  limitation:
    "JWT claims and a validated signature do not establish Kello invocation identity or authorization. Fallback request.jwt.claims is a writable session parameter.",
  providerAcceptance: "pending",
  nativeAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;
const sessionWrite = {
  authority: "session",
  observability: "session",
  live: "No application SQL or automatic live-query binding",
  privilege: "PUBLIC EXECUTE; JWK must already be present as a connection-startup (backend-context) GUC.",
  limitation:
    "init and jwt_session_init require pg_session_jwt.jwk at postmaster, configuration or connection startup. Claims-only readers do not use these members.",
  providerAcceptance: "pending",
  nativeAcceptance: "pending",
  publicExportAcceptance: "pending",
} as const;

/** Nine exact captured identities. JWK-mode writes stay in dedicated-session tooling. */
export const pgSessionJwtAnnotations = [
  {
    id: "routine:auth.init()",
    disposition: "tooling",
    evidence,
    reason: "withPgSessionJwt.init loads the connection-startup JWK; it is not an RPC SQL helper.",
    semantics: {
      ...sessionWrite,
      result: "void",
      behavior:
        "Parses pg_session_jwt.jwk as an Ed25519 OKP and caches the verifying key for the backend lifetime; a missing parameter raises ERROR 02000 and an unparseable key raises ERROR 42804.",
      effect: "Backend-scoped key cache; not reverted by ROLLBACK or RESET and released only when the dedicated backend closes.",
    },
  },
  {
    id: "routine:auth.jwt_session_init(pg_catalog.text)",
    disposition: "tooling",
    evidence,
    reason:
      "withPgSessionJwt.jwtSessionInit binds the JWT as a parameter, verifies Ed25519 against the startup JWK, and resets the session GUC on cleanup, observing the same backend afterwards.",
    semantics: {
      ...sessionWrite,
      result: "void",
      nulls: "STRICT: a NULL JWT is rejected by the typed session request before SQL.",
      behavior:
        "Issues a transactional session-level SET of pg_session_jwt.jwt, then verifies encoding, Ed25519 signature, an integer jti strictly greater than the backend high-water mark, and integer nbf/exp with 60s leeway against transaction start time. Failures raise ERROR (23514 signature, replay, nbf, exp; 42804 encoding or claim types).",
      replay:
        "Re-binding the identical token string is served from the backend payload cache without re-checking jti or time; a different token with jti at or below the high-water mark raises ERROR. The cache and high-water mark survive ROLLBACK and RESET and end with the backend.",
    },
  },
  {
    id: "routine:auth.jwt()",
    disposition: "query",
    evidence,
    reason: "jwt is the captured alias of session and always returns jsonb, including JSON null.",
    semantics: {
      ...query,
      claimsOnly:
        "Without a startup JWK, returns request.jwt.claims parsed as JSON; unset or malformed JSON returns JSON null.",
      jwk: "With a startup JWK, request.jwt.claims is ignored; an unset pg_session_jwt.jwt returns JSON null, and a set token that fails verification raises ERROR.",
      result: "JsonbDocument",
      codec: "pg:jsonb:text:1",
      nulls: "JSON null is a jsonb value; the captured return is not SQL NULL.",
    },
  },
  {
    id: "routine:auth.session()",
    disposition: "query",
    evidence,
    reason:
      "session returns the JWK-validated payload, or request.jwt.claims when no startup JWK exists, as jsonb. Absence is JSON null; JWK verification failure is an ERROR, never null.",
    semantics: {
      ...query,
      claimsOnly:
        "Without a startup JWK, returns request.jwt.claims parsed as JSON; unset or malformed JSON returns JSON null.",
      jwk: "With a startup JWK, request.jwt.claims is ignored; an unset pg_session_jwt.jwt returns JSON null, and a set token that fails verification raises ERROR.",
      result: "JsonbDocument",
      codec: "pg:jsonb:text:1",
      nulls: "JSON null is a jsonb value; the captured return is not SQL NULL.",
    },
  },
  {
    id: "routine:auth.user_id()",
    disposition: "query",
    evidence,
    reason: "userId returns the portable JWT sub claim as text; SQL NULL when absent, and mode-specific handling of non-string sub.",
    semantics: {
      ...query,
      result: "string | null",
      codec: "pg:text:1:nullable",
      claimsOnly: "Absent claims, malformed JSON, missing sub or a non-string sub return SQL NULL.",
      jwk: "Unset token or missing sub returns SQL NULL; a non-string sub raises ERROR 42804, as does any token verification failure.",
    },
  },
  {
    id: "routine:auth.uid()",
    disposition: "query",
    evidence,
    reason: "uid parses user_id as uuid and returns SQL NULL when sub is missing or not a UUID string.",
    semantics: {
      ...query,
      result: "string | null",
      codec: "pg:uuid:1:nullable",
      claimsOnly: "Inherits user_id: missing, non-string or non-UUID sub returns SQL NULL.",
      jwk: "A non-UUID string sub returns SQL NULL; a non-string sub and token verification failure raise ERROR through user_id.",
    },
  },
  {
    id: "routine:auth.organization()",
    disposition: "query",
    evidence,
    reason:
      "organization returns the Neon Auth o object as jsonb, or SQL NULL when o is absent or not a JSON object. Other issuers must read jwt().",
    semantics: {
      ...query,
      result: "JsonbDocument | null",
      codec: "pg:jsonb:text:1:nullable",
      limitation: `${query.limitation} organization helpers are Neon Auth's o claim only.`,
    },
  },
  {
    id: "routine:auth.organization_id()",
    disposition: "query",
    evidence,
    reason:
      "organizationId returns o.id as uuid, or SQL NULL when the Neon Auth organization is missing or id is not a UUID.",
    semantics: {
      ...query,
      result: "string | null",
      codec: "pg:uuid:1:nullable",
      limitation: `${query.limitation} organization helpers are Neon Auth's o claim only.`,
    },
  },
  {
    id: "schema:auth",
    disposition: "internal",
    evidence,
    reason: "The extension owns the fixed auth schema; functions are never qualified through the installation schema.",
    semantics: {
      authority: "schema",
      installation: "relocatable false; CREATE EXTENSION may use a selected schema, but public members stay in auth.",
      providerAcceptance: "pending",
      nativeAcceptance: "pending",
      publicExportAcceptance: "pending",
    },
  },
] as const;
