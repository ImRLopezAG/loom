import * as v from "valibot";
import { is, sql, type SQL } from "drizzle-orm";
import { PgTable, getTableConfig } from "drizzle-orm/pg-core";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import {
  createExtensionCodec,
  floatCodec,
  integerCodec,
  nullableCodec,
  textCodec,
  type ExtensionCodec,
} from "../codecs";
import { int4ArrayCodec, int4Codec } from "../native-codecs";
import { uuidCodec } from "../native-uuid-codec";
import { timestampCodec, timestamptzCodec } from "../native-timestamp-codecs";
import type { Timestamp, Timestamptz } from "../native-timestamp-codecs";
import { int2Codec } from "../primitive-number-codecs";
import { extensionRows } from "../rows";
import {
  checkedExtensionExpression,
  createSqlAggregate,
  createSqlFunction,
  defaultSqlArgument,
  extensionSqlType,
  statefulSqlMember,
} from "../sql";
import {
  nameCodec,
  regclassTextCodec,
  timescaledbChunkColumnstoreSettingsFields,
  timescaledbChunkColumnstoreStatsFields,
  timescaledbChunkCompressionSettingsFields,
  timescaledbChunkCompressionStatsFields,
  timescaledbChunksDetailedSizeFields,
  timescaledbChunksFields,
  timescaledbCompressionSettingsFields,
  timescaledbContinuousAggregatesFields,
  timescaledbDateCodec,
  timescaledbDimensionsFields,
  timescaledbHypertableApproximateDetailedSizeFields,
  timescaledbHypertableColumnstoreSettingsFields,
  timescaledbHypertableColumnstoreStatsFields,
  timescaledbHypertableCompressionSettingsFields,
  timescaledbHypertableCompressionStatsFields,
  timescaledbHypertableDetailedSizeFields,
  timescaledbHypertablesFields,
  timescaledbIntervalCodec,
  timescaledbJobErrorsFields,
  timescaledbJobHistoryFields,
  timescaledbJobStatsFields,
  timescaledbJobsFields,
  timescaledbPoliciesFields,
} from "./timescaledb-codecs";

export type {
  TimescaledbHypertable,
  TimescaledbDimension,
  TimescaledbChunk,
  TimescaledbJob,
  TimescaledbDetailedSize,
  TimescaledbChunkDetailedSize,
} from "./timescaledb-codecs";
export type { Timestamp, Timestamptz } from "../native-timestamp-codecs";

const digest = "cc3487ad909ac0c440eb343101dc7bd52ca4efe5997daf54720c255f6afd6f3f";
const identifier = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0"), "Invalid PostgreSQL identifier"),
);
const relationName = v.strictObject({ schema: identifier, name: identifier });
export type TimescaledbRelationName = v.InferOutput<typeof relationName>;
/** A Drizzle table or an explicit schema-qualified relation; never an unqualified search_path lookup. */
export type TimescaledbRelation = PgTable | TimescaledbRelationName;
/** Values for the captured polymorphic time arguments; PostgreSQL receives an explicit native cast. */
export type TimescaledbTimeValue =
  | { readonly interval: string }
  | { readonly timestamptz: Timestamptz }
  | { readonly timestamp: Timestamp }
  | { readonly date: string }
  | { readonly integer: bigint };
export interface TimescaledbChunkFilter {
  readonly olderThan?: TimescaledbTimeValue;
  readonly newerThan?: TimescaledbTimeValue;
  readonly createdBefore?: TimescaledbTimeValue;
  readonly createdAfter?: TimescaledbTimeValue;
}
const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
/** Bound as quoted text; PostgreSQL's regclass input resolves it at execution. */
export const timescaledbRelationCodec = createExtensionCodec({
  id: "pg:regclass:qualified-name:1",
  sqlType: { schema: "pg_catalog", name: "regclass" },
  input: relationName,
  output: v.string(),
  transport: "text",
  encode: (value) => `${quote(value.schema)}.${quote(value.name)}`,
  decode: (value) => value,
});
export function timescaledbRelationName(relation: TimescaledbRelation): TimescaledbRelationName {
  if (!is(relation, PgTable)) return v.parse(relationName, relation);
  const config = getTableConfig(relation);
  return { schema: config.schema ?? "public", name: config.name };
}

