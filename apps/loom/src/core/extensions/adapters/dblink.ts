import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { nullableCodec, textCodec, withCodecSqlType } from "../codecs";
import { createExtensionField } from "../fields";
import { extensionRows } from "../rows";
import { createSqlFunction, createSqlRows, statefulSqlMember } from "../sql";
import type { ExtensionValueSchema } from "../values";
import {
  dblinkInt2vectorCodec,
  dblinkPkeyArrayCodec,
  dblinkPkeyCodec,
  dblinkPkeyFields,
  dblinkTextArrayCodec,
  qualifiedRelationName,
  relationDependency,
  resolveRelationName,
  type RelationInput,
} from "./dblink-codecs";

export type { DblinkNotify, DblinkPkeyResult, RelationInput, RelationName } from "./dblink-codecs";
export {
  dblinkInt2vectorCodec,
  dblinkNotifyCodec,
  dblinkNotifyFields,
  dblinkPkeyArrayCodec,
  dblinkPkeyCodec,
  dblinkPkeyFields,
  dblinkTextArrayCodec,
} from "./dblink-codecs";

const digest = "b713a9ca7a0e00853d0346b44e021c8c48372b5164b4b3f533c2b5022e37eba6";
const nullableText = { kind: "union", variants: [{ kind: "string" }, { kind: "null" }] } as const;
const pkeyValue = {
  kind: "object",
  properties: {
    position: { kind: "union", variants: [{ kind: "number", integer: true }, { kind: "null" }] },
    colname: nullableText,
  },
} as const;
function arrayValue(element: ExtensionValueSchema): ExtensionValueSchema {
  let nested: ExtensionValueSchema = { kind: "union", variants: [element, { kind: "null" }] };
  const ranks: ExtensionValueSchema[] = [];
  for (let rank = 0; rank < 6; rank++) {
    nested = { kind: "array", items: nested };
    ranks.push(nested);
  }
  return {
    kind: "object",
    properties: {
      dimensions: {
        kind: "array",
        items: {
          kind: "object",
          properties: {
            lowerBound: { kind: "number", integer: true },
            length: { kind: "number", integer: true, minimum: 0 },
          },
        },
      },
      values: { kind: "union", variants: ranks },
    },
  };
}

function sessionMember<const Member extends string>(member: Member) {
  // SAFETY: statefulSqlMember returns these two fields unchanged; the generic retains the exact member literal.
  return statefulSqlMember(member, "session") as Readonly<{ member: Member; authority: "session" }>;
}

