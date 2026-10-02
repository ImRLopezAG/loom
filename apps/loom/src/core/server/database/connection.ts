import { channel } from "node:diagnostics_channel";
import { AsyncLocalStorage } from "node:async_hooks";
import type { AnyRelations } from "drizzle-orm";
import { NodePgDatabase, NodePgSession, NodePgTransaction, nodePgCodecs } from "drizzle-orm/node-postgres";
import type { PgTable } from "drizzle-orm/pg-core";
import type { PreparedQueryConfig } from "drizzle-orm/pg-core/session";
import type { PgTransactionConfig } from "drizzle-orm/pg-core";
import type { NodePgClient, NodePgSessionOptions } from "drizzle-orm/node-postgres";
import { extensionSqlDialect, checkCompiledExtensionQuery } from "../../extensions/sql";
import { preservingArrayParser } from "../../extensions/codecs";
import { rememberDatabaseAdapter } from "./context";
import { validateSchemaRelations } from "./relations";
import pg from "pg";
import * as v from "valibot";
import { RuntimePool } from "./pool";
import { cancelDatabaseStatement } from "./cancel";
import type { SchemaMetadata } from "../../schema/compile";

export interface DatabaseSchema {
  readonly tables: Readonly<Record<string, PgTable>>;
  readonly metadata: SchemaMetadata;
}
export interface DatabaseOptions<Relations extends AnyRelations> {
  readonly schema: DatabaseSchema;
  readonly relations: Relations;
  readonly connectionString: string;
  readonly maxConnections?: number;
}
export interface DatabaseConnection<Relations extends AnyRelations> {
  readonly db: NodePgDatabase<Relations>;
  readonly pool: pg.Pool;
  readonly transaction: NodePgDatabase<Relations>["transaction"];
  readonly close: () => Promise<void>;
}
const poolErrors = channel("loom.database.pool.error");
interface InvocationOwner {
  active: boolean;
  decodingFailure?: { cause: unknown };
}
const invocation = new AsyncLocalStorage<InvocationOwner>();
const transactionSignal = new AsyncLocalStorage<AbortSignal>();
class ExtensionSession<Relations extends AnyRelations> extends NodePgSession<Relations> {
  constructor(
    private readonly extensionClient: NodePgClient,
    private readonly extensionDialect: ReturnType<typeof extensionSqlDialect>,
    private readonly extensionRelations: Relations,
    private readonly resolveExtensionRelation: (name: string) => string,
    private readonly extensionOptions: NodePgSessionOptions = {},
  ) {
    super(extensionClient, extensionDialect, extensionRelations, extensionOptions);
  }
  override async transaction<T>(
    operation: (tx: NodePgTransaction<Relations>) => Promise<T>,
    config?: PgTransactionConfig,
  ): Promise<T> {
    if (!(this.extensionClient instanceof pg.Pool)) return super.transaction(operation, config);
    const client = await this.extensionClient.connect();
    try {
      // Drizzle's pool branch constructs a plain session; retain the checked subclass on the acquired client.
      return await new ExtensionSession(
        client,
        this.extensionDialect,
        this.extensionRelations,
        this.resolveExtensionRelation,
        this.extensionOptions,
      ).transaction(operation, config);
    } finally {
      client.release();
    }
  }
  override prepareQuery<T extends PreparedQueryConfig = PreparedQueryConfig>(
    ...args: Parameters<NodePgSession<Relations>["prepareQuery"]>
  ) {
    const prepared = super.prepareQuery<T>(...args);
    const execute = prepared.execute.bind(prepared);
    prepared.execute = async (values) => {
      checkCompiledExtensionQuery(args[0], this.resolveExtensionRelation);
      return execute(values);
    };
    return prepared;
  }
}

/** A caught result-decoding failure still invalidates its invocation transaction. */
export function failInvocationDecoding(cause: unknown): void {
  const owner = invocation.getStore();
  if (owner?.active) owner.decodingFailure ??= { cause };
}

