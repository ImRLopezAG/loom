import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { arrayCodec, booleanCodec, compositeCodec, textCodec } from "../codecs";
import { int4Codec } from "../native-codecs";
import { extensionRows } from "../rows";
import { createSqlRows } from "../sql";
import {
  qualifiedRelationName,
  relationDependency,
  resolveRelationName,
  type RelationInput,
} from "./pgstattuple-codecs";
import { tidCodec, xidCodec } from "./pgrowlocks-codecs";

export type { Tid } from "./pgrowlocks-codecs";
export type { PostgreSqlArray } from "../codecs";
export type { RelationInput, RelationName } from "./pgstattuple-codecs";

const lockFields = {
  locked_row: tidCodec,
  locker: xidCodec,
  multi: booleanCodec,
  xids: arrayCodec(xidCodec),
  modes: arrayCodec(textCodec),
  pids: arrayCodec(int4Codec),
} as const;

/**
 * Row-lock observation reads other sessions' in-progress locks, so it is external and never a live
 * dependency. Executable by PUBLIC but requires SELECT on the table (or pg_stat_scan_tables); row
 * policies are not applied, and results are not a consistent snapshot.
 */
export function createPgrowlocks_1_2<
  const Descriptor extends ExtensionDescriptor<"pgrowlocks", { version: "1.2"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "pgrowlocks" ||
    descriptor.version !== "1.2" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== "d14f05ab2ddaedb3b915bc6cbead50da7c1880dcaf2bf37a1e192d1a4a336f61"
  )
    throw new Error("pgrowlocks 1.2 requires its exact verified contract");
  const lockCodec = compositeCodec("pgrowlocks", lockFields);
  const call = (relation: string, dependencies: readonly string[]) =>
    createSqlRows({
      schema: descriptor.schema,
      name: "pgrowlocks",
      member: "routine:$extension:pgrowlocks.pgrowlocks(pg_catalog.text)",
      arguments: [textCodec] as const,
      result: lockCodec,
      dependencies,
      observability: "external",
      authority: "query",
    })(relation);
  /** Only a text overload exists; relations bind their quoted qualified name, which the C function parses. */
  const pgrowlocks = (relation: RelationInput | string) => {
    if (v.is(v.string(), relation)) return call(relation, []);
    const resolved = resolveRelationName(relation);
    return call(qualifiedRelationName(resolved), [relationDependency(resolved)]);
  };
  return bindExtension(descriptor, {
    /** Typed FROM rows; one row per locked tuple. */
    rows: (relation: RelationInput, alias = "row_locks") =>
      extensionRows(pgrowlocks(relation), alias, lockFields, "named"),
    lockCodec,
    sql: Object.freeze({ functions: Object.freeze({ pgrowlocks }), operators: Object.freeze({}) }),
  });
}
