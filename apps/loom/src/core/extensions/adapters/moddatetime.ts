import { getColumnTable } from "drizzle-orm";
import { getTableConfig, type AnyPgColumn, type PgTable } from "drizzle-orm/pg-core";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { triggerArgument } from "../triggers";

const member = "routine:$extension:moddatetime.moddatetime()";
const digest = "bfaa16ea149d74d0f9e6c5a74144a0240ad18e0e02098a5f39f462c942ca68b6";
type TimestampColumn = AnyPgColumn<{ dataType: "object date" | "string timestamp" }>;
export interface ModdatetimeTriggerOptions<Table extends PgTable> {
  readonly name: string;
  readonly table: Table;
  readonly column: TimestampColumn;
}

/** PostgreSQL truncates identifiers above 63 bytes; truncation would change the declared object identity. */
function identifier(value: string): string {
  if (!value || value.includes("\0") || new TextEncoder().encode(value).length > 63)
    throw new Error("Invalid PostgreSQL identifier");
  return `"${value.replaceAll('"', '""')}"`;
}

/** moddatetime is a BEFORE UPDATE ROW trigger callback only; it is never exposed as a scalar SQL or RPC function. */
export function createModdatetime_1_0<
  const Descriptor extends ExtensionDescriptor<"moddatetime", { version: "1.0"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "moddatetime" ||
    descriptor.version !== "1.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("moddatetime 1.0 requires its exact verified contract");
  const functionName = `${identifier(descriptor.schema)}.${identifier("moddatetime")}`;
  /** Sets the column to transaction-start now() on every UPDATE; the C callback rejects INSERT and statement level. */
  function trigger<Table extends PgTable>(options: ModdatetimeTriggerOptions<Table>) {
    const config = getTableConfig(options.table);
    const schema = config.schema ?? "public";
    if (getColumnTable(options.column) !== options.table)
      throw new Error("moddatetime target column must belong to the trigger table");
    // C accepts exactly TIMESTAMPOID or TIMESTAMPTZOID.
    if (!/^timestamp(?: ?\(\d\))?(?: with time zone)?$/.test(options.column.getSQLType()))
      throw new Error("moddatetime target column must be timestamp or timestamptz");
    const name = identifier(options.name);
    const table = `${identifier(schema)}.${identifier(config.name)}`;
    const column = options.column.name;
    identifier(column);
    return Object.freeze({
      kind: "trigger",
      extension: Object.freeze({ name: "moddatetime", version: "1.0", digest }),
      member,
      name: options.name,
      timing: "before",
      level: "row",
      events: Object.freeze(["update"] as const),
      table: Object.freeze({ schema, name: config.name }),
      function: Object.freeze({ schema: descriptor.schema, name: "moddatetime" }),
      arguments: Object.freeze([column]),
      create: `CREATE TRIGGER ${name} BEFORE UPDATE ON ${table} FOR EACH ROW EXECUTE FUNCTION ${functionName}(${triggerArgument(column)})`,
      drop: `DROP TRIGGER ${name} ON ${table}`,
    } as const);
  }
  return bindExtension(descriptor, {
    trigger,
    function: Object.freeze({ member, authority: "schema" } as const),
    sql: Object.freeze({ functions: Object.freeze({}), operators: Object.freeze({}) }),
  });
}
