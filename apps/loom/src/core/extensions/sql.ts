import * as v from "valibot";
import { decodeFailure } from "./codecs";
import { AsyncLocalStorage } from "node:async_hooks";
import { sql, type AnyColumn, type Column, type SQL, type SQLWrapper } from "drizzle-orm";
import { customType, pgTable, PgDialect } from "drizzle-orm/pg-core";
import { getColumnFromDecoder } from "drizzle-orm/utils";
import type { BuildRelationalQueryResult } from "drizzle-orm/relations";
import type { PgCodecs, PostgresColumnType } from "drizzle-orm/pg-core/codecs";
import type { CodecInput, CodecOutput, ExtensionCodec } from "./codecs";

export interface ExtensionExpressionContract {
  readonly member: string;
  readonly codec: string;
  readonly dependencies: readonly string[];
  readonly observability: "tables" | "external" | "session";
}
/** Invocation-local dependency checks carry no database authority. */
export interface ExtensionSqlExecution {
  readonly check: (contract: ExtensionExpressionContract) => void;
}
const execution = new AsyncLocalStorage<ExtensionSqlExecution>();
const compilation = new AsyncLocalStorage<boolean>();
export function withExtensionSqlExecution<Result>(checker: ExtensionSqlExecution, work: () => Result): Result {
  return execution.run(checker, work);
}
const contracts = new WeakMap<SQL, ExtensionExpressionContract>();
export function extensionExpressionContract(expression: SQL): ExtensionExpressionContract | undefined {
  return contracts.get(expression);
}
type AnyCodec = ExtensionCodec<never, unknown>;
export type ExtensionSqlInput<Codec extends AnyCodec> =
  | CodecInput<Codec>
  | SQL<CodecOutput<Codec>>
  | AnyColumn<{ data: CodecOutput<Codec> }>;
export interface DefaultSqlArgument<
  Codec extends AnyCodec = AnyCodec,
  Name extends string | undefined = string | undefined,
> {
  readonly default: true;
  readonly codec: Codec;
  readonly name: Name;
}
export function defaultSqlArgument<Codec extends AnyCodec>(codec: Codec): DefaultSqlArgument<Codec, undefined>;
export function defaultSqlArgument<Codec extends AnyCodec, const Name extends string | undefined>(
  codec: Codec,
  name: Name,
): DefaultSqlArgument<Codec, Name>;
export function defaultSqlArgument(codec: AnyCodec, name?: string): DefaultSqlArgument {
  return Object.freeze({ default: true, codec, name });
}
type SqlArgument = AnyCodec | DefaultSqlArgument;
type ArgumentCodec<Argument> =
  Argument extends DefaultSqlArgument<infer Codec> ? Codec : Argument extends AnyCodec ? Argument : never;
type NamedArguments<Arguments extends readonly SqlArgument[]> = Arguments extends readonly [
  infer Head extends SqlArgument,
  ...infer Tail extends readonly SqlArgument[],
]
  ? Head extends DefaultSqlArgument
    ? [value?: ExtensionSqlInput<ArgumentCodec<Head>>, ...NamedArguments<Tail>]
    : [value: ExtensionSqlInput<ArgumentCodec<Head>>, ...NamedArguments<Tail>]
  : [];
type PrefixArguments<Arguments extends readonly SqlArgument[]> = Arguments extends readonly [
  infer Head extends SqlArgument,
  ...infer Tail extends readonly SqlArgument[],
]
  ? Head extends DefaultSqlArgument
    ? [] | [value: ExtensionSqlInput<ArgumentCodec<Head>>, ...PrefixArguments<Tail>]
    : [value: ExtensionSqlInput<ArgumentCodec<Head>>, ...PrefixArguments<Tail>]
  : [];
type RequiredArguments<Arguments extends readonly SqlArgument[]> = {
  -readonly [Index in keyof Arguments]: ExtensionSqlInput<ArgumentCodec<Arguments[Index]>>;
};
type UnnamedDefault<Argument> =
  Argument extends DefaultSqlArgument<AnyCodec, infer Name> ? (undefined extends Name ? Argument : never) : never;
type ArgumentTuple<Arguments extends readonly SqlArgument[]> = [UnnamedDefault<Arguments[number]>] extends [never]
  ? NamedArguments<Arguments>
  : PrefixArguments<Arguments>;
type CallArguments<
  Arguments extends readonly SqlArgument[],
  Variadic extends AnyCodec | undefined,
> = Variadic extends AnyCodec
  ? PrefixArguments<Arguments> | [...RequiredArguments<Arguments>, ...ExtensionSqlInput<Variadic>[]]
  : ArgumentTuple<Arguments>;
