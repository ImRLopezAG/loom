import pg from "pg";
import * as v from "valibot";
import { sql, type SQL } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createPgHintPlan_1_8_0 } from "../../../core/extensions/adapters/pg_hint_plan";
import { pgHintPlanHintCodec, type PgHintPlanHint } from "../../../core/extensions/adapters/pg_hint_plan-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { jsonDocument, type JsonDocument } from "../../../core/extensions/native-json-codecs";
import { extensionSqlDialect } from "../../../core/extensions/sql";
import { acquireExtensionLock } from "../../migrations/connection";
import { withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/pg_hint_plan.json";

// Enum values are the native pg_settings.enumvals captured from pg_hint_plan 1.8.0 on PostgreSQL 18.
const levels = ["debug5", "debug4", "debug3", "debug2", "debug1", "log", "info", "notice", "warning", "error"] as const;
export const pgHintPlanSettingsValidator = v.strictObject({
  enableHint: v.optional(v.boolean()),
  enableHintTable: v.optional(v.boolean()),
  parseMessages: v.optional(v.picklist(levels)),
  messageLevel: v.optional(v.picklist(levels)),
  debugPrint: v.optional(v.picklist(["off", "on", "detailed", "verbose"])),
});
const queryId = v.pipe(v.bigint(), v.minValue(-9223372036854775808n), v.maxValue(9223372036854775807n));
export const pgHintPlanHintKeyValidator = v.strictObject({ queryId, applicationName: v.string() });
export const pgHintPlanHintValidator = v.strictObject({ queryId, applicationName: v.string(), hints: v.string() });
export type PgHintPlanSettings = v.InferInput<typeof pgHintPlanSettingsValidator>;
export interface PgHintPlanHintKey {
  readonly queryId: bigint;
  /** '' matches every application; an exact application_name row takes precedence. */
  readonly applicationName: string;
}
export interface PgHintPlanHintRequest extends PgHintPlanHintKey {
  /** pg_hint_plan parses this text at planning time; unparseable hints are reported at parse_messages level and ignored. */
  readonly hints: string;
}
export interface PgHintPlanPrerequisites {
  readonly sharedPreloadLibraries: string;
  readonly sessionPreloadLibraries: string;
  readonly computeQueryId: string;
  /** True only when the loaded module registered its typed settings; a custom placeholder does not count. */
  readonly loaded: boolean;
  readonly enableHint: string | null;
  readonly enableHintTable: string | null;
  readonly hintTableWritable: boolean;
}
export interface PgHintPlanSession {
  readonly prerequisites: () => Promise<PgHintPlanPrerequisites>;
  /** Transaction-local set_config; values end with the operation's COMMIT or ROLLBACK. */
  readonly configure: (settings: PgHintPlanSettings) => Promise<void>;
  readonly hints: () => Promise<readonly PgHintPlanHint[]>;
  /** Native query identifier of the statement exactly as compiled, read from EXPLAIN VERBOSE by PostgreSQL as int8. */
  readonly queryId: (statement: SQL) => Promise<bigint>;
  /** Native EXPLAIN (VERBOSE, FORMAT JSON) without ANALYZE, observed on this backend with its current settings. */
  readonly explain: (statement: SQL) => Promise<JsonDocument>;
  readonly upsertHint: (request: PgHintPlanHintRequest) => Promise<PgHintPlanHint>;
  readonly deleteHint: (key: PgHintPlanHintKey) => Promise<PgHintPlanHint | null>;
}

/**
 * Hint rows are ordinary transactional table writes: they commit with the operation or roll back on failure. The
 * identity sequence is not rolled back. Privileges are PostgreSQL's (PUBLIC SELECT; writes need table privileges).
 */
export async function withPgHintPlan<Result>(
  directOperatorUrl: string,
  descriptor: ExtensionDescriptor<"pg_hint_plan", { version: "1.8.0"; schema: string }>,
  callback: (session: PgHintPlanSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result }> {
  createPgHintPlan_1_8_0(descriptor);
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  const table = `${pg.escapeIdentifier(descriptor.schema)}."hints"`;
  const dialect = extensionSqlDialect(nodePgCodecs);
  const rows = v.array(v.strictObject({ value: v.string() }));
  return withExtensionOperation(
    directOperatorUrl,
    async (context) => {
      await acquireExtensionLock(context.client, signal);
      await verifyExtensionApiContracts(context.client, [requirement]);
      async function explain(statement: SQL): Promise<string> {
        const compiled = dialect.sqlToQuery(sql`EXPLAIN (VERBOSE, FORMAT JSON) ${statement}`);
        const result = await context.client.query({
          text: compiled.sql,
          values: compiled.params,
          // JSON stays exact text: the driver's JSON.parse would round int64 query identifiers.
          types: {
            getTypeParser: (oid: number, format?: "text" | "binary") =>
              oid === 114 ? (value: string) => value : pg.types.getTypeParser(oid, format),
          },
        });
        const [row] = v.parse(v.tuple([v.object({ "QUERY PLAN": v.string() })]), result.rows);
        return row["QUERY PLAN"];
      }
      return Object.freeze({
        prerequisites: () =>
          context.run(async () => {
            const result = await context.client.query(
              `SELECT current_setting('shared_preload_libraries') AS shared, current_setting('session_preload_libraries') AS session, current_setting('compute_query_id') AS queryid, EXISTS (SELECT FROM pg_catalog.pg_settings WHERE name = 'pg_hint_plan.enable_hint_table' AND vartype = 'bool') AS loaded, current_setting('pg_hint_plan.enable_hint', true) AS hint, current_setting('pg_hint_plan.enable_hint_table', true) AS hint_table, pg_catalog.has_table_privilege($1::pg_catalog.text, 'INSERT, UPDATE, DELETE') AS writable`,
              [table],
            );
            const [row] = v.parse(
              v.tuple([
                v.strictObject({
                  shared: v.string(),
                  session: v.string(),
                  queryid: v.string(),
                  loaded: v.boolean(),
                  hint: v.nullable(v.string()),
                  hint_table: v.nullable(v.string()),
                  writable: v.boolean(),
                }),
              ]),
              result.rows,
            );
            return Object.freeze({
              sharedPreloadLibraries: row.shared,
              sessionPreloadLibraries: row.session,
              computeQueryId: row.queryid,
              loaded: row.loaded,
              enableHint: row.hint,
              enableHintTable: row.hint_table,
              hintTableWritable: row.writable,
            });
          }),
        configure: (settings: PgHintPlanSettings) =>
          context.run(async () => {
            const checked = v.parse(pgHintPlanSettingsValidator, settings);
            const flag = (value: boolean | undefined) => (value === undefined ? undefined : value ? "on" : "off");
            const values = [
              ["pg_hint_plan.enable_hint", flag(checked.enableHint)],
              ["pg_hint_plan.enable_hint_table", flag(checked.enableHintTable)],
              ["pg_hint_plan.parse_messages", checked.parseMessages],
              ["pg_hint_plan.message_level", checked.messageLevel],
              ["pg_hint_plan.debug_print", checked.debugPrint],
            ] as const;
            for (const [name, value] of values)
              if (value !== undefined)
                await context.client.query(
                  "SELECT pg_catalog.set_config($1::pg_catalog.text, $2::pg_catalog.text, true)",
                  [name, value],
                );
          }),
        hints: () =>
          context.run(async () => {
            const result = await context.client.query(
              `SELECT ROW(h.*)::pg_catalog.text AS value FROM ${table} AS h ORDER BY h.id`,
            );
            return Object.freeze(v.parse(rows, result.rows).map((row) => pgHintPlanHintCodec.decode(row.value)));
          }),
        queryId: (statement: SQL) =>
          context.run(async () => {
            const document = await explain(statement);
            const result = await context.client.query(
              "SELECT ($1::pg_catalog.jsonb #>> '{0,Query Identifier}')::pg_catalog.int8::pg_catalog.text AS value",
              [document],
            );
            const [row] = v.parse(v.tuple([v.strictObject({ value: v.nullable(v.string()) })]), result.rows);
            if (row.value === null)
              throw new Error("PostgreSQL computed no query identifier; compute_query_id is not active");
            return BigInt(row.value);
          }),
        explain: (statement: SQL) => context.run(async () => jsonDocument(await explain(statement))),
        upsertHint: (request: PgHintPlanHintRequest) =>
          context.run(async () => {
            const checked = v.parse(pgHintPlanHintValidator, request);
            const result = await context.client.query(
              `INSERT INTO ${table} AS h (query_id, application_name, hints) VALUES ($1::pg_catalog.int8, $2::pg_catalog.text, $3::pg_catalog.text) ON CONFLICT (query_id, application_name) DO UPDATE SET hints = EXCLUDED.hints RETURNING ROW(h.*)::pg_catalog.text AS value`,
              [checked.queryId.toString(), checked.applicationName, checked.hints],
            );
            const [row] = v.parse(v.tuple([v.strictObject({ value: v.string() })]), result.rows);
            return pgHintPlanHintCodec.decode(row.value);
          }),
        deleteHint: (key: PgHintPlanHintKey) =>
          context.run(async () => {
            const checked = v.parse(pgHintPlanHintKeyValidator, key);
            const result = await context.client.query(
              `DELETE FROM ${table} AS h WHERE h.query_id = $1::pg_catalog.int8 AND h.application_name = $2::pg_catalog.text RETURNING ROW(h.*)::pg_catalog.text AS value`,
              [checked.queryId.toString(), checked.applicationName],
            );
            const [row] = v.parse(rows, result.rows);
            return row ? pgHintPlanHintCodec.decode(row.value) : null;
          }),
      } satisfies PgHintPlanSession);
    },
    callback,
    signal,
  );
}
