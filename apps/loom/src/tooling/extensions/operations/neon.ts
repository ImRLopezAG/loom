import * as v from "valibot";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import manifest from "../manifests/neon.json";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import { acquireExtensionLock } from "../../migrations/connection";
import { ExtensionOperationError, withExtensionOperation } from "../operations";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { binaryCodec, booleanCodec, integerCodec, nullableCodec, textCodec } from "../../../core/extensions/codecs";
import { int4Codec } from "../../../core/extensions/native-codecs";
import * as codecs from "../../../core/extensions/adapters/neon-codecs";

/** Explicit operator connection only. Native shared cache/WAL mutations are not transactionally undone.
 * This API never changes storage settings or performs work unless the caller invokes a named method.
 */
export async function withNeonOperation<Result>(
  connectionString: string,
  descriptor: ExtensionDescriptor<"neon", { version: "1.25"; schema: string }>,
  operation: (session: NeonOperation) => Promise<Result>,
  signal?: AbortSignal,
) {
  if (
    descriptor.name !== "neon" ||
    descriptor.version !== "1.25" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== "1f2d339beee9dcc3c93fdc0856fb9c307a04d5937a00ad7174014604be39a09e"
  )
    throw new Error("neon 1.25 requires its exact verified contract");
  const schema = '"' + descriptor.schema.replaceAll('"', '""') + '"';
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, manifest),
  });
  const effects: NeonEffect[] = [];
  const snapshot = () => Object.freeze(effects.map((effect) => Object.freeze({ ...effect })));
  async function mutation<Value>(member: string, work: () => Promise<Value>): Promise<Value> {
    const index = effects.push({ member, state: "unknown", rollback: "not-transactional" }) - 1;
    const value = await work();
    effects[index] = { member, state: "acknowledged", rollback: "not-transactional" };
    return value;
  }
  const initialize = async (context: import("../operations").ExtensionOperationContext) => {
    await acquireExtensionLock(context.client, signal);
    await verifyExtensionApiContracts(context.client, [requirement]);
    const query = async (name: string, parameters: readonly unknown[], argumentTypes: readonly string[]) => {
      const args = parameters.map((_, index) => `$${index + 1}::pg_catalog.${argumentTypes[index]}`).join(",");
      return context.client.query(`SELECT ${schema}."${name}"(${args})::text AS value`, [...parameters]);
    };
    return Object.freeze({
      approximateWorkingSetSize: (reset: boolean | null) =>
        context.run(async () => {
          const encoded = [nullableCodec(booleanCodec).encode(reset)];
          const result = await (reset === true
            ? mutation("approximate_working_set_size", () => query("approximate_working_set_size", encoded, ["bool"]))
            : query("approximate_working_set_size", encoded, ["bool"]));
          return nullableCodec(int4Codec).decode(result.rows[0]?.value);
        }),
      cancelBufferCachePrewarm: () =>
        context.run(() =>
          mutation("cancel_buffer_cache_prewarm", async () => {
            const encoded: unknown[] = [];
            const result = await query("cancel_buffer_cache_prewarm", encoded, []);
            return codecs.voidCodec.decode(result.rows[0]?.value);
          }),
        ),
      cancelPrewarm: () =>
        context.run(() =>
          mutation("cancel_prewarm", async () => {
            const encoded: unknown[] = [];
            const result = await query("cancel_prewarm", encoded, []);
            return codecs.voidCodec.decode(result.rows[0]?.value);
          }),
        ),
      getBufferCacheStateSql: (max_pages?: number | null) =>
        context.run(async () => {
          const encoded = max_pages === undefined ? [] : [nullableCodec(int4Codec).encode(max_pages)];
          const result = await query("get_buffer_cache_state_sql", encoded, ["int4"]);
          return nullableCodec(binaryCodec).decode(result.rows[0]?.value);
        }),
      getBuffercachePrewarmInfo: () =>
        context.run(async () => {
          const encoded: unknown[] = [];
          const result = await query("get_buffercache_prewarm_info", encoded, []);
          return codecs.getBuffercachePrewarmInfoCodec.decode(result.rows[0]?.value);
        }),
      neonClearLfc: () =>
        context.run(() =>
          mutation("neon_clear_lfc", async () => {
            const encoded: unknown[] = [];
            const result = await query("neon_clear_lfc", encoded, []);
            return codecs.voidCodec.decode(result.rows[0]?.value);
          }),
        ),
      neonEmitReverseEtlCommit: (
        protobuf_data: import("../../../core/extensions/codecs").CodecInput<typeof binaryCodec> | null,
      ) =>
        context.run(() =>
          mutation("neon_emit_reverse_etl_commit", async () => {
            const encoded = [nullableCodec(binaryCodec).encode(protobuf_data)];
            const result = await query("neon_emit_reverse_etl_commit", encoded, ["bytea"]);
            return nullableCodec(codecs.lsnCodec).decode(result.rows[0]?.value);
          }),
        ),
      neonInvalidateRelsizeCache: (relation_oid: number | null, fork_number?: number | null) =>
        context.run(() =>
          mutation("neon_invalidate_relsize_cache", async () => {
            const encoded = [nullableCodec(codecs.oidCodec).encode(relation_oid)];
            if (fork_number !== undefined) encoded.push(nullableCodec(int4Codec).encode(fork_number));
            const result = await query("neon_invalidate_relsize_cache", encoded, ["oid", "int4"]);
            return nullableCodec(booleanCodec).decode(result.rows[0]?.value);
          }),
        ),
      neonShmemHugePages: (shared_buffers_size: string | null, lfc_size: string | null) =>
        context.run(async () => {
          const encoded = [
            nullableCodec(textCodec).encode(shared_buffers_size),
            nullableCodec(textCodec).encode(lfc_size),
          ];
          const result = await query("neon_shmem_huge_pages", encoded, ["text", "text"]);
          return nullableCodec(integerCodec).decode(result.rows[0]?.value);
        }),
      pgResizeSharedBuffers: (new_size: string | null) =>
        context.run(() =>
          mutation("pg_resize_shared_buffers", async () => {
            const encoded = [nullableCodec(textCodec).encode(new_size)];
            const args = encoded.map((_, index) => `$${index + 1}::pg_catalog.${["text"][index]}`).join(",");
            const result = await context.client.query(
              `SELECT row_value::text AS value FROM ${schema}."pg_resize_shared_buffers"(${args}) AS row_value`,
              encoded,
            );
            return result.rows.map((row) => codecs.pgResizeSharedBuffersCodec.decode(row.value));
          }),
        ),
      prewarmBufferCache: (state: import("../../../core/extensions/codecs").CodecInput<typeof binaryCodec> | null) =>
        context.run(() =>
          mutation("prewarm_buffer_cache", async () => {
            const encoded = [nullableCodec(binaryCodec).encode(state)];
            const result = await query("prewarm_buffer_cache", encoded, ["bytea"]);
            return nullableCodec(int4Codec).decode(result.rows[0]?.value);
          }),
        ),
      prewarmLocalCache: (
        state: import("../../../core/extensions/codecs").CodecInput<typeof binaryCodec> | null,
        n_workers?: number | null,
      ) =>
        context.run(() =>
          mutation("prewarm_local_cache", async () => {
            const encoded: unknown[] = [nullableCodec(binaryCodec).encode(state)];
            if (n_workers !== undefined) encoded.push(nullableCodec(int4Codec).encode(n_workers));
            const result = await query("prewarm_local_cache", encoded, ["bytea", "int4"]);
            return nullableCodec(codecs.voidCodec).decode(result.rows[0]?.value);
          }),
        ),
      replaceHll: (hll: import("../../../core/extensions/codecs").CodecInput<typeof binaryCodec> | null) =>
        context.run(() =>
          mutation("replace_hll", async () => {
            const encoded = [nullableCodec(binaryCodec).encode(hll)];
            const result = await query("replace_hll", encoded, ["bytea"]);
            return codecs.voidCodec.decode(result.rows[0]?.value);
          }),
        ),
      resetPerfCounter: (name: string | null) =>
        context.run(() =>
          mutation("reset_perf_counter", async () => {
            const encoded = [nullableCodec(textCodec).encode(name)];
            const result = await query("reset_perf_counter", encoded, ["text"]);
            return nullableCodec(booleanCodec).decode(result.rows[0]?.value);
          }),
        ),
    });
  };
  try {
    const result = await withExtensionOperation(connectionString, initialize, operation, signal);
    return { ...result, effects: snapshot() };
  } catch (cause) {
    if (cause instanceof ExtensionOperationError) throw new NeonOperationError(cause, snapshot());
    throw cause;
  }
}

