import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import assert from "node:assert/strict";
import { appendFileSync } from "node:fs";
import { createSemver_0_40_0, semver } from "../../../apps/loom/src/core/extensions/adapters/semver";
import {
  createSemverArrayCodec,
  createSemverCodec,
  createSemverMultirangeArrayCodec,
  createSemverMultirangeCodec,
  createSemverRangeArrayCodec,
  createSemverRangeCodec,
} from "../../../apps/loom/src/core/extensions/adapters/semver-codecs";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";
import type { ExtensionFieldMetadata } from "../../../apps/loom/src/core/extensions/fields";
import { semverAnnotations } from "../../../apps/loom/src/tooling/extensions/annotations/semver";
import manifest from "../../../apps/loom/src/tooling/extensions/manifests/semver.json";
import { semverUnitProofCase } from "../../e2e/fixtures/semver-proof-cases";
import type { ExtensionProofEvent } from "../../e2e/fixtures/extension-proof";
import { extensionBindingsSource, resolveSelectedExtension } from "../../../apps/loom/src/tooling/codegen/extensions";
import { buildRequiredApi } from "../../../apps/loom/src/tooling/migrations/required-api";
import { validateRequiredApiForTarget } from "../../../apps/loom/src/tooling/migrations/required-api-verification";

const digest = "5a21997dcf96a0af38e49bc1d9309905050a05f18e6afe15f37fb2a63722a86e";
const extension = createSemver_0_40_0({
  name: "semver",
  version: "0.40.0",
  schema: 'semver"functions',
  apiSupport: { status: "verified", digest },
});
const dialect = extensionSqlDialect(nodePgCodecs);
const query = (value: Parameters<typeof dialect.sqlToQuery>[0]) => dialect.sqlToQuery(value);
const sorted = (values: readonly string[]) => [...values].sort((a, b) => a.localeCompare(b));
function metadata(field: { readonly metadata: { readonly extension?: ExtensionFieldMetadata | undefined } }) {
  assert(field.metadata.extension);
  return field.metadata.extension;
}

// Characterized against native semver 0.40.0 on PostgreSQL 18: each is accepted and printed unchanged by semver_out.
const fixedPoints = [
  "0.0.0",
  "1.2.3",
  "2147483647.2147483647.2147483647",
  "1.2.3-0",
  "1.2.3-0a",
  "1.2.3-01a",
  "1.2.3-a-01",
  "1.2.3--",
  "1.2.3-alpha-1",
  "1.2.3-A.B",
  "1.2.3-99999999999999999999",
  "1.2.3-alpha.1+build.5",
  "1.2.3+",
  "1.2.3+01",
  "1.2.3+-",
  "1.2.3+a-",
  "1.2.3+-.-",
  "1.2.3+0.01",
  "1.2.3-a+",
  "1.2.3-a.+",
  "1.2.3-a.+b",
  "1.2.3-a.b.+c",
  "1.2.3-0.+c",
  "1.2.3-00+a",
  "1.2.3-01+a",
  "1.2.3-001+x",
  "1.2.3-a.01+b",
  "1.2.3-01+-",
  "1.2.3-01+0a",
  "1.2.3-0+1",
  "1.2.3-10+00",
  "1.0.0-e+20",
  "0.0.0-NaN",
  "0.0.0-1.5",
];
// Native errors, or accepted inputs whose semver_out spelling differs (leading whitespace, empty prerelease).
const notFixedPoints = [
  "",
  "1.2",
  "v1.2.3",
  "-1.2.3",
  "+1.2.3",
  "01.2.3",
  "1.02.3",
  "1.2.3.4",
  " 1.2.3",
  "\t1.2.3",
  "1.2.3 ",
  "1.2.3-",
  "1.2.3-+",
  "1.2.3-01",
  "1.2.3-00",
  "1.2.3-0.01",
  "1.2.3-a.01",
  "1.2.3-01.a",
  "1.2.3-01.02+x",
  "1.2.3-00+",
  "1.2.3-a.01+",
  "1.2.3-01.+",
  "1.2.3-01+0.a",
  "1.2.3-01+.a",
  "1.2.3-0100+1",
  "1.2.3-01+00",
  "1.2.3-a..b",
  "1.2.3-.a",
  "1.2.3-a.",
  "1.2.3+a..b",
  "1.2.3+.a",
  "1.2.3+a.",
  "1.2.3+a_b",
  "1.2.3-a_b",
  "1.2.3-ä",
  "1.2.3+ä",
  "1.2.3-a+b+c",
  "1.2.3-x'y",
  "2147483648.0.0",
  "0.2147483648.0",
  "0.0.2147483648",
];

