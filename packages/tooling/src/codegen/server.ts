/** Shared by first-load virtual bindings and the stable authoring entry point. */
export function serverBindings(typed: boolean): string {
  return `import { createFunctionBuilders, createProjectProcedures, createDatabaseMiddleware, createProjectServices } from "@loom/core/server";
export const { procedure, tables, validators } = createProjectProcedures(schema);
export const databaseRead = createDatabaseMiddleware(relations, "read", schema);
export const databaseWrite = createDatabaseMiddleware(relations, "write", schema);
export const { Database, Tables, Validators } = createProjectServices${typed ? "<typeof schema, typeof relations>" : ""}();
export const { query, mutation, action, internalQuery, internalMutation, internalAction } = createFunctionBuilders(relations, schema);
`;
}
