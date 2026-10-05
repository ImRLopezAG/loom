import { getTableConfig, type PgTable } from "drizzle-orm/pg-core";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { triggerArgument } from "../triggers";

const member = "routine:$extension:tcn.triggered_change_notification()";
const digest = "9e2c3a247e11851d4d598bef9c62c5a7e26ba585089bce5d7a71e2c2db548a8a";
export type TcnEvent = "insert" | "update" | "delete";
export interface TcnTriggerOptions<Table extends PgTable> {
  readonly name: string;
  readonly table: Table;
  readonly channel?: string;
  readonly events?: readonly [TcnEvent, ...TcnEvent[]];
}
function identifier(value: string): string {
  if (!value || value.includes("\0") || new TextEncoder().encode(value).length > 63)
    throw new Error("Invalid PostgreSQL identifier");
  return `"${value.replaceAll('"', '""')}"`;
}

/** Declares the native AFTER ROW notification callback on a table with a declared primary key. */
export function createTcn_1_0<const Descriptor extends ExtensionDescriptor<"tcn", { version: "1.0"; schema: string }>>(
  descriptor: Descriptor,
) {
  if (
    descriptor.name !== "tcn" ||
    descriptor.version !== "1.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("tcn 1.0 requires its exact verified contract");
  const functionName = `${identifier(descriptor.schema)}.${identifier("triggered_change_notification")}`;
  function trigger<Table extends PgTable>(options: TcnTriggerOptions<Table>) {
    const config = getTableConfig(options.table);
    const schema = config.schema ?? "public";
    if (!config.columns.some((column) => column.primary) && !config.primaryKeys.length)
      throw new Error("tcn trigger requires a declared primary key");
    const selected = options.events ?? ["insert", "update", "delete"];
    if (!selected.length || selected.some((event) => !["insert", "update", "delete"].includes(event)))
      throw new Error("tcn trigger requires insert, update and/or delete events");
    const events = (["insert", "update", "delete"] as const).filter((event) => selected.includes(event));
    const args = options.channel === undefined ? [] : [options.channel];
    if (options.channel !== undefined) identifier(options.channel);
    const name = identifier(options.name);
    const table = `${identifier(schema)}.${identifier(config.name)}`;
    return Object.freeze({
      kind: "trigger",
      extension: Object.freeze({ name: "tcn", version: "1.0", digest }),
      member,
      name: options.name,
      timing: "after",
      level: "row",
      events: Object.freeze(events),
      table: Object.freeze({ schema, name: config.name }),
      function: Object.freeze({ schema: descriptor.schema, name: "triggered_change_notification" }),
      arguments: Object.freeze(args),
      create: `CREATE TRIGGER ${name} AFTER ${events.map((event) => event.toUpperCase()).join(" OR ")} ON ${table} FOR EACH ROW EXECUTE FUNCTION ${functionName}(${args.map(triggerArgument).join(", ")})`,
      drop: `DROP TRIGGER ${name} ON ${table}`,
    } as const);
  }
  return bindExtension(descriptor, {
    trigger,
    function: Object.freeze({ member, authority: "schema" } as const),
    notifications: Object.freeze({
      authority: "dedicated-session",
      observability: "session",
      automaticLive: false,
    } as const),
    sql: Object.freeze({ functions: Object.freeze({}), operators: Object.freeze({}) }),
  });
}
