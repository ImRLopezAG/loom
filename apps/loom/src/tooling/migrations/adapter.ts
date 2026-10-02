import { createHash } from "node:crypto";
import { generateDrizzleJson, generateMigration, inspectSchema } from "drizzle-kit/api-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { SchemaDefinition } from "loom/server";
import type { PgTable } from "drizzle-orm/pg-core";
import { pgSchema, getTableConfig } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import * as v from "valibot";
import { snapshotValidator } from "./snapshot";
import { databaseIdentifier } from "./connection";
import { alignCheckExpressions } from "./expressions";
import { extensionSnapshotExclusions } from "./extension-membership";
import { extensionFieldSqlType } from "../../core/extensions/fields";
import { arrayCodec, textCodec } from "../../core/extensions/codecs";

export type MigrationSnapshot = Awaited<ReturnType<typeof generateDrizzleJson>>;
export type RenameHint = NonNullable<Parameters<typeof generateMigration>[2]>[number];

export async function inspectSnapshot(database: NodePgDatabase, namespace: string): Promise<MigrationSnapshot> {
  const exclusions = await database.execute(sql.raw(extensionSnapshotExclusions));
  const members = v.parse(
    v.array(
      v.strictObject({
        entityType: v.picklist([
          "tables",
          "views",
          "sequences",
          "indexes",
          "columns",
          "pks",
          "fks",
          "uniques",
          "checks",
          "enums",
          "policies",
        ]),
        schema: v.string(),
        name: v.string(),
        table: v.nullable(v.string()),
      }),
    ),
    exclusions.rows,
  );
  const inspected = v.parse(
    snapshotValidator,
    await inspectSchema(database, [v.parse(databaseIdentifier, namespace)], members),
  );
  const types = await database.execute(sql`
    SELECT c.relname AS table, a.attname AS column, tn.nspname AS namespace, t.typname AS name,
      t.typtype AS kind, t.typdelim AS delimiter, a.attndims AS dimensions,
      pg_catalog.format_type(t.oid, a.atttypmod) AS formatted,
      pg_catalog.format_type(t.oid, -1) AS nominal
    FROM pg_catalog.pg_attribute a
    JOIN pg_catalog.pg_class c ON c.oid=a.attrelid
    JOIN pg_catalog.pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_catalog.pg_type original ON original.oid=a.atttypid
    JOIN pg_catalog.pg_type t ON t.oid=CASE WHEN original.typcategory='A' THEN original.typelem ELSE original.oid END
    JOIN pg_catalog.pg_namespace tn ON tn.oid=t.typnamespace
    WHERE n.nspname=${namespace} AND a.attnum>0 AND NOT a.attisdropped
      AND tn.nspname<>'pg_catalog' AND t.typtype<>'e'
  `);
  const columnTypes = v.parse(
    v.array(
      v.object({
        table: v.string(),
        column: v.string(),
        namespace: v.string(),
        name: v.string(),
        kind: v.string(),
        delimiter: v.string(),
        dimensions: v.number(),
        formatted: v.string(),
        nominal: v.string(),
      }),
    ),
    types.rows,
  );
  const classes = await database.execute(sql`
    SELECT idx.relname AS index, cls.opcname AS name, ns.nspname AS namespace, pos.ordinality::integer AS position
    FROM pg_catalog.pg_index i
    JOIN pg_catalog.pg_class idx ON idx.oid=i.indexrelid
    JOIN pg_catalog.pg_namespace owner ON owner.oid=idx.relnamespace
    CROSS JOIN LATERAL pg_catalog.unnest(i.indclass) WITH ORDINALITY AS pos(oid, ordinality)
    JOIN pg_catalog.pg_opclass cls ON cls.oid=pos.oid
    JOIN pg_catalog.pg_namespace ns ON ns.oid=cls.opcnamespace
    WHERE owner.nspname=${namespace} AND ns.nspname<>'pg_catalog'
  `);
  const opclasses = v.parse(
    v.array(v.object({ index: v.string(), name: v.string(), namespace: v.string(), position: v.number() })),
    classes.rows,
  );
  const typesByColumn = new Map<string, (typeof columnTypes)[number]>();
  for (const type of columnTypes) {
    const key = JSON.stringify([type.table, type.column]);
    if (!typesByColumn.has(key)) typesByColumn.set(key, type);
  }
  const classesByPosition = new Map<string, (typeof opclasses)[number]>();
  for (const opclass of opclasses) {
    const key = JSON.stringify([opclass.index, opclass.position]);
    if (!classesByPosition.has(key)) classesByPosition.set(key, opclass);
  }
  const snapshot = {
    ...inspected,
    ddl: inspected.ddl.map((entity) => {
      if (entity.entityType === "columns") {
        const type = typesByColumn.get(JSON.stringify([entity.table, entity.name]));
        if (!type) return entity;
        if (!type.formatted.startsWith(type.nominal))
          throw new Error(`Cannot normalize PostgreSQL type modifier: ${entity.table}.${entity.name}`);
        const modifiers = type.formatted.slice(type.nominal.length);
        const literal =
          type.dimensions && entity.default && /^'(?:[^']|'')*'$/.test(entity.default)
            ? entity.default.slice(1, -1).replaceAll("''", "'")
            : undefined;
        const arrays = literal !== undefined ? arrayCodec(textCodec, type.delimiter) : undefined;
        const defaultValue =
          arrays && literal !== undefined
            ? `'${v.parse(v.string(), arrays.encode(arrays.decode(literal))).replaceAll("'", "''")}'`
            : entity.default;
        return {
          ...entity,
          type: `${quoted(type.namespace)}.${quoted(type.name)}${modifiers}`,
          typeSchema: null,
          dimensions: type.dimensions,
          default: defaultValue,
        };
      }
      if (entity.entityType === "indexes")
        return {
          ...entity,
          columns: entity.columns.map((column, position) => {
            const opclass = classesByPosition.get(JSON.stringify([entity.name, position + 1]));
            return opclass && column.opclass
              ? {
                  ...column,
                  opclass: { ...column.opclass, name: `${quoted(opclass.namespace)}.${quoted(opclass.name)}` },
                }
              : column;
          }),
        };
      return entity;
    }),
  };
  return { ...snapshot, id: snapshotHash(snapshot), prevIds: [] };
}
function quoted(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

/** Identity excludes Drizzle's random snapshot ID and lineage. */
export function snapshotHash(snapshot: MigrationSnapshot): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        version: snapshot.version,
        dialect: snapshot.dialect,
        ddl: v
          .parse(snapshotValidator, snapshot)
          .ddl.map((entity) => JSON.stringify(entity))
          .sort(),
      }),
    )
    .digest("hex");
}

