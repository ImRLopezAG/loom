import * as v from "valibot";
import { createDblink_1_2 } from "../../../core/extensions/adapters/dblink";
import {
  dblinkInt2vectorCodec,
  dblinkNotifyCodec,
  dblinkPkeyCodec,
  dblinkTextArrayCodec,
  qualifiedRelationName,
  resolveRelationName,
  type DblinkNotify,
  type DblinkPkeyResult,
  type RelationInput,
} from "../../../core/extensions/adapters/dblink-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { compositeCodec, type ExtensionCodec } from "../../../core/extensions/codecs";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { acquireExtensionLock } from "../../migrations/connection";
import { ExtensionOperationError, withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/dblink.json";

const identifier = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0")),
);
const sqlText = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0")),
);
const connstr = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0")),
);
export const dblinkConnectValidator = v.strictObject({
  connection: v.optional(identifier),
  connstr,
});
export const dblinkDisconnectValidator = v.strictObject({
  connection: v.optional(identifier),
});
export const dblinkSqlValidator = v.strictObject({
  connection: v.optional(identifier),
  sql: sqlText,
  failOnError: v.optional(v.boolean()),
});
export const dblinkCursorValidator = v.strictObject({
  connection: v.optional(identifier),
  cursor: identifier,
  sql: sqlText,
  failOnError: v.optional(v.boolean()),
});
export const dblinkFetchValidator = v.strictObject({
  connection: v.optional(identifier),
  cursor: identifier,
  count: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(2147483647)),
  failOnError: v.optional(v.boolean()),
});
export const dblinkCloseValidator = v.strictObject({
  connection: v.optional(identifier),
  cursor: identifier,
  failOnError: v.optional(v.boolean()),
});
export interface DblinkConnectRequest {
  readonly connection?: string;
  readonly connstr: string;
}
export interface DblinkSqlRequest {
  readonly connection?: string;
  readonly sql: string;
  readonly failOnError?: boolean;
}
export interface DblinkCursorRequest {
  readonly connection?: string;
  readonly cursor: string;
  readonly sql: string;
  readonly failOnError?: boolean;
}
export interface DblinkFetchRequest {
  readonly connection?: string;
  readonly cursor: string;
  readonly count: number;
  readonly failOnError?: boolean;
}
export interface DblinkCloseRequest {
  readonly connection?: string;
  readonly cursor: string;
  readonly failOnError?: boolean;
}
export type DblinkEffectOperation =
  | "connect"
  | "connect-u"
  | "disconnect"
  | "read"
  | "write"
  | "open"
  | "fetch"
  | "close"
  | "send-query"
  | "get-result"
  | "cancel"
  | "notify"
  | "cleanup";
export interface DblinkConnectionEffect {
  readonly operation: DblinkEffectOperation;
  readonly connection?: string;
  readonly cursor?: string;
  readonly state: "acknowledged" | "unknown";
  readonly rollback: "not-transactional";
  readonly status?: string;
}
export class DblinkOperationError extends ExtensionOperationError {
  constructor(
    failure: ExtensionOperationError,
    readonly effects: readonly DblinkConnectionEffect[],
  ) {
    super(failure.cause, failure.completion, failure.cleanupFailures);
    this.name = "DblinkOperationError";
  }
}

