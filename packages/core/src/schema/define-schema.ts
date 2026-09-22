import { compile } from "./compile.js";
import type { CompileOptions } from "./compile.js";
import { fields } from "./fields.js";
import type { EntityDeclaration } from "./table.js";

export function defineSchema<const Entities extends Record<string, EntityDeclaration>>(
  define: (builder: typeof fields) => Entities,
  options: CompileOptions = {},
) {
  return compile(define(fields), options);
}
