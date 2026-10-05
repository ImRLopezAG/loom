const sources = [
  "https://github.com/pksunkara/pgx_ulid/blob/v0.2.2/src/lib.rs",
  "https://github.com/pksunkara/pgx_ulid/blob/v0.2.2/README.md#monotonicity",
  "https://github.com/dylanhart/ulid-rs/blob/v1.1.4/src/base32.rs",
  "https://github.com/pgcentralfoundation/pgrx/blob/v0.16.1/pgrx/src/datum/time_stamp.rs: From<TimestampWithTimeZone> calls timestamptz_timestamp",
  "https://github.com/pgcentralfoundation/pgrx/blob/v0.16.1/pgrx-macros/src/lib.rs: pg_binary_protocol send/recv",
] as const;
const unit =
  "packages/tests/unit/extensions-pgx-ulid.test.ts: exact pin, lossless text codec, qualified binding, observability and 48-member reconciliation";
const types =
  "packages/tests/types/extensions-pgx-ulid.test-d.ts: branded ULID, native UUID/temporal identities, fixed results and captured arity";
const database = "packages/e2e/integration/extensions-pgx-ulid.test.ts: ";
const common = {
  authority: "query",
  providerAcceptance: "pending",
  publicExportAcceptance: "pending",
  limitation:
    "ULID exposes its first 48 Unix-millisecond bits; randomness is not secrecy, authentication or invocation identity.",
} as const;
const type = "$extension:pgx_ulid.ulid";
const pair = `${type},${type}`;
const semantic = (scenario: string) => [...sources, unit, types, database + scenario];
const strict = "STRICT: any SQL NULL argument returns NULL";
const toTimestampPrecision =
  "to_timestamp((milliseconds as f64) / 1000.0) rounds the float8 seconds to microseconds, so large prefixes carry float error: the 48-bit maximum 281474976710655 ms yields 10889-08-02 05:31:50.655040 UTC, not .655000.";

const casts = [
  [
    `cast:${type}->pg_catalog.bytea`,
    "sql.casts.ulid_to_bytea emits the qualified implicit cast; sixteen big-endian bytes, as ulid_to_bytea.",
    "ulid_to_bytea",
    "{ hex: string } | null",
  ],
  [
    `cast:${type}->pg_catalog.timestamp`,
    "sql.casts.ulid_to_timestamp emits the qualified implicit cast; pgrx converts the millisecond instant with timestamptz_timestamp in the session TimeZone.",
    "ulid_to_timestamp",
    "Timestamp | null",
  ],
  [
    `cast:${type}->pg_catalog.timestamptz`,
    "sql.casts.ulid_to_timestamptz emits the qualified implicit cast; to_timestamp(milliseconds / 1000).",
    "ulid_to_timestamptz",
    "Timestamptz | null",
  ],
  [
    `cast:${type}->pg_catalog.uuid`,
    "sql.casts.ulid_to_uuid emits the qualified implicit cast; the 128 bits keep big-endian UUID byte order.",
    "ulid_to_uuid",
    "string | null",
  ],
  [
    `cast:pg_catalog.timestamp->${type}`,
    "sql.casts.timestamp_to_ulid emits the qualified implicit cast; float epoch milliseconds with zero randomness.",
    "timestamp_to_ulid",
    "Ulid | null",
  ],
  [
    `cast:pg_catalog.timestamptz->${type}`,
    "sql.casts.timestamptz_to_ulid emits the qualified implicit cast; instant epoch milliseconds with zero randomness.",
    "timestamptz_to_ulid",
    "Ulid | null",
  ],
  [
    `cast:pg_catalog.uuid->${type}`,
    "sql.casts.uuid_to_ulid emits the qualified implicit cast; every UUID bit pattern maps to one ULID.",
    "ulid_from_uuid",
    "Ulid | null",
  ],
] as const;
const castCase = (id: string) =>
  `qualified-cast-${id.includes("->pg_catalog") ? "to" : "from"}-${id.includes("bytea") ? "bytea" : id.includes("timestamptz") ? "instant" : id.includes("timestamp") ? "civil" : "uuid"}`;

