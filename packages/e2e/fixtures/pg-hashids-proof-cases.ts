import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const pgHashidsProofFamily = {
  extension: "pg_hashids",
  version: "1.2.1",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "56a138e83f06ff23344a428d6486237eb9c875db35df970ceb4bcb60240a4041",
} satisfies ExtensionProofFamily;

const tails = [
  "",
  ",pg_catalog.text",
  ",pg_catalog.text,pg_catalog.int4",
  ",pg_catalog.text,pg_catalog.int4,pg_catalog.text",
];
const routine = (name: string, first: string, arity: number) =>
  `routine:$extension:pg_hashids.${name}(pg_catalog.${first}${tails[arity]})`;

/** Twenty captured members, ordered by helper and arity. */
export const pgHashidsProofMembers = [
  ...[0, 1, 2, 3].map((arity) => routine("id_encode", "int8", arity)),
  ...[0, 1, 2, 3].map((arity) => routine("id_encode", "_int8", arity)),
  ...[0, 1, 2, 3].map((arity) => routine("id_decode", "text", arity)),
  ...[0, 1, 2, 3].map((arity) => routine("id_decode_once", "text", arity)),
  ...[0, 1, 2].map((arity) => routine("hash_encode", "int8", arity)),
  "routine:$extension:pg_hashids.hash_decode(pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
] as const;

/** One oracle scenario per member: typed result equals independent raw SQL and pinned hashids.c vectors. */
export const pgHashidsNativeProofClaims = pgHashidsProofMembers.map((member) => ({
  family: pgHashidsProofFamily,
  member,
  scenario: "typed-equals-raw-sql-and-pinned-hashids-c-vectors",
}));

const file = "packages/e2e/integration/extensions-pg-hashids.test.ts";
export const pgHashidsNativeProofCase = {
  id: "pg_hashids.native-oracle",
  file,
  title:
    "pg_hashids exact 1.2.1 twenty routines match raw SQL and pinned hashids.c vectors with int8 extremes, array bounds and int4 truncation",
  gate: "database",
  families: [pgHashidsProofFamily],
  claims: pgHashidsNativeProofClaims,
} satisfies ExtensionProofCase;
export const pgHashidsStorageProofCase = {
  id: "pg_hashids.native-storage",
  file,
  title:
    "pg_hashids encodes non-null int8 columns in WHERE/order/subqueries and decodes literal hashes back to stored ids",
  gate: "database",
  families: [pgHashidsProofFamily],
  claims: [],
} satisfies ExtensionProofCase;

export const pgHashidsProofCases = [pgHashidsNativeProofCase, pgHashidsStorageProofCase] satisfies ExtensionProofCase[];
export const pgHashidsProofSchema = 'custom"hash';
export const pgHashidsUnitProofCase = {
  id: "pg_hashids.unit-contracts",
  file: "packages/tests/unit/extensions-pg-hashids.test.ts",
  title: "pg_hashids exact pin, twenty members, int8 text precision, estimate-overflow minLength and ASAN admission limits",
  gate: "unit",
  families: [pgHashidsProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const pgHashidsTypesProofCase = {
  id: "pg_hashids.types-contracts",
  file: "packages/tests/types/extensions-pg-hashids.test-d.ts",
  title: "pg_hashids SQL<bigint> caller claims, literal-only settings and fixed result identities",
  gate: "types",
  families: [pgHashidsProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const pgHashidsGenerationProofCase = {
  id: "pg_hashids.generation-contracts",
  file: "packages/e2e/scripts/run-pg-hashids-generation-proof.ts",
  title: "pg_hashids isolated generation emits the exact 1.2.1 callable family after parent wires the adapter",
  gate: "generation",
  families: [pgHashidsProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const pgHashidsConsumerProofCase = {
  id: "pg_hashids.consumer-contracts",
  file: "packages/e2e/scripts/run-pg-hashids-packed-proof.ts",
  title: "pg_hashids isolated packed consumer imports the published 1.2.1 adapter after parent wires exports",
  gate: "consumer",
  families: [pgHashidsProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const pgHashidsAllGateProofCases = [
  ...pgHashidsProofCases,
  pgHashidsUnitProofCase,
  pgHashidsTypesProofCase,
  pgHashidsGenerationProofCase,
  pgHashidsConsumerProofCase,
] satisfies ExtensionProofCase[];
