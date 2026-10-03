import { expect, test } from "vite-plus/test";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createLtreeCodec, ltree } from "../../../apps/loom/src/core/extensions/ltree-codec";
import { nullableCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { int4Codec } from "../../../apps/loom/src/core/extensions/native-codecs";
import { createSqlFunction, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";

const schema = 'Ltree "Scalar_日本';
const codec = createLtreeCodec(schema);

test("ltree.scalarCodec.preservesLosslessTextAndNativeSqlIdentity", () => {
  expect(codec.sqlType).toEqual({ schema, name: "ltree" });
  expect(codec.transport).toBe("text");
  expect(codec.id).toBe(createLtreeCodec("extensions").id);
  for (const input of ["", "Top.Science", "foo-bar.Child_2", "日本語.é", "😀.𐐀", "é.e\u0301"]) {
    expect(ltree(input)).toBe(input);
    expect(codec.encode(input)).toBe(input);
    expect(codec.decode(input)).toBe(input);
  }
  const nullable = nullableCodec(codec);
  expect(nullable.encode(null)).toBeNull();
  expect(nullable.decode(null)).toBeNull();
  expect(nullable.encode("")).toBe("");
  expect(nullable.decode("")).toBe("");
});

test("ltree.scalarCodec.rejectsNonstringAndLossyUtf8Representations", () => {
  for (const input of [null, undefined, 1, true, {}, [], Buffer.from("Top")]) {
    // @ts-expect-error Deliberately exercise the typed encoder's runtime input checks.
    expect(() => codec.encode(input)).toThrow();
    // @ts-expect-error Deliberately exercise the constructor's runtime input checks.
    expect(() => ltree(input)).toThrow();
    expect(() => codec.decode(input)).toThrow();
  }
  for (const input of ["a\0b", "\ud800", "\udc00", "a\ud800b\udc00c", "\ud800\ud800", "😀\udc00"]) {
    expect(() => ltree(input)).toThrow();
    expect(() => codec.encode(input)).toThrow();
    expect(() => codec.decode(input)).toThrow();
  }
});

test("ltree.scalarCodec.leavesSyntaxLocaleAndNativeLimitsToPostgres", () => {
  for (const input of ["a..b", "a b", ".a", "a.", "a".repeat(1001), Array(65536).fill("a").join(".")]) {
    expect(ltree(input)).toBe(input);
    expect(codec.encode(input)).toBe(input);
  }
});

test("ltree.scalarCodec.compilesExactQuotedNativeParameterInsteadOfText", () => {
  const nlevel = createSqlFunction({
    schema,
    name: "nlevel",
    member: "routine:$extension:ltree.nlevel($extension:ltree.ltree)",
    arguments: [nullableCodec(codec)] as const,
    result: nullableCodec(int4Codec),
    dependencies: [],
    observability: "tables",
    authority: "query",
  });
  const dialect = extensionSqlDialect(nodePgCodecs);
  const query = dialect.sqlToQuery(nlevel("Top.Science"));
  expect(query.sql).toBe('"Ltree ""Scalar_日本"."nlevel"($1::"Ltree ""Scalar_日本"."ltree")');
  expect(query.params).toEqual(["Top.Science"]);
  expect(dialect.sqlToQuery(nlevel(null)).params).toEqual([null]);
  expect(dialect.sqlToQuery(nlevel("")).params).toEqual([""]);
});
