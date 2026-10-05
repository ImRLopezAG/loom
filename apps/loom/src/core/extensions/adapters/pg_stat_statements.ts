import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { booleanCodec, withCodecSqlType } from "../codecs";
import { extensionRows } from "../rows";
import { createSqlFunction } from "../sql";
import {
  statementFields,
  statementInfoFields,
  statementCodec,
  statementInfoCodec,
  statementArrayCodec,
  statementInfoArrayCodec,
} from "./pg_stat_statements-codecs";

/** Shared backend statistics are unobservable by table revisions; automatic live queries must reject them. */
export function createPgStatStatements_1_12<
  const Descriptor extends ExtensionDescriptor<"pg_stat_statements", { version: "1.12"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "pg_stat_statements" ||
    descriptor.version !== "1.12" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== "daba654d231ac86526c1f6feceed3e644d347c25d443b8bb6d2a02f98bdc5eb8"
  )
    throw new Error("pg_stat_statements 1.12 requires its exact verified contract");
  const base = { schema: descriptor.schema, dependencies: [], observability: "external", authority: "query" } as const;
  const statements = createSqlFunction({
    ...base,
    name: "pg_stat_statements",
    member: "routine:$extension:pg_stat_statements.pg_stat_statements(pg_catalog.bool)",
    arguments: [booleanCodec] as const,
    result: statementCodec,
  });
  const info = createSqlFunction({
    ...base,
    name: "pg_stat_statements_info",
    member: "routine:$extension:pg_stat_statements.pg_stat_statements_info()",
    arguments: [] as const,
    result: statementInfoCodec,
  });
  return bindExtension(descriptor, {
    statements,
    info,
    statementRows: (showtext: boolean, alias: string) =>
      extensionRows(statements(showtext), alias, statementFields, "named"),
    infoRows: (alias: string) => extensionRows(info(), alias, statementInfoFields, "named"),
    /** Captured view definitions delegate to these exact calls; shared-state annotations are retained. */
    statementView: (alias: string) => extensionRows(statements(true), alias, statementFields, "named"),
    infoView: (alias: string) => extensionRows(info(), alias, statementInfoFields, "named"),
    codec: withCodecSqlType(statementCodec, { schema: descriptor.schema, name: "pg_stat_statements" }),
    infoCodec: withCodecSqlType(statementInfoCodec, { schema: descriptor.schema, name: "pg_stat_statements_info" }),
    arrayCodec: withCodecSqlType(statementArrayCodec, {
      schema: descriptor.schema,
      name: "pg_stat_statements",
      array: true,
    }),
    infoArrayCodec: withCodecSqlType(statementInfoArrayCodec, {
      schema: descriptor.schema,
      name: "pg_stat_statements_info",
      array: true,
    }),
    sql: Object.freeze({
      functions: Object.freeze({ pg_stat_statements: statements, pg_stat_statements_info: info }),
      operators: Object.freeze({}),
    }),
  });
}
