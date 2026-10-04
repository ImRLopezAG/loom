import { is, sql, type SQL } from "drizzle-orm";
import { PgMaterializedView, PgTable } from "drizzle-orm/pg-core";
import * as v from "valibot";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { createExtensionCodec } from "../codecs";
import { createSqlFunction } from "../sql";

const member = "routine:$extension:tsm_system_time.system_time(pg_catalog.internal)";
/** Milliseconds; native rejects NULL, negative and NaN, and treats Infinity as reading the whole relation. */
const milliseconds = v.pipe(
  v.number(),
  v.check((value) => value >= 0, "Sample time must be a non-negative number"),
);
const millisecondsCodec = createExtensionCodec({
  id: "pg:float8:tablesample-milliseconds:1",
  sqlType: { schema: "pg_catalog", name: "float8" },
  input: milliseconds,
  output: milliseconds,
  transport: "native",
  encode: (value) => (Number.isFinite(value) ? value : "Infinity"),
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

/** Block-level sampling bounded by elapsed reading time; results depend on timing and are never table-live. */
export function createTsmSystemTime_1_0<
  const Descriptor extends ExtensionDescriptor<"tsm_system_time", { version: "1.0"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "tsm_system_time" ||
    descriptor.version !== "1.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== "70720316f9c0607be92e7948af63f27a96da580a8f492ce7a3a7d972b779af1f"
  )
    throw new Error("tsm_system_time 1.0 requires its exact verified contract");
  // TABLESAMPLE grammar takes a qualified method name followed by arguments, which is the checked call shape.
  const method = createSqlFunction({
    schema: descriptor.schema,
    name: "system_time",
    member,
    arguments: [millisecondsCodec] as const,
    result: clauseCodec,
    dependencies: [],
    observability: "external",
    authority: "query",
  });
  /** `relation TABLESAMPLE schema.system_time(ms)` as a FROM source; select columns of the same relation. */
  function systemTime(relation: SampledRelation, ms: number): SQL<unknown> {
    if (!is(relation, PgTable) && !is(relation, PgMaterializedView))
      throw new Error("TABLESAMPLE requires a table or materialized view");
    return sql`${relation} tablesample ${method(v.parse(milliseconds, ms))}`;
  }
  const sampling = Object.freeze({
    member,
    method: "system_time",
    argument: Object.freeze({ name: "milliseconds", type: "pg_catalog.float8", nullable: false, minimum: 0 }),
    repeatable: false,
    relations: Object.freeze(["table", "partitioned table", "materialized view"] as const),
    observability: "external",
  } as const);
  return bindExtension(descriptor, {
    sampling,
    systemTime,
    sample: systemTime,
    sql: Object.freeze({
      functions: Object.freeze({}),
      operators: Object.freeze({}),
      sampling: Object.freeze({ system_time: systemTime }),
    }),
  });
}
