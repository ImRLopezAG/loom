import * as v from "valibot";
import pg from "pg";
import { createSemver_0_40_0 } from "../../../core/extensions/adapters/semver";
import { createSemverCodec, type SemverText } from "../../../core/extensions/adapters/semver-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import {
  floatCodec,
  integerCodec,
  nullableCodec,
  numericCodec,
  type CodecInput,
  type ExtensionCodec,
} from "../../../core/extensions/codecs";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { int4Codec } from "../../../core/extensions/native-codecs";
import { float4Codec, int2Codec } from "../../../core/extensions/primitive-number-codecs";
import { acquireExtensionLock } from "../../migrations/connection";
import { withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/semver.json";

type Descriptor = ExtensionDescriptor<"semver", { readonly version: "0.40.0"; readonly schema: string }>;
const sources = {
  int2: int2Codec,
  int4: int4Codec,
  int8: integerCodec,
  float4: float4Codec,
  float8: floatCodec,
  numeric: numericCodec,
} as const;
type Source = keyof typeof sources;
type Convert<Kind extends Source> = (value: CodecInput<(typeof sources)[Kind]> | null) => Promise<SemverText | null>;
export interface SemverSession {
  /** The search_path this backend's transaction observes; the operation sets it transaction-locally. */
  readonly searchPath: () => Promise<string>;
  /** routine:$extension:semver.semver(pg_catalog.<source>) */
  readonly semver: { readonly [Kind in Source]: Convert<Kind> };
  /** cast:pg_catalog.<source>->$extension:semver.semver */
  readonly casts: { readonly [Kind in Source as `${Kind}_to_semver`]: Convert<Kind> };
}
/** Same-backend observations; the setting is transaction-scoped, so `after` is read once the transaction ended. */
export interface SemverSearchPathEffect {
  readonly scope: "transaction";
  readonly before: string;
  readonly during: string;
  readonly after: string;
}

/**
 * semver 0.40.0 defines its six numeric semver(...) routines, and the casts built on them, as SQL-language wrappers
 * calling unqualified to_semver. They resolve only when the extension schema is on search_path, so they run here on
 * an owned direct backend whose transaction sets search_path to exactly that schema and pg_catalog.
 */
export async function withSemverSession<Result>(
  directOperatorUrl: string,
  descriptor: Descriptor,
  callback: (session: SemverSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result; readonly searchPath: SemverSearchPathEffect }> {
  createSemver_0_40_0(descriptor);
  const namespace = pg.escapeIdentifier(
    v.parse(
      v.pipe(
        v.string(),
        v.minLength(1),
        v.check((value) => !value.includes("\0")),
      ),
      descriptor.schema,
    ),
  );
  const path = `${namespace}, pg_catalog`;
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  const output = nullableCodec(createSemverCodec(descriptor.schema));
  const row = v.tuple([v.strictObject({ value: v.nullable(v.string()) })]);
  let before: string | undefined;
  let during: string | undefined;
  let after: string | undefined;
  async function observe(client: pg.Client) {
    const result = await client.query("SELECT pg_catalog.current_setting('search_path') AS value");
    return v.parse(v.tuple([v.strictObject({ value: v.string() })]), result.rows)[0].value;
  }
  const result = await withExtensionOperation(
    directOperatorUrl,
    async (context) => {
      await acquireExtensionLock(context.client, signal);
      await verifyExtensionApiContracts(context.client, [requirement]);
      before = await observe(context.client);
      await context.client.query("SELECT pg_catalog.set_config('search_path', $1, true)", [path]);
      during = await observe(context.client);
      function convert<Kind extends Source>(kind: Kind, expression: (input: string) => string): Convert<Kind> {
        // SAFETY: sources[kind] is the closed codec for this Kind; widening only erases the per-key input union.
        const input = nullableCodec(sources[kind] as ExtensionCodec<CodecInput<(typeof sources)[Kind]>, unknown>);
        return (value) =>
          context.run(async () => {
            const typed = `$1::pg_catalog.${kind}`;
            const selected = await context.client.query(`SELECT (${expression(typed)})::pg_catalog.text AS value`, [
              input.encode(value),
            ]);
            return output.decode(v.parse(row, selected.rows)[0].value);
          });
      }
      const routine = <Kind extends Source>(kind: Kind) => convert(kind, (typed) => `${namespace}.semver(${typed})`);
      const cast = <Kind extends Source>(kind: Kind) => convert(kind, (typed) => `(${typed})::${namespace}.semver`);
      return Object.freeze({
        searchPath: () => context.run(() => observe(context.client)),
        semver: Object.freeze({
          int2: routine("int2"),
          int4: routine("int4"),
          int8: routine("int8"),
          float4: routine("float4"),
          float8: routine("float8"),
          numeric: routine("numeric"),
        }),
        casts: Object.freeze({
          int2_to_semver: cast("int2"),
          int4_to_semver: cast("int4"),
          int8_to_semver: cast("int8"),
          float4_to_semver: cast("float4"),
          float8_to_semver: cast("float8"),
          numeric_to_semver: cast("numeric"),
        }),
      } satisfies SemverSession);
    },
    callback,
    signal,
    async (context) => {
      after = await observe(context.client);
    },
  );
  if (before === undefined || during === undefined || after === undefined)
    throw new Error("semver search_path was not observed");
  return { ...result, searchPath: Object.freeze({ scope: "transaction", before, during, after }) };
}
