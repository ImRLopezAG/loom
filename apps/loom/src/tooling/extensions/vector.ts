import type pg from "pg";
import * as v from "valibot";
import type { ExtensionDescriptor } from "../../core/extensions/bindings";
import { createBitCodec, type BitStringValue } from "../../core/extensions/bit-codec";
import { floatCodec, type NonfiniteNumber } from "../../core/extensions/codecs";
import { extensionManifestValidator } from "../../core/extensions/contracts";
import { int4Codec } from "../../core/extensions/native-codecs";
import { validateExtensionManifest } from "../../core/extensions/registry";
import {
  createHalfvecCodec,
  createSparsevecCodec,
  createVectorCodec,
  type DenseVectorValue,
  type SparseVectorValue,
} from "../../core/extensions/vector-codecs";
import { acquireExtensionLock } from "../migrations/connection";
import { withExtensionOperation, type ExtensionOperationContext } from "./operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "./verify";
import source from "./manifests/vector.json";

/** The exact pgvector 0.8.6 catalogue contract; vector family acceptance remains separate. */
export type ExactVector086Descriptor = ExtensionDescriptor<
  "vector",
  { readonly version: "0.8.6"; readonly schema: string }
>;

/** The seven HNSW/IVFFlat user settings registered by pgvector 0.8.6; omitted keys keep their native baseline. */
export interface VectorSearchSettings {
  readonly "hnsw.ef_search"?: number;
  readonly "hnsw.iterative_scan"?: "off" | "relaxed_order" | "strict_order";
  readonly "hnsw.max_scan_tuples"?: number;
  readonly "hnsw.scan_mem_multiplier"?: number;
  readonly "ivfflat.probes"?: number;
  readonly "ivfflat.iterative_scan"?: "off" | "relaxed_order";
  readonly "ivfflat.max_probes"?: number;
}
/** Every setting as natively observed inside the owned transaction. */
export interface VectorSettingsSnapshot {
  readonly "hnsw.ef_search": number;
  readonly "hnsw.iterative_scan": "off" | "relaxed_order" | "strict_order";
  readonly "hnsw.max_scan_tuples": number;
  readonly "hnsw.scan_mem_multiplier": number;
  readonly "ivfflat.probes": number;
  readonly "ivfflat.iterative_scan": "off" | "relaxed_order";
  readonly "ivfflat.max_probes": number;
}

export interface VectorSearchTarget {
  readonly table: { readonly schema: string; readonly name: string };
  readonly idColumn: string;
  readonly embeddingColumn: string;
  /** A native positive int4, checked inside the owned pipeline. */
  readonly limit: number;
  /** One explicit post-index equality predicate, so iterative scans are useful. No general filter language. */
  readonly int4Filter?: { readonly column: string; readonly equals: number };
}
export interface VectorDenseRequest extends VectorSearchTarget {
  readonly kind: "vector" | "halfvec";
  readonly metric: "l2" | "negativeInnerProduct" | "cosine" | "l1";
  readonly probe: DenseVectorValue;
}
export interface VectorSparseRequest extends VectorSearchTarget {
  readonly kind: "sparsevec";
  readonly metric: "l2" | "negativeInnerProduct" | "cosine" | "l1";
  readonly probe: SparseVectorValue;
}
export interface VectorBitRequest extends VectorSearchTarget {
  readonly kind: "bit";
  readonly metric: "hamming" | "jaccard";
  readonly probe: BitStringValue;
}
export type VectorNearestRequest = VectorDenseRequest | VectorSparseRequest | VectorBitRequest;
export interface VectorNearestRow {
  /** Native id::text; a NULL id fails decoding. */
  readonly id: string;
  /** The native float8 distance. Negative inner product stays negative. */
  readonly distance: number | NonfiniteNumber;
}
/** No client, query, run, transaction or setting mutation capability is reachable from this facade. */
export interface VectorSearchSession {
  readonly inspectSettings: () => Promise<VectorSettingsSnapshot>;
  readonly nearest: (request: VectorNearestRequest) => Promise<readonly VectorNearestRow[]>;
  readonly explain: (request: VectorNearestRequest) => Promise<readonly string[]>;
}

const digest = "4e6679e9277c11a3f26d1a920de5f4c1b5401f418c647402a9e611df4a6fb1e4";
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, source));

