import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const pgUuidv7ProofFamily = {
  extension: "pg_uuidv7",
  version: "1.6",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "f6723e0d29a7ea7a57a7655eebd254c072d1101c19049450863b21337ca7b396",
} satisfies ExtensionProofFamily;

export const pgUuidv7ProofMembers = {
  generate: "routine:$extension:pg_uuidv7.uuid_generate_v7()",
  fromTimestamp: "routine:$extension:pg_uuidv7.uuid_timestamp_to_v7(pg_catalog.timestamp,pg_catalog.bool)",
  fromTimestamptz: "routine:$extension:pg_uuidv7.uuid_timestamptz_to_v7(pg_catalog.timestamptz,pg_catalog.bool)",
  toTimestamp: "routine:$extension:pg_uuidv7.uuid_v7_to_timestamp(pg_catalog.uuid)",
  toTimestamptz: "routine:$extension:pg_uuidv7.uuid_v7_to_timestamptz(pg_catalog.uuid)",
} as const;

export const pgUuidv7NativeProofClaims = {
  civilVectors: {
    family: pgUuidv7ProofFamily,
    member: pgUuidv7ProofMembers.fromTimestamp,
    scenario: "zero-true-civil-boundary-uuid-vectors",
  },
  instantVectors: {
    family: pgUuidv7ProofFamily,
    member: pgUuidv7ProofMembers.fromTimestamptz,
    scenario: "zero-true-instant-boundary-uuid-vectors",
  },
  civilExtraction: {
    family: pgUuidv7ProofFamily,
    member: pgUuidv7ProofMembers.toTimestamp,
    scenario: "civil-boundary-extraction-and-direct-alias",
  },
  instantExtraction: {
    family: pgUuidv7ProofFamily,
    member: pgUuidv7ProofMembers.toTimestamptz,
    scenario: "instant-boundary-extraction",
  },
  civilNulls: {
    family: pgUuidv7ProofFamily,
    member: pgUuidv7ProofMembers.fromTimestamp,
    scenario: "strict-null-civil-input-and-zero-flag",
  },
  instantNulls: {
    family: pgUuidv7ProofFamily,
    member: pgUuidv7ProofMembers.fromTimestamptz,
    scenario: "strict-null-instant-input-and-zero-flag",
  },
  civilExtractionNull: {
    family: pgUuidv7ProofFamily,
    member: pgUuidv7ProofMembers.toTimestamp,
    scenario: "strict-null-civil-extraction",
  },
  instantExtractionNull: {
    family: pgUuidv7ProofFamily,
    member: pgUuidv7ProofMembers.toTimestamptz,
    scenario: "strict-null-instant-extraction",
  },
  generation: {
    family: pgUuidv7ProofFamily,
    member: pgUuidv7ProofMembers.generate,
    scenario: "random-v7-version-variant-and-native-clock-bounds",
  },
  civilRandomDefaults: {
    family: pgUuidv7ProofFamily,
    member: pgUuidv7ProofMembers.fromTimestamp,
    scenario: "omitted-and-false-zero-preserve-millisecond-prefix",
  },
  instantRandomDefaults: {
    family: pgUuidv7ProofFamily,
    member: pgUuidv7ProofMembers.fromTimestamptz,
    scenario: "undefined-and-dynamic-false-zero-preserve-millisecond-prefix",
  },
};

const file = "packages/e2e/integration/extensions-pg-uuidv7.test.ts";
export const pgUuidv7NativeProofCase = {
  id: "pg_uuidv7.native-semantics",
  file,
  title:
    "pg_uuidv7 exact1.6 typed members preserve observed millisecond truncation, unsigned wrap, NULLs and native timezone semantics",
  gate: "database",
  families: [pgUuidv7ProofFamily],
  claims: Object.values(pgUuidv7NativeProofClaims),
} satisfies ExtensionProofCase;

export const pgUuidv7StorageProofCase = {
  id: "pg_uuidv7.native-storage",
  file,
  title:
    "pg_uuidv7 native defaults, insert/RETURNING, UUID columns and four temporal column bridges compose with WHERE/order/subqueries",
  gate: "database",
  families: [pgUuidv7ProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const pgUuidv7RelationsProofCase = {
  id: "pg_uuidv7.native-relations-rpc",
  file,
  title: "pg_uuidv7 deterministic nested JSON relations and RPC retain exact decoded native result identities",
  gate: "database",
  families: [pgUuidv7ProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const pgUuidv7LiveProofCase = {
  id: "pg_uuidv7.native-live-and-rollback",
  file,
  title:
    "pg_uuidv7 zero=true permits automatic live evaluation; randomness rejects ordinary/prepared/aliases and caught decode rolls back",
  gate: "database",
  families: [pgUuidv7ProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

/** All four callbacks must finish; member witnesses alone do not establish native acceptance. */
export const pgUuidv7ProofCases = [
  pgUuidv7NativeProofCase,
  pgUuidv7StorageProofCase,
  pgUuidv7RelationsProofCase,
  pgUuidv7LiveProofCase,
] satisfies ExtensionProofCase[];