export type ExtensionSqlDefinition<
  Arguments extends readonly SqlArgument[],
  Result extends AnyCodec,
  Variadic extends AnyCodec | undefined = undefined,
> = {
  readonly schema: string;
  readonly name: string;
  readonly member: string;
  readonly arguments: Arguments;
  readonly result: Result;
  readonly variadic?: Variadic;
  readonly variadicDefault?: boolean;
  readonly dependencies: readonly string[];
  readonly observability: "tables" | "external" | "session";
  readonly authority: "query";
};
function identifier(value: string): SQL {
  if (!value || value.includes("\0")) throw new Error("Invalid PostgreSQL identifier");
  return sql`${sql.identifier(value)}`;
}
export function extensionSqlType(schema: string, name: string): SQL {
  return sql`${identifier(schema)}.${identifier(name)}`;
}
function argumentCodec(argument: SqlArgument): AnyCodec {
  return "default" in argument ? argument.codec : argument;
}
const sqlWrapper = v.custom<SQLWrapper>((value) => v.is(v.object({ getSQL: v.function() }), value));
function parameter<Value>(value: Value, codec: AnyCodec): SQL {
  if (v.is(sqlWrapper, value)) return sql`${value}`;
  // SAFETY: definition call positions pair input with its codec; codec.encode validates before binding.
  const bound = sql`${sql.param(codec.encode(value as never))}`;
  return codec.sqlType
    ? sql`${bound}::${extensionSqlType(codec.sqlType.schema, codec.sqlType.name)}${codec.sqlType.array ? sql`[]` : sql.empty()}`
    : bound;
}
function definitionCall<
  Arguments extends readonly SqlArgument[],
  Result extends AnyCodec,
  Variadic extends AnyCodec | undefined,