/** Carry cancellation to the native connection without changing Drizzle's API. */
export function withTransactionSignal<Result>(signal: AbortSignal | undefined, work: () => Result): Result {
  return signal ? transactionSignal.run(signal, work) : work();
}

/** Capture ownership without exposing the token to application contexts. */
export function captureInvocationGuard(): () => void {
  const owner = invocation.getStore();
  if (!owner?.active) throw new Error("Database invocation is inactive");
  return () => {
    if (!owner.active) throw new Error("Database invocation is inactive");
    if (invocation.getStore() !== owner) throw new Error("Database belongs to a different invocation");
  };
}

/** Retain exact array text per connection while preserving normal driver results. */
function arrayTextClient<Client extends pg.Pool | pg.PoolClient>(client: Client, arrays: ReadonlySet<number>): Client {
  return new Proxy(client, {
    get(target, key) {
      if (key === "query")
        return (config: pg.QueryConfig, values?: pg.QueryConfig["values"]) => {
          const types = config.types;
          const query = target.query.bind(target);
          return query(
            types
              ? {
                  ...config,
                  types: {
                    getTypeParser: (oid: number, format: "text" | "binary" = "text") =>
                      arrays.has(oid) && format === "text"
                        ? preservingArrayParser(types.getTypeParser(oid, format))
                        : types.getTypeParser(oid, format),
                  },
                }
              : config,
            values,
          );
        };
      if (key === "connect" && target instanceof pg.Pool)
        return async () => arrayTextClient(await target.connect(), arrays);
      // SAFETY: Proxy reads preserve the exact underlying pg property, including symbols.
      const value = target[key as keyof Client];
      return v.is(v.function(), value) ? value.bind(target) : value;
    },
  });
}
/** Runtime credentials only. Schema installation belongs to the migration adapter. */
export async function connectDatabase<Relations extends AnyRelations>(
  options: DatabaseOptions<Relations>,
): Promise<DatabaseConnection<Relations>> {
  validateSchemaRelations(options.schema, options.relations);
  const address = URL.parse(options.connectionString);
  if (!address || !["postgres:", "postgresql:"].includes(address.protocol))
    throw new Error("Expected a PostgreSQL URL");
  const max = options.maxConnections ?? 4;
  if (!Number.isInteger(max) || max < 1 || max > 20) throw new Error("maxConnections must be an integer from 1 to 20");
  const pool = new RuntimePool({
    connectionString: options.connectionString,
    max,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
  });
  pool.on("error", () => poolErrors.publish({ code: "DATABASE_POOL_ERROR" }));
  try {
    const version = await pool.query<{ server_version_num: string }>("SHOW server_version_num");
    const majorVersion = Math.floor(Number(version.rows[0]?.server_version_num) / 10000);
    if (majorVersion !== 18) throw new Error("Loom requires PostgreSQL 18");
    const arrayTypes = await pool.query<{ oid: number }>(
      "select oid from pg_catalog.pg_type where typelem <> 0 and typcategory = 'A'",
    );
    const arrays = new Set(arrayTypes.rows.map(({ oid }) => oid));
    const dialect = extensionSqlDialect(nodePgCodecs);
    const relationNames = new Map(
      options.schema.metadata.entities.map((entity) => [
        `${options.schema.metadata.namespace}.${entity.sqlName}`,
        entity.sqlName,
      ]),
    );
    const resolveRelation = (name: string) => relationNames.get(name) ?? name;
    const db = new NodePgDatabase(
      dialect,
      new ExtensionSession(arrayTextClient(pool, arrays), dialect, options.relations, resolveRelation),
      options.relations,
    );
    const transaction: NodePgDatabase<Relations>["transaction"] = async (operation, config) => {
      const signal = transactionSignal.getStore();
      signal?.throwIfAborted();
      let state: "starting" | "active" | "finishing" | "closed" = "starting";
      const owner: InvocationOwner = { active: false };
      let client: pg.PoolClient | undefined;
      let released = false;
      let abortCleanup: Promise<void> | undefined;
      const release = (destroy: boolean) => {
        if (!client || released) return;
        released = true;
        client.release(destroy);
      };
      let rejectAbort = () => {};
      const aborted = new Promise<never>((_resolve, reject) => {
        rejectAbort = () => reject(signal?.reason);
      });
      const abort = () => {
        owner.active = false;
        state = "closed";
        // A transaction pooler can keep disconnected SQL running. Send its
        // BackendKeyData cancellation before closing the original mapping.
        if (client && !released) {
          abortCleanup ??= cancelDatabaseStatement(client)
            .catch(() => poolErrors.publish({ code: "DATABASE_CANCEL_ERROR" }))
            .finally(() => release(true));
        }
        rejectAbort();
      };
      const run = async () => {
        const acquired = await pool.connect();
        client = acquired;
        try {
          // Acquisition may complete after the caller has already aborted.
          if (signal?.aborted) {
            // No BEGIN was sent, so this connection is still safe to reuse.
            release(false);
            signal.throwIfAborted();
          }
          const logger = {
            logQuery(query: string) {
              if (state === "starting" && (query === "begin" || query.startsWith("begin "))) return;
              if (state === "active") {
                if (invocation.getStore() !== owner) throw new Error("Database belongs to a different invocation");
                return;
              }
              // Drizzle commits or rolls back after the application callback has settled.
              if (state === "finishing" && (query === "commit" || query === "rollback")) return;
              throw new Error("Database invocation is inactive");
            },
          };
          const typedClient = arrayTextClient(acquired, arrays);
          const scoped = new NodePgDatabase(
            dialect,
            new ExtensionSession(typedClient, dialect, options.relations, resolveRelation, { logger }),
            options.relations,
          );
          const scopedAdapters = new Map<AnyRelations, NodePgDatabase>();
          const adapter = <ScopeRelations extends AnyRelations>(
            relations: ScopeRelations,
          ): NodePgDatabase<ScopeRelations> => {
            const cached = scopedAdapters.get(relations);
            if (cached) {
              // SAFETY: each cache key is the exact relation graph used by its adapter.
              return cached as NodePgDatabase<ScopeRelations>;
            }
            const child = new NodePgTransaction(
              dialect,
              new ExtensionSession(typedClient, dialect, relations, resolveRelation, { logger }),
              relations,
              undefined,
              false,
            );
            rememberDatabaseAdapter(child, relations, adapter);
            scopedAdapters.set(relations, child);
            return child;
          };
          return await scoped.transaction(async (tx) => {
            signal?.throwIfAborted();
            state = "active";
            owner.active = true;
            rememberDatabaseAdapter(tx, options.relations, adapter);
            scopedAdapters.set(options.relations, tx);
            try {
              const result = await invocation.run(owner, async () => await operation(tx));
              if (owner.decodingFailure) throw owner.decodingFailure.cause;
              signal?.throwIfAborted();
              return result;
            } finally {
              owner.active = false;
              if (!signal?.aborted) state = "finishing";
            }
          }, config);
        } finally {
          // Cancellation also owns cleanup when a suspended callback never
          // settles. A settling callback must not disconnect ahead of it.
          await abortCleanup;
          release(signal?.aborted ?? false);
        }
      };
      signal?.addEventListener("abort", abort, { once: true });
      try {
        // Own both outcomes: the callback can settle after cancellation, but
        // cannot publish a result or retain transaction/database authority.
        return await Promise.race([run(), aborted]);
      } catch (cause) {
        signal?.throwIfAborted();
        throw cause;
      } finally {
        signal?.removeEventListener("abort", abort);
        owner.active = false;
        state = "closed";
        // The abort race can settle before run() does. Finish cancellation and
        // release its connection before the caller's invocation scope closes.
        await abortCleanup;
      }
    };
    return { db, pool, transaction, close: () => pool.end() };
  } catch (cause) {
    await pool.end();
    throw cause;
  }
}