type AnyCodec = ExtensionCodec<never, unknown>;
type Fields = Readonly<Record<string, AnyCodec>>;
type MappedRow<Row extends Fields> = { readonly [Key in keyof Row]: unknown };
type EffectExtras = { readonly connection?: string; readonly cursor?: string };
function effectExtras(connection?: string, cursor?: string): EffectExtras {
  return {
    ...(connection !== undefined ? { connection } : {}),
    ...(cursor !== undefined ? { cursor } : {}),
  };
}
function decodeRecords<Row extends Fields>(
  rows: unknown,
  codec: ExtensionCodec<never, unknown>,
): readonly MappedRow<Row>[] {
  return Object.freeze(
    v
      .parse(v.array(v.strictObject({ value: v.string() })), rows)
      .map((row) => codec.decode(row.value) as MappedRow<Row>),
  );
}
export interface DblinkSession {
  readonly connections: () => Promise<readonly string[] | null>;
  readonly currentQuery: () => Promise<string | null>;
  readonly getPkey: (relation: RelationInput | string) => Promise<readonly DblinkPkeyResult[]>;
  readonly buildSqlInsert: (
    relation: RelationInput | string,
    pkAttnums: string,
    pkCount: number,
    srcPk: readonly string[],
    tgtPk: readonly string[],
  ) => Promise<string>;
  readonly buildSqlUpdate: (
    relation: RelationInput | string,
    pkAttnums: string,
    pkCount: number,
    srcPk: readonly string[],
    tgtPk: readonly string[],
  ) => Promise<string>;
  readonly buildSqlDelete: (
    relation: RelationInput | string,
    pkAttnums: string,
    pkCount: number,
    tgtPk: readonly string[],
  ) => Promise<string>;
  readonly connect: (
    request: DblinkConnectRequest,
  ) => Promise<{ readonly status: string; readonly rollback: "not-transactional" }>;
  readonly connectU: (
    request: DblinkConnectRequest,
  ) => Promise<{ readonly status: string; readonly rollback: "not-transactional" }>;
  readonly disconnect: (
    request?: { readonly connection?: string },
  ) => Promise<{ readonly status: string; readonly rollback: "not-transactional" }>;
  readonly query: <const Row extends Fields>(
    request: DblinkSqlRequest & { readonly fields: Row },
  ) => Promise<readonly { readonly [Key in keyof Row]: unknown }[]>;
  readonly exec: (
    request: DblinkSqlRequest,
  ) => Promise<{ readonly status: string; readonly rollback: "not-transactional" }>;
  readonly open: (
    request: DblinkCursorRequest,
  ) => Promise<{ readonly status: string; readonly rollback: "not-transactional" }>;
  readonly fetch: <const Row extends Fields>(
    request: DblinkFetchRequest & { readonly fields: Row },
  ) => Promise<readonly { readonly [Key in keyof Row]: unknown }[]>;
  readonly close: (
    request: DblinkCloseRequest,
  ) => Promise<{ readonly status: string; readonly rollback: "not-transactional" }>;
  readonly sendQuery: (
    request: { readonly connection: string; readonly sql: string },
  ) => Promise<{ readonly sent: number; readonly rollback: "not-transactional" }>;
  readonly getResult: <const Row extends Fields>(
    request: { readonly connection: string; readonly failOnError?: boolean; readonly fields: Row },
  ) => Promise<readonly { readonly [Key in keyof Row]: unknown }[]>;
  readonly isBusy: (connection: string) => Promise<number>;
  readonly cancelQuery: (
    connection: string,
  ) => Promise<{ readonly status: string; readonly rollback: "not-transactional" }>;
  readonly errorMessage: (connection: string) => Promise<string>;
  readonly getNotify: (connection?: string) => Promise<readonly DblinkNotify[]>;
}

function quoteIdent(value: string): string {
  return `"${v.parse(identifier, value).replaceAll('"', '""')}"`;
}
function relationName(relation: RelationInput | string): string {
  if (v.is(v.string(), relation)) return v.parse(identifier, relation);
  return qualifiedRelationName(resolveRelationName(relation));
}
function textArray(values: readonly string[]) {
  return {
    dimensions: values.length ? [{ lowerBound: 1, length: values.length }] : [],
    values: [...values],
  } as const;
}
function recordColumns(fields: Fields): string {
  return Object.entries(fields)
    .map(([name, codec]) => {
      if (!codec.sqlType) throw new Error("Anonymous record column requires its captured SQL type");
      return `${quoteIdent(name)} ${quoteIdent(codec.sqlType.schema)}.${quoteIdent(codec.sqlType.name)}${
        codec.sqlType.array ? "[]" : ""
      }`;
    })
    .join(", ");
}

