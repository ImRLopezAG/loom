import * as v from "valibot";
import { is } from "drizzle-orm";
import { PgTable, getTableConfig } from "drizzle-orm/pg-core";
import { createExtensionCodec } from "../codecs";

const identifier = v.pipe(
  v.string(),
  v.minLength(1),
  v.check((value) => !value.includes("\0"), "Invalid PostgreSQL identifier"),
);
const relationName = v.strictObject({ schema: identifier, name: identifier });
export type RelationName = v.InferOutput<typeof relationName>;
/** A Drizzle table, or an explicit index/relation name; never an unqualified search_path lookup. */
export type RelationInput = PgTable | RelationName;

const quote = (value: string) => `"${value.replaceAll('"', '""')}"`;
export const qualifiedRelationName = (value: RelationName) => `${quote(value.schema)}.${quote(value.name)}`;
/** Configured and relocated namespaces stay quoted in the bound value; regclass parsing honors quotes. */
export const relationCodec = createExtensionCodec({
  id: "pg:regclass:qualified-name:1",
  sqlType: { schema: "pg_catalog", name: "regclass" },
  input: relationName,
  output: v.string(),
  transport: "text",
  encode: (value) => qualifiedRelationName(value),
  decode: (value) => value,
});

export function resolveRelationName(relation: RelationInput): RelationName {
  if (!is(relation, PgTable)) return v.parse(relationName, relation);
  const config = getTableConfig(relation);
  return { schema: config.schema ?? "public", name: config.name };
}
/** Physical `schema.name`, matching Loom's table dependency identity. */
export const relationDependency = (relation: RelationName) => `${relation.schema}.${relation.name}`;
