import { expect, test } from "vite-plus/test";
import { createCitext_1_8 } from "../../../apps/loom/src/core/extensions/adapters/citext";
import { citext } from "../../../apps/loom/src/core/extensions/citext-codec";
import { extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
const descriptor = {
  name: "citext",
  version: "1.8",
  schema: 'Case"Text',
  apiSupport: { status: "verified", digest: "bf50ef209f828f5cbd517fe1a5f0b1ede7f1bbeac379b75c0b2bc02bf0a8eee3" },
} as const;
test("citext.qualifiedBindingsPreserveCase", () => {
  const api = createCitext_1_8(descriptor);
  const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
    api.equal("McDonald'; drop table x; --", citext("MCDONALD")),
  );
  expect(compiled.sql).toContain('operator("Case""Text".=)');
  expect(compiled.params).toEqual(["McDonald'; drop table x; --", "MCDONALD"]);
  expect(api.codec.decode("MiXeD")).toBe("MiXeD");
  expect(() => api.codec.decode(1)).toThrow();
});

test("citext.fieldContractsAndArrayBounds", () => {
  const api = createCitext_1_8(descriptor);
  const array = {
    dimensions: [
      { lowerBound: -2, length: 2 },
      { lowerBound: 3, length: 2 },
    ],
    values: [
      ["A", null],
      ["NULL", 'a,"b\\c'],
    ],
  };
  expect(api.arrayCodec.decode(api.arrayCodec.encode(array))).toEqual(array);
  expect(api.arrayCodec.decode("{}")).toEqual({ dimensions: [], values: [] });
  expect(() =>
    api.arrayCodec.encode({
      dimensions: Array.from({ length: 7 }, () => ({ lowerBound: 1, length: 1 })),
      values: [[[[[[["a"]]]]]]],
    }),
  ).toThrow();
  expect(() =>
    api.arrayCodec.encode({ dimensions: [{ lowerBound: 2147483647, length: 2 }], values: ["a", "b"] }),
  ).toThrow();
  expect(() => api.arrayCodec.decode("{{a},{b,c}}")).toThrow();
  const adjacentBound = { dimensions: [{ lowerBound: 2147483646, length: 1 }], values: ["A"] };
  expect(api.arrayCodec.decode(api.arrayCodec.encode(adjacentBound))).toEqual(adjacentBound);
  for (const dimensions of [[{ lowerBound: 2147483647, length: 1 }], [{ lowerBound: 2147483646, length: 2 }]]) {
    const values = dimensions[0]!.length === 1 ? ["A"] : ["A", "B"];
    expect(() => api.arrayCodec.encode({ dimensions, values })).toThrow();
  }
  expect(() => api.arrayCodec.decode("[2147483647:2147483647]={A}")).toThrow();
  expect(() => api.arrayCodec.decode("[2147483646:2147483647]={A,B}")).toThrow();
  expect(() => api.codec.encode("a\0b")).toThrow();
  expect(() => createCitext_1_8({ ...descriptor, apiSupport: { status: "verified", digest: "wrong" } })).toThrow();
  expect(api.indexes.btree()).toMatchObject({
    member: "opclass:$extension:citext.citext_ops/btree",
    method: "btree",
    opclass: "citext_ops",
  });
  expect(api.indexes.hash()).toMatchObject({
    member: "opclass:$extension:citext.citext_ops/hash",
    method: "hash",
    opclass: "citext_ops",
  });
  expect(api.indexes.pattern()).toMatchObject({
    member: "opclass:$extension:citext.citext_pattern_ops/btree",
    method: "btree",
    opclass: "citext_pattern_ops",
  });
});

import manifest from "../../../apps/loom/src/tooling/extensions/manifests/citext.json";
import { citextAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/citext";
import { extensionExpressionContract } from "../../../apps/loom/src/core/extensions/sql";
test("citext.exactCoverageAndOverloadContracts", () => {
  const api = createCitext_1_8(descriptor);
  expect(citextAnnotations.map((row) => row.id).sort()).toEqual(manifest.contract.members.map((row) => row.id).sort());
  expect(new Set(citextAnnotations.map((row) => row.id)).size).toBe(104);
  const callable = manifest.contract.members.filter(
    (row) =>
      ["cast", "operator"].includes(row.kind) ||
      (row.kind === "routine" && !["citextin", "citextout", "citextrecv"].includes(row.name)),
  );
  expect(Object.keys(api.sql.overloads).sort()).toEqual(callable.map((row) => row.id).sort());
  expect(extensionExpressionContract(api.fromText("A"))?.member).toBe("cast:pg_catalog.text->$extension:citext.citext");
  expect(extensionExpressionContract(api.regexpMatch("A", "a"))?.member).toBe(
    "routine:$extension:citext.regexp_match($extension:citext.citext,$extension:citext.citext)",
  );
  expect(extensionExpressionContract(api.regexpMatch("A", "a", "c"))?.member).toBe(
    "routine:$extension:citext.regexp_match($extension:citext.citext,$extension:citext.citext,pg_catalog.text)",
  );
  const parents = citextAnnotations.filter((row) => row.disposition === "internal");
  for (const row of parents) {
    expect("parent" in row.semantics).toBe(true);
  }
});
