import { channel } from "node:diagnostics_channel";
import { AsyncLocalStorage } from "node:async_hooks";
import { sql, SQL, type AnyRelations } from "drizzle-orm";
import { NodePgDatabase, NodePgSession, NodePgTransaction, nodePgCodecs } from "drizzle-orm/node-postgres";
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import type { PreparedQueryConfig } from "drizzle-orm/pg-core/session";
import type { PgTransactionConfig } from "drizzle-orm/pg-core";
import type { NodePgClient, NodePgSessionOptions } from "drizzle-orm/node-postgres";
import { extensionSqlDialect, checkCompiledExtensionQuery } from "../../extensions/sql";
import { requiresPgpAdmission, assertPgpBackendVersion } from "../../extensions/pgcrypto-pgp-admission";
import { preservingArrayParser } from "../../extensions/codecs";
import {
  withMappedJsonTransport,
  usesMappedJsonTransport,
  preserveDriverJsonText,
  isJsonTransportMapper,
} from "../../extensions/json-transport";
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
  readonly scopes?: readonly { readonly name: string; readonly schema?: DatabaseSchema }[];
}
export interface DatabaseConnection<Relations extends AnyRelations> {
  readonly db: NodePgDatabase<Relations>;
  readonly pool: pg.Pool;
  readonly transaction: NodePgDatabase<Relations>["transaction"];
  readonly close: () => Promise<void>;
}
const poolErrors = channel("loom.database.pool.error");
interface BackendLease {
  active: boolean;
  state: "starting" | "active" | "draining" | "finishing" | "closed";
  readonly domain: DatabaseDomain;
  readonly nativeClient: pg.PoolClient;
  readonly client: NodePgClient;
  readonly pending: Set<Promise<unknown>>;
  failure?: { cause: unknown };
  admission?: Promise<void>;
}
interface DatabaseDomain {
  run<Relations extends AnyRelations, Result>(
    relations: Relations,
    options: NodePgSessionOptions,
    operation: (tx: NodePgTransaction<Relations>) => Promise<Result>,
    config?: PgTransactionConfig,
  ): Promise<Result>;
}
interface ExecutionTicket {
  readonly lease: BackendLease;
}
type FormatTransactionConfig = (config: PgTransactionConfig) => SQL;
const invocation = new AsyncLocalStorage<BackendLease>();
const pgpExecution = new AsyncLocalStorage<ExecutionTicket>();
const transactionSignal = new AsyncLocalStorage<AbortSignal>();
function failLease(lease: BackendLease | undefined, cause: unknown): void {
  if (lease?.active) lease.failure ??= { cause };
}
function assertTicket(ticket: ExecutionTicket): void {
  const lease = ticket.lease;
  // Revocation must retain the invocation's first cause, including undefined.
  if (lease.failure) throw lease.failure.cause;
  if (!lease.active || (lease.state !== "active" && lease.state !== "draining"))
    throw new Error("Database invocation is inactive");
  if (invocation.getStore() !== lease) throw new Error("Database belongs to a different invocation");
}
function leaseOptions(lease: BackendLease, original: NodePgSessionOptions): NodePgSessionOptions {
  return {
    ...original,
    logger: {
      logQuery(query, params) {
        const ticket = pgpExecution.getStore();
        if (lease.state === "starting" && (query === "begin" || query.startsWith("begin "))) {
          original.logger?.logQuery(query, params);
          return;
        }
        if (lease.state === "finishing" && (query === "commit" || query === "rollback")) {
          original.logger?.logQuery(query, params);
          return;
        }
        if (lease.state === "active" || (lease.state === "draining" && ticket?.lease === lease)) {
          if (invocation.getStore() !== lease) throw new Error("Database belongs to a different invocation");
          if (ticket) assertTicket(ticket);
          original.logger?.logQuery(query, params);
          return;
        }
        throw new Error("Database invocation is inactive");
      },
    },
  };
}
class ExtensionSession<Relations extends AnyRelations> extends NodePgSession<Relations> {
  constructor(
    extensionClient: NodePgClient,
    private readonly extensionDialect: ReturnType<typeof extensionSqlDialect>,
    private readonly extensionRelations: Relations,
    private readonly resolveExtensionRelation: (name: string) => string,
    private readonly extensionOptions: NodePgSessionOptions = {},
    private readonly domain: DatabaseDomain,
    private readonly lease?: BackendLease,
  ) {
    super(extensionClient, extensionDialect, extensionRelations, extensionOptions);
  }
  override async transaction<T>(
    operation: (tx: NodePgTransaction<Relations>) => Promise<T>,
    config?: PgTransactionConfig,
  ): Promise<T> {
    return this.domain.run(this.extensionRelations, this.extensionOptions, operation, config);
  }
  override prepareQuery<T extends PreparedQueryConfig = PreparedQueryConfig>(
    ...args: Parameters<NodePgSession<Relations>["prepareQuery"]>
  ) {
    const prepared = super.prepareQuery<T>(...args);
    const execute = prepared.execute.bind(prepared);
    prepared.execute = (values) => {
      const mapped = (work: () => ReturnType<typeof execute>) =>
        withMappedJsonTransport(args[1] === "arrays" && isJsonTransportMapper(args[3]), work);
      let contracts: ReturnType<typeof checkCompiledExtensionQuery>;
      try {
        contracts = checkCompiledExtensionQuery(args[0], this.resolveExtensionRelation);
      } catch (cause) {
        // A caught execution-local checker refusal keeps its existing query
        // behavior; it does not acquire or poison a PGP execution ticket.
        return Promise.reject(cause);
      }
      if (!contracts.some((contract) => requiresPgpAdmission(contract.member))) return mapped(() => execute(values));
      try {
        const owner = invocation.getStore();
        const lease = this.lease ?? owner;
        if (lease) {
          // A refused call never acquires a ticket. In particular it cannot
          // poison work already accepted before callback closure.
          if (!lease.active || lease.state !== "active")
            return Promise.reject(new Error("Database invocation is inactive"));
          if (lease.domain !== this.domain) throw new Error("Database belongs to a different connection domain");
          if (owner !== lease) throw new Error("Database belongs to a different invocation");
          const executePinned = this.lease
            ? execute
            : new ExtensionSession(
                lease.client,
                this.extensionDialect,
                this.extensionRelations,
                this.resolveExtensionRelation,
                leaseOptions(lease, this.extensionOptions),
                this.domain,
                lease,
              ).nativeExecute<T>(args);
          return this.accept<T>(lease, args, () => mapped(() => executePinned(values)));
        }
        // Only affected root work obtains an implicit owned transaction. Keep
        // the original compiled Query and every native preparation argument.
        return this.domain.run(this.extensionRelations, this.extensionOptions, async () => {
          const lease = invocation.getStore();
          if (!lease) throw new Error("Database invocation is inactive");
          const rebound = new ExtensionSession(
            lease.client,
            this.extensionDialect,
            this.extensionRelations,
            this.resolveExtensionRelation,
            leaseOptions(lease, this.extensionOptions),
            this.domain,
            lease,
          );
          return rebound.prepareQuery<T>(...args).execute(values);
        });
      } catch (cause) {
        failLease(invocation.getStore(), cause);
        return Promise.reject(cause);
      }
    };
    return prepared;
  }
  private nativeExecute<T extends PreparedQueryConfig>(args: Parameters<NodePgSession<Relations>["prepareQuery"]>) {
    const prepared = super.prepareQuery<T>(...args);
    return prepared.execute.bind(prepared);
  }
  private accept<T extends PreparedQueryConfig>(
    lease: BackendLease,
    args: Parameters<NodePgSession<Relations>["prepareQuery"]>,
    execute: () => Promise<T["execute"]>,
  ): Promise<T["execute"]> {
    const ticket: ExecutionTicket = { lease };
    // Promise executors assign these synchronously while retaining the framework's ES2023 surface.
    let resolveTask!: (value: T["execute"] | PromiseLike<T["execute"]>) => void;
    let rejectTask!: (cause: unknown) => void;
    const pending = new Promise<T["execute"]>((resolve, reject) => {
      resolveTask = resolve;
      rejectTask = reject;
    });
    // Register acceptance before the first asynchronous native observation.
    lease.pending.add(pending);
    const run = async () => {
      try {
        assertTicket(ticket);
        lease.admission ??= lease.client
          .query("SHOW server_version_num")
          .then((result) => assertPgpBackendVersion(result.rows));
        await lease.admission;
        assertTicket(ticket);
        checkCompiledExtensionQuery(args[0], this.resolveExtensionRelation);
        const result = await pgpExecution.run(ticket, execute);
        // Native/cache delivery and mapping may suspend or revoke authority.
        // Accepted work cannot publish a result after its owner is cancelled.
        assertTicket(ticket);
        // Resolve in this same continuation: forwarding an async run's value
        // through another .then would reopen authority between check and use.
        resolveTask(result);
      } catch (cause) {
        failLease(lease, cause);
        rejectTask(lease.failure ? lease.failure.cause : cause);
      }
    };
    void run();
    void pending.then(
      () => lease.pending.delete(pending),
      () => lease.pending.delete(pending),
    );
    return pending;
  }
}