const encoder = new TextEncoder();
const decoder = new TextDecoder("utf-8", { ignoreBOM: true });
// Matches the lossless 1..63 UTF-8 byte, NUL-free rule of dictionary-reference.ts; deliberately not migrations'
// quoteIdentifier, which only accepts ordinary lowercase names.
const identifier = v.pipe(
  v.string(),
  v.check((value) => {
    const bytes = encoder.encode(value);
    return value.length > 0 && !value.includes("\u0000") && bytes.length <= 63 && decoder.decode(bytes) === value;
  }, "Expected a lossless PostgreSQL identifier of 1–63 UTF-8 bytes"),
);

/** Tagged hnsw.c/ivfflat.c registrations. All are PGC_USERSET without hooks or units. */
const vectorSearchSettingNames = [
  "hnsw.ef_search",
  "hnsw.iterative_scan",
  "hnsw.max_scan_tuples",
  "hnsw.scan_mem_multiplier",
  "ivfflat.probes",
  "ivfflat.iterative_scan",
  "ivfflat.max_probes",
] as const;
type SettingName = (typeof vectorSearchSettingNames)[number];
const realSetting = "hnsw.scan_mem_multiplier";

interface NumberContract {
  readonly name: SettingName;
  readonly vartype: "integer" | "real";
  readonly minimum: number;
  readonly maximum: number;
  readonly boot: number;
}
interface EnumContract {
  readonly name: SettingName;
  readonly vartype: "enum";
  readonly values: readonly string[];
  readonly boot: string;
}
type SettingContract = NumberContract | EnumContract;
const contracts: readonly SettingContract[] = Object.freeze([
  { name: "hnsw.ef_search", vartype: "integer", minimum: 1, maximum: 1000, boot: 40 },
  { name: "hnsw.iterative_scan", vartype: "enum", values: ["off", "relaxed_order", "strict_order"], boot: "off" },
  { name: "hnsw.max_scan_tuples", vartype: "integer", minimum: 1, maximum: 2147483647, boot: 20000 },
  { name: "hnsw.scan_mem_multiplier", vartype: "real", minimum: 1, maximum: 1000, boot: 1 },
  { name: "ivfflat.probes", vartype: "integer", minimum: 1, maximum: 32768, boot: 1 },
  { name: "ivfflat.iterative_scan", vartype: "enum", values: ["off", "relaxed_order"], boot: "off" },
  { name: "ivfflat.max_probes", vartype: "integer", minimum: 1, maximum: 32768, boot: 32768 },
]);
const contractsByName = new Map(contracts.map((contract) => [contract.name, contract] as const));
function contractOf(name: SettingName): SettingContract {
  const contract = contractsByName.get(name);
  if (!contract) throw new Error(`Unknown vector search setting: ${name}`);
  return contract;
}

function integerBetween(minimum: number, maximum: number) {
  return v.pipe(v.number(), v.integer(), v.minValue(minimum), v.maxValue(maximum));
}
// TypeScript's number proves neither bounds nor integerness, so every admission and observation is parsed.
const snapshotValidator = v.strictObject({
  "hnsw.ef_search": integerBetween(1, 1000),
  "hnsw.iterative_scan": v.picklist(["off", "relaxed_order", "strict_order"]),
  "hnsw.max_scan_tuples": integerBetween(1, 2147483647),
  "hnsw.scan_mem_multiplier": v.pipe(v.number(), v.finite(), v.minValue(1), v.maxValue(1000)),
  "ivfflat.probes": integerBetween(1, 32768),
  "ivfflat.iterative_scan": v.picklist(["off", "relaxed_order"]),
  "ivfflat.max_probes": integerBetween(1, 32768),
});
const settingsValidator = v.partial(snapshotValidator);
type SettingsSelection = v.InferOutput<typeof settingsValidator>;

const integerText = v.pipe(v.string(), v.regex(/^-?\d+$/));
const realText = v.pipe(v.string(), v.regex(/^-?\d+(?:\.\d+)?(?:e[+-]?\d+)?$/i));
const canonicalNumber = v.pipe(v.string(), v.regex(/^\d+(?:\.\d+)?$/));
const settingRowValidator = v.strictObject({
  name: v.picklist(vectorSearchSettingNames),
  setting: v.string(),
  unit: v.nullable(v.string()),
  context: v.string(),
  vartype: v.string(),
  source: v.pipe(v.string(), v.minLength(1)),
  min_val: v.nullable(v.string()),
  max_val: v.nullable(v.string()),
  boot_val: v.string(),
  reset_val: v.string(),
  enumvals: v.nullable(v.string()),
});
/** One pg_settings row, with enumvals projected as JSON text to avoid driver array differences. */
export type VectorSettingRow = v.InferOutput<typeof settingRowValidator>;
export interface VectorSettingObservation {
  readonly values: VectorSettingsSnapshot;
  readonly resets: VectorSettingsSnapshot;
}

