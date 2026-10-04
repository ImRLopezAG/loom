import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const pgxUlidProofFamily = {
  extension: "pgx_ulid",
  version: "0.2.2",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "e2e491782b819b700106736a81ffa9922f24226e1d18ec02ce90931dcef0a60d",
} satisfies ExtensionProofFamily;

const type = "$extension:pgx_ulid.ulid";
const pair = `${type},${type}`;
export const pgxUlidProofMembers = {
  generate: "routine:$extension:pgx_ulid.gen_ulid()",
  monotonic: "routine:$extension:pgx_ulid.gen_monotonic_ulid()",
  fromTimestamp: "routine:$extension:pgx_ulid.timestamp_to_ulid(pg_catalog.timestamp)",
  fromTimestamptz: "routine:$extension:pgx_ulid.timestamptz_to_ulid(pg_catalog.timestamptz)",
  fromUuid: "routine:$extension:pgx_ulid.ulid_from_uuid(pg_catalog.uuid)",
  toTimestamp: `routine:$extension:pgx_ulid.ulid_to_timestamp(${type})`,
  toTimestamptz: `routine:$extension:pgx_ulid.ulid_to_timestamptz(${type})`,
  toUuid: `routine:$extension:pgx_ulid.ulid_to_uuid(${type})`,
  toBytes: `routine:$extension:pgx_ulid.ulid_to_bytea(${type})`,
  send: `routine:$extension:pgx_ulid.ulid_send(${type})`,
  receive: "routine:$extension:pgx_ulid.ulid_recv(pg_catalog.internal)",
  compare: `routine:$extension:pgx_ulid.ulid_cmp(${pair})`,
  hash: `routine:$extension:pgx_ulid.ulid_hash(${type})`,
  eq: `routine:$extension:pgx_ulid.ulid_eq(${pair})`,
  ne: `routine:$extension:pgx_ulid.ulid_ne(${pair})`,
  lt: `routine:$extension:pgx_ulid.ulid_lt(${pair})`,
  le: `routine:$extension:pgx_ulid.ulid_le(${pair})`,
  gt: `routine:$extension:pgx_ulid.ulid_gt(${pair})`,
  ge: `routine:$extension:pgx_ulid.ulid_ge(${pair})`,
  equal: `operator:$extension:pgx_ulid.=(${pair})`,
  notEqual: `operator:$extension:pgx_ulid.<>(${pair})`,
  lessThan: `operator:$extension:pgx_ulid.<(${pair})`,
  lessOrEqual: `operator:$extension:pgx_ulid.<=(${pair})`,
  greaterThan: `operator:$extension:pgx_ulid.>(${pair})`,
  greaterOrEqual: `operator:$extension:pgx_ulid.>=(${pair})`,
  castToBytes: `cast:${type}->pg_catalog.bytea`,
  castToTimestamp: `cast:${type}->pg_catalog.timestamp`,
  castToTimestamptz: `cast:${type}->pg_catalog.timestamptz`,
  castToUuid: `cast:${type}->pg_catalog.uuid`,
  castFromTimestamp: `cast:pg_catalog.timestamp->${type}`,
  castFromTimestamptz: `cast:pg_catalog.timestamptz->${type}`,
  castFromUuid: `cast:pg_catalog.uuid->${type}`,
  scalar: `type:${type}`,
  array: "type:$extension:pgx_ulid._ulid",
  btree: "opclass:$extension:pgx_ulid.ulid_btree_ops/btree",
  hashIndex: "opclass:$extension:pgx_ulid.ulid_hash_ops/hash",
} as const;

