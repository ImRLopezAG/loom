import * as v from "valibot";
import pg from "pg";
import { createIsn_1_3 } from "../../../core/extensions/adapters/isn";
import { booleanCodec, nullableCodec } from "../../../core/extensions/codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import type { IsnKind, IsnValue } from "../../../core/extensions/adapters/isn-codecs";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { acquireExtensionLock } from "../../migrations/connection";
import { withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/isn.json";

type Descriptor = ExtensionDescriptor<"isn", { readonly version: "1.3"; readonly schema: string }>;
export interface IsnSession {
  readonly weakStatus: () => Promise<boolean>;
  readonly setWeak: (value: boolean | null) => Promise<boolean | null>;
  readonly ean13: (text: string) => Promise<IsnValue<"ean13">>;
  readonly isbn: (text: string) => Promise<IsnValue<"isbn">>;
  readonly isbn13: (text: string) => Promise<IsnValue<"isbn13">>;
  readonly ismn: (text: string) => Promise<IsnValue<"ismn">>;
  readonly ismn13: (text: string) => Promise<IsnValue<"ismn13">>;
  readonly issn: (text: string) => Promise<IsnValue<"issn">>;
  readonly issn13: (text: string) => Promise<IsnValue<"issn13">>;
  readonly upc: (text: string) => Promise<IsnValue<"upc">>;
}

/** Own a fresh direct backend; PostgreSQL's session-level isn_weak setter never reaches an invocation pool. */
export async function withIsnSession<Result>(
  directOperatorUrl: string,
  descriptor: Descriptor,
  callback: (session: IsnSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result }> {
  const api = createIsn_1_3(descriptor);
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
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  const bool = nullableCodec(booleanCodec);
  return withExtensionOperation(
    directOperatorUrl,
    async (context) => {
      await acquireExtensionLock(context.client, signal);
      await verifyExtensionApiContracts(context.client, [requirement]);
      function parse<const Kind extends IsnKind>(kind: Kind, text: string): Promise<IsnValue<Kind>> {
        return context.run(async () => {
          // The closed kind map determines both SQL type and the decoder; no caller SQL or result cast is accepted.
          const codec = api[kind].codec;
          const input = api[kind].value(text);
          const result = await context.client.query(
            `SELECT $1::${namespace}.${pg.escapeIdentifier(kind)}::pg_catalog.text AS value`,
            [input.text],
          );
          const [row] = v.parse(v.tuple([v.strictObject({ value: v.string() })]), result.rows);
          // SAFETY: the closed kind map selects the codec for this same Kind, validated by its discriminant.
          return codec.decode(row.value) as IsnValue<Kind>;
        });
      }
      return Object.freeze({
        weakStatus: () =>
          context.run(async () => {
            const result = await context.client.query(`SELECT ${namespace}.isn_weak() AS value`);
            const [row] = v.parse(v.tuple([v.strictObject({ value: v.boolean() })]), result.rows);
            return booleanCodec.decode(row.value);
          }),
        setWeak: (value: boolean | null) =>
          context.run(async () => {
            const result = await context.client.query(`SELECT ${namespace}.isn_weak($1::pg_catalog.bool) AS value`, [
              bool.encode(value),
            ]);
            const [row] = v.parse(v.tuple([v.strictObject({ value: v.nullable(v.boolean()) })]), result.rows);
            return bool.decode(row.value);
          }),
        ean13: (text: string) => parse("ean13", text),
        isbn: (text: string) => parse("isbn", text),
        isbn13: (text: string) => parse("isbn13", text),
        ismn: (text: string) => parse("ismn", text),
        ismn13: (text: string) => parse("ismn13", text),
        issn: (text: string) => parse("issn", text),
        issn13: (text: string) => parse("issn13", text),
        upc: (text: string) => parse("upc", text),
      });
    },
    callback,
    signal,
  );
}
