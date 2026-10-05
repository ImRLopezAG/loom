import { sql } from "drizzle-orm";
import { nodePgCodecs } from "drizzle-orm/node-postgres";
import * as v from "valibot";
import { nullableCodec, type CodecInput } from "../../../core/extensions/codecs";
import { createSqlFunction, defaultSqlArgument, extensionSqlDialect } from "../../../core/extensions/sql";
import {
  createPostgisTopology_3_6_4,
  type PostgisTopologyDescriptor,
  type TopologyPostgisDescriptor,
} from "../../../core/extensions/adapters/postgis-topology";
import { createPostgisTopologyCodecs } from "../../../core/extensions/adapters/postgis-topology-codecs";
import { extensionManifestValidator } from "../../../core/extensions/contracts";
import { acquireExtensionLock } from "../../migrations/connection";
import { withExtensionOperation, type ExtensionOperationContext } from "../operations";
import { validateExtensionApiRequirement, verifyExtensionApiContracts } from "../verify";
import manifest from "../manifests/postgis_topology.json";
import postgisManifest from "../manifests/postgis.json";
/** Closed native mutation/diagnostic routines. No raw query, connection or executable SQL input escapes.
 * Exact live verification admits the callback only after both dependency contracts match.
 */
export async function withPostgisTopologyOperations<Result>(
  directOperatorUrl: string,
  descriptor: PostgisTopologyDescriptor,
  postgis: TopologyPostgisDescriptor,
  operation: (session: PostgisTopologyOperatorSession) => Promise<Result>,
  signal?: AbortSignal,
) {
  createPostgisTopology_3_6_4(descriptor, postgis);
  return withExtensionOperation(
    directOperatorUrl,
    async (context) => {
      await acquireExtensionLock(context.client, signal);
      // Canonical topology capture exposes its fixed namespace while dependency types remain qualified.
      await context.client.query("SET LOCAL search_path TO topology,pg_catalog");
      await verifyExtensionApiContracts(context.client, [
        validateExtensionApiRequirement({
          schema: descriptor.schema,
          manifest: v.parse(extensionManifestValidator, manifest),
        }),
        validateExtensionApiRequirement({
          schema: postgis.schema,
          manifest: v.parse(extensionManifestValidator, postgisManifest),
        }),
      ]);
      const quote = (name: string) => '"' + name.replaceAll('"', '""') + '"';
      await context.client.query("SELECT pg_catalog.set_config('search_path',$1,true)", [
        `${quote(descriptor.schema)},${quote(postgis.schema)},pg_catalog`,
      ]);
      return createSession(context, descriptor, postgis);
    },
    operation,
    signal,
  );
}
function createSession(
  context: ExtensionOperationContext,
  descriptor: PostgisTopologyDescriptor,
  postgis: TopologyPostgisDescriptor,
) {
  const codecs = createPostgisTopologyCodecs(descriptor.schema, postgis.schema);
  const base = { schema: descriptor.schema, dependencies: [], observability: "external", authority: "query" } as const;
  const member33 = createSqlFunction({
    ...base,
    observability: "external",
    name: "addedge",
    member: "routine:$extension:postgis_topology.addedge(pg_catalog.varchar,$extension:postgis.geometry)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const arguments33 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
  ] as const;
  const operation33 = (
    ...values: [argument0: CodecInput<(typeof arguments33)[0]>, argument1: CodecInput<(typeof arguments33)[1]>]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments33[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member33(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int8"]).decode(rows.rows[0]?.value);
    });
  const member34 = createSqlFunction({
    ...base,
    observability: "external",
    name: "addface",
    member:
      "routine:$extension:postgis_topology.addface(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.bool)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:bool"]), "force_new"),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const arguments34 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    nullableCodec(codecs.primitives["pg_catalog:bool"]),
  ] as const;
  const operation34 = (
    ...values: [
      argument0: CodecInput<(typeof arguments34)[0]>,
      argument1: CodecInput<(typeof arguments34)[1]>,
      argument2?: CodecInput<(typeof arguments34)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments34[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member34(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int8"]).decode(rows.rows[0]?.value);
    });
  const member35 = createSqlFunction({
    ...base,
    observability: "external",
    name: "addnode",
    member:
      "routine:$extension:postgis_topology.addnode(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.bool)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:bool"]), "allowedgesplitting"),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:bool"]), "setcontainingface"),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const arguments35 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    nullableCodec(codecs.primitives["pg_catalog:bool"]),
    nullableCodec(codecs.primitives["pg_catalog:bool"]),
  ] as const;
  const operation35 = (
    ...values: [
      argument0: CodecInput<(typeof arguments35)[0]>,
      argument1: CodecInput<(typeof arguments35)[1]>,
      argument2?: CodecInput<(typeof arguments35)[2]>,
      argument3?: CodecInput<(typeof arguments35)[3]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments35[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member35(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int8"]).decode(rows.rows[0]?.value);
    });
  const member36 = createSqlFunction({
    ...base,
    observability: "external",
    name: "addtopogeometrycolumn",
    member:
      "routine:$extension:postgis_topology.addtopogeometrycolumn(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.varchar,pg_catalog.int4)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:name"]),
      nullableCodec(codecs.primitives["pg_catalog:name"]),
      nullableCodec(codecs.primitives["pg_catalog:name"]),
      nullableCodec(codecs.primitives["pg_catalog:name"]),
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:int4"]), "child"),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int4"]),
  });
  const arguments36 = [
    nullableCodec(codecs.primitives["pg_catalog:name"]),
    nullableCodec(codecs.primitives["pg_catalog:name"]),
    nullableCodec(codecs.primitives["pg_catalog:name"]),
    nullableCodec(codecs.primitives["pg_catalog:name"]),
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int4"]),
  ] as const;
  const operation36 = (
    ...values: [
      argument0: CodecInput<(typeof arguments36)[0]>,
      argument1: CodecInput<(typeof arguments36)[1]>,
      argument2: CodecInput<(typeof arguments36)[2]>,
      argument3: CodecInput<(typeof arguments36)[3]>,
      argument4: CodecInput<(typeof arguments36)[4]>,
      argument5?: CodecInput<(typeof arguments36)[5]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments36[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member36(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int4"]).decode(rows.rows[0]?.value);
    });
  const member37 = createSqlFunction({
    ...base,
    observability: "external",
    name: "addtopogeometrycolumn",
    member:
      "routine:$extension:postgis_topology.addtopogeometrycolumn(pg_catalog.name,pg_catalog.regclass,pg_catalog.name,pg_catalog.int4,pg_catalog.varchar,pg_catalog.int4)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:name"]),
      nullableCodec(codecs.primitives["pg_catalog:regclass"]),
      nullableCodec(codecs.primitives["pg_catalog:name"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:int4"]), "child"),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int4"]),
  });
  const arguments37 = [
    nullableCodec(codecs.primitives["pg_catalog:name"]),
    nullableCodec(codecs.primitives["pg_catalog:regclass"]),
    nullableCodec(codecs.primitives["pg_catalog:name"]),
    nullableCodec(codecs.primitives["pg_catalog:int4"]),
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int4"]),
  ] as const;
  const operation37 = (
    ...values: [
      argument0: CodecInput<(typeof arguments37)[0]>,
      argument1: CodecInput<(typeof arguments37)[1]>,
      argument2: CodecInput<(typeof arguments37)[2]>,
      argument3: CodecInput<(typeof arguments37)[3]>,
      argument4: CodecInput<(typeof arguments37)[4]>,
      argument5?: CodecInput<(typeof arguments37)[5]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments37[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member37(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int4"]).decode(rows.rows[0]?.value);
    });
  const member38 = createSqlFunction({
    ...base,
    observability: "external",
    name: "addtosearchpath",
    member: "routine:$extension:postgis_topology.addtosearchpath(pg_catalog.varchar)",
    arguments: [nullableCodec(codecs.primitives["pg_catalog:varchar"])] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments38 = [nullableCodec(codecs.primitives["pg_catalog:varchar"])] as const;
  const operation38 = (...values: [argument0: CodecInput<(typeof arguments38)[0]>]) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments38[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member38(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member39 = createSqlFunction({
    ...base,
    observability: "external",
    name: "asgml",
    member:
      "routine:$extension:postgis_topology.asgml($extension:postgis_topology.topogeometry,pg_catalog.regclass,pg_catalog.text)",
    arguments: [
      nullableCodec(codecs.types["topogeometry"]),
      nullableCodec(codecs.primitives["pg_catalog:regclass"]),
      nullableCodec(codecs.primitives["pg_catalog:text"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments39 = [
    nullableCodec(codecs.types["topogeometry"]),
    nullableCodec(codecs.primitives["pg_catalog:regclass"]),
    nullableCodec(codecs.primitives["pg_catalog:text"]),
  ] as const;
  const operation39 = (
    ...values: [
      argument0: CodecInput<(typeof arguments39)[0]>,
      argument1: CodecInput<(typeof arguments39)[1]>,
      argument2: CodecInput<(typeof arguments39)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments39[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member39(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member40 = createSqlFunction({
    ...base,
    observability: "external",
    name: "asgml",
    member: "routine:$extension:postgis_topology.asgml($extension:postgis_topology.topogeometry,pg_catalog.regclass)",
    arguments: [
      nullableCodec(codecs.types["topogeometry"]),
      nullableCodec(codecs.primitives["pg_catalog:regclass"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments40 = [
    nullableCodec(codecs.types["topogeometry"]),
    nullableCodec(codecs.primitives["pg_catalog:regclass"]),
  ] as const;
  const operation40 = (
    ...values: [argument0: CodecInput<(typeof arguments40)[0]>, argument1: CodecInput<(typeof arguments40)[1]>]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments40[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member40(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member41 = createSqlFunction({
    ...base,
    observability: "external",
    name: "asgml",
    member:
      "routine:$extension:postgis_topology.asgml($extension:postgis_topology.topogeometry,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.regclass,pg_catalog.text,pg_catalog.int4)",
    arguments: [
      nullableCodec(codecs.types["topogeometry"]),
      nullableCodec(codecs.primitives["pg_catalog:text"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
      nullableCodec(codecs.primitives["pg_catalog:regclass"]),
      nullableCodec(codecs.primitives["pg_catalog:text"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments41 = [
    nullableCodec(codecs.types["topogeometry"]),
    nullableCodec(codecs.primitives["pg_catalog:text"]),
    nullableCodec(codecs.primitives["pg_catalog:int4"]),
    nullableCodec(codecs.primitives["pg_catalog:int4"]),
    nullableCodec(codecs.primitives["pg_catalog:regclass"]),
    nullableCodec(codecs.primitives["pg_catalog:text"]),
    nullableCodec(codecs.primitives["pg_catalog:int4"]),
  ] as const;
  const operation41 = (
    ...values: [
      argument0: CodecInput<(typeof arguments41)[0]>,
      argument1: CodecInput<(typeof arguments41)[1]>,
      argument2: CodecInput<(typeof arguments41)[2]>,
      argument3: CodecInput<(typeof arguments41)[3]>,
      argument4: CodecInput<(typeof arguments41)[4]>,
      argument5: CodecInput<(typeof arguments41)[5]>,
      argument6: CodecInput<(typeof arguments41)[6]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments41[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member41(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member42 = createSqlFunction({
    ...base,
    observability: "external",
    name: "asgml",
    member:
      "routine:$extension:postgis_topology.asgml($extension:postgis_topology.topogeometry,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.regclass,pg_catalog.text)",
    arguments: [
      nullableCodec(codecs.types["topogeometry"]),
      nullableCodec(codecs.primitives["pg_catalog:text"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
      nullableCodec(codecs.primitives["pg_catalog:regclass"]),
      nullableCodec(codecs.primitives["pg_catalog:text"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments42 = [
    nullableCodec(codecs.types["topogeometry"]),
    nullableCodec(codecs.primitives["pg_catalog:text"]),
    nullableCodec(codecs.primitives["pg_catalog:int4"]),
    nullableCodec(codecs.primitives["pg_catalog:int4"]),
    nullableCodec(codecs.primitives["pg_catalog:regclass"]),
    nullableCodec(codecs.primitives["pg_catalog:text"]),
  ] as const;
  const operation42 = (
    ...values: [
      argument0: CodecInput<(typeof arguments42)[0]>,
      argument1: CodecInput<(typeof arguments42)[1]>,
      argument2: CodecInput<(typeof arguments42)[2]>,
      argument3: CodecInput<(typeof arguments42)[3]>,
      argument4: CodecInput<(typeof arguments42)[4]>,
      argument5: CodecInput<(typeof arguments42)[5]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments42[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member42(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member43 = createSqlFunction({
    ...base,
    observability: "external",
    name: "asgml",
    member:
      "routine:$extension:postgis_topology.asgml($extension:postgis_topology.topogeometry,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.regclass)",
    arguments: [
      nullableCodec(codecs.types["topogeometry"]),
      nullableCodec(codecs.primitives["pg_catalog:text"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
      nullableCodec(codecs.primitives["pg_catalog:regclass"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments43 = [
    nullableCodec(codecs.types["topogeometry"]),
    nullableCodec(codecs.primitives["pg_catalog:text"]),
    nullableCodec(codecs.primitives["pg_catalog:int4"]),
    nullableCodec(codecs.primitives["pg_catalog:int4"]),
    nullableCodec(codecs.primitives["pg_catalog:regclass"]),
  ] as const;
  const operation43 = (
    ...values: [
      argument0: CodecInput<(typeof arguments43)[0]>,
      argument1: CodecInput<(typeof arguments43)[1]>,
      argument2: CodecInput<(typeof arguments43)[2]>,
      argument3: CodecInput<(typeof arguments43)[3]>,
      argument4: CodecInput<(typeof arguments43)[4]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments43[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member43(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member47 = createSqlFunction({
    ...base,
    observability: "external",
    name: "astopojson",
    member:
      "routine:$extension:postgis_topology.astopojson($extension:postgis_topology.topogeometry,pg_catalog.regclass)",
    arguments: [
      nullableCodec(codecs.types["topogeometry"]),
      nullableCodec(codecs.primitives["pg_catalog:regclass"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments47 = [
    nullableCodec(codecs.types["topogeometry"]),
    nullableCodec(codecs.primitives["pg_catalog:regclass"]),
  ] as const;
  const operation47 = (
    ...values: [argument0: CodecInput<(typeof arguments47)[0]>, argument1: CodecInput<(typeof arguments47)[1]>]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments47[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member47(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member48 = createSqlFunction({
    ...base,
    observability: "external",
    name: "cleartopogeom",
    member: "routine:$extension:postgis_topology.cleartopogeom($extension:postgis_topology.topogeometry)",
    arguments: [nullableCodec(codecs.types["topogeometry"])] as const,
    result: nullableCodec(codecs.types["topogeometry"]),
  });
  const arguments48 = [nullableCodec(codecs.types["topogeometry"])] as const;
  const operation48 = (...values: [argument0: CodecInput<(typeof arguments48)[0]>]) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments48[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member48(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.types["topogeometry"]).decode(rows.rows[0]?.value);
    });
  const member49 = createSqlFunction({
    ...base,
    observability: "external",
    name: "copytopology",
    member: "routine:$extension:postgis_topology.copytopology(pg_catalog.varchar,pg_catalog.varchar)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int4"]),
  });
  const arguments49 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
  ] as const;
  const operation49 = (
    ...values: [argument0: CodecInput<(typeof arguments49)[0]>, argument1: CodecInput<(typeof arguments49)[1]>]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments49[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member49(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int4"]).decode(rows.rows[0]?.value);
    });
  const member50 = createSqlFunction({
    ...base,
    observability: "external",
    name: "createtopogeom",
    member:
      "routine:$extension:postgis_topology.createtopogeom(pg_catalog.varchar,pg_catalog.int4,pg_catalog.int4,$extension:postgis_topology.topoelementarray,pg_catalog.int8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
      nullableCodec(codecs.types["topoelementarray"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:int8"]), "tg_id"),
    ] as const,
    result: nullableCodec(codecs.types["topogeometry"]),
  });
  const arguments50 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int4"]),
    nullableCodec(codecs.primitives["pg_catalog:int4"]),
    nullableCodec(codecs.types["topoelementarray"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
  ] as const;
  const operation50 = (
    ...values: [
      argument0: CodecInput<(typeof arguments50)[0]>,
      argument1: CodecInput<(typeof arguments50)[1]>,
      argument2: CodecInput<(typeof arguments50)[2]>,
      argument3: CodecInput<(typeof arguments50)[3]>,
      argument4?: CodecInput<(typeof arguments50)[4]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments50[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member50(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.types["topogeometry"]).decode(rows.rows[0]?.value);
    });
  const member51 = createSqlFunction({
    ...base,
    observability: "external",
    name: "createtopogeom",
    member: "routine:$extension:postgis_topology.createtopogeom(pg_catalog.varchar,pg_catalog.int4,pg_catalog.int4)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
    ] as const,
    result: nullableCodec(codecs.types["topogeometry"]),
  });
  const arguments51 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int4"]),
    nullableCodec(codecs.primitives["pg_catalog:int4"]),
  ] as const;
  const operation51 = (
    ...values: [
      argument0: CodecInput<(typeof arguments51)[0]>,
      argument1: CodecInput<(typeof arguments51)[1]>,
      argument2: CodecInput<(typeof arguments51)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments51[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member51(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.types["topogeometry"]).decode(rows.rows[0]?.value);
    });
  const member52 = createSqlFunction({
    ...base,
    observability: "external",
    name: "createtopology",
    member:
      "routine:$extension:postgis_topology.createtopology(pg_catalog.name,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool,pg_catalog.int4,pg_catalog.bool)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:name"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:int4"]), "srid"),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:float8"]), "prec"),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:bool"]), "hasz"),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:int4"]), "topoid"),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:bool"]), "useslargeids"),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int4"]),
  });
  const arguments52 = [
    nullableCodec(codecs.primitives["pg_catalog:name"]),
    nullableCodec(codecs.primitives["pg_catalog:int4"]),
    nullableCodec(codecs.primitives["pg_catalog:float8"]),
    nullableCodec(codecs.primitives["pg_catalog:bool"]),
    nullableCodec(codecs.primitives["pg_catalog:int4"]),
    nullableCodec(codecs.primitives["pg_catalog:bool"]),
  ] as const;
  const operation52 = (
    ...values: [
      argument0: CodecInput<(typeof arguments52)[0]>,
      argument1?: CodecInput<(typeof arguments52)[1]>,
      argument2?: CodecInput<(typeof arguments52)[2]>,
      argument3?: CodecInput<(typeof arguments52)[3]>,
      argument4?: CodecInput<(typeof arguments52)[4]>,
      argument5?: CodecInput<(typeof arguments52)[5]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments52[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member52(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int4"]).decode(rows.rows[0]?.value);
    });
  const member53 = createSqlFunction({
    ...base,
    observability: "external",
    name: "droptopogeometrycolumn",
    member:
      "routine:$extension:postgis_topology.droptopogeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments53 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
  ] as const;
  const operation53 = (
    ...values: [
      argument0: CodecInput<(typeof arguments53)[0]>,
      argument1: CodecInput<(typeof arguments53)[1]>,
      argument2: CodecInput<(typeof arguments53)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments53[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member53(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member54 = createSqlFunction({
    ...base,
    observability: "external",
    name: "droptopology",
    member: "routine:$extension:postgis_topology.droptopology(pg_catalog.varchar)",
    arguments: [nullableCodec(codecs.primitives["pg_catalog:varchar"])] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments54 = [nullableCodec(codecs.primitives["pg_catalog:varchar"])] as const;
  const operation54 = (...values: [argument0: CodecInput<(typeof arguments54)[0]>]) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments54[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member54(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member65 = createSqlFunction({
    ...base,
    observability: "external",
    name: "fixcorrupttopogeometrycolumn",
    member:
      "routine:$extension:postgis_topology.fixcorrupttopogeometrycolumn(pg_catalog.name,pg_catalog.name,pg_catalog.name)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:name"]),
      nullableCodec(codecs.primitives["pg_catalog:name"]),
      nullableCodec(codecs.primitives["pg_catalog:name"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments65 = [
    nullableCodec(codecs.primitives["pg_catalog:name"]),
    nullableCodec(codecs.primitives["pg_catalog:name"]),
    nullableCodec(codecs.primitives["pg_catalog:name"]),
  ] as const;
  const operation65 = (
    ...values: [
      argument0: CodecInput<(typeof arguments65)[0]>,
      argument1: CodecInput<(typeof arguments65)[1]>,
      argument2: CodecInput<(typeof arguments65)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments65[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member65(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member83 = createSqlFunction({
    ...base,
    observability: "external",
    name: "maketopologyprecise",
    member:
      "routine:$extension:postgis_topology.maketopologyprecise(pg_catalog.name,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:name"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["$extension:postgis:geometry"]), "bbox"),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:float8"]), "gridsize"),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:void"]),
  });
  const arguments83 = [
    nullableCodec(codecs.primitives["pg_catalog:name"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    nullableCodec(codecs.primitives["pg_catalog:float8"]),
  ] as const;
  const operation83 = (
    ...values: [
      argument0: CodecInput<(typeof arguments83)[0]>,
      argument1?: CodecInput<(typeof arguments83)[1]>,
      argument2?: CodecInput<(typeof arguments83)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments83[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member83(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:void"]).decode(rows.rows[0]?.value);
    });
  const member84 = createSqlFunction({
    ...base,
    observability: "external",
    name: "polygonize",
    member: "routine:$extension:postgis_topology.polygonize(pg_catalog.varchar)",
    arguments: [nullableCodec(codecs.primitives["pg_catalog:varchar"])] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments84 = [nullableCodec(codecs.primitives["pg_catalog:varchar"])] as const;
  const operation84 = (...values: [argument0: CodecInput<(typeof arguments84)[0]>]) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments84[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member84(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member85 = createSqlFunction({
    ...base,
    observability: "external",
    name: "populate_topology_layer",
    member: "routine:$extension:postgis_topology.populate_topology_layer()",
    arguments: [] as const,
    result: codecs.populate_topology_layerResult,
  });
  const arguments85 = [] as const;
  const operation85 = (...values: []) =>
    context.run(async () => {
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member85(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return rows.rows.map((row) => codecs.populate_topology_layerResult.decode(row.value));
    });
  const member88 = createSqlFunction({
    ...base,
    observability: "external",
    name: "removeunusedprimitives",
    member: "routine:$extension:postgis_topology.removeunusedprimitives(pg_catalog.text,$extension:postgis.geometry)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:text"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["$extension:postgis:geometry"]), "bbox"),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const arguments88 = [
    nullableCodec(codecs.primitives["pg_catalog:text"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
  ] as const;
  const operation88 = (
    ...values: [argument0: CodecInput<(typeof arguments88)[0]>, argument1?: CodecInput<(typeof arguments88)[1]>]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments88[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member88(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int8"]).decode(rows.rows[0]?.value);
    });
  const member89 = createSqlFunction({
    ...base,
    observability: "external",
    name: "renametopogeometrycolumn",
    member:
      "routine:$extension:postgis_topology.renametopogeometrycolumn(pg_catalog.regclass,pg_catalog.name,pg_catalog.name)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:regclass"]),
      nullableCodec(codecs.primitives["pg_catalog:name"]),
      nullableCodec(codecs.primitives["pg_catalog:name"]),
    ] as const,
    result: nullableCodec(codecs.types["layer"]),
  });
  const arguments89 = [
    nullableCodec(codecs.primitives["pg_catalog:regclass"]),
    nullableCodec(codecs.primitives["pg_catalog:name"]),
    nullableCodec(codecs.primitives["pg_catalog:name"]),
  ] as const;
  const operation89 = (
    ...values: [
      argument0: CodecInput<(typeof arguments89)[0]>,
      argument1: CodecInput<(typeof arguments89)[1]>,
      argument2: CodecInput<(typeof arguments89)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments89[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member89(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.types["layer"]).decode(rows.rows[0]?.value);
    });
  const member90 = createSqlFunction({
    ...base,
    observability: "external",
    name: "renametopology",
    member: "routine:$extension:postgis_topology.renametopology(pg_catalog.varchar,pg_catalog.varchar)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:varchar"]),
  });
  const arguments90 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
  ] as const;
  const operation90 = (
    ...values: [argument0: CodecInput<(typeof arguments90)[0]>, argument1: CodecInput<(typeof arguments90)[1]>]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments90[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member90(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:varchar"]).decode(rows.rows[0]?.value);
    });
  const member91 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_addedgemodface",
    member:
      "routine:$extension:postgis_topology.st_addedgemodface(pg_catalog.varchar,pg_catalog.int8,pg_catalog.int8,$extension:postgis.geometry)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const arguments91 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
  ] as const;
  const operation91 = (
    ...values: [
      argument0: CodecInput<(typeof arguments91)[0]>,
      argument1: CodecInput<(typeof arguments91)[1]>,
      argument2: CodecInput<(typeof arguments91)[2]>,
      argument3: CodecInput<(typeof arguments91)[3]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments91[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member91(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int8"]).decode(rows.rows[0]?.value);
    });
  const member92 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_addedgenewfaces",
    member:
      "routine:$extension:postgis_topology.st_addedgenewfaces(pg_catalog.varchar,pg_catalog.int8,pg_catalog.int8,$extension:postgis.geometry)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const arguments92 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
  ] as const;
  const operation92 = (
    ...values: [
      argument0: CodecInput<(typeof arguments92)[0]>,
      argument1: CodecInput<(typeof arguments92)[1]>,
      argument2: CodecInput<(typeof arguments92)[2]>,
      argument3: CodecInput<(typeof arguments92)[3]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments92[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member92(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int8"]).decode(rows.rows[0]?.value);
    });
  const member93 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_addisoedge",
    member:
      "routine:$extension:postgis_topology.st_addisoedge(pg_catalog.varchar,pg_catalog.int8,pg_catalog.int8,$extension:postgis.geometry)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const arguments93 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
  ] as const;
  const operation93 = (
    ...values: [
      argument0: CodecInput<(typeof arguments93)[0]>,
      argument1: CodecInput<(typeof arguments93)[1]>,
      argument2: CodecInput<(typeof arguments93)[2]>,
      argument3: CodecInput<(typeof arguments93)[3]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments93[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member93(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int8"]).decode(rows.rows[0]?.value);
    });
  const member94 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_addisonode",
    member:
      "routine:$extension:postgis_topology.st_addisonode(pg_catalog.varchar,pg_catalog.int8,$extension:postgis.geometry)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const arguments94 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
  ] as const;
  const operation94 = (
    ...values: [
      argument0: CodecInput<(typeof arguments94)[0]>,
      argument1: CodecInput<(typeof arguments94)[1]>,
      argument2: CodecInput<(typeof arguments94)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments94[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member94(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int8"]).decode(rows.rows[0]?.value);
    });
  const member95 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_changeedgegeom",
    member:
      "routine:$extension:postgis_topology.st_changeedgegeom(pg_catalog.varchar,pg_catalog.int8,$extension:postgis.geometry)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments95 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
  ] as const;
  const operation95 = (
    ...values: [
      argument0: CodecInput<(typeof arguments95)[0]>,
      argument1: CodecInput<(typeof arguments95)[1]>,
      argument2: CodecInput<(typeof arguments95)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments95[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member95(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member96 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_createtopogeo",
    member: "routine:$extension:postgis_topology.st_createtopogeo(pg_catalog.varchar,$extension:postgis.geometry)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments96 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
  ] as const;
  const operation96 = (
    ...values: [argument0: CodecInput<(typeof arguments96)[0]>, argument1: CodecInput<(typeof arguments96)[1]>]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments96[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member96(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member100 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_inittopogeo",
    member: "routine:$extension:postgis_topology.st_inittopogeo(pg_catalog.varchar)",
    arguments: [nullableCodec(codecs.primitives["pg_catalog:varchar"])] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments100 = [nullableCodec(codecs.primitives["pg_catalog:varchar"])] as const;
  const operation100 = (...values: [argument0: CodecInput<(typeof arguments100)[0]>]) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments100[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member100(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member101 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_modedgeheal",
    member: "routine:$extension:postgis_topology.st_modedgeheal(pg_catalog.varchar,pg_catalog.int8,pg_catalog.int8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const arguments101 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
  ] as const;
  const operation101 = (
    ...values: [
      argument0: CodecInput<(typeof arguments101)[0]>,
      argument1: CodecInput<(typeof arguments101)[1]>,
      argument2: CodecInput<(typeof arguments101)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments101[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member101(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int8"]).decode(rows.rows[0]?.value);
    });
  const member102 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_modedgesplit",
    member:
      "routine:$extension:postgis_topology.st_modedgesplit(pg_catalog.varchar,pg_catalog.int8,$extension:postgis.geometry)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const arguments102 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
  ] as const;
  const operation102 = (
    ...values: [
      argument0: CodecInput<(typeof arguments102)[0]>,
      argument1: CodecInput<(typeof arguments102)[1]>,
      argument2: CodecInput<(typeof arguments102)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments102[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member102(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int8"]).decode(rows.rows[0]?.value);
    });
  const member103 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_moveisonode",
    member:
      "routine:$extension:postgis_topology.st_moveisonode(pg_catalog.varchar,pg_catalog.int8,$extension:postgis.geometry)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments103 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
  ] as const;
  const operation103 = (
    ...values: [
      argument0: CodecInput<(typeof arguments103)[0]>,
      argument1: CodecInput<(typeof arguments103)[1]>,
      argument2: CodecInput<(typeof arguments103)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments103[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member103(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member104 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_newedgeheal",
    member: "routine:$extension:postgis_topology.st_newedgeheal(pg_catalog.varchar,pg_catalog.int8,pg_catalog.int8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const arguments104 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
  ] as const;
  const operation104 = (
    ...values: [
      argument0: CodecInput<(typeof arguments104)[0]>,
      argument1: CodecInput<(typeof arguments104)[1]>,
      argument2: CodecInput<(typeof arguments104)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments104[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member104(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int8"]).decode(rows.rows[0]?.value);
    });
  const member105 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_newedgessplit",
    member:
      "routine:$extension:postgis_topology.st_newedgessplit(pg_catalog.varchar,pg_catalog.int8,$extension:postgis.geometry)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const arguments105 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
  ] as const;
  const operation105 = (
    ...values: [
      argument0: CodecInput<(typeof arguments105)[0]>,
      argument1: CodecInput<(typeof arguments105)[1]>,
      argument2: CodecInput<(typeof arguments105)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments105[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member105(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int8"]).decode(rows.rows[0]?.value);
    });
  const member106 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_remedgemodface",
    member: "routine:$extension:postgis_topology.st_remedgemodface(pg_catalog.varchar,pg_catalog.int8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const arguments106 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
  ] as const;
  const operation106 = (
    ...values: [argument0: CodecInput<(typeof arguments106)[0]>, argument1: CodecInput<(typeof arguments106)[1]>]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments106[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member106(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int8"]).decode(rows.rows[0]?.value);
    });
  const member107 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_remedgenewface",
    member: "routine:$extension:postgis_topology.st_remedgenewface(pg_catalog.varchar,pg_catalog.int8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const arguments107 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
  ] as const;
  const operation107 = (
    ...values: [argument0: CodecInput<(typeof arguments107)[0]>, argument1: CodecInput<(typeof arguments107)[1]>]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments107[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member107(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int8"]).decode(rows.rows[0]?.value);
    });
  const member108 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_remisonode",
    member: "routine:$extension:postgis_topology.st_remisonode(pg_catalog.varchar,pg_catalog.int8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments108 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
  ] as const;
  const operation108 = (
    ...values: [argument0: CodecInput<(typeof arguments108)[0]>, argument1: CodecInput<(typeof arguments108)[1]>]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments108[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member108(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member109 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_removeisoedge",
    member: "routine:$extension:postgis_topology.st_removeisoedge(pg_catalog.varchar,pg_catalog.int8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments109 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
  ] as const;
  const operation109 = (
    ...values: [argument0: CodecInput<(typeof arguments109)[0]>, argument1: CodecInput<(typeof arguments109)[1]>]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments109[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member109(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member110 = createSqlFunction({
    ...base,
    observability: "external",
    name: "st_removeisonode",
    member: "routine:$extension:postgis_topology.st_removeisonode(pg_catalog.varchar,pg_catalog.int8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int8"]),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:text"]),
  });
  const arguments110 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int8"]),
  ] as const;
  const operation110 = (
    ...values: [argument0: CodecInput<(typeof arguments110)[0]>, argument1: CodecInput<(typeof arguments110)[1]>]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments110[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member110(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:text"]).decode(rows.rows[0]?.value);
    });
  const member116 = createSqlFunction({
    ...base,
    observability: "external",
    name: "topogeo_addgeometry",
    member:
      "routine:$extension:postgis_topology.topogeo_addgeometry(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:float8"]), "tolerance"),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:void"]),
  });
  const arguments116 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    nullableCodec(codecs.primitives["pg_catalog:float8"]),
  ] as const;
  const operation116 = (
    ...values: [
      argument0: CodecInput<(typeof arguments116)[0]>,
      argument1: CodecInput<(typeof arguments116)[1]>,
      argument2?: CodecInput<(typeof arguments116)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments116[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member116(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:void"]).decode(rows.rows[0]?.value);
    });
  const member117 = createSqlFunction({
    ...base,
    observability: "external",
    name: "topogeo_addlinestring",
    member:
      "routine:$extension:postgis_topology.topogeo_addlinestring(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:float8"]), "tolerance"),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const arguments117 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    nullableCodec(codecs.primitives["pg_catalog:float8"]),
  ] as const;
  const operation117 = (
    ...values: [
      argument0: CodecInput<(typeof arguments117)[0]>,
      argument1: CodecInput<(typeof arguments117)[1]>,
      argument2?: CodecInput<(typeof arguments117)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments117[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member117(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return rows.rows.map((row) => nullableCodec(codecs.primitives["pg_catalog:int8"]).decode(row.value));
    });
  const member118 = createSqlFunction({
    ...base,
    observability: "external",
    name: "topogeo_addpoint",
    member:
      "routine:$extension:postgis_topology.topogeo_addpoint(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:float8"]), "tolerance"),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const arguments118 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    nullableCodec(codecs.primitives["pg_catalog:float8"]),
  ] as const;
  const operation118 = (
    ...values: [
      argument0: CodecInput<(typeof arguments118)[0]>,
      argument1: CodecInput<(typeof arguments118)[1]>,
      argument2?: CodecInput<(typeof arguments118)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments118[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member118(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:int8"]).decode(rows.rows[0]?.value);
    });
  const member119 = createSqlFunction({
    ...base,
    observability: "external",
    name: "topogeo_addpolygon",
    member:
      "routine:$extension:postgis_topology.topogeo_addpolygon(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:float8"]), "tolerance"),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:int8"]),
  });
  const arguments119 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    nullableCodec(codecs.primitives["pg_catalog:float8"]),
  ] as const;
  const operation119 = (
    ...values: [
      argument0: CodecInput<(typeof arguments119)[0]>,
      argument1: CodecInput<(typeof arguments119)[1]>,
      argument2?: CodecInput<(typeof arguments119)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments119[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member119(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return rows.rows.map((row) => nullableCodec(codecs.primitives["pg_catalog:int8"]).decode(row.value));
    });
  const member120 = createSqlFunction({
    ...base,
    observability: "external",
    name: "topogeo_loadgeometry",
    member:
      "routine:$extension:postgis_topology.topogeo_loadgeometry(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.float8)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:float8"]), "tolerance"),
    ] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:void"]),
  });
  const arguments120 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    nullableCodec(codecs.primitives["pg_catalog:float8"]),
  ] as const;
  const operation120 = (
    ...values: [
      argument0: CodecInput<(typeof arguments120)[0]>,
      argument1: CodecInput<(typeof arguments120)[1]>,
      argument2?: CodecInput<(typeof arguments120)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments120[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member120(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:void"]).decode(rows.rows[0]?.value);
    });
  const member121 = createSqlFunction({
    ...base,
    observability: "external",
    name: "topogeom_addelement",
    member:
      "routine:$extension:postgis_topology.topogeom_addelement($extension:postgis_topology.topogeometry,$extension:postgis_topology.topoelement)",
    arguments: [nullableCodec(codecs.types["topogeometry"]), nullableCodec(codecs.types["topoelement"])] as const,
    result: nullableCodec(codecs.types["topogeometry"]),
  });
  const arguments121 = [
    nullableCodec(codecs.types["topogeometry"]),
    nullableCodec(codecs.types["topoelement"]),
  ] as const;
  const operation121 = (
    ...values: [argument0: CodecInput<(typeof arguments121)[0]>, argument1: CodecInput<(typeof arguments121)[1]>]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments121[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member121(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.types["topogeometry"]).decode(rows.rows[0]?.value);
    });
  const member122 = createSqlFunction({
    ...base,
    observability: "external",
    name: "topogeom_addtopogeom",
    member:
      "routine:$extension:postgis_topology.topogeom_addtopogeom($extension:postgis_topology.topogeometry,$extension:postgis_topology.topogeometry)",
    arguments: [nullableCodec(codecs.types["topogeometry"]), nullableCodec(codecs.types["topogeometry"])] as const,
    result: nullableCodec(codecs.types["topogeometry"]),
  });
  const arguments122 = [
    nullableCodec(codecs.types["topogeometry"]),
    nullableCodec(codecs.types["topogeometry"]),
  ] as const;
  const operation122 = (
    ...values: [argument0: CodecInput<(typeof arguments122)[0]>, argument1: CodecInput<(typeof arguments122)[1]>]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments122[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member122(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.types["topogeometry"]).decode(rows.rows[0]?.value);
    });
  const member123 = createSqlFunction({
    ...base,
    observability: "external",
    name: "topogeom_remelement",
    member:
      "routine:$extension:postgis_topology.topogeom_remelement($extension:postgis_topology.topogeometry,$extension:postgis_topology.topoelement)",
    arguments: [nullableCodec(codecs.types["topogeometry"]), nullableCodec(codecs.types["topoelement"])] as const,
    result: nullableCodec(codecs.types["topogeometry"]),
  });
  const arguments123 = [
    nullableCodec(codecs.types["topogeometry"]),
    nullableCodec(codecs.types["topoelement"]),
  ] as const;
  const operation123 = (
    ...values: [argument0: CodecInput<(typeof arguments123)[0]>, argument1: CodecInput<(typeof arguments123)[1]>]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments123[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member123(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.types["topogeometry"]).decode(rows.rows[0]?.value);
    });
  const member126 = createSqlFunction({
    ...base,
    observability: "external",
    name: "totopogeom",
    member:
      "routine:$extension:postgis_topology.totopogeom($extension:postgis.geometry,$extension:postgis_topology.topogeometry,pg_catalog.float8)",
    arguments: [
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
      nullableCodec(codecs.types["topogeometry"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:float8"]), "atolerance"),
    ] as const,
    result: nullableCodec(codecs.types["topogeometry"]),
  });
  const arguments126 = [
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    nullableCodec(codecs.types["topogeometry"]),
    nullableCodec(codecs.primitives["pg_catalog:float8"]),
  ] as const;
  const operation126 = (
    ...values: [
      argument0: CodecInput<(typeof arguments126)[0]>,
      argument1: CodecInput<(typeof arguments126)[1]>,
      argument2?: CodecInput<(typeof arguments126)[2]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments126[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member126(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.types["topogeometry"]).decode(rows.rows[0]?.value);
    });
  const member127 = createSqlFunction({
    ...base,
    observability: "external",
    name: "totopogeom",
    member:
      "routine:$extension:postgis_topology.totopogeom($extension:postgis.geometry,pg_catalog.varchar,pg_catalog.int4,pg_catalog.float8)",
    arguments: [
      nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      nullableCodec(codecs.primitives["pg_catalog:int4"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["pg_catalog:float8"]), "atolerance"),
    ] as const,
    result: nullableCodec(codecs.types["topogeometry"]),
  });
  const arguments127 = [
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["pg_catalog:int4"]),
    nullableCodec(codecs.primitives["pg_catalog:float8"]),
  ] as const;
  const operation127 = (
    ...values: [
      argument0: CodecInput<(typeof arguments127)[0]>,
      argument1: CodecInput<(typeof arguments127)[1]>,
      argument2: CodecInput<(typeof arguments127)[2]>,
      argument3?: CodecInput<(typeof arguments127)[3]>,
    ]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments127[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member127(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.types["topogeometry"]).decode(rows.rows[0]?.value);
    });
  const member128 = createSqlFunction({
    ...base,
    observability: "external",
    name: "upgradetopology",
    member: "routine:$extension:postgis_topology.upgradetopology(pg_catalog.name)",
    arguments: [nullableCodec(codecs.primitives["pg_catalog:name"])] as const,
    result: nullableCodec(codecs.primitives["pg_catalog:void"]),
  });
  const arguments128 = [nullableCodec(codecs.primitives["pg_catalog:name"])] as const;
  const operation128 = (...values: [argument0: CodecInput<(typeof arguments128)[0]>]) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments128[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member128(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return nullableCodec(codecs.primitives["pg_catalog:void"]).decode(rows.rows[0]?.value);
    });
  const member129 = createSqlFunction({
    ...base,
    observability: "external",
    name: "validatetopology",
    member: "routine:$extension:postgis_topology.validatetopology(pg_catalog.varchar,$extension:postgis.geometry)",
    arguments: [
      nullableCodec(codecs.primitives["pg_catalog:varchar"]),
      defaultSqlArgument(nullableCodec(codecs.primitives["$extension:postgis:geometry"]), "bbox"),
    ] as const,
    result: nullableCodec(codecs.types["validatetopology_returntype"]),
  });
  const arguments129 = [
    nullableCodec(codecs.primitives["pg_catalog:varchar"]),
    nullableCodec(codecs.primitives["$extension:postgis:geometry"]),
  ] as const;
  const operation129 = (
    ...values: [argument0: CodecInput<(typeof arguments129)[0]>, argument1?: CodecInput<(typeof arguments129)[1]>]
  ) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments129[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member129(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return rows.rows.map((row) => nullableCodec(codecs.types["validatetopology_returntype"]).decode(row.value));
    });
  const member131 = createSqlFunction({
    ...base,
    observability: "external",
    name: "validatetopologyrelation",
    member: "routine:$extension:postgis_topology.validatetopologyrelation(pg_catalog.varchar)",
    arguments: [nullableCodec(codecs.primitives["pg_catalog:varchar"])] as const,
    result: codecs.validatetopologyrelationResult,
  });
  const arguments131 = [nullableCodec(codecs.primitives["pg_catalog:varchar"])] as const;
  const operation131 = (...values: [argument0: CodecInput<(typeof arguments131)[0]>]) =>
    context.run(async () => {
      for (const [index, value] of values.entries()) {
        if (value !== undefined)
          /* SAFETY: The index selects this captured argument codec; encode validates the value before any operator SQL executes. */
          arguments131[index]!.encode(value as never);
      }
      const compiled = extensionSqlDialect(nodePgCodecs).sqlToQuery(
        sql`select (${member131(...values)})::pg_catalog.text value`,
      );
      const rows = await context.client.query(compiled.sql, compiled.params);
      return rows.rows.map((row) => codecs.validatetopologyrelationResult.decode(row.value));
    });
  const functions = Object.freeze({
    addedge: operation33,
    addface: operation34,
    addnode: operation35,
    addtopogeometrycolumn: Object.freeze({
      "(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.varchar,pg_catalog.int4)":
        operation36,
      "(pg_catalog.name,pg_catalog.regclass,pg_catalog.name,pg_catalog.int4,pg_catalog.varchar,pg_catalog.int4)":
        operation37,
    }),
    addtosearchpath: operation38,
    asgml: Object.freeze({
      "($extension:postgis_topology.topogeometry,pg_catalog.regclass,pg_catalog.text)": operation39,
      "($extension:postgis_topology.topogeometry,pg_catalog.regclass)": operation40,
      "($extension:postgis_topology.topogeometry,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.regclass,pg_catalog.text,pg_catalog.int4)":
        operation41,
      "($extension:postgis_topology.topogeometry,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.regclass,pg_catalog.text)":
        operation42,
      "($extension:postgis_topology.topogeometry,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.regclass)":
        operation43,
    }),
    astopojson: operation47,
    cleartopogeom: operation48,
    copytopology: operation49,
    createtopogeom: Object.freeze({
      "(pg_catalog.varchar,pg_catalog.int4,pg_catalog.int4,$extension:postgis_topology.topoelementarray,pg_catalog.int8)":
        operation50,
      "(pg_catalog.varchar,pg_catalog.int4,pg_catalog.int4)": operation51,
    }),
    createtopology: operation52,
    droptopogeometrycolumn: operation53,
    droptopology: operation54,
    fixcorrupttopogeometrycolumn: operation65,
    maketopologyprecise: operation83,
    polygonize: operation84,
    populate_topology_layer: operation85,
    removeunusedprimitives: operation88,
    renametopogeometrycolumn: operation89,
    renametopology: operation90,
    st_addedgemodface: operation91,
    st_addedgenewfaces: operation92,
    st_addisoedge: operation93,
    st_addisonode: operation94,
    st_changeedgegeom: operation95,
    st_createtopogeo: operation96,
    st_inittopogeo: operation100,
    st_modedgeheal: operation101,
    st_modedgesplit: operation102,
    st_moveisonode: operation103,
    st_newedgeheal: operation104,
    st_newedgessplit: operation105,
    st_remedgemodface: operation106,
    st_remedgenewface: operation107,
    st_remisonode: operation108,
    st_removeisoedge: operation109,
    st_removeisonode: operation110,
    topogeo_addgeometry: operation116,
    topogeo_addlinestring: operation117,
    topogeo_addpoint: operation118,
    topogeo_addpolygon: operation119,
    topogeo_loadgeometry: operation120,
    topogeom_addelement: operation121,
    topogeom_addtopogeom: operation122,
    topogeom_remelement: operation123,
    totopogeom: Object.freeze({
      "($extension:postgis.geometry,$extension:postgis_topology.topogeometry,pg_catalog.float8)": operation126,
      "($extension:postgis.geometry,pg_catalog.varchar,pg_catalog.int4,pg_catalog.float8)": operation127,
    }),
    upgradetopology: operation128,
    validatetopology: operation129,
    validatetopologyrelation: operation131,
  });
  return Object.freeze({
    ...functions,
    routines: Object.freeze({
      "routine:$extension:postgis_topology.addedge(pg_catalog.varchar,$extension:postgis.geometry)": operation33,
      "routine:$extension:postgis_topology.addface(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.bool)":
        operation34,
      "routine:$extension:postgis_topology.addnode(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.bool,pg_catalog.bool)":
        operation35,
      "routine:$extension:postgis_topology.addtopogeometrycolumn(pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.name,pg_catalog.varchar,pg_catalog.int4)":
        operation36,
      "routine:$extension:postgis_topology.addtopogeometrycolumn(pg_catalog.name,pg_catalog.regclass,pg_catalog.name,pg_catalog.int4,pg_catalog.varchar,pg_catalog.int4)":
        operation37,
      "routine:$extension:postgis_topology.addtosearchpath(pg_catalog.varchar)": operation38,
      "routine:$extension:postgis_topology.asgml($extension:postgis_topology.topogeometry,pg_catalog.regclass,pg_catalog.text)":
        operation39,
      "routine:$extension:postgis_topology.asgml($extension:postgis_topology.topogeometry,pg_catalog.regclass)":
        operation40,
      "routine:$extension:postgis_topology.asgml($extension:postgis_topology.topogeometry,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.regclass,pg_catalog.text,pg_catalog.int4)":
        operation41,
      "routine:$extension:postgis_topology.asgml($extension:postgis_topology.topogeometry,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.regclass,pg_catalog.text)":
        operation42,
      "routine:$extension:postgis_topology.asgml($extension:postgis_topology.topogeometry,pg_catalog.text,pg_catalog.int4,pg_catalog.int4,pg_catalog.regclass)":
        operation43,
      "routine:$extension:postgis_topology.astopojson($extension:postgis_topology.topogeometry,pg_catalog.regclass)":
        operation47,
      "routine:$extension:postgis_topology.cleartopogeom($extension:postgis_topology.topogeometry)": operation48,
      "routine:$extension:postgis_topology.copytopology(pg_catalog.varchar,pg_catalog.varchar)": operation49,
      "routine:$extension:postgis_topology.createtopogeom(pg_catalog.varchar,pg_catalog.int4,pg_catalog.int4,$extension:postgis_topology.topoelementarray,pg_catalog.int8)":
        operation50,
      "routine:$extension:postgis_topology.createtopogeom(pg_catalog.varchar,pg_catalog.int4,pg_catalog.int4)":
        operation51,
      "routine:$extension:postgis_topology.createtopology(pg_catalog.name,pg_catalog.int4,pg_catalog.float8,pg_catalog.bool,pg_catalog.int4,pg_catalog.bool)":
        operation52,
      "routine:$extension:postgis_topology.droptopogeometrycolumn(pg_catalog.varchar,pg_catalog.varchar,pg_catalog.varchar)":
        operation53,
      "routine:$extension:postgis_topology.droptopology(pg_catalog.varchar)": operation54,
      "routine:$extension:postgis_topology.fixcorrupttopogeometrycolumn(pg_catalog.name,pg_catalog.name,pg_catalog.name)":
        operation65,
      "routine:$extension:postgis_topology.maketopologyprecise(pg_catalog.name,$extension:postgis.geometry,pg_catalog.float8)":
        operation83,
      "routine:$extension:postgis_topology.polygonize(pg_catalog.varchar)": operation84,
      "routine:$extension:postgis_topology.populate_topology_layer()": operation85,
      "routine:$extension:postgis_topology.removeunusedprimitives(pg_catalog.text,$extension:postgis.geometry)":
        operation88,
      "routine:$extension:postgis_topology.renametopogeometrycolumn(pg_catalog.regclass,pg_catalog.name,pg_catalog.name)":
        operation89,
      "routine:$extension:postgis_topology.renametopology(pg_catalog.varchar,pg_catalog.varchar)": operation90,
      "routine:$extension:postgis_topology.st_addedgemodface(pg_catalog.varchar,pg_catalog.int8,pg_catalog.int8,$extension:postgis.geometry)":
        operation91,
      "routine:$extension:postgis_topology.st_addedgenewfaces(pg_catalog.varchar,pg_catalog.int8,pg_catalog.int8,$extension:postgis.geometry)":
        operation92,
      "routine:$extension:postgis_topology.st_addisoedge(pg_catalog.varchar,pg_catalog.int8,pg_catalog.int8,$extension:postgis.geometry)":
        operation93,
      "routine:$extension:postgis_topology.st_addisonode(pg_catalog.varchar,pg_catalog.int8,$extension:postgis.geometry)":
        operation94,
      "routine:$extension:postgis_topology.st_changeedgegeom(pg_catalog.varchar,pg_catalog.int8,$extension:postgis.geometry)":
        operation95,
      "routine:$extension:postgis_topology.st_createtopogeo(pg_catalog.varchar,$extension:postgis.geometry)":
        operation96,
      "routine:$extension:postgis_topology.st_inittopogeo(pg_catalog.varchar)": operation100,
      "routine:$extension:postgis_topology.st_modedgeheal(pg_catalog.varchar,pg_catalog.int8,pg_catalog.int8)":
        operation101,
      "routine:$extension:postgis_topology.st_modedgesplit(pg_catalog.varchar,pg_catalog.int8,$extension:postgis.geometry)":
        operation102,
      "routine:$extension:postgis_topology.st_moveisonode(pg_catalog.varchar,pg_catalog.int8,$extension:postgis.geometry)":
        operation103,
      "routine:$extension:postgis_topology.st_newedgeheal(pg_catalog.varchar,pg_catalog.int8,pg_catalog.int8)":
        operation104,
      "routine:$extension:postgis_topology.st_newedgessplit(pg_catalog.varchar,pg_catalog.int8,$extension:postgis.geometry)":
        operation105,
      "routine:$extension:postgis_topology.st_remedgemodface(pg_catalog.varchar,pg_catalog.int8)": operation106,
      "routine:$extension:postgis_topology.st_remedgenewface(pg_catalog.varchar,pg_catalog.int8)": operation107,
      "routine:$extension:postgis_topology.st_remisonode(pg_catalog.varchar,pg_catalog.int8)": operation108,
      "routine:$extension:postgis_topology.st_removeisoedge(pg_catalog.varchar,pg_catalog.int8)": operation109,
      "routine:$extension:postgis_topology.st_removeisonode(pg_catalog.varchar,pg_catalog.int8)": operation110,
      "routine:$extension:postgis_topology.topogeo_addgeometry(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.float8)":
        operation116,
      "routine:$extension:postgis_topology.topogeo_addlinestring(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.float8)":
        operation117,
      "routine:$extension:postgis_topology.topogeo_addpoint(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.float8)":
        operation118,
      "routine:$extension:postgis_topology.topogeo_addpolygon(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.float8)":
        operation119,
      "routine:$extension:postgis_topology.topogeo_loadgeometry(pg_catalog.varchar,$extension:postgis.geometry,pg_catalog.float8)":
        operation120,
      "routine:$extension:postgis_topology.topogeom_addelement($extension:postgis_topology.topogeometry,$extension:postgis_topology.topoelement)":
        operation121,
      "routine:$extension:postgis_topology.topogeom_addtopogeom($extension:postgis_topology.topogeometry,$extension:postgis_topology.topogeometry)":
        operation122,
      "routine:$extension:postgis_topology.topogeom_remelement($extension:postgis_topology.topogeometry,$extension:postgis_topology.topoelement)":
        operation123,
      "routine:$extension:postgis_topology.totopogeom($extension:postgis.geometry,$extension:postgis_topology.topogeometry,pg_catalog.float8)":
        operation126,
      "routine:$extension:postgis_topology.totopogeom($extension:postgis.geometry,pg_catalog.varchar,pg_catalog.int4,pg_catalog.float8)":
        operation127,
      "routine:$extension:postgis_topology.upgradetopology(pg_catalog.name)": operation128,
      "routine:$extension:postgis_topology.validatetopology(pg_catalog.varchar,$extension:postgis.geometry)":
        operation129,
      "routine:$extension:postgis_topology.validatetopologyrelation(pg_catalog.varchar)": operation131,
    }),
  });
}
export type PostgisTopologyOperatorSession = ReturnType<typeof createSession>;
