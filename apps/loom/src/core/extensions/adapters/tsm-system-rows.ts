import { is, sql, type SQL } from "drizzle-orm";
import { PgMaterializedView, PgTable } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { createExtensionCodec } from "../codecs";
import { createSqlFunction } from "../sql";

const member = "routine:$extension:tsm_system_rows.system_rows(pg_catalog.internal)";
const maximumRows = 9223372036854775807n;
const rows = v.union([
  v.pipe(v.number(), v.safeInteger(), v.minValue(0)),
  v.pipe(v.bigint(), v.minValue(0n), v.maxValue(maximumRows)),
]);
/** The handler declares one int8 parameter; NULL and negative sizes are native errors, so neither is admitted. */
const rowsCodec = createExtensionCodec({
  id: "pg:int8:tablesample-rows:1",
  sqlType: { schema: "pg_catalog", name: "int8" },
  input: rows,
  output: rows,
  transport: "text",
  encode: (value) => value.toString(),
  decode: () => {
    throw new Error("TABLESAMPLE arguments are inputs, not results");
  },
});
const clauseCodec = createExtensionCodec({
  id: "pg:tsm_handler:tablesample-clause:1",
  input: v.never(),
  output: v.never(),
  transport: "native",
  encode: () => {
    throw new Error("A TABLESAMPLE clause is not a parameter");
  },
  decode: () => {
    throw new Error("A TABLESAMPLE clause is a relation source, not a selectable value");
  },
});

/** Native TABLESAMPLE accepts only plain, partitioned, and materialized-view relations; views are rejected. */
export type SampledRelation = PgTable | PgMaterializedView;
export type SampleRows = v.InferInput<typeof rows>;

/** Block-level sampling of at most `rows` rows; selected rows vary per scan, so results are never table-live. */
export function createTsmSystemRows_1_0<
  const Descriptor extends ExtensionDescriptor<"tsm_system_rows", { version: "1.0"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "tsm_system_rows" ||
    descriptor.version !== "1.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== "cb606ea0ec43b299ed4776aaeb12126165f751dbf9c5d40a974df6a8a7067eec"
  )
    throw new Error("tsm_system_rows 1.0 requires its exact verified contract");
  // TABLESAMPLE grammar takes a qualified method name followed by arguments, which is the checked call shape.
  const method = createSqlFunction({
    schema: descriptor.schema,
    name: "system_rows",
    member,
    arguments: [rowsCodec] as const,
    result: clauseCodec,
    dependencies: [],
    observability: "external",
    authority: "query",
  });
  /** `relation TABLESAMPLE schema.system_rows(rows)` as a FROM source; select columns of the same relation. */
  function systemRows(relation: SampledRelation, size: SampleRows): SQL<unknown> {
    if (!is(relation, PgTable) && !is(relation, PgMaterializedView))
      throw new Error("TABLESAMPLE requires a table or materialized view");
    return sql`${relation} tablesample ${method(v.parse(rows, size))}`;
  }
  const sampling = Object.freeze({
    member,
    method: "system_rows",
    argument: Object.freeze({
      name: "rows",
      type: "pg_catalog.int8",
      nullable: false,
      minimum: 0n,
      maximum: maximumRows,
    }),
    repeatable: false,
    relations: Object.freeze(["table", "partitioned table", "materialized view"] as const),
    observability: "external",
  } as const);
  return bindExtension(descriptor, {
    sampling,
    systemRows,
    sample: systemRows,
    sql: Object.freeze({
      functions: Object.freeze({}),
      operators: Object.freeze({}),
      sampling: Object.freeze({ system_rows: systemRows }),
    }),
  });
}
