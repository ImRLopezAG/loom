import * as v from "valibot";
import type { ExtensionDescriptor } from "../../core/extensions/bindings";
import { extensionManifestValidator } from "../../core/extensions/contracts";
import { validateExtensionManifest } from "../../core/extensions/registry";
import { acquireExtensionLock } from "../migrations/connection";
import { quoteExtensionSchema } from "../config/extensions";
import { withExtensionOperation, type ExtensionOperationContext } from "./operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "./verify";
import source from "./manifests/hll.json";

const digest = "44f6623b1b7a463ea7cb26fcd02b434cb33c36a4bd9edfe0397e2536f66f6b19";
const manifest = validateExtensionManifest(v.parse(extensionManifestValidator, source));
const int4 = v.pipe(v.number(), v.integer(), v.minValue(-2147483648), v.maxValue(2147483647));
const defaultsValidator = v.strictObject({
  log2m: int4,
  regwidth: int4,
  expthresh: v.pipe(v.number(), v.safeInteger()),
  sparseon: int4,
});
export type HllDefaults = v.InferOutput<typeof defaultsValidator>;
const nativeDefaults = v.pipe(
  v.strictObject({
    o_log2m: v.number(),
    o_regwidth: v.number(),
    o_expthresh: v.pipe(v.string(), v.regex(/^-?\d+$/)),
    o_sparseon: v.number(),
  }),
  v.transform((row): HllDefaults => ({
    log2m: row.o_log2m,
    regwidth: row.o_regwidth,
    expthresh: Number(row.o_expthresh),
    sparseon: row.o_sparseon,
  })),
);
const previous = v.pipe(
  v.strictObject({ value: int4 }),
  v.transform((row) => row.value),
);
type Descriptor = ExtensionDescriptor<"hll", { readonly version: "2.21"; readonly schema: string }>;
/** No client, transaction or run capability is reachable from this facade. */
export interface HllSession {
  /**
   * Runs one parameterized query expression on the owned backend whose process-local hll settings were changed. The
   * text is a derived table, so transaction control and data-modifying WITH are refused natively, and the extended
   * protocol refuses multiple statements; either failure fails the whole operation. Every row is parsed by `row`.
   */
  readonly query: <Row>(
    text: string,
    row: v.GenericSchema<unknown, Row>,
    values?: readonly (string | number | boolean | null)[],
  ) => Promise<readonly Row[]>;
  /** Returns the previous defaults. They apply to hll_empty() and modifier-less aggregates on this backend only. */
  readonly setDefaults: (defaults: HllDefaults) => Promise<HllDefaults>;
  /** Returns the previous maximum; -1 lets hll choose sparse or full by size. */
  readonly setMaxSparse: (value: number) => Promise<number>;
  /** Returns the previous output version. hll 2.21 accepts only version 1. */
  readonly setOutputVersion: (value: number) => Promise<number>;
}

const parameter = v.union([v.string(), v.number(), v.boolean(), v.null()]);
async function select<Row>(
  context: ExtensionOperationContext,
  text: string,
  row: v.GenericSchema<unknown, Row>,
  values: readonly v.InferOutput<typeof parameter>[],
): Promise<readonly Row[]> {
  // Every caller binds at least one value, so node-pg uses the extended protocol, which refuses multiple statements.
  const result = await context.client.query(text, [...values]);
  if (result.command !== "SELECT") throw new Error(`Unexpected hll session command: ${result.command}`);
  return Object.freeze(v.parse(v.array(row), result.rows));
}

/**
 * hll setters mutate backend process memory, not GUCs: neither transactions nor RESET restore them, and parallel
 * workers keep the built-in defaults. Each session owns one direct operator backend and transaction under the shared
 * operation lifecycle and ends that backend, so a changed setting never reaches an application invocation or pooled
 * connection.
 */
export async function withHllSession<Result>(
  connectionString: string,
  descriptor: Descriptor,
  operation: (session: HllSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result }> {
  if (
    descriptor.name !== "hll" ||
    descriptor.version !== "2.21" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest ||
    manifest.digest !== digest
  )
    throw new Error("hll operator tooling requires its exact verified 2.21 contract");
  const namespace = quoteExtensionSchema(descriptor.schema);
  const requirement = validateExtensionApiRequirement({ schema: descriptor.schema, manifest });
  return withExtensionOperation(
    connectionString,
    async (context) => {
      await acquireExtensionLock(context.client, signal);
      await verifyExtensionApiContracts(context.client, [requirement]);
      return Object.freeze({
        query: <Row>(
          text: string,
          row: v.GenericSchema<unknown, Row>,
          values: readonly (string | number | boolean | null)[] = [],
        ) =>
          context.run(() => {
            const parameters = v.parse(v.array(parameter), values);
            // A COMMIT reply cannot be retracted, so commands are refused by the grammar before execution, not after:
            // a derived table admits only a query expression, never transaction control or data-modifying WITH.
            return select(
              context,
              `select * from (${v.parse(v.string(), text)}\n) as hll_session_query where $${parameters.length + 1}::pg_catalog.bool`,
              row,
              [...parameters, true],
            );
          }),
        setDefaults: (defaults: HllDefaults) =>
          context.run(async () => {
            const { log2m, regwidth, expthresh, sparseon } = v.parse(defaultsValidator, defaults);
            const rows = await select(
              context,
              `select * from ${namespace}.hll_set_defaults($1::pg_catalog.int4,$2::pg_catalog.int4,$3::pg_catalog.int8,$4::pg_catalog.int4)`,
              nativeDefaults,
              [log2m, regwidth, String(expthresh), sparseon],
            );
            return v.parse(v.tuple([defaultsValidator]), rows)[0];
          }),
        setMaxSparse: (value: number) =>
          context.run(async () => {
            const rows = await select(
              context,
              `select ${namespace}.hll_set_max_sparse($1::pg_catalog.int4) as value`,
              previous,
              [v.parse(int4, value)],
            );
            return v.parse(v.tuple([v.number()]), rows)[0];
          }),
        setOutputVersion: (value: number) =>
          context.run(async () => {
            const rows = await select(
              context,
              `select ${namespace}.hll_set_output_version($1::pg_catalog.int4) as value`,
              previous,
              [v.parse(int4, value)],
            );
            return v.parse(v.tuple([v.number()]), rows)[0];
          }),
      } satisfies HllSession);
    },
    operation,
    signal,
  );
}
