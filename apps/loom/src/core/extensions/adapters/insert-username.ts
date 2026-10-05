import { getColumnTable } from "drizzle-orm";
import { getTableConfig, type AnyPgColumn, type PgTable } from "drizzle-orm/pg-core";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { triggerArgument } from "../triggers";

const member = "routine:$extension:insert_username.insert_username()";
const digest = "1e0649029c558b2e3000544c8066e51f12288377fd520226476740e7b0d25c32";
export type InsertUsernameEvent = "insert" | "update";
export interface InsertUsernameTriggerOptions<Table extends PgTable> {
  readonly name: string;
  readonly table: Table;
  /** Native C accepts TEXTOID. Drizzle erases text/varchar identity; SQL type is checked at declaration. */
  readonly column: AnyPgColumn<{ dataType: "string" | "string enum" }>;
  readonly events?: readonly [InsertUsernameEvent, ...InsertUsernameEvent[]];
}
function identifier(value: string): string {
  if (!value || value.includes("\0") || new TextEncoder().encode(value).length > 63)
    throw new Error("Invalid PostgreSQL identifier");
  return `"${value.replaceAll('"', '""')}"`;
}

/** Assigns PostgreSQL current_user on every selected row event, including caller-supplied values. */
export function createInsertUsername_1_0<
  const Descriptor extends ExtensionDescriptor<"insert_username", { version: "1.0"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "insert_username" ||
    descriptor.version !== "1.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("insert_username 1.0 requires its exact verified contract");
  const functionName = `${identifier(descriptor.schema)}.${identifier("insert_username")}`;
  function trigger<Table extends PgTable>(options: InsertUsernameTriggerOptions<Table>) {
    const config = getTableConfig(options.table);
    const schema = config.schema ?? "public";
    if (getColumnTable(options.column) !== options.table)
      throw new Error("insert_username target column must belong to the trigger table");
    if (options.column.getSQLType() !== "text") throw new Error("insert_username target column must be text");
    const selected = options.events ?? ["insert", "update"];
    if (!selected.length || selected.some((event) => event !== "insert" && event !== "update"))
      throw new Error("insert_username trigger requires insert and/or update events");
    const events = (["insert", "update"] as const).filter((event) => selected.includes(event));
    const name = identifier(options.name);
    const table = `${identifier(schema)}.${identifier(config.name)}`;
    const column = options.column.name;
    identifier(column);
    return Object.freeze({
      kind: "trigger",
      extension: Object.freeze({ name: "insert_username", version: "1.0", digest }),
      member,
      name: options.name,
      timing: "before",
      level: "row",
      events: Object.freeze(events),
      table: Object.freeze({ schema, name: config.name }),
      function: Object.freeze({ schema: descriptor.schema, name: "insert_username" }),
      arguments: Object.freeze([column]),
      create: `CREATE TRIGGER ${name} BEFORE ${events.map((event) => event.toUpperCase()).join(" OR ")} ON ${table} FOR EACH ROW EXECUTE FUNCTION ${functionName}(${triggerArgument(column)})`,
      drop: `DROP TRIGGER ${name} ON ${table}`,
    } as const);
  }
  return bindExtension(descriptor, {
    trigger,
    function: Object.freeze({ member, authority: "schema" } as const),
    sql: Object.freeze({ functions: Object.freeze({}), operators: Object.freeze({}) }),
  });
}