test("semver codec accepts exactly native semver_out fixed points", () => {
  const codec = createSemverCodec("custom");
  for (const value of fixedPoints) {
    expect(semver(value)).toBe(value);
    expect(codec.encode(value)).toBe(value);
    expect(codec.decode(value)).toBe(value);
  }
  for (const value of notFixedPoints) {
    expect(() => semver(value)).toThrow(/canonical semver/);
    expect(() => codec.encode(value)).toThrow();
    expect(() => codec.decode(value)).toThrow();
  }
  for (const value of [null, 1, {}, ["1.0.0"]]) expect(() => codec.decode(value)).toThrow();
  expect(codec.sqlType).toEqual({ schema: "custom", name: "semver" });
  expect(codec.transport).toBe("text");
});

test("semver range, multirange and array codecs keep native bound flags and dimensions", () => {
  const range = createSemverRangeCodec("custom");
  expect(range.sqlType).toEqual({ schema: "custom", name: "semverrange" });
  expect(range.decode("[1.0.0-a+b,2.0.0)")).toEqual({
    empty: false,
    lower: "1.0.0-a+b",
    upper: "2.0.0",
    lowerInclusive: true,
    upperInclusive: false,
  });
  expect(range.decode("(,)")).toEqual({
    empty: false,
    lower: null,
    upper: null,
    lowerInclusive: false,
    upperInclusive: false,
  });
  expect(range.decode("empty")).toEqual({ empty: true });
  expect(range.encode({ empty: false, lower: "1.0.0", upper: null, lowerInclusive: true, upperInclusive: false })).toBe(
    '["1.0.0",)',
  );
  expect(() => range.decode("[1.0,2.0.0)")).toThrow();
  expect(() =>
    range.encode({ empty: false, lower: null, upper: "1.0.0", lowerInclusive: true, upperInclusive: false }),
  ).toThrow();
  const multirange = createSemverMultirangeCodec("custom");
  expect(multirange.sqlType).toEqual({ schema: "custom", name: "semvermultirange" });
  expect(multirange.decode("{}")).toEqual([]);
  expect(multirange.decode("{[1.0.0,2.0.0),(,0.1.0],[3.0.0-rc.1+b,)}")).toEqual([
    { empty: false, lower: "1.0.0", upper: "2.0.0", lowerInclusive: true, upperInclusive: false },
    { empty: false, lower: null, upper: "0.1.0", lowerInclusive: false, upperInclusive: true },
    { empty: false, lower: "3.0.0-rc.1+b", upper: null, lowerInclusive: true, upperInclusive: false },
  ]);
  expect(
    multirange.encode([
      { empty: false, lower: "1.0.0", upper: "2.0.0", lowerInclusive: true, upperInclusive: false },
      { empty: false, lower: null, upper: null, lowerInclusive: false, upperInclusive: false },
    ]),
  ).toBe('{["1.0.0","2.0.0"),(,)}');
  expect(() => multirange.encode([{ empty: true }])).toThrow(/empty ranges/);
  for (const value of ["", "{", "{empty}", "{[1.0.0,2.0.0)", "{[1.0.0,2.0.0);[3.0.0,4.0.0)}", "{[1.0,2.0.0)}"])
    expect(() => multirange.decode(value)).toThrow();
  const array = createSemverArrayCodec("custom");
  expect(array.sqlType).toEqual({ schema: "custom", name: "semver", array: true });
  expect(array.decode("[0:1]={1.0.0,NULL}")).toEqual({
    dimensions: [{ lowerBound: 0, length: 2 }],
    values: ["1.0.0", null],
  });
  expect(array.encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: ["1.0.0+b"] })).toBe('[1:1]={"1.0.0+b"}');
  expect(() =>
    array.encode({ dimensions: [{ lowerBound: 2147483647, length: 2 }], values: ["1.0.0", "2.0.0"] }),
  ).toThrow(/bounds/);
  expect(() => array.decode("{1.0}")).toThrow();
  expect(createSemverRangeArrayCodec("custom").decode('{"[1.0.0,2.0.0)",NULL}')).toEqual({
    dimensions: [{ lowerBound: 1, length: 2 }],
    values: [{ empty: false, lower: "1.0.0", upper: "2.0.0", lowerInclusive: true, upperInclusive: false }, null],
  });
  expect(createSemverMultirangeArrayCodec("custom").decode('{"{[1.0.0,2.0.0)}","{}"}')).toEqual({
    dimensions: [{ lowerBound: 1, length: 2 }],
    values: [[{ empty: false, lower: "1.0.0", upper: "2.0.0", lowerInclusive: true, upperInclusive: false }], []],
  });
});

