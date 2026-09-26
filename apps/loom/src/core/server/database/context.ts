import type { AnyRelations } from "drizzle-orm";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

const databaseRelations = new WeakMap<object, AnyRelations>();

export function rememberDatabaseRelations<Relations extends AnyRelations>(
  database: NodePgDatabase<Relations>,
  relations: Relations,
): void {
  databaseRelations.set(database, relations);
}

export function assertDatabaseRelations(database: NodePgDatabase, relations: AnyRelations): void {
  if (databaseRelations.get(database) !== relations)
    throw new Error("Function relations do not match the active database");
}
