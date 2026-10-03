import { expect, test } from "vite-plus/test";
import capture from "../../../apps/loom/src/tooling/extensions/manifests/hstore.json";
import { createHstore_1_8 } from "../../../apps/loom/src/core/extensions/adapters/hstore";
import { nodePgCodecs } from "drizzle-orm/node-postgres/codecs";
import { sql } from "drizzle-orm";
import { extensionExpressionContract, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";

const descriptor = {
  name: "hstore",
  version: "1.8",
  schema: 'Hstore_"Query_日本',
  apiSupport: { status: "verified", digest: capture.digest },
} as const;

test("hstore.privateQueriesRetainAll63PortableMemberIdentities", () => {
  const pending = new Set([
    "routine:$extension:hstore.hstore(pg_catalog.record)",
    "routine:$extension:hstore.populate_record(pg_catalog.anyelement,$extension:hstore.hstore)",
    "operator:$extension:hstore.#=(pg_catalog.anyelement,$extension:hstore.hstore)",
  ]);
  const portable = capture.contract.members.filter(
    (member) =>
      ["routine", "operator", "cast"].includes(member.kind) &&
      !pending.has(member.id) &&
      (member.kind !== "routine" ||
        ![member.returns, ...(member.arguments ?? []).map((argument) => argument.type)].some(
          (type) => type?.namespace === "pg_catalog" && ["cstring", "internal"].includes(type.name),
        )),
  );
  expect(portable).toHaveLength(63);
  expect(Object.keys(createHstore_1_8(descriptor).sql.overloads).sort()).toEqual(
    portable.map((member) => member.id).sort(),
  );
});

test("hstore.privateFactoryRejectsUnverifiedOrWrongContract", () => {
  for (const apiSupport of [{ status: "verified" as const, digest: "wrong" }, { status: "unverified" as const }])
    expect(() => createHstore_1_8({ ...descriptor, apiSupport })).toThrow("exact verified contract");
});

test("hstore.quotedSchemasBoundParametersAndDistinctCastEvidence", () => {
  const api = createHstore_1_8(descriptor);
  const mapping = api.value([{ key: 'key";--日本', value: "value'\\NULL" }]);
  const dialect = extensionSqlDialect(nodePgCodecs);
  const fetched = dialect.sqlToQuery(api.get(mapping, 'key";--日本'));
  expect(fetched.sql).toContain('"Hstore_""Query_日本"."fetchval"');
  expect(fetched.sql).not.toContain("value'");
  expect(fetched.params).toEqual([api.codec.encode(mapping), 'key";--日本']);
  const prefix = dialect.sqlToQuery(api.sql.operators["%#"](mapping));
  expect(prefix.sql).toContain('operator("Hstore_""Query_日本".%#)');
  const array = { dimensions: [{ lowerBound: -2, length: 2 }], values: ["key", "value"] };
  const cast = api.sql.casts.text_array_to_hstore(array);
  const compiled = dialect.sqlToQuery(cast);
  expect(compiled.sql).toContain('"pg_catalog"."text"[]');
  expect(compiled.sql).toContain('"Hstore_""Query_日本"."hstore"');
  expect(compiled.params).toEqual(['[-2:-1]={"key","value"}']);
  expect(extensionExpressionContract(cast)?.member).toBe("cast:pg_catalog._text->$extension:hstore.hstore");
  expect(extensionExpressionContract(api.fromArray(array))?.member).toBe(
    "routine:$extension:hstore.hstore(pg_catalog._text)",
  );
  const aliased = api.fromPair("key", "value").as("mapping");
  const nested = dialect.sqlToQuery(api.sql.casts.hstore_to_jsonb(aliased));
  expect(nested.params).toEqual(["key", "value"]);
  expect(nested.sql).toContain('"Hstore_""Query_日本"."hstore"');
  expect(nested.sql).not.toContain('"mapping"');
  expect(extensionExpressionContract(api.sql.casts.hstore_to_jsonb(sql`NULL`))?.member).toBe(
    "cast:$extension:hstore.hstore->pg_catalog.jsonb",
  );
});

test("hstore.runtimeInputsAndSignedHashSeedsAreChecked", () => {
  const api = createHstore_1_8(descriptor);
  expect(() =>
    api.value([
      { key: "duplicate", value: "one" },
      { key: "duplicate", value: null },
    ]),
  ).toThrow();
  expect(() => api.value([{ key: "nul\0", value: "data" }])).toThrow();
  expect(() => api.value([{ key: "data", value: "\ud800" }])).toThrow();
  // @ts-expect-error Check an invalid runtime scalar, not only the static call signature.
  expect(() => api.get(true, "key")).toThrow();
  // @ts-expect-error Array operands preserve dimensions instead of accepting lossy JS array shorthand.
  expect(() => api.fromArray(["key", "value"])).toThrow();
  // @ts-expect-error Exact native hash seeds are bigint.
  expect(() => api.hashExtended({ entries: [] }, 1)).toThrow();
  expect(() => api.hashExtended({ entries: [] }, 9223372036854775808n)).toThrow();
  expect(() => api.hashExtended({ entries: [] }, -9223372036854775809n)).toThrow();
  for (const seed of [-9223372036854775808n, 9223372036854775807n])
    expect(() => extensionSqlDialect(nodePgCodecs).sqlToQuery(api.hashExtended({ entries: [] }, seed))).not.toThrow();
  for (const array of [
    { dimensions: [{ lowerBound: 2147483647, length: 1 }], values: ["x"] },
    { dimensions: [{ lowerBound: 1, length: 2 }], values: ["x"] },
    {
      dimensions: [
        { lowerBound: 1, length: 1 },
        { lowerBound: 1, length: 2 },
      ],
      values: [["x"], ["y", "z"]],
    },
  ])
    expect(() => api.fromArray(array)).toThrow();
  expect(api.value([{ key: "__proto__", value: null }]).entries).toEqual([{ key: "__proto__", value: null }]);
});

test("hstore.rowSourcesCarryNamedOutColumnsAndPendingMembersRemainAbsent", () => {
  const api = createHstore_1_8(descriptor);
  const rows = api.each({ entries: [{ key: "data", value: null }] }, 'rows"日本');
  const dialect = extensionSqlDialect(nodePgCodecs);
  expect(dialect.sqlToQuery(rows.from).sql).toContain('as "rows""日本"("key", "value")');
  expect(dialect.sqlToQuery(rows.columns.value).sql).toContain('"rows""日本"."value"');
  expect(api.sql.functions).not.toHaveProperty("populate_record");
  expect(api.sql.functions.hstore).not.toHaveProperty("fromRecord");
  expect(api.sql.operators).not.toHaveProperty("#=");
  expect(api).not.toHaveProperty("field");
  expect(api).not.toHaveProperty("indexes");
});

const malformedText = ["\ud800", "\udc00", "suffix\ud800", "\ud800x", "\ud800\ud800", "\udc00\ud800", "nul\0"];

test("hstore.losslessConstructorTextRejectsMalformedUnicodeBeforeBinding", () => {
  const api = createHstore_1_8(descriptor);
  for (const value of malformedText) {
    expect(() => api.fromPair(value, "valid")).toThrow();
    expect(() => api.fromPair("valid", value)).toThrow();
    expect(() => api.sql.functions.tconvert(value, null)).toThrow();
  }
});

test("hstore.losslessLookupAndDeleteTextRejectsMalformedUnicodeBeforeBinding", () => {
  const api = createHstore_1_8(descriptor);
  const mapping = api.value([{ key: "valid", value: null }]);
  for (const value of malformedText) {
    for (const operation of [
      api.get,
      api.hasKey,
      api.isDefined,
      api.delete.byKey,
      api.sql.operators["->"].byKey,
      api.sql.operators["-"].byKey,
      api.sql.operators["?"],
    ])
      expect(() => operation(mapping, value)).toThrow();
  }
});

test("hstore.losslessArrayTextRejectsMalformedUnicodeBeforeBinding", () => {
  const api = createHstore_1_8(descriptor);
  const mapping = api.value([{ key: "valid", value: null }]);
  for (const value of malformedText) {
    const array = { dimensions: [{ lowerBound: -2, length: 2 }], values: ["valid", value] };
    for (const operation of [api.fromArray, api.sql.casts.text_array_to_hstore])
      expect(() => operation(array)).toThrow();
    expect(() => api.fromArrays(array, array)).toThrow();
    for (const operation of [api.getMany, api.hasAllKeys, api.hasAnyKey, api.delete.byKeys, api.slice])
      expect(() => operation(mapping, array)).toThrow();
    expect(() => api.textArrayCodec.decode(`{"valid","${value}"}`)).toThrow();
  }
});

test("hstore.losslessTextPreservesValidNonBmpAndNullableOperands", () => {
  const api = createHstore_1_8(descriptor);
  const dialect = extensionSqlDialect(nodePgCodecs);
  const key = "日本😀𐐀",
    value = "🚀\"\\'";
  expect(dialect.sqlToQuery(api.fromPair(key, value)).params).toEqual([key, value]);
  expect(dialect.sqlToQuery(api.fromPair(key, null)).params).toEqual([key, null]);
  expect(dialect.sqlToQuery(api.get({ entries: [] }, null)).params).toEqual(["", null]);
  const array = { dimensions: [{ lowerBound: -2, length: 2 }], values: [key, null] };
  expect(api.textArrayCodec.decode(api.textArrayCodec.encode(array))).toEqual(array);
});
