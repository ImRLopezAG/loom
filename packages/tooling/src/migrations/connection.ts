import pg from "pg";
import * as v from "valibot";
import { channel } from "node:diagnostics_channel";

const ownedConnections = new WeakSet<pg.Client>();

/** Session-level stages must not retain locks on arbitrary or pooled clients. */
export function assertMigrationConnection(client: pg.Client): void {
  if (!ownedConnections.has(client)) throw new Error("Stage requires an active owned migration connection");
}

export const databaseIdentifier = v.pipe(v.string(), v.regex(/^[a-z][a-z0-9_]{0,62}$/));
export function quoteIdentifier(name: string): string {
  return `"${v.parse(databaseIdentifier, name)}"`;
}

/** Always owns a dedicated session: session locks must never return to a pool. */
export async function withMigrationConnection<T>(
  connectionString: string,
  operation: (client: pg.Client) => Promise<T>,
): Promise<T> {
  const url = new URL(connectionString);
  if (!["postgres:", "postgresql:"].includes(url.protocol)) throw new Error("Expected a PostgreSQL migration URL");
  const client = new pg.Client({
    connectionString,
    connectionTimeoutMillis: 5000,
    application_name: "loom-migrations",
  });
  client.on("error", () => channel("loom.migrations.connection_error").publish({ code: "CONNECTION_LOST" }));
  try {
    await client.connect();
    const version = await client.query<{ server_version_num: string }>("SHOW server_version_num");
    if (Math.floor(Number(version.rows[0]?.server_version_num) / 10000) !== 18)
      throw new Error("Loom migrations require PostgreSQL 18");
    await client.query("SET lock_timeout = '5s'");
    await client.query("SET statement_timeout = '60s'");
    await client.query("SET search_path = pg_catalog");
    ownedConnections.add(client);
    return await operation(client);
  } finally {
    ownedConnections.delete(client);
    await client.end();
  }
}
