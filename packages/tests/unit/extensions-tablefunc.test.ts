import { expect, test } from "vite-plus/test";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { extensionProofUnitTest } from "../../e2e/fixtures/extension-proof-unit";
import { tablefuncMembers, tablefuncUnitProofCases } from "../../e2e/fixtures/tablefunc-proof-cases";
import { createTablefunc_1_0 } from "../../../apps/loom/src/core/extensions/adapters/tablefunc";
import { tablefuncAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/tablefunc";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/tablefunc.json";
import { resolveSelectedExtension } from "../../../apps/loom/src/tooling/codegen/extensions";
import { checkCompiledExtensionQuery, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import { textCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { int4Codec } from "../../../apps/loom/src/core/extensions/native-codecs";
import type { NestedQuery } from "../../../apps/loom/src/core/extensions/nested-query";

const descriptor = {
  name: "tablefunc",
  version: "1.0",
  schema: 'table"func',
  apiSupport: {
    status: "verified",
    digest: "08f54e73281a2592eddf0ac6f555ba1a0b3c0961fb7ab6eab05be90ab74b66d4",
  },
} as const;
// SAFETY: an empty object has no nested-query evidence; every SQL-text member must reject it at runtime.
const unproven = Object.freeze({}) as NestedQuery<{ row: string; category: string; value: string }>;
const routines = manifest.contract.members.filter((row) => row.kind === "routine").map((row) => row.id);

extensionProofUnitTest(tablefuncUnitProofCases[0]!, () => {
  const api = createTablefunc_1_0(descriptor);
  const ids = manifest.contract.members.map((row) => row.id).sort();
  expect(manifest.digest).toBe(descriptor.apiSupport.digest);
  expect(manifest.contract.version).toBe("1.0");
  expect([...tablefuncMembers].sort()).toEqual(ids);
  expect(tablefuncAnnotations.map((row) => row.id).sort()).toEqual(ids);
  expect(new Set(tablefuncAnnotations.map((row) => row.id)).size).toBe(20);
  expect(Object.keys(api.sql.overloads).sort()).toEqual(routines.sort());
  expect(Object.keys(api.sql.types).sort()).toEqual(
    manifest.contract.members
      .filter((row) => row.kind !== "routine")
      .map((row) => row.id)
      .sort(),
  );
  for (const wrong of [
    { ...descriptor, apiSupport: { status: "verified", digest: "wrong" } },
    { ...descriptor, apiSupport: { status: "unverified" } },
    { ...descriptor, version: "1.1" },
  ])
    // SAFETY: deliberately invalid runtime descriptors exercise the exact-contract gate.
    expect(() => createTablefunc_1_0(wrong as never)).toThrow(/exact verified contract/);
  for (const row of tablefuncAnnotations) {
    expect(row.semantics.providerAcceptance).toBe("pending");
    expect(row.semantics.publicExportAcceptance).toBe("pending");
    expect(row.semantics.nativeAcceptance).toBe("pending");
  }
});

extensionProofUnitTest(tablefuncUnitProofCases[1]!, () => {
  const api = createTablefunc_1_0(descriptor);
  const dialect = extensionSqlDialect(nodePgCodecs);
  const random = api.normalRand(3, 0, { nonfinite: "NaN" }, "samples");
  const randomQuery = dialect.sqlToQuery(random.from);
  expect(randomQuery.sql).toBe(
    '"table""func"."normal_rand"($1::"pg_catalog"."int4", $2::"pg_catalog"."float8", $3::"pg_catalog"."float8") as "samples"("value")',
  );
  expect(randomQuery.params).toEqual([3, 0, "NaN"]);
  const [randomContract] = checkCompiledExtensionQuery(randomQuery);
  expect(randomContract?.member).toBe(
    "routine:$extension:tablefunc.normal_rand(pg_catalog.int4,pg_catalog.float8,pg_catalog.float8)",
  );
  expect(randomContract?.observability).toBe("external");
  expect(() => api.normalRand(1.5, 0, 1, "samples")).toThrow();

  const tree = api.connectby({
    relation: { schema: 'app"s', name: "tree; drop table t" },
    key: 'key"id',
    parent: "parent_keyid",
    orderBy: "pos",
    start: "row2",
    maxDepth: 0,
    branchDelimiter: "~",
    keyCodec: textCodec,
    alias: 'out"t',
  });
  const treeQuery = dialect.sqlToQuery(tree.from);
  expect(treeQuery.sql).toContain('"table""func"."connectby"(');
  expect(treeQuery.sql).toContain(
    'as "out""t"("keyid" "pg_catalog"."text", "parent_keyid" "pg_catalog"."text", "level" "pg_catalog"."int4", "branch" "pg_catalog"."text", "pos" "pg_catalog"."int4")',
  );
  expect(treeQuery.params).toEqual([
    '"app""s"."tree; drop table t"',
    '"key""id"',
    '"parent_keyid"',
    '"pos"',
    "row2",
    0,
    "~",
  ]);
  const [treeContract] = checkCompiledExtensionQuery(treeQuery);
  expect(treeContract?.member).toBe(routines.find((id) => id.includes("connectby") && id.split(",").length === 7));
  expect(treeContract?.dependencies).toEqual(['app"s.tree; drop table t']);
  const plain = dialect.sqlToQuery(
    api.connectby({
      relation: { schema: "public", name: "tree" },
      key: "id",
      parent: "parent",
      start: "1",
      maxDepth: 2,
      keyCodec: int4Codec,
      alias: "t",
    }).from,
  );
  expect(plain.sql).toContain('as "t"("keyid" "pg_catalog"."int4", "parent_keyid" "pg_catalog"."int4", "level"');
  expect(plain.sql).not.toContain('"branch"');
  expect(plain.sql).not.toContain('"pos"');
  expect(checkCompiledExtensionQuery(plain)[0]?.member).toBe(
    "routine:$extension:tablefunc.connectby(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
  );
  expect(() =>
    api.connectby({
      relation: { schema: "public", name: "tree" },
      key: "bad\0",
      parent: "parent",
      start: "1",
      maxDepth: 2,
      keyCodec: textCodec,
      alias: "t",
    }),
  ).toThrow(/identifier/);
  expect(() =>
    api.connectby({
      source: unproven,
      key: "row",
      parent: "category",
      start: "1",
      maxDepth: 2,
      keyCodec: textCodec,
      alias: "t",
    }),
  ).toThrow(/managed provenance/);
  expect(() => api.crosstab({ source: unproven, fields: { row: textCodec, a: textCodec }, alias: "p" })).toThrow(
    /managed provenance/,
  );
  expect(() =>
    api.crosstab({ source: unproven, categories: unproven, fields: { row: textCodec, a: textCodec }, alias: "p" }),
  ).toThrow(/managed provenance/);
  expect(() => api.crosstab2({ source: unproven, alias: "p" })).toThrow(/managed provenance/);
  expect(() => api.crosstab3({ source: unproven, alias: "p" })).toThrow(/managed provenance/);
  expect(() => api.crosstab4({ source: unproven, alias: "p" })).toThrow(/managed provenance/);
  const row = api.codecs.crosstab2;
  expect(api.sql.types["type:$extension:tablefunc.tablefunc_crosstab_2"]).toBe(row);
  expect(api.sql.types['composite type:"$extension:tablefunc".tablefunc_crosstab_2']).toBe(row);
  expect(api.sql.types["type:$extension:tablefunc._tablefunc_crosstab_2"]).toBe(api.codecs.crosstab2Array);
  expect(row.sqlType).toEqual({ schema: 'table"func', name: "tablefunc_crosstab_2" });
  expect(row.decode('("a,b",,"q""x")')).toEqual({ row_name: "a,b", category_1: null, category_2: 'q"x' });
  expect(row.encode({ row_name: "a,b", category_1: null, category_2: 'q"x' })).toBe('("a,b",,"q\\"x")');
  expect(api.codecs.crosstab4Array.sqlType).toEqual({
    schema: 'table"func',
    name: "tablefunc_crosstab_4",
    array: true,
  });
  expect(api.codecs.crosstab2Array.decode('{"(\\"a,b\\",,\\"q\\"\\"x\\")",NULL}')).toEqual({
    dimensions: [{ length: 2, lowerBound: 1 }],
    values: [{ row_name: "a,b", category_1: null, category_2: 'q"x' }, null],
  });
});

test("tablefunc shared codegen selects its exact public adapter", () => {
  const resolution = resolveSelectedExtension("tablefunc", { version: "1.0", schema: "extensions" });
  expect(resolution.support.status).toBe("verified");
  expect(resolution.adapter).toEqual({
    name: "tablefunc",
    version: "1.0",
    digest: descriptor.apiSupport.digest,
    factory: "createTablefunc_1_0",
    module: "kello/extensions/tablefunc",
  });
});
