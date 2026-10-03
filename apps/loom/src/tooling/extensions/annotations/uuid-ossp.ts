const evidence = [
  "https://www.postgresql.org/docs/18/uuid-ossp.html",
  "https://www.postgresql.org/docs/18/datatype-uuid.html",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/uuid-ossp/uuid-ossp--1.1.sql",
  "https://github.com/postgres/postgres/blob/REL_18_STABLE/contrib/uuid-ossp/uuid-ossp.c",
  "packages/tests/types/extensions-uuid-ossp.test-d.ts: exact UUID/text column types, NULLs, arity, generic and version rejection",
  "packages/e2e/integration/extensions-uuid-ossp.test.ts: all ten routines, constants, Unicode known vectors, NULLs, native column/default composition and automatic live rejection",
] as const;
const common = {
  authority: "query",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
  limitation: "UUID identifies a value; it does not establish row ownership, authentication or cryptographic secrecy.",
} as const;
const constants = [
  ["uuid_nil", "nil returns the all-zero UUID; native UUID accepts nil without a version/variant restriction."],
  ["uuid_ns_dns", "namespaceDns returns the DNS namespace 6ba7b810-9dad-11d1-80b4-00c04fd430c8."],
  ["uuid_ns_url", "namespaceUrl returns the URL namespace 6ba7b811-9dad-11d1-80b4-00c04fd430c8."],
  [
    "uuid_ns_oid",
    "namespaceOid returns the ISO OID namespace 6ba7b812-9dad-11d1-80b4-00c04fd430c8, unrelated to PostgreSQL catalogue OIDs.",
  ],
  ["uuid_ns_x500", "namespaceX500 returns the X.500 DN namespace 6ba7b814-9dad-11d1-80b4-00c04fd430c8."],
] as const;
const generated = [
  [
    "uuid_generate_v1",
    "v1 depends on time and backend generation state, and may reveal generating machine identity/time.",
  ],
  [
    "uuid_generate_v1mc",
    "v1mc depends on time and randomness, using a random multicast node address instead of a real MAC.",
  ],
  [
    "uuid_generate_v4",
    "v4 uses random numbers. UUID uniqueness is probabilistic; no authentication-token promise is made.",
  ],
] as const;
const named = [
  [
    "uuid_generate_v3",
    "v3 deterministically hashes namespace UUID and exact name bytes with MD5; arbitrary checked UUID namespaces are supported.",
  ],
  [
    "uuid_generate_v5",
    "v5 deterministically hashes namespace UUID and exact name bytes with SHA-1; arbitrary checked UUID namespaces are supported.",
  ],
] as const;

/** Captured member semantics; acceptance requires current source-bound five-gate receipts. */
export const uuidOsspAnnotations = [
  ...constants.map(
    ([name, reason]) =>
      ({
        id: `routine:$extension:uuid-ossp.${name}()`,
        disposition: "query",
        reason,
        evidence,
        semantics: {
          ...common,
          observability: "tables",
          nulls: "Zero arguments; returns a non-NULL UUID constant",
          result: "string",
          codec: "pg:uuid:1",
        },
      }) as const,
  ),
  ...generated.map(
    ([name, reason]) =>
      ({
        id: `routine:$extension:uuid-ossp.${name}()`,
        disposition: "query",
        reason,
        evidence,
        semantics: {
          ...common,
          observability: "external",
          nulls: "Zero arguments; returns a non-NULL generated UUID",
          result: "string",
          codec: "pg:uuid:1",
          live: "Automatic live subscriptions rejected: generation depends on unobservable state",
        },
      }) as const,
  ),
  ...named.map(
    ([name, reason]) =>
      ({
        id: `routine:$extension:uuid-ossp.${name}(pg_catalog.uuid,pg_catalog.text)`,
        disposition: "query",
        reason,
        evidence,
        semantics: {
          ...common,
          observability: "tables",
          nulls: "NULL for any NULL argument; empty text is a valid name",
          result: "string | null",
          codec: "pg:uuid:1:nullable",
          unicode:
            "Lossless UTF-8 name bytes are hashed without Unicode normalization; literal NUL and lone surrogates are rejected",
        },
      }) as const,
  ),
] as const;
