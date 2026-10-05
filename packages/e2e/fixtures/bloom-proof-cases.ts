import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
  ExtensionProofFamily,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const bloomProofFamily = {
  extension: "bloom",
  version: "1.0",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "e35e04e263d75f19673d2b1282a75b7975b74f201c7cd5dc8040188f54b06cc3",
} as const satisfies ExtensionProofFamily;
export const bloomProofSchema = 'Bloom"花';
const file = "packages/e2e/integration/extensions-bloom.test.ts";
const scenario = "migrated-quoted-class-snapshot-and-bloom-scan-equals-sequential-oracle";
export const bloomNativeProofCase = {
  id: "bloom.native-indexes",
  file,
  title: "bloom.migratedInt4TextIndexesStorageSnapshotAndScanOracle",
  gate: "database",
  families: [bloomProofFamily],
  claims: [
    "access method:bloom",
    "opclass:$extension:bloom.int4_ops/bloom",
    "opclass:$extension:bloom.text_ops/bloom",
    "routine:$extension:bloom.blhandler(pg_catalog.internal)",
  ].map((member) => ({ family: bloomProofFamily, member, scenario })),
} satisfies ExtensionProofCase;
export const bloomDatabaseProofCases = [bloomNativeProofCase];
export const bloomUnitProofCase = {
  id: "bloom.unit-contracts",
  file: "packages/tests/unit/extensions-bloom.test.ts",
  title: "bloom exact pin, index classes, storage parameters and member dispositions",
  gate: "unit",
  families: [bloomProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const bloomTypesProofCase = {
  id: "bloom.types-contracts",
  file: "packages/tests/types/extensions-bloom.test-d.ts",
  title: "bloom public and generated literal pins, index contracts and storage parameters",
  gate: "types",
  families: [bloomProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const bloomGenerationProofCase = {
  id: "bloom.generation-contracts",
  file: "packages/e2e/integration/extension-adapter-codegen.test.ts",
  title: "bloom first load binds exact index contracts through generated extensions",
  gate: "generation",
  families: [bloomProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const bloomConsumerProofCase = {
  id: "bloom.consumer-contracts",
  file: "packages/e2e/integration/packed-bloom.test.ts",
  title: "bloom isolated packed index contracts, native migration and selected bundles",
  gate: "consumer",
  families: [bloomProofFamily],
  claims: [],
} satisfies ExtensionProofCase;
export const bloomProofCases = [
  ...bloomDatabaseProofCases,
  bloomUnitProofCase,
  bloomTypesProofCase,
  bloomGenerationProofCase,
  bloomConsumerProofCase,
];

type Relation = Extract<
  ExtensionProofDeclaration,
  { state: "candidate" }
>["members"][number]["transfers"][number]["relation"];
const int4 = { namespace: "pg_catalog", name: "int4" };
const text = { namespace: "pg_catalog", name: "text" };
// Exact rows from the pinned manifest; the verifier re-matches each against the captured family.
export const bloomInternalRelations = {
  'function of access method:function 1 (integer, integer) of "$extension:bloom".int4_ops USING bloom': {
    from: "opclass:$extension:bloom.int4_ops/bloom",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:bloom.int4_ops/bloom",
      row: { kind: "procedure", left: int4, right: int4, number: 1, procedure: "pg_catalog.hashint4(pg_catalog.int4)" },
    },
  },
  'function of access method:function 1 (pg_catalog.text, pg_catalog.text) of "$extension:bloom".text_ops USING bloom':
    {
      from: "opclass:$extension:bloom.text_ops/bloom",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:bloom.text_ops/bloom",
        row: {
          kind: "procedure",
          left: text,
          right: text,
          number: 1,
          procedure: "pg_catalog.hashtext(pg_catalog.text)",
        },
      },
    },
  'operator of access method:operator 1 (integer, integer) of "$extension:bloom".int4_ops USING bloom': {
    from: "opclass:$extension:bloom.int4_ops/bloom",
    relation: {
      kind: "attachment",
      family: "opfamily:$extension:bloom.int4_ops/bloom",
      row: {
        kind: "operator",
        left: int4,
        right: int4,
        strategy: 1,
        purpose: "s",
        operator: "pg_catalog.=(pg_catalog.int4,pg_catalog.int4)",
        sortFamily: null,
      },
    },
  },
  'operator of access method:operator 1 (pg_catalog.text, pg_catalog.text) of "$extension:bloom".text_ops USING bloom':
    {
      from: "opclass:$extension:bloom.text_ops/bloom",
      relation: {
        kind: "attachment",
        family: "opfamily:$extension:bloom.text_ops/bloom",
        row: {
          kind: "operator",
          left: text,
          right: text,
          strategy: 1,
          purpose: "s",
          operator: "pg_catalog.=(pg_catalog.text,pg_catalog.text)",
          sortFamily: null,
        },
      },
    },
  "opfamily:$extension:bloom.int4_ops/bloom": {
    from: "opclass:$extension:bloom.int4_ops/bloom",
    relation: { kind: "opclass-family" },
  },
  "opfamily:$extension:bloom.text_ops/bloom": {
    from: "opclass:$extension:bloom.text_ops/bloom",
    relation: { kind: "opclass-family" },
  },
} satisfies Record<string, { from: string; relation: Relation }>;