function claim(member: string, scenario: string) {
  return { family: pgxUlidProofFamily, member, scenario };
}
const m = pgxUlidProofMembers;
export const pgxUlidNativeProofClaims = {
  textVectors: claim(m.scalar, "case-insensitive-text-input-canonical-uppercase-output"),
  uuidBridge: claim(m.toUuid, "big-endian-uuid-vectors-nil-and-maximum"),
  uuidReverse: claim(m.fromUuid, "uuid-to-ulid-vectors-nil-and-maximum"),
  bytes: claim(m.toBytes, "big-endian-sixteen-byte-vectors"),
  send: claim(m.send, "native-endian-sixteen-byte-send-output"),
  receive: claim(m.receive, "binary-receive-rejects-send-output-and-admits-only-64-bit-cbor"),
  fromTimestamp: claim(m.fromTimestamp, "float-epoch-millisecond-truncation-negative-saturation-48-bit-wrap"),
  fromTimestamptz: claim(m.fromTimestamptz, "instant-millisecond-prefix-with-zero-randomness"),
  toTimestamptz: claim(m.toTimestamptz, "millisecond-instant-extraction-normalized-utc"),
  toTimestamp: claim(m.toTimestamp, "session-timezone-civil-extraction"),
  generation: claim(m.generate, "random-ulid-native-clock-prefix"),
  monotonic: claim(m.monotonic, "shared-memory-preload-monotonic-generation"),
  compare: claim(m.compare, "unsigned-128-bit-ordering-sign"),
  hash: claim(m.hash, "equal-values-equal-int4-hash"),
  eq: claim(m.eq, "boolean-equality-and-strict-null"),
  ne: claim(m.ne, "boolean-inequality-and-strict-null"),
  lt: claim(m.lt, "boolean-less-than-and-strict-null"),
  le: claim(m.le, "boolean-less-or-equal-and-strict-null"),
  gt: claim(m.gt, "boolean-greater-than-and-strict-null"),
  ge: claim(m.ge, "boolean-greater-or-equal-and-strict-null"),
  equal: claim(m.equal, "qualified-operator-equality"),
  notEqual: claim(m.notEqual, "qualified-operator-inequality"),
  lessThan: claim(m.lessThan, "qualified-operator-less-than"),
  lessOrEqual: claim(m.lessOrEqual, "qualified-operator-less-or-equal"),
  greaterThan: claim(m.greaterThan, "qualified-operator-greater-than"),
  greaterOrEqual: claim(m.greaterOrEqual, "qualified-operator-greater-or-equal"),
  castToBytes: claim(m.castToBytes, "qualified-cast-to-bytea"),
  castToTimestamp: claim(m.castToTimestamp, "qualified-cast-to-session-civil-timestamp"),
  castToTimestamptz: claim(m.castToTimestamptz, "qualified-cast-to-instant"),
  castToUuid: claim(m.castToUuid, "qualified-cast-to-uuid"),
  castFromTimestamp: claim(m.castFromTimestamp, "qualified-cast-from-civil-timestamp"),
  castFromTimestamptz: claim(m.castFromTimestamptz, "qualified-cast-from-instant"),
  castFromUuid: claim(m.castFromUuid, "qualified-cast-from-uuid"),
  array: claim(m.array, "native-array-dimensions-bounds-and-null-elements"),
  btree: claim(m.btree, "btree-index-scan-orders-and-filters"),
  hashIndex: claim(m.hashIndex, "hash-index-equality-scan"),
};

const file = "packages/e2e/integration/extensions-pgx-ulid.test.ts";
export const pgxUlidNativeProofCase = {
  id: "pgx_ulid.native-semantics",
  file,
  title:
    "pgx_ulid exact 0.2.2 typed members preserve canonical text, UUID/byte order, float millisecond conversion, session civil extraction and strict NULLs",
  gate: "database",
  families: [pgxUlidProofFamily],
  claims: [
    pgxUlidNativeProofClaims.textVectors,
    pgxUlidNativeProofClaims.uuidBridge,
    pgxUlidNativeProofClaims.uuidReverse,
    pgxUlidNativeProofClaims.bytes,
    pgxUlidNativeProofClaims.send,
    pgxUlidNativeProofClaims.receive,
    pgxUlidNativeProofClaims.fromTimestamp,
    pgxUlidNativeProofClaims.fromTimestamptz,
    pgxUlidNativeProofClaims.toTimestamptz,
    pgxUlidNativeProofClaims.toTimestamp,
    pgxUlidNativeProofClaims.compare,
    pgxUlidNativeProofClaims.hash,
    pgxUlidNativeProofClaims.eq,
    pgxUlidNativeProofClaims.ne,
    pgxUlidNativeProofClaims.lt,
    pgxUlidNativeProofClaims.le,
    pgxUlidNativeProofClaims.gt,
    pgxUlidNativeProofClaims.ge,
    pgxUlidNativeProofClaims.equal,
    pgxUlidNativeProofClaims.notEqual,
    pgxUlidNativeProofClaims.lessThan,
    pgxUlidNativeProofClaims.lessOrEqual,
    pgxUlidNativeProofClaims.greaterThan,
    pgxUlidNativeProofClaims.greaterOrEqual,
    pgxUlidNativeProofClaims.castToBytes,
    pgxUlidNativeProofClaims.castToTimestamp,
    pgxUlidNativeProofClaims.castToTimestamptz,
    pgxUlidNativeProofClaims.castToUuid,
    pgxUlidNativeProofClaims.castFromTimestamp,
    pgxUlidNativeProofClaims.castFromTimestamptz,
    pgxUlidNativeProofClaims.castFromUuid,
  ],
} satisfies ExtensionProofCase;

