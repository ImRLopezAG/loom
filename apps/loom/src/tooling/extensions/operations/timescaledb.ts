import pg from "pg";
import * as v from "valibot";
import {
  createTimescaledb_2_24_0,
  timescaledbRelationCodec,
  timescaledbRelationName,
  type TimescaledbRelation,
  type TimescaledbTimeValue,
  type TimescaledbChunkFilter,
} from "../../../core/extensions/adapters/timescaledb";
import {
  timescaledbAddDimensionCodec,
  timescaledbAddDimensionInfoCodec,
  timescaledbCreateHypertableCodec,
  timescaledbCreateHypertableInfoCodec,
  timescaledbDateCodec,
  timescaledbDisableChunkSkippingCodec,
  timescaledbEnableChunkSkippingCodec,
  timescaledbIntervalCodec,
  timescaledbSetAdaptiveChunkingCodec,
  type TimescaledbAdaptiveChunking,
  type TimescaledbAddedDimension,
  type TimescaledbChunkSkippingDisabled,
  type TimescaledbChunkSkippingEnabled,
  type TimescaledbCreatedHypertable,
  type TimescaledbLegacyAddedDimension,
  type TimescaledbLegacyCreatedHypertable,
} from "../../../core/extensions/adapters/timescaledb-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { booleanCodec, integerCodec, type ExtensionCodec } from "../../../core/extensions/codecs";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { int4Codec } from "../../../core/extensions/native-codecs";
import { timestampCodec, timestamptzCodec } from "../../../core/extensions/native-timestamp-codecs";
import { acquireExtensionLock } from "../../migrations/connection";
import { withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/timescaledb.json";

export type { TimescaledbTimeValue, TimescaledbChunkFilter } from "../../../core/extensions/adapters/timescaledb";
/** A schema-qualified routine for regproc arguments; PostgreSQL resolves it at execution. */
export interface TimescaledbRoutineName {
  readonly schema: string;
  readonly name: string;
}
export type TimescaledbDimension =
  | {
      readonly kind: "range";
      readonly column: string;
      readonly interval?: TimescaledbTimeValue;
      readonly partitionFunc?: TimescaledbRoutineName;
    }
  | {
      readonly kind: "hash";
      readonly column: string;
      readonly partitions: number;
      readonly partitionFunc?: TimescaledbRoutineName;
    };
/** Native license, members PostgreSQL rejects under it (0A000), and members whose only inputs that license cannot create. */
export interface TimescaledbRestrictions {
  readonly license: string;
  readonly restricted: readonly string[];
  readonly unreachable: readonly string[];
}

export interface TimescaledbSession {
  readonly createHypertable: (
    relation: TimescaledbRelation,
    dimension: TimescaledbDimension,
    options?: {
      readonly createDefaultIndexes?: boolean;
      readonly ifNotExists?: boolean;
      readonly migrateData?: boolean;
    },
  ) => Promise<TimescaledbCreatedHypertable>;
  /** Deprecated captured signature; arguments map one-to-one onto its named parameters. */
  readonly createHypertableLegacy: (
    relation: TimescaledbRelation,
    timeColumn: string,
    options?: {
      readonly partitioningColumn?: string;
      readonly numberPartitions?: number;
      readonly associatedSchemaName?: string;
      readonly associatedTablePrefix?: string;
      readonly chunkTimeInterval?: TimescaledbTimeValue;
      readonly createDefaultIndexes?: boolean;
      readonly ifNotExists?: boolean;
      readonly migrateData?: boolean;
      readonly chunkTargetSize?: string;
      readonly timePartitioningFunc?: TimescaledbRoutineName;
      readonly partitioningFunc?: TimescaledbRoutineName;
      readonly chunkSizingFunc?: TimescaledbRoutineName;
    },
  ) => Promise<TimescaledbLegacyCreatedHypertable>;
  readonly addDimension: (
    relation: TimescaledbRelation,
    dimension: TimescaledbDimension,
    options?: { readonly ifNotExists?: boolean },
  ) => Promise<TimescaledbAddedDimension>;
  readonly addDimensionLegacy: (
    relation: TimescaledbRelation,
    column: string,
    options?: {
      readonly numberPartitions?: number;
      readonly chunkTimeInterval?: TimescaledbTimeValue;
      readonly partitioningFunc?: TimescaledbRoutineName;
      readonly ifNotExists?: boolean;
    },
  ) => Promise<TimescaledbLegacyAddedDimension>;
  readonly setChunkTimeInterval: (
    relation: TimescaledbRelation,
    interval: TimescaledbTimeValue,
    dimension?: string,
  ) => Promise<void>;
  readonly setPartitioningInterval: (
    relation: TimescaledbRelation,
    interval: TimescaledbTimeValue,
    dimension?: string,
  ) => Promise<void>;
  readonly setNumberPartitions: (
    relation: TimescaledbRelation,
    partitions: number,
    dimension?: string,
  ) => Promise<void>;
  readonly setIntegerNowFunc: (
    relation: TimescaledbRelation,
    func: TimescaledbRoutineName,
    replaceIfExists?: boolean,
  ) => Promise<void>;
  readonly setAdaptiveChunking: (
    relation: TimescaledbRelation,
    chunkTargetSize: string | null,
    chunkSizingFunc?: TimescaledbRoutineName,
  ) => Promise<TimescaledbAdaptiveChunking>;
  /** Fully-qualified chunk names reported by PostgreSQL. */
  readonly showChunks: (relation: TimescaledbRelation, filter?: TimescaledbChunkFilter) => Promise<readonly string[]>;
  readonly dropChunks: (
    relation: TimescaledbRelation,
    filter: TimescaledbChunkFilter & { readonly verbose?: boolean },
  ) => Promise<readonly string[]>;
  readonly attachTablespace: (
    tablespace: string,
    relation: TimescaledbRelation,
    ifNotAttached?: boolean,
  ) => Promise<void>;
  readonly detachTablespace: (
    tablespace: string,
    relation?: TimescaledbRelation,
    ifAttached?: boolean,
  ) => Promise<number>;
  readonly detachTablespaces: (relation: TimescaledbRelation) => Promise<number>;
  readonly showTablespaces: (relation: TimescaledbRelation) => Promise<readonly string[]>;
  /** Requires `timescaledb.enable_chunk_skipping`; PostgreSQL reports the GUC when it is off. */
  readonly enableChunkSkipping: (
    relation: TimescaledbRelation,
    column: string,
    ifNotExists?: boolean,
  ) => Promise<TimescaledbChunkSkippingEnabled>;
  readonly disableChunkSkipping: (
    relation: TimescaledbRelation,
    column: string,
    ifNotExists?: boolean,
  ) => Promise<TimescaledbChunkSkippingDisabled>;
  /** pg_dump/pg_restore bracketing; changes the database-level restoring setting. */
  readonly preRestore: () => Promise<boolean>;
  readonly postRestore: () => Promise<boolean>;
  readonly restrictions: () => Promise<TimescaledbRestrictions>;
}

/** Captured TSL members that Neon's Apache build rejects natively (SQLSTATE 0A000, "not supported under the current \"apache\" license"). */
export const timescaledbApacheRestrictedMembers: readonly string[] = Object.freeze(
  [
    "add_columnstore_policy(pg_catalog.regclass,pg_catalog.any,pg_catalog.bool,pg_catalog.interval,pg_catalog.timestamptz,pg_catalog.text,pg_catalog.interval)",
    "add_compression_policy(pg_catalog.regclass,pg_catalog.any,pg_catalog.bool,pg_catalog.interval,pg_catalog.timestamptz,pg_catalog.text,pg_catalog.interval)",
    "add_continuous_aggregate_policy(pg_catalog.regclass,pg_catalog.any,pg_catalog.any,pg_catalog.interval,pg_catalog.bool,pg_catalog.timestamptz,pg_catalog.text,pg_catalog.bool,pg_catalog.int4,pg_catalog.int4,pg_catalog.bool)",
    "add_job(pg_catalog.regproc,pg_catalog.interval,pg_catalog.jsonb,pg_catalog.timestamptz,pg_catalog.bool,pg_catalog.regproc,pg_catalog.bool,pg_catalog.text,pg_catalog.text)",
    "add_process_hypertable_invalidations_policy(pg_catalog.regclass,pg_catalog.interval,pg_catalog.bool,pg_catalog.timestamptz,pg_catalog.text)",
    "add_reorder_policy(pg_catalog.regclass,pg_catalog.name,pg_catalog.bool,pg_catalog.timestamptz,pg_catalog.text)",
    "add_retention_policy(pg_catalog.regclass,pg_catalog.any,pg_catalog.bool,pg_catalog.interval,pg_catalog.timestamptz,pg_catalog.text,pg_catalog.interval)",
    "alter_job(pg_catalog.int4,pg_catalog.interval,pg_catalog.interval,pg_catalog.int4,pg_catalog.interval,pg_catalog.bool,pg_catalog.jsonb,pg_catalog.timestamptz,pg_catalog.bool,pg_catalog.regproc,pg_catalog.bool,pg_catalog.timestamptz,pg_catalog.text,pg_catalog.text)",
    "attach_chunk(pg_catalog.regclass,pg_catalog.regclass,pg_catalog.jsonb)",
    "compress_chunk(pg_catalog.regclass,pg_catalog.bool,pg_catalog.bool)",
    "convert_to_columnstore(pg_catalog.regclass,pg_catalog.bool,pg_catalog.bool)",
    "convert_to_rowstore(pg_catalog.regclass,pg_catalog.bool)",
    "decompress_chunk(pg_catalog.regclass,pg_catalog.bool)",
    "delete_job(pg_catalog.int4)",
    "detach_chunk(pg_catalog.regclass)",
    "merge_chunks(pg_catalog._regclass)",
    "merge_chunks(pg_catalog.regclass,pg_catalog.regclass,pg_catalog.bool)",
    "merge_chunks_concurrently(pg_catalog._regclass)",
    "move_chunk(pg_catalog.regclass,pg_catalog.name,pg_catalog.name,pg_catalog.regclass,pg_catalog.bool)",
    "recompress_chunk(pg_catalog.regclass,pg_catalog.bool)",
    "refresh_continuous_aggregate(pg_catalog.regclass,pg_catalog.any,pg_catalog.any,pg_catalog.bool,pg_catalog.jsonb)",
    "remove_columnstore_policy(pg_catalog.regclass,pg_catalog.bool)",
    "remove_compression_policy(pg_catalog.regclass,pg_catalog.bool)",
    "remove_continuous_aggregate_policy(pg_catalog.regclass,pg_catalog.bool,pg_catalog.bool)",
    "remove_process_hypertable_invalidations_policy(pg_catalog.regclass,pg_catalog.bool)",
    "remove_reorder_policy(pg_catalog.regclass,pg_catalog.bool)",
    "remove_retention_policy(pg_catalog.regclass,pg_catalog.bool)",
    "reorder_chunk(pg_catalog.regclass,pg_catalog.regclass,pg_catalog.bool)",
    "run_job(pg_catalog.int4)",
    "split_chunk(pg_catalog.regclass,pg_catalog.any)",
  ]
    .map((signature) => `routine:$extension:timescaledb.${signature}`)
    .concat(
      [
        "add_policies(pg_catalog.regclass,pg_catalog.bool,pg_catalog.any,pg_catalog.any,pg_catalog.any,pg_catalog.any)",
        "alter_policies(pg_catalog.regclass,pg_catalog.bool,pg_catalog.any,pg_catalog.any,pg_catalog.any,pg_catalog.any)",
        "remove_all_policies(pg_catalog.regclass,pg_catalog.bool)",
        "remove_policies(pg_catalog.regclass,pg_catalog.bool,pg_catalog._text)",
        "show_policies(pg_catalog.regclass)",
      ].map((signature) => `routine:timescaledb_experimental.${signature}`),
    )
    .concat(
      [
        "interpolate(pg_catalog.float4,pg_catalog.record,pg_catalog.record)",
        "interpolate(pg_catalog.float8,pg_catalog.record,pg_catalog.record)",
        "interpolate(pg_catalog.int2,pg_catalog.record,pg_catalog.record)",
        "interpolate(pg_catalog.int4,pg_catalog.record,pg_catalog.record)",
        "interpolate(pg_catalog.int8,pg_catalog.record,pg_catalog.record)",
        "locf(pg_catalog.anyelement,pg_catalog.anyelement,pg_catalog.bool)",
        "time_bucket_gapfill(pg_catalog.int2,pg_catalog.int2,pg_catalog.int2,pg_catalog.int2)",
        "time_bucket_gapfill(pg_catalog.int4,pg_catalog.int4,pg_catalog.int4,pg_catalog.int4)",
        "time_bucket_gapfill(pg_catalog.int8,pg_catalog.int8,pg_catalog.int8,pg_catalog.int8)",
        "time_bucket_gapfill(pg_catalog.interval,pg_catalog.date,pg_catalog.date,pg_catalog.date)",
        "time_bucket_gapfill(pg_catalog.interval,pg_catalog.timestamp,pg_catalog.timestamp,pg_catalog.timestamp)",
        "time_bucket_gapfill(pg_catalog.interval,pg_catalog.timestamptz,pg_catalog.text,pg_catalog.timestamptz,pg_catalog.timestamptz)",
        "time_bucket_gapfill(pg_catalog.interval,pg_catalog.timestamptz,pg_catalog.timestamptz,pg_catalog.timestamptz)",
      ].map((signature) => `routine:$extension:timescaledb.${signature}`),
    )
    .sort(),
);

/** cagg_migrate only accepts continuous aggregates, whose creation is itself TSL (native 0A000 under Apache). */
export const timescaledbApacheUnreachableMembers: readonly string[] = Object.freeze([
  "routine:$extension:timescaledb.cagg_migrate(pg_catalog.regclass,pg_catalog.bool,pg_catalog.bool)",
]);

const identifier = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0"), "Invalid PostgreSQL identifier"),
);
const positiveInt4 = v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2147483647));
const routineName = v.strictObject({ schema: identifier, name: identifier });

