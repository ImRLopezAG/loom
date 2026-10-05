import * as v from "valibot";
import { decodeFailure } from "./codecs";
import { unwrapDriverJson, markJsonTransportMapper, extensionTextProjection } from "./json-transport";
import { AsyncLocalStorage } from "node:async_hooks";
import {
  sql,
  is,
  Column,
  SQL,
  Subquery,
  getColumnTable,
  type AnyColumn,
  type SQLWrapper,
  type Query,
  type SQLChunk,
  type DriverValueEncoder,
} from "drizzle-orm";
import {
  customType,
  pgTable,
  PgDialect,
  PgTable,
  PgView,
  PgMaterializedView,
  getViewConfig,
  getMaterializedViewConfig,
  extractUsedTable,
} from "drizzle-orm/pg-core";
import { getColumnFromDecoder } from "drizzle-orm/utils";
import type { BuildRelationalQueryResult } from "drizzle-orm/relations";
import type { PgCodecs, PostgresColumnType } from "drizzle-orm/pg-core/codecs";
import type { CodecInput, CodecOutput, ExtensionCodec, ExtensionOutputParameterCodec } from "./codecs";

export interface ExtensionExpressionContract {
  readonly member: string;
  readonly codec: string;
  readonly dependencies: readonly string[];
  readonly observability: "tables" | "external" | "session";
}
/** Invocation-local dependency checks carry no database authority. */
export interface ExtensionSqlExecution {
  readonly check: (contract: ExtensionExpressionContract, relations?: readonly string[]) => void;
}
const execution = new AsyncLocalStorage<ExtensionSqlExecution>();
const compilation = new AsyncLocalStorage<(name: string) => string>();
const compilationContracts = new AsyncLocalStorage<Set<ExtensionExpressionContract>>();
const compiledContracts = new WeakMap<object, readonly ExtensionExpressionContract[]>();
const compiledRelations = new WeakMap<object, readonly string[]>();
const ownershipChecks = new WeakMap<ExtensionExpressionContract, () => void>();
function resolveDependencies(
  contract: ExtensionExpressionContract,
  resolveRelation: (name: string) => string,
): ExtensionExpressionContract {
  return { ...contract, dependencies: contract.dependencies.map(resolveRelation) };
}
/** The exact compiled query object retains contracts even when prepared before invocation. */
export function checkCompiledExtensionQuery(
  query: Query,
  resolveRelation: (name: string) => string = (name) => name,
): readonly ExtensionExpressionContract[] {
  const checker = execution.getStore();
  const contracts = compiledContracts.get(query) ?? [];
  for (const contract of contracts) ownershipChecks.get(contract)?.();
  if (checker) {
    if (!contracts.length) return contracts;
    const relations = compiledRelations.get(query)?.map(resolveRelation);
    for (const contract of contracts) checker.check(resolveDependencies(contract, resolveRelation), relations);
  }
  return contracts;
}
export function withExtensionSqlExecution<Result>(checker: ExtensionSqlExecution, work: () => Result): Result {
  return execution.run(checker, work);
}
const contracts = new WeakMap<SQL, ExtensionExpressionContract>();
const checkedWrappers = new WeakSet<SQLWrapper>();
export function extensionExpressionContract(expression: SQL): ExtensionExpressionContract | undefined {
  return contracts.get(expression);
}
type AnyCodec = ExtensionCodec<never, unknown>;
type ExtensionSqlResult<Result extends AnyCodec> =
  Result extends ExtensionOutputParameterCodec<CodecOutput<Result>>
    ? SQL<CodecOutput<Result>> & DriverValueEncoder<CodecOutput<Result>, unknown>
    : SQL<CodecOutput<Result>>;
