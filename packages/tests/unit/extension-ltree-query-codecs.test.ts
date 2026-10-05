import { expect, test } from "vite-plus/test";
import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import {
  createLqueryCodec,
  createLtxtqueryCodec,
  lquery,
  ltxtquery,
} from "../../../apps/loom/src/core/extensions/ltree-query-codecs";
import { createLtreeCodec } from "../../../apps/loom/src/core/extensions/ltree-codec";
import { booleanCodec, nullableCodec } from "../../../apps/loom/src/core/extensions/codecs";
import { createSqlOperator, extensionSqlDialect } from "../../../apps/loom/src/core/extensions/sql";

const schema = 'Ltree "Scalar_日本';
const queryCodec = createLqueryCodec(schema);
const textQueryCodec = createLtxtqueryCodec(schema);

test("ltree.queryScalars.preserveInputAndDistinctNativeIdentities", () => {
  expect(queryCodec.sqlType).toEqual({ schema, name: "lquery" });
  expect(textQueryCodec.sqlType).toEqual({ schema, name: "ltxtquery" });
  expect(queryCodec.id).toBe("ltree:lquery:query:utf8:1");
  expect(textQueryCodec.id).toBe("ltree:ltxtquery:query:utf8:1");
  expect(createLqueryCodec("extensions").id).toBe(queryCodec.id);
  expect(createLtxtqueryCodec("extensions").id).toBe(textQueryCodec.id);
  for (const { construct, codec, nullable, inputs } of [
    {
      construct: lquery,
      codec: queryCodec,
      nullable: nullableCodec(queryCodec),
      inputs: ["Top.*", "*.sport*@.*", "*{0,2}.foo|bar", "日本語.*", "é.e\u0301", "😀.𐐀"],
    },
    {
      construct: ltxtquery,
      codec: textQueryCodec,
      nullable: nullableCodec(textQueryCodec),
      inputs: ["Top & Science", "Top | (Science & !Math)", "foo_bar%*", "日本語 | Science", "é | e\u0301", "😀 | 𐐀"],
    },
  ]) {
    expect(codec.transport).toBe("text");
    expect(nullable.encode(null)).toBeNull();
    expect(nullable.decode(null)).toBeNull();
    expect(nullable.sqlType).toEqual(codec.sqlType);
    expect(nullable.id).toBe(`${codec.id}:nullable`);
    for (const input of inputs) {
      expect(construct(input)).toBe(input);
      expect(codec.encode(input)).toBe(input);
      expect(codec.decode(input)).toBe(input);
      expect(nullable.encode(input)).toBe(input);
      expect(nullable.decode(input)).toBe(input);
    }
  }
});

test("ltree.queryScalars.rejectNonstringsNulAndUnpairedSurrogates", () => {
  for (const { construct, codec } of [
    { construct: lquery, codec: queryCodec },
    { construct: ltxtquery, codec: textQueryCodec },
  ]) {
    for (const input of [null, undefined, 1, true, {}, [], Buffer.from("Top")]) {
      // @ts-expect-error Exercise runtime validation of the string-only constructor.
      expect(() => construct(input)).toThrow();
      // @ts-expect-error Exercise runtime validation of the string-only encoder.
      expect(() => codec.encode(input)).toThrow();
      expect(() => codec.decode(input)).toThrow();
    }
    for (const input of ["a\0b", "\ud800", "\udc00", "a\ud800b\udc00c", "\ud800\ud800", "😀\udc00"]) {
      expect(() => construct(input)).toThrow();
      expect(() => codec.encode(input)).toThrow();
      expect(() => codec.decode(input)).toThrow();
    }
  }
});

test("ltree.queryScalars.leaveGrammarCanonicalizationAndLimitsToPostgres", () => {
  for (const input of ["", "a..b", "a b", "!", "Top && Science", "(", "  Top.*  ", "a".repeat(1001)]) {
    expect(lquery(input)).toBe(input);
    expect(ltxtquery(input)).toBe(input);
    expect(queryCodec.encode(input)).toBe(input);
    expect(textQueryCodec.encode(input)).toBe(input);
  }
});

const matchesQuery = createSqlOperator({
  schema,
  name: "~",
  member: "operator:$extension:ltree.~($extension:ltree.ltree,$extension:ltree.lquery)",
  left: nullableCodec(createLtreeCodec(schema)),
  right: nullableCodec(queryCodec),
  result: nullableCodec(booleanCodec),
  dependencies: [],
  observability: "tables",
  authority: "query",
});
const matchesTextQuery = createSqlOperator({
  schema,
  name: "@",
  member: "operator:$extension:ltree.@($extension:ltree.ltree,$extension:ltree.ltxtquery)",
  left: nullableCodec(createLtreeCodec(schema)),
  right: nullableCodec(textQueryCodec),
  result: nullableCodec(booleanCodec),
  dependencies: [],
  observability: "tables",
  authority: "query",
});

test("ltree.queryScalars.compileQuotedNativeOperandsAndComposeBooleanResults", () => {
  const dialect = extensionSqlDialect(nodePgCodecs);
  const query = dialect.sqlToQuery(matchesQuery("Top.Science", "Top.*"));
  expect(query.sql).toBe(
    '($1::"Ltree ""Scalar_日本"."ltree" operator("Ltree ""Scalar_日本".~) $2::"Ltree ""Scalar_日本"."lquery")',
  );
  expect(query.params).toEqual(["Top.Science", "Top.*"]);
  const textQuery = dialect.sqlToQuery(matchesTextQuery("Top.Science", "Top & Science"));
  expect(textQuery.sql).toBe(
    '($1::"Ltree ""Scalar_日本"."ltree" operator("Ltree ""Scalar_日本".@) $2::"Ltree ""Scalar_日本"."ltxtquery")',
  );
  expect(textQuery.params).toEqual(["Top.Science", "Top & Science"]);
  expect(dialect.sqlToQuery(matchesQuery(null, "Top.*")).params).toEqual([null, "Top.*"]);
  expect(dialect.sqlToQuery(matchesTextQuery("Top.Science", null)).params).toEqual(["Top.Science", null]);
  const composed = dialect.sqlToQuery(
    sql`${matchesQuery("Top.Science", "Top.*")} and ${matchesTextQuery("Top.Science", "Top & Science")}`,
  );
  expect(composed.sql).toBe(`${query.sql} and ${textQuery.sql.replaceAll("$1", "$3").replaceAll("$2", "$4")}`);
  expect(composed.params).toEqual(["Top.Science", "Top.*", "Top.Science", "Top & Science"]);
});