function metadata(text: string): number {
  const value = Number(v.parse(realText, text));
  return v.parse(v.pipe(v.number(), v.finite()), value);
}
function decodeValue(contract: SettingContract, text: string): number | string {
  if (contract.vartype === "enum") return v.parse(v.picklist(contract.values), text);
  const parsed = Number(v.parse(contract.vartype === "integer" ? integerText : realText, text));
  const bounded = v.pipe(v.number(), v.finite(), v.minValue(contract.minimum), v.maxValue(contract.maximum));
  return contract.vartype === "integer" ? v.parse(v.pipe(bounded, v.integer()), parsed) : v.parse(bounded, parsed);
}
function enumList(text: string): string[] {
  return v.parse(v.array(v.string()), JSON.parse(text));
}
function checkContract(row: VectorSettingRow, contract: SettingContract): void {
  if (row.vartype !== contract.vartype) throw new Error(`Unexpected vartype for ${row.name}`);
  if (row.context !== "user") throw new Error(`Unexpected context for ${row.name}`);
  if (row.unit !== null) throw new Error(`Unexpected unit for ${row.name}`);
  if (contract.vartype === "enum") {
    if (row.min_val !== null || row.max_val !== null || row.enumvals === null)
      throw new Error(`Unexpected enum range for ${row.name}`);
    const values = enumList(row.enumvals);
    // Display order is not part of the contract; membership and cardinality are.
    if (
      new Set(values).size !== values.length ||
      values.length !== contract.values.length ||
      !contract.values.every((value) => values.includes(value))
    )
      throw new Error(`Unexpected enum values for ${row.name}`);
    if (row.boot_val !== contract.boot) throw new Error(`Unexpected boot value for ${row.name}`);
    return;
  }
  if (row.enumvals !== null || row.min_val === null || row.max_val === null)
    throw new Error(`Unexpected numeric range for ${row.name}`);
  if (
    metadata(row.min_val) !== contract.minimum ||
    metadata(row.max_val) !== contract.maximum ||
    metadata(row.boot_val) !== contract.boot
  )
    throw new Error(`Unexpected numeric contract for ${row.name}`);
}

/**
 * Deliberate, documented exception to "no production export used only by tests". The seven registrations are an
 * immutable property of the installed C library binary, so a genuine mismatching binary cannot be driven through the
 * real owner entry; this pure decoder is the only seam that can prove each semantic mismatch fails admission. It
 * performs no I/O and must not be re-exported by any package or tooling index.
 *
 * Validate exactly the seven tagged GUC registrations as natively observed. Current and reset values are
 * recorded as baseline facts and only required to lie inside the registered domain, never to be source defaults.
 */
export function decodeVectorSettingRows(rows: readonly VectorSettingRow[]): VectorSettingObservation {
  const checked = v.parse(v.array(settingRowValidator), rows);
  if (checked.length !== contracts.length) throw new Error("Expected exactly seven vector search settings");
  const values: (readonly [SettingName, number | string])[] = [];
  const resets: (readonly [SettingName, number | string])[] = [];
  const seen = new Set<SettingName>();
  for (const row of checked) {
    if (seen.has(row.name)) throw new Error(`Duplicate vector search setting: ${row.name}`);
    seen.add(row.name);
    const contract = contractOf(row.name);
    checkContract(row, contract);
    values.push([row.name, decodeValue(contract, row.setting)]);
    resets.push([row.name, decodeValue(contract, row.reset_val)]);
  }
  return Object.freeze({
    values: Object.freeze(v.parse(snapshotValidator, Object.fromEntries(values))),
    resets: Object.freeze(v.parse(snapshotValidator, Object.fromEntries(resets))),
  });
}

const settingsQuery =
  "SELECT name,setting,unit,context,vartype,source,min_val,max_val,boot_val,reset_val,pg_catalog.array_to_json(enumvals)::pg_catalog.text AS enumvals FROM pg_catalog.pg_settings WHERE name = ANY($1::pg_catalog.text[]) ORDER BY name";
