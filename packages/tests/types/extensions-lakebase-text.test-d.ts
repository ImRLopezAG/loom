import { expectTypeOf, test } from "vite-plus/test";
import type { SQL } from "drizzle-orm";
import {
  createLakebaseText_0_1_3,
  type LakebaseTextStorage,
} from "../../../apps/loom/src/core/extensions/adapters/lakebase-text";
import type { ExtensionIndexContract } from "../../../apps/loom/src/core/extensions/fields";

const api = createLakebaseText_0_1_3({
  name: "lakebase_text",
  version: "0.1.3",
  schema: "bm25_text",
  apiSupport: { status: "verified", digest: "d565a607c3901c0b31f02d59f300ae0b3cf3b5c77bcdf7d06822489fc2d9f6fb" },
});
test("lakebase_text literal descriptor, query types, indexes and session-only settings", () => {
  expectTypeOf(api.name).toEqualTypeOf<"lakebase_text">();
  expectTypeOf(api.version).toEqualTypeOf<"0.1.3">();
  expectTypeOf(api.schema).toEqualTypeOf<"bm25_text">();
  const query: SQL<{ readonly query: string | null; readonly index: string | null }> = api.toBm25Query(
    "'postgresql':1",
    "documents_passage_bm25",
  );
  const canonical: SQL<{ readonly query: string | null; readonly index: string | null }> =
    api.sql.functions.to_bm25query("'postgresql':1", "documents_passage_bm25");
  const score: SQL<number | { readonly nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.rank(
    "'postgresql':1",
    query,
  );
  const evaluated: SQL<number | { readonly nonfinite: "NaN" | "Infinity" | "-Infinity" } | null> = api.evaluate(
    "'postgresql':1",
    query,
  );
  const support: SQL<string | null> = api.support();
  const current: ExtensionIndexContract = api.indexes.tsvector();
  const legacy: ExtensionIndexContract = api.indexes.tsvector({ format: "v0" });
  const storage: LakebaseTextStorage = { k1: 1.2, b: 0.75, default_limit: 10, prefilter: false };
  const authority: "operator" = api.tooling.reindexConcurrently.authority;
  const limit: SQL<string> = api.session.defaultLimit(10);
  void [canonical, score, evaluated, support, current, legacy, storage, authority, limit];
  // @ts-expect-error Captured to_bm25query needs both the query vector and index identity.
  api.toBm25Query("'postgresql':1");
  // @ts-expect-error No invented BM25 client scoring helper exists.
  void api.score;
  // @ts-expect-error Selected version is exactly 0.1.3.
  createLakebaseText_0_1_3({ ...api, version: "0.1.2" });
  // @ts-expect-error fillfactor is not a captured lakebase_bm25 storage parameter.
  api.storage({ fillfactor: 50 });
});