export interface NeonOperation {
  approximateWorkingSetSize(reset: boolean | null): Promise<number | null>;
  cancelBufferCachePrewarm(): Promise<undefined>;
  cancelPrewarm(): Promise<undefined>;
  getBufferCacheStateSql(
    max_pages?: number | null,
  ): Promise<import("../../../core/extensions/codecs").CodecOutput<typeof binaryCodec> | null>;
  getBuffercachePrewarmInfo(): Promise<
    import("../../../core/extensions/codecs").CodecOutput<typeof codecs.getBuffercachePrewarmInfoCodec>
  >;
  neonClearLfc(): Promise<undefined>;
  neonEmitReverseEtlCommit(
    protobuf_data: import("../../../core/extensions/codecs").CodecInput<typeof binaryCodec> | null,
  ): Promise<string | null>;
  neonInvalidateRelsizeCache(relation_oid: number | null, fork_number?: number | null): Promise<boolean | null>;
  neonShmemHugePages(shared_buffers_size: string | null, lfc_size: string | null): Promise<bigint | null>;
  pgResizeSharedBuffers(
    new_size: string | null,
  ): Promise<import("../../../core/extensions/codecs").CodecOutput<typeof codecs.pgResizeSharedBuffersCodec>[]>;
  prewarmBufferCache(
    state: import("../../../core/extensions/codecs").CodecInput<typeof binaryCodec> | null,
  ): Promise<number | null>;
  prewarmLocalCache(
    state: import("../../../core/extensions/codecs").CodecInput<typeof binaryCodec> | null,
    n_workers?: number | null,
  ): Promise<undefined | null>;
  replaceHll(hll: import("../../../core/extensions/codecs").CodecInput<typeof binaryCodec> | null): Promise<undefined>;
  resetPerfCounter(name: string | null): Promise<boolean | null>;
}

export interface NeonEffect {
  readonly member: string;
  readonly state: "unknown" | "acknowledged";
  readonly rollback: "not-transactional";
}

export class NeonOperationError extends ExtensionOperationError {
  constructor(
    failure: ExtensionOperationError,
    readonly effects: readonly NeonEffect[],
  ) {
    super(failure.cause, failure.completion, failure.cleanupFailures);
    this.name = "NeonOperationError";
  }
}
