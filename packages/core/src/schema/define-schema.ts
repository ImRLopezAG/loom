import { compile } from "./compile.js";
import type { CompileOptions } from "./compile.js";
import { fields } from "./fields.js";
import type { EntityDeclaration } from "./table.js";
import { derive } from "../validation/derive.js";

export function defineSchema<const Entities extends Record<string, EntityDeclaration>>(
  define: (builder: typeof fields) => Entities,
  options: CompileOptions = {},
) {
  const entities = define(fields);
  const compiled = compile(entities, options);
  return Object.freeze({ ...compiled, validators: derive(entities, compiled.metadata) });
}
