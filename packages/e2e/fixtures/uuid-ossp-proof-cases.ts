import type {
  ExtensionProofCase,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const uuidOsspProofFamily = {
  extension: "uuid-ossp",
  version: "1.1",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "6961935a6844d9e8007d1d391a2deb0dc766e070e15ad0d4687134b46c4b7796",
} satisfies ExtensionProofFamily;
export const uuidOsspProofSchema = 'custom"uuid';
export const uuidOsspProofMembers = {
  nil: "routine:$extension:uuid-ossp.uuid_nil()",
  dns: "routine:$extension:uuid-ossp.uuid_ns_dns()",
  url: "routine:$extension:uuid-ossp.uuid_ns_url()",
  oid: "routine:$extension:uuid-ossp.uuid_ns_oid()",
  x500: "routine:$extension:uuid-ossp.uuid_ns_x500()",
  v1: "routine:$extension:uuid-ossp.uuid_generate_v1()",
  v1mc: "routine:$extension:uuid-ossp.uuid_generate_v1mc()",
  v3: "routine:$extension:uuid-ossp.uuid_generate_v3(pg_catalog.uuid,pg_catalog.text)",
  v4: "routine:$extension:uuid-ossp.uuid_generate_v4()",
  v5: "routine:$extension:uuid-ossp.uuid_generate_v5(pg_catalog.uuid,pg_catalog.text)",
} as const;
export const uuidOsspNativeProofClaims = Object.fromEntries(
  Object.entries(uuidOsspProofMembers).map(([key, member]) => [
    key,
    { family: uuidOsspProofFamily, member, scenario: `native-typed-${key}-storage-and-fixed-identity` },
  ]),
);
const nativeFile = "packages/e2e/integration/extensions-uuid-ossp.test.ts";
export const uuidOsspStorageProofCase = {
  id: "uuid-ossp.native-storage",
  file: nativeFile,
  title: "UUID-OSSP all ten typed routines compose with native UUID storage, defaults, transactions and RPC",
  gate: "database",
  families: [uuidOsspProofFamily],
  claims: Object.values(uuidOsspNativeProofClaims),
} satisfies ExtensionProofCase;
export const uuidOsspDatabaseProofCases = [
  {
    id: "uuid-ossp.native-algorithms",
    file: nativeFile,
    title: "PostgreSQL 18 UUID-OSSP 1.1 native constants, algorithms, strict NULLs and UUID canonicalization",
    gate: "database",
    families: [uuidOsspProofFamily],
    claims: [],
  },
  uuidOsspStorageProofCase,
  {
    id: "uuid-ossp.native-live-rejection",
    file: nativeFile,
    title: "UUID-OSSP random and time generators reject automatic live queries, including prepared queries",
    gate: "database",
    families: [uuidOsspProofFamily],
    claims: [],
  },
  {
    id: "uuid-ossp.native-name-identity",
    file: nativeFile,
    title: "UUID-OSSP exact name transport, every namespace, deterministic live queries and decode rollback",
    gate: "database",
    families: [uuidOsspProofFamily],
    claims: [],
  },
] satisfies ExtensionProofCase[];
export const uuidOsspUnitProofCase = {
  id: "uuid-ossp.unit-contracts",
  file: "packages/tests/unit/extensions-uuid-ossp.test.ts",
  title: "UUID-OSSP exact pin, required API and generated dashed-key contracts",
  gate: "unit",
  families: [uuidOsspProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const uuidOsspTypesProofCase = {
  id: "uuid-ossp.types-contracts",
  file: "packages/tests/types/extensions-uuid-ossp.test-d.ts",
  title: "UUID-OSSP public and generated exact version and nullable result declarations",
  gate: "types",
  families: [uuidOsspProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const uuidOsspGenerationProofCase = {
  id: "uuid-ossp.generation-contracts",
  file: "packages/e2e/integration/extension-adapter-codegen.test.ts",
  title: "UUID-OSSP dashed selection works virtually, on disk, and through RPC and Effect",
  gate: "generation",
  families: [uuidOsspProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const uuidOsspConsumerProofCase = {
  id: "uuid-ossp.consumer-contracts",
  file: "packages/e2e/integration/packed-uuid-ossp-identity.test.ts",
  title: "UUID-OSSP isolated packed identity, declarations, native runtime and selected bundles",
  gate: "consumer",
  families: [uuidOsspProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const uuidOsspProofCases = [
  ...uuidOsspDatabaseProofCases,
  uuidOsspUnitProofCase,
  uuidOsspTypesProofCase,
  uuidOsspGenerationProofCase,
  uuidOsspConsumerProofCase,
] satisfies ExtensionProofCase[];
