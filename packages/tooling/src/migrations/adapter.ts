import { createHash } from "node:crypto";
import { generateDrizzleJson, generateMigration } from "drizzle-kit/api-postgres";
import type { SchemaDefinition } from "@loom/core/server";
import { pgSchema } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { snapshotValidator } from "./snapshot";

export type MigrationSnapshot = Awaited<ReturnType<typeof generateDrizzleJson>>;
export type RenameHint = NonNullable<Parameters<typeof generateMigration>[2]>[number];

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
  schema: SchemaDefinition,
  previous?: MigrationSnapshot,
): Promise<MigrationSnapshot> {
  const namespace = schema.metadata.namespace;
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
  return generateMigration(before, after, [...renames]);
}
