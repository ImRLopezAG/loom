import { getColumnTable } from "drizzle-orm";
import { getTableConfig, type AnyPgColumn, type PgTable } from "drizzle-orm/pg-core";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { triggerArgument } from "../triggers";

const member = "routine:$extension:autoinc.autoinc()";
const digest = "bcd5ce0898658378ee20de54d2ca173811612f5d2c41c14345ed3eb9473403ee";
type Int4Column = AnyPgColumn<{ dataType: "number int32" }>;
export type AutoincEvent = "insert" | "update";
export interface AutoincColumn {
  readonly column: Int4Column;
  /** Passed to nextval(text): emitted as a quoted, optionally schema-qualified name. */
  readonly sequence: { readonly schema?: string; readonly name: string };
}
export interface AutoincTriggerOptions<Table extends PgTable> {
  readonly name: string;
  readonly table: Table;
  /** Defaults to insert. autoinc assigns nextval only when the column is NULL or 0. */
  readonly events?: readonly [AutoincEvent, ...AutoincEvent[]];
  readonly columns: readonly [AutoincColumn, ...AutoincColumn[]];
}

/** PostgreSQL truncates identifiers above 63 bytes; truncation would change the declared object identity. */
function identifier(value: string): string {
  if (!value || value.includes("\0") || new TextEncoder().encode(value).length > 63)
    throw new Error("Invalid PostgreSQL identifier");
  return `"${value.replaceAll('"', '""')}"`;
}

/** autoinc is a BEFORE ROW trigger callback only; it is never exposed as a scalar SQL or RPC function. */
export function createAutoinc_1_0<
  const Descriptor extends ExtensionDescriptor<"autoinc", { version: "1.0"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "autoinc" ||
    descriptor.version !== "1.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("autoinc 1.0 requires its exact verified contract");
  const functionName = `${identifier(descriptor.schema)}.${identifier("autoinc")}`;
  function trigger<Table extends PgTable>(options: AutoincTriggerOptions<Table>) {
    const config = getTableConfig(options.table);
    const schema = config.schema ?? "public";
    const events = [...new Set(options.events ?? ["insert"])];
    if (!events.length || events.some((event) => event !== "insert" && event !== "update"))
      throw new Error("autoinc trigger requires insert and/or update events");
    if (!options.columns.length) throw new Error("autoinc requires at least one column");
    const names = new Set<string>();
    const values = options.columns.flatMap(({ column, sequence }) => {
      if (getColumnTable(column) !== options.table)
        throw new Error("autoinc target column must belong to the trigger table");
      // C checks INT4OID exactly; serial is int4 in the catalogue.
      if (column.getSQLType() !== "integer" && column.getSQLType() !== "serial")
        throw new Error("autoinc target column must be int4");
      if (names.has(column.name)) throw new Error("autoinc target columns must be distinct");
      names.add(column.name);
      const qualified = sequence.schema === undefined ? "" : `${identifier(sequence.schema)}.`;
      return [column.name, `${qualified}${identifier(sequence.name)}`];
    });
    const name = identifier(options.name);
    const table = `${identifier(schema)}.${identifier(config.name)}`;
    const ordered = (["insert", "update"] as const).filter((event) => events.includes(event));
    return Object.freeze({
      kind: "trigger",
      extension: Object.freeze({ name: "autoinc", version: "1.0", digest }),
      member,
      name: options.name,
      timing: "before",
      level: "row",
      events: Object.freeze(ordered),
      table: Object.freeze({ schema, name: config.name }),
      function: Object.freeze({ schema: descriptor.schema, name: "autoinc" }),
      arguments: Object.freeze(values),
      create: `CREATE TRIGGER ${name} BEFORE ${ordered.map((event) => event.toUpperCase()).join(" OR ")} ON ${table} FOR EACH ROW EXECUTE FUNCTION ${functionName}(${values.map(triggerArgument).join(", ")})`,
      drop: `DROP TRIGGER ${name} ON ${table}`,
    } as const);
  }
  return bindExtension(descriptor, {
    trigger,
    function: Object.freeze({ member, authority: "schema" } as const),
    sql: Object.freeze({ functions: Object.freeze({}), operators: Object.freeze({}) }),
  });
}