const attachments = [
  ["function 1", "ulid_btree_ops", "btree", "ulid_cmp support function orders ULIDs as unsigned 128-bit integers"],
  ["function 1", "ulid_hash_ops", "hash", "ulid_hash support function hashes the 128-bit value"],
  ["operator 1", "ulid_btree_ops", "btree", "strategy 1 is <"],
  ["operator 1", "ulid_hash_ops", "hash", "strategy 1 is ="],
  ["operator 2", "ulid_btree_ops", "btree", "strategy 2 is <="],
  ["operator 3", "ulid_btree_ops", "btree", "strategy 3 is ="],
  ["operator 4", "ulid_btree_ops", "btree", "strategy 4 is >="],
  ["operator 5", "ulid_btree_ops", "btree", "strategy 5 is >"],
] as const;

const predicates = [
  ["ulid_eq", "=", "equal", "equality"],
  ["ulid_ne", "<>", "not equal", "inequality"],
  ["ulid_lt", "<", "less than", "less-than"],
  ["ulid_le", "<=", "less than or equal", "less-or-equal"],
  ["ulid_gt", ">", "greater than", "greater-than"],
  ["ulid_ge", ">=", "greater than or equal", "greater-or-equal"],
] as const;

/** Every captured pgx_ulid 0.2.2 identity. Native, provider and isolated-consumer acceptance are separate host gates. */
export const pgxUlidAnnotations = [
  ...casts.map(
    ([id, reason, procedure, result]) =>
      ({
        id,
        disposition: "query",
        reason,
        evidence: semantic(castCase(id)),
        semantics: {
          ...common,
          observability: procedure === "ulid_to_timestamp" ? "session" : "tables",
          context: "implicit",
          method: "function",
          procedure,
          nulls: "SQL NULL remains SQL NULL",
          result,
        },
      }) as const,
  ),
  ...attachments.map(
    ([kind, family, method, role]) =>
      ({
        id: `${kind === "function 1" ? "function" : "operator"} of access method:${kind} ("$extension:pgx_ulid".ulid, "$extension:pgx_ulid".ulid) of "$extension:pgx_ulid".${family} USING ${method}`,
        disposition: "internal",
        reason: `Operator-class attachment owned by opclass:$extension:pgx_ulid.${family}/${method}; ${role}. Index scans through indexes.${method} execute it.`,
        evidence: semantic(method === "btree" ? "btree-index-scan-orders-and-filters" : "hash-index-equality-scan"),
        semantics: { ...common, observability: "tables", parent: `opclass:$extension:pgx_ulid.${family}/${method}` },
      }) as const,
  ),
  ...(["btree", "hash"] as const).map(
    (method) =>
      ({
        id: `opclass:$extension:pgx_ulid.ulid_${method}_ops/${method}`,
        disposition: "schema",
        reason: `indexes.${method} binds this default native class, exact ulid input and the installation namespace.`,
        evidence: semantic(method === "btree" ? "btree-index-scan-orders-and-filters" : "hash-index-equality-scan"),
        semantics: {
          ...common,
          observability: "tables",
          method,
          family: `opfamily:$extension:pgx_ulid.ulid_${method}_ops/${method}`,
          default: "True",
        },
      }) as const,
  ),
  ...(["btree", "hash"] as const).map(
    (method) =>
      ({
        id: `opfamily:$extension:pgx_ulid.ulid_${method}_ops/${method}`,
        disposition: "internal",
        reason: `Catalog family backing the default ${method} class; not separately selectable. indexes.${method} reaches it only through opclass ulid_${method}_ops.`,
        evidence: semantic(method === "btree" ? "btree-index-scan-orders-and-filters" : "hash-index-equality-scan"),
        semantics: {
          ...common,
          observability: "tables",
          method,
          parent: `opclass:$extension:pgx_ulid.ulid_${method}_ops/${method}`,
        },
      }) as const,
  ),
  ...predicates.map(
    ([, name, description, scenario]) =>
      ({
        id: `operator:$extension:pgx_ulid.${name}(${pair})`,
        disposition: "query",
        reason: `Qualified ${description} operator; field ${name} filters and order cursors use it with the installation schema.`,
        evidence: semantic(`qualified-operator-${scenario}`),
        semantics: {
          ...common,
          observability: "tables",
          nulls: "STRICT procedure: NULL operand returns NULL",
          result: "boolean | null",
          ordering: "Unsigned 128-bit order, equal to canonical upper-case text order",
        },
      }) as const,
  ),
  {
    id: "routine:$extension:pgx_ulid.gen_monotonic_ulid()",
    disposition: "query",
    reason:
      "generateMonotonic reads and updates pgx_ulid shared memory under an LWLock; within one millisecond it increments the previous ULID, otherwise it draws a new random ULID.",
    evidence: semantic("shared-memory-preload-monotonic-generation"),
    semantics: {
      ...common,
      observability: "external",
      nulls: "No arguments, returns non-NULL ULID",
      result: "Ulid",
      prerequisite:
        "shared_preload_libraries must include pgx_ulid; without the preload the shared-memory state is not initialized.",
      live: "Automatic live subscriptions rejected",
    },
  },
  {
    id: "routine:$extension:pgx_ulid.gen_ulid()",
    disposition: "query",
    reason: "generate draws the system clock millisecond prefix and 80 random bits.",
    evidence: semantic("random-ulid-native-clock-prefix"),
    semantics: {
      ...common,
      observability: "external",
      nulls: "No arguments, returns non-NULL ULID",
      result: "Ulid",
      live: "Automatic live subscriptions rejected",
    },
  },
  ...(
    [
      [
        "timestamp_to_ulid",
        "pg_catalog.timestamp",
        "Civil timestamp epoch is taken as UTC wall time; no session TimeZone is applied.",
      ],
      [
        "timestamptz_to_ulid",
        "pg_catalog.timestamptz",
        "Instant epoch; the display TimeZone does not change the ULID.",
      ],
    ] as const
  ).map(
    ([name, argument, reason]) =>
      ({
        id: `routine:$extension:pgx_ulid.${name}(${argument})`,
        disposition: "query",
        reason,
        evidence: semantic(
          name === "timestamp_to_ulid"
            ? "float-epoch-millisecond-truncation-negative-saturation-48-bit-wrap"
            : "instant-millisecond-prefix-with-zero-randomness",
        ),
        semantics: {
          ...common,
          observability: "tables",
          nulls: strict,
          result: "Ulid | null",
          precision:
            "extract(epoch) is converted to float8, multiplied by 1000 and truncated with saturating u64 conversion: microseconds are dropped, pre-1970 values become 0 and values above 48 bits wrap. Randomness bits are zero.",
        },
      }) as const,
  ),
  {
    id: `routine:$extension:pgx_ulid.ulid_cmp(${pair})`,
    disposition: "query",
    reason: "compare returns -1, 0 or 1 for unsigned 128-bit order; the btree support function.",
    evidence: semantic("unsigned-128-bit-ordering-sign"),
    semantics: { ...common, observability: "tables", nulls: strict, result: "number | null" },
  },
  ...predicates.map(
    ([name, , description, scenario]) =>
      ({
        id: `routine:$extension:pgx_ulid.${name}(${pair})`,
        disposition: "query",
        reason: `sql.functions.${name} is the ${description} procedure behind the qualified operator.`,
        evidence: semantic(`boolean-${scenario}-and-strict-null`),
        semantics: { ...common, observability: "tables", nulls: strict, result: "boolean | null" },
      }) as const,
  ),
  {
    id: "routine:$extension:pgx_ulid.ulid_from_uuid(pg_catalog.uuid)",
    disposition: "query",
    reason: "fromUuid reinterprets the 16 big-endian UUID bytes as a ULID; nil and maximum are valid.",
    evidence: semantic("uuid-to-ulid-vectors-nil-and-maximum"),
    semantics: { ...common, observability: "tables", nulls: strict, result: "Ulid | null" },
  },
  {
    id: `routine:$extension:pgx_ulid.ulid_hash(${type})`,
    disposition: "query",
    reason: "hash returns the int4 hash used by the hash operator class; equal ULIDs hash equally.",
    evidence: semantic("equal-values-equal-int4-hash"),
    semantics: {
      ...common,
      observability: "tables",
      nulls: strict,
      result: "number | null",
      limitation: `${common.limitation} Hash values are an index implementation detail, not a stable identifier.`,
    },
  },
  ...(
    [
      ["ulid_in", "pg_catalog.cstring", "Native cstring input callback"],
      ["ulid_out", type, "Native cstring output callback"],
      ["ulid_recv", "pg_catalog.internal", "Native binary receive callback"],
    ] as const
  ).map(
    ([name, argument, kind]) =>
      ({
        id: `routine:$extension:pgx_ulid.${name}(${argument})`,
        disposition: "internal",
        reason: `${kind} linked to type:${type}; cstring/internal are PostgreSQL pseudo-type IO contracts, not portable request inputs.${
          name === "ulid_recv"
            ? " pgrx CBOR-decodes the received buffer as u128: native binary parameters reject ulid_send's raw sixteen bytes and CBOR bignums, and admit only CBOR unsigned integers up to 2^64-1. Kello never uses binary ULID parameters; the text codec is the only transport."
            : " Every text parameter and native field round trip exercises it."
        }`,
        evidence: semantic(
          name === "ulid_recv"
            ? "binary-receive-rejects-send-output-and-admits-only-64-bit-cbor"
            : "case-insensitive-text-input-canonical-uppercase-output",
        ),
        semantics: {
          ...common,
          observability: "tables",
          nulls: "SQL NULL bypasses native type input/output callbacks",
          parent: `type:${type}`,
        },
      }) as const,
  ),
  {
    id: `routine:$extension:pgx_ulid.ulid_send(${type})`,
    disposition: "query",
    reason: "send returns the pgrx binary send output: the sixteen native-endian bytes of the 128-bit value.",
    evidence: semantic("native-endian-sixteen-byte-send-output"),
    semantics: {
      ...common,
      observability: "tables",
      nulls: strict,
      result: "{ hex: string } | null",
      limitation: `${common.limitation} Byte order follows the server CPU (little-endian on Neon x86-64 and AArch64 hosts) and is the reverse of ulid_to_bytea.`,
    },
  },
  {
    id: `routine:$extension:pgx_ulid.ulid_to_bytea(${type})`,
    disposition: "query",
    reason: "toBytes returns the sixteen big-endian bytes of the ULID.",
    evidence: semantic("big-endian-sixteen-byte-vectors"),
    semantics: { ...common, observability: "tables", nulls: strict, result: "{ hex: string } | null" },
  },
  {
    id: `routine:$extension:pgx_ulid.ulid_to_timestamp(${type})`,
    disposition: "query",
    reason:
      "toTimestamp converts the millisecond instant through timestamptz_timestamp, so its civil value depends on the session TimeZone despite IMMUTABLE catalogue metadata.",
    evidence: semantic("session-timezone-civil-extraction"),
    semantics: {
      ...common,
      observability: "session",
      nulls: strict,
      result: "Timestamp | null",
      precision: toTimestampPrecision,
      live: "Session-dependent; automatic live subscriptions rejected",
    },
  },
  {
    id: `routine:$extension:pgx_ulid.ulid_to_timestamptz(${type})`,
    disposition: "query",
    reason: "toTimestamptz returns to_timestamp(milliseconds / 1000) as a normalized instant.",
    evidence: semantic("millisecond-instant-extraction-normalized-utc"),
    semantics: {
      ...common,
      observability: "tables",
      nulls: strict,
      result: "Timestamptz | null",
      precision: toTimestampPrecision,
    },
  },
  {
    id: `routine:$extension:pgx_ulid.ulid_to_uuid(${type})`,
    disposition: "query",
    reason:
      "toUuid reinterprets the 128 bits as a UUID in big-endian byte order without setting version or variant bits.",
    evidence: semantic("big-endian-uuid-vectors-nil-and-maximum"),
    semantics: { ...common, observability: "tables", nulls: strict, result: "string | null" },
  },
  {
    id: "type:$extension:pgx_ulid._ulid",
    disposition: "schema",
    reason: "arrayField stores native ulid[] with exact dimensions, lower bounds and NULL elements.",
    evidence: semantic("native-array-dimensions-bounds-and-null-elements"),
    semantics: {
      ...common,
      observability: "tables",
      codec: "pg:array:1:,:pgx_ulid:ulid:crockford:1",
      element: `type:${type}`,
    },
  },
  {
    id: `type:${type}`,
    disposition: "schema",
    reason:
      "field stores native ulid with the canonical text codec; equality, comparison and ordering use the qualified operators.",
    evidence: semantic("case-insensitive-text-input-canonical-uppercase-output"),
    semantics: {
      ...common,
      observability: "tables",
      codec: "pgx_ulid:ulid:crockford:1",
      input:
        "26 Crockford characters, case-insensitive, first character 0-7; native input would silently truncate 8-Z leading values",
    },
  },
] as const;