/** A caught result-decoding failure still invalidates its invocation transaction. */
export function failInvocationDecoding(cause: unknown): void {
  const owner = invocation.getStore();
  failLease(owner, cause);
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

/** Retain exact transport values per connection while preserving raw driver results. */
function arrayTextClient<Client extends pg.Pool | pg.PoolClient>(client: Client, arrays: ReadonlySet<number>): Client {
  return new Proxy(client, {
    get(target, key) {
      if (key === "query")
        return (config: pg.QueryConfig, values?: pg.QueryConfig["values"]) => {
          const ticket = pgpExecution.getStore();
          if (ticket) {
            assertTicket(ticket);
            if (ticket.lease.nativeClient !== target)
              throw new Error("Database belongs to a different connection domain");
          }
          const types = config.types;
          const mappedJson = usesMappedJsonTransport();
          const query = target.query.bind(target);
          const pending = query(
            types
              ? {
                  ...config,
                  types: {
                    getTypeParser: (oid: number, format: "text" | "binary" = "text") =>
                      mappedJson &&
                      format === "text" &&
                      (oid === pg.types.builtins.JSON || oid === pg.types.builtins.JSONB)
                        ? preserveDriverJsonText
                        : arrays.has(oid) && format === "text"
                          ? preservingArrayParser(types.getTypeParser(oid, format))
                          : types.getTypeParser(oid, format),
                  },
                }
              : config,
            values,
          );
          return ticket
            ? pending.then((result) => {
                // Recheck successful native delivery before Drizzle extracts
                // rows or invokes a result mapper from a delayed response.
                assertTicket(ticket);
                return result;
              })
            : pending;
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
  const relationNames = new Map<string, string>();
  // Root revision capture reads options.schema; empty-name scope entries add no root authority.
  for (const scope of [{ name: "", schema: options.schema }, ...(options.scopes ?? []).filter((scope) => scope.name)]) {
    if (!scope.schema) continue;
    for (const entity of scope.schema.metadata.entities) {
      const table = scope.schema.tables[entity.name];
      if (!table) throw new Error(`Missing compiled scope table: ${scope.name}:${entity.name}`);
      const config = getTableConfig(table);
      if ((config.schema ?? "public") !== scope.schema.metadata.namespace || config.name !== entity.sqlName)
        throw new Error(`Scope table identity differs from metadata: ${scope.name}:${entity.name}`);
      const physical = `${scope.schema.metadata.namespace}.${entity.sqlName}`;
      const revision = scope.name ? `${scope.name}:${entity.sqlName}` : entity.sqlName;
      const previous = relationNames.get(physical);
      if (previous !== undefined && previous !== revision)
        throw new Error(`Conflicting revision identity for physical table: ${physical}`);
      relationNames.set(physical, revision);
    }
  }
  const resolveRelation = (name: string) => relationNames.get(name) ?? name;
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
    const dialect = extensionSqlDialect(nodePgCodecs, resolveRelation);
    const domain: DatabaseDomain = { run: runTransaction };
    const db = new NodePgDatabase(
      dialect,
      new ExtensionSession(arrayTextClient(pool, arrays), dialect, options.relations, resolveRelation, {}, domain),
      options.relations,
    );
    async function runTransaction<ScopeRelations extends AnyRelations, Result>(
      relations: ScopeRelations,
      sessionOptions: NodePgSessionOptions,
      operation: (tx: NodePgTransaction<ScopeRelations>) => Promise<Result>,
      config?: PgTransactionConfig,
    ): Promise<Result> {
      const signal = transactionSignal.getStore();
      signal?.throwIfAborted();
      let lease: BackendLease | undefined;
      let client: pg.PoolClient | undefined;
      let released = false;
      let destroy = false;
      let abortCleanup: Promise<void> | undefined;
      const release = (discard: boolean) => {
        if (!client || released) return;
        released = true;
        client.release(discard);
      };
      let rejectAbort = () => {};
      const aborted = new Promise<never>((_resolve, reject) => {
        rejectAbort = () => reject(lease?.failure ? lease.failure.cause : signal?.reason);
      });
      const abort = () => {
        if (lease) {
          lease.failure ??= { cause: signal?.reason };
          lease.active = false;
          lease.state = "closed";
        }
        // Send BackendKeyData cancellation before destroying the original
        // transaction-pooler mapping, including suspended JavaScript callbacks.
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
          if (signal?.aborted) {
            // A late acquisition has submitted no BEGIN and is safe to reuse.
            release(false);
            signal.throwIfAborted();
          }
          const typedClient = arrayTextClient(acquired, arrays);
          const owner: BackendLease = {
            domain,
            nativeClient: acquired,
            client: typedClient,
            active: false,
            state: "starting",
            pending: new Set(),
          };
          lease = owner;
          const checkedOptions = leaseOptions(owner, sessionOptions);
          const session = new ExtensionSession(
            typedClient,
            dialect,
            relations,
            resolveRelation,
            checkedOptions,
            domain,
            owner,
          );
          const tx = new NodePgTransaction(dialect, session, relations, undefined, false);
          const scopedAdapters = new Map<AnyRelations, NodePgDatabase>();
          const adapter = <ChildRelations extends AnyRelations>(
            childRelations: ChildRelations,
          ): NodePgDatabase<ChildRelations> => {
            const cached = scopedAdapters.get(childRelations);
            if (cached) {
              // SAFETY: each key is the exact relation graph used by its adapter.
              return cached as NodePgDatabase<ChildRelations>;
            }
            const child = new NodePgTransaction(
              dialect,
              new ExtensionSession(
                typedClient,
                dialect,
                childRelations,
                resolveRelation,
                checkedOptions,
                domain,
                owner,
              ),
              childRelations,
              undefined,
              false,
            );
            rememberDatabaseAdapter(child, childRelations, adapter);
            scopedAdapters.set(childRelations, child);
            return child;
          };
          let began = false;
          let commitStarted = false;
          try {
            // Drizzle's native BEGIN formatter exists at runtime but is omitted from its declarations.
            const beginOptions = config
              ? v.parse(
                  v.instance(SQL),
                  v
                    .parse(
                      v.object({
                        getTransactionConfigSQL: v.custom<FormatTransactionConfig>((value) =>
                          v.is(v.function(), value),
                        ),
                      }),
                      tx,
                    )
                    .getTransactionConfigSQL.call(tx, config),
                )
              : undefined;
            await tx.execute(sql`begin${beginOptions ? sql` ${beginOptions}` : undefined}`);
            began = true;
            signal?.throwIfAborted();
            owner.state = "active";
            owner.active = true;
            rememberDatabaseAdapter(tx, relations, adapter);
            scopedAdapters.set(relations, tx);
            const result = await invocation.run(owner, async () => {
              let result: Result | undefined;
              try {
                result = await operation(tx);
              } catch (cause) {
                failLease(owner, cause);
              } finally {
                // Accepted tickets keep authority during drain; new execute
                // calls cannot enter after the callback has settled.
                if (owner.state !== "closed") owner.state = "draining";
              }
              await Promise.allSettled(owner.pending);
              if (owner.failure) throw owner.failure.cause;
              signal?.throwIfAborted();
              // SAFETY: absent a recorded callback failure, result is its exact Result, including undefined.
              return result as Result;
            });
            owner.state = "finishing";
            commitStarted = true;
            await tx.execute(sql`commit`);
            return result;
          } catch (cause) {
            owner.failure ??= { cause };
            // A lost COMMIT acknowledgment has an unknown outcome. Discard
            // that transport; rollback cleanup is not evidence of its outcome.
            if (commitStarted) destroy = true;
            if (began && owner.state !== "closed") {
              owner.state = "finishing";
              try {
                await tx.execute(sql`rollback`);
              } catch {
                destroy = true;
              }
            }
            throw owner.failure.cause;
          } finally {
            owner.active = false;
            owner.state = "closed";
          }
        } finally {
          await abortCleanup;
          release(destroy || (signal?.aborted ?? false));
        }
      };
      signal?.addEventListener("abort", abort, { once: true });
      try {
        return await Promise.race([run(), aborted]);
      } catch (cause) {
        if (lease?.failure) throw lease.failure.cause;
        signal?.throwIfAborted();
        throw cause;
      } finally {
        signal?.removeEventListener("abort", abort);
        if (lease) {
          lease.active = false;
          lease.state = "closed";
        }
        await abortCleanup;
      }
    }
    const transaction: NodePgDatabase<Relations>["transaction"] = (operation, config) =>
      domain.run(options.relations, {}, operation, config);
    return { db, pool, transaction, close: () => pool.end() };
  } catch (cause) {
    await pool.end();
    throw cause;
  }
}