/** Builds one bound argument list; every value is a parameter with an explicit native cast. */
type BoundValue = string | boolean | null;
class Arguments {
  readonly values: BoundValue[] = [];
  readonly sql: string[] = [];
  bind(value: BoundValue, type: string, name?: string): this {
    this.values.push(value);
    this.sql.push(`${name ? `${pg.escapeIdentifier(name)} => ` : ""}$${this.values.length}::${type}`);
    return this;
  }
  relation(relation: TimescaledbRelation, name?: string): this {
    return this.bind(
      v.parse(v.string(), timescaledbRelationCodec.encode(timescaledbRelationName(relation))),
      "pg_catalog.regclass",
      name,
    );
  }
  routine(routine: TimescaledbRoutineName, name?: string): this {
    const parsed = v.parse(routineName, routine);
    return this.bind(
      `${pg.escapeIdentifier(parsed.schema)}.${pg.escapeIdentifier(parsed.name)}`,
      "pg_catalog.regproc",
      name,
    );
  }
  time(value: TimescaledbTimeValue, name?: string): this {
    if ("interval" in value)
      return this.bind(
        v.parse(v.string(), timescaledbIntervalCodec.encode(value.interval)),
        "pg_catalog.interval",
        name,
      );
    if ("timestamptz" in value)
      return this.bind(v.parse(v.string(), timestamptzCodec.encode(value.timestamptz)), "pg_catalog.timestamptz", name);
    if ("timestamp" in value)
      return this.bind(v.parse(v.string(), timestampCodec.encode(value.timestamp)), "pg_catalog.timestamp", name);
    if ("date" in value)
      return this.bind(v.parse(v.string(), timescaledbDateCodec.encode(value.date)), "pg_catalog.date", name);
    return this.bind(
      v.parse(v.string(), integerCodec.encode(v.parse(v.bigint(), value.integer))),
      "pg_catalog.int8",
      name,
    );
  }
  optional<Value>(value: Value | undefined, add: (value: Value) => void): this {
    if (value !== undefined) add(value);
    return this;
  }
  filter(filter: TimescaledbChunkFilter): this {
    return this.optional(filter.olderThan, (value) => this.time(value, "older_than"))
      .optional(filter.newerThan, (value) => this.time(value, "newer_than"))
      .optional(filter.createdBefore, (value) => this.time(value, "created_before"))
      .optional(filter.createdAfter, (value) => this.time(value, "created_after"));
  }
  toString(): string {
    return this.sql.join(", ");
  }
}

