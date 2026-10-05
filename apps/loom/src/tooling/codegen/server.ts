/** Shared by first-load virtual bindings and the stable schema/services entry point. */
export function serverBindings(typed: boolean, extensionModule = "./extensions"): string {
  return `import { createProjectContext, createProjectServices } from "kello/server";
import { extensions } from ${JSON.stringify(extensionModule)};
export { extensions };
export const { tables, validators } = createProjectContext(schema, relations, extensions);
export const { Database, Tables, Validators, Search, Extensions } = createProjectServices${typed ? "<typeof schema, typeof relations, typeof extensions>" : ""}(schema);
`;
}