/** Fixed TimescaleDB catalogue schemas; only the extension routines follow the configured installation schema. */
const informationViews = {
  hypertables: timescaledbHypertablesFields,
  dimensions: timescaledbDimensionsFields,
  chunks: timescaledbChunksFields,
  jobs: timescaledbJobsFields,
  job_stats: timescaledbJobStatsFields,
  job_errors: timescaledbJobErrorsFields,
  job_history: timescaledbJobHistoryFields,
  continuous_aggregates: timescaledbContinuousAggregatesFields,
  compression_settings: timescaledbCompressionSettingsFields,
  hypertable_compression_settings: timescaledbHypertableCompressionSettingsFields,
  chunk_compression_settings: timescaledbChunkCompressionSettingsFields,
  hypertable_columnstore_settings: timescaledbHypertableColumnstoreSettingsFields,
  chunk_columnstore_settings: timescaledbChunkColumnstoreSettingsFields,
} as const;
type InformationView = keyof typeof informationViews;

/**
 * Apache-licensed TimescaleDB 2.24.0 query surface. Hypertable DDL, chunk lifecycle and catalogue mutations are
 * operator tooling (`kello/tooling/extensions/timescaledb`). TSL-only members (jobs, policies, compression,
 * columnstore, continuous aggregates, gapfill/locf/interpolate, chunk merge/split/move/reorder) raise native
 * feature_not_supported under Neon's Apache build and are not advertised here.
 */
