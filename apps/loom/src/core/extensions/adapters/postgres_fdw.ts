import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { booleanCodec } from "../codecs";
import { extensionRows } from "../rows";
import { createSqlRows, defaultSqlArgument, statefulSqlMember } from "../sql";
import { postgresFdwConnectionCodec, postgresFdwConnectionFields } from "./postgres_fdw-codecs";

export type { PostgresFdwConnection } from "./postgres_fdw-codecs";
export { postgresFdwConnectionCodec, postgresFdwConnectionFields } from "./postgres_fdw-codecs";

const digest = "39b3195d0b34c96f9e424299e84a599dc7abb6f21bd48eccfcce08f3071db717";
function sessionMember<const Member extends string>(member: Member) {
  // SAFETY: statefulSqlMember returns these two fields unchanged; the generic retains the exact member literal.
  return statefulSqlMember(member, "session") as Readonly<{ member: Member; authority: "session" }>;
}

/** Backend-local FDW connection cache is session state; automatic live queries must reject it. */
export function createPostgresFdw_1_2<
  const Descriptor extends ExtensionDescriptor<"postgres_fdw", { version: "1.2"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "postgres_fdw" ||
    descriptor.version !== "1.2" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("postgres_fdw 1.2 requires its exact verified contract");
  const get_connections = createSqlRows({
    schema: descriptor.schema,
    name: "postgres_fdw_get_connections",
    member: "routine:$extension:postgres_fdw.postgres_fdw_get_connections(pg_catalog.bool)",
    arguments: [defaultSqlArgument(booleanCodec, "check_conn")] as const,
    result: postgresFdwConnectionCodec,
    dependencies: [],
    observability: "session",
    authority: "query",
  });
  return bindExtension(descriptor, {
    foreignDataWrapper: Object.freeze({
      member: "foreign-data wrapper:postgres_fdw",
      name: "postgres_fdw",
      handler: "routine:$extension:postgres_fdw.postgres_fdw_handler()",
      validator: "routine:$extension:postgres_fdw.postgres_fdw_validator(pg_catalog._text,pg_catalog.oid)",
    }),
    connections: (checkConn?: boolean, alias = "fdw_connections") =>
      extensionRows(get_connections(checkConn), alias, postgresFdwConnectionFields, "named"),
    connectionCodec: postgresFdwConnectionCodec,
    disconnect: sessionMember("routine:$extension:postgres_fdw.postgres_fdw_disconnect(pg_catalog.text)"),
    disconnectAll: sessionMember("routine:$extension:postgres_fdw.postgres_fdw_disconnect_all()"),
    handler: Object.freeze({
      member: "routine:$extension:postgres_fdw.postgres_fdw_handler()",
      authority: "schema",
    }),
    validator: Object.freeze({
      member: "routine:$extension:postgres_fdw.postgres_fdw_validator(pg_catalog._text,pg_catalog.oid)",
      authority: "schema",
    }),
    sql: Object.freeze({
      functions: Object.freeze({ postgres_fdw_get_connections: get_connections }),
      operators: Object.freeze({}),
    }),
  });
}
