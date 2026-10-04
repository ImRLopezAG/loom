import pg from "pg";
import * as v from "valibot";
import { sql, type SQL } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import { createHypopg_1_4_3 } from "../../../core/extensions/adapters/hypopg";
import {
  hypopgCreatedCodec,
  hypopgIndexCodec,
  hypopgIndexFields,
  hypopgListCodec,
  hypopgHiddenCodec,
  hypopgOidCodec,
  type HypopgCreatedIndex,
  type HypopgIndex,
  type HypopgListedIndex,
  type HypopgHiddenIndex,
} from "../../../core/extensions/adapters/hypopg-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { nullableCodec, integerCodec, textCodec, type ExtensionCodec } from "../../../core/extensions/codecs";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { jsonDocument, type JsonDocument } from "../../../core/extensions/native-json-codecs";
import { extensionSqlDialect } from "../../../core/extensions/sql";
import { acquireExtensionLock } from "../../migrations/connection";
import { ExtensionOperationError, withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/hypopg.json";

export interface HypopgSession {
  /** PostgreSQL parses the bound text; only CREATE INDEX statements are consumed. NULL produces no rows. */
  readonly createIndex: (sqlOrder: string | null) => Promise<readonly HypopgCreatedIndex[]>;
  readonly dropIndex: (oid: number | null) => Promise<boolean | null>;
  readonly hideIndex: (oid: number | null) => Promise<boolean | null>;
  readonly unhideIndex: (oid: number | null) => Promise<boolean | null>;
  readonly reset: () => Promise<void>;
  readonly resetIndex: () => Promise<void>;
  readonly unhideAllIndexes: () => Promise<void>;
  readonly indexes: () => Promise<readonly HypopgIndex[]>;
  readonly hiddenIndexes: () => Promise<readonly number[]>;
  readonly listView: () => Promise<readonly HypopgListedIndex[]>;
  readonly hiddenView: () => Promise<readonly HypopgHiddenIndex[]>;
  readonly getIndexdef: (oid: number | null) => Promise<string | null>;
  /** Missing non-null OIDs raise PostgreSQL ERROR; NULL propagates as SQL NULL. */
  readonly relationSize: (oid: number | null) => Promise<bigint | null>;
  /** Native EXPLAIN (FORMAT JSON), without ANALYZE, on this same dedicated backend. */
  readonly explain: (statement: SQL) => Promise<JsonDocument>;
}
export interface HypopgEffect {
  readonly operation:
    | "createIndex"
    | "dropIndex"
    | "hideIndex"
    | "unhideIndex"
    | "reset"
    | "resetIndex"
    | "unhideAllIndexes";
  readonly state: "acknowledged" | "unknown";
  readonly scope: "backend";
  readonly rollback: "not-transactional";
}
export class HypopgOperationError extends ExtensionOperationError {
  constructor(
    failure: ExtensionOperationError,
    readonly effects: readonly HypopgEffect[],
  ) {
    super(failure.cause, failure.completion, failure.cleanupFailures);
    this.name = "HypopgOperationError";
  }
}

/** No client escapes. Backend state is reset/unhidden after COMMIT or ROLLBACK and ends on close/termination. */
export async function withHypopg<Result>(
  directOperatorUrl: string,
  descriptor: ExtensionDescriptor<"hypopg", { version: "1.4.3"; schema: string }>,
  callback: (session: HypopgSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{ readonly completion: "committed"; readonly value: Result; readonly effects: readonly HypopgEffect[] }> {
  createHypopg_1_4_3(descriptor);
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  const schema = pg.escapeIdentifier(descriptor.schema);
  const effects: HypopgEffect[] = [];
  const snapshot = () => Object.freeze(effects.map((entry) => Object.freeze({ ...entry })));
  const oidCodec = nullableCodec(hypopgOidCodec);
  const dialect = extensionSqlDialect(nodePgCodecs);
  try {
    const result = await withExtensionOperation(
      directOperatorUrl,
      async (context) => {
        await acquireExtensionLock(context.client, signal);
        await verifyExtensionApiContracts(context.client, [requirement]);
        async function scalar<Input, Output>(
          name: string,
          value: Input,
          input: ExtensionCodec<Input, Input>,
          output: ExtensionCodec<never, Output>,
        ): Promise<Output> {
          const result = await context.client.query<{ value: string | null }>(
            `SELECT ${schema}.${pg.escapeIdentifier(name)}($1::pg_catalog.${input.sqlType!.name})::pg_catalog.text AS value`,
            [input.encode(value)],
          );
          return output.decode(result.rows[0]!.value);
        }
        async function records<Output>(
          relation: string,
          codec: ExtensionCodec<never, Output>,
        ): Promise<readonly Output[]> {
          // Only the three closed SQL literals below reach this internal helper.
          const result = await context.client.query<{ value: string }>(
            `SELECT ROW(h.*)::pg_catalog.text AS value FROM ${schema}.${relation} AS h`,
          );
          return result.rows.map((row) => codec.decode(row.value));
        }
        async function effect<Value>(operation: HypopgEffect["operation"], work: () => Promise<Value>): Promise<Value> {
          const index =
            effects.push({ operation, state: "unknown", scope: "backend", rollback: "not-transactional" }) - 1;
          const value = await work();
          effects[index] = { operation, state: "acknowledged", scope: "backend", rollback: "not-transactional" };
          return value;
        }
        async function empty(name: string): Promise<void> {
          await context.client.query(`SELECT ${schema}.${pg.escapeIdentifier(name)}()`);
        }
        return Object.freeze({
          createIndex: (sqlOrder: string | null) =>
            context.run(() =>
              effect("createIndex", async () => {
                const result = await context.client.query<{ value: string }>(
                  `SELECT ROW(h.*)::pg_catalog.text AS value FROM ${schema}."hypopg_create_index"($1::pg_catalog.text) AS h`,
                  [nullableCodec(textCodec).encode(sqlOrder)],
                );
                return result.rows.map((row) => hypopgCreatedCodec.decode(row.value));
              }),
            ),
          dropIndex: (oid: number | null) =>
            context.run(() =>
              effect("dropIndex", () =>
                scalar("hypopg_drop_index", oid, oidCodec, nullableCodec(hypopgIndexFields.indisunique)),
              ),
            ),
          hideIndex: (oid: number | null) =>
            context.run(() =>
              effect("hideIndex", () =>
                scalar("hypopg_hide_index", oid, oidCodec, nullableCodec(hypopgIndexFields.indisunique)),
              ),
            ),
          unhideIndex: (oid: number | null) =>
            context.run(() =>
              effect("unhideIndex", () =>
                scalar("hypopg_unhide_index", oid, oidCodec, nullableCodec(hypopgIndexFields.indisunique)),
              ),
            ),
          reset: () => context.run(() => effect("reset", () => empty("hypopg_reset"))),
          resetIndex: () => context.run(() => effect("resetIndex", () => empty("hypopg_reset_index"))),
          unhideAllIndexes: () =>
            context.run(() => effect("unhideAllIndexes", () => empty("hypopg_unhide_all_indexes"))),
          indexes: () => context.run(() => records('"hypopg"()', hypopgIndexCodec)),
          hiddenIndexes: () =>
            context.run(async () => {
              const result = await context.client.query<{ value: string }>(
                `SELECT indexid::pg_catalog.text AS value FROM ${schema}."hypopg_hidden_indexes"()`,
              );
              return result.rows.map((row) => hypopgOidCodec.decode(row.value));
            }),
          listView: () => context.run(() => records('"hypopg_list_indexes"', hypopgListCodec)),
          hiddenView: () => context.run(() => records('"hypopg_hidden_indexes"', hypopgHiddenCodec)),
          getIndexdef: (oid: number | null) =>
            context.run(() => scalar("hypopg_get_indexdef", oid, oidCodec, nullableCodec(textCodec))),
          relationSize: (oid: number | null) =>
            context.run(() => scalar("hypopg_relation_size", oid, oidCodec, nullableCodec(integerCodec))),
          explain: (statement: SQL) =>
            context.run(async () => {
              const compiled = dialect.sqlToQuery(sql`EXPLAIN (FORMAT JSON) ${statement}`);
              const result = await context.client.query<{ "QUERY PLAN": string }>({
                text: compiled.sql,
                values: compiled.params,
                types: {
                  getTypeParser: (oid: number, format?: "text" | "binary") =>
                    oid === 114 ? (value: string) => value : pg.types.getTypeParser(oid, format),
                },
              });
              return jsonDocument(v.parse(v.string(), result.rows[0]!["QUERY PLAN"]));
            }),
        } satisfies HypopgSession);
      },
      callback,
      signal,
      async (context) => {
        // Reset does not unhide real indexes. Both native operations are necessary after either terminal reply.
        await context.client.query(`SELECT ${schema}."hypopg_reset"()`);
        await context.client.query(`SELECT ${schema}."hypopg_unhide_all_indexes"()`);
        const remaining = await context.client.query<{ indexes: number; hidden: number }>(
          `SELECT (SELECT count(*) FROM ${schema}."hypopg"())::int AS indexes, (SELECT count(*) FROM ${schema}."hypopg_hidden_indexes"())::int AS hidden`,
        );
        v.parse(v.strictObject({ indexes: v.literal(0), hidden: v.literal(0) }), remaining.rows[0]);
      },
    );
    return { ...result, effects: snapshot() };
  } catch (cause) {
    if (cause instanceof ExtensionOperationError) throw new HypopgOperationError(cause, snapshot());
    throw cause;
  }
}
