import { channel } from "node:diagnostics_channel";
import { is, Relation } from "drizzle-orm";
import type { AnyRelations } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { PgTable, getTableConfig } from "drizzle-orm/pg-core";
import pg from "pg";
import type { SchemaMetadata } from "../../schema/compile.js";

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
const poolErrors = channel("loom.database.pool.error");

/** Runtime credentials only. Schema installation belongs to the migration adapter. */
export async function connectDatabase<Relations extends AnyRelations>(options: DatabaseOptions<Relations>) {
  validateSchema(options.schema, options.relations);
  const address = URL.parse(options.connectionString);
  if (!address || !["postgres:", "postgresql:"].includes(address.protocol)) throw new Error("Expected a PostgreSQL URL");
  const max = options.maxConnections ?? 4;
  if (!Number.isInteger(max) || max < 1 || max > 20) throw new Error("maxConnections must be an integer from 1 to 20");
  const pool = new pg.Pool({ connectionString: options.connectionString, max, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000 });
  pool.on("error", () => poolErrors.publish({ code: "DATABASE_POOL_ERROR" }));
  try {
    const version = await pool.query<{ server_version_num: string }>("SHOW server_version_num");
    const majorVersion = Math.floor(Number(version.rows[0]?.server_version_num) / 10000);
    if (majorVersion !== 18) throw new Error("Loom requires PostgreSQL 18");
    const db = drizzle({ client: pool, relations: options.relations });
    return { db, pool, close: () => pool.end() };
  } catch (cause) {
    await pool.end();
    throw cause;
  }
}

function validateSchema(schema: DatabaseSchema, relations: AnyRelations): void {
  const declared = new Set(schema.metadata.entities.map((entity) => entity.name));
  const compiledTables = new Set(Object.values(schema.tables));
  for (const [name, table] of Object.entries(schema.tables)) {
    if (!is(table, PgTable) || !declared.has(name)) throw new Error(`Unsupported compiled table: ${name}`);
    const config = getTableConfig(table);
    if ((config.schema ?? "public") !== schema.metadata.namespace) throw new Error(`Table namespace mismatch: ${name}`);
    if (relations[name]?.table !== table) throw new Error(`Relations must use the compiled table: ${name}`);
  }
  for (const name of declared) if (!Object.hasOwn(schema.tables, name)) throw new Error(`Missing compiled table: ${name}`);
  for (const [name, config] of Object.entries(relations)) {
    if (schema.tables[name] !== config.table) throw new Error(`Relations must use the compiled table: ${name}`);
    for (const relation of Object.values(config.relations)) {
      if (!is(relation, Relation)) throw new Error(`Unsupported relation API: ${name}`);
      if (!is(relation.targetTable, PgTable) || !compiledTables.has(relation.targetTable)) throw new Error(`Relation target is outside schema: ${name}`);
    }
  }
}
