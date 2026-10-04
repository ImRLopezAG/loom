import { expect } from "vite-plus/test";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { segUnitProofCase, segMembershipUnitProofCase } from "../../e2e/fixtures/seg-proof-cases";
import {
  createSeg_1_4,
  segBoundary,
  segPoint,
  segInterval,
  segDeviation,
} from "../../../apps/loom/src/core/extensions/adapters/seg";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/seg.json";
import { segAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/seg";
import { extensionSqlDialect, extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
const descriptor = {
  name: "seg",
  version: "1.4",
  schema: 'Seg"日本',
  apiSupport: { status: "verified", digest: "bba7c8f626ee6352397bd765ae103231780c7aa366ff9819bcf948ed22bd5fff" },
} as const;
extensionProofUnitTest(segUnitProofCase, () => {
  const api = createSeg_1_4(descriptor);
  const point = segPoint(segBoundary("6.50", "~"));
  expect(api.codec.encode(point)).toBe("~6.50");
  expect(api.codec.decode("~6.50")).toEqual(point);
  expect(api.codec.decode("6.25 .. >6.50")).toEqual(segInterval(segBoundary("6.25"), segBoundary("6.50", ">")));
  expect(api.codec.encode(segDeviation(segBoundary("10"), "1"))).toBe("10(+-)1");
  expect(api.codec.decode(".. 0.00")).toEqual(segInterval(null, segBoundary("0.00")));
  expect(api.codec.decode("50 ..")).toEqual(segInterval(segBoundary("50"), null));
  expect(api.codec.decode("5 .. 2")).toEqual(segInterval(segBoundary("5"), segBoundary("2")));
  expect(api.codec.decode("Infinity")).toEqual({ kind: "point", value: { value: "Infinity", certainty: "" } });
  expect(() => api.codec.encode(api.codec.decode("Infinity"))).toThrow();
  for (const token of ["Infinity", "-Infinity"]) {
    const infinite = api.codec.decode(`0.0 .. ${token}`);
    expect(infinite).toEqual({
      kind: "interval",
      lower: { value: "0.0", certainty: "" },
      upper: { value: token, certainty: "" },
    });
    expect(() => api.codec.encode(infinite)).toThrow();
  }
  for (const malformed of [
    "",
    ".5",
    "1.",
    "1junk",
    "1,2",
    "NaN",
    "inf",
    "1 .. 2 trailing",
    "1(+-)~2",
    "1e999",
    "1e-999",
  ])
    expect(() => api.codec.decode(malformed)).toThrow();
  const array = {
    dimensions: [
      { lowerBound: -2, length: 2 },
      { lowerBound: 4, length: 2 },
    ],
    values: [
      [point, null],
      [segInterval(null, segBoundary("0")), segPoint(segBoundary("2.00"))],
    ],
  };
  expect(api.arrayCodec.decode(api.arrayCodec.encode(array))).toEqual(array);
  expect(api.arrayCodec.decode("{}")).toEqual({ dimensions: [], values: [] });
  expect(() =>
    api.arrayCodec.encode({ dimensions: [{ lowerBound: 2147483647, length: 1 }], values: [point] }),
  ).toThrow();
  expect(() => api.arrayCodec.encode({ dimensions: [{ lowerBound: 1, length: 2 }], values: [point] })).toThrow();
});
extensionProofUnitTest(segMembershipUnitProofCase, () => {
  const api = createSeg_1_4(descriptor);
  expect(segAnnotations.map((r) => r.id).sort()).toEqual(manifest.contract.members.map((r) => r.id).sort());
  expect(new Set(segAnnotations.map((r) => r.id)).size).toBe(65);
  const callable = manifest.contract.members.filter(
    (m) =>
      m.kind === "operator" ||
      (m.kind === "routine" &&
        !m.arguments?.some((a) => ["internal", "cstring"].includes(a.type.name)) &&
        m.returns?.name !== "cstring"),
  );
  expect(Object.keys(api.sql.overloads).sort()).toEqual(callable.map((r) => r.id).sort());
  expect(callable.length).toBe(33);
  const expression = api.equal(segPoint(segBoundary("6.5")), segPoint(segBoundary("6.50")));
  expect(extensionExpressionContract(expression)?.member).toBe(
    "operator:$extension:seg.=($extension:seg.seg,$extension:seg.seg)",
  );
  const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(expression);
  expect(query.sql).toContain('operator("Seg""日本".=)');
  expect(query.params).toEqual(["6.5", "6.50"]);
  expect(api.lower(segPoint(segBoundary("1")))).toBeDefined();
  expect(api.field().metadata.extension).toMatchObject({
    type: "seg",
    schema: descriptor.schema,
    codec: "seg:seg:precision:1",
  });
  expect(api.arrayField().metadata.extension).toMatchObject({
    type: "seg",
    array: true,
    member: "type:$extension:seg._seg",
  });
  for (const index of [api.indexes.btree(), api.indexes.gist()])
    expect(index.input).toEqual({ schema: api.schema, type: "seg", dimensions: 0 });
  expect(() => createSeg_1_4({ ...descriptor, apiSupport: { status: "verified", digest: "wrong" } })).toThrow();
  for (const annotation of segAnnotations)
    expect(annotation.semantics).toMatchObject({ providerAcceptance: "pending", publicExportAcceptance: "pending" });
});
