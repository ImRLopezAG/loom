import { channel } from "node:diagnostics_channel";
import { AsyncLocalStorage } from "node:async_hooks";
import type { AnyRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { PgTable } from "drizzle-orm/pg-core";
import { rememberDatabaseRelations } from "./context";
import { validateSchemaRelations } from "./relations";
import pg from "pg";
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
const invocation = new AsyncLocalStorage<symbol>();

/** Capture ownership without exposing the token to application contexts. */
export function captureInvocationGuard(): () => void {
  const owner = invocation.getStore();
  if (!owner) throw new Error("Database invocation is inactive");
  return () => {
    if (invocation.getStore() !== owner) throw new Error("Database belongs to a different invocation");
  };
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
  const pool = new pg.Pool({
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
    const db = drizzle({ client: pool, relations: options.relations });
    const transaction: NodePgDatabase<Relations>["transaction"] = async (operation, config) => {
      let state: "starting" | "active" | "finishing" | "closed" = "starting";
      const token = Symbol("databaseInvocation");
      const scoped = drizzle({
        client: pool,
        relations: options.relations,
        logger: {
          logQuery(query) {
            if (state === "starting" && (query === "begin" || query.startsWith("begin "))) return;
            if (state === "active") {
              if (invocation.getStore() !== token) throw new Error("Database belongs to a different invocation");
              return;
            }
            // Drizzle commits or rolls back after the application callback has settled.
            if (state === "finishing" && (query === "commit" || query === "rollback")) return;
            throw new Error("Database invocation is inactive");
          },
        },
      });
      try {
        return await scoped.transaction(async (tx) => {
          state = "active";
          rememberDatabaseRelations(tx, options.relations);
          try {
            return await invocation.run(token, () => operation(tx));
          } finally {
            state = "finishing";
          }
        }, config);
      } finally {
        state = "closed";
      }
    };
    return { db, pool, transaction, close: () => pool.end() };
  } catch (cause) {
    await pool.end();
    throw cause;
  }
}