const member = {
  getConnections: "routine:$extension:dblink.dblink_get_connections()",
  currentQuery: "routine:$extension:dblink.dblink_current_query()",
  getPkey: "routine:$extension:dblink.dblink_get_pkey(pg_catalog.text)",
  buildInsert:
    "routine:$extension:dblink.dblink_build_sql_insert(pg_catalog.text,pg_catalog.int2vector,pg_catalog.int4,pg_catalog._text,pg_catalog._text)",
  buildUpdate:
    "routine:$extension:dblink.dblink_build_sql_update(pg_catalog.text,pg_catalog.int2vector,pg_catalog.int4,pg_catalog._text,pg_catalog._text)",
  buildDelete:
    "routine:$extension:dblink.dblink_build_sql_delete(pg_catalog.text,pg_catalog.int2vector,pg_catalog.int4,pg_catalog._text)",
  connectNamed: "routine:$extension:dblink.dblink_connect(pg_catalog.text,pg_catalog.text)",
  connectUnnamed: "routine:$extension:dblink.dblink_connect(pg_catalog.text)",
  connectUNamed: "routine:$extension:dblink.dblink_connect_u(pg_catalog.text,pg_catalog.text)",
  connectUUnnamed: "routine:$extension:dblink.dblink_connect_u(pg_catalog.text)",
  disconnectNamed: "routine:$extension:dblink.dblink_disconnect(pg_catalog.text)",
  disconnectUnnamed: "routine:$extension:dblink.dblink_disconnect()",
  execUnnamed: "routine:$extension:dblink.dblink_exec(pg_catalog.text)",
  execUnnamedFail: "routine:$extension:dblink.dblink_exec(pg_catalog.text,pg_catalog.bool)",
  execNamed: "routine:$extension:dblink.dblink_exec(pg_catalog.text,pg_catalog.text)",
  execNamedFail: "routine:$extension:dblink.dblink_exec(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
  queryUnnamed: "routine:$extension:dblink.dblink(pg_catalog.text)",
  queryUnnamedFail: "routine:$extension:dblink.dblink(pg_catalog.text,pg_catalog.bool)",
  queryNamed: "routine:$extension:dblink.dblink(pg_catalog.text,pg_catalog.text)",
  queryNamedFail: "routine:$extension:dblink.dblink(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
  openUnnamed: "routine:$extension:dblink.dblink_open(pg_catalog.text,pg_catalog.text)",
  openUnnamedFail: "routine:$extension:dblink.dblink_open(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
  openNamed: "routine:$extension:dblink.dblink_open(pg_catalog.text,pg_catalog.text,pg_catalog.text)",
  openNamedFail: "routine:$extension:dblink.dblink_open(pg_catalog.text,pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
  fetchUnnamed: "routine:$extension:dblink.dblink_fetch(pg_catalog.text,pg_catalog.int4)",
  fetchUnnamedFail: "routine:$extension:dblink.dblink_fetch(pg_catalog.text,pg_catalog.int4,pg_catalog.bool)",
  fetchNamed: "routine:$extension:dblink.dblink_fetch(pg_catalog.text,pg_catalog.text,pg_catalog.int4)",
  fetchNamedFail: "routine:$extension:dblink.dblink_fetch(pg_catalog.text,pg_catalog.text,pg_catalog.int4,pg_catalog.bool)",
  closeUnnamed: "routine:$extension:dblink.dblink_close(pg_catalog.text)",
  closeUnnamedFail: "routine:$extension:dblink.dblink_close(pg_catalog.text,pg_catalog.bool)",
  closeNamed: "routine:$extension:dblink.dblink_close(pg_catalog.text,pg_catalog.text)",
  closeNamedFail: "routine:$extension:dblink.dblink_close(pg_catalog.text,pg_catalog.text,pg_catalog.bool)",
  sendQuery: "routine:$extension:dblink.dblink_send_query(pg_catalog.text,pg_catalog.text)",
  getResult: "routine:$extension:dblink.dblink_get_result(pg_catalog.text)",
  getResultFail: "routine:$extension:dblink.dblink_get_result(pg_catalog.text,pg_catalog.bool)",
  isBusy: "routine:$extension:dblink.dblink_is_busy(pg_catalog.text)",
  cancel: "routine:$extension:dblink.dblink_cancel_query(pg_catalog.text)",
  errorMessage: "routine:$extension:dblink.dblink_error_message(pg_catalog.text)",
  notifyUnnamed: "routine:$extension:dblink.dblink_get_notify()",
  notifyNamed: "routine:$extension:dblink.dblink_get_notify(pg_catalog.text)",
  validator: "routine:$extension:dblink.dblink_fdw_validator(pg_catalog._text,pg_catalog.oid)",
} as const;

