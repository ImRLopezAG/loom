import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { compositeCodec, floatCodec, integerCodec, textCodec, type ExtensionCodec } from "../codecs";
import { int4Codec } from "../native-codecs";
import { extensionRows } from "../rows";
import { createSqlFunction } from "../sql";
import { relationCodec, relationDependency, resolveRelationName, type RelationInput } from "./pgstattuple-codecs";

export type { RelationInput, RelationName } from "./pgstattuple-codecs";
export type { NonfiniteNumber } from "../codecs";

const tupleFields = {
  table_len: integerCodec,
  tuple_count: integerCodec,
  tuple_len: integerCodec,
  tuple_percent: floatCodec,
  dead_tuple_count: integerCodec,
  dead_tuple_len: integerCodec,
  dead_tuple_percent: floatCodec,
  free_space: integerCodec,
  free_percent: floatCodec,
} as const;
const approxFields = {
  table_len: integerCodec,
  scanned_percent: floatCodec,
  approx_tuple_count: integerCodec,
  approx_tuple_len: integerCodec,
  approx_tuple_percent: floatCodec,
  dead_tuple_count: integerCodec,
  dead_tuple_len: integerCodec,
  dead_tuple_percent: floatCodec,
  approx_free_space: integerCodec,
  approx_free_percent: floatCodec,
} as const;
const btreeFields = {
  version: int4Codec,
  tree_level: int4Codec,
  index_size: integerCodec,
  root_block_no: integerCodec,
  internal_pages: integerCodec,
  leaf_pages: integerCodec,
  empty_pages: integerCodec,
  deleted_pages: integerCodec,
  avg_leaf_density: floatCodec,
  leaf_fragmentation: floatCodec,
} as const;
const ginFields = { version: int4Codec, pending_pages: int4Codec, pending_tuples: integerCodec } as const;
const hashFields = {
  version: int4Codec,
  bucket_pages: integerCodec,
  overflow_pages: integerCodec,
  bitmap_pages: integerCodec,
  unused_pages: integerCodec,
  live_items: integerCodec,
  dead_items: integerCodec,
  free_percent: floatCodec,
} as const;
type Fields = Readonly<Record<string, ExtensionCodec<never, unknown>>>;

/**
 * Physical storage observation. Results reflect pages and dead tuples, not table revisions, so every
 * expression is externally observable and automatic live queries reject it. Execution is revoked from
 * PUBLIC (superuser or pg_stat_scan_tables); RLS is not applied to these aggregate counts.
 */
export function createPgstattuple_1_5<
  const Descriptor extends ExtensionDescriptor<"pgstattuple", { version: "1.5"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "pgstattuple" ||
    descriptor.version !== "1.5" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== "6dd83523499b827ca6ba17e3af232cf28a46dded5819afef113fd37ff3913aec"
  )
    throw new Error("pgstattuple 1.5 requires its exact verified contract");
  const schema = descriptor.schema;
  function observe<Result extends ExtensionCodec<never, unknown>>(
    name: string,
    argument: "regclass" | "text",
    result: Result,
    dependencies: readonly string[],
  ) {
    return createSqlFunction({
      schema,
      name,
      member: `routine:$extension:pgstattuple.${name}(pg_catalog.${argument})`,
      arguments: [argument === "regclass" ? relationCodec : textCodec] as const,
      result,
      dependencies,
      observability: "external",
      authority: "query",
    });
  }
  function regclass<Result extends ExtensionCodec<never, unknown>>(name: string, result: Result) {
    return (relation: RelationInput) => {
      const resolved = resolveRelationName(relation);
      return observe(name, "regclass", result, [relationDependency(resolved)])(resolved);
    };
  }
  /** Text overloads parse a possibly-qualified, quote-aware name at execution; no static dependency. */
  function text<Result extends ExtensionCodec<never, unknown>>(name: string, result: Result) {
    return (relation: string) => observe(name, "text", result, [])(relation);
  }
  const record = <const RowFields extends Fields>(name: string, fields: RowFields) => compositeCodec(name, fields);
  const tupleCodec = record("pgstattuple", tupleFields);
  const approxCodec = record("pgstattuple_approx", approxFields);
  const btreeCodec = record("pgstatindex", btreeFields);
  const ginCodec = record("pgstatginindex", ginFields);
  const hashCodec = record("pgstathashindex", hashFields);

  const relationPages = regclass("pg_relpages", integerCodec);
  const tuple = regclass("pgstattuple", tupleCodec);
  const tupleApprox = regclass("pgstattuple_approx", approxCodec);
  const btreeIndex = regclass("pgstatindex", btreeCodec);
  const ginIndex = regclass("pgstatginindex", ginCodec);
  const hashIndex = regclass("pgstathashindex", hashCodec);
  const relationPagesText = text("pg_relpages", integerCodec);
  const tupleText = text("pgstattuple", tupleCodec);
  const btreeIndexText = text("pgstatindex", btreeCodec);
  /** Strings select the captured text overload; relations select regclass. */
  const either =
    <Relation, Text>(byRelation: (relation: RelationInput) => Relation, byText: (name: string) => Text) =>
    (relation: RelationInput | string) =>
      v.is(v.string(), relation) ? byText(relation) : byRelation(relation);
  return bindExtension(descriptor, {
    relationPages,
    tuple,
    tupleApprox,
    btreeIndex,
    ginIndex,
    hashIndex,
    /** Typed FROM rows using the captured OUT column names. */
    tupleRows: (relation: RelationInput, alias: string) => extensionRows(tuple(relation), alias, tupleFields, "named"),
    tupleApproxRows: (relation: RelationInput, alias: string) =>
      extensionRows(tupleApprox(relation), alias, approxFields, "named"),
    btreeIndexRows: (relation: RelationInput, alias: string) =>
      extensionRows(btreeIndex(relation), alias, btreeFields, "named"),
    ginIndexRows: (relation: RelationInput, alias: string) =>
      extensionRows(ginIndex(relation), alias, ginFields, "named"),
    hashIndexRows: (relation: RelationInput, alias: string) =>
      extensionRows(hashIndex(relation), alias, hashFields, "named"),
    tupleCodec,
    tupleApproxCodec: approxCodec,
    btreeIndexCodec: btreeCodec,
    ginIndexCodec: ginCodec,
    hashIndexCodec: hashCodec,
    sql: Object.freeze({
      functions: Object.freeze({
        pg_relpages: either(relationPages, relationPagesText),
        pgstattuple: either(tuple, tupleText),
        pgstattuple_approx: tupleApprox,
        pgstatindex: either(btreeIndex, btreeIndexText),
        pgstatginindex: ginIndex,
        pgstathashindex: hashIndex,
      }),
      operators: Object.freeze({}),
    }),
  });
}