async function observeSettings(client: Pick<pg.Client, "query">): Promise<VectorSettingObservation> {
  const result = await client.query(settingsQuery, [[...vectorSearchSettingNames]]);
  return decodeVectorSettingRows(result.rows);
}
function sameSnapshot(left: VectorSettingsSnapshot, right: VectorSettingsSnapshot): boolean {
  return vectorSearchSettingNames.every((name) => left[name] === right[name]);
}
/** pg_settings renders reals with %g (six significant digits), so a requested real is compared at that precision. */
function readbackMatches(name: SettingName, wanted: number | string, actual: number | string): boolean {
  if (name !== realSetting) return wanted === actual;
  return v.is(v.number(), wanted) && v.is(v.number(), actual) && Math.abs(wanted - actual) <= wanted * 5.0001e-6;
}
/** Admission only: the first observation after application, where a requested real is rounded by %g. */
function assertRequested(
  observed: VectorSettingsSnapshot,
  baseline: VectorSettingsSnapshot,
  selected: SettingsSelection,
): void {
  for (const name of vectorSearchSettingNames) {
    const wanted = selected[name];
    const actual = observed[name];
    const matches = wanted === undefined ? actual === baseline[name] : readbackMatches(name, wanted, actual);
    if (!matches) throw new Error(`Vector search setting ${name} was not applied as requested`);
  }
}
/** Every later checkpoint is exact against the actual applied snapshot; no tolerance can hide drift. */
function assertApplied(observed: VectorSettingsSnapshot, applied: VectorSettingsSnapshot): void {
  for (const name of vectorSearchSettingNames) {
    if (observed[name] !== applied[name])
      throw new Error(`Vector search setting ${name} differs from the applied owner state`);
  }
}

const denseOperators = { l2: "<->", negativeInnerProduct: "<#>", cosine: "<=>", l1: "<+>" } as const;
const bitOperators = { hamming: "<~>", jaccard: "<%>" } as const;
const denseMetrics = v.picklist(["l2", "negativeInnerProduct", "cosine", "l1"]);
const int4Value = v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647));
const target = {
  table: v.strictObject({ schema: identifier, name: identifier }),
  idColumn: identifier,
  embeddingColumn: identifier,
  limit: v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(2147483647)),
  int4Filter: v.optional(v.strictObject({ column: identifier, equals: int4Value })),
};
// The codecs are the strict authority for probes; these only establish a container for the codec input type.
const denseProbe = v.custom<DenseVectorValue>((input) => Array.isArray(input), "Expected dense vector elements");
const sparseProbe = v.custom<SparseVectorValue>(
  (input) => v.is(v.looseObject({}), input),
  "Expected a sparsevec value",
);
const bitProbe = v.custom<BitStringValue>((input) => v.is(v.looseObject({}), input), "Expected a bit string value");
const requestValidator = v.variant("kind", [
  v.strictObject({ ...target, kind: v.literal("vector"), metric: denseMetrics, probe: denseProbe }),
  v.strictObject({ ...target, kind: v.literal("halfvec"), metric: denseMetrics, probe: denseProbe }),
  v.strictObject({ ...target, kind: v.literal("sparsevec"), metric: denseMetrics, probe: sparseProbe }),
  v.strictObject({
    ...target,
    kind: v.literal("bit"),
    metric: v.picklist(["hamming", "jaccard"]),
    probe: bitProbe,
  }),
]);
const bound = v.union([v.string(), v.number()]);

/** One native pg_catalog.format over a fixed template; every user-selected name is a bound %I argument. */
interface CompiledVectorNearest {
  readonly template: string;
  readonly prefix: string;
  readonly names: readonly string[];
  readonly parameters: readonly (string | number)[];
  readonly limit: number;
}
function operand(checked: v.InferOutput<typeof requestValidator>, schema: string) {
  switch (checked.kind) {
    case "vector":
      return {
        operator: denseOperators[checked.metric],
        typeSchema: schema,
        typeName: "vector",
        probe: v.parse(bound, createVectorCodec(schema).encode(checked.probe)),
      };
    case "halfvec":
      return {
        operator: denseOperators[checked.metric],
        typeSchema: schema,
        typeName: "halfvec",
        probe: v.parse(bound, createHalfvecCodec(schema).encode(checked.probe)),
      };
    case "sparsevec":
      return {
        operator: denseOperators[checked.metric],
        typeSchema: schema,
        typeName: "sparsevec",
        probe: v.parse(bound, createSparsevecCodec(schema).encode(checked.probe)),
      };
    case "bit":
      // Bit remains pg_catalog.bit with no typmod, so every probe bit is preserved.
      return {
        operator: bitOperators[checked.metric],
        typeSchema: "pg_catalog",
        typeName: "bit",
        probe: v.parse(bound, createBitCodec().encode(checked.probe)),
      };
  }
}