test("semver qualifies routines and binds exact overload parameter types", () => {
  const schema = '"semver""functions"';
  const compiled = query(extension.parse("1.2.3'); drop table versions;--"));
  expect(compiled.sql).toContain(`${schema}."semver"(`);
  expect(compiled.sql).toContain('::"pg_catalog"."text"');
  expect(compiled.params).toEqual(["1.2.3'); drop table versions;--"]);
  for (const [call, type, param] of [
    [extension.fromInt2(1), "int2", 1],
    [extension.fromInt4(2), "int4", 2],
    [extension.fromInt8(3n), "int8", "3"],
    [extension.fromFloat4(1.5), "float4", 1.5],
    [extension.fromFloat8({ nonfinite: "NaN" }), "float8", "NaN"],
    [extension.fromNumeric("1.25"), "numeric", "1.25"],
  ] as const) {
    const result = query(call);
    expect(result.sql).toBe(`${schema}."semver"($1::"pg_catalog"."${type}")`);
    expect(result.params).toEqual([param]);
  }
  expect(query(extension.lessThan("1.0.0-rc.1", "1.0.0")).sql).toBe(
    `($1::${schema}."semver" operator(${schema}.<) $2::${schema}."semver")`,
  );
  expect(query(extension.range("1.0.0", null, "[]")).sql).toBe(
    `${schema}."semverrange"($1::${schema}."semver", $2::${schema}."semver", $3::"pg_catalog"."text")`,
  );
  expect(query(extension.range("1.0.0", null, "[]")).params).toEqual(["1.0.0", null, "[]"]);
  expect(query(extension.range(null, "2.0.0")).sql).toBe(
    `${schema}."semverrange"($1::${schema}."semver", $2::${schema}."semver")`,
  );
  const first = { empty: false, lower: "1.0.0", upper: "2.0.0", lowerInclusive: true, upperInclusive: false } as const;
  expect(query(extension.multirange()).sql).toBe(`${schema}."semvermultirange"()`);
  expect(query(extension.multirange(first)).sql).toBe(`${schema}."semvermultirange"($1::${schema}."semverrange")`);
  const variadic = query(extension.multirange(first, extension.range("3.0.0", "4.0.0"), first));
  expect(variadic.sql).toBe(
    `${schema}."semvermultirange"(variadic ARRAY[$1::${schema}."semverrange", ${schema}."semverrange"($2::${schema}."semver", $3::${schema}."semver"), $4::${schema}."semverrange"]::${schema}."semverrange"[])`,
  );
  expect(variadic.params).toEqual(['["1.0.0","2.0.0")', "3.0.0", "4.0.0", '["1.0.0","2.0.0")']);
  expect(query(extension.sql.casts.text_to_semver("1.0.0")).sql).toBe(
    `(($1)::"pg_catalog"."text")::${schema}."semver"`,
  );
  expect(query(extension.sql.casts.semverrange_to_semvermultirange(first)).sql).toBe(
    `(($1)::${schema}."semverrange")::${schema}."semvermultirange"`,
  );
  expect(query(extension.max.filter(sql`true`, "1.0.0")).sql).toContain(`${schema}."max"(`);
  expect(() => extension.compare("1.2", "1.2.3")).toThrow();
  expect(() => extension.fromInt4(2147483648)).toThrow();
  expect(() => extension.fromInt2(32768)).toThrow();
  // SAFETY: Deliberately invalid flags exercise the runtime codec beyond the static picklist.
  expect(() => extension.range("1.0.0", "2.0.0", "[x" as never)).toThrow();
  expect(Object.isFrozen(extension)).toBe(true);
});

