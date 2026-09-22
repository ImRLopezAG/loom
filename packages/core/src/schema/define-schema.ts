import { compile } from "./compile";
import type { CompileOptions } from "./compile";
import { fields } from "./fields";
import type { EntityDeclaration } from "./table";
import { derive } from "../validation/derive";
import type { PgTable } from "drizzle-orm/pg-core";
import type { SchemaMetadata } from "./compile";

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