/**
 * Closed, fixed-shape ANN request compiler. Kind and operator tokens come only from closed branches; names are
 * independent bound %I arguments (quotes, Unicode and backslashes are quoted natively); values stay `$n` parameters.
 * Private to this leaf: it is exercised only through the closed owner entry.
 */
function compileVectorNearestRequest(
  schema: string,
  request: VectorNearestRequest,
  explain: boolean,
): CompiledVectorNearest {
  const namespace = v.parse(identifier, schema);
  const checked = v.parse(requestValidator, request);
  const selected = operand(checked, namespace);
  const filter = checked.int4Filter;
  const names = [
    checked.idColumn,
    checked.embeddingColumn,
    namespace,
    selected.operator,
    selected.typeSchema,
    selected.typeName,
    checked.table.schema,
    checked.table.name,
  ];
  const parameters: (string | number)[] = [selected.probe];
  if (filter) {
    names.push(filter.column);
    parameters.push(v.parse(bound, int4Codec.encode(filter.equals)));
  }
  parameters.push(v.parse(bound, int4Codec.encode(checked.limit)));
  const prefix = explain ? "EXPLAIN (FORMAT TEXT, ANALYZE FALSE, COSTS TRUE) SELECT " : "SELECT ";
  const distance = "s.%2$I OPERATOR(%3$I.%4$s) $1::%5$I.%6$I";
  const equality = filter ? " AND s.%9$I OPERATOR(pg_catalog.=) $2::pg_catalog.int4" : "";
  const template = `${prefix}s.%1$I::pg_catalog.text AS id,(${distance})::pg_catalog.text AS distance FROM %7$I.%8$I AS s WHERE s.%2$I IS NOT NULL${equality} ORDER BY ${distance} ASC LIMIT $${parameters.length}::pg_catalog.int4`;
  return Object.freeze({
    template,
    prefix,
    names: Object.freeze(names),
    parameters: Object.freeze(parameters),
    limit: checked.limit,
  });
}

const rowsValidator = v.array(v.strictObject({ id: v.string(), distance: v.string() }));
const planValidator = v.pipe(v.array(v.strictObject({ "QUERY PLAN": v.string() })), v.minLength(1));
const loadedValidator = v.tuple([v.strictObject({ dimensions: v.number() })]);

function formatStatement(count: number): string {
  const placeholders = Array.from({ length: count }, (_, index) => `$${index + 2}::pg_catalog.text`);
  return `SELECT pg_catalog.format($1::pg_catalog.text,${placeholders.join(",")}) AS statement`;
}
async function formatted(client: Pick<pg.Client, "query">, template: string, names: readonly string[], prefix: string) {
  const result = await client.query(formatStatement(names.length), [template, ...names]);
  const [row] = v.parse(
    v.tuple([v.strictObject({ statement: v.pipe(v.string(), v.minLength(1), v.startsWith(prefix)) })]),
    result.rows,
  );
  return row.statement;
}
/** Actually load the C library on this backend: placeholders and unregistered dotted names are not load proof. */
async function forceLoad(client: Pick<pg.Client, "query">, schema: string): Promise<void> {
  const statement = await formatted(
    client,
    "SELECT %1$I.vector_dims($1::%1$I.vector) AS dimensions",
    [schema],
    "SELECT ",
  );
  const result = await client.query(statement, [v.parse(bound, createVectorCodec(schema).encode([1]))]);
  const [row] = v.parse(loadedValidator, result.rows);
  if (int4Codec.decode(row.dimensions) !== 1)
    throw new Error("Vector library load probe returned an unexpected result");
}

