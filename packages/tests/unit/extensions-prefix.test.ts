import { expect } from "vite-plus/test";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { prefixUnitProofCase, prefixMembershipUnitProofCase } from "../../e2e/fixtures/prefix-proof-cases";
import { createPrefix_1_2_0, prefixRange, type PrefixRange } from "../../../apps/loom/src/core/extensions/adapters/prefix";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/prefix.json";
import { prefixAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/prefix";
import { extensionSqlDialect, extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
import { nodePgCodecs } from "drizzle-orm/node-postgres";

const descriptor = {
  name: "prefix",
  version: "1.2.0",
  schema: 'Prefix"日本',
  apiSupport: {
    status: "verified",
    digest: "954698fcbe5ada03bdf4bcbd9b22014e77570456f0d8471d4ca2bd99d75581a7",
  },
} as const;

extensionProofUnitTest(prefixUnitProofCase, () => {
  const api = createPrefix_1_2_0(descriptor);
  expect(manifest.contract.extension).toBe("prefix");
  expect(prefixRange("123")).toBe("123");
  expect(prefixRange("123[4-5]")).toBe("123[4-5]");
  expect(prefixRange("[a-c]")).toBe("[a-c]");
  expect(prefixRange("123[4-4]")).toBe("1234");
  expect(prefixRange("123[5-4]")).toBe("123[4-5]");
  expect(prefixRange("01[]")).toBe("01");
  expect(prefixRange("[]")).toBe("");
  expect(api.codec.encode(prefixRange("123[4-5]"))).toBe("123[4-5]");
  expect(api.codec.decode("123[4-5]")).toBe("123[4-5]");
  expect(api.codec.decode("[a-c]")).toBe("[a-c]");
  for (const folded of ["123[4-4]", "123[5-4]", "01[]"] as const) {
    // SAFETY: These strings are deliberately non-canonical; the brand only reaches encode's runtime check.
    expect(() => api.codec.encode(folded as PrefixRange)).toThrow();
  }
  expect(() => api.codec.decode("123[4-4]")).toThrow();
  expect(() => api.codec.decode("123[5-4]")).toThrow();
  for (const malformed of ["123[", "123]", "[-5]", "[4-]", "[4]", "123[4-5]x", "12[3-4]5", "\0", "123\0"])
    expect(() => api.codec.decode(malformed)).toThrow();
  const array = {
    dimensions: [
      { lowerBound: -2, length: 2 },
      { lowerBound: 4, length: 2 },
    ],
    values: [
      [prefixRange("123"), null],
      [prefixRange("[a-c]"), prefixRange("01[0-9]")],
    ],
  };
  expect(api.arrayCodec.decode(api.arrayCodec.encode(array))).toEqual(array);
  expect(api.arrayCodec.decode("{}")).toEqual({ dimensions: [], values: [] });
  expect(() =>
    api.arrayCodec.encode({ dimensions: [{ lowerBound: 2147483647, length: 1 }], values: [prefixRange("1")] }),
  ).toThrow();
  expect(() => api.arrayCodec.encode({ dimensions: [{ lowerBound: 1, length: 2 }], values: [prefixRange("1")] })).toThrow();
});

extensionProofUnitTest(prefixMembershipUnitProofCase, () => {
  const api = createPrefix_1_2_0(descriptor);
  expect(prefixAnnotations.map((row) => row.id).sort()).toEqual(manifest.contract.members.map((row) => row.id).sort());
  expect(new Set(prefixAnnotations.map((row) => row.id)).size).toBe(69);
  const callable = manifest.contract.members.filter(
    (member) =>
      member.kind === "operator" ||
      member.kind === "cast" ||
      (member.kind === "routine" &&
        !member.arguments?.some((argument) => ["internal", "cstring"].includes(argument.type.name)) &&
        member.returns?.name !== "cstring"),
  );
  expect(Object.keys(api.sql.overloads).sort()).toEqual(callable.map((row) => row.id).sort());
  expect(callable.length).toBe(33);
  expect(prefixAnnotations.filter((row) => row.disposition === "query").map((row) => row.id).sort()).toEqual(
    callable.map((row) => row.id).sort(),
  );
  expect(prefixAnnotations.filter((row) => row.disposition === "schema")).toHaveLength(4);
  expect(prefixAnnotations.filter((row) => row.disposition === "internal")).toHaveLength(32);
  const expression = api.equal(prefixRange("123"), prefixRange("123[4-4]"));
  expect(extensionExpressionContract(expression)?.member).toBe(
    "operator:$extension:prefix.=($extension:prefix.prefix_range,$extension:prefix.prefix_range)",
  );
  const query = extensionSqlDialect(nodePgCodecs).sqlToQuery(expression);
  expect(query.sql).toContain('operator("Prefix""日本".=)');
  expect(query.params).toEqual(["123", "1234"]);
  expect(api.length(prefixRange("123"))).toBeDefined();
  expect(api.field().metadata.extension).toMatchObject({
    type: "prefix_range",
    schema: descriptor.schema,
    codec: "prefix:prefix_range:canonical-text:1",
  });
  expect(api.arrayField().metadata.extension).toMatchObject({
    type: "prefix_range",
    array: true,
    member: "type:$extension:prefix._prefix_range",
  });
  for (const index of [api.indexes.btree(), api.indexes.gist()])
    expect(index.input).toEqual({ schema: api.schema, type: "prefix_range", dimensions: 0 });
  expect(() => createPrefix_1_2_0({ ...descriptor, apiSupport: { status: "verified", digest: "wrong" } })).toThrow();
  // SAFETY: Wrong extension name is a static negative; the assertion only reaches the factory runtime check.
  expect(() => createPrefix_1_2_0({ ...descriptor, name: "xml2" as "prefix" })).toThrow();
  for (const annotation of prefixAnnotations)
    expect(annotation.semantics).toMatchObject({
      providerAcceptance: "pending",
      publicExportAcceptance: "pending",
    });
});
