import { expect, test } from "bun:test";
import {
  createLakebaseVector_1_1_1,
  rabitqNativeText,
} from "../../../apps/loom/src/core/extensions/adapters/lakebase-vector";
import { extensionSqlDialect, extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/lakebase_vector.json";

const api = createLakebaseVector_1_1_1(
  {
    name: "lakebase_vector",
    version: "1.1.1",
    schema: "extensions",
    apiSupport: {
      status: "verified",
      digest: "bfa194865eaeda1069f2743247af32e0609848bdee87f1565e17cefc231fec20",
    },
  },
  {
    name: "vector",
    version: "0.8.6",
    schema: "pgvector_companion",
    apiSupport: { status: "verified", digest: "4e6679e9277c11a3f26d1a920de5f4c1b5401f418c647402a9e611df4a6fb1e4" },
  },
);

test("lakebase_vector source-import composition covers callable overloads and ANN indexes", () => {
  expect(manifest.contract.version).toBe("1.1.1");
  expect(Object.keys(api.sql.overloads)).toHaveLength(64);
  const token = rabitqNativeText("[native]");
  const dialect = extensionSqlDialect(nodePgCodecs);
  const l2 = dialect.sqlToQuery(
    api.sql.overloads[
      "operator:$extension:lakebase_vector.<->($extension:lakebase_vector.rabitq4,$extension:lakebase_vector.rabitq4)"
    ](token, token),
  );
  expect(l2.sql).toContain("operator(");
  expect(extensionExpressionContract(api.indexInfo("items_embedding_idx"))?.member).toBe(
    "routine:$extension:lakebase_vector.lakebase_ann_index_info(pg_catalog.regclass)",
  );
  expect(extensionExpressionContract(api.tooling.prewarm("items_embedding_idx", "routing"))?.observability).toBe(
    "session",
  );
  expect(api.field.rabitq4().metadata.extension?.type).toBe("rabitq4");
  expect(api.arrayField.sphereVector().metadata.extension?.array).toBe(true);
  expect(api.indexes.ann.halfvec.cosine().method).toBe("lakebase_ann");
  expect(api.indexes.annv0.rabitq4.ip().method).toBe("lakebase_annv0");
});

test("lakebase_vector source-import is not a generation or packed-tarball receipt", () => {
  expect(api.name).toBe("lakebase_vector");
  expect(api.apiSupport.digest).toBe("bfa194865eaeda1069f2743247af32e0609848bdee87f1565e17cefc231fec20");
  expect(manifest.digest).toBe(api.apiSupport.digest);
});

test("lakebase_vector transaction-local settings use a parameterizable native function", () => {
  const dialect = extensionSqlDialect(nodePgCodecs);
  for (const [expression, name, value] of [
    [api.settings.probes("10"), "lakebase_ann.probes", "10"],
    [api.settings.epsilon("auto"), "lakebase_ann.epsilon", "auto"],
    [api.settings.prefilter("on"), "lakebase_ann.prefilter", "on"],
  ] as const) {
    const query = dialect.sqlToQuery(expression);
    expect(query.sql).toContain('"pg_catalog"."set_config"');
    expect(query.params).toEqual([name, value]);
    expect(query.sql).toContain("true");
  }
});