export type ExtensionSqlInput<Codec extends AnyCodec> =
  | CodecInput<Codec>
  | SQL<CodecOutput<Codec>>
  | SQL.Aliased<CodecOutput<Codec>>
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
/** Follow native SQL nodes, including nested queries; raw SQL strings remain an explicit authoring boundary. */
function queryRelations(query: SQL): readonly string[] {
  const relations = new Set<string>();
  const visited = new Set<SQLChunk>();
  function visit(chunk: SQLChunk): void {
    if (visited.has(chunk)) return;
    visited.add(chunk);
    if (is(chunk, PgTable))
      for (const name of extractUsedTable(chunk)) relations.add(name.includes(".") ? name : `public.${name}`);
    else if (is(chunk, PgView) || is(chunk, PgMaterializedView)) {
      const config = is(chunk, PgView) ? getViewConfig(chunk) : getMaterializedViewConfig(chunk);
      relations.add(`${config.schema ?? "public"}.${config.originalName}`);
    } else if (is(chunk, Column)) visit(getColumnTable(chunk));
    else if (is(chunk, SQL)) for (const child of chunk.queryChunks) visit(child);
    else if (is(chunk, SQL.Aliased)) visit(chunk.sql);
    else if (is(chunk, Subquery)) visit(chunk._.sql);
    else if (Array.isArray(chunk)) for (const child of chunk) visit(child);
    else if (v.is(sqlWrapper, chunk) && !checkedWrappers.has(chunk)) visit(chunk.getSQL());
  }
  visit(query);
  return Object.freeze([...relations].sort());
}
function parameter<Value>(value: Value, codec: AnyCodec): SQL {
  if (is(value, SQL.Aliased)) {
    // Drizzle marks subquery selections as references; direct aliases still contain expressions.
    return "isSelectionField" in value && value.isSelectionField === true ? sql`${value}` : value.sql;
  }
  if (v.is(sqlWrapper, value)) return sql`${value}`;
  // SAFETY: definition call positions pair input with its codec; codec.encode validates before binding.
  const bound = sql`${sql.param(decodeFailure(() => codec.encode(value as never)))}`;
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
const textProjection = extensionTextProjection;
const projectionColumns = new WeakMap<AnyCodec, Column>();
const columnCodecs = new WeakMap<Column, AnyCodec>();
function projectionColumn<Result extends AnyCodec>(codec: Result): Column {
  const cached = projectionColumns.get(codec);
  if (cached) return cached;
  const value = customType<{ data: CodecOutput<Result>; driverData: unknown }>({
    dataType: () => "text",
    // SAFETY: these private dictionary keys are installed only on Kello's dialect.
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
function exactJsonField(field: SelectedField): boolean {
  if (!v.is(sqlWrapper, field)) return false;
  const column = is(field, Column) ? field : getColumnFromDecoder(field);
  return v.is(v.object({ codec: v.literal(textProjection) }), column);
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
export function extensionSqlDialect(
  base: PgCodecs,
  resolveRelation: (name: string) => string = (name) => name,
): PgDialect {
  const dialect = new PgDialect({ codecs: extensionSqlCodecs(base) });
  const compile = dialect.sqlToQuery.bind(dialect);
  const compileTagged = dialect._sqlToQuery.bind(dialect);
  dialect.sqlToQuery = (query, source) => {
    const contracts = new Set<ExtensionExpressionContract>();
    const result = compilationContracts.run(contracts, () =>
      compilation.run(resolveRelation, () => {
        const result = compile(query, source);
        if (contracts.size) compiledRelations.set(result, queryRelations(query));
        return result;
      }),
    );
    compiledContracts.set(result, Object.freeze([...contracts]));
    return result;
  };
  dialect._sqlToQuery = (query) => {
    const contracts = new Set<ExtensionExpressionContract>();
    const result = compilationContracts.run(contracts, () =>
      compilation.run(resolveRelation, () => {
        const result = compileTagged(query);
        if (contracts.size) compiledRelations.set(result, queryRelations(query));
        return result;
      }),
    );
    compiledContracts.set(result, Object.freeze([...contracts]));
    return result;
  };
  const rows = dialect.mapperGenerators.rows;
  const relationalRows = dialect.mapperGenerators.relationalRows;
  dialect.mapperGenerators.rows = (columns, joins) => {
    const map = rows(columns, joins);
    const exactJson = columns.map(({ field }) => exactJsonField(field));
    const checked = columns.flatMap(({ field, path }) => {
      const codec = expressionCodec(field);
      return codec ? [{ path, codec }] : [];
    });
    return markJsonTransportMapper((values: Parameters<typeof map>[0]) => decodeFailure(() => {
      const result = map(
        values.map((row) => row.map((value, index) => unwrapDriverJson(value, exactJson[index] === true))),
      );
      if (Array.isArray(result))
        for (const row of result) for (const entry of checked) decodeNullAtPath(row, entry.path, entry.codec);
      return result;
    }));
  };
  dialect.mapperGenerators.relationalRows = (config) => {
    const map = relationalRows(config);
    const exactJson = config.selection.map((entry) => !entry.selection && exactJsonField(entry.field));
    return markJsonTransportMapper((values: Parameters<typeof map>[0]) => decodeFailure(() => {
      const result = map(
        v.is(v.array(v.array(v.unknown())), values)
          ? values.map((row) => row.map((value, index) => unwrapDriverJson(value, exactJson[index] === true)))
          : values,
      );
      if (config.isFirst) decodeRelationalNulls(result, config.selection);
      else if (Array.isArray(result)) for (const row of result) decodeRelationalNulls(row, config.selection);
      return result;
    }));
  };
  return dialect;
}
function mapped<Result extends AnyCodec>(
  expression: SQL,
  definition: Pick<
    ExtensionSqlDefinition<readonly SqlArgument[], Result>,
    "member" | "result" | "dependencies" | "observability"
  >,
  ownershipCheck?: () => void,
): ExtensionSqlResult<Result> {
  const contract = Object.freeze({
    member: definition.member,
    codec: definition.result.id,
    dependencies: Object.freeze([...definition.dependencies]),
    observability: definition.observability,
  });
  if (ownershipCheck) ownershipChecks.set(contract, ownershipCheck);
  const checked: SQLWrapper = {
    shouldOmitSQLParens: () => true,
    getSQL() {
      ownershipCheck?.();
      const resolveRelation = compilation.getStore();
      if (!resolveRelation) throw new Error("Checked extension SQL requires a Kello database connection");
      compilationContracts.getStore()?.add(contract);
      execution.getStore()?.check(resolveDependencies(contract, resolveRelation));
      return sql.empty();
    },
  };
  checkedWrappers.add(checked);
  const result = sql`${checked}${expression}`.mapWith(projectionColumn(definition.result));
  if ("encodeOutputParameter" in definition.result && v.is(v.function(), definition.result.encodeOutputParameter)) {
    const encodeOutputParameter = definition.result.encodeOutputParameter;
    Object.assign(result, {
      mapToDriverValue: (value: CodecOutput<Result>) => decodeFailure(() => encodeOutputParameter(value)),
    });
  }
  contracts.set(result, contract);
  // SAFETY: the checked codec determines output and its explicit capability is attached on this same SQL instance.
  return result as ExtensionSqlResult<Result>;
}
/** Internal composition seam: captured casts and checked row/text contracts retain their execution lease. */
export function checkedExtensionExpression<Result extends AnyCodec>(
  expression: SQL,
  codec: Result,
  dependencies: readonly string[],
  check?: () => void,
  member = "managed:nested-query",
  observability: "tables" | "session" | "external" = "tables",
): ExtensionSqlResult<Result> {
  return mapped(expression, { member, result: codec, dependencies, observability }, check);
}
export function createSqlFunction<
  const Arguments extends readonly SqlArgument[],
  Result extends AnyCodec,
  Variadic extends AnyCodec | undefined = undefined,
>(
  definition: ExtensionSqlDefinition<Arguments, Result, Variadic>,
): (...values: CallArguments<Arguments, Variadic>) => ExtensionSqlResult<Result> {
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
) => ExtensionSqlResult<Result> {
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
