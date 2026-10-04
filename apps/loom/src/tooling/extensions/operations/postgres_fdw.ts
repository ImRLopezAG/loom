import * as v from "valibot";
import { createPostgresFdw_1_2 } from "../../../core/extensions/adapters/postgres_fdw";
import {
  postgresFdwConnectionCodec,
  type PostgresFdwConnection,
} from "../../../core/extensions/adapters/postgres_fdw-codecs";
import type { ExtensionDescriptor } from "../../../core/extensions/bindings";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { acquireExtensionLock } from "../../migrations/connection";
import { ExtensionOperationError, withExtensionOperation } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import source from "../manifests/postgres_fdw.json";

const identifier = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0")),
);
export const postgresFdwDisconnectValidator = v.strictObject({
  serverName: identifier,
});
export interface PostgresFdwDisconnectRequest {
  readonly serverName: string;
}
export interface PostgresFdwConnectionEffect {
  readonly operation: "disconnect" | "disconnect-all" | "cleanup";
  readonly serverName?: string;
  readonly state: "acknowledged" | "unknown";
  readonly rollback: "not-transactional";
  readonly disconnected?: boolean;
}
export class PostgresFdwOperationError extends ExtensionOperationError {
  constructor(
    failure: ExtensionOperationError,
    readonly effects: readonly PostgresFdwConnectionEffect[],
  ) {
    super(failure.cause, failure.completion, failure.cleanupFailures);
    this.name = "PostgresFdwOperationError";
  }
}
export interface PostgresFdwSession {
  readonly connections: (checkConn?: boolean) => Promise<readonly PostgresFdwConnection[]>;
  readonly disconnect: (
    request: PostgresFdwDisconnectRequest,
  ) => Promise<{ readonly disconnected: boolean; readonly rollback: "not-transactional" }>;
  readonly disconnectAll: () => Promise<{
    readonly disconnected: boolean;
    readonly rollback: "not-transactional";
  }>;
}

function quoteIdent(value: string): string {
  return `"${v.parse(identifier, value).replaceAll('"', '""')}"`;
}

/** Dedicated-session FDW cache: observation and disconnect stay on one backend; cleanup disconnects leftovers. */
export async function withPostgresFdw<Result>(
  directOperatorUrl: string,
  descriptor: ExtensionDescriptor<"postgres_fdw", { version: "1.2"; schema: string }>,
  callback: (session: PostgresFdwSession) => Promise<Result>,
  signal?: AbortSignal,
): Promise<{
  readonly completion: "committed";
  readonly value: Result;
  readonly effects: readonly PostgresFdwConnectionEffect[];
}> {
  createPostgresFdw_1_2(descriptor);
  const requirement = validateExtensionApiRequirement({
    schema: descriptor.schema,
    manifest: v.parse(extensionManifestValidator, source),
  });
  const effects: PostgresFdwConnectionEffect[] = [];
  const schema = quoteIdent(descriptor.schema);
  const snapshot = () => Object.freeze(effects.map((effect) => Object.freeze(effect)));
  try {
    const result = await withExtensionOperation(
      directOperatorUrl,
      async (context) => {
        await acquireExtensionLock(context.client, signal);
        await verifyExtensionApiContracts(context.client, [requirement]);
        return Object.freeze({
          connections: (checkConn = false) =>
            context.run(async () => {
              const checked = v.parse(v.boolean(), checkConn);
              const result = await context.client.query(
                `SELECT ROW(s.*)::pg_catalog.text AS value FROM ${schema}."postgres_fdw_get_connections"($1::pg_catalog.bool) AS s`,
                [checked],
              );
              return Object.freeze(
                v
                  .parse(v.array(v.strictObject({ value: v.string() })), result.rows)
                  .map((row) => postgresFdwConnectionCodec.decode(row.value)),
              );
            }),
          disconnect: (request: PostgresFdwDisconnectRequest) =>
            context.run(async () => {
              const checked = v.parse(postgresFdwDisconnectValidator, request);
              const index =
                effects.push({
                  operation: "disconnect",
                  serverName: checked.serverName,
                  state: "unknown",
                  rollback: "not-transactional",
                }) - 1;
              const result = await context.client.query(
                `SELECT ${schema}."postgres_fdw_disconnect"($1::pg_catalog.text) AS disconnected`,
                [checked.serverName],
              );
              const [row] = v.parse(v.tuple([v.strictObject({ disconnected: v.boolean() })]), result.rows);
              effects[index] = {
                operation: "disconnect",
                serverName: checked.serverName,
                state: "acknowledged",
                rollback: "not-transactional",
                disconnected: row.disconnected,
              };
              return { disconnected: row.disconnected, rollback: "not-transactional" } as const;
            }),
          disconnectAll: () =>
            context.run(async () => {
              const index =
                effects.push({ operation: "disconnect-all", state: "unknown", rollback: "not-transactional" }) - 1;
              const result = await context.client.query(
                `SELECT ${schema}."postgres_fdw_disconnect_all"() AS disconnected`,
              );
              const [row] = v.parse(v.tuple([v.strictObject({ disconnected: v.boolean() })]), result.rows);
              effects[index] = {
                operation: "disconnect-all",
                state: "acknowledged",
                rollback: "not-transactional",
                disconnected: row.disconnected,
              };
              return { disconnected: row.disconnected, rollback: "not-transactional" } as const;
            }),
        });
      },
      callback,
      signal,
      async (context) => {
        const index = effects.push({ operation: "cleanup", state: "unknown", rollback: "not-transactional" }) - 1;
        const result = await context.client.query(`SELECT ${schema}."postgres_fdw_disconnect_all"() AS disconnected`);
        const [row] = v.parse(v.tuple([v.strictObject({ disconnected: v.boolean() })]), result.rows);
        effects[index] = {
          operation: "cleanup",
          state: "acknowledged",
          rollback: "not-transactional",
          disconnected: row.disconnected,
        };
      },
    );
    return { ...result, effects: snapshot() };
  } catch (cause) {
    if (cause instanceof ExtensionOperationError) throw new PostgresFdwOperationError(cause, snapshot());
    throw cause;
  }
}
