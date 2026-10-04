import { expect } from "vite-plus/test";
import { sql, type SQL } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createLakebaseText_0_1_3 } from "../../../apps/loom/src/core/extensions/adapters/lakebase-text";
import {
  bm25QueryTsvectorCodec,
  lakebaseTextFloat8Codec,
  tsvectorCodec,
} from "../../../apps/loom/src/core/extensions/adapters/lakebase-text-codecs";
import {
  checkCompiledExtensionQuery,
  extensionExpressionContract,
  extensionSqlDialect,
} from "../../../apps/loom/src/core/extensions/sql";
import { evaluateSnapshot } from "../../../apps/loom/src/core/server/rpc/snapshot";
import { validateExtensionManifest } from "../../../apps/loom/src/core/extensions/registry";
import { extensionManifestValidator } from "../../../apps/loom/src/core/extensions/contracts";
import * as v from "valibot";
import { lakebaseTextAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/lakebase-text";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/lakebase_text.json";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { lakebaseTextUnitProofCase } from "../../e2e/fixtures/lakebase-text-proof-cases";
import { registerLakebaseTextSemanticProof } from "../../e2e/fixtures/lakebase-text-semantic-proof";
import { validateExtensionSemanticProof } from "../../../apps/loom/src/tooling/extensions/semantic-proof";
import baselineEvidence from "../../../docs/architecture/evidence/neon-extension-capability-map-2026-10-02.json";

extensionProofUnitTest(lakebaseTextUnitProofCase, async () => {
  const descriptor = {
    name: "lakebase_text",
    version: "0.1.3",
    schema: 'bm25"text',
    apiSupport: { status: "verified", digest: manifest.digest },
  } as const;
  const api = createLakebaseText_0_1_3(descriptor);
  expect(validateExtensionManifest(v.parse(extensionManifestValidator, manifest)).digest).toBe(
    descriptor.apiSupport.digest,
  );
  expect(manifest.digest).toBe("d565a607c3901c0b31f02d59f300ae0b3cf3b5c77bcdf7d06822489fc2d9f6fb");
  expect(manifest.contract.members.map(({ id }) => id).sort()).toEqual(
    lakebaseTextAnnotations.map(({ id }) => id).sort(),
  );
  expect(manifest.contract.members).toHaveLength(20);
  expect(Object.isFrozen(api)).toBe(true);
  expect(Object.keys(api.sql.functions).sort()).toEqual([
    "_lakebase_bm25_evaluate_tsvector",
    "_lakebase_bm25_support_tsvector_bm25_ops",
    "lakebase_bm25_index_info",
    "to_bm25query",
  ]);
  expect(Object.keys(api.sql.operators)).toEqual(["<@>"]);
  expect(api.toBm25Query).toBe(api.sql.functions.to_bm25query);
  expect(api.evaluate).toBe(api.sql.functions._lakebase_bm25_evaluate_tsvector);
  expect(api.support).toBe(api.sql.functions._lakebase_bm25_support_tsvector_bm25_ops);
  expect(api.rank).toBe(api.sql.operators["<@>"]);
  expect(api.indexInfo).toBe(api.sql.functions.lakebase_bm25_index_info);
  const dialect = extensionSqlDialect(nodePgCodecs);
  const queryVector = "'postgresql':1";
  const constructed = api.toBm25Query(queryVector, "documents_passage_bm25");
  const ranked = api.rank(queryVector, constructed);
  const constructedQuery = dialect.sqlToQuery(sql`select ${constructed} as query`);
  expect(constructedQuery.sql).toBe(
    'select "bm25""text"."to_bm25query"($1::"pg_catalog"."tsvector", $2::"pg_catalog"."regclass") as query',
  );
  expect(constructedQuery.params).toEqual([queryVector, "documents_passage_bm25"]);
  const rankedQuery = dialect.sqlToQuery(sql`select ${ranked} as score`);
  expect(rankedQuery.sql).toBe(
    'select ($1::"pg_catalog"."tsvector" operator("bm25""text".<@>) "bm25""text"."to_bm25query"($2::"pg_catalog"."tsvector", $3::"pg_catalog"."regclass")) as score',
  );
  expect(extensionExpressionContract(constructed)).toEqual({
    member: "routine:$extension:lakebase_text.to_bm25query(pg_catalog.tsvector,pg_catalog.regclass)",
    codec: bm25QueryTsvectorCodec.id,
    dependencies: [],
    observability: "tables",
  });
  expect(extensionExpressionContract(ranked)).toMatchObject({
    member: "operator:$extension:lakebase_text.<@>(pg_catalog.tsvector,$extension:lakebase_text.bm25query_tsvector)",
    observability: "tables",
  });
  expect(dialect.sqlToQuery(sql`select ${api.support()} as support`).sql).toBe(
    'select "bm25""text"."_lakebase_bm25_support_tsvector_bm25_ops"() as support',
  );
  await expect(
    evaluateSnapshot(async () => {
      checkCompiledExtensionQuery(dialect.sqlToQuery(sql`select ${api.session.defaultLimit(10)}`));
      return [];
    }),
  ).rejects.toThrow("Automatic live query cannot observe");
  expect(dialect.sqlToQuery(sql`${api.session.defaultLimit(10)}`).sql).toBe(
    "set local lakebase_bm25.default_limit to 10",
  );
  expect(dialect.sqlToQuery(sql`${api.session.prefilter(true)}`).sql).toBe("set local lakebase_bm25.prefilter to on");
  expect(dialect.sqlToQuery(sql`${api.session.enableScan(false)}`).sql).toBe(
    "set local lakebase_bm25.enable_scan to off",
  );
  expect(api.indexes.tsvector().member).toBe("opclass:$extension:lakebase_text.tsvector_bm25_ops/lakebase_bm25");
  expect(api.indexes.tsvector({ format: "v0" }).method).toBe("lakebase_bm25v0");
  expect(api.storage({ k1: 1.5, b: 0.5, default_limit: 5, prefilter: true })).toEqual({
    k1: 1.5,
    b: 0.5,
    default_limit: 5,
    prefilter: true,
  });
  expect(api.accessMethods.lakebase_bm25.handler).toBe(
    "routine:$extension:lakebase_text.lakebase_bm25_amhandler(pg_catalog.internal)",
  );
  expect(api.tooling.reindexConcurrently.authority).toBe("operator");
  expect(api.tooling.indexFormat).toEqual({
    current: "lakebase_bm25",
    legacy: "lakebase_bm25v0",
    upgrade: "REINDEX INDEX CONCURRENTLY",
    transactional: false,
  });
  expect(bm25QueryTsvectorCodec.decode("(,documents_passage_bm25)")).toEqual({
    query: null,
    index: "documents_passage_bm25",
  });
  const queryValue = { query: queryVector, index: "documents_passage_bm25" };
  expect(bm25QueryTsvectorCodec.decode(bm25QueryTsvectorCodec.encode(queryValue))).toEqual(queryValue);
  expect(tsvectorCodec.decode(queryVector)).toBe(queryVector);
  expect(lakebaseTextFloat8Codec.decode("-1.25")).toBe(-1.25);
  for (const invalid of [
    { ...descriptor, name: "lakebase_tokenizer" },
    { ...descriptor, version: "0.1.2" },
    { ...descriptor, apiSupport: { status: "unverified" } },
    { ...descriptor, apiSupport: { status: "verified", digest: "wrong" } },
  ]) {
    // SAFETY: malformed JavaScript inputs deliberately bypass static descriptor admission.
    expect(() => createLakebaseText_0_1_3(invalid as never)).toThrow("requires its exact verified contract");
  }
  for (const options of [{ k1: 1.1 }, { k1: 2.1 }, { b: -0.1 }, { b: 1.1 }, { default_limit: 0 }, { default_limit: 65536 }])
    // SAFETY: storage bounds come from the captured Neon index parameter domain.
    expect(() => api.storage(options as never)).toThrow();
  for (const limit of [0, 65536, 1.5])
    // SAFETY: GUC domain is the captured integer range, not a client ranking algorithm.
    expect(() => api.session.defaultLimit(limit as never)).toThrow();
  // SAFETY: captured to_bm25query is not STRICT; extra arguments are rejected.
  expect(() =>
    (api.toBm25Query as unknown as (a: string, b: string, c: string) => SQL<never>)("a", "b", "c"),
  ).toThrow("argument count");
  const baseline = baselineEvidence.entries.map((entry) => ({
    name: entry.name,
    version: entry.postgres18ListedVersion,
    disposition: v.parse(
      v.picklist(["eligible", "unavailable-pg18", "existing-only", "deprecated", "builtin", "decoder-plugin"]),
      entry.providerStatus === "listed-pg18" ? "eligible" : entry.providerStatus,
    ),
  }));
  const result = validateExtensionSemanticProof(
    registerLakebaseTextSemanticProof({
      baseline,
      manifests: [],
      cases: [],
      receipts: [],
      currentSources: [],
      artifact: null,
      declarations: baseline.map((entry) =>
        entry.disposition === "eligible"
          ? { extension: entry.name, state: "pending" as const, prerequisite: "Not implemented or accepted" }
          : { extension: entry.name, state: "excluded" as const, reason: entry.disposition },
      ),
    }),
  );
  const family = result.families.find((entry) => entry.extension === "lakebase_text")!;
  expect(family.state).toBe("pending");
  expect(family.blockers.length).toBeGreaterThan(0);
});
