import { compile } from "./compile.js";
import type { CompileOptions } from "./compile.js";
import { fields } from "./fields.js";
import type { EntityDeclaration } from "./table.js";
import { derive } from "../validation/derive.js";
import type { PgTable } from "drizzle-orm/pg-core";
import type { SchemaMetadata } from "./compile.js";

export interface SchemaDefinition {
  readonly tables: Readonly<Record<string, PgTable>>;
  readonly metadata: SchemaMetadata;
  readonly fingerprint: string;
}
const compiledSchemas = new WeakSet<object>();

export function isLoomSchema(value: unknown): value is SchemaDefinition {
  return value instanceof Object && compiledSchemas.has(value);
}

export function defineSchema<const Entities extends Record<string, EntityDeclaration>>(
  define: (builder: typeof fields) => Entities,
  options: CompileOptions = {},
) {
  const entities = define(fields);
  const compiled = compile(entities, options);
  const schema = Object.freeze({ ...compiled, validators: derive(entities, compiled.metadata) });
  compiledSchemas.add(schema);
  return schema;
}
