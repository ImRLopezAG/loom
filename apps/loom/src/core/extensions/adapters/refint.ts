import { getColumnTable } from "drizzle-orm";
import { getTableConfig, type AnyPgColumn, type PgTable } from "drizzle-orm/pg-core";
import { bindExtension, type ExtensionDescriptor } from "../bindings";
import { triggerArgument } from "../triggers";

const digest = "689cb4ce75e39aea52f0b19a522b1b35bb743a8fca286195e9fa98894fa49011";
type KeyColumns = readonly [AnyPgColumn, ...AnyPgColumn[]];
/** Pair key values with the same public data type; native '=' resolution remains PostgreSQL's authority. */
type MatchingColumns<Columns extends KeyColumns> = {
  readonly [Key in keyof Columns]: Columns[Key] extends AnyPgColumn
    ? AnyPgColumn<{ data: Columns[Key]["_"]["data"] }>
    : never;
};
export type RefintAction = "restrict" | "cascade" | "setnull";
export interface RefintReference<Columns extends KeyColumns> {
  readonly table: PgTable;
  readonly columns: MatchingColumns<Columns>;
}
export interface RefintPrimaryKeyOptions<Table extends PgTable, Columns extends KeyColumns> {
  readonly name: string;
  readonly table: Table;
  readonly columns: Columns;
  readonly references: RefintReference<NoInfer<Columns>>;
  readonly events?: readonly ["insert" | "update", ...("insert" | "update")[]];
}
export interface RefintForeignKeyOptions<Table extends PgTable, Columns extends KeyColumns> {
  readonly name: string;
  readonly table: Table;
  readonly columns: Columns;
  readonly references: readonly [RefintReference<NoInfer<Columns>>, ...RefintReference<NoInfer<Columns>>[]];
  readonly action: RefintAction;
  readonly events?: readonly ["update" | "delete", ...("update" | "delete")[]];
}
function identifier(value: string): string {
  if (!value || value.includes("\0") || new TextEncoder().encode(value).length > 63)
    throw new Error("Invalid PostgreSQL identifier");
  return `"${value.replaceAll('"', '""')}"`;
}
function placement(table: PgTable) {
  const config = getTableConfig(table);
  return Object.freeze({ schema: config.schema ?? "public", name: config.name });
}
function relation(table: PgTable) {
  const value = placement(table);
  return `${identifier(value.schema)}.${identifier(value.name)}`;
}
function columns(table: PgTable, values: readonly AnyPgColumn[]) {
  if (!values.length) throw new Error("refint requires at least one key column");
  const names = new Set<string>();
  return values.map((column) => {
    if (getColumnTable(column) !== table) throw new Error("refint key column must belong to its declared table");
    identifier(column.name);
    if (names.has(column.name)) throw new Error("refint key columns must be distinct");
    names.add(column.name);
    return column.name;
  });
}

/** Native referential checks are AFTER ROW trigger callbacks; never scalar SQL or RPC helpers. */
export function createRefint_1_0<
  const Descriptor extends ExtensionDescriptor<"refint", { version: "1.0"; schema: string }>,
>(descriptor: Descriptor) {
  if (
    descriptor.name !== "refint" ||
    descriptor.version !== "1.0" ||
    descriptor.apiSupport.status !== "verified" ||
    descriptor.apiSupport.digest !== digest
  )
    throw new Error("refint 1.0 requires its exact verified contract");
  identifier(descriptor.schema);
  function declaration<
    Table extends PgTable,
    const Callback extends "check_primary_key" | "check_foreign_key",
    Event extends "insert" | "update" | "delete",
  >(
    name: string,
    table: Table,
    callback: Callback,
    allowed: readonly Event[],
    selected: readonly Event[],
    args: readonly string[],
  ) {
    if (!selected.length || selected.some((event) => !allowed.includes(event)))
      throw new Error(`refint ${callback} requires ${allowed.join(" and/or ")} events`);
    const events = allowed.filter((event) => selected.includes(event));
    const quotedName = identifier(name);
    const tableName = relation(table);
    return Object.freeze({
      kind: "trigger",
      extension: Object.freeze({ name: "refint", version: "1.0", digest }),
      member: `routine:$extension:refint.${callback}()` as const,
      name,
      timing: "after",
      level: "row",
      events: Object.freeze(events),
      table: placement(table),
      function: Object.freeze({ schema: descriptor.schema, name: callback }),
      arguments: Object.freeze([...args]),
      create: `CREATE TRIGGER ${quotedName} AFTER ${events.map((event) => event.toUpperCase()).join(" OR ")} ON ${tableName} FOR EACH ROW EXECUTE FUNCTION ${identifier(descriptor.schema)}.${identifier(callback)}(${args.map(triggerArgument).join(", ")})`,
      drop: `DROP TRIGGER ${quotedName} ON ${tableName}`,
    } as const);
  }
  function checkPrimaryKey<Table extends PgTable, const Columns extends KeyColumns>(
    options: RefintPrimaryKeyOptions<Table, Columns>,
  ) {
    const local = columns(options.table, options.columns);
    const remote = columns(options.references.table, options.references.columns);
    if (local.length !== remote.length) throw new Error("refint key column counts must match");
    return declaration(
      options.name,
      options.table,
      "check_primary_key",
      ["insert", "update"] as const,
      options.events ?? ["insert", "update"],
      [...local, relation(options.references.table), ...remote.map(identifier)],
    );
  }
  function checkForeignKey<Table extends PgTable, const Columns extends KeyColumns>(
    options: RefintForeignKeyOptions<Table, Columns>,
  ) {
    const local = columns(options.table, options.columns);
    if (!["restrict", "cascade", "setnull"].includes(options.action)) throw new Error("Invalid refint action");
    if (!options.references.length) throw new Error("refint requires at least one referencing table");
    const remote = options.references.flatMap((reference) => {
      const names = columns(reference.table, reference.columns);
      if (names.length !== local.length) throw new Error("refint key column counts must match");
      return [relation(reference.table), ...names.map(identifier)];
    });
    return declaration(
      options.name,
      options.table,
      "check_foreign_key",
      ["update", "delete"] as const,
      options.events ?? ["update", "delete"],
      [String(options.references.length), options.action, ...local, ...remote],
    );
  }
  return bindExtension(descriptor, {
    checkPrimaryKey,
    checkForeignKey,
    functions: Object.freeze({
      check_primary_key: Object.freeze({
        member: "routine:$extension:refint.check_primary_key()",
        authority: "schema",
      } as const),
      check_foreign_key: Object.freeze({
        member: "routine:$extension:refint.check_foreign_key()",
        authority: "schema",
      } as const),
    }),
    sql: Object.freeze({ functions: Object.freeze({}), operators: Object.freeze({}) }),
  });
}
