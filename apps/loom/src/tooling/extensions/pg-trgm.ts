import type pg from "pg";
import * as v from "valibot";
import type { ExtensionDescriptor } from "../../core/extensions/bindings";
import { float4Codec } from "../../core/extensions/primitive-number-codecs";
import { assertMigrationConnection, withMigrationConnection } from "../migrations/connection";
import { quoteExtensionSchema } from "../config/extensions";

const threshold = v.pipe(v.number(), v.finite(), v.minValue(0), v.maxValue(1));
const thresholdsValidator = v.strictObject({
  similarity: v.optional(threshold),
  wordSimilarity: v.optional(threshold),
  strictWordSimilarity: v.optional(threshold),
});
export type PgTrgmThresholds = v.InferInput<typeof thresholdsValidator>;
type Descriptor = ExtensionDescriptor<"pg_trgm", { readonly version: "1.6"; readonly schema: string }>;
export interface PgTrgmSession {
  readonly client: pg.Client;
  readonly showLimit: () => Promise<number>;
  readonly setLimit: (value: number | null) => Promise<number | null>;
}
const settings = {
  similarity: "pg_trgm.similarity_threshold",
  wordSimilarity: "pg_trgm.word_similarity_threshold",
  strictWordSimilarity: "pg_trgm.strict_word_similarity_threshold",
} as const;

/** Own one operator backend and transaction. Thresholds never enter an application invocation or pooled session. */
export async function withPgTrgmThresholds<Result>(
  connectionString: string,
  descriptor: Descriptor,
  thresholds: PgTrgmThresholds,
  operation: (session: PgTrgmSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<Result> {
  const selected = v.parse(thresholdsValidator, thresholds);
  if (
    descriptor.name !== "pg_trgm" ||
    descriptor.version !== "1.6" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== "88e35b55b09e58d6a59847390006ca73483bdb4444346474beb644c63adcbe66"
  )
    throw new Error("pg_trgm operator tooling requires its exact verified 1.6 contract");
  const namespace = quoteExtensionSchema(descriptor.schema);
  signal?.throwIfAborted();
  return withMigrationConnection(connectionString, async (client) => {
    let active = true;
    function assertActive() {
      if (!active) throw new Error("pg_trgm operator session has ended");
      signal?.throwIfAborted();
      assertMigrationConnection(client);
    }
    const backend = await client.query<{ pid: number; started: string }>(
      "select pid, backend_start::text as started from pg_catalog.pg_stat_activity where pid=pg_catalog.pg_backend_pid()",
    );
    const pid = backend.rows[0]!.pid;
    let abortCompletion: Promise<void> | undefined;
    const abort = () => {
      abortCompletion = withMigrationConnection(connectionString, async (cancel) => {
        const stopped = await cancel.query<{ terminated: boolean }>(
          "select pg_catalog.pg_terminate_backend(pid,5000) as terminated from pg_catalog.pg_stat_activity where pid=$1 and backend_start=$2::timestamptz and application_name='loom-migrations' and usename=current_user",
          [pid, backend.rows[0]!.started],
        );
        if (stopped.rows[0] && !stopped.rows[0].terminated)
          throw new Error("pg_trgm aborted operator backend was not terminated");
      });
      // The operation below awaits the termination result; registering this handler prevents a transient unhandled rejection.
      void abortCompletion.catch(() => undefined);
    };
    signal?.addEventListener("abort", abort, { once: true });
    try {
      assertActive();
      const installed = await client.query<{ version: string; schema: string }>(
        "select e.extversion as version, n.nspname as schema from pg_catalog.pg_extension e join pg_catalog.pg_namespace n on n.oid=e.extnamespace where e.extname='pg_trgm'",
      );
      if (installed.rows[0]?.version !== "1.6" || installed.rows[0]?.schema !== descriptor.schema)
        throw new Error("pg_trgm operator session disagrees with its selected installation");
      // Load pg_trgm before reading its custom GUCs on this backend.
      await client.query(`select ${namespace}.show_limit()`);
      const original = await client.query<{ similarity: string; word: string; strict: string }>(
        "select current_setting('pg_trgm.similarity_threshold') as similarity, current_setting('pg_trgm.word_similarity_threshold') as word, current_setting('pg_trgm.strict_word_similarity_threshold') as strict",
      );
      await client.query("BEGIN");
      // SAFETY: settings is the closed literal map above, so its own enumerable keys are exactly its three threshold names.
      for (const key of Object.keys(settings) as (keyof typeof settings)[]) {
        const value = selected[key];
        if (value !== undefined)
          await client.query("select pg_catalog.set_config($1,$2,true)", [settings[key], String(value)]);
      }
      const session: PgTrgmSession = Object.freeze({
        client,
        async showLimit() {
          assertActive();
          const result = await client.query<{ value: number }>(`select ${namespace}.show_limit() as value`);
          return v.parse(threshold, float4Codec.decode(result.rows[0]?.value));
        },
        async setLimit(value: number | null) {
          assertActive();
          const parameter = value === null ? null : float4Codec.encode(v.parse(threshold, value));
          const result = await client.query<{ value: number | null }>(
            `select ${namespace}.set_limit($1::pg_catalog.float4) as value`,
            [parameter],
          );
          return result.rows[0]?.value === null ? null : v.parse(threshold, float4Codec.decode(result.rows[0]?.value));
        },
      });
      const result = await operation(session);
      assertActive();
      // Legacy set_limit changes session state; restore it before committing the owned transaction.
      for (const [name, value] of [
        [settings.similarity, original.rows[0]!.similarity],
        [settings.wordSimilarity, original.rows[0]!.word],
        [settings.strictWordSimilarity, original.rows[0]!.strict],
      ] as const)
        await client.query("select pg_catalog.set_config($1,$2,false)", [name, value]);
      await client.query("COMMIT");
      assertActive();
      return result;
    } catch (error) {
      if (!signal?.aborted) await client.query("ROLLBACK");
      if (signal?.aborted) signal.throwIfAborted();
      throw error;
    } finally {
      active = false;
      signal?.removeEventListener("abort", abort);
      if (abortCompletion) await abortCompletion;
    }
  });
}