export const pgxUlidStorageProofCase = {
  id: "pgx_ulid.native-storage",
  file,
  title:
    "pgx_ulid native fields, defaults, arrays and both operator classes compose with insert/RETURNING, WHERE, ORDER BY and index scans",
  gate: "database",
  families: [pgxUlidProofFamily],
  claims: [
    pgxUlidNativeProofClaims.generation,
    pgxUlidNativeProofClaims.array,
    pgxUlidNativeProofClaims.btree,
    pgxUlidNativeProofClaims.hashIndex,
  ],
} satisfies ExtensionProofCase;

export const pgxUlidMonotonicProofCase = {
  id: "pgx_ulid.native-monotonic-preload",
  file,
  title:
    "pgx_ulid monotonic generation requires the pgx_ulid shared preload library and increments within one millisecond",
  gate: "database",
  families: [pgxUlidProofFamily],
  claims: [pgxUlidNativeProofClaims.monotonic],
} satisfies ExtensionProofCase;

export const pgxUlidLiveProofCase = {
  id: "pgx_ulid.native-live-and-rollback",
  file,
  title:
    "pgx_ulid deterministic conversions permit automatic live evaluation; generators and session civil extraction are rejected; caught decode rolls back",
  gate: "database",
  families: [pgxUlidProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

/** All four callbacks must finish; member witnesses alone do not establish native acceptance. */
export const pgxUlidProofCases = [
  pgxUlidNativeProofCase,
  pgxUlidStorageProofCase,
  pgxUlidMonotonicProofCase,
  pgxUlidLiveProofCase,
] satisfies ExtensionProofCase[];

export const pgxUlidProofSchema = 'custom"ulid';
export const pgxUlidUnitProofCase = {
  id: "pgx_ulid.unit-contracts",
  file: "packages/tests/unit/extensions-pgx-ulid.test.ts",
  title: "pgx_ulid exact pin, required API and generated ULID contracts",
  gate: "unit",
  families: [pgxUlidProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const pgxUlidTypesProofCase = {
  id: "pgx_ulid.types-contracts",
  file: "packages/tests/types/extensions-pgx-ulid.test-d.ts",
  title: "pgx_ulid public branded ULID, native temporal identities and fixed result declarations",
  gate: "types",
  families: [pgxUlidProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const pgxUlidGenerationProofCase = {
  id: "pgx_ulid.generation-contracts",
  file: "packages/e2e/integration/extension-adapter-codegen-pgx-ulid.test.ts",
  title: "pgx_ulid first load retains exact ULID helpers through RPC and Effect",
  gate: "generation",
  families: [pgxUlidProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const pgxUlidConsumerProofCase = {
  id: "pgx_ulid.consumer-contracts",
  file: "packages/e2e/integration/packed-pgx-ulid.test.ts",
  title: "pgx_ulid isolated packed ULID identities, native RPC and selected bundles",
  gate: "consumer",
  families: [pgxUlidProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const pgxUlidAllGateProofCases = [
  ...pgxUlidProofCases,
  pgxUlidUnitProofCase,
  pgxUlidTypesProofCase,
  pgxUlidGenerationProofCase,
  pgxUlidConsumerProofCase,
] satisfies ExtensionProofCase[];
