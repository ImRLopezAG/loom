import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres/codecs";
import { createVector_0_8_6 } from "../../../apps/loom/src/core/extensions/adapters/vector";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/vector.json";

const api = createVector_0_8_6({
  name: "vector",
  version: "0.8.6",
  schema: 'binary"vectors',
  apiSupport: { status: "verified", digest: capture.digest },
});
const query = (expression: Parameters<ReturnType<typeof extensionSqlDialect>["sqlToQuery"]>[0]) =>
  extensionSqlDialect(nodePgCodecs).sqlToQuery(expression);

test("all SQL-callable Vector routines and operators have exact canonical bindings", () => {
  const members = capture.contract.members.filter(
    (member) =>
      member.kind === "operator" ||
      (member.kind === "routine" &&
        member.arguments !== undefined &&
        member.returns !== undefined &&
        !member.arguments.some(({ type }) => ["internal", "cstring", "_cstring"].includes(type.name)) &&
        !["cstring", "internal", "index_am_handler"].includes(member.returns.name)),
  );
  expect(members).toHaveLength(139);
  expect(Object.keys(api.sql.overloads).sort()).toEqual(members.map(({ id }) => id).sort());
});

test("vector aggregates preserve exact overloads, NULL results and SQL aggregate clauses", () => {
  for (const [kind, group] of [
    ["vector", api.vector],
    ["halfvec", api.halfvec],
  ] as const) {
    for (const name of ["avg", "sum"] as const) {
      const aggregate = group.sql.aggregates[name];
      const expression = aggregate([1, 2]);
      expect(query(expression).sql).toContain(`"binary""vectors"."${name}"`);
      expect(query(expression).params).toEqual(["[1,2]"]);
      expect(extensionExpressionContract(expression)?.member).toBe(
        `routine:$extension:vector.${name}($extension:vector.${kind})`,
      );
      expect(query(aggregate(null)).params).toEqual([null]);
      expect(query(aggregate.distinct([1, 2])).sql).toContain("distinct");
      expect(query(aggregate.filter(sql<boolean>`true`, [1, 2])).sql).toContain("filter (where true)");
      expect(query(aggregate.over({ partitionBy: [sql`category`] }, [1, 2])).sql).toContain(
        "over (partition by category)",
      );
      expect(query(aggregate(group.normalize([1, 2]).as("normalized"))).sql).not.toContain('"normalized"');
    }
  }
});

test("vector binary quantization and bit distances preserve bit codecs and exact namespace", () => {
  for (const group of [api.vector, api.halfvec]) {
    const expression = group.binaryQuantize([-1, 0, 1]);
    expect(query(expression).sql).toContain('"binary""vectors"."binary_quantize"');
    expect(query(expression).params).toEqual(["[-1,0,1]"]);
  }
  for (const [name, call] of Object.entries(api.bit.sql.operators)) {
    const expression = call({ bits: "0101" }, { bits: "1100" });
    expect(query(expression).sql).toContain(`operator("binary""vectors".${name})`);
    expect(query(expression).params).toEqual(["0101", "1100"]);
  }
  expect(query(api.bit.hammingDistance(null, { bits: "01" })).params).toEqual([null, "01"]);
  expect(query(api.bit.jaccardDistance(api.vector.binaryQuantize([1, -1]), { bits: "10" })).sql).toContain(
    '::"pg_catalog"."bit"',
  );
  expect(() => api.bit.hammingDistance({ bits: "02" }, { bits: "00" })).toThrow();
});