test("all 68 captured members are callable, schema-declared or internal with matching annotations", () => {
  const ids = sorted(manifest.contract.members.map((member) => member.id));
  expect(ids).toHaveLength(68);
  expect(sorted(semverAnnotations.map((annotation) => annotation.id))).toEqual(ids);
  const range = { empty: false, lower: "1.0.0", upper: "2.0.0", lowerInclusive: true, upperInclusive: false } as const;
  const f = extension.sql.functions;
  const c = extension.sql.casts;
  const o = extension.sql.operators;
  const expressions = [
    c.semver_to_text("1.0.0"),
    c.semverrange_to_semvermultirange(range),
    c.float4_to_semver(1),
    c.float8_to_semver(1),
    c.int2_to_semver(1),
    c.int4_to_semver(1),
    c.int8_to_semver(1n),
    c.numeric_to_semver("1"),
    c.text_to_semver("1.0.0"),
    ...Object.values(o).map((operator) => operator("1.0.0", "2.0.0")),
    f.get_semver_major("1.0.0"),
    f.get_semver_minor("1.0.0"),
    f.get_semver_patch("1.0.0"),
    f.get_semver_prerelease("1.0.0"),
    f.semver_send("1.0.0"),
    f.hash_semver("1.0.0"),
    f.is_semver("1.0.0"),
    f.max("1.0.0"),
    f.min("1.0.0"),
    f.semver_cmp("1.0.0", "2.0.0"),
    f.semver_eq("1.0.0", "2.0.0"),
    f.semver_ge("1.0.0", "2.0.0"),
    f.semver_gt("1.0.0", "2.0.0"),
    f.semver_larger("1.0.0", "2.0.0"),
    f.semver_le("1.0.0", "2.0.0"),
    f.semver_lt("1.0.0", "2.0.0"),
    f.semver_ne("1.0.0", "2.0.0"),
    f.semver_smaller("1.0.0", "2.0.0"),
    f.semver.float4(1),
    f.semver.float8(1),
    f.semver.int2(1),
    f.semver.int4(1),
    f.semver.int8(1n),
    f.semver.numeric("1"),
    f.semver.text("1.0.0"),
    f.semvermultirange.empty(),
    f.semvermultirange.range(range),
    f.semvermultirange.variadic(range, range),
    f.semverrange.bounds("1.0.0", "2.0.0"),
    f.semverrange.flags("1.0.0", "2.0.0", "[]"),
    f.text("1.0.0"),
    f.to_semver("1.0"),
  ];
  const callable = sorted(expressions.map((value) => extensionExpressionContract(value)?.member ?? "missing"));
  expect(new Set(callable).size).toBe(47);
  expect(sorted(Object.keys(extension.sql.overloads))).toEqual(callable);
  const queries = semverAnnotations.filter((annotation) => annotation.disposition === "query").map(({ id }) => id);
  expect(sorted(queries)).toEqual(callable);
  const schema = semverAnnotations.filter((annotation) => annotation.disposition === "schema").map(({ id }) => id);
  expect(sorted(schema)).toEqual([
    "opclass:$extension:semver.semver_ops/btree",
    "opclass:$extension:semver.semver_ops/hash",
    "type:$extension:semver._semver",
    "type:$extension:semver._semvermultirange",
    "type:$extension:semver._semverrange",
    "type:$extension:semver.semver",
    "type:$extension:semver.semvermultirange",
    "type:$extension:semver.semverrange",
  ]);
  expect(
    sorted([
      metadata(extension.field()).member,
      metadata(extension.arrayField()).member,
      metadata(extension.rangeField()).member,
      metadata(extension.rangeArrayField()).member,
      metadata(extension.multirangeField()).member,
      metadata(extension.multirangeArrayField()).member,
      extension.indexes.btree().member,
      extension.indexes.hash().member,
    ]),
  ).toEqual(sorted(schema));
  expect(semverAnnotations.filter((annotation) => annotation.disposition === "internal")).toHaveLength(13);
  for (const value of expressions) {
    expect(dialect.sqlToQuery(value).sql).toContain('"semver""functions"');
    expect(extensionExpressionContract(value)?.observability).toBe("tables");
  }
  for (const [alias, canonical] of [
    [extension.equal, o["="]],
    [extension.notEqual, o["<>"]],
    [extension.lessThan, o["<"]],
    [extension.lessOrEqual, o["<="]],
    [extension.greaterThan, o[">"]],
    [extension.greaterOrEqual, o[">="]],
    [extension.compare, f.semver_cmp],
    [extension.major, f.get_semver_major],
    [extension.minor, f.get_semver_minor],
    [extension.patch, f.get_semver_patch],
    [extension.prerelease, f.get_semver_prerelease],
    [extension.hash, f.hash_semver],
    [extension.isValid, f.is_semver],
    [extension.parse, f.semver.text],
    [extension.coerce, f.to_semver],
    [extension.fromInt2, f.semver.int2],
    [extension.fromInt4, f.semver.int4],
    [extension.fromInt8, f.semver.int8],
    [extension.fromFloat4, f.semver.float4],
    [extension.fromFloat8, f.semver.float8],
    [extension.fromNumeric, f.semver.numeric],
    [extension.toText, f.text],
    [extension.larger, f.semver_larger],
    [extension.smaller, f.semver_smaller],
    [extension.max, f.max],
    [extension.min, f.min],
  ] as const)
    expect(alias).toBe(canonical);
  expect(Object.isFrozen(extension.sql.functions)).toBe(true);
  expect(Object.isFrozen(extension.sql.functions.semver)).toBe(true);
  expect(Object.isFrozen(extension.sql.overloads)).toBe(true);
});

