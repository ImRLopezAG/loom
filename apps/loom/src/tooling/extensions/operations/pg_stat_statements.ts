import * as v from "valibot";
import { createPgStatStatements_1_12 } from "../../../core/extensions/adapters/pg_stat_statements";
import {
  statementCodec,
  statementInfoCodec,
  type StatementStatistics,
  type StatementStatisticsInfo,
} from "../../../core/extensions/adapters/pg_stat_statements-codecs";
import { loOidValidator } from "../../../core/extensions/adapters/lo-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { timestamptzCodec, type Timestamptz } from "../../../core/extensions/native-timestamp-codecs";
import { acquireExtensionLock } from "../../migrations/connection";
import { ExtensionOperationError, withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/pg_stat_statements.json";

export const statementResetValidator = v.strictObject({
  userId: v.optional(loOidValidator),
  databaseId: v.optional(loOidValidator),
  queryId: v.optional(v.pipe(v.bigint(), v.minValue(-9223372036854775808n), v.maxValue(9223372036854775807n))),
  minmaxOnly: v.optional(v.boolean()),
});
export interface StatementResetRequest {
  readonly userId?: number | undefined;
  readonly databaseId?: number | undefined;
  readonly queryId?: bigint | undefined;
  readonly minmaxOnly?: boolean | undefined;
}
export interface StatementResetEffect {
  readonly request: StatementResetRequest;
  readonly state: "acknowledged" | "unknown";
  readonly rollback: "not-transactional";
  readonly resetAt?: Timestamptz;
}
export class StatementStatisticsOperationError extends ExtensionOperationError {
  constructor(
    failure: ExtensionOperationError,
    readonly resets: readonly StatementResetEffect[],
  ) {
    super(failure.cause, failure.completion, failure.cleanupFailures);
    this.name = "StatementStatisticsOperationError";
  }
}
export interface StatementStatisticsPrerequisites {
  readonly sharedPreloadLibraries: string;
  readonly computeQueryId: string;
  readonly track: string | null;
  readonly trackPlanning: string | null;
  readonly resetExecutable: boolean;
  /** Startup configuration is observed, not changed; the actual info/query call proves initialized shared state. */
  readonly activation: "requires-native-observation";
}
export interface StatementStatisticsSession {
  readonly prerequisites: () => Promise<StatementStatisticsPrerequisites>;
  readonly statistics: (showtext?: boolean) => Promise<readonly StatementStatistics[]>;
  readonly statementView: () => Promise<readonly StatementStatistics[]>;
  readonly info: () => Promise<StatementStatisticsInfo>;
  readonly infoView: () => Promise<StatementStatisticsInfo>;
  /** Omitted/zero selectors match all users/databases/query IDs; shared across the server, outside rollback. */
  readonly reset: (
    request?: StatementResetRequest,
  ) => Promise<{ readonly resetAt: Timestamptz; readonly rollback: "not-transactional" }>;
}

/** Privileges are enforced by PostgreSQL; reset is never exposed in ordinary application query bindings. */
export async function withPgStatStatements<Result>(
  directOperatorUrl: string,
  descriptor: ExtensionDescriptor<"pg_stat_statements", { version: "1.12"; schema: string }>,
  callback: (session: StatementStatisticsSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{
  readonly completion: "committed";
  readonly value: Result;
  readonly resets: readonly StatementResetEffect[];
}> {
  createPgStatStatements_1_12(descriptor);
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  if (!descriptor.schema || descriptor.schema.includes("\0")) throw new Error("Invalid statement statistics schema");
  const schema = `"${descriptor.schema.replaceAll('"', '""')}"`;
  const resets: StatementResetEffect[] = [];
  const snapshot = () => Object.freeze(resets.map((effect) => Object.freeze(effect)));
  try {
    const result = await withExtensionOperation(
      directOperatorUrl,
      async (context) => {
        await acquireExtensionLock(context.client, signal);
        await verifyExtensionApiContracts(context.client, [requirement]);
        await context.client.query("SET LOCAL DateStyle = 'ISO, YMD'");
        async function statistics(view: boolean, showtext = true) {
          const checked = v.parse(v.boolean(), showtext);
          const result = await context.client.query(
            `SELECT ROW(s.*)::pg_catalog.text AS value FROM ${schema}."pg_stat_statements"${view ? "" : "($1::pg_catalog.bool)"} AS s`,
            view ? [] : [checked],
          );
          return Object.freeze(
            v
              .parse(v.array(v.strictObject({ value: v.string() })), result.rows)
              .map((row) => statementCodec.decode(row.value)),
          );
        }
        async function info(view: boolean) {
          const result = await context.client.query(
            `SELECT ROW(s.*)::pg_catalog.text AS value FROM ${schema}."pg_stat_statements_info"${view ? "" : "()"} AS s`,
          );
          const [row] = v.parse(v.tuple([v.strictObject({ value: v.string() })]), result.rows);
          return statementInfoCodec.decode(row.value);
        }
        return Object.freeze({
          prerequisites: () =>
            context.run(async () => {
              const result = await context.client.query(
                `SELECT current_setting('shared_preload_libraries') AS preload, current_setting('compute_query_id') AS queryid, current_setting('pg_stat_statements.track',true) AS track, current_setting('pg_stat_statements.track_planning',true) AS planning, pg_catalog.has_function_privilege(current_user,pg_catalog.format('%I.%I(oid,oid,bigint,boolean)',$1::text,'pg_stat_statements_reset'),'EXECUTE') AS reset`,
                [descriptor.schema],
              );
              const [row] = v.parse(
                v.tuple([
                  v.strictObject({
                    preload: v.string(),
                    queryid: v.string(),
                    track: v.nullable(v.string()),
                    planning: v.nullable(v.string()),
                    reset: v.boolean(),
                  }),
                ]),
                result.rows,
              );
              return {
                sharedPreloadLibraries: row.preload,
                computeQueryId: row.queryid,
                track: row.track,
                trackPlanning: row.planning,
                resetExecutable: row.reset,
                activation: "requires-native-observation",
              } as const;
            }),
          statistics: (showtext = true) => context.run(() => statistics(false, showtext)),
          statementView: () => context.run(() => statistics(true)),
          info: () => context.run(() => info(false)),
          infoView: () => context.run(() => info(true)),
          reset: (request: StatementResetRequest = {}) =>
            context.run(async () => {
              const checked = Object.freeze(v.parse(statementResetValidator, request));
              const index = resets.push({ request: checked, state: "unknown", rollback: "not-transactional" }) - 1;
              const result = await context.client.query(
                `SELECT ${schema}."pg_stat_statements_reset"($1::pg_catalog.oid,$2::pg_catalog.oid,$3::pg_catalog.int8,$4::pg_catalog.bool)::pg_catalog.text AS reset`,
                [
                  checked.userId ?? 0,
                  checked.databaseId ?? 0,
                  (checked.queryId ?? 0n).toString(),
                  checked.minmaxOnly ?? false,
                ],
              );
              const [row] = v.parse(v.tuple([v.strictObject({ reset: v.string() })]), result.rows);
              const resetAt = timestamptzCodec.decode(row.reset);
              resets[index] = { request: checked, state: "acknowledged", rollback: "not-transactional", resetAt };
              return { resetAt, rollback: "not-transactional" } as const;
            }),
        });
      },
      callback,
      signal,
    );
    return { ...result, resets: snapshot() };
  } catch (cause) {
    if (cause instanceof ExtensionOperationError) throw new StatementStatisticsOperationError(cause, snapshot());
    throw cause;
  }
}