/**
 * Operator-only TimescaleDB DDL and chunk lifecycle in one verified transaction on a direct connection. No client
 * escapes. Catalogue rows in _timescaledb_catalog/_timescaledb_config are never written by this module; PostgreSQL
 * changes them only through these captured routines. TSL members are absent; `restrictions()` reports them.
 */
export async function withTimescaledb<Result>(
  directOperatorUrl: string,
  descriptor: ExtensionDescriptor<"timescaledb", { version: "2.24.0"; schema: string }>,
  callback: (session: TimescaledbSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result }> {
  createTimescaledb_2_24_0(descriptor);
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  const schema = pg.escapeIdentifier(descriptor.schema);
  return withExtensionOperation(
    directOperatorUrl,
    async (context) => {
      await acquireExtensionLock(context.client, signal);
      await verifyExtensionApiContracts(context.client, [requirement]);
      const call = (name: string, args: Arguments) => `${schema}.${pg.escapeIdentifier(name)}(${args.toString()})`;
      async function record<Output>(
        name: string,
        args: Arguments,
        codec: ExtensionCodec<never, Output>,
      ): Promise<Output> {
        const result = await context.client.query(
          `SELECT ROW(f.*)::pg_catalog.text AS value FROM ${call(name, args)} AS f`,
          args.values,
        );
        if (result.rows.length !== 1) throw new Error(`TimescaleDB ${name} returned ${result.rows.length} rows`);
        return codec.decode(result.rows[0].value);
      }
      async function scalar<Output>(
        name: string,
        args: Arguments,
        codec: ExtensionCodec<never, Output>,
      ): Promise<Output> {
        const projection = codec.transport === "text" ? `${call(name, args)}::pg_catalog.text` : call(name, args);
        const result = await context.client.query(`SELECT ${projection} AS value`, args.values);
        return codec.decode(result.rows[0].value);
      }
      async function list(name: string, args: Arguments): Promise<readonly string[]> {
        const result = await context.client.query(
          `SELECT f::pg_catalog.text AS value FROM ${call(name, args)} AS f`,
          args.values,
        );
        return Object.freeze(result.rows.map((row) => v.parse(v.string(), row.value)));
      }
      async function effect(name: string, args: Arguments): Promise<void> {
        await context.client.query(`SELECT ${call(name, args)}`, args.values);
      }
      const dimension = (value: TimescaledbDimension) => {
        const args = new Arguments().bind(v.parse(identifier, value.column), "pg_catalog.name");
        if (value.kind === "hash") args.bind(String(v.parse(positiveInt4, value.partitions)), "pg_catalog.int4");
        else args.optional(value.interval, (interval) => args.time(interval));
        args.optional(value.partitionFunc, (func) => args.routine(func, "partition_func"));
        return { name: value.kind === "hash" ? "by_hash" : "by_range", args };
      };
      /** Inlines a dimension builder call; its parameters are renumbered into the outer argument list. */
      const withDimension = (outer: Arguments, value: TimescaledbDimension) => {
        const inner = dimension(value);
        const placeholders = inner.args.values.map((entry, index) => {
          outer.values.push(entry);
          return inner.args.sql[index]!.replace(/\$\d+/, `$${outer.values.length}`);
        });
        outer.sql.push(`${schema}.${pg.escapeIdentifier(inner.name)}(${placeholders.join(", ")})`);
        return outer;
      };
      const flag = (value: boolean | undefined, name: string, args: Arguments) =>
        args.optional(value, (entry) =>
          args.bind(v.parse(v.boolean(), booleanCodec.encode(entry)), "pg_catalog.bool", name),
        );
      return Object.freeze({
        createHypertable: (relation, value, options = {}) =>
          context.run(() => {
            const args = withDimension(new Arguments().relation(relation), value);
            flag(options.createDefaultIndexes, "create_default_indexes", args);
            flag(options.ifNotExists, "if_not_exists", args);
            flag(options.migrateData, "migrate_data", args);
            return record("create_hypertable", args, timescaledbCreateHypertableInfoCodec);
          }),
        createHypertableLegacy: (relation, timeColumn, options = {}) =>
          context.run(() => {
            const args = new Arguments().relation(relation).bind(v.parse(identifier, timeColumn), "pg_catalog.name");
            args.optional(options.partitioningColumn, (column) =>
              args.bind(v.parse(identifier, column), "pg_catalog.name", "partitioning_column"),
            );
            args.optional(options.numberPartitions, (count) =>
              args.bind(String(v.parse(positiveInt4, count)), "pg_catalog.int4", "number_partitions"),
            );
            args.optional(options.associatedSchemaName, (name) =>
              args.bind(v.parse(identifier, name), "pg_catalog.name", "associated_schema_name"),
            );
            args.optional(options.associatedTablePrefix, (name) =>
              args.bind(v.parse(identifier, name), "pg_catalog.name", "associated_table_prefix"),
            );
            args.optional(options.chunkTimeInterval, (interval) => args.time(interval, "chunk_time_interval"));
            flag(options.createDefaultIndexes, "create_default_indexes", args);
            flag(options.ifNotExists, "if_not_exists", args);
            flag(options.migrateData, "migrate_data", args);
            args.optional(options.chunkTargetSize, (size) =>
              args.bind(v.parse(v.string(), size), "pg_catalog.text", "chunk_target_size"),
            );
            args.optional(options.timePartitioningFunc, (func) => args.routine(func, "time_partitioning_func"));
            args.optional(options.partitioningFunc, (func) => args.routine(func, "partitioning_func"));
            args.optional(options.chunkSizingFunc, (func) => args.routine(func, "chunk_sizing_func"));
            return record("create_hypertable", args, timescaledbCreateHypertableCodec);
          }),
        addDimension: (relation, value, options = {}) =>
          context.run(() => {
            const args = withDimension(new Arguments().relation(relation), value);
            flag(options.ifNotExists, "if_not_exists", args);
            return record("add_dimension", args, timescaledbAddDimensionInfoCodec);
          }),
        addDimensionLegacy: (relation, column, options = {}) =>
          context.run(() => {
            const args = new Arguments().relation(relation).bind(v.parse(identifier, column), "pg_catalog.name");
            args.optional(options.numberPartitions, (count) =>
              args.bind(String(v.parse(positiveInt4, count)), "pg_catalog.int4", "number_partitions"),
            );
            args.optional(options.chunkTimeInterval, (interval) => args.time(interval, "chunk_time_interval"));
            args.optional(options.partitioningFunc, (func) => args.routine(func, "partitioning_func"));
            flag(options.ifNotExists, "if_not_exists", args);
            return record("add_dimension", args, timescaledbAddDimensionCodec);
          }),
        setChunkTimeInterval: (relation, interval, dimensionName) =>
          context.run(() => {
            const args = new Arguments().relation(relation).time(interval);
            args.optional(dimensionName, (name) => args.bind(v.parse(identifier, name), "pg_catalog.name"));
            return effect("set_chunk_time_interval", args);
          }),
        setPartitioningInterval: (relation, interval, dimensionName) =>
          context.run(() => {
            const args = new Arguments().relation(relation).time(interval);
            args.optional(dimensionName, (name) => args.bind(v.parse(identifier, name), "pg_catalog.name"));
            return effect("set_partitioning_interval", args);
          }),
        setNumberPartitions: (relation, partitions, dimensionName) =>
          context.run(() => {
            const args = new Arguments()
              .relation(relation)
              .bind(String(v.parse(positiveInt4, partitions)), "pg_catalog.int4");
            args.optional(dimensionName, (name) => args.bind(v.parse(identifier, name), "pg_catalog.name"));
            return effect("set_number_partitions", args);
          }),
        setIntegerNowFunc: (relation, func, replaceIfExists) =>
          context.run(() => {
            const args = new Arguments().relation(relation).routine(func);
            flag(replaceIfExists, "replace_if_exists", args);
            return effect("set_integer_now_func", args);
          }),
        setAdaptiveChunking: (relation, chunkTargetSize, chunkSizingFunc) =>
          context.run(() => {
            const args = new Arguments()
              .relation(relation)
              .bind(chunkTargetSize === null ? null : v.parse(v.string(), chunkTargetSize), "pg_catalog.text");
            args.optional(chunkSizingFunc, (func) => args.routine(func));
            return record("set_adaptive_chunking", args, timescaledbSetAdaptiveChunkingCodec);
          }),
        showChunks: (relation, filter = {}) =>
          context.run(() => list("show_chunks", new Arguments().relation(relation).filter(filter))),
        dropChunks: (relation, filter) =>
          context.run(() => {
            const args = new Arguments().relation(relation).filter(filter);
            flag(filter.verbose, "verbose", args);
            return list("drop_chunks", args);
          }),
        attachTablespace: (tablespace, relation, ifNotAttached) =>
          context.run(() => {
            const args = new Arguments().bind(v.parse(identifier, tablespace), "pg_catalog.name").relation(relation);
            flag(ifNotAttached, "if_not_attached", args);
            return effect("attach_tablespace", args);
          }),
        detachTablespace: (tablespace, relation, ifAttached) =>
          context.run(() => {
            const args = new Arguments().bind(v.parse(identifier, tablespace), "pg_catalog.name");
            args.optional(relation, (value) => args.relation(value, "hypertable"));
            flag(ifAttached, "if_attached", args);
            return scalar("detach_tablespace", args, int4Codec);
          }),
        detachTablespaces: (relation) =>
          context.run(() => scalar("detach_tablespaces", new Arguments().relation(relation), int4Codec)),
        showTablespaces: (relation) => context.run(() => list("show_tablespaces", new Arguments().relation(relation))),
        enableChunkSkipping: (relation, column, ifNotExists) =>
          context.run(() => {
            const args = new Arguments().relation(relation).bind(v.parse(identifier, column), "pg_catalog.name");
            flag(ifNotExists, "if_not_exists", args);
            return record("enable_chunk_skipping", args, timescaledbEnableChunkSkippingCodec);
          }),
        disableChunkSkipping: (relation, column, ifNotExists) =>
          context.run(() => {
            const args = new Arguments().relation(relation).bind(v.parse(identifier, column), "pg_catalog.name");
            flag(ifNotExists, "if_not_exists", args);
            return record("disable_chunk_skipping", args, timescaledbDisableChunkSkippingCodec);
          }),
        preRestore: () => context.run(() => scalar("timescaledb_pre_restore", new Arguments(), booleanCodec)),
        postRestore: () => context.run(() => scalar("timescaledb_post_restore", new Arguments(), booleanCodec)),
        restrictions: () =>
          context.run(async () => {
            const result = await context.client.query(
              "SELECT pg_catalog.current_setting('timescaledb.license') AS license",
            );
            const license = v.parse(v.string(), result.rows[0].license);
            const apache = license === "apache";
            return Object.freeze({
              license,
              restricted: apache ? timescaledbApacheRestrictedMembers : Object.freeze([]),
              unreachable: apache ? timescaledbApacheUnreachableMembers : Object.freeze([]),
            });
          }),
      } satisfies TimescaledbSession);
    },
    callback,
    signal,
  );
}
