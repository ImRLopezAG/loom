const evidence = [
  "https://github.com/fboulnois/pg_uuidv7/blob/v1.6.0/sql/pg_uuidv7--1.6.sql",
  "https://github.com/fboulnois/pg_uuidv7/blob/v1.6.0/pg_uuidv7.c",
  "https://www.postgresql.org/docs/18/datatype-datetime.html",
  "packages/tests/types/extensions-pg-uuidv7.test-d.ts: distinct civil/instant literals and SQL, native UUID columns, defaults and fixed result types",
  "packages/e2e/integration/extensions-pg-uuidv7.test.ts: all five actual routines, native truncation/wrap, storage, bridges, nested JSON/RPC and live observability",
] as const;
const common = {
  authority: "query",
  providerAcceptance: "passed",
  publicExportAcceptance: "passed",
  limitation:
    "UUID exposes its first 48 Unix-millisecond bits; probabilistic uniqueness is not secrecy, authentication or invocation identity.",
} as const;
const conversion = [
  [
    "uuid_timestamp_to_v7",
    "timestamp",
    "Civil timestamp input retains its calendar interpretation; conversion does not infer a timezone.",
  ],
  [
    "uuid_timestamptz_to_v7",
    "timestamptz",
    "Instant input uses its UTC instant; display timezone does not alter UUID bits.",
  ],
] as const;
const extraction = [
  ["uuid_v7_to_timestamp", "timestamp", "timestamp | null"],
  ["uuid_v7_to_timestamptz", "timestamptz", "timestamptz | null"],
] as const;

/** Complete five-routine 1.6 family; native acceptance and public-export integration are separate host gates. */
export const pgUuidv7Annotations = [
  {
    id: "routine:$extension:pg_uuidv7.uuid_generate_v7()",
    disposition: "query",
    reason:
      "v7 uses native CLOCK_REALTIME and pg_strong_random; version7 and RFC variant bits are fixed, remaining bits are random.",
    evidence,
    semantics: {
      ...common,
      observability: "external",
      nulls: "No arguments, returns non-NULL UUID",
      result: "string",
      codec: "pg:uuid:1",
      live: "Automatic live subscriptions rejected, including prepared and alias-wrapped expressions",
    },
  },
  ...conversion.map(
    ([name, type, reason]) =>
      ({
        id: `routine:$extension:pg_uuidv7.${name}(pg_catalog.${type},pg_catalog.bool)`,
        disposition: "query",
        reason,
        evidence,
        semantics: {
          ...common,
          observability: "argument-dependent",
          nulls:
            "STRICT: any SQL NULL timestamp or zero flag returns NULL; omitted/undefined zero uses captured false default",
          result: "string | null",
          codec: "pg:uuid:1:nullable",
          precision:
            "Native C converts unsigned microseconds to integer milliseconds and retains low48 bits; adjacent microseconds collapse. Pre1970, BC, expanded bounds and infinities are accepted but can wrap to different finite dates; no full-domain roundtrip guarantee.",
          live: "Only explicit JavaScript literal zero=true is classified table observable. False, omitted/default and dynamic SQL flags are external, despite STABLE catalogue metadata.",
        },
      }) as const,
  ),
  ...extraction.map(
    ([name, type, result]) =>
      ({
        id: `routine:$extension:pg_uuidv7.${name}(pg_catalog.uuid)`,
        disposition: "query",
        reason:
          "Deterministically reads the first48 bits of every native UUID, without validating version7 or RFC variant; NULL remains SQL NULL.",
        evidence,
        semantics: {
          ...common,
          observability: "tables",
          nulls: "STRICT: NULL UUID returns NULL",
          result,
          codec: `pg:${type}:1:nullable`,
          precision:
            "Returned native timestamp has millisecond precision; shared checked temporal codec preserves all native output digits, supports ISO DateStyle only, and rejects already-rounded Date values.",
          live: "Observable table inputs compose through invocation-bound SQL; nested random expressions remain external",
        },
      }) as const,
  ),
] as const;
