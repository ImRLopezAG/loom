// Example of the server bindings written by `loom generate`.
import { createProjectProcedures, createDatabaseMiddleware, createProjectServices } from "@loom/core/server";
import relations from "../relations";
import schema from "../schema";

export const { procedure, tables, validators } = createProjectProcedures(schema);
export const databaseRead = createDatabaseMiddleware(relations, "read", schema);
export const databaseWrite = createDatabaseMiddleware(relations, "write", schema);
export const { Database, Tables, Validators } = createProjectServices<typeof schema, typeof relations>();
