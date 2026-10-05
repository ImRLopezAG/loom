import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres/codecs";
import { createIntagg_1_1, int4NativeArray } from "../../../apps/loom/src/core/extensions/adapters/intagg";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import {
  intaggAnnotationContract,
  intaggAnnotations,
} from "../../../apps/loom/src/tooling/extensions/annotations/intagg";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/intagg.json";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { wave10CallbackUnitCases } from "../../e2e/fixtures/wave10-callback-unit-types-cases";

const digest = "7e9c80504c50e5a1910b61667a1774d8c1976c676c087c23fd744168986311f1";
const descriptor = {
  name: "intagg",
  version: "1.1",
  schema: 'int"agg',
  apiSupport: { status: "verified", digest },
} as const;

const query = (expression: Parameters<ReturnType<typeof extensionSqlDialect>["sqlToQuery"]>[0]) =>
  extensionSqlDialect(nodePgCodecs).sqlToQuery(expression);

extensionProofUnitTest(
  wave10CallbackUnitCases.find((proof) => proof.families[0]!.extension === "intagg")!,
  () => {
    expect(capture.digest).toBe(digest);
    expect(intaggAnnotationContract.digest).toBe(digest);
    expect(intaggAnnotationContract.providerAcceptance).toBe("pending");
    expect(() =>
      createIntagg_1_1({ ...descriptor, apiSupport: { status: "verified", digest: "0".repeat(64) } }),
    ).toThrow("intagg 1.1 requires its exact verified contract");
    expect(() => createIntagg_1_1({ ...descriptor, apiSupport: { status: "unverified" } })).toThrow();
  },
);

test("intagg.qualifiedAggregateAndEnumPreserveNativeArrays", () => {
  const api = createIntagg_1_1(descriptor);
  const compiled = query(api.intArrayAggregate(7));
  expect(compiled.sql).toContain('"int""agg"."int_array_aggregate"');
  expect(compiled.sql).toContain('::"pg_catalog"."int4"');
  expect(compiled.sql).not.toContain("7)");
  expect(compiled.params).toEqual([7]);
  expect(extensionExpressionContract(api.intArrayAggregate(7))?.member).toBe(
    "routine:$extension:intagg.int_array_aggregate(pg_catalog.int4)",
  );
  const array = int4NativeArray([1, null, -2147483648]);
  const enumerated = query(api.intArrayEnum(array));
  expect(enumerated.sql).toContain('"int""agg"."int_array_enum"');
  expect(enumerated.sql).toContain('::"pg_catalog"."int4"[]');
  expect(enumerated.params).toEqual([api.codec.encode(array)]);
  expect(extensionExpressionContract(api.intArrayEnum(array))?.observability).toBe("tables");
});

test("intagg.aggregateEmptyFilterWindowAndDistinct", () => {
  const api = createIntagg_1_1(descriptor);
  const aggregate = api.sql.functions.int_array_aggregate;
  expect(query(aggregate(null)).params).toEqual([null]);
  expect(query(aggregate.distinct(2)).sql).toContain("distinct");
  expect(query(aggregate.filter(sql<boolean>`true`, 2)).sql).toContain("filter (where true)");
  expect(query(aggregate.over({ partitionBy: [sql`category`] }, 2)).sql).toContain("over (partition by category)");
  expect(query(aggregate.over({ orderBy: [sql`n`] }, 3)).sql).toContain("over (order by n)");
  expect(() =>
    // @ts-expect-error Wrong runtime input must fail before reaching PostgreSQL.
    aggregate(true),
  ).toThrow();
  expect(() =>
    // @ts-expect-error Arrays are not int4 inputs.
    aggregate([1, 2]),
  ).toThrow();
});

test("intagg.nativeArrayCodecPreservesNullsAndBounds", () => {
  const api = createIntagg_1_1(descriptor);
  const value = {
    dimensions: [{ lowerBound: -2, length: 3 }],
    values: [1, null, 2147483647],
  };
  expect(api.codec.decode(api.codec.encode(value))).toEqual(value);
  expect(api.codec.decode("{}")).toEqual({ dimensions: [], values: [] });
  expect(int4NativeArray([])).toEqual({ dimensions: [], values: [] });
  expect(() => api.codec.encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: [1.5] })).toThrow();
  expect(() =>
    // @ts-expect-error Native enum inputs are int4 arrays, not text.
    api.intArrayEnum({ dimensions: [{ lowerBound: 1, length: 1 }], values: ["1"] }),
  ).toThrow();
});

test("intagg.allFourMemberDispositions", () => {
  const api = createIntagg_1_1(descriptor);
  const ids = intaggAnnotations.map((entry) => entry.id).sort();
  expect(ids).toEqual(capture.contract.members.map((member) => member.id).sort());
  expect(new Set(ids).size).toBe(4);
  expect(Object.keys(api.sql.functions)).toEqual(["int_array_aggregate", "int_array_enum"]);
  expect(Object.keys(api.sql.overloads).sort()).toEqual([
    "routine:$extension:intagg.int_array_aggregate(pg_catalog.int4)",
    "routine:$extension:intagg.int_array_enum(pg_catalog._int4)",
  ]);
  expect(api.sql.functions).not.toHaveProperty("int_agg_state");
  expect(api.sql.functions).not.toHaveProperty("int_agg_final_array");
  expect(api).not.toHaveProperty("intAggState");
  for (const member of intaggAnnotations) {
    expect(member.reason.length).toBeGreaterThan(20);
    expect(member.semantics.providerAcceptance).toBe("pending");
    if (member.disposition === "internal") {
      expect(member.parents).toEqual(["routine:$extension:intagg.int_array_aggregate(pg_catalog.int4)"]);
    }
  }
});
