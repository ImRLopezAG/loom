import type {
  ExtensionProofCase,
  ExtensionProofDeclaration,
} from "../../../apps/loom/src/tooling/extensions/semantic-proof";

export const lakebaseTextProofFamily = {
  extension: "lakebase_text",
  version: "0.1.3",
  postgresMajor: 18,
  provider: "neon",
  manifestDigest: "d565a607c3901c0b31f02d59f300ae0b3cf3b5c77bcdf7d06822489fc2d9f6fb",
} as const;
const base = { families: [lakebaseTextProofFamily], claims: [] };
export const lakebaseTextUnitProofCase: ExtensionProofCase = {
  ...base,
  id: "lakebase_text.unit",
  gate: "unit",
  file: "packages/tests/unit/extensions-lakebase-text.test.ts",
  title: "lakebase_text exact identity, BM25 query SQL, codecs, indexes and session settings",
};
export const lakebaseTextTypesProofCase: ExtensionProofCase = {
  ...base,
  id: "lakebase_text.types",
  gate: "types",
  file: "packages/tests/types/extensions-lakebase-text.test-d.ts",
  title: "lakebase_text literal descriptor, query types, indexes and session-only settings",
};
export const lakebaseTextDatabaseProofCase: ExtensionProofCase = {
  ...base,
  id: "lakebase_text.native",
  gate: "database",
  file: "packages/e2e/integration/extensions-lakebase-text.test.ts",
  title: "lakebase_text native 0.1.3 BM25 score, index identity and transaction-local settings",
  claims: [
    {
      family: lakebaseTextProofFamily,
      member: "operator:$extension:lakebase_text.<@>(pg_catalog.tsvector,$extension:lakebase_text.bm25query_tsvector)",
      scenario: "native-bm25-score-and-index-identity",
    },
    {
      family: lakebaseTextProofFamily,
      member:
        "routine:$extension:lakebase_text._lakebase_bm25_evaluate_tsvector(pg_catalog.tsvector,$extension:lakebase_text.bm25query_tsvector)",
      scenario: "native-bm25-score-and-index-identity",
    },
    {
      family: lakebaseTextProofFamily,
      member: "routine:$extension:lakebase_text.to_bm25query(pg_catalog.tsvector,pg_catalog.regclass)",
      scenario: "native-bm25-score-and-index-identity",
    },
    {
      family: lakebaseTextProofFamily,
      member: "routine:$extension:lakebase_text.lakebase_bm25_index_info(pg_catalog.regclass)",
      scenario: "native-bm25-score-and-index-identity",
    },
    {
      family: lakebaseTextProofFamily,
      member: "routine:$extension:lakebase_text._lakebase_bm25_support_tsvector_bm25_ops()",
      scenario: "native-bm25-score-and-index-identity",
    },
    {
      family: lakebaseTextProofFamily,
      member: "access method:lakebase_bm25",
      scenario: "native-bm25-score-and-index-identity",
    },
    {
      family: lakebaseTextProofFamily,
      member: "access method:lakebase_bm25v0",
      scenario: "native-bm25-score-and-index-identity",
    },
    {
      family: lakebaseTextProofFamily,
      member: "opclass:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25",
      scenario: "native-bm25-score-and-index-identity",
    },
    {
      family: lakebaseTextProofFamily,
      member: "opclass:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25v0",
      scenario: "native-bm25-score-and-index-identity",
    },
    {
      family: lakebaseTextProofFamily,
      member: "routine:$extension:lakebase_text.lakebase_bm25_amhandler(pg_catalog.internal)",
      scenario: "native-bm25-score-and-index-identity",
    },
    {
      family: lakebaseTextProofFamily,
      member: "routine:$extension:lakebase_text.lakebase_bm25v0_amhandler(pg_catalog.internal)",
      scenario: "native-bm25-score-and-index-identity",
    },
    {
      family: lakebaseTextProofFamily,
      member: 'composite type:"$extension:lakebase_text".bm25query_tsvector',
      scenario: "native-bm25-score-and-index-identity",
    },
    {
      family: lakebaseTextProofFamily,
      member: "type:$extension:lakebase_text.bm25query_tsvector",
      scenario: "native-bm25-score-and-index-identity",
    },
    {
      family: lakebaseTextProofFamily,
      member: "type:$extension:lakebase_text._bm25query_tsvector",
      scenario: "native-bm25-score-and-index-identity",
    },
  ],
};
export const lakebaseTextGenerationProofCase: ExtensionProofCase = {
  ...base,
  id: "lakebase_text.generation",
  gate: "generation",
  file: "packages/e2e/integration/extensions-lakebase-text-generated.test.ts",
  title: "lakebase_text public loadProject/generateProject empty/future/selected/custom host+mounted RPC/Effect",
};
export const lakebaseTextConsumerProofCase: ExtensionProofCase = {
  ...base,
  id: "lakebase_text.consumer",
  gate: "consumer",
  file: "packages/e2e/integration/packed-lakebase-text.test.ts",
  title: "no-install cold Node24 lakebase_text frozen consumer generateProject and generated RPC/Effect",
};
export const lakebaseTextProofCases = [
  lakebaseTextUnitProofCase,
  lakebaseTextTypesProofCase,
  lakebaseTextDatabaseProofCase,
  lakebaseTextGenerationProofCase,
  lakebaseTextConsumerProofCase,
];
export const lakebaseTextPublicMembers = [
  "access method:lakebase_bm25",
  "access method:lakebase_bm25v0",
  "opclass:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25",
  "opclass:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25v0",
  "operator:$extension:lakebase_text.<@>(pg_catalog.tsvector,$extension:lakebase_text.bm25query_tsvector)",
  "routine:$extension:lakebase_text._lakebase_bm25_evaluate_tsvector(pg_catalog.tsvector,$extension:lakebase_text.bm25query_tsvector)",
  "routine:$extension:lakebase_text._lakebase_bm25_support_tsvector_bm25_ops()",
  "routine:$extension:lakebase_text.lakebase_bm25_amhandler(pg_catalog.internal)",
  "routine:$extension:lakebase_text.lakebase_bm25_index_info(pg_catalog.regclass)",
  "routine:$extension:lakebase_text.lakebase_bm25v0_amhandler(pg_catalog.internal)",
  "routine:$extension:lakebase_text.to_bm25query(pg_catalog.tsvector,pg_catalog.regclass)",
  'composite type:"$extension:lakebase_text".bm25query_tsvector',
  "type:$extension:lakebase_text._bm25query_tsvector",
  "type:$extension:lakebase_text.bm25query_tsvector",
] as const;
type Relation = Extract<
  ExtensionProofDeclaration,
  { state: "candidate" }