>(definition: ExtensionSqlDefinition<Arguments, Result, Variadic>, values: readonly unknown[], distinct = false): SQL {
  if (definition.authority !== "query") throw new Error("Stateful extension members require explicit operator tooling");
  const required = definition.arguments.findIndex((argument) => "default" in argument);
  const minimum = required === -1 ? definition.arguments.length : required;
  if (definition.arguments.slice(minimum).some((argument) => !("default" in argument)))
    throw new Error("SQL defaults must be trailing");
  if (values.length < minimum || (!definition.variadic && values.length > definition.arguments.length))
    throw new Error("Invalid extension SQL argument count");
  const named =
    !definition.variadic &&
    definition.arguments.every((argument) => !("default" in argument) || argument.name !== undefined);
  const parameters: SQL[] = [];
  for (const [index, argument] of definition.arguments.entries()) {
    if (index >= values.length) break;
    const value = values[index];
    if ("default" in argument && named) {
      if (value !== undefined)
        parameters.push(sql`${identifier(argument.name!)} => ${parameter(value, argument.codec)}`);
    } else parameters.push(parameter(value, argumentCodec(argument)));
  }
  if (
    definition.variadic &&
    values.length >= definition.arguments.length &&
    (values.length > definition.arguments.length || !definition.variadicDefault)
  ) {
    const type = definition.variadic.sqlType;
    if (!type || type.array) throw new Error("SQL variadics require their captured element type");
    const elements = values.slice(definition.arguments.length).map((value) => parameter(value, definition.variadic!));
    parameters.push(sql`variadic ARRAY[${sql.join(elements, sql`, `)}]::${extensionSqlType(type.schema, type.name)}[]`);
  }
  return sql`${extensionSqlType(definition.schema, definition.name)}(${distinct ? sql`distinct ` : sql.empty()}${sql.join(parameters, sql`, `)})`;
}
const nativeProjection = "loom:extension:native";
const textProjection = "loom:extension:text";
const projectionColumns = new WeakMap<AnyCodec, Column>();
const columnCodecs = new WeakMap<Column, AnyCodec>();
function projectionColumn<Result extends AnyCodec>(codec: Result): Column {
  const cached = projectionColumns.get(codec);
  if (cached) return cached;
  const value = customType<{ data: CodecOutput<Result>; driverData: unknown }>({
    dataType: () => "text",
    // SAFETY: these private dictionary keys are installed only on Loom's dialect.
    codec: (codec.transport === "text" ? textProjection : nativeProjection) as PostgresColumnType,
    fromDriver: (value) => {
      // SAFETY: Result is the exact codec whose output parameter determines the selected expression type.
      return decodeFailure(() => codec.decode(value)) as CodecOutput<Result>;
    },
  });
  // Decoder metadata only; no table is installed or queried.
  const column = pgTable("_loom_extension_expression", { value: value() }).value;
  projectionColumns.set(codec, column);
  columnCodecs.set(column, codec);
  return column;
}
/** Scalar SQL stays native. JSON selections cast exact values before JSON can round them. */
export function extensionSqlCodecs(base: PgCodecs): PgCodecs {
  const codecs = {
    ...base,
    [nativeProjection]: {},
    [textProjection]: { castInJson: (expression: SQLWrapper) => sql`(${expression})::text` },
  };
  return codecs;
}
type SelectedField = BuildRelationalQueryResult["selection"][number]["field"];
function expressionCodec(field: SelectedField): AnyCodec | undefined {
  if (!v.is(sqlWrapper, field)) return undefined;
  const column = getColumnFromDecoder(field);
  return column ? columnCodecs.get(column) : undefined;
}
interface MappedRow {
  // oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- Drizzle selections may contain any checked codec output; the private record boundary validates identity before NULL completion.
  [key: string]: unknown;
}
// Custom validation retains the mapper-owned record identity; NULL completion mutates that same result.
const mappedRow = v.custom<MappedRow>((value) => v.is(v.record(v.string(), v.unknown()), value));
function decodeNullAtPath<Row>(row: Row, path: readonly string[], codec: AnyCodec): void {
  let node = v.safeParse(mappedRow, row);
  for (const part of path.slice(0, -1)) {
    if (!node.success) return;
    node = v.safeParse(mappedRow, node.output[part]);
  }
  const key = path.at(-1);
  if (key !== undefined && node.success && node.output[key] === null)
    node.output[key] = decodeFailure(() => codec.decode(null));
}
function decodeRelationalNulls<Row>(row: Row, selection: BuildRelationalQueryResult["selection"]): void {
  const record = v.safeParse(mappedRow, row);
  if (!record.success) return;
  for (const entry of selection) {
    const value = record.output[entry.key];
    if (entry.selection) {
      if (entry.isArray && Array.isArray(value))
        for (const child of value) decodeRelationalNulls(child, entry.selection);
      else decodeRelationalNulls(value, entry.selection);
    } else {
      const codec = expressionCodec(entry.field);
      if (codec && value === null) record.output[entry.key] = decodeFailure(() => codec.decode(null));
    }
  }
}
/** Drizzle skips NULL decoders; complete that contract without changing SQL semantics. */
export function extensionSqlDialect(base: PgCodecs): PgDialect {
  const dialect = new PgDialect({ codecs: extensionSqlCodecs(base) });
  const compile = dialect.sqlToQuery.bind(dialect);
  const compileTagged = dialect._sqlToQuery.bind(dialect);
  dialect.sqlToQuery = (query, source) => compilation.run(true, () => compile(query, source));
  dialect._sqlToQuery = (query) => compilation.run(true, () => compileTagged(query));
  const rows = dialect.mapperGenerators.rows;
  const relationalRows = dialect.mapperGenerators.relationalRows;
  dialect.mapperGenerators.rows = (columns, joins) => {
    const map = rows(columns, joins);
    const checked = columns.flatMap(({ field, path }) => {
      const codec = expressionCodec(field);
      return codec ? [{ path, codec }] : [];
    });
    return (values) => {
      const result = map(values);
      if (Array.isArray(result))
        for (const row of result) for (const entry of checked) decodeNullAtPath(row, entry.path, entry.codec);
      return result;
    };
  };
  dialect.mapperGenerators.relationalRows = (config) => {
    const map = relationalRows(config);
    return (values) => {
      const result = map(values);
      if (config.isFirst) decodeRelationalNulls(result, config.selection);
      else if (Array.isArray(result)) for (const row of result) decodeRelationalNulls(row, config.selection);
      return result;
    };
  };
  return dialect;
}
function mapped<Result extends AnyCodec>(
  expression: SQL,
  definition: Pick<
    ExtensionSqlDefinition<readonly SqlArgument[], Result>,
    "member" | "result" | "dependencies" | "observability"
  >,
): SQL<CodecOutput<Result>> {
  const contract = Object.freeze({
    member: definition.member,
    codec: definition.result.id,
    dependencies: Object.freeze([...definition.dependencies]),
    observability: definition.observability,
  });
  const checked: SQLWrapper = {
    shouldOmitSQLParens: () => true,
    getSQL() {
      if (!compilation.getStore()) throw new Error("Checked extension SQL requires a Loom database connection");
      execution.getStore()?.check(contract);
      return sql.empty();
    },
  };
  const result = sql`${checked}${expression}`.mapWith(projectionColumn(definition.result));
  contracts.set(result, contract);
  // SAFETY: the checked result codec is the sole source of the expression output type.
  return result as SQL<CodecOutput<Result>>;
}
export function createSqlFunction<
  const Arguments extends readonly SqlArgument[],
  Result extends AnyCodec,
  Variadic extends AnyCodec | undefined = undefined,