test("semver fields declare native search operators and default btree/hash indexes", () => {
  const field = metadata(extension.field());
  expect(field).toMatchObject({ name: "semver", version: "0.40.0", schema: 'semver"functions', type: "semver" });
  expect(field.search).toEqual({ filter: true, comparison: true, order: true, text: false });
  expect(Object.keys(field.operators ?? {}).sort()).toEqual(["eq", "gt", "gte", "lt", "lte", "ne"]);
  expect(field.operators?.eq).toEqual({
    member: "operator:$extension:semver.=($extension:semver.semver,$extension:semver.semver)",
    schema: 'semver"functions',
    name: "=",
    operand: "field",
  });
  for (const make of [
    extension.arrayField,
    extension.rangeField,
    extension.rangeArrayField,
    extension.multirangeField,
    extension.multirangeArrayField,
  ])
    expect(metadata(make()).search).toEqual({ filter: false, comparison: false, order: false, text: false });
  expect(metadata(extension.arrayField()).array).toBe(true);
  expect(metadata(extension.rangeField()).type).toBe("semverrange");
  expect(metadata(extension.multirangeArrayField())).toMatchObject({ type: "semvermultirange", array: true });
  for (const method of ["btree", "hash"] as const)
    expect(extension.indexes[method]()).toMatchObject({
      method,
      opclass: "semver_ops",
      type: "semver",
      default: true,
      input: { schema: 'semver"functions', type: "semver", dimensions: 0 },
    });
});

// Vitest executes the callback; the proof host corroborates events against its independent JSON result.
test(semverUnitProofCase.title, () => {
  const runId = process.env.LOOM_EXTENSION_PROOF_RUN_ID;
  const output = process.env.LOOM_EXTENSION_PROOF_OUTPUT;
  assert.equal(Boolean(runId), Boolean(output));
  const identity = runId ?? "uncollected";
  function record(event: ExtensionProofEvent) {
    if (output) appendFileSync(output, JSON.stringify(event) + "\n", { mode: 0o600 });
  }
  record({ runId: identity, kind: "registered", definition: semverUnitProofCase });
  record({ runId: identity, kind: "started", caseId: semverUnitProofCase.id });
  let passed = false;
  try {
    const selection = { semver: { version: "0.40.0", schema: 'unit"semver' } } as const;
    const resolved = resolveSelectedExtension("semver", selection.semver);
    assert(resolved.manifest);
    expect(resolved.manifest.digest).toBe(digest);
    const required = buildRequiredApi(selection);
    expect(validateRequiredApiForTarget(required)).toEqual(required);
    expect(required?.apis[0]?.manifest.digest).toBe(digest);
    expect(extensionBindingsSource(selection)).toContain(JSON.stringify(digest));
    expect(extensionBindingsSource(selection)).toContain('from "kello/extensions/semver"');
    expect(extensionBindingsSource(selection)).toContain("createSemver_0_40_0");
    expect(extensionBindingsSource(selection)).not.toContain("kello/tooling");
    expect(resolveSelectedExtension("semver", { version: "0.41.0", schema: "extensions" }).adapter).toBeUndefined();
    expect(() =>
      createSemver_0_40_0({
        name: "semver",
        version: "0.40.0",
        schema: "extensions",
        apiSupport: { status: "unverified" },
      }),
    ).toThrow();
    for (const descriptor of [
      { ...extension, apiSupport: { status: "verified" } },
      { ...extension, apiSupport: { status: "verified", digest: "wrong" } },
      { ...extension, name: "pg_semver" },
      { ...extension, version: "0.41.0" },
    ])
      // SAFETY: Deliberately invalid JavaScript descriptors exercise the runtime boundary beyond its static signature.
      expect(() => createSemver_0_40_0(descriptor as never)).toThrow("requires its exact verified contract");
    passed = true;
  } finally {
    record({
      runId: identity,
      kind: "terminal",
      caseId: semverUnitProofCase.id,
      status: passed ? "passed" : "failed",
      witnessFailures: 0,
    });
  }
});
