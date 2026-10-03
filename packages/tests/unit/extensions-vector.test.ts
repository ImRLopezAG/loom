import { expect, test } from "vite-plus/test";
import { nodePgCodecs } from "drizzle-orm/node-postgres/codecs";
import { sql } from "drizzle-orm";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/vector.json";
import { createVector_0_8_6 } from "../../../apps/loom/src/core/extensions/adapters/vector";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";

const descriptor = {
  name: "vector",
  version: "0.8.6",
  schema: 'Vector_"Api_日本',
  apiSupport: { status: "verified", digest: capture.digest },
} as const;

test("vector.apiExactCapturedContract", () => {
  const api = createVector_0_8_6(descriptor);
  expect(api.version).toBe("0.8.6");
  expect(api.schema).toBe(descriptor.schema);
  expect(Object.isFrozen(api)).toBe(true);
  for (const apiSupport of [{ status: "unverified" as const }, { status: "verified" as const, digest: "wrong" }])
    expect(() => createVector_0_8_6({ ...descriptor, apiSupport })).toThrow("exact verified contract");
});

test("vector.apiQualifiedParametersAndExactMembers", () => {
  const api = createVector_0_8_6(descriptor);
  const expression = api.vector.l2Distance([1, 2], [3, 4]);
  const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(expression);
  expect(compiled.sql).toContain('"Vector_""Api_日本"."l2_distance"');
  expect(compiled.params).toEqual(["[1,2]", "[3,4]"]);
  expect(extensionExpressionContract(expression)).toMatchObject({
    member: "routine:$extension:vector.l2_distance($extension:vector.vector,$extension:vector.vector)",
    observability: "tables",
    dependencies: [],
  });
});

const scalarNames = new Set([
  "l2_distance",
  "l1_distance",
  "cosine_distance",
  "inner_product",
  "vector_norm",
  "l2_norm",
  "l2_normalize",
  "vector_dims",
  "subvector",
  ...["vector", "halfvec", "sparsevec"].flatMap((kind) =>
    ["l2_squared_distance", "negative_inner_product", "cmp", "eq", "ne", "lt", "le", "gt", "ge", "send"].map(
      (name) => `${kind}_${name}`,
    ),
  ),
  ...["vector", "halfvec"].flatMap((kind) =>
    ["spherical_distance", "add", "sub", "mul", "concat"].map((name) => `${kind}_${name}`),
  ),
]);

test("vector.apiExactly100ScalarMembersRemainSeparateFromFamilyAcceptance", () => {
  const api = createVector_0_8_6(descriptor);
  const selected = capture.contract.members.filter(
    (member) =>
      (member.kind === "routine" && scalarNames.has(member.name)) ||
      (member.kind === "operator" && member.left?.namespace === "$extension:vector"),
  );
  expect(selected).toHaveLength(100);
  expect(selected.filter((member) => member.kind === "routine")).toHaveLength(62);
  expect(Object.keys(api.sql.overloads).sort()).toEqual(selected.map((member) => member.id).sort());
  expect(capture.contract.members).toHaveLength(327);
  expect(api).not.toHaveProperty("fields");
  expect(api).not.toHaveProperty("indexes");
  expect(api.vector).not.toHaveProperty("binaryQuantize");
  expect(api.sparsevec).not.toHaveProperty("add");
  expect(api.sparsevec).not.toHaveProperty("subvector");
});

test("vector.apiEveryOperatorIsQualifiedAndNullOperandsRemainBound", () => {
  const api = createVector_0_8_6(descriptor);
  const dense = [1, 2];
  const sparse = { dimensions: 2, entries: [{ index: 1, value: 1 }] };
  for (const group of [api.vector, api.halfvec]) {
    for (const [name, call] of Object.entries(group.sql.operators)) {
      const expression = call(null, dense);
      const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(expression);
      expect(query.sql).toContain(`operator("Vector_""Api_日本".${name})`);
      expect(query.params).toEqual([null, "[1,2]"]);
      expect(Object.hasOwn(api.sql.overloads, extensionExpressionContract(expression)!.member)).toBe(true);
    }
  }
  for (const call of Object.values(api.sparsevec.sql.operators)) {
    const expression = call(sparse, null);
    const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(expression);
    expect(query.params).toEqual(["{1:1}/2", null]);
    expect(extensionExpressionContract(expression)?.observability).toBe("tables");
  }
});

test("vector.apiSubvectorUsesInt4AndNativeOutputDimensions", () => {
  const api = createVector_0_8_6(descriptor);
  const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(api.vector.subvector([1, 2, 3], -1, 3));
  expect(query.params).toEqual(["[1,2,3]", -1, 3]);
  expect(query.sql).toContain('::"pg_catalog"."int4"');
  expect(() => api.vector.subvector([1], 1.5, 1)).toThrow();
  expect(() => api.halfvec.subvector([1], 1, 2147483648)).toThrow();
  expect(extensionSqlDialect(nodePgCodecs).sqlToQuery(api.vector.concat([1], [2, 3])).params).toEqual(["[1]", "[2,3]"]);
  // @ts-expect-error Runtime invalid scalar inputs must be rejected before binding.
  expect(() => api.vector.l2Distance("[1]", [1])).toThrow();
  // @ts-expect-error A sparse vector is not a dense vector input.
  expect(() => api.halfvec.normalize({ dimensions: 1, entries: [] })).toThrow();
});

test("vector.apiSqlOperandsResolveCapturedFamilyAndPreserveDirectAliases", () => {
  const api = createVector_0_8_6(descriptor);
  const vector = api.vector.normalize([1, 2]).as("normalized");
  const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(api.halfvec.add(vector, api.vector.normalize([2, 1])));
  expect(query.sql).toContain('"Vector_""Api_日本"."halfvec_add"');
  expect(query.sql.match(/\)::"Vector_""Api_日本"\."halfvec"/g)).toHaveLength(2);
  expect(query.sql).not.toContain('"normalized"');
  expect(query.params).toEqual(["[1,2]", "[2,1]"]);
  const slice = extensionSqlDialect(nodePgCodecs).sqlToQuery(
    api.vector.subvector(vector, sql<number>`1`, sql<number>`2`),
  );
  expect(slice.sql.match(/\)::"pg_catalog"\."int4"/g)).toHaveLength(2);
});
