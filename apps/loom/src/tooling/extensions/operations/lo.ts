import * as v from "valibot";
import { createLo_1_2 } from "../../../core/extensions/adapters/lo";
import { loOidCodec } from "../../../core/extensions/adapters/lo-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { binaryCodec } from "../../../core/extensions/codecs";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { acquireExtensionLock } from "../../migrations/connection";
import { withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/lo.json";

export interface LargeObjectSession {
  readonly create: (bytes: { readonly hex: string }) => Promise<number>;
  readonly read: (
    oid: number,
    range?: { readonly offset: bigint; readonly length: number },
  ) => Promise<{ hex: string }>;
  readonly write: (oid: number, offset: bigint, bytes: { readonly hex: string }) => Promise<void>;
  readonly unlink: (oid: number) => Promise<void>;
}
const offsetValidator = v.pipe(v.bigint(), v.minValue(0n), v.maxValue(9223372036854775807n));
const rangeValidator = v.strictObject({
  offset: offsetValidator,
  length: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483647)),
});

/** Native LO convenience functions avoid leaking backend-local descriptors; all writes roll back with the owner transaction. */
export async function withLargeObjects<Result>(
  directOperatorUrl: string,
  descriptor: ExtensionDescriptor<"lo", { version: "1.2"; schema: string }>,
  callback: (session: LargeObjectSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result }> {
  createLo_1_2(descriptor);
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  return withExtensionOperation(
    directOperatorUrl,
    async (context) => {
      await acquireExtensionLock(context.client, signal);
      await verifyExtensionApiContracts(context.client, [requirement]);
      return Object.freeze({
        create: (bytes: { readonly hex: string }) =>
          context.run(async () => {
            const result = await context.client.query(
              "SELECT pg_catalog.lo_from_bytea(0::pg_catalog.oid,$1::pg_catalog.bytea)::pg_catalog.text AS oid",
              [binaryCodec.encode(bytes)],
            );
            const [row] = v.parse(v.tuple([v.strictObject({ oid: v.string() })]), result.rows);
            return loOidCodec.decode(row.oid);
          }),
        read: (oid: number, range?: { readonly offset: bigint; readonly length: number }) =>
          context.run(async () => {
            const checked = range === undefined ? undefined : v.parse(rangeValidator, range);
            const query =
              checked === undefined
                ? "SELECT pg_catalog.lo_get($1::pg_catalog.oid) AS bytes"
                : "SELECT pg_catalog.lo_get($1::pg_catalog.oid,$2::pg_catalog.int8,$3::pg_catalog.int4) AS bytes";
            const result = await context.client.query(
              query,
              checked === undefined
                ? [loOidCodec.encode(oid)]
                : [loOidCodec.encode(oid), checked.offset.toString(), checked.length],
            );
            if (result.rows.length !== 1) throw new Error("Large object read requires one row");
            return binaryCodec.decode(result.rows[0].bytes);
          }),
        write: (oid: number, offset: bigint, bytes: { readonly hex: string }) =>
          context.run(async () => {
            await context.client.query(
              "SELECT pg_catalog.lo_put($1::pg_catalog.oid,$2::pg_catalog.int8,$3::pg_catalog.bytea)",
              [loOidCodec.encode(oid), v.parse(offsetValidator, offset).toString(), binaryCodec.encode(bytes)],
            );
          }),
        unlink: (oid: number) =>
          context.run(async () => {
            const result = await context.client.query("SELECT pg_catalog.lo_unlink($1::pg_catalog.oid) AS unlinked", [
              loOidCodec.encode(oid),
            ]);
            v.parse(v.tuple([v.strictObject({ unlinked: v.literal(1) })]), result.rows);
          }),
      });
    },
    callback,
    signal,
  );
}