>(
  definition: ExtensionSqlDefinition<Arguments, Result, Variadic>,
): (...values: CallArguments<Arguments, Variadic>) => SQL<CodecOutput<Result>> {
  return (...values) => mapped(definitionCall(definition, values), definition);
}
export interface ExtensionSqlWindow {
  readonly partitionBy?: readonly SQLWrapper[];
  readonly orderBy?: readonly SQLWrapper[];
}
function windowSql(window: ExtensionSqlWindow): SQL {
  return sql`(${
    window.partitionBy?.length
      ? sql`partition by ${sql.join(
          window.partitionBy.map((entry) => sql`${entry}`),
          sql`, `,
        )}`
      : sql.empty()
  }${window.partitionBy?.length && window.orderBy?.length ? sql` ` : sql.empty()}${
    window.orderBy?.length
      ? sql`order by ${sql.join(
          window.orderBy.map((entry) => sql`${entry}`),
          sql`, `,
        )}`
      : sql.empty()
  })`;
}
export function createSqlAggregate<const Arguments extends readonly SqlArgument[], Result extends AnyCodec>(
  definition: ExtensionSqlDefinition<Arguments, Result>,
) {
  const call = createSqlFunction(definition);
  return Object.assign(call, {
    distinct: (...values: ArgumentTuple<Arguments>) => mapped(definitionCall(definition, values, true), definition),
    filter: (condition: SQL<boolean>, ...values: ArgumentTuple<Arguments>) =>
      mapped(sql`${definitionCall(definition, values)} filter (where ${condition})`, definition),
    over: (window: ExtensionSqlWindow, ...values: ArgumentTuple<Arguments>) =>
      mapped(sql`${definitionCall(definition, values)} over ${windowSql(window)}`, definition),
  });
}
export function createSqlWindow<const Arguments extends readonly SqlArgument[], Result extends AnyCodec>(
  definition: ExtensionSqlDefinition<Arguments, Result>,
) {
  return (window: ExtensionSqlWindow, ...values: ArgumentTuple<Arguments>) =>
    mapped(sql`${definitionCall(definition, values)} over ${windowSql(window)}`, definition);
}
/** Set-returning functions expand selected rows; a composite codec defines record output. */
export const createSqlRows = createSqlFunction;
export function createSqlOperator<
  Left extends AnyCodec | undefined,
  Right extends AnyCodec | undefined,
  Result extends AnyCodec,
>(definition: {
  readonly schema: string;
  readonly name: string;
  readonly member: string;
  readonly left: Left;
  readonly right: Right;
  readonly result: Result;
  readonly dependencies: readonly string[];
  readonly observability: "tables" | "external" | "session";
  readonly authority: "query";
}): (
  ...values: Left extends AnyCodec
    ? Right extends AnyCodec
      ? [left: ExtensionSqlInput<Left>, right: ExtensionSqlInput<Right>]
      : [left: ExtensionSqlInput<Left>]
    : Right extends AnyCodec
      ? [right: ExtensionSqlInput<Right>]
      : never
) => SQL<CodecOutput<Result>> {
  if (
    !/^[+\-*/<>=~!@#%^&|`?]+$/.test(definition.name) ||
    definition.name.includes("--") ||
    definition.name.includes("/*")
  )
    throw new Error("Invalid PostgreSQL operator");
  if (!definition.left && !definition.right) throw new Error("PostgreSQL operator requires an operand");
  return (...values) => {
    if (definition.authority !== "query")
      throw new Error("Stateful extension members require explicit operator tooling");
    const count = Number(Boolean(definition.left)) + Number(Boolean(definition.right));
    if (values.length !== count) throw new Error("Invalid extension operator argument count");
    const operator = sql`operator(${identifier(definition.schema)}.${sql.raw(definition.name)})`;
    const expression =
      definition.left && definition.right
        ? sql`(${parameter(values[0], definition.left)} ${operator} ${parameter(values[1], definition.right)})`
        : definition.left
          ? sql`(${parameter(values[0], definition.left)} ${operator})`
          : sql`(${operator} ${parameter(values[0], definition.right!)})`;
    return mapped(expression, definition);
  };
}
/** Non-query members are descriptors, deliberately not SQL expressions or callable RPC helpers. */
export function statefulSqlMember<const Member extends string>(member: Member, authority: "operator" | "session") {
  return Object.freeze({ member, authority });
}
