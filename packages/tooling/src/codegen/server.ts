/** Shared by first-load virtual bindings and the stable schema/services entry point. */
export function serverBindings(typed: boolean): string {
  return `import { createProjectContext, createProjectServices } from "@loom/core/server";
export const { tables, validators } = createProjectContext(schema);
export const { Database, Tables, Validators } = createProjectServices${typed ? "<typeof schema, typeof relations>" : ""}();
`;
}
