import { createHash } from "node:crypto";
import { generateDrizzleJson, generateMigration, inspectSchema } from "drizzle-kit/api-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import type { SchemaDefinition } from "kello/server";
import type { PgTable } from "drizzle-orm/pg-core";
import { pgSchema } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { snapshotValidator } from "./snapshot";
import { databaseIdentifier } from "./connection";
import { alignCheckExpressions } from "./expressions";

export type MigrationSnapshot = Awaited<ReturnType<typeof generateDrizzleJson>>;
export type RenameHint = NonNullable<Parameters<typeof generateMigration>[2]>[number];

export async function inspectSnapshot(database: NodePgDatabase, namespace: string): Promise<MigrationSnapshot> {
  const snapshot = v.parse(snapshotValidator, await inspectSchema(database, [v.parse(databaseIdentifier, namespace)]));
  return { ...snapshot, id: snapshotHash(snapshot), prevIds: [] };
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
  if ("metadata" in schema)
    return createNativeSnapshot({ namespace: schema.metadata.namespace, tables: schema.tables }, previous);
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