async function pipeline<Output>(
  context: ExtensionOperationContext,
  schema: string,
  applied: VectorSettingsSnapshot,
  request: VectorNearestRequest,
  explain: boolean,
  decode: (result: pg.QueryResult, compiled: CompiledVectorNearest) => Output,
): Promise<Output> {
  const compiled = compileVectorNearestRequest(schema, request, explain);
  const checkpoint = async () => {
    assertApplied((await observeSettings(context.client)).values, applied);
  };
  await checkpoint();
  const statement = await formatted(context.client, compiled.template, compiled.names, compiled.prefix);
  const output = decode(await context.client.query(statement, [...compiled.parameters]), compiled);
  // Native expression or target behavior must not have moved session state while the pipeline ran.
  await checkpoint();
  return output;
}
function decodeRows(result: pg.QueryResult, compiled: CompiledVectorNearest): readonly VectorNearestRow[] {
  if (result.command !== "SELECT") throw new Error(`Unexpected vector query command: ${result.command}`);
  const rows = v.parse(rowsValidator, result.rows);
  if (rows.length > compiled.limit) throw new Error("Vector query returned more rows than its limit");
  return Object.freeze(rows.map((row) => Object.freeze({ id: row.id, distance: floatCodec.decode(row.distance) })));
}
function decodePlan(result: pg.QueryResult): readonly string[] {
  if (result.command !== "EXPLAIN") throw new Error(`Unexpected vector EXPLAIN command: ${result.command}`);
  return Object.freeze(v.parse(planValidator, result.rows).map((row) => row["QUERY PLAN"]));
}

function requirement(descriptor: ExactVector086Descriptor) {
  if (
    descriptor.name !== "vector" ||
    descriptor.version !== "0.8.6" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest ||
    manifest.digest !== digest ||
    manifest.contract.version !== "0.8.6"
  )
    throw new Error("vector 0.8.6 search tooling requires its exact verified contract");
  const schema = v.parse(identifier, descriptor.schema);
  return { schema, requirement: validateExtensionApiRequirement({ schema, manifest }) };
}

/**
 * Dedicated direct operator credentials: one owned backend and transaction, one queue for the whole family.
 * Requested settings are transaction-local (set_config(...,true)); omitted settings keep the native role/session
 * baseline. Native reset is observed on the same backend after the acknowledged terminal reply, through the
 * trusted afterTransaction observer. Without a baseline (initialization failed first) nothing is claimed.
 */
export async function withVectorSearchSettings<Result>(
  directOperatorUrl: string,
  descriptor: ExactVector086Descriptor,
  settings: VectorSearchSettings,
  callback: (session: VectorSearchSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result }> {
  // valibot's strictObject admits any non-null object, so an array would otherwise become an empty selection.
  if (Array.isArray(settings)) throw new Error("Expected a closed vector search settings object, not an array");
  const selected = v.parse(settingsValidator, settings);
  const checked = requirement(descriptor);
  let baseline: VectorSettingObservation | undefined;
  return withExtensionOperation(
    directOperatorUrl,
    async (context) => {
      await acquireExtensionLock(context.client, signal);
      await verifyExtensionApiContracts(context.client, [checked.requirement]);
      await forceLoad(context.client, checked.schema);
      const initial = await observeSettings(context.client);
      baseline = initial;
      for (const name of vectorSearchSettingNames) {
        const wanted = selected[name];
        if (wanted === undefined) continue;
        const text = String(wanted);
        if (v.is(v.number(), wanted)) v.parse(canonicalNumber, text);
        const result = await context.client.query(
          "SELECT pg_catalog.set_config($1::pg_catalog.text,$2::pg_catalog.text,true) AS value",
          [name, text],
        );
        const [row] = v.parse(v.tuple([v.strictObject({ value: v.string() })]), result.rows);
        if (!readbackMatches(name, wanted, decodeValue(contractOf(name), row.value)))
          throw new Error(`Vector search setting ${name} was not applied`);
      }
      // Tolerance applies only to this first readback; the complete applied snapshot is then exact.
      const applied = (await observeSettings(context.client)).values;
      assertRequested(applied, initial.values, selected);
      const session: VectorSearchSession = Object.freeze({
        inspectSettings: () =>
          context.run(async () => {
            const observed = (await observeSettings(context.client)).values;
            assertApplied(observed, applied);
            return observed;
          }),
        nearest: (request: VectorNearestRequest) =>
          context.run(() => pipeline(context, checked.schema, applied, request, false, decodeRows)),
        explain: (request: VectorNearestRequest) =>
          context.run(() => pipeline(context, checked.schema, applied, request, true, decodePlan)),
      });
      return session;
    },
    callback,
    signal,
    async (context: ExtensionOperationContext, completion: "committed" | "rolled-back") => {
      const reference = baseline;
      if (reference === undefined) return;
      const terminal = await observeSettings(context.client);
      if (!sameSnapshot(terminal.values, reference.values) || !sameSnapshot(terminal.resets, reference.resets))
        throw new Error(`Vector search settings did not return to their native baseline after ${completion}`);
    },
  );
}