/** Dedicated-session dblink: connect/read/write/cancel/disconnect stay on one backend; cleanup drops leftovers. */
export async function withDblink<Result>(
  directOperatorUrl: string,
  descriptor: ExtensionDescriptor<"dblink", { version: "1.2"; schema: string }>,
  callback: (session: DblinkSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{
  readonly completion: "committed";
  readonly value: Result;
  readonly effects: readonly DblinkConnectionEffect[];
}> {
  createDblink_1_2(descriptor);
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  const effects: DblinkConnectionEffect[] = [];
  const schema = quoteIdent(descriptor.schema);
  const snapshot = () => Object.freeze(effects.map((effect) => Object.freeze(effect)));
  try {
    const result = await withExtensionOperation(
      directOperatorUrl,
      async (context) => {
        await acquireExtensionLock(context.client, signal);
        await verifyExtensionApiContracts(context.client, [requirement]);
        const effect = async (
          operation: DblinkConnectionEffect["operation"],
          extras: EffectExtras,
          work: () => Promise<string | undefined>,
        ) => {
          const index =
            effects.push({
              operation,
              ...extras,
              state: "unknown",
              rollback: "not-transactional",
            }) - 1;
          const status = await work();
          effects[index] = {
            operation,
            ...extras,
            state: "acknowledged",
            rollback: "not-transactional",
            ...(status !== undefined ? { status } : {}),
          };
          return status;
        };
        const connections = () =>
          context.run(async () => {
            const result = await context.client.query(
              `SELECT ${schema}."dblink_get_connections"()::pg_catalog.text AS value`,
            );
            const [row] = v.parse(v.tuple([v.strictObject({ value: v.nullable(v.string()) })]), result.rows);
            return row.value === null ? null : Object.freeze(dblinkTextArrayCodec.decode(row.value).values as string[]);
          });
        const session: DblinkSession = {
          connections,
          currentQuery: () =>
            context.run(async () => {
              const result = await context.client.query(
                `SELECT ${schema}."dblink_current_query"() AS value`,
              );
              const [row] = v.parse(v.tuple([v.strictObject({ value: v.nullable(v.string()) })]), result.rows);
              return row.value;
            }),
          getPkey: (relation: RelationInput | string) =>
            context.run(async () => {
              const result = await context.client.query(
                `SELECT ROW(s.*)::pg_catalog.text AS value FROM ${schema}."dblink_get_pkey"($1::pg_catalog.text) AS s`,
                [relationName(relation)],
              );
              return Object.freeze(
                v
                  .parse(v.array(v.strictObject({ value: v.string() })), result.rows)
                  .map((row) => dblinkPkeyCodec.decode(row.value)),
              );
            }),
          buildSqlInsert: (
            relation: RelationInput | string,
            pkAttnums: string,
            pkCount: number,
            srcPk: readonly string[],
            tgtPk: readonly string[],
          ) =>
            context.run(async () => {
              const result = await context.client.query(
                `SELECT ${schema}."dblink_build_sql_insert"($1::pg_catalog.text,$2::pg_catalog.int2vector,$3::pg_catalog.int4,$4::pg_catalog.text[],$5::pg_catalog.text[]) AS sql`,
                [
                  relationName(relation),
                  dblinkInt2vectorCodec.encode(pkAttnums),
                  pkCount,
                  dblinkTextArrayCodec.encode(textArray(srcPk)),
                  dblinkTextArrayCodec.encode(textArray(tgtPk)),
                ],
              );
              const [row] = v.parse(v.tuple([v.strictObject({ sql: v.string() })]), result.rows);
              return row.sql;
            }),
          buildSqlUpdate: (
            relation: RelationInput | string,
            pkAttnums: string,
            pkCount: number,
            srcPk: readonly string[],
            tgtPk: readonly string[],
          ) =>
            context.run(async () => {
              const result = await context.client.query(
                `SELECT ${schema}."dblink_build_sql_update"($1::pg_catalog.text,$2::pg_catalog.int2vector,$3::pg_catalog.int4,$4::pg_catalog.text[],$5::pg_catalog.text[]) AS sql`,
                [
                  relationName(relation),
                  dblinkInt2vectorCodec.encode(pkAttnums),
                  pkCount,
                  dblinkTextArrayCodec.encode(textArray(srcPk)),
                  dblinkTextArrayCodec.encode(textArray(tgtPk)),
                ],
              );
              const [row] = v.parse(v.tuple([v.strictObject({ sql: v.string() })]), result.rows);
              return row.sql;
            }),
          buildSqlDelete: (
            relation: RelationInput | string,
            pkAttnums: string,
            pkCount: number,
            tgtPk: readonly string[],
          ) =>
            context.run(async () => {
              const result = await context.client.query(
                `SELECT ${schema}."dblink_build_sql_delete"($1::pg_catalog.text,$2::pg_catalog.int2vector,$3::pg_catalog.int4,$4::pg_catalog.text[]) AS sql`,
                [
                  relationName(relation),
                  dblinkInt2vectorCodec.encode(pkAttnums),
                  pkCount,
                  dblinkTextArrayCodec.encode(textArray(tgtPk)),
                ],
              );
              const [row] = v.parse(v.tuple([v.strictObject({ sql: v.string() })]), result.rows);
              return row.sql;
            }),
          connect: (request: DblinkConnectRequest) =>
            context.run(async () => {
              const checked = v.parse(dblinkConnectValidator, request);
              const status = await effect("connect", effectExtras(checked.connection), async () => {
                const result = checked.connection
                  ? await context.client.query(
                      `SELECT ${schema}."dblink_connect"($1::pg_catalog.text,$2::pg_catalog.text) AS status`,
                      [checked.connection, checked.connstr],
                    )
                  : await context.client.query(`SELECT ${schema}."dblink_connect"($1::pg_catalog.text) AS status`, [
                      checked.connstr,
                    ]);
                const [row] = v.parse(v.tuple([v.strictObject({ status: v.string() })]), result.rows);
                return row.status;
              });
              return { status: status!, rollback: "not-transactional" } as const;
            }),
          connectU: (request: DblinkConnectRequest) =>
            context.run(async () => {
              const checked = v.parse(dblinkConnectValidator, request);
              const status = await effect("connect-u", effectExtras(checked.connection), async () => {
                const result = checked.connection
                  ? await context.client.query(
                      `SELECT ${schema}."dblink_connect_u"($1::pg_catalog.text,$2::pg_catalog.text) AS status`,
                      [checked.connection, checked.connstr],
                    )
                  : await context.client.query(`SELECT ${schema}."dblink_connect_u"($1::pg_catalog.text) AS status`, [
                      checked.connstr,
                    ]);
                const [row] = v.parse(v.tuple([v.strictObject({ status: v.string() })]), result.rows);
                return row.status;
              });
              return { status: status!, rollback: "not-transactional" } as const;
            }),
          disconnect: (request = {}) =>
            context.run(async () => {
              const checked = v.parse(dblinkDisconnectValidator, request);
              const status = await effect("disconnect", effectExtras(checked.connection), async () => {
                const result = checked.connection
                  ? await context.client.query(
                      `SELECT ${schema}."dblink_disconnect"($1::pg_catalog.text) AS status`,
                      [checked.connection],
                    )
                  : await context.client.query(`SELECT ${schema}."dblink_disconnect"() AS status`);
                const [row] = v.parse(v.tuple([v.strictObject({ status: v.string() })]), result.rows);
                return row.status;
              });
              return { status: status!, rollback: "not-transactional" } as const;
            }),
          query: <const Row extends Fields>(request: DblinkSqlRequest & { readonly fields: Row }) =>
            context.run(async () => {
              const checked = v.parse(dblinkSqlValidator, {
                connection: request.connection,
                sql: request.sql,
                failOnError: request.failOnError,
              });
              const columns = recordColumns(request.fields);
              const codec = compositeCodec("record", request.fields);
              let decoded: readonly MappedRow<Row>[] = [];
              await effect("read", effectExtras(checked.connection), async () => {
                const result =
                  checked.connection === undefined
                    ? checked.failOnError === undefined
                      ? await context.client.query(
                          `SELECT ROW(s.*)::pg_catalog.text AS value FROM ${schema}."dblink"($1::pg_catalog.text) AS s(${columns})`,
                          [checked.sql],
                        )
                      : await context.client.query(
                          `SELECT ROW(s.*)::pg_catalog.text AS value FROM ${schema}."dblink"($1::pg_catalog.text,$2::pg_catalog.bool) AS s(${columns})`,
                          [checked.sql, checked.failOnError],
                        )
                    : checked.failOnError === undefined
                      ? await context.client.query(
                          `SELECT ROW(s.*)::pg_catalog.text AS value FROM ${schema}."dblink"($1::pg_catalog.text,$2::pg_catalog.text) AS s(${columns})`,
                          [checked.connection, checked.sql],
                        )
                      : await context.client.query(
                          `SELECT ROW(s.*)::pg_catalog.text AS value FROM ${schema}."dblink"($1::pg_catalog.text,$2::pg_catalog.text,$3::pg_catalog.bool) AS s(${columns})`,
                          [checked.connection, checked.sql, checked.failOnError],
                        );
                decoded = decodeRecords<Row>(result.rows, codec);
                return "OK";
              });
              return decoded;
            }),
          exec: (request: DblinkSqlRequest) =>
            context.run(async () => {
              const checked = v.parse(dblinkSqlValidator, request);
              const status = await effect("write", effectExtras(checked.connection), async () => {
                const result =
                  checked.connection === undefined
                    ? checked.failOnError === undefined
                      ? await context.client.query(`SELECT ${schema}."dblink_exec"($1::pg_catalog.text) AS status`, [
                          checked.sql,
                        ])
                      : await context.client.query(
                          `SELECT ${schema}."dblink_exec"($1::pg_catalog.text,$2::pg_catalog.bool) AS status`,
                          [checked.sql, checked.failOnError],
                        )
                    : checked.failOnError === undefined
                      ? await context.client.query(
                          `SELECT ${schema}."dblink_exec"($1::pg_catalog.text,$2::pg_catalog.text) AS status`,
                          [checked.connection, checked.sql],
                        )
                      : await context.client.query(
                          `SELECT ${schema}."dblink_exec"($1::pg_catalog.text,$2::pg_catalog.text,$3::pg_catalog.bool) AS status`,
                          [checked.connection, checked.sql, checked.failOnError],
                        );
                const [row] = v.parse(v.tuple([v.strictObject({ status: v.string() })]), result.rows);
                return row.status;
              });
              return { status: status!, rollback: "not-transactional" } as const;
            }),
          open: (request: DblinkCursorRequest) =>
            context.run(async () => {
              const checked = v.parse(dblinkCursorValidator, request);
              const status = await effect(
                "open",
                effectExtras(checked.connection, checked.cursor),
                async () => {
                  const result =
                    checked.connection === undefined
                      ? checked.failOnError === undefined
                        ? await context.client.query(
                            `SELECT ${schema}."dblink_open"($1::pg_catalog.text,$2::pg_catalog.text) AS status`,
                            [checked.cursor, checked.sql],
                          )
                        : await context.client.query(
                            `SELECT ${schema}."dblink_open"($1::pg_catalog.text,$2::pg_catalog.text,$3::pg_catalog.bool) AS status`,
                            [checked.cursor, checked.sql, checked.failOnError],
                          )
                      : checked.failOnError === undefined
                        ? await context.client.query(
                            `SELECT ${schema}."dblink_open"($1::pg_catalog.text,$2::pg_catalog.text,$3::pg_catalog.text) AS status`,
                            [checked.connection, checked.cursor, checked.sql],
                          )
                        : await context.client.query(
                            `SELECT ${schema}."dblink_open"($1::pg_catalog.text,$2::pg_catalog.text,$3::pg_catalog.text,$4::pg_catalog.bool) AS status`,
                            [checked.connection, checked.cursor, checked.sql, checked.failOnError],
                          );
                  const [row] = v.parse(v.tuple([v.strictObject({ status: v.string() })]), result.rows);
                  return row.status;
                },
              );
              return { status: status!, rollback: "not-transactional" } as const;
            }),
          fetch: <const Row extends Fields>(request: DblinkFetchRequest & { readonly fields: Row }) =>
            context.run(async () => {
              const checked = v.parse(dblinkFetchValidator, {
                connection: request.connection,
                cursor: request.cursor,
                count: request.count,
                failOnError: request.failOnError,
              });
              const columns = recordColumns(request.fields);
              const codec = compositeCodec("record", request.fields);
              let decoded: readonly MappedRow<Row>[] = [];
              await effect("fetch", effectExtras(checked.connection, checked.cursor), async () => {
                const result =
                  checked.connection === undefined
                    ? checked.failOnError === undefined
                      ? await context.client.query(
                          `SELECT ROW(s.*)::pg_catalog.text AS value FROM ${schema}."dblink_fetch"($1::pg_catalog.text,$2::pg_catalog.int4) AS s(${columns})`,
                          [checked.cursor, checked.count],
                        )
                      : await context.client.query(
                          `SELECT ROW(s.*)::pg_catalog.text AS value FROM ${schema}."dblink_fetch"($1::pg_catalog.text,$2::pg_catalog.int4,$3::pg_catalog.bool) AS s(${columns})`,
                          [checked.cursor, checked.count, checked.failOnError],
                        )
                    : checked.failOnError === undefined
                      ? await context.client.query(
                          `SELECT ROW(s.*)::pg_catalog.text AS value FROM ${schema}."dblink_fetch"($1::pg_catalog.text,$2::pg_catalog.text,$3::pg_catalog.int4) AS s(${columns})`,
                          [checked.connection, checked.cursor, checked.count],
                        )
                      : await context.client.query(
                          `SELECT ROW(s.*)::pg_catalog.text AS value FROM ${schema}."dblink_fetch"($1::pg_catalog.text,$2::pg_catalog.text,$3::pg_catalog.int4,$4::pg_catalog.bool) AS s(${columns})`,
                          [checked.connection, checked.cursor, checked.count, checked.failOnError],
                        );
                decoded = decodeRecords<Row>(result.rows, codec);
                return "OK";
              });
              return decoded;
            }),
          close: (request: DblinkCloseRequest) =>
            context.run(async () => {
              const checked = v.parse(dblinkCloseValidator, request);
              const status = await effect(
                "close",
                effectExtras(checked.connection, checked.cursor),
                async () => {
                  const result =
                    checked.connection === undefined
                      ? checked.failOnError === undefined
                        ? await context.client.query(
                            `SELECT ${schema}."dblink_close"($1::pg_catalog.text) AS status`,
                            [checked.cursor],
                          )
                        : await context.client.query(
                            `SELECT ${schema}."dblink_close"($1::pg_catalog.text,$2::pg_catalog.bool) AS status`,
                            [checked.cursor, checked.failOnError],
                          )
                      : checked.failOnError === undefined
                        ? await context.client.query(
                            `SELECT ${schema}."dblink_close"($1::pg_catalog.text,$2::pg_catalog.text) AS status`,
                            [checked.connection, checked.cursor],
                          )
                        : await context.client.query(
                            `SELECT ${schema}."dblink_close"($1::pg_catalog.text,$2::pg_catalog.text,$3::pg_catalog.bool) AS status`,
                            [checked.connection, checked.cursor, checked.failOnError],
                          );
                  const [row] = v.parse(v.tuple([v.strictObject({ status: v.string() })]), result.rows);
                  return row.status;
                },
              );
              return { status: status!, rollback: "not-transactional" } as const;
            }),
          sendQuery: (request: { readonly connection: string; readonly sql: string }) =>
            context.run(async () => {
              const checked = v.parse(v.strictObject({ connection: identifier, sql: sqlText }), request);
              const sent = await effect("send-query", { connection: checked.connection }, async () => {
                const result = await context.client.query(
                  `SELECT ${schema}."dblink_send_query"($1::pg_catalog.text,$2::pg_catalog.text) AS sent`,
                  [checked.connection, checked.sql],
                );
                const [row] = v.parse(v.tuple([v.strictObject({ sent: v.number() })]), result.rows);
                return String(row.sent);
              });
              return { sent: Number(sent), rollback: "not-transactional" } as const;
            }),
          getResult: <const Row extends Fields>(
            request: { readonly connection: string; readonly failOnError?: boolean; readonly fields: Row },
          ) =>
            context.run(async () => {
              const checked = v.parse(
                v.strictObject({ connection: identifier, failOnError: v.optional(v.boolean()) }),
                { connection: request.connection, failOnError: request.failOnError },
              );
              const columns = recordColumns(request.fields);
              const codec = compositeCodec("record", request.fields);
              let decoded: readonly MappedRow<Row>[] = [];
              await effect("get-result", effectExtras(checked.connection), async () => {
                const result =
                  checked.failOnError === undefined
                    ? await context.client.query(
                        `SELECT ROW(s.*)::pg_catalog.text AS value FROM ${schema}."dblink_get_result"($1::pg_catalog.text) AS s(${columns})`,
                        [checked.connection],
                      )
                    : await context.client.query(
                        `SELECT ROW(s.*)::pg_catalog.text AS value FROM ${schema}."dblink_get_result"($1::pg_catalog.text,$2::pg_catalog.bool) AS s(${columns})`,
                        [checked.connection, checked.failOnError],
                      );
                decoded = decodeRecords<Row>(result.rows, codec);
                return "OK";
              });
              return decoded;
            }),
          isBusy: (connection: string) =>
            context.run(async () => {
              const name = v.parse(identifier, connection);
              const result = await context.client.query(
                `SELECT ${schema}."dblink_is_busy"($1::pg_catalog.text) AS busy`,
                [name],
              );
              const [row] = v.parse(v.tuple([v.strictObject({ busy: v.number() })]), result.rows);
              return row.busy;
            }),
          cancelQuery: (connection: string) =>
            context.run(async () => {
              const name = v.parse(identifier, connection);
              const status = await effect("cancel", { connection: name }, async () => {
                const result = await context.client.query(
                  `SELECT ${schema}."dblink_cancel_query"($1::pg_catalog.text) AS status`,
                  [name],
                );
                const [row] = v.parse(v.tuple([v.strictObject({ status: v.string() })]), result.rows);
                return row.status;
              });
              return { status: status!, rollback: "not-transactional" } as const;
            }),
          errorMessage: (connection: string) =>
            context.run(async () => {
              const name = v.parse(identifier, connection);
              const result = await context.client.query(
                `SELECT ${schema}."dblink_error_message"($1::pg_catalog.text) AS message`,
                [name],
              );
              const [row] = v.parse(v.tuple([v.strictObject({ message: v.string() })]), result.rows);
              return row.message;
            }),
          getNotify: (connection?: string) =>
            context.run(async () => {
              const name = connection === undefined ? undefined : v.parse(identifier, connection);
              let decoded: readonly DblinkNotify[] = [];
              await effect("notify", effectExtras(name), async () => {
                const result =
                  name === undefined
                    ? await context.client.query(
                        `SELECT ROW(s.*)::pg_catalog.text AS value FROM ${schema}."dblink_get_notify"() AS s`,
                      )
                    : await context.client.query(
                        `SELECT ROW(s.*)::pg_catalog.text AS value FROM ${schema}."dblink_get_notify"($1::pg_catalog.text) AS s`,
                        [name],
                      );
                decoded = v
                  .parse(v.array(v.strictObject({ value: v.string() })), result.rows)
                  .map((row) => dblinkNotifyCodec.decode(row.value));
                return "OK";
              });
              return Object.freeze(decoded);
            }),
        };
        return Object.freeze(session);
      },
      callback,
      signal,
      async (context) => {
        const listed = await context.client.query(
          `SELECT ${schema}."dblink_get_connections"()::pg_catalog.text AS value`,
        );
        const [row] = v.parse(v.tuple([v.strictObject({ value: v.nullable(v.string()) })]), listed.rows);
        const names = row.value === null ? [] : (dblinkTextArrayCodec.decode(row.value).values as string[]);
        for (const connection of names) {
          const index =
            effects.push({ operation: "cleanup", connection, state: "unknown", rollback: "not-transactional" }) - 1;
          const result = await context.client.query(`SELECT ${schema}."dblink_disconnect"($1::pg_catalog.text) AS status`, [
            connection,
          ]);
          const [disconnected] = v.parse(v.tuple([v.strictObject({ status: v.string() })]), result.rows);
          effects[index] = {
            operation: "cleanup",
            connection,
            state: "acknowledged",
            rollback: "not-transactional",
            status: disconnected.status,
          };
        }
        const unnamed =
          effects.push({ operation: "cleanup", state: "unknown", rollback: "not-transactional" }) - 1;
        try {
          const result = await context.client.query(`SELECT ${schema}."dblink_disconnect"() AS status`);
          const [disconnected] = v.parse(v.tuple([v.strictObject({ status: v.string() })]), result.rows);
          effects[unnamed] = {
            operation: "cleanup",
            state: "acknowledged",
            rollback: "not-transactional",
            status: disconnected.status,
          };
        } catch (error) {
          const message = error instanceof Error ? error.message : "";
          if (!message.includes("not available")) throw error;
          effects[unnamed] = { operation: "cleanup", state: "acknowledged", rollback: "not-transactional" };
        }
      },
    );
    return { ...result, effects: snapshot() };
  } catch (cause) {
    if (cause instanceof ExtensionOperationError) throw new DblinkOperationError(cause, snapshot());
    throw cause;
  }
}