export async function createSnapshot(
  schema: SchemaDefinition | NativeMigrationSchema,
  previous?: MigrationSnapshot,
): Promise<MigrationSnapshot> {
  if ("metadata" in schema) {
    const snapshot = await createNativeSnapshot(
      { namespace: schema.metadata.namespace, tables: schema.tables },
      previous,
    );
    const defaultClasses = new Set(
      schema.metadata.entities.flatMap((entity) => {
        const table = schema.tables[entity.name];
        if (!table) throw new Error(`Missing migration table: ${entity.name}`);
        const indexes = getTableConfig(table).indexes;
        return (entity.options.indexes ?? []).flatMap((index, position) =>
          index.extension?.default && indexes[position] ? [indexes[position].config.name] : [],
        );
      }),
    );
    const ddl = snapshot.ddl.map((original) => {
      const entity =
        schema.metadata.extensionRequirements?.length && "nameExplicit" in original
          ? { ...original, nameExplicit: true }
          : original;
      // The pinned inspector represents PostgreSQL's default class as NULL; its explicit registry identity stays in schema metadata.
      if (entity.entityType === "indexes" && defaultClasses.has(entity.name))
        return { ...entity, columns: entity.columns.map((column) => ({ ...column, opclass: null })) };
      if (entity.entityType !== "columns") return entity;
      const field = schema.metadata.entities
        .find((table) => table.sqlName === entity.table)
        ?.fields.find((field) => field.sqlName === entity.name)?.extension;
      return field
        ? {
            ...entity,
            type: extensionFieldSqlType({ ...field, array: false }),
            typeSchema: null,
            dimensions: field.array ? 1 : 0,
          }
        : entity;
    });
    return { ...snapshot, ddl, id: snapshotHash({ ...snapshot, ddl }) };
  }
  const current = await createNativeSnapshot(schema, previous);
  return schema.retainRemoved && previous ? retainAuthSnapshot(previous, current) : current;
}

export interface NativeMigrationSchema {
  readonly namespace: string;
  readonly tables: Readonly<Record<string, PgTable>>;
  readonly retainRemoved?: boolean;
}

function entityIdentity(entity: MigrationSnapshot["ddl"][number]): string {
  return JSON.stringify([
    entity.entityType,
    "schema" in entity ? entity.schema : null,
    "table" in entity ? entity.table : null,
    entity.name,
  ]);
}

/** Auth removal retires capabilities. Retained data is removed only by reviewed cleanup. */
function retainAuthSnapshot(previous: MigrationSnapshot, current: MigrationSnapshot): MigrationSnapshot {
  const identities = new Set(current.ddl.map(entityIdentity));
  const tables = new Set(
    current.ddl
      .filter((entity) => entity.entityType === "tables")
      .map((entity) => JSON.stringify([entity.schema, entity.name])),
  );
  const retained = previous.ddl.filter((entity) => !identities.has(entityIdentity(entity)));
  for (const entity of retained) {
    if (
      entity.entityType === "columns" &&
      entity.notNull &&
      entity.default === null &&
      tables.has(JSON.stringify([entity.schema, entity.table]))
    )
      throw new Error(
        `Auth activation cannot write retained required column ${entity.table}.${entity.name}; apply a reviewed compatible migration first`,
      );
  }
  const snapshot = { ...current, ddl: [...current.ddl, ...retained] };
  return { ...snapshot, id: snapshotHash(snapshot) };
}

export async function createNativeSnapshot(
  schema: NativeMigrationSchema,
  previous?: MigrationSnapshot,
): Promise<MigrationSnapshot> {
  const namespace = v.parse(databaseIdentifier, schema.namespace);
  const imports =
    namespace === "public" ? { ...schema.tables } : { ...schema.tables, __loomNamespace: pgSchema(namespace) };
  const snapshot = await generateDrizzleJson(imports, previous?.id, [namespace]);
  // Drizzle accepts string identities. A structural identity makes committed artifacts reproducible.
  return { ...snapshot, id: snapshotHash(snapshot), prevIds: previous ? [previous.id] : [] };
}

export async function emptySnapshot(namespace: string): Promise<MigrationSnapshot> {
  const snapshot = await generateDrizzleJson({}, undefined, [namespace]);
  return { ...snapshot, id: snapshotHash(snapshot), prevIds: [] };
}

export async function migrationStatements(
  before: MigrationSnapshot,
  after: MigrationSnapshot,
  renames: readonly RenameHint[] = [],
): Promise<readonly string[]> {
  return generateMigration(await alignCheckExpressions(before, after), after, [...renames]);
}