export function createTimescaledb_2_24_0<
  const Descriptor extends ExtensionDescriptor<"timescaledb", { version: "2.24.0"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "timescaledb" ||
    descriptor.version !== "2.24.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("timescaledb 2.24.0 requires its exact verified contract");
  const schema = descriptor.schema;
  const pure = { schema, dependencies: [], observability: "tables", authority: "query" } as const;
  const member = (signature: string) => `routine:$extension:timescaledb.${signature}`;
  const interval = nullableCodec(timescaledbIntervalCodec);
  const date = nullableCodec(timescaledbDateCodec);
  const timestamp = nullableCodec(timestampCodec);
  const timestamptz = nullableCodec(timestamptzCodec);
  const uuid = nullableCodec(uuidCodec);
  const text = nullableCodec(textCodec);
  const int2 = nullableCodec(int2Codec);
  const int4 = nullableCodec(int4Codec);
  const int8 = nullableCodec(integerCodec);
  const bucket = <
    const Arguments extends readonly (ExtensionCodec<never, unknown> | ReturnType<typeof defaultSqlArgument>)[],
    Result extends ExtensionCodec<never, unknown>,
  >(
    signature: string,
    args: Arguments,
    result: Result,
  ) =>
    createSqlFunction({
      ...pure,
      name: "time_bucket",
      member: member(`time_bucket(${signature})`),
      arguments: args,
      result,
    });
  const c = "pg_catalog.";
  /** Each key is one captured overload; PostgreSQL's STRICT C implementation returns NULL for NULL inputs. */
  const timeBucket = Object.freeze({
    int2: bucket(`${c}int2,${c}int2`, [int2, int2] as const, int2),
    int2Offset: bucket(`${c}int2,${c}int2,${c}int2`, [int2, int2, int2] as const, int2),
    int4: bucket(`${c}int4,${c}int4`, [int4, int4] as const, int4),
    int4Offset: bucket(`${c}int4,${c}int4,${c}int4`, [int4, int4, int4] as const, int4),
    int8: bucket(`${c}int8,${c}int8`, [int8, int8] as const, int8),
    int8Offset: bucket(`${c}int8,${c}int8,${c}int8`, [int8, int8, int8] as const, int8),
    date: bucket(`${c}interval,${c}date`, [interval, date] as const, date),
    dateOrigin: bucket(`${c}interval,${c}date,${c}date`, [interval, date, date] as const, date),
    dateOffset: bucket(`${c}interval,${c}date,${c}interval`, [interval, date, interval] as const, date),
    timestamp: bucket(`${c}interval,${c}timestamp`, [interval, timestamp] as const, timestamp),
    timestampOrigin: bucket(
      `${c}interval,${c}timestamp,${c}timestamp`,
      [interval, timestamp, timestamp] as const,
      timestamp,
    ),
    timestampOffset: bucket(
      `${c}interval,${c}timestamp,${c}interval`,
      [interval, timestamp, interval] as const,
      timestamp,
    ),
    timestamptz: bucket(`${c}interval,${c}timestamptz`, [interval, timestamptz] as const, timestamptz),
    timestamptzOrigin: bucket(
      `${c}interval,${c}timestamptz,${c}timestamptz`,
      [interval, timestamptz, timestamptz] as const,
      timestamptz,
    ),
    timestamptzOffset: bucket(
      `${c}interval,${c}timestamptz,${c}interval`,
      [interval, timestamptz, interval] as const,
      timestamptz,
    ),
    /** Not STRICT: omitted origin/offset use PostgreSQL defaults; a NULL timezone is PostgreSQL's to reject. */
    timestamptzTimezone: bucket(
      `${c}interval,${c}timestamptz,${c}text,${c}timestamptz,${c}interval`,
      [
        interval,
        timestamptz,
        text,
        defaultSqlArgument(timestamptz, "origin"),
        defaultSqlArgument(interval, "offset"),
      ] as const,
      timestamptz,
    ),
    uuid: bucket(`${c}interval,${c}uuid`, [interval, uuid] as const, timestamptz),
    uuidOrigin: bucket(`${c}interval,${c}uuid,${c}timestamptz`, [interval, uuid, timestamptz] as const, timestamptz),
    uuidOffset: bucket(`${c}interval,${c}uuid,${c}interval`, [interval, uuid, interval] as const, timestamptz),
    uuidTimezone: bucket(
      `${c}interval,${c}uuid,${c}text,${c}timestamptz,${c}interval`,
      [
        interval,
        uuid,
        text,
        defaultSqlArgument(timestamptz, "origin"),
        defaultSqlArgument(interval, "offset"),
      ] as const,
      timestamptz,
    ),
  });
  const experimental = { ...pure, schema: "timescaledb_experimental" } as const;
  const ng = <
    const Arguments extends readonly ExtensionCodec<never, unknown>[],
    Result extends ExtensionCodec<never, unknown>,
  >(
    signature: string,
    args: Arguments,
    result: Result,
  ) =>
    createSqlFunction({
      ...experimental,
      name: "time_bucket_ng",
      member: `routine:timescaledb_experimental.time_bucket_ng(${signature})`,
      arguments: args,
      result,
    });
  /** Deprecated experimental bucketing in the fixed timescaledb_experimental schema. */
  const timeBucketNg = Object.freeze({
    date: ng(`${c}interval,${c}date`, [interval, date] as const, date),
    dateOrigin: ng(`${c}interval,${c}date,${c}date`, [interval, date, date] as const, date),
    timestamp: ng(`${c}interval,${c}timestamp`, [interval, timestamp] as const, timestamp),
    timestampOrigin: ng(
      `${c}interval,${c}timestamp,${c}timestamp`,
      [interval, timestamp, timestamp] as const,
      timestamp,
    ),
    timestamptz: ng(`${c}interval,${c}timestamptz`, [interval, timestamptz] as const, timestamptz),
    timestamptzOrigin: ng(
      `${c}interval,${c}timestamptz,${c}timestamptz`,
      [interval, timestamptz, timestamptz] as const,
      timestamptz,
    ),
    timestamptzTimezone: ng(
      `${c}interval,${c}timestamptz,${c}text`,
      [interval, timestamptz, text] as const,
      timestamptz,
    ),
    timestamptzOriginTimezone: ng(
      `${c}interval,${c}timestamptz,${c}timestamptz,${c}text`,
      [interval, timestamptz, timestamptz, text] as const,
      timestamptz,
    ),
  });
  /** Polymorphic aggregates: the caller names the value and ordering codecs; PostgreSQL resolves the C state function. */
  function ordered<ValueInput, ValueOutput, OrderInput, OrderOutput>(
    name: "first" | "last",
    value: ExtensionCodec<ValueInput, ValueOutput>,
    order: ExtensionCodec<OrderInput, OrderOutput>,
  ) {
    return createSqlAggregate({
      ...pure,
      name,
      member: member(`${name}(pg_catalog.anyelement,pg_catalog.any)`),
      arguments: [nullableCodec(value), nullableCodec(order)] as const,
      result: nullableCodec(value),
    });
  }
  const histogram = createSqlAggregate({
    ...pure,
    name: "histogram",
    member: member(`histogram(${c}float8,${c}float8,${c}float8,${c}int4)`),
    arguments: [nullableCodec(floatCodec), floatCodec, floatCodec, int4Codec] as const,
    result: nullableCodec(int4ArrayCodec),
  });
  // UUIDv7 helpers: PostgreSQL computes every timestamp and random bit.
  const generateUuidv7 = createSqlFunction({
    ...pure,
    observability: "external",
    name: "generate_uuidv7",
    member: member("generate_uuidv7()"),
    arguments: [] as const,
    result: uuidCodec,
  });
  const toUuidv7 = createSqlFunction({
    ...pure,
    observability: "external",
    name: "to_uuidv7",
    member: member(`to_uuidv7(${c}timestamptz)`),
    arguments: [timestamptz] as const,
    result: uuid,
  });
  const toUuidv7Boundary = createSqlFunction({
    ...pure,
    name: "to_uuidv7_boundary",
    member: member(`to_uuidv7_boundary(${c}timestamptz)`),
    arguments: [timestamptz] as const,
    result: uuid,
  });
  const uuidTimestamp = createSqlFunction({
    ...pure,
    name: "uuid_timestamp",
    member: member(`uuid_timestamp(${c}uuid)`),
    arguments: [uuid] as const,
    result: timestamptz,
  });
  const uuidTimestampMicros = createSqlFunction({
    ...pure,
    name: "uuid_timestamp_micros",
    member: member(`uuid_timestamp_micros(${c}uuid)`),
    arguments: [uuid] as const,
    result: timestamptz,
  });
  const uuidVersion = createSqlFunction({
    ...pure,
    name: "uuid_version",
    member: member(`uuid_version(${c}uuid)`),
    arguments: [uuid] as const,
    result: int4,
  });

  // Catalogue/statistics readers observe chunks, sizes and planner statistics, never a table revision.
  function observe<Result extends ExtensionCodec<never, unknown>>(name: string, result: Result) {
    return (relation: TimescaledbRelation) => {
      const resolved = timescaledbRelationName(relation);
      return createSqlFunction({
        schema,
        name,
        member: member(`${name}(${c}regclass)`),
        arguments: [timescaledbRelationCodec] as const,
        result,
        dependencies: [`${resolved.schema}.${resolved.name}`],
        observability: "external",
        authority: "query",
      })(resolved);
    };
  }
  function rows<const Fields extends Readonly<Record<string, ExtensionCodec<never, unknown>>>>(
    name: string,
    fields: Fields,
  ) {
    const call = observe(name, nullableCodec(textCodec));
    return (relation: TimescaledbRelation, alias: string) => extensionRows(call(relation), alias, fields, "named");
  }
  const timeArgument = (value: TimescaledbTimeValue): SQL => {
    if ("interval" in value)
      return sql`${sql.param(timescaledbIntervalCodec.encode(value.interval))}::${extensionSqlType("pg_catalog", "interval")}`;
    if ("timestamptz" in value)
      return sql`${sql.param(timestamptzCodec.encode(value.timestamptz))}::${extensionSqlType("pg_catalog", "timestamptz")}`;
    if ("timestamp" in value)
      return sql`${sql.param(timestampCodec.encode(value.timestamp))}::${extensionSqlType("pg_catalog", "timestamp")}`;
    if ("date" in value)
      return sql`${sql.param(timescaledbDateCodec.encode(value.date))}::${extensionSqlType("pg_catalog", "date")}`;
    return sql`${sql.param(integerCodec.encode(value.integer))}::${extensionSqlType("pg_catalog", "int8")}`;
  };
  const showChunks = (relation: TimescaledbRelation, alias: string, filter: TimescaledbChunkFilter = {}) => {
    const resolved = timescaledbRelationName(relation);
    const args = [
      sql`${sql.param(timescaledbRelationCodec.encode(resolved))}::${extensionSqlType("pg_catalog", "regclass")}`,
    ];
    for (const [name, value] of [
      ["older_than", filter.olderThan],
      ["newer_than", filter.newerThan],
      ["created_before", filter.createdBefore],
      ["created_after", filter.createdAfter],
    ] as const)
      if (value !== undefined) args.push(sql`${sql.identifier(name)} => ${timeArgument(value)}`);
    const expression = checkedExtensionExpression(
      sql`${extensionSqlType(schema, "show_chunks")}(${sql.join(args, sql`, `)})`,
      regclassTextCodec,
      [`${resolved.schema}.${resolved.name}`],
      undefined,
      member(`show_chunks(${c}regclass,${c}any,${c}any,${c}any,${c}any)`),
      "external",
    );
    return extensionRows(expression, alias, { chunk: regclassTextCodec }, "named");
  };
  const showTablespaces = (relation: TimescaledbRelation, alias: string) =>
    extensionRows(observe("show_tablespaces", nameCodec)(relation), alias, { tablespace: nameCodec }, "named");
  function view<Name extends InformationView>(name: Name, alias: string) {
    const fields = informationViews[name];
    const codec = nullableCodec(textCodec);
    const expression = checkedExtensionExpression(
      sql`${sql.identifier("timescaledb_information")}.${sql.identifier(name)}`,
      codec,
      [],
      undefined,
      `view:timescaledb_information.${name}`,
      "external",
    );
    return extensionRows(expression, alias, fields, "named");
  }
  const policies = (alias: string) =>
    extensionRows(
      checkedExtensionExpression(
        sql`${sql.identifier("timescaledb_experimental")}.${sql.identifier("policies")}`,
        nullableCodec(textCodec),
        [],
        undefined,
        "view:timescaledb_experimental.policies",
        "external",
      ),
      alias,
      timescaledbPoliciesFields,
      "named",
    );
  const tooling = (signature: string) => statefulSqlMember(member(signature), "operator");
  const first = <ValueInput, ValueOutput, OrderInput, OrderOutput>(
    value: ExtensionCodec<ValueInput, ValueOutput>,
    order: ExtensionCodec<OrderInput, OrderOutput>,
  ) => ordered("first", value, order);
  const last = <ValueInput, ValueOutput, OrderInput, OrderOutput>(
    value: ExtensionCodec<ValueInput, ValueOutput>,
    order: ExtensionCodec<OrderInput, OrderOutput>,
  ) => ordered("last", value, order);
  const observations = {
    approximateRowCount: observe("approximate_row_count", int8),
    hypertableSize: observe("hypertable_size", int8),
    hypertableApproximateSize: observe("hypertable_approximate_size", int8),
    hypertableIndexSize: observe("hypertable_index_size", int8),
    hypertableDetailedSize: rows("hypertable_detailed_size", timescaledbHypertableDetailedSizeFields),
    hypertableApproximateDetailedSize: rows(
      "hypertable_approximate_detailed_size",
      timescaledbHypertableApproximateDetailedSizeFields,
    ),
    chunksDetailedSize: rows("chunks_detailed_size", timescaledbChunksDetailedSizeFields),
    hypertableCompressionStats: rows("hypertable_compression_stats", timescaledbHypertableCompressionStatsFields),
    chunkCompressionStats: rows("chunk_compression_stats", timescaledbChunkCompressionStatsFields),
    hypertableColumnstoreStats: rows("hypertable_columnstore_stats", timescaledbHypertableColumnstoreStatsFields),
    chunkColumnstoreStats: rows("chunk_columnstore_stats", timescaledbChunkColumnstoreStatsFields),
  };
  return bindExtension(descriptor, {
    timeBucket,
    timeBucketNg,
    first,
    last,
    histogram,
    generateUuidv7,
    toUuidv7,
    toUuidv7Boundary,
    uuidTimestamp,
    uuidTimestampMicros,
    uuidVersion,
    ...observations,
    showChunks,
    showTablespaces,
    information: view,
    policies,
    // Operator-only DDL and chunk lifecycle: descriptors, deliberately not SQL expressions or RPC helpers.
    createHypertable: tooling(
      `create_hypertable(${c}regclass,_timescaledb_internal.dimension_info,${c}bool,${c}bool,${c}bool)`,
    ),
    addDimension: tooling(`add_dimension(${c}regclass,_timescaledb_internal.dimension_info,${c}bool)`),
    dropChunks: tooling(`drop_chunks(${c}regclass,${c}any,${c}any,${c}bool,${c}any,${c}any)`),
    sql: Object.freeze({
      functions: Object.freeze({
        time_bucket: timeBucket,
        time_bucket_ng: timeBucketNg,
        first,
        last,
        histogram,
        generate_uuidv7: generateUuidv7,
        to_uuidv7: toUuidv7,
        to_uuidv7_boundary: toUuidv7Boundary,
        uuid_timestamp: uuidTimestamp,
        uuid_timestamp_micros: uuidTimestampMicros,
        uuid_version: uuidVersion,
        approximate_row_count: observations.approximateRowCount,
        hypertable_size: observations.hypertableSize,
        hypertable_approximate_size: observations.hypertableApproximateSize,
        hypertable_index_size: observations.hypertableIndexSize,
        hypertable_detailed_size: observations.hypertableDetailedSize,
        hypertable_approximate_detailed_size: observations.hypertableApproximateDetailedSize,
        chunks_detailed_size: observations.chunksDetailedSize,
        hypertable_compression_stats: observations.hypertableCompressionStats,
        chunk_compression_stats: observations.chunkCompressionStats,
        hypertable_columnstore_stats: observations.hypertableColumnstoreStats,
        chunk_columnstore_stats: observations.chunkColumnstoreStats,
        show_chunks: showChunks,
        show_tablespaces: showTablespaces,
      }),
      operators: Object.freeze({}),
    }),
  });
}