/** Session-owned remote I/O stays out of ordinary RPC; local PK/SQL helpers remain query expressions. */
export function createDblink_1_2<
  const Descriptor extends ExtensionDescriptor<"dblink", { version: "1.2"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "dblink" ||
    descriptor.version !== "1.2" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("dblink 1.2 requires its exact verified contract");
  const type = { schema: descriptor.schema, name: "dblink_pkey_results" } as const;
  const codec = withCodecSqlType(dblinkPkeyCodec, type);
  const arrays = withCodecSqlType(dblinkPkeyArrayCodec, { ...type, array: true });
  const search = { filter: false, comparison: false, order: false, text: false } as const;
  const session = { schema: descriptor.schema, dependencies: [], observability: "session", authority: "query" } as const;
  const texts = nullableCodec(dblinkTextArrayCodec);
  const get_connections = createSqlFunction({
    ...session,
    name: "dblink_get_connections",
    member: member.getConnections,
    arguments: [] as const,
    result: texts,
  });
  const current_query = createSqlFunction({
    ...session,
    name: "dblink_current_query",
    member: member.currentQuery,
    arguments: [] as const,
    result: nullableCodec(textCodec),
  });
  const relationText = (relation: RelationInput | string) => {
    if (v.is(v.string(), relation)) return { name: relation, dependencies: [] as const };
    const resolved = resolveRelationName(relation);
    return { name: qualifiedRelationName(resolved), dependencies: [relationDependency(resolved)] };
  };
  const get_pkey = (relation: RelationInput | string) => {
    const resolved = relationText(relation);
    return createSqlRows({
      schema: descriptor.schema,
      name: "dblink_get_pkey",
      member: member.getPkey,
      arguments: [textCodec] as const,
      result: codec,
      dependencies: resolved.dependencies,
      observability: "tables",
      authority: "query",
    })(resolved.name);
  };
  const build = (
    name: "dblink_build_sql_insert" | "dblink_build_sql_update" | "dblink_build_sql_delete",
    identity: (typeof member)["buildInsert" | "buildUpdate" | "buildDelete"],
    values: readonly unknown[],
    relation: RelationInput | string,
  ) => {
    const resolved = relationText(relation);
    const base = {
      schema: descriptor.schema,
      name,
      member: identity,
      result: nullableCodec(textCodec),
      dependencies: resolved.dependencies,
      observability: "tables" as const,
      authority: "query" as const,
    };
    if (name === "dblink_build_sql_delete")
      return createSqlFunction({
        ...base,
        arguments: [textCodec, dblinkInt2vectorCodec, nullableCodec(dblinkPkeyFields.position), texts] as const,
      })(resolved.name, values[0] as never, values[1] as never, values[2] as never);
    return createSqlFunction({
      ...base,
      arguments: [textCodec, dblinkInt2vectorCodec, nullableCodec(dblinkPkeyFields.position), texts, texts] as const,
    })(resolved.name, values[0] as never, values[1] as never, values[2] as never, values[3] as never);
  };
  return bindExtension(descriptor, {
    foreignDataWrapper: Object.freeze({
      member: "foreign-data wrapper:dblink_fdw",
      name: "dblink_fdw",
      handler: null,
      validator: member.validator,
    }),
    connections: () => get_connections(),
    currentQuery: () => current_query(),
    getPkey: get_pkey,
    pkeyRows: (relation: RelationInput | string, alias = "dblink_pkey") =>
      extensionRows(get_pkey(relation), alias, dblinkPkeyFields, "named"),
    buildSqlInsert: (
      relation: RelationInput | string,
      pkAttnums: string,
      pkCount: number | null,
      srcPk: Parameters<typeof dblinkTextArrayCodec.encode>[0] | null,
      tgtPk: Parameters<typeof dblinkTextArrayCodec.encode>[0] | null,
    ) => build("dblink_build_sql_insert", member.buildInsert, [pkAttnums, pkCount, srcPk, tgtPk], relation),
    buildSqlUpdate: (
      relation: RelationInput | string,
      pkAttnums: string,
      pkCount: number | null,
      srcPk: Parameters<typeof dblinkTextArrayCodec.encode>[0] | null,
      tgtPk: Parameters<typeof dblinkTextArrayCodec.encode>[0] | null,
    ) => build("dblink_build_sql_update", member.buildUpdate, [pkAttnums, pkCount, srcPk, tgtPk], relation),
    buildSqlDelete: (
      relation: RelationInput | string,
      pkAttnums: string,
      pkCount: number | null,
      tgtPk: Parameters<typeof dblinkTextArrayCodec.encode>[0] | null,
    ) => build("dblink_build_sql_delete", member.buildDelete, [pkAttnums, pkCount, tgtPk], relation),
    pkeyCodec: codec,
    pkeyArrayCodec: arrays,
    field: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:dblink.dblink_pkey_results",
        type: "dblink_pkey_results",
        codec,
        value: pkeyValue,
        search,
      }),
    arrayField: () =>
      createExtensionField({
        extension: descriptor,
        member: "type:$extension:dblink._dblink_pkey_results",
        type: "dblink_pkey_results",
        array: true,
        codec: arrays,
        value: arrayValue(pkeyValue),
        search,
      }),
    connect: sessionMember(member.connectNamed),
    connectUnnamed: sessionMember(member.connectUnnamed),
    connectU: sessionMember(member.connectUNamed),
    connectUUnnamed: sessionMember(member.connectUUnnamed),
    disconnect: sessionMember(member.disconnectNamed),
    disconnectUnnamed: sessionMember(member.disconnectUnnamed),
    exec: sessionMember(member.execNamed),
    query: sessionMember(member.queryNamed),
    open: sessionMember(member.openNamed),
    fetch: sessionMember(member.fetchNamed),
    close: sessionMember(member.closeNamed),
    sendQuery: sessionMember(member.sendQuery),
    getResult: sessionMember(member.getResult),
    isBusy: sessionMember(member.isBusy),
    cancelQuery: sessionMember(member.cancel),
    errorMessage: sessionMember(member.errorMessage),
    getNotify: sessionMember(member.notifyNamed),
    validator: Object.freeze({ member: member.validator, authority: "internal" as const }),
    sql: Object.freeze({
      functions: Object.freeze({
        dblink_get_connections: get_connections,
        dblink_current_query: current_query,
        dblink_get_pkey: get_pkey,
        dblink_build_sql_insert: (
          relation: RelationInput | string,
          pkAttnums: string,
          pkCount: number | null,
          srcPk: Parameters<typeof dblinkTextArrayCodec.encode>[0] | null,
          tgtPk: Parameters<typeof dblinkTextArrayCodec.encode>[0] | null,
        ) => build("dblink_build_sql_insert", member.buildInsert, [pkAttnums, pkCount, srcPk, tgtPk], relation),
        dblink_build_sql_update: (
          relation: RelationInput | string,
          pkAttnums: string,
          pkCount: number | null,
          srcPk: Parameters<typeof dblinkTextArrayCodec.encode>[0] | null,
          tgtPk: Parameters<typeof dblinkTextArrayCodec.encode>[0] | null,
        ) => build("dblink_build_sql_update", member.buildUpdate, [pkAttnums, pkCount, srcPk, tgtPk], relation),
        dblink_build_sql_delete: (
          relation: RelationInput | string,
          pkAttnums: string,
          pkCount: number | null,
          tgtPk: Parameters<typeof dblinkTextArrayCodec.encode>[0] | null,
        ) => build("dblink_build_sql_delete", member.buildDelete, [pkAttnums, pkCount, tgtPk], relation),
      }),
      operators: Object.freeze({}),
      overloads: Object.freeze({
        [member.getConnections]: get_connections,
        [member.currentQuery]: current_query,
        [member.getPkey]: get_pkey,
        [member.buildInsert]: (
          relation: RelationInput | string,
          pkAttnums: string,
          pkCount: number | null,
          srcPk: Parameters<typeof dblinkTextArrayCodec.encode>[0] | null,
          tgtPk: Parameters<typeof dblinkTextArrayCodec.encode>[0] | null,
        ) => build("dblink_build_sql_insert", member.buildInsert, [pkAttnums, pkCount, srcPk, tgtPk], relation),
        [member.buildUpdate]: (
          relation: RelationInput | string,
          pkAttnums: string,
          pkCount: number | null,
          srcPk: Parameters<typeof dblinkTextArrayCodec.encode>[0] | null,
          tgtPk: Parameters<typeof dblinkTextArrayCodec.encode>[0] | null,
        ) => build("dblink_build_sql_update", member.buildUpdate, [pkAttnums, pkCount, srcPk, tgtPk], relation),
        [member.buildDelete]: (
          relation: RelationInput | string,
          pkAttnums: string,
          pkCount: number | null,
          tgtPk: Parameters<typeof dblinkTextArrayCodec.encode>[0] | null,
        ) => build("dblink_build_sql_delete", member.buildDelete, [pkAttnums, pkCount, tgtPk], relation),
        [member.connectNamed]: sessionMember(member.connectNamed),
        [member.connectUnnamed]: sessionMember(member.connectUnnamed),
        [member.connectUNamed]: sessionMember(member.connectUNamed),
        [member.connectUUnnamed]: sessionMember(member.connectUUnnamed),
        [member.disconnectNamed]: sessionMember(member.disconnectNamed),
        [member.disconnectUnnamed]: sessionMember(member.disconnectUnnamed),
        [member.execUnnamed]: sessionMember(member.execUnnamed),
        [member.execUnnamedFail]: sessionMember(member.execUnnamedFail),
        [member.execNamed]: sessionMember(member.execNamed),
        [member.execNamedFail]: sessionMember(member.execNamedFail),
        [member.queryUnnamed]: sessionMember(member.queryUnnamed),
        [member.queryUnnamedFail]: sessionMember(member.queryUnnamedFail),
        [member.queryNamed]: sessionMember(member.queryNamed),
        [member.queryNamedFail]: sessionMember(member.queryNamedFail),
        [member.openUnnamed]: sessionMember(member.openUnnamed),
        [member.openUnnamedFail]: sessionMember(member.openUnnamedFail),
        [member.openNamed]: sessionMember(member.openNamed),
        [member.openNamedFail]: sessionMember(member.openNamedFail),
        [member.fetchUnnamed]: sessionMember(member.fetchUnnamed),
        [member.fetchUnnamedFail]: sessionMember(member.fetchUnnamedFail),
        [member.fetchNamed]: sessionMember(member.fetchNamed),
        [member.fetchNamedFail]: sessionMember(member.fetchNamedFail),
        [member.closeUnnamed]: sessionMember(member.closeUnnamed),
        [member.closeUnnamedFail]: sessionMember(member.closeUnnamedFail),
        [member.closeNamed]: sessionMember(member.closeNamed),
        [member.closeNamedFail]: sessionMember(member.closeNamedFail),
        [member.sendQuery]: sessionMember(member.sendQuery),
        [member.getResult]: sessionMember(member.getResult),
        [member.getResultFail]: sessionMember(member.getResultFail),
        [member.isBusy]: sessionMember(member.isBusy),
        [member.cancel]: sessionMember(member.cancel),
        [member.errorMessage]: sessionMember(member.errorMessage),
        [member.notifyUnnamed]: sessionMember(member.notifyUnnamed),
        [member.notifyNamed]: sessionMember(member.notifyNamed),
        [member.validator]: Object.freeze({ member: member.validator, authority: "internal" as const }),
      }),
      types: Object.freeze({
        'composite type:"$extension:dblink".dblink_pkey_results': codec,
        "type:$extension:dblink.dblink_pkey_results": codec,
        "type:$extension:dblink._dblink_pkey_results": arrays,
      }),
    }),
  });
}
