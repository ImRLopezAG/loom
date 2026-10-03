import { expectTypeOf } from "vite-plus/test";
import { sql, type SQL } from "drizzle-orm";
import {
  createLqueryCodec,
  createLtxtqueryCodec,
  lquery,
  ltxtquery,
  type Lquery,
  type Ltxtquery,
} from "../../../apps/loom/src/core/extensions/ltree-query-codecs";
import { createLtreeCodec, type Ltree } from "../../../apps/loom/src/core/extensions/ltree-codec";
import {
  booleanCodec,
  nullableCodec,
  type CodecInput,
  type CodecOutput,
} from "../../../apps/loom/src/core/extensions/codecs";
import {
  checkedExtensionExpression,
  createSqlOperator,
  extensionSqlType,
} from "../../../apps/loom/src/core/extensions/sql";

const queryCodec = createLqueryCodec("extensions");
const textQueryCodec = createLtxtqueryCodec("extensions");
const nullableQuery = nullableCodec(queryCodec);
const nullableTextQuery = nullableCodec(textQueryCodec);
expectTypeOf<CodecInput<typeof queryCodec>>().toEqualTypeOf<string>();
expectTypeOf<CodecOutput<typeof queryCodec>>().toEqualTypeOf<Lquery>();
expectTypeOf<CodecInput<typeof textQueryCodec>>().toEqualTypeOf<string>();
expectTypeOf<CodecOutput<typeof textQueryCodec>>().toEqualTypeOf<Ltxtquery>();
expectTypeOf<CodecInput<typeof nullableQuery>>().toEqualTypeOf<string | null>();
expectTypeOf<CodecOutput<typeof nullableQuery>>().toEqualTypeOf<Lquery | null>();
expectTypeOf<CodecInput<typeof nullableTextQuery>>().toEqualTypeOf<string | null>();
expectTypeOf<CodecOutput<typeof nullableTextQuery>>().toEqualTypeOf<Ltxtquery | null>();
expectTypeOf(lquery("Top.*")).toEqualTypeOf<Lquery>();
expectTypeOf(ltxtquery("Top & Science")).toEqualTypeOf<Ltxtquery>();
expectTypeOf(queryCodec.decode("Top.*")).toEqualTypeOf<Lquery>();
expectTypeOf(textQueryCodec.decode("Top & Science")).toEqualTypeOf<Ltxtquery>();
expectTypeOf<Lquery>().toExtend<string>();
expectTypeOf<Ltxtquery>().toExtend<string>();
queryCodec.encode("Top.*");
textQueryCodec.encode("Top & Science");
nullableQuery.encode(null);
nullableTextQuery.encode(null);
// @ts-expect-error Plain strings have no output brand.
const _unbrandedQuery: Lquery = "Top.*";
// @ts-expect-error Plain strings have no output brand.
const _unbrandedTextQuery: Ltxtquery = "Top & Science";
// @ts-expect-error Scalar query brands are distinct.
const _wrongQuery: Lquery = ltxtquery("Top");
// @ts-expect-error Scalar query brands are distinct.
const _wrongTextQuery: Ltxtquery = lquery("Top");
// @ts-expect-error Nonstring inputs are rejected.
queryCodec.encode(true);
// @ts-expect-error Nonstring inputs are rejected.
textQueryCodec.encode(1);
// @ts-expect-error Only nullable wrappers accept null.
queryCodec.encode(null);
// @ts-expect-error Only nullable wrappers accept null.
textQueryCodec.encode(null);
// @ts-expect-error Constructors accept only string input.
lquery(false);
// @ts-expect-error Constructors accept only string input.
ltxtquery(1);
// @ts-expect-error Decoder output has no caller-selected generic.
queryCodec.decode<string>("Top.*");
// @ts-expect-error Decoder output has no caller-selected generic.
textQueryCodec.decode<string>("Top");

