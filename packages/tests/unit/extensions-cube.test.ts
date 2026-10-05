import { expect, test } from "vite-plus/test";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { wave10CallbackUnitCases } from "../../e2e/fixtures/wave10-callback-unit-types-cases";
import { createCube_1_5, cubePoint, cubeBox } from "../../../apps/loom/src/core/extensions/adapters/cube";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/cube.json";
import { cubeAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/cube";
import { extensionSqlDialect, extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import { nodePgCodecs } from "drizzle-orm/node-postgres";

const descriptor = {
  name: "cube",
  version: "1.5",
  schema: 'Cube"日本',
  apiSupport: {
    status: "verified",
    digest: "205421c1cacc198ba7088c60ec4f76b0a8e7adec18be87d17a8082dd7b0515e2",
  },
} as const;
extensionProofUnitTest(
  wave10CallbackUnitCases.find((entry) => entry.id === "cube.unit-contracts")!,
  () => {
    const api = createCube_1_5(descriptor);
    const point = cubePoint([1, { nonfinite: "NaN" }, { nonfinite: "Infinity" }]);
    const box = cubeBox([3, 4], [1, 2]);
    expect(api.codec.decode(api.codec.encode(point))).toEqual(point);
    expect(api.codec.decode("(1, 2),(3, 4)")).toEqual(cubeBox([1, 2], [3, 4]));
    expect(api.codec.encode(box)).toBe("(3, 4),(1, 2)");
    expect(api.codec.decode("()")).toEqual(cubePoint([]));
    for (const malformed of ["(1),(2,3)", "(oops)", "(1) trailing", "(1e999)"])
      expect(() => api.codec.decode(malformed)).toThrow();
    expect(() => cubeBox([1], [1, 2])).toThrow();
    expect(() => cubePoint(Array.from({ length: 101 }, () => 0))).toThrow();
    const array = { dimensions: [{ lowerBound: -2, length: 3 }], values: [cubePoint([]), null, cubeBox([1], [2])] };
    expect(api.arrayCodec.decode(api.arrayCodec.encode(array))).toEqual(array);
    expect(api.arrayCodec.decode("{}")).toEqual({ dimensions: [], values: [] });
    expect(api.field().metadata.extension).toMatchObject({
      type: "cube",
      codec: "cube:cube:corners:1",
      schema: descriptor.schema,
    });
    expect(api.arrayField().metadata.extension).toMatchObject({
      type: "cube",
      array: true,
      member: "type:$extension:cube._cube",
    });
    expect(() =>
      api.arrayCodec.encode({ dimensions: [{ lowerBound: 2147483647, length: 1 }], values: [cubePoint([1])] }),
    ).toThrow();
    const nested = {
      dimensions: [
        { lowerBound: -1, length: 2 },
        { lowerBound: 4, length: 2 },
      ],
      values: [
        [cubePoint([1]), null],
        [cubeBox([2], [3]), cubePoint([])],
      ],
    };
    expect(api.arrayCodec.decode(api.arrayCodec.encode(nested))).toEqual(nested);
    const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(
      api.fromArray({
        dimensions: [
          { lowerBound: -1, length: 2 },
          { lowerBound: 2, length: 2 },
        ],
        values: [
          [1, 2],
          [3, 4],
        ],
      }),
    );
    expect(query.params).toEqual(['[-1:0][2:3]={{"1","2"},{"3","4"}}']);
  },
);
test("cube exact membership, schema identity and canonical SQL", () => {
  const api = createCube_1_5(descriptor);
  expect(cubeAnnotations.map((row) => row.id).sort()).toEqual(manifest.contract.members.map((row) => row.id).sort());
  expect(new Set(cubeAnnotations.map((row) => row.id)).size).toBe(80);
  const callable = manifest.contract.members.filter(
    (m) =>
      m.kind === "operator" ||
      (m.kind === "routine" &&
        !m.arguments?.some((a) => ["internal", "cstring"].includes(a.type.name)) &&
        m.returns?.name !== "cstring"),
  );
  expect(Object.keys(api.sql.overloads).sort()).toEqual(callable.map((m) => m.id).sort());
  const expression = api.distance(cubePoint([1]), cubePoint([4]));
  expect(extensionExpressionContract(expression)?.member).toBe(
    "operator:$extension:cube.<->($extension:cube.cube,$extension:cube.cube)",
  );
  const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(expression);
  expect(query.sql).toContain('operator("Cube""日本".<->)');
  expect(query.params).toEqual(["(1)", "(4)"]);
  for (const index of [api.indexes.btree(), api.indexes.gist()])
    expect(index).toMatchObject({ input: { schema: api.schema, type: "cube", dimensions: 0 } });
  expect(() => createCube_1_5({ ...descriptor, apiSupport: { status: "verified", digest: "wrong" } })).toThrow();
  for (const row of cubeAnnotations) {
    expect(row.semantics.providerAcceptance).toBe("pending");
    expect(row.semantics.publicExportAcceptance).toBe("pending");
  }
});