>["members"][number]["transfers"][number]["relation"];
const tsvector = { namespace: "pg_catalog", name: "tsvector" };
const query = { namespace: "$extension:lakebase_text", name: "bm25query_tsvector" };
const support =
  "$extension:lakebase_text._lakebase_bm25_support_tsvector_bm25_ops()";
const rankOperator =
  "$extension:lakebase_text.<@>(pg_catalog.tsvector,$extension:lakebase_text.bm25query_tsvector)";
function attachment(
  family: string,
  row: Extract<Relation, { kind: "attachment" }>["row"],
): { from: string; relation: Relation } {
  return {
    from: family.replace("opfamily:", "opclass:"),
    relation: { kind: "attachment", family, row },
  };
}
export const lakebaseTextInternalRelations = {
  'function of access method:function 1 (pg_catalog.tsvector, pg_catalog.tsvector) of "$extension:lakebase_text".tsvector_bm25_ops USING lakebase_bm25':
    attachment("opfamily:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25", {
      kind: "procedure",
      left: tsvector,
      right: tsvector,
      number: 1,
      procedure: support,
    }),
  'function of access method:function 1 (pg_catalog.tsvector, pg_catalog.tsvector) of "$extension:lakebase_text".tsvector_bm25_ops USING lakebase_bm25v0':
    attachment("opfamily:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25v0", {
      kind: "procedure",
      left: tsvector,
      right: tsvector,
      number: 1,
      procedure: support,
    }),
  'operator of access method:operator 1 (pg_catalog.tsvector, "$extension:lakebase_text".bm25query_tsvector) of "$extension:lakebase_text".tsvector_bm25_ops USING lakebase_bm25':
    attachment("opfamily:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25", {
      kind: "operator",
      left: tsvector,
      right: query,
      strategy: 1,
      purpose: "o",
      operator: rankOperator,
      sortFamily: "pg_catalog.float_ops/btree",
    }),
  'operator of access method:operator 1 (pg_catalog.tsvector, "$extension:lakebase_text".bm25query_tsvector) of "$extension:lakebase_text".tsvector_bm25_ops USING lakebase_bm25v0':
    attachment("opfamily:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25v0", {
      kind: "operator",
      left: tsvector,
      right: query,
      strategy: 1,
      purpose: "o",
      operator: rankOperator,
      sortFamily: "pg_catalog.float_ops/btree",
    }),
  "opfamily:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25": {
    from: "opclass:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25",
    relation: { kind: "opclass-family" },
  },
  "opfamily:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25v0": {
    from: "opclass:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25v0",
    relation: { kind: "opclass-family" },
  },
} satisfies Record<string, { from: string; relation: Relation }>;
