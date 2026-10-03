import { sql, type SQL } from "drizzle-orm";
import { pgTable, text, boolean } from "drizzle-orm/pg-core";
import { extensionRows } from "../../../apps/loom/src/core/extensions/rows";
import * as v from "valibot";
import {
  createSqlFunction,
  createSqlAggregate,
  createSqlWindow,
  createSqlRows,
  createSqlOperator,
  defaultSqlArgument,
  statefulSqlMember,
} from "../../../apps/loom/src/core/extensions/sql";
import {
  arrayCodec,
  compositeCodec,
  createExtensionCodec,
  integerCodec,
  nullableCodec,
  textCodec,
  type PostgreSqlArray,
} from "../../../apps/loom/src/core/extensions/codecs";
const table = pgTable("documents", { title: text().notNull(), enabled: boolean().notNull() });
const base = {
  schema: "extensions",
  member: "typed:member",
  dependencies: ["documents"],
  observability: "tables" as const,
  authority: "query" as const,
};
const length = createSqlFunction({ ...base, name: "length", arguments: [textCodec] as const, result: integerCodec });
const result: SQL<bigint> = length(table.title);
length(sql<string>`title`);
length(sql<string>`title`.as("title"));
// @ts-expect-error Aliases retain their boolean result and cannot become text inputs.
length(sql<boolean>`true`.as("enabled"));
// @ts-expect-error Boolean columns do not satisfy a text argument.
length(table.enabled);
// @ts-expect-error Boolean literals do not satisfy a text argument.
length(false);
// @ts-expect-error Return type comes from the checked codec, not a supplied generic.
length<number>("title");
// @ts-expect-error Wrong argument count.
length("one", "two");
const defaults = createSqlFunction({
  ...base,
  name: "default",
  arguments: [textCodec, defaultSqlArgument(integerCodec, "b")] as const,
  result: textCodec,
});
// @ts-expect-error A named default must supply its runtime PostgreSQL name.
defaultSqlArgument<typeof integerCodec, "b">(integerCodec);
defaults("one");
defaults("one", 2n);
// @ts-expect-error Optional integer argument is exact bigint.
defaults("one", 2);
const variadic = createSqlFunction({
  ...base,
  name: "variadic",
  arguments: [textCodec] as const,
  variadic: textCodec,
  result: textCodec,
});
variadic("one");
variadic("one", "two");
// @ts-expect-error Variadic arguments are type checked too.
variadic("one", false);
const aggregate = createSqlAggregate({
  ...base,
  name: "aggregate",
  arguments: [textCodec] as const,
  result: nullableCodec(integerCodec),
});
const aggregated: SQL<bigint | null> = aggregate.filter(sql<boolean>`true`, table.title);
aggregate.distinct(table.title);
aggregate(sql<string>`title`.as("title"));
aggregate.over({ orderBy: [table.title] }, table.title);
const window = createSqlWindow({ ...base, name: "window", arguments: [] as const, result: integerCodec });
const indexed: SQL<bigint> = window({ orderBy: [table.title] });
const record = compositeCodec("record", { title: textCodec, count: integerCodec });
const rows = createSqlRows({ ...base, name: "rows", arguments: [integerCodec] as const, result: record });
const row: SQL<{ readonly title: string; readonly count: bigint }> = rows(1n);
const namedRows = extensionRows(rows(1n), "named_rows", { title: textCodec, count: integerCodec }, "named");
const namedTitle: SQL<string> = namedRows.columns.title;
const namedCount: SQL<bigint> = namedRows.columns.count;
// @ts-expect-error Named OUT columns keep their checked output types.
const wrongNamedCount: SQL<number> = namedRows.columns.count;
// @ts-expect-error Column keys come from the exact captured row shape.
void namedRows.columns.missing;
// @ts-expect-error Only captured named outputs or anonymous records determine row layout.
extensionRows(rows(1n), "named_rows", { title: textCodec }, "unchecked");
void [namedTitle, namedCount, wrongNamedCount];
const array = arrayCodec(integerCodec);
const arrayInput: PostgreSqlArray<bigint> = { dimensions: [{ lowerBound: 0, length: 2 }], values: [1n, null] };
array.encode(arrayInput);
// @ts-expect-error Precision-preserving integers reject JS numbers.
array.encode({ dimensions: [{ lowerBound: 1, length: 1 }], values: [1] });
const brandedSchema = v.pipe(v.string(), v.regex(/^EPSG:\d+$/), v.brand("SRID"));
const srid = createExtensionCodec({
  id: "srid:1",
  input: brandedSchema,
  output: brandedSchema,
  transport: "native",
  encode: (value) => value,
  decode: (value) => value,
});
const branded = createSqlFunction({ ...base, name: "srid", arguments: [] as const, result: srid });
const sridResult: SQL<v.InferOutput<typeof brandedSchema>> = branded();
const operator = createSqlOperator({
  ...base,
  name: "%",
  left: textCodec,
  right: textCodec,
  result: nullableCodec(integerCodec),
});
operator(table.title, "value");
operator(sql<string>`title`.as("title"), "value");
// @ts-expect-error Operator operands obey their declared codec contract.
operator(table.title, false);
const maintenance = statefulSqlMember("cron:schedule", "operator");
// @ts-expect-error Stateful members are not callable SQL helpers.
maintenance();
// @ts-expect-error Query builder definitions cannot expose operator authority.
createSqlFunction({ ...base, authority: "operator", name: "schedule", arguments: [] as const, result: textCodec });
void [result, aggregated, indexed, row, sridResult];

const unnamedDefaults = createSqlFunction({
  ...base,
  name: "unnamed",
  arguments: [textCodec, defaultSqlArgument(integerCodec), defaultSqlArgument(integerCodec)] as const,
  result: textCodec,
});
unnamedDefaults("a");
unnamedDefaults("a", 1n);
unnamedDefaults("a", 1n, 2n);
// @ts-expect-error unnamed PostgreSQL defaults admit prefix arities, not middle holes
unnamedDefaults("a", undefined, 2n);
const namedDefaults = createSqlFunction({
  ...base,
  name: "named",
  arguments: [textCodec, defaultSqlArgument(integerCodec, "b"), defaultSqlArgument(integerCodec, "c")] as const,
  result: textCodec,
});
namedDefaults("a", undefined, 2n);
const defaultVariadic = createSqlFunction({
  ...base,
  name: "default_variadic",
  variadicDefault: true,
  arguments: [textCodec, defaultSqlArgument(integerCodec, "b")] as const,
  variadic: integerCodec,
  result: textCodec,
});
defaultVariadic("a");
defaultVariadic("a", 1n, 2n);
// @ts-expect-error PostgreSQL cannot resolve named/default holes with variadic array notation
defaultVariadic("a", undefined, 2n);
