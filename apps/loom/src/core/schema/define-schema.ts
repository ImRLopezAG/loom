import { compile } from "./compile";
import type { CompileOptions, NativeTables } from "./compile";
import { createHash } from "node:crypto";
import { extensionTriggerContract, extensionTriggerIdentity } from "../extensions/triggers";
import type { ExtensionTriggerDeclaration } from "../extensions/triggers";
import { getTableConfig } from "drizzle-orm/pg-core";
import { fields } from "./fields";
import type { EntityDeclaration } from "./table";
import { derive } from "../validation/derive";
import type { PgTable } from "drizzle-orm/pg-core";
import type { SchemaMetadata } from "./compile";
import * as v from "valibot";
import type { Id } from "./fields";

export interface SchemaDefinition {
  readonly tables: Readonly<Record<string, PgTable>>;
  readonly metadata: SchemaMetadata;
  readonly fingerprint: string;
}
const compiledSchemas = new WeakSet<object>();
const schemaBindings = new WeakMap<SchemaDefinition, (namespace: string) => SchemaDefinition>();

export interface SchemaOptions<Entities extends Record<string, EntityDeclaration>> extends CompileOptions {
  readonly triggers?: (tables: NativeTables<Entities>) => readonly ExtensionTriggerDeclaration[];
}

/** Recompile declarations; never mutate shared native Drizzle tables. */
export function bindSchemaNamespace(schema: SchemaDefinition, namespace: string): SchemaDefinition {
  const bind = schemaBindings.get(schema);
  if (!bind) throw new Error("Expected a Kello schema declaration");
  return bind(namespace);
}

export function isKelloSchema(value: unknown): value is SchemaDefinition {
  return value instanceof Object && compiledSchemas.has(value);
}

export function defineSchema<const Entities extends Record<string, EntityDeclaration>>(
  define: (builder: typeof fields) => Entities,
  options: SchemaOptions<Entities> = {},
) {
  const entities = define(fields);
  const compiled = compile(entities, options);
  const triggers = (options.triggers?.(compiled.tables) ?? []).map(extensionTriggerContract);
  if (triggers.length) {
    const identities = new Set<string>();
    const ownedTables = new Set(
      Object.values(compiled.tables).map((table) => {
        const { schema, name } = getTableConfig(table);
        return JSON.stringify([schema ?? "public", name]);
      }),
    );
    for (const trigger of triggers) {
      if (!ownedTables.has(JSON.stringify([trigger.table.schema, trigger.table.name])))
        throw new Error(`Extension trigger targets a table outside this schema: ${trigger.name}`);
      const identity = extensionTriggerIdentity(trigger);
      if (identities.has(identity)) throw new Error(`Duplicate extension trigger: ${trigger.name}`);
      identities.add(identity);
    }
  }
  triggers.sort((a, b) => extensionTriggerIdentity(a).localeCompare(extensionTriggerIdentity(b)));
  const metadata: SchemaMetadata = triggers.length
    ? Object.freeze({
        ...compiled.metadata,
        extensionTriggers: Object.freeze(triggers),
        extensionRequirements: Object.freeze(
          [
            ...new Map([
              ...(compiled.metadata.extensionRequirements ?? []).map(
                (entry) => [JSON.stringify(entry), entry] as const,
              ),
              ...triggers.map((trigger) => {
                const requirement = Object.freeze({
                  ...trigger.extension,
                  schema: trigger.function.schema,
                  member: trigger.member,
                });
                return [JSON.stringify(requirement), requirement] as const;
              }),
            ]).values(),
          ].sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
        ),
      })
    : compiled.metadata;
  function id<const Name extends Extract<keyof Entities, string>>(table: Name) {
    if (!Object.hasOwn(entities, table)) throw new Error("Unknown ID table");
    return v.pipe(
      v.string(),
      v.uuid(),
      v.transform((value): Id<Name> => {
        // SAFETY: UUID syntax is checked above; table branding is static and does not assert row existence.
        return value as Id<Name>;
      }),
    );
  }
  const schema = Object.freeze({
    ...compiled,
    metadata,
    fingerprint: triggers.length
      ? createHash("sha256").update(JSON.stringify(metadata)).digest("hex")
      : compiled.fingerprint,
    validators: derive(entities, metadata),
    id,
  });
  compiledSchemas.add(schema);
  schemaBindings.set(schema, (namespace) => defineSchema(() => entities, { ...options, namespace }));
  return schema;
}