const matchesQuery = createSqlOperator({
  schema: "extensions",
  name: "~",
  member: "operator:$extension:ltree.~($extension:ltree.ltree,$extension:ltree.lquery)",
  left: nullableCodec(createLtreeCodec("extensions")),
  right: nullableQuery,
  result: nullableCodec(booleanCodec),
  dependencies: [],
  observability: "tables",
  authority: "query",
});
const matchesTextQuery = createSqlOperator({
  schema: "extensions",
  name: "@",
  member: "operator:$extension:ltree.@($extension:ltree.ltree,$extension:ltree.ltxtquery)",
  left: nullableCodec(createLtreeCodec("extensions")),
  right: nullableTextQuery,
  result: nullableCodec(booleanCodec),
  dependencies: [],
  observability: "tables",
  authority: "query",
});
expectTypeOf(matchesQuery("Top.Science", "Top.*")).toEqualTypeOf<SQL<boolean | null>>();
expectTypeOf(matchesTextQuery("Top.Science", "Top & Science")).toEqualTypeOf<SQL<boolean | null>>();
matchesQuery(null, null);
matchesTextQuery(null, null);
matchesQuery(sql<Ltree>`path`, sql<Lquery>`query`);
matchesQuery("Top.Science", sql<Lquery>`query`.as("query"));
matchesTextQuery(sql<Ltree>`path`, sql<Ltxtquery>`query`);
matchesTextQuery("Top.Science", sql<Ltxtquery>`query`.as("query"));
// @ts-expect-error ltxtquery SQL is not lquery SQL.
matchesQuery("Top.Science", sql<Ltxtquery>`query`);
// @ts-expect-error Native ltree SQL is not lquery SQL.
matchesQuery("Top.Science", sql<Ltree>`path`);
// @ts-expect-error SQL text lacks the native lquery brand.
matchesQuery("Top.Science", sql<string>`text`);
// @ts-expect-error SQL boolean is not lquery SQL.
matchesQuery("Top.Science", sql<boolean>`flag`);
// @ts-expect-error Boolean literals are not query input.
matchesQuery("Top.Science", true);
// @ts-expect-error lquery SQL is not ltxtquery SQL.
matchesTextQuery("Top.Science", sql<Lquery>`query`);
// @ts-expect-error Native ltree SQL is not ltxtquery SQL.
matchesTextQuery("Top.Science", sql<Ltree>`path`);
// @ts-expect-error SQL text lacks the native ltxtquery brand.
matchesTextQuery("Top.Science", sql<string>`text`);
// @ts-expect-error SQL boolean is not ltxtquery SQL.
matchesTextQuery("Top.Science", sql<boolean>`flag`);
// @ts-expect-error Boolean literals are not query input.
matchesTextQuery("Top.Science", true);
// @ts-expect-error Operator results are codec determined.
matchesQuery<string>("Top.Science", "Top.*");
// @ts-expect-error Operator results are codec determined.
matchesTextQuery<string>("Top.Science", "Top");

const queryExpression = checkedExtensionExpression(
  sql`${sql.param("Top.*")}::${extensionSqlType("extensions", "lquery")}`,
  queryCodec,
  [],
);
const textQueryExpression = checkedExtensionExpression(
  sql`${sql.param("Top & Science")}::${extensionSqlType("extensions", "ltxtquery")}`,
  textQueryCodec,
  [],
);
expectTypeOf(queryExpression).toEqualTypeOf<SQL<Lquery>>();
expectTypeOf(textQueryExpression).toEqualTypeOf<SQL<Ltxtquery>>();
matchesQuery("Top.Science", queryExpression);
matchesTextQuery("Top.Science", textQueryExpression);
// @ts-expect-error A decoded native result retains its distinct SQL brand.
matchesQuery("Top.Science", textQueryExpression);
// @ts-expect-error A decoded native result retains its distinct SQL brand.
matchesTextQuery("Top.Science", queryExpression);
